#!/usr/bin/env tsx
/**
 * SunsetWell Score v2.2 – Harm‑Weighted Safety Composite (absolute 0–100)
 *
 * Inputs (processed CSVs):
 *  - data/cms/processed/quality-metrics-processed.csv (MDS QMs)
 *  - data/cms/processed/deficiencies-processed.csv (inspection deficiencies)
 *  - data/cms/processed/penalties-processed.csv (CMP/DPNA)
 *  - data/cms/processed/nursing-homes-processed.csv (CCN → state mapping)
 *
 * Output:
 *  - data/cms/processed/sunsetwell-scores-v2_2.csv
 *  - Optional upsert to Supabase sunsetwell_scores (set APPLY_DB_UPSERT=true)
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

type CCN = string;

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
  if (!Number.isFinite(value)) return 50;
  if (p95 <= p5) return 50;
  const z = (value - p5) / (p95 - p5);
  const x = Math.max(0, Math.min(1, z));
  return Math.max(0, Math.min(100, 100 - x * 100));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Load inputs
const mdsPath = 'data/cms/processed/quality-metrics-processed.csv';
const defPath = 'data/cms/processed/deficiencies-processed.csv';
const penPath = 'data/cms/processed/penalties-processed.csv';
const provPath = 'data/cms/processed/nursing-homes-processed.csv';

const mds = readCSV(mdsPath);
const defs = readCSV(defPath);
const pens = readCSV(penPath);
const prov = readCSV(provPath);

if (mds.length === 0) {
  console.error(`❌ Missing or empty ${mdsPath}. Run scripts/process-quality-data.ts first.`);
  process.exit(1);
}

// Map CCN → state
const ccnState = new Map<CCN, string>();
for (const r of prov) {
  const ccn = String((r['facility_id'] ?? r['CMS Certification Number (CCN)'] ?? '')).trim();
  const st = Array.isArray(r.states) ? String(r.states?.[0] || '').toUpperCase() : String(r.state ?? r.State ?? '').toUpperCase();
  if (ccn) ccnState.set(ccn, st);
}

// Harmful MDS measures (lower is better)
let MDS_CODES: Record<string, number> = {
  // code: weight (sums to 1.0)
  '410': 0.20, // Falls with major injury (LS)
  '479': 0.20, // Pressure ulcers (LS) – used in processed file
  '451': 0.15, // Antipsychotic (LS)
  '430': 0.10, // UTI (LS)
  '404': 0.10, // Weight loss (LS)
  '434': 0.10, // Depressive symptoms (LS)
  '406': 0.05, // Catheter (LS)
  '480': 0.10, // New/worsened incontinence (LS)
};

// Aggregate MDS by CCN and measure code
interface MdsAgg { [code: string]: number }
const mdsByCCN: Map<CCN, MdsAgg> = new Map();
const codeScores: Record<string, number[]> = {};
for (const row of mds) {
  const ccn = String(row['provider_id'] ?? '').trim();
  const code = String(row['measure_code'] ?? '').trim();
  if (!ccn || !MDS_CODES[code]) continue;
  const score = Number(row['score'] ?? '');
  if (!Number.isFinite(score)) continue;
  if (!mdsByCCN.has(ccn)) mdsByCCN.set(ccn, {});
  mdsByCCN.get(ccn)![code] = score;
  (codeScores[code] ||= []).push(score);
}

// Calculate p5/p95 per code for scaling
const bounds: Record<string, { p5: number; p95: number }> = {};
for (const [code, arr] of Object.entries(codeScores)) {
  const sorted = arr.slice().sort((a, b) => a - b);
  bounds[code] = { p5: percentile(sorted, 0.05), p95: percentile(sorted, 0.95) };
}

// Deficiencies: severity weights; IJ handled separately
const severityWeight = (code: string): number => {
  const c = (code || '').toUpperCase().trim();
  if (!c) return 0;
  if ('ABC'.includes(c)) return 1;
  if ('DEF'.includes(c)) return 2;
  if ('GHI'.includes(c)) return 4;
  if ('JKL'.includes(c)) return 0; // IJ handled separately
  return 0;
};

// Aggregate deficiency harm per CCN
const defHarm: Map<CCN, { sevIndex: number; ijCount: number }> = new Map();
for (const r of defs) {
  const ccn = String(r['provider_id'] ?? '').trim();
  if (!ccn) continue;
  const sev = String(r['scope_severity_code'] ?? '').trim();
  const weight = severityWeight(sev);
  const entry = defHarm.get(ccn) || { sevIndex: 0, ijCount: 0 };
  entry.sevIndex += weight;
  if (sev && 'JKL'.includes(sev.toUpperCase()[0])) entry.ijCount += 1;
  defHarm.set(ccn, entry);
}

// Penalties: total CMP $ per CCN
const fineByCCN: Map<CCN, number> = new Map();
for (const r of pens) {
  const ccn = String(r['provider_id'] ?? '').trim();
  if (!ccn) continue;
  const amt = Number(r['fine_amount'] ?? '');
  if (!Number.isFinite(amt)) continue;
  fineByCCN.set(ccn, (fineByCCN.get(ccn) || 0) + amt);
}

// Build arrays for normalization of def/penalties
const sevVals: number[] = [];
const ijVals: number[] = [];
const fineVals: number[] = [];
for (const ccn of new Set([...defHarm.keys(), ...fineByCCN.keys()])) {
  const h = defHarm.get(ccn) || { sevIndex: 0, ijCount: 0 };
  sevVals.push(h.sevIndex);
  ijVals.push(h.ijCount);
  fineVals.push(fineByCCN.get(ccn) || 0);
}
sevVals.sort((a, b) => a - b);
ijVals.sort((a, b) => a - b);
fineVals.sort((a, b) => a - b);
const sevP5 = percentile(sevVals, 0.05), sevP95 = percentile(sevVals, 0.95);
const ijP5 = percentile(ijVals, 0.05), ijP95 = percentile(ijVals, 0.95);
const fineP5 = percentile(fineVals, 0.05), fineP95 = percentile(fineVals, 0.95);

// Compute composite per CCN
interface ScoreRow { ccn: CCN; state: string | null; score: number }
const rows: ScoreRow[] = [];

for (const [ccn, mdsMap] of mdsByCCN.entries()) {
  // MDS harm subscore (0–100), weighted
  let wSum = 0, sSum = 0;
  for (const [code, w] of Object.entries(MDS_CODES)) {
    const v = mdsMap[code];
    if (!Number.isFinite(v)) continue;
    const { p5, p95 } = bounds[code];
    const s = scaleInvertByBounds(v, p5, p95);
    wSum += w; sSum += w * s;
  }
  const mdsScore = wSum > 0 ? sSum / wSum : 50;

  // Deficiency harm (sevIndex and IJ inverted)
  const h = defHarm.get(ccn) || { sevIndex: 0, ijCount: 0 };
  const sevScore = scaleInvertByBounds(h.sevIndex, sevP5, sevP95);
  const ijScore = scaleInvertByBounds(h.ijCount, ijP5, ijP95);
  // Penalties
  const fine = fineByCCN.get(ccn) || 0;
  const fineScore = scaleInvertByBounds(fine, fineP5, fineP95);

  // Component weights (total=1) — can be overridden by JSON
  const weights = (globalThis as any).__V22_WEIGHTS__ as undefined | {
    wMDS?: number; wDEF?: number; wPEN?: number; wDEF_SEV?: number; wDEF_IJ?: number;
  };
  const wMDS = weights?.wMDS ?? 0.70;
  const wDEF = weights?.wDEF ?? 0.20;
  const wPEN = weights?.wPEN ?? 0.10;
  const wDEF_SEV = weights?.wDEF_SEV ?? 0.7;
  const wDEF_IJ = weights?.wDEF_IJ ?? 0.3;
  const safetyScore = wMDS * mdsScore + wDEF * (wDEF_SEV * sevScore + wDEF_IJ * ijScore) + wPEN * fineScore;

  const st = ccnState.get(ccn) || null;
  rows.push({ ccn, state: st, score: Number(safetyScore.toFixed(2)) });
}

// Compute percentiles per state
const byState = new Map<string, ScoreRow[]>();
for (const r of rows) {
  const st = (r.state || '').toUpperCase();
  const key = st && st.length === 2 ? st : 'ALL';
  if (!byState.has(key)) byState.set(key, []);
  byState.get(key)!.push(r);
}

const out: Array<{ facility_id: string; overall_score: number; overall_percentile: number; calculation_date: string; version: string }>
  = [];

for (const [key, arr] of byState.entries()) {
  const scores = arr.map(a => a.score).slice().sort((a, b) => a - b);
  for (const r of arr) {
    const rank = (() => {
      const i = scores.findIndex(v => v >= r.score);
      if (scores.length <= 1) return 50;
      const idx = i < 0 ? scores.length - 1 : i;
      return Math.round((idx / (scores.length - 1)) * 100);
    })();
    out.push({ facility_id: r.ccn, overall_score: r.score, overall_percentile: rank, calculation_date: today(), version: 'v2.2' });
  }
}

// Write CSV
const outPath = 'data/cms/processed/sunsetwell-scores-v2_2.csv';
fs.writeFileSync(outPath, stringify(out, { header: true }));
console.log(`\n✅ Wrote ${out.length} scores to ${outPath}`);

// Optional upsert to Supabase sunsetwell_scores
async function maybeUpsert() {
  if (process.env.APPLY_DB_UPSERT !== 'true') return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('⚠️  Missing Supabase credentials; skipping upsert');
    return;
  }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const batchSize = 500;
  for (let i = 0; i < out.length; i += batchSize) {
    const batch = out.slice(i, i + batchSize);
    const { error } = await supabase
      .from('sunsetwell_scores')
      .upsert(batch as any, { onConflict: 'facility_id,calculation_date' });
    if (error) console.warn('⚠️  Upsert failed (batch)', i / batchSize + 1, error.message);
  }
  console.log('✅ Attempted upsert to sunsetwell_scores');
}

maybeUpsert().catch(err => console.warn('⚠️  Upsert error:', (err as any)?.message || err));

// Try to load optional weight overrides
try {
  const weightsPath = 'analysis/scoring/v2_2_weights.json';
  if (fs.existsSync(weightsPath)) {
    const cfg = JSON.parse(fs.readFileSync(weightsPath, 'utf-8')) as any;
    if (cfg && typeof cfg === 'object') {
      (globalThis as any).__V22_WEIGHTS__ = cfg.components;
      if (cfg.mds && typeof cfg.mds === 'object') {
        MDS_CODES = cfg.mds;
      }
    }
  }
} catch (e) {
  // ignore
}
