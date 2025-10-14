#!/usr/bin/env tsx
/**
 * Learn v2.2 weights empirically against harmful event proxies
 * Targets: substantiated complaints and facility-reported incidents per 100 certified beds (inverted)
 * Features: v2.2 sub-scores (MDS harm codes scaled/inverted, deficiency severity & IJ, penalties CMP)
 * Constraints: weights >= 0, sum to 1; regularization toward prior v2.2 weights; movement cap
 * Output: analysis/scoring/v2_2_weights.json
 */
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

function readCSV(path: string): any[] {
  if (!fs.existsSync(path)) return [];
  const s = fs.readFileSync(path, 'utf-8');
  return parse(s, { columns: true, skip_empty_lines: true, trim: true });
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const rank = (sorted.length - 1) * q;
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  const w = rank - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

function scaleInvertByBounds(value: number, p5: number, p95: number): number {
  if (!Number.isFinite(value)) return 0.5;
  if (p95 <= p5) return 0.5;
  const z = (value - p5) / (p95 - p5);
  const x = Math.max(0, Math.min(1, z));
  return Math.max(0, Math.min(1, 1 - x)); // 0..1
}

function projectToSimplex(w: number[]): number[] {
  const n = w.length;
  const u = [...w].sort((a, b) => b - a);
  let cssv = 0, rho = -1;
  for (let i = 0; i < n; i++) { cssv += u[i]; const t = (cssv - 1) / (i + 1); if (u[i] - t > 0) rho = i; }
  const theta = (u.slice(0, rho + 1).reduce((s, v) => s + v, 0) - 1) / (rho + 1);
  return w.map(v => Math.max(0, v - theta));
}

function standardize(y: number[]): { y: number[]; mean: number; std: number } {
  const n = y.length; const mean = y.reduce((s,v)=>s+v,0)/n; const varr = n>1? y.reduce((s,v)=>s+Math.pow(v-mean,2),0)/(n-1):0; const std = Math.sqrt(Math.max(1e-12, varr));
  return { y: y.map(v => (v - mean)/std), mean, std };
}

async function main() {
  // Inputs
  const mds = readCSV('data/cms/processed/quality-metrics-processed.csv');
  const defs = readCSV('data/cms/processed/deficiencies-processed.csv');
  const pens = readCSV('data/cms/processed/penalties-processed.csv');
  if (mds.length === 0) { console.error('Missing processed MDS metrics'); process.exit(1); }

  // Harm codes and prior weights (component-level)
  const priorComponents = { wMDS: 0.70, wDEF: 0.20, wPEN: 0.10, wDEF_SEV: 0.7, wDEF_IJ: 0.3 };
  const mdsCodes: Record<string, number> = { '410':0.20, '479':0.20, '451':0.15, '430':0.10, '404':0.10, '434':0.10, '406':0.05, '480':0.10 };

  // Aggregate MDS
  const codeVals: Record<string, number[]> = {};
  const mdsByCCN = new Map<string, Record<string, number>>();
  for (const row of mds) {
    const ccn = String(row['provider_id']||'').trim();
    const code = String(row['measure_code']||'').trim();
    if (!ccn || !(code in mdsCodes)) continue;
    const score = Number(row['score']||''); if (!Number.isFinite(score)) continue;
    if (!mdsByCCN.has(ccn)) mdsByCCN.set(ccn, {});
    mdsByCCN.get(ccn)![code] = score;
    (codeVals[code] ||= []).push(score);
  }
  // Bounds for codes
  const bounds: Record<string, { p5:number; p95:number }> = {};
  for (const [code, arr] of Object.entries(codeVals)) {
    const sorted = arr.slice().sort((a,b)=>a-b);
    bounds[code] = { p5: percentile(sorted, 0.05), p95: percentile(sorted, 0.95) };
  }

  // Deficiency sev and IJ per CCN
  const sevBy = new Map<string, number>();
  const ijBy = new Map<string, number>();
  const wt = (sev: string): number => {
    const c = (sev||'').toUpperCase().trim(); if (!c) return 0;
    if ('ABC'.includes(c)) return 1; if ('DEF'.includes(c)) return 2; if ('GHI'.includes(c)) return 4; return 0;
  };
  for (const r of defs) {
    const ccn = String(r['provider_id']||'').trim(); if (!ccn) continue;
    const sev = String(r['scope_severity_code']||'');
    sevBy.set(ccn, (sevBy.get(ccn)||0) + wt(sev));
    if (sev && 'JKL'.includes(sev.toUpperCase()[0])) ijBy.set(ccn, (ijBy.get(ccn)||0) + 1);
  }
  const sevVals: number[] = []; const ijVals: number[] = [];
  for (const ccn of new Set([...sevBy.keys(), ...ijBy.keys()])) { sevVals.push(sevBy.get(ccn)||0); ijVals.push(ijBy.get(ccn)||0); }
  sevVals.sort((a,b)=>a-b); ijVals.sort((a,b)=>a-b);
  const sevP5=percentile(sevVals,0.05), sevP95=percentile(sevVals,0.95);
  const ijP5=percentile(ijVals,0.05), ijP95=percentile(ijVals,0.95);

  // Penalties CMP
  const cmpBy = new Map<string, number>();
  for (const r of pens) {
    const ccn = String(r['provider_id']||'').trim(); if (!ccn) continue;
    const amt = Number(r['fine_amount']||''); if (!Number.isFinite(amt)) continue;
    cmpBy.set(ccn, (cmpBy.get(ccn)||0) + amt);
  }
  const cmpVals = [...cmpBy.values()].slice().sort((a,b)=>a-b);
  const cmpP5=percentile(cmpVals,0.05), cmpP95=percentile(cmpVals,0.95);

  // Build feature matrix per CCN
  const ccns = Array.from(new Set([ ...mdsByCCN.keys(), ...sevBy.keys(), ...ijBy.keys(), ...cmpBy.keys() ]));
  const features: string[] = [ ...Object.keys(mdsCodes).map(c => `mds_${c}`), 'def_sev', 'def_ij', 'pen_cmp' ];
  const X: number[][] = [];
  const ccnIndex: string[] = [];
  for (const ccn of ccns) {
    const row: number[] = [];
    const m = mdsByCCN.get(ccn) || {};
    for (const c of Object.keys(mdsCodes)) {
      const v = Number(m[c]||NaN);
      const b = bounds[c];
      row.push(Number.isFinite(v) ? scaleInvertByBounds(v, b.p5, b.p95) : 0.5);
    }
    row.push(scaleInvertByBounds(sevBy.get(ccn)||0, sevP5, sevP95));
    row.push(scaleInvertByBounds(ijBy.get(ccn)||0, ijP5, ijP95));
    row.push(scaleInvertByBounds(cmpBy.get(ccn)||0, cmpP5, cmpP95));
    X.push(row);
    ccnIndex.push(ccn);
  }

  // Targets from Supabase (per 100 certified beds)
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb
    .from('resources')
    .select(['facility_id','number_of_substantiated_complaints','number_of_facility_reported_incidents','number_of_certified_beds'].join(','))
    .eq('provider_type','nursing_home');
  if (error) throw error;
  const lookup = new Map<string, { comp:number; inc:number; beds:number }>();
  for (const r of (data ?? []) as any[]) {
    const ccn = String(r.facility_id||'').trim(); if (!ccn) continue;
    const beds = Number(r.number_of_certified_beds||'');
    const comp = Number(r.number_of_substantiated_complaints||'');
    const inc = Number(r.number_of_facility_reported_incidents||'');
    if (!Number.isFinite(beds) || beds<=0) continue;
    lookup.set(ccn, { comp: Number.isFinite(comp)?comp:0, inc: Number.isFinite(inc)?inc:0, beds });
  }

  const yComp: number[] = []; const yInc: number[] = []; const keepIdx: number[] = [];
  for (let i=0;i<ccnIndex.length;i++) {
    const rec = lookup.get(ccnIndex[i]); if (!rec) continue;
    yComp.push( (rec.comp / rec.beds) * 100 );
    yInc.push( (rec.inc / rec.beds) * 100 );
    keepIdx.push(i);
  }
  const Xk = keepIdx.map(i => X[i]);
  const zh = standardize(yComp.map(v => -v)).y; // invert so higher is better
  const zi = standardize(yInc.map(v => -v)).y;
  const alpha = Number(process.env.V22_ALPHA || '0.6');
  const z = zh.map((v,i)=> alpha*v + (1-alpha)*zi[i]);

  // Prior per-feature weights (sum=1)
  const prior: number[] = [];
  for (const [c,w] of Object.entries(mdsCodes)) prior.push(priorComponents.wMDS * w);
  prior.push(priorComponents.wDEF * priorComponents.wDEF_SEV);
  prior.push(priorComponents.wDEF * priorComponents.wDEF_IJ);
  prior.push(priorComponents.wPEN);
  const s = prior.reduce((a,b)=>a+b,0) || 1; const priorNorm = prior.map(v=>v/s);

  // Optimize with projected gradient
  const n = Xk.length, p = Xk[0].length;
  let w = priorNorm.slice();
  const iters = Number(process.env.V22_ITERS || '800');
  const lr = Number(process.env.V22_LR || '0.3');
  const lambda = Number(process.env.V22_LAMBDA || '0.15');
  for (let t=0;t<iters;t++) {
    // Xw and residual
    const Xw = new Array(n).fill(0);
    for (let i=0;i<n;i++) { let s=0; for (let j=0;j<p;j++) s += Xk[i][j]*w[j]; Xw[i]=s; }
    const r = z.map((zi,i)=> zi - Xw[i]);
    // grad = -2 X^T r + 2λ (w - prior)
    const g = new Array(p).fill(0);
    for (let j=0;j<p;j++) {
      let s=0; for (let i=0;i<n;i++) s += -2 * Xk[i][j] * r[i];
      s += 2 * lambda * (w[j] - priorNorm[j]);
      g[j] = s / n;
    }
    const wNew = w.map((wj,j)=> wj - lr * g[j]);
    w = projectToSimplex(wNew);
  }

  // Cap movement vs prior (blend)
  const cap = Number(process.env.V22_MAX_DELTA || '0.25');
  const wCap = projectToSimplex(priorNorm.map((pv,j)=> (1-cap)*pv + cap*w[j]));

  // Map back to components/json format
  const out: any = { mds: {} as Record<string, number>, components: { wMDS:0, wDEF:0, wPEN:0, wDEF_SEV:0.7, wDEF_IJ:0.3 } };
  const mdsSum = Object.values(mdsCodes).reduce((a,b)=>a+b,0) || 1;
  const mdsStart = 0; const mdsEnd = Object.keys(mdsCodes).length;
  const defSevIdx = mdsEnd; const defIjIdx = mdsEnd+1; const penIdx = mdsEnd+2;
  const wMDS = wCap.slice(mdsStart, mdsEnd).reduce((a,b)=>a+b,0);
  const mdsRatios = Object.entries(mdsCodes).map(([c,w])=> w / mdsSum);
  let i=0; for (const [c,ratio] of Object.entries(mdsCodes)) { out.mds[c] = Number((ratio * wMDS).toFixed(6)); i++; }
  // Ensure exact sum by distributing tiny remainder
  const sumMds = Object.values(out.mds).reduce((a,b)=>a+b,0);
  if (Math.abs(sumMds - wMDS) > 1e-6) {
    const diff = wMDS - sumMds; const first = Object.keys(out.mds)[0]; out.mds[first] = Number((out.mds[first]+diff).toFixed(6));
  }
  out.components.wMDS = Number(wMDS.toFixed(6));
  out.components.wDEF = Number((wCap[defSevIdx] + wCap[defIjIdx]).toFixed(6));
  out.components.wPEN = Number(wCap[penIdx].toFixed(6));
  // Keep default DEF split unless you want to learn it as well
  out.components.wDEF_SEV = priorComponents.wDEF_SEV;
  out.components.wDEF_IJ = priorComponents.wDEF_IJ;

  fs.mkdirSync('analysis/scoring', { recursive: true });
  fs.writeFileSync('analysis/scoring/v2_2_weights.json', JSON.stringify(out, null, 2));
  console.log('✅ Wrote analysis/scoring/v2_2_weights.json');
}

main().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1); });

