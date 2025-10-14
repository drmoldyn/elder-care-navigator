#!/usr/bin/env tsx
/**
 * Build Preventable Harm Index (PHI) label from available processed files.
 * PHI is a 0–100 harm score (higher = more harm), combining:
 *  - Long-stay MDS harm measures: 404,406,410,430,434,451,479,480 (higher is worse)
 *  - Deficiency severity depth (A–I) and Immediate Jeopardy count (J/K/L)
 *  - CMP total dollars (penalties)
 * Outputs: analysis/scoring/phi_labels.csv { facility_id (CCN), phi }
 */
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

function readCSV(path: string): any[] {
  if (!fs.existsSync(path)) return [];
  const s = fs.readFileSync(path, 'utf-8');
  return parse(s, { columns: true, skip_empty_lines: true, trim: true });
}
function percentile(sorted: number[], q: number): number { if (sorted.length===0) return 0; if (sorted.length===1) return sorted[0]; const r=(sorted.length-1)*q; const lo=Math.floor(r), hi=Math.ceil(r), w=r-lo; return sorted[lo]*(1-w)+sorted[hi]*w; }
function scale01(value: number, p5: number, p95: number): number { if (!Number.isFinite(value)) return 0.5; if (p95<=p5) return 0.5; const z=(value-p5)/(p95-p5); return Math.max(0, Math.min(1, z)); }

const mds = readCSV('data/cms/processed/quality-metrics-processed.csv');
const defs = readCSV('data/cms/processed/deficiencies-processed.csv');
const pens = readCSV('data/cms/processed/penalties-processed.csv');

if (mds.length===0 || defs.length===0 || pens.length===0) {
  console.error('❌ Missing processed files. Ensure scripts/process-quality-data.ts has been run.');
  process.exit(1);
}

const harmCodes: Record<string, number> = { '410':0.20, '479':0.20, '451':0.15, '430':0.10, '404':0.10, '434':0.10, '406':0.05, '480':0.10 };
const codeVals: Record<string, number[]> = {};
const mdsBy: Map<string, Record<string, number>> = new Map();
for (const r of mds) {
  const ccn = String(r['provider_id']||'').trim();
  const code = String(r['measure_code']||'').trim();
  if (!ccn || !(code in harmCodes)) continue;
  const v = Number(r['score']||''); if (!Number.isFinite(v)) continue;
  if (!mdsBy.has(ccn)) mdsBy.set(ccn, {});
  mdsBy.get(ccn)![code] = v;
  (codeVals[code] ||= []).push(v);
}
const bounds: Record<string, {p5:number;p95:number}> = {};
for (const [c,arr] of Object.entries(codeVals)) { const s=arr.slice().sort((a,b)=>a-b); bounds[c]={p5:percentile(s,0.05),p95:percentile(s,0.95)}; }

const wtSev = (sev: string): number => { const c=(sev||'').toUpperCase().trim(); if (!c) return 0; if ('ABC'.includes(c)) return 1; if ('DEF'.includes(c)) return 2; if ('GHI'.includes(c)) return 4; return 0; };
const sevBy = new Map<string, number>();
const ijBy = new Map<string, number>();
for (const r of defs) {
  const ccn = String(r['provider_id']||'').trim(); if (!ccn) continue;
  const sev = String(r['scope_severity_code']||'');
  sevBy.set(ccn, (sevBy.get(ccn)||0) + wtSev(sev));
  if (sev && 'JKL'.includes(sev.toUpperCase()[0])) ijBy.set(ccn, (ijBy.get(ccn)||0)+1);
}
const sevVals = Array.from(sevBy.values()).sort((a,b)=>a-b);
const ijVals = Array.from(ijBy.values()).sort((a,b)=>a-b);
const sevP5=percentile(sevVals,0.05), sevP95=percentile(sevVals,0.95);
const ijP5=percentile(ijVals,0.05), ijP95=percentile(ijVals,0.95);

const cmpBy = new Map<string, number>();
for (const r of pens) { const ccn = String(r['provider_id']||'').trim(); if (!ccn) continue; const amt = Number(r['fine_amount']||''); if (!Number.isFinite(amt)) continue; cmpBy.set(ccn, (cmpBy.get(ccn)||0) + amt); }
const cmpVals = Array.from(cmpBy.values()).sort((a,b)=>a-b);
const cmpP5=percentile(cmpVals,0.05), cmpP95=percentile(cmpVals,0.95);

// Build PHI = weighted combination (0..100) from scaled harm components
const out: Array<{ facility_id:string; phi:number }> = [];
for (const ccn of new Set([...mdsBy.keys(), ...sevBy.keys(), ...ijBy.keys(), ...cmpBy.keys()])) {
  // MDS scaled average
  let wsum=0, ssum=0;
  const m = mdsBy.get(ccn)||{};
  for (const [code,w] of Object.entries(harmCodes)) {
    const v = Number(m[code]||NaN);
    if (!Number.isFinite(v)) continue;
    const b=bounds[code];
    const s = scale01(v, b.p5, b.p95);
    wsum += w; ssum += w*s;
  }
  const mdsHarm = wsum>0? ssum/wsum : 0.5;
  // DEF harm
  const sev = scale01(sevBy.get(ccn)||0, sevP5, sevP95);
  const ij = scale01(ijBy.get(ccn)||0, ijP5, ijP95);
  // CMP harm
  const cmp = scale01(cmpBy.get(ccn)||0, cmpP5, cmpP95);
  // Component weights (default prior)
  const wMDS=0.70, wDEF=0.20, wPEN=0.10, wDEF_SEV=0.7, wDEF_IJ=0.3;
  const harm = wMDS*mdsHarm + wDEF*(wDEF_SEV*sev + wDEF_IJ*ij) + wPEN*cmp;
  out.push({ facility_id: ccn, phi: Number((harm*100).toFixed(2)) });
}

fs.mkdirSync('analysis/scoring', { recursive: true });
fs.writeFileSync('analysis/scoring/phi_labels.csv', stringify(out, { header: true }));
console.log(`✅ Wrote analysis/scoring/phi_labels.csv (${out.length} rows)`);

