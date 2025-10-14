#!/usr/bin/env tsx
/**
 * Train v2.3 Predictive PHI weights from available DB predictors
 * Predictors (resources): health_inspection_rating, staffing_rating,
 * total_nurse_hours_per_resident_per_day, rn_hours_per_resident_per_day,
 * total_nurse_staff_turnover, rn_turnover, quality_measure_rating
 * Target: analysis/scoring/phi_labels.csv (phi 0–100; higher = worse)
 * Output: analysis/scoring/v2_3_weights.json
 */
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getFeatureValue, loadExtraFacilityFeatures, EXTRA_FEATURE_KEYS } from './scoring/feature-utils';

dotenv.config({ path: '.env.local' });

function readCSV(path: string): any[] { const s=fs.readFileSync(path,'utf-8'); return parse(s,{columns:true,skip_empty_lines:true,trim:true}); }
function projectToSimplex(w: number[]): number[] { const n=w.length,u=[...w].sort((a,b)=>b-a);let cssv=0,rho=-1;for(let i=0;i<n;i++){cssv+=u[i];const t=(cssv-1)/(i+1);if(u[i]-t>0)rho=i;}const theta=(u.slice(0,rho+1).reduce((s,v)=>s+v,0)-1)/(rho+1);return w.map(v=>Math.max(0,v-theta)); }
function standardize(y: number[]): { y:number[]; mean:number; std:number } { const n=y.length; const mean=y.reduce((s,v)=>s+v,0)/n; const varr=n>1? y.reduce((s,v)=>s+Math.pow(v-mean,2),0)/(n-1):0; const std=Math.sqrt(Math.max(1e-12,varr)); return { y: y.map(v=>(v-mean)/std), mean, std }; }

