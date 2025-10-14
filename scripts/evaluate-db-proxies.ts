#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

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
  console.log("\n🔬 Evaluating SunsetWell Score vs proxy adverse outcomes (complaints/incidents) and comparing to CMS Stars\n");

  // Pull latest SunsetWell score per facility with necessary fields
  const { data, error } = await supabase
    .from("resources")
    .select(
      [
        'facility_id',
        'provider_type',
        'quality_rating',
        'health_inspection_rating',
        'staffing_rating',
        'quality_measure_rating',
        'number_of_substantiated_complaints',
        'number_of_facility_reported_incidents',
        'sunsetwell_scores!inner(overall_score,calculation_date)'
      ].join(',')
    )
    .eq("provider_type", "nursing_home")
    .order("calculation_date", { ascending: false, referencedTable: "sunsetwell_scores" });

  if (error) throw error;
  const rows = (data ?? []) as Array<{ facility_id: string; quality_rating?: number | null; health_inspection_rating?: number | null; staffing_rating?: number | null; quality_measure_rating?: number | null; number_of_substantiated_complaints?: number | null; number_of_facility_reported_incidents?: number | null; sunsetwell_scores: Array<{ overall_score: number; calculation_date: string }> }>;

  const sw: number[] = [];
  const cmsOverall: number[] = [];
  const cmshi: number[] = [];
  const cmsstaff: number[] = [];
  const cmsqm: number[] = [];
  const complaints: number[] = [];
  const incidents: number[] = [];

  rows.forEach(r => {
    const s = Array.isArray(r.sunsetwell_scores) && r.sunsetwell_scores.length ? r.sunsetwell_scores[0].overall_score : null;
    const comp = typeof r.number_of_substantiated_complaints === 'number' ? r.number_of_substantiated_complaints : null;
    const inc = typeof r.number_of_facility_reported_incidents === 'number' ? r.number_of_facility_reported_incidents : null;
    if (typeof s === 'number' && (typeof comp === 'number' || typeof inc === 'number')) {
      sw.push(s);
      complaints.push(comp ?? 0);
      incidents.push(inc ?? 0);
      cmsOverall.push(typeof r.quality_rating === 'number' ? r.quality_rating : NaN);
      cmshi.push(typeof r.health_inspection_rating === 'number' ? r.health_inspection_rating : NaN);
      cmsstaff.push(typeof r.staffing_rating === 'number' ? r.staffing_rating : NaN);
      cmsqm.push(typeof r.quality_measure_rating === 'number' ? r.quality_measure_rating : NaN);
    }
  });

  // Clean arrays: require finite score and proxy
  const idxComp = complaints.map((v,i) => ({i,v})).filter(o => Number.isFinite(o.v) && Number.isFinite(sw[o.i]));
  const XswComp = idxComp.map(o => sw[o.i]);
  const Ycomp = idxComp.map(o => o.v as number);
  const XcmsComp = idxComp.map(o => cmsOverall[o.i]);
  const XhiComp = idxComp.map(o => cmshi[o.i]);
  const XstaffComp = idxComp.map(o => cmsstaff[o.i]);
  const XqmComp = idxComp.map(o => cmsqm[o.i]);

  const idxInc = incidents.map((v,i) => ({i,v})).filter(o => Number.isFinite(o.v) && Number.isFinite(sw[o.i]));
  const XswInc = idxInc.map(o => sw[o.i]);
  const Yinc = idxInc.map(o => o.v as number);
  const XcmsInc = idxInc.map(o => cmsOverall[o.i]);
  const XhiInc = idxInc.map(o => cmshi[o.i]);
  const XstaffInc = idxInc.map(o => cmsstaff[o.i]);
  const XqmInc = idxInc.map(o => cmsqm[o.i]);

  // Correlate (note: lower proxies are better; invert sign by negating proxy or comparing negative correlations)
  const report = (name: string, Xsw: number[], Xalt: number[], Y: number[]) => {
    // Filter to cases where alt metric is finite too
    const idx = Xalt.map((v,i)=>({i,v})).filter(o => Number.isFinite(o.v)).map(o=>o.i);
    const xs = idx.map(i => Xsw[i]);
    const xa = idx.map(i => Xalt[i]);
    const yy = idx.map(i => Y[i]);
    const invY = yy.map(v => -v);
    const peSW = pearson(xs, invY); const spSW = spearman(xs, invY);
    const peAlt = pearson(xa, invY); const spAlt = spearman(xa, invY);
    return { name, n: xs.length, sw: { pearson: peSW, spearman: spSW }, alt: { pearson: peAlt, spearman: spAlt } };
  };

  const out = {
    complaints: {
      overall: report('CMS Overall', XswComp, XcmsComp, Ycomp),
      inspect: report('CMS Health Inspection', XswComp, XhiComp, Ycomp),
      staffing: report('CMS Staffing', XswComp, XstaffComp, Ycomp),
      quality: report('CMS Quality Measures', XswComp, XqmComp, Ycomp),
    },
    incidents: {
      overall: report('CMS Overall', XswInc, XcmsInc, Yinc),
      inspect: report('CMS Health Inspection', XswInc, XhiInc, Yinc),
      staffing: report('CMS Staffing', XswInc, XstaffInc, Yinc),
      quality: report('CMS Quality Measures', XswInc, XqmInc, Yinc),
    }
  };

  console.log("\n📊 Correlations (SunsetWell vs proxies; higher is better since proxy inverted):\n");
  const show = (label: string, o: any) => {
    const fmt = (v: number) => Number.isFinite(v) ? v.toFixed(3) : 'NaN';
    console.log(`${label}  n=${o.n}`);
    console.log(`  SunsetWell      | Pearson ${fmt(o.sw.pearson)} | Spearman ${fmt(o.sw.spearman)}`);
    console.log(`  ${o.name.padEnd(17)}| Pearson ${fmt(o.alt.pearson)} | Spearman ${fmt(o.alt.spearman)}`);
    console.log('');
  };

  show('Complaints:', out.complaints.overall);
  show('Complaints:', out.complaints.inspect);
  show('Complaints:', out.complaints.staffing);
  show('Complaints:', out.complaints.quality);
  show('Incidents:', out.incidents.overall);
  show('Incidents:', out.incidents.inspect);
  show('Incidents:', out.incidents.staffing);
  show('Incidents:', out.incidents.quality);

  // Decile analysis for SunsetWell vs complaints/incidents
  const qSw = deciles(sw);
  const bins = (q: number[], x: number[]) => x.map((v) => Math.min(9, Math.max(0, q.findIndex((t, i) => i<10 && v <= q[i+1]) )));
  const bCompl = bins(qSw, XswComp);
  const bInc = bins(qSw, XswInc);
  const meanByBin = (bin: number[], y: number[]) => {
    const acc = Array.from({ length: 10 }, () => ({ s: 0, n: 0 }));
    bin.forEach((b, i) => { acc[b].s += y[i]; acc[b].n += 1; });
    return acc.map(a => a.n ? a.s / a.n : NaN);
  };
  const mCompl = meanByBin(bCompl, Ycomp);
  const mInc = meanByBin(bInc, Yinc);
  console.log("Decile mean complaints (by SunsetWell decile, low→high):", mCompl.map(v=>Number.isFinite(v)?v.toFixed(2):'NaN').join(', '));
  console.log("Decile mean incidents  (by SunsetWell decile, low→high):", mInc.map(v=>Number.isFinite(v)?v.toFixed(2):'NaN').join(', '));
}

main().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1); });
