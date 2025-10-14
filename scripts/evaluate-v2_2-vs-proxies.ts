#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import { parse } from "csv-parse/sync";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function readCSV(path: string): any[] {
  if (!fs.existsSync(path)) return [];
  const s = fs.readFileSync(path, "utf-8");
  return parse(s, { columns: true, skip_empty_lines: true, trim: true });
}

function pearson(x: number[], y: number[]): number {
  const n = x.length; if (n !== y.length || n < 2) return NaN;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { const a = x[i] - mx, b = y[i] - my; num += a * b; dx += a * a; dy += b * b; }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? NaN : num / den;
}

function spearman(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return NaN;
  const rank = (arr: number[]) => {
    const sorted = [...arr].slice().sort((a, b) => a - b);
    return arr.map(v => sorted.indexOf(v) + 1);
  };
  const rx = rank(x);
  const ry = rank(y);
  const n = x.length;
  const d2 = rx.reduce((s, v, i) => s + Math.pow(v - ry[i], 2), 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
}

function deciles(x: number[]) {
  const sorted = [...x].sort((a,b)=>a-b);
  const q = (p: number) => {
    const r = (sorted.length - 1) * p; const lo = Math.floor(r), hi = Math.ceil(r), w = r - lo;
    return sorted[lo] * (1 - w) + sorted[hi] * w;
  };
  return Array.from({ length: 11 }, (_, i) => q(i / 10));
}

async function main() {
  const csvPath = 'data/cms/processed/sunsetwell-scores-v2_2.csv';
  const rows = readCSV(csvPath);
  if (rows.length === 0) {
    console.error(`❌ Missing ${csvPath}. Run v2.2 scorer first.`);
    process.exit(1);
  }

  // Map CCN->score
  const scoreByCCN = new Map<string, number>();
  rows.forEach(r => {
    const ccn = String(r['facility_id'] || '').trim();
    const sc = Number(r['overall_score']);
    if (ccn && Number.isFinite(sc)) scoreByCCN.set(ccn, sc);
  });

  // Fetch proxies + CMS star metrics
  const { data, error } = await supabase
    .from('resources')
    .select([
      'facility_id',
      'quality_rating',
      'health_inspection_rating',
      'staffing_rating',
      'quality_measure_rating',
      'number_of_substantiated_complaints',
      'number_of_facility_reported_incidents'
    ].join(','))
    .eq('provider_type', 'nursing_home');
  if (error) throw error;
  const facs = (data ?? []) as Array<{ facility_id: string; quality_rating?: number | null; health_inspection_rating?: number | null; staffing_rating?: number | null; quality_measure_rating?: number | null; number_of_substantiated_complaints?: number | null; number_of_facility_reported_incidents?: number | null }>;

  const sw: number[] = [];
  const cmsOverall: number[] = [];
  const cmsHI: number[] = [];
  const cmsStaff: number[] = [];
  const cmsQM: number[] = [];
  const complaints: number[] = [];
  const incidents: number[] = [];

  for (const r of facs) {
    const ccn = String(r.facility_id || '').trim();
    const s = scoreByCCN.get(ccn);
    if (!Number.isFinite(s as number)) continue;
    const comp = typeof r.number_of_substantiated_complaints === 'number' ? r.number_of_substantiated_complaints : null;
    const inc = typeof r.number_of_facility_reported_incidents === 'number' ? r.number_of_facility_reported_incidents : null;
    if (!(typeof comp === 'number' || typeof inc === 'number')) continue;
    sw.push(s as number);
    complaints.push(comp ?? 0);
    incidents.push(inc ?? 0);
    cmsOverall.push(typeof r.quality_rating === 'number' ? r.quality_rating : NaN);
    cmsHI.push(typeof r.health_inspection_rating === 'number' ? r.health_inspection_rating : NaN);
    cmsStaff.push(typeof r.staffing_rating === 'number' ? r.staffing_rating : NaN);
    cmsQM.push(typeof r.quality_measure_rating === 'number' ? r.quality_measure_rating : NaN);
  }

  const compare = (label: string, Xsw: number[], Xalt: number[], Y: number[]) => {
    const idx = Xalt.map((v,i)=>({i,v})).filter(o => Number.isFinite(o.v)).map(o=>o.i);
    const xs = idx.map(i => Xsw[i]);
    const xa = idx.map(i => Xalt[i]);
    const yy = idx.map(i => Y[i]);
    const invY = yy.map(v => -v);
    return { label, n: xs.length, sw: { pearson: pearson(xs, invY), spearman: spearman(xs, invY) }, alt: { pearson: pearson(xa, invY), spearman: spearman(xa, invY) } };
  };

  const out = {
    complaints: {
      overall: compare('CMS Overall', sw, cmsOverall, complaints),
      inspect: compare('CMS Health Inspection', sw, cmsHI, complaints),
      staffing: compare('CMS Staffing', sw, cmsStaff, complaints),
      quality: compare('CMS Quality Measures', sw, cmsQM, complaints),
    },
    incidents: {
      overall: compare('CMS Overall', sw, cmsOverall, incidents),
      inspect: compare('CMS Health Inspection', sw, cmsHI, incidents),
      staffing: compare('CMS Staffing', sw, cmsStaff, incidents),
      quality: compare('CMS Quality Measures', sw, cmsQM, incidents),
    }
  } as any;

  // Decile analysis
  const q = deciles(sw);
  const bin = (v: number) => Math.min(9, Math.max(0, q.findIndex((t, i) => i < 10 && v <= q[i + 1])));
  const meanByBin = (xs: number[], ys: number[]) => {
    const acc = Array.from({ length: 10 }, () => ({ s: 0, n: 0 }));
    xs.forEach((v, i) => { const b = bin(v); acc[b].s += ys[i]; acc[b].n += 1; });
    return acc.map(a => a.n ? a.s / a.n : NaN);
  };
  out.deciles = {
    complaints: meanByBin(sw, complaints),
    incidents: meanByBin(sw, incidents)
  };

  // Print summary
  const fmt = (v: number) => Number.isFinite(v) ? v.toFixed(3) : 'NaN';
  const show = (title: string, o: any) => {
    console.log(`${title} n=${o.n}`);
    console.log(`  SunsetWell v2.2 | Pearson ${fmt(o.sw.pearson)} | Spearman ${fmt(o.sw.spearman)}`);
    console.log(`  ${o.label.padEnd(17)}| Pearson ${fmt(o.alt.pearson)} | Spearman ${fmt(o.alt.spearman)}`);
    console.log('');
  };

  console.log('\n📊 v2.2 (Harm‑Weighted) vs harmful events (inverted proxies)');
  show('Complaints:', out.complaints.overall);
  show('Complaints:', out.complaints.inspect);
  show('Complaints:', out.complaints.staffing);
  show('Complaints:', out.complaints.quality);
  show('Incidents:', out.incidents.overall);
  show('Incidents:', out.incidents.inspect);
  show('Incidents:', out.incidents.staffing);
  show('Incidents:', out.incidents.quality);
  console.log('Decile means (complaints):', out.deciles.complaints.map((v:number)=>Number.isFinite(v)?v.toFixed(2):'NaN').join(', '));
  console.log('Decile means (incidents):', out.deciles.incidents.map((v:number)=>Number.isFinite(v)?v.toFixed(2):'NaN').join(', '));

  // Persist report
  fs.mkdirSync('analysis/scoring', { recursive: true });
  fs.writeFileSync('analysis/scoring/v2_2_evaluation.json', JSON.stringify(out, null, 2));
  console.log('\n📝 Wrote analysis/scoring/v2_2_evaluation.json');
}

main().then(()=>process.exit(0)).catch(err=>{ console.error(err); process.exit(1); });