async function main() {
  // Load PHI labels
  const phiRows = readCSV('analysis/scoring/phi_labels.csv');
  const phiBy = new Map<string, number>(); phiRows.forEach(r=>{ const c=String(r['facility_id']).trim(); const v=Number(r['phi']); if(c && Number.isFinite(v)) phiBy.set(c,v); });
  // Fetch predictors from Supabase
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession:false, autoRefreshToken:false } });
  // Paginated fetch to avoid default 1000 limit
  const baseFeats = [
    'health_inspection_rating',
    'staffing_rating',
    'quality_measure_rating',
    'total_nurse_hours_per_resident_per_day',
    'rn_hours_per_resident_per_day',
    'lpn_hours_per_resident_per_day',
    'cna_hours_per_resident_per_day',
    'weekend_nurse_hours_per_resident_per_day',
    'weekend_rn_hours_per_resident_per_day',
    'total_nurse_staff_turnover',
    'rn_turnover',
    'number_of_facility_reported_incidents',
    'number_of_substantiated_complaints',
    'number_of_certified_beds',
  ];
  const rows: any[] = [];
  const pageSize = 1000; let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('resources')
      .select(['facility_id', ...baseFeats].join(','))
      .eq('provider_type','nursing_home')
      .order('facility_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  const totalRows = rows.length || 1;
  const extraFeatures = loadExtraFacilityFeatures();

  const quantile = (sorted: number[], p: number): number => {
    if (sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0];
    const r = (sorted.length - 1) * p;
    const lo = Math.floor(r);
    const hi = Math.ceil(r);
    const w = r - lo;
    return sorted[lo] * (1 - w) + sorted[hi] * w;
  };

  const extraStatsKeys = EXTRA_FEATURE_KEYS;

  const featureOrder = [...baseFeats, ...extraStatsKeys];
  const stats = new Map<string, { values: number[]; missing: number }>();
  for (const key of featureOrder) {
    stats.set(key, { values: [], missing: 0 });
  }

  for (const row of rows) {
    const ccn = String(row.facility_id || '').trim();
    const extra = extraFeatures.get(ccn);
    for (const key of featureOrder) {
      const stat = stats.get(key)!;
      const val = getFeatureValue(row as Record<string, unknown>, extra, key);
      if (val === null) stat.missing += 1;
      else stat.values.push(val);
    }
  }

  const feats: string[] = [];
  const impute: Record<string, number> = {};
  const p5: number[] = [];
  const p95: number[] = [];
  for (const key of featureOrder) {
    const stat = stats.get(key)!;
    const missingFrac = stat.missing / totalRows;
    const usable = stat.values.length;
    if (missingFrac > 0.1 || usable === 0) {
      if (missingFrac > 0.1) {
        console.warn(`🛑 Dropping predictor ${key} (missing ${(missingFrac*100).toFixed(2)}%)`);
      }
      continue;
    }
    const sorted = stat.values.slice().sort((a, b) => a - b);
    const median = quantile(sorted, 0.5);
    const p5v = quantile(sorted, 0.05);
    const p95v = quantile(sorted, 0.95);
    feats.push(key);
    impute[key] = median;
    p5.push(p5v);
    p95.push(p95v);
  }
  if (feats.length === 0) {
    throw new Error('No predictors met completeness thresholds for v2.3 training.');
  }

  // Build X and y using imputation
  const X: number[][] = [];
  const y: number[] = [];
  for (const row of rows) {
    const ccn = String((row as Record<string, unknown>).facility_id || '').trim();
    const phi = phiBy.get(ccn);
    if (!Number.isFinite(phi)) continue;
    const extra = extraFeatures.get(ccn);
    const vec: number[] = [];
    let skip = false;
    for (let j = 0; j < feats.length; j++) {
      const key = feats[j];
      let val = getFeatureValue(row as Record<string, unknown>, extra, key);
      if (val === null) {
        if (impute[key] === undefined) { skip = true; break; }
        val = impute[key];
      }
      vec.push(val);
    }
    if (skip) continue;
    X.push(vec);
    y.push((phi as number) / 100);
  }
  if (X.length < 1000) console.warn('⚠️ Small sample for training:', X.length);

  const Xn = X.map(row => row.map((v, j) => {
    const lo = p5[j];
    const hi = p95[j];
    if (!(Number.isFinite(lo) && Number.isFinite(hi)) || hi <= lo) return 0.5;
    const z = (v - lo) / (hi - lo);
    return Math.max(0, Math.min(1, z));
  }));

  // Target standardization (higher=more harm)
  const zh = standardize(y.map(v=>v)); // y already 0..1

  // Optimize weights on training set with regularization toward prior (equal weights here)
  const p = feats.length;
  let w = projectToSimplex(Array(p).fill(1/p));
  const iters = Number(process.env.V23_ITERS || '800');
  const lr = Number(process.env.V23_LR || '0.3');
  const lambda = Number(process.env.V23_LAMBDA || '0.1');
  const prior = w.slice();
  for (let t=0;t<iters;t++) {
    const Xw = Xn.map(r => r.reduce((s,v,j)=> s + v*w[j], 0));
    const r = zh.y.map((zi,i)=> zi - Xw[i]);
    const g = new Array(p).fill(0);
    for (let j=0;j<p;j++) {
      let s=0; for (let i=0;i<Xn.length;i++) s += -2 * Xn[i][j] * r[i];
      s += 2 * lambda * (w[j] - prior[j]);
      g[j] = s / Xn.length;
    }
    const wNew = w.map((wj,j)=> wj - lr * g[j]);
    w = projectToSimplex(wNew);
  }
  // Movement cap
  const cap = Number(process.env.V23_MAX_DELTA || '0.25');
  const wCap = projectToSimplex(prior.map((pv,j)=> (1-cap)*pv + cap*w[j]));

  // Calibrate linear mapping y ≈ a + b * (Xn·w)
  const comp = Xn.map(r => r.reduce((s,v,j)=> s + v*wCap[j], 0));
  const compSorted = comp.slice().sort((a,b)=>a-b);
  const compP5 = quantile(compSorted, 0.05);
  const compP95 = quantile(compSorted, 0.95);
  const phiSorted = y.slice().sort((a,b)=>a-b);
  const phiP5 = quantile(phiSorted, 0.05);
  const phiP95 = quantile(phiSorted, 0.95);
  const n = comp.length; const mx = comp.reduce((s,v)=>s+v,0)/n; const my = y.reduce((s,v)=>s+v,0)/n;
  let cov=0, vx=0; for (let i=0;i<n;i++){ const dx=comp[i]-mx; cov+=dx*(y[i]-my); vx+=dx*dx; }
  const b = vx>0 ? cov/vx : 0; const a = my - b*mx;

  const out = {
    predictors: feats,
    weights: wCap.map(v => Number(v.toFixed(6))),
    intercept: Number(a.toFixed(6)),
    slope: Number(b.toFixed(6)),
    scaling: { p5, p95 },
    impute,
    calibration: { comp_p5: compP5, comp_p95: compP95, phi_p5: phiP5, phi_p95: phiP95 },
  };
  fs.mkdirSync('analysis/scoring', { recursive: true });
  fs.writeFileSync('analysis/scoring/v2_3_weights.json', JSON.stringify(out, null, 2));
  console.log('✅ Wrote analysis/scoring/v2_3_weights.json');
}

main().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1); });
