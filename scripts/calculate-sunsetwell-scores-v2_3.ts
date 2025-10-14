#!/usr/bin/env tsx
/**
 * SunsetWell Score v2.3 — Predictive PHI (0–100 safer = 100 - predicted harm)
 * Uses only available DB predictors; weights learned from PHI.
 * Inputs:
 *  - analysis/scoring/v2_3_weights.json
 *  - Supabase resources predictors
 * Output CSV:
 *  - data/cms/processed/sunsetwell-scores-v2_3.csv
 */
import fs from 'fs';
import { stringify } from 'csv-stringify/sync';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { EXTRA_FEATURE_KEYS, getFeatureValue, loadExtraFacilityFeatures } from './scoring/feature-utils';
dotenv.config({ path: '.env.local' });

function clamp01(x:number){ return Math.max(0, Math.min(1, x)); }
async function main(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false } });

  type Config = {
    predictors: string[];
    weights: number[];
    intercept: number;
    slope: number;
    scaling: { p5: number[]; p95: number[] };
    impute?: Record<string, number>;
    calibration?: { comp_p5: number; comp_p95: number; phi_p5?: number; phi_p95?: number };
  };
  const cfg = JSON.parse(fs.readFileSync('analysis/scoring/v2_3_weights.json','utf-8')) as Config;
  const feats = cfg.predictors; const w = cfg.weights; const a=cfg.intercept; const b=cfg.slope; const p5=cfg.scaling.p5; const p95=cfg.scaling.p95; const impute = cfg.impute ?? {};
  if (p5.length !== feats.length || p95.length !== feats.length) {
    throw new Error('Scaling configuration mismatch with predictors list.');
  }
  const phiP5 = cfg.calibration?.phi_p5 ?? 0.2;
  const phiP95 = cfg.calibration?.phi_p95 ?? 0.8;
  const phiRange = phiP95 > phiP5 ? phiP95 - phiP5 : 1;

  const extraFeatures = loadExtraFacilityFeatures();

  const extraKeys = new Set(EXTRA_FEATURE_KEYS);

  // Paginated fetch
  const rows: any[] = [];
  const pageSize = 1000; let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('resources')
      .select(['facility_id','states',...feats.filter((k)=>!extraKeys.has(k))].join(','))
      .eq('provider_type','nursing_home')
      .order('facility_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  const out: Array<{ facility_id:string; overall_score:number; overall_percentile:number; calculation_date:string; version:string }>=[];
  const today = new Date().toISOString().slice(0,10);

  // Build state groups
  const byState = new Map<string, number[]>();
  const preds: Array<{ ccn:string; st:string; score:number }>=[];
  for (const r of rows){
    const ccn = String(r.facility_id||'').trim(); if (!ccn) continue;
    const st = Array.isArray(r.states) && r.states.length ? String(r.states[0]).toUpperCase() : '';
    const extra = extraFeatures.get(ccn);
    // Normalize predictors to [0,1]
    const x: number[] = [];
    let ok = true;
    for (let j=0;j<feats.length;j++){
      const feat = feats[j];
      let val = getFeatureValue(r as Record<string, unknown>, extra, feat);
      if (val === null) {
        const fill = impute[feat];
        if (fill === undefined) { ok=false; break; }
        val = fill;
      }
      const lo = p5[j], hi = p95[j];
      const z = hi>lo ? (val - lo)/(hi - lo) : 0.5;
      x.push(clamp01(z));
    }
    if (!ok) continue;
    const comp = x.reduce((s,v,j)=> s + v*w[j], 0);
    const phiHat = a + b*comp;
    const norm = clamp01((phiP95 - phiHat) / phiRange);
    const score = Math.max(0, Math.min(100, norm * 100));
    preds.push({ ccn, st: st&&st.length===2?st:'ALL', score });
  }
  // Percentiles per state
  for (const p of preds){
    if (!byState.has(p.st)) byState.set(p.st, []);
    byState.get(p.st)!.push(p.score);
  }
  for (const [st, arr] of byState){ arr.sort((a,b)=>a-b); }

  for (const p of preds){
    const arr = byState.get(p.st)!;
    const idx = arr.findIndex(v=>v>=p.score); const i = idx<0? arr.length-1 : idx;
    const pct = arr.length>1 ? Math.round((i/(arr.length-1))*100) : 50;
    out.push({ facility_id: p.ccn, overall_score: Number(p.score.toFixed(2)), overall_percentile: pct, calculation_date: today, version: 'v2.3' });
  }

  const outPath = 'data/cms/processed/sunsetwell-scores-v2_3.csv';
  fs.writeFileSync(outPath, stringify(out, { header: true }));
  console.log(`✅ Wrote ${out.length} rows to ${outPath}`);
}

main().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1); });
