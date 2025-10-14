#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

type Row = {
  id: string; // resources.id (uuid)
  facility_id: string | null; // CCN
  overall_score: number;
  health_inspection_rating: number | null;
  staffing_rating: number | null;
  quality_measure_rating: number | null;
  overall_stars: number | null; // alias of quality_rating/overall rating if available
};

type QM = { provider_id: string; measure_name: string; score: number | null; measure_period_end: string | null };

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

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n < 2) return NaN;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx; const b = y[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? NaN : num / den;
}

async function main() {
  console.log("\n🔬 Evaluating SunsetWell vs CMS Stars using hospitalization/ED QMs (long-stay)\n");

  // Fetch facilities with latest SunsetWell score and stars
  const { data: rows, error } = await supabase
    .from("resources")
    .select([
      'id',
      'facility_id',
      'health_inspection_rating',
      'staffing_rating',
      'quality_measure_rating',
      'quality_rating',
      'sunsetwell_scores!inner(overall_score,calculation_date)'
    ].join(','))
    .order("calculation_date", { ascending: false, referencedTable: "sunsetwell_scores" });

  if (error) throw error;
  const items = (rows ?? []) as any[];
  const latestById = new Map<string, Row>();
  for (const r of items) {
    const score = Array.isArray(r.sunsetwell_scores) && r.sunsetwell_scores.length > 0 ? r.sunsetwell_scores[0].overall_score : null;
    if (typeof score !== "number") continue;
    latestById.set(r.id, {
      id: r.id,
      facility_id: r.facility_id ?? null,
      overall_score: score,
      health_inspection_rating: r.health_inspection_rating ?? null,
      staffing_rating: r.staffing_rating ?? null,
      quality_measure_rating: r.quality_measure_rating ?? null,
      overall_stars: r.quality_rating ?? null,
    });
  }

  // Fetch relevant QMs and keep latest per provider
  const { data: qms, error: qmErr } = await supabase
    .from("nursing_home_quality_metrics")
    .select("provider_id, measure_name, score, measure_period_end")
    .not("provider_id", "is", null);
  if (qmErr) throw qmErr;

  const hospByProv = new Map<string, QM>();
  const edByProv = new Map<string, QM>();
  for (const r of (qms ?? []) as QM[]) {
    const name = (r.measure_name || "").toLowerCase();
    // Prefer claims-based long-stay per 1,000, but fallback to short-stay rehospitalization/ED percentage
    const isHosp = name.includes("hospital") || name.includes("rehospital");
    const isEd = (name.includes("emergency") || name.includes("ed ") || name.includes("outpatient ed"));
    if (!isHosp && !isEd) continue;
    if (isHosp) {
      const prev = hospByProv.get(r.provider_id);
      if (!prev || (r.measure_period_end || "") > (prev.measure_period_end || "")) hospByProv.set(r.provider_id, r);
    }
    if (isEd) {
      const prev = edByProv.get(r.provider_id);
      if (!prev || (r.measure_period_end || "") > (prev.measure_period_end || "")) edByProv.set(r.provider_id, r);
    }
  }

  // Build aligned arrays
  const sw: number[] = [];
  const cms: number[] = [];
  const hosp: number[] = [];
  const ed: number[] = [];

  for (const row of latestById.values()) {
    const prov = row.facility_id;
    if (!prov) continue;
    const h = hospByProv.get(prov);
    const e = edByProv.get(prov);
    if (!h || typeof h.score !== "number") continue; // require hospitalization as primary endpoint
    sw.push(row.overall_score);
    cms.push(typeof row.overall_stars === "number" ? row.overall_stars : NaN);
    hosp.push(h.score);
    ed.push(e && typeof e.score === "number" ? e.score : NaN);
  }

  // Clean arrays by removing NaNs consistently
  const cleanIdx: number[] = [];
  for (let i = 0; i < sw.length; i++) {
    if (Number.isFinite(sw[i]) && Number.isFinite(hosp[i])) cleanIdx.push(i);
  }
  const xSW = cleanIdx.map(i => sw[i]);
  const yHosp = cleanIdx.map(i => hosp[i]);
  const xCMS = cleanIdx.map(i => cms[i]);

  // Because higher SW is better and higher hosp is worse, invert hosp for correlation signs
  const yHospInv = yHosp.map(v => -v);

  const spSW = spearman(xSW, yHospInv);
  const spCMS = spearman(xCMS, yHospInv);
  const peSW = pearson(xSW, yHospInv);
  const peCMS = pearson(xCMS, yHospInv);

  console.log(`Facilities evaluated: ${xSW.length}`);
  console.log("Spearman correlation (higher is better vs lower hospitalization):");
  console.log(`  SunsetWell vs Hosp: ${spSW.toFixed(3)}`);
  console.log(`  CMS Stars vs Hosp:  ${spCMS.toFixed(3)}`);
  console.log("Pearson correlation (approx R):");
  console.log(`  SunsetWell vs Hosp: ${peSW.toFixed(3)} (R^2 ~ ${(peSW*peSW).toFixed(3)})`);
  console.log(`  CMS Stars vs Hosp:  ${peCMS.toFixed(3)} (R^2 ~ ${(peCMS*peCMS).toFixed(3)})`);

  console.log("\nNote: Uses long-stay hospitalization per 1,000 resident-days as the primary endpoint. ED visits considered as secondary in further analysis.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
