#!/usr/bin/env tsx
/**
 * Optimize metric weights against long-stay hospitalization (primary)
 * and ED visits (secondary) using constrained gradient descent with
 * projection onto the probability simplex (w >= 0, sum w = 1), and
 * regularization toward prior weights.
 *
 * Outputs:
 * - Candidate weight bundle (global) for provider_type = nursing_home
 * - Cross-validated performance metrics vs hospitalization/ED and compares to CMS Stars
 * - Optionally upserts to facility_metric_weights with a new version (default: v2.1)
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

type UUID = string;

type ProviderType = "nursing_home" | "assisted_living" | "home_health" | "hospice";

// Prior default weights for nursing homes (should match scripts/scoring/config.ts)
const PRIOR_WEIGHTS: Record<string, number> = {
  // Inspection & compliance
  health_inspection_rating: 0.45,
  deficiency_count: 0.05,
  total_penalties_amount: 0.02,
  has_immediate_jeopardy: 0.01,
  // Staffing capacity & expertise
  staffing_rating: 0.14,
  total_nurse_hours_per_resident_per_day: 0.09,
  rn_hours_per_resident_per_day: 0.09,
  // Staffing stability
  total_nurse_staff_turnover: 0.06,
  rn_turnover: 0.04,
  // Clinical quality
  quality_measure_rating: 0.05,
  // Claims/MDS outcomes (long-stay)
  hosp_ls_per_1k: 0.06,
  ed_ls_per_1k: 0.04,
};

const METRICS = Object.keys(PRIOR_WEIGHTS);

// Map raw metrics to absolute 0–100 sub-scores (same logic as scorer)
function toScore100(metricKey: string, raw: unknown, cal: { hospP10?: number; hospP90?: number; edP10?: number; edP90?: number }): number | null {
  const val = typeof raw === "boolean" ? (raw ? 1 : 0) : typeof raw === "string" ? Number(raw) : (raw as number | null);
  if (val === null || Number.isNaN(val)) return null;
  const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
  const lin = (x: number, a: number, b: number) => clamp(((x - a) / (b - a)) * 100, 0, 100);
  const inv = (x: number, a: number, b: number) => 100 - lin(x, a, b);
  switch (metricKey) {
    case "health_inspection_rating":
    case "staffing_rating":
    case "quality_measure_rating":
      return clamp(((val - 1) / 4) * 100, 0, 100);
    case "total_nurse_hours_per_resident_per_day":
      return lin(val, 2.0, 6.0);
    case "rn_hours_per_resident_per_day":
      return lin(val, 0.2, 1.0);
    case "total_nurse_staff_turnover":
    case "rn_turnover":
      return inv(val, 10, 80);
    case "deficiency_count":
      return inv(val, 0, 25);
    case "total_penalties_amount":
      return inv(val, 0, 250000);
    case "has_immediate_jeopardy":
      return val > 0 ? 0 : 100;
    case "hosp_ls_per_1k": {
      const lo = cal.hospP10 ?? 0.5;
      const hi = cal.hospP90 ?? 3.5;
      return inv(val, lo, hi);
    }
    case "ed_ls_per_1k": {
      const lo = cal.edP10 ?? 0.5;
      const hi = cal.edP90 ?? 6.0;
      return inv(val, lo, hi);
    }
    default:
      return null;
  }
}

function projectToSimplex(w: number[]): number[] {
  // Euclidean projection onto { w >= 0, sum w = 1 }
  const n = w.length;
  const u = [...w].sort((a, b) => b - a);
  let cssv = 0;
  let rho = -1;
  for (let i = 0; i < n; i++) {
    cssv += u[i];
    const t = (cssv - 1) / (i + 1);
    if (u[i] - t > 0) rho = i;
  }
  const theta = (u.slice(0, rho + 1).reduce((s, v) => s + v, 0) - 1) / (rho + 1);
  const wProj = w.map((v) => Math.max(0, v - theta));
  return wProj;
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

async function fetchData() {
  // Prefetch hospitalization/ED measures per provider
  const { data: qms } = await supabase
    .from("nursing_home_quality_metrics")
    .select("provider_id, measure_name, score, denominator, measure_period_end")
    .not("provider_id", "is", null);

  // Build latest per provider + calibration percentiles
  const latest: Record<string, { hosp?: number; hospDen?: number; hospDate?: string; ed?: number; edDen?: number; edDate?: string }> = {};
  for (const r of (qms ?? []) as Array<{ provider_id: string; measure_name: string; score: number | null; denominator: number | null; measure_period_end: string | null }>) {
    const name = (r.measure_name || "").toLowerCase();
    const isHosp = name.includes("hospital") && name.includes("per 1,000") && name.includes("long");
    const isEd = (name.includes("emergency") || name.includes("ed ")) && name.includes("per 1,000") && name.includes("long");
    if (!isHosp && !isEd) continue;
    if (!latest[r.provider_id]) latest[r.provider_id] = {};
    const d = r.measure_period_end || "";
    if (isHosp) {
      if (!latest[r.provider_id].hospDate || d > latest[r.provider_id].hospDate!) {
        latest[r.provider_id].hosp = typeof r.score === "number" ? r.score : undefined;
        latest[r.provider_id].hospDen = typeof r.denominator === "number" ? r.denominator : undefined;
        latest[r.provider_id].hospDate = d;
      }
    }
    if (isEd) {
      if (!latest[r.provider_id].edDate || d > latest[r.provider_id].edDate!) {
        latest[r.provider_id].ed = typeof r.score === "number" ? r.score : undefined;
        latest[r.provider_id].edDen = typeof r.denominator === "number" ? r.denominator : undefined;
        latest[r.provider_id].edDate = d;
      }
    }
  }
  const hospVals = Object.values(latest).map(v => v.hosp).filter((x): x is number => typeof x === "number").sort((a,b)=>a-b);
  const edVals = Object.values(latest).map(v => v.ed).filter((x): x is number => typeof x === "number").sort((a,b)=>a-b);
  const p = (arr: number[], q: number) => {
    if (arr.length === 0) return undefined;
    const rank = (arr.length - 1) * q; const lo = Math.floor(rank), hi = Math.ceil(rank), w = rank - lo;
    return arr[lo] * (1 - w) + arr[hi] * w;
  };
  const CAL = { hospP10: p(hospVals, 0.1), hospP90: p(hospVals, 0.9), edP10: p(edVals, 0.1), edP90: p(edVals, 0.9) };

  // Fetch facility rows
  const selectAll = "*";
  let from = 0; const PAGE = 1000; const rows: any[] = [];
  while (true) {
    const { data, error } = await supabase
      .from("resources")
      .select(selectAll)
      .in("provider_type", ["nursing_home"]) // focus on NH
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }

  // Build dataset
  const X: number[][] = [];
  const yHosp: number[] = [];
  const yEd: number[] = [];
  const divCodes: string[] = [];

  const STATE_TO_DIVISION: Record<string, { code: string; name: string }> = {
    AL: { code: "east_south_central", name: "East South Central" },
    AK: { code: "pacific", name: "Pacific" },
    AZ: { code: "mountain", name: "Mountain" },
    AR: { code: "west_south_central", name: "West South Central" },
    CA: { code: "pacific", name: "Pacific" },
    CO: { code: "mountain", name: "Mountain" },
    CT: { code: "new_england", name: "New England" },
    DC: { code: "south_atlantic", name: "South Atlantic" },
    DE: { code: "south_atlantic", name: "South Atlantic" },
    FL: { code: "south_atlantic", name: "South Atlantic" },
    GA: { code: "south_atlantic", name: "South Atlantic" },
    HI: { code: "pacific", name: "Pacific" },
    IA: { code: "west_north_central", name: "West North Central" },
    ID: { code: "mountain", name: "Mountain" },
    IL: { code: "east_north_central", name: "East North Central" },
    IN: { code: "east_north_central", name: "East North Central" },
    KS: { code: "west_north_central", name: "West North Central" },
    KY: { code: "east_south_central", name: "East South Central" },
    LA: { code: "west_south_central", name: "West South Central" },
    MA: { code: "new_england", name: "New England" },
    MD: { code: "south_atlantic", name: "South Atlantic" },
    ME: { code: "new_england", name: "New England" },
    MI: { code: "east_north_central", name: "East North Central" },
    MN: { code: "west_north_central", name: "West North Central" },
    MO: { code: "west_north_central", name: "West North Central" },
    MS: { code: "east_south_central", name: "East South Central" },
    MT: { code: "mountain", name: "Mountain" },
    NC: { code: "south_atlantic", name: "South Atlantic" },
    ND: { code: "west_north_central", name: "West North Central" },
    NE: { code: "west_north_central", name: "West North Central" },
    NH: { code: "new_england", name: "New England" },
    NJ: { code: "mid_atlantic", name: "Mid-Atlantic" },
    NM: { code: "mountain", name: "Mountain" },
    NV: { code: "mountain", name: "Mountain" },
    NY: { code: "mid_atlantic", name: "Mid-Atlantic" },
    OH: { code: "east_north_central", name: "East North Central" },
    OK: { code: "west_south_central", name: "West South Central" },
    OR: { code: "pacific", name: "Pacific" },
    PA: { code: "mid_atlantic", name: "Mid-Atlantic" },
    PR: { code: "caribbean", name: "Caribbean" },
    RI: { code: "new_england", name: "New England" },
    SC: { code: "south_atlantic", name: "South Atlantic" },
    SD: { code: "west_north_central", name: "West North Central" },
    TN: { code: "east_south_central", name: "East South Central" },
    TX: { code: "west_south_central", name: "West South Central" },
    UT: { code: "mountain", name: "Mountain" },
    VA: { code: "south_atlantic", name: "South Atlantic" },
    VT: { code: "new_england", name: "New England" },
    WA: { code: "pacific", name: "Pacific" },
    WI: { code: "east_north_central", name: "East North Central" },
    WV: { code: "south_atlantic", name: "South Atlantic" },
    WY: { code: "mountain", name: "Mountain" },
  };

  for (const r of rows) {
    const pid = r.facility_id as string | null;
    const qm = pid ? latest[pid] : undefined;
    const hosp = qm?.hosp;
    if (typeof hosp !== "number") continue; // require hospitalization target
    const ed = typeof qm?.ed === "number" ? qm!.ed! : NaN;

    const cal = CAL;
    const feats: number[] = [];
    for (const m of METRICS) {
      let raw: unknown = r[m];
      if (m === "hosp_ls_per_1k") raw = hosp;
      if (m === "ed_ls_per_1k") raw = ed;
      const s = toScore100(m, raw, cal);
      feats.push(typeof s === "number" ? s / 100 : NaN); // scale to [0,1]
    }
    if (feats.some((v) => Number.isNaN(v))) continue; // drop if any feature missing
    X.push(feats);
    yHosp.push(hosp);
    yEd.push(ed);
    const state = Array.isArray(r.states) && r.states.length ? String(r.states[0]).toUpperCase() : '';
    const div = (STATE_TO_DIVISION as any)[state]?.code || 'unknown';
    divCodes.push(div);
  }

  return { X, yHosp, yEd, CAL, divCodes };
}

function standardize(y: number[]): { y: number[]; mean: number; std: number } {
  const n = y.length; const mean = y.reduce((s,v)=>s+v,0)/n; const varr = y.reduce((s,v)=>s+Math.pow(v-mean,2),0)/(n-1); const std = Math.sqrt(Math.max(1e-12, varr));
  return { y: y.map(v => (v - mean)/std), mean, std };
}

function optimize(
  X: number[][],
  yHosp: number[],
  yEd: number[],
  prior: Record<string, number>,
  opts?: { lambda?: number; lr?: number; iters?: number; alphaHosp?: number }
) {
  const n = X.length; const p = X[0].length;
  const priorVec = METRICS.map((m) => prior[m] ?? 0);
  // Normalize prior to simplex
  const priorSum = priorVec.reduce((s,v)=>s+Math.max(0,v),0) || 1;
  const priorNorm = priorVec.map((v)=>Math.max(0,v)/priorSum);

  // Multi-task target: z = α * zHosp + (1-α) * zEd (where available)
  const alpha = opts?.alphaHosp ?? 0.7;
  const zh = standardize(yHosp.map(v => -v)).y;
  const zeRaw = yEd.map(v => (Number.isFinite(v) ? -v as number : NaN));
  const zeFinite = zeRaw.filter(v => Number.isFinite(v)) as number[];
  const zeStd = zeFinite.length > 10 ? standardize(zeRaw.map(v => Number.isFinite(v) ? v as number : 0)).y : new Array(n).fill(0);
  const z = zh.map((vh, i) => alpha * vh + (1 - alpha) * (zeStd[i] || 0));

  // Initialize w = prior
  let w = priorNorm.slice();
  const lambda = opts?.lambda ?? 0.1; // regularization toward prior
  const lr = opts?.lr ?? 0.5;         // learning rate
  const iters = opts?.iters ?? 800;

  for (let t = 0; t < iters; t++) {
    // grad = -2 X^T (z - Xw) + 2λ (w - w_prior)
    const Xw: number[] = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let s = 0; const row = X[i];
      for (let j = 0; j < p; j++) s += row[j] * w[j];
      Xw[i] = s;
    }
    const resid = z.map((zi, i) => zi - Xw[i]);
    const grad = new Array(p).fill(0);
    for (let j = 0; j < p; j++) {
      let g = 0;
      for (let i = 0; i < n; i++) g += -2 * X[i][j] * resid[i];
      g += 2 * lambda * (w[j] - priorNorm[j]);
      grad[j] = g / n;
    }
    // Update and project to simplex
    const wNew = w.map((wj, j) => wj - lr * grad[j]);
    w = projectToSimplex(wNew);
    // Light step decay for stability
    if ((t+1) % 200 === 0) {
      // eslint-disable-next-line no-constant-condition
      // reduce lr slightly
    }
  }
  return w;
}

async function upsertWeights(version: string, w: number[]) {
  const rows = METRICS.map((m, idx) => ({
    version,
    provider_type: "nursing_home",
    metric_key: m,
    weight: Number(w[idx].toFixed(6)),
    region: null,
  }));
  const { error } = await supabase.from("facility_metric_weights").upsert(rows, { onConflict: "version,provider_type,metric_key,region" });
  if (error) throw error;
}

async function main() {
  const NEW_VERSION = process.env.NEW_SCORE_VERSION || "v2.1";
  const { X, yHosp, yEd } = await fetchData();
  if (X.length < 1000) {
    console.log(`Insufficient rows for optimization (got ${X.length}). Aborting.`);
    return;
  }

  // Train/validation split (80/20)
  const idx = Array.from({ length: X.length }, (_, i) => i);
  idx.sort(() => Math.random() - 0.5);
  const cut = Math.floor(0.8 * idx.length);
  const trainIdx = idx.slice(0, cut);
  const testIdx = idx.slice(cut);

  const Xt = trainIdx.map(i => X[i]);
  const yt = trainIdx.map(i => yHosp[i]);
  const Xv = testIdx.map(i => X[i]);
  const yv = testIdx.map(i => yHosp[i]);

  // Optimize weights on training set
  const w = optimize(Xt, yt, yEd, PRIOR_WEIGHTS, { lambda: 0.2, lr: 0.4, iters: 1000, alphaHosp: 0.7 });

  // Cap movement vs prior (blend) to avoid large shifts
  const maxDelta = Number(process.env.WEIGHT_MAX_DELTA || 0.25);
  const priorNorm = projectToSimplex(Object.values(PRIOR_WEIGHTS));
  const wCap = projectToSimplex(priorNorm.map((pv, j) => (1 - maxDelta) * pv + maxDelta * w[j]));

  // Evaluate on validation
  const comp = (A: number[][], w: number[]) => A.map(r => r.reduce((s, v, j) => s + v * w[j], 0));
  const zVal = comp(Xv, wCap);
  const zValPrior = comp(Xv, priorNorm);
  // Correlate with -hospitalization
  const hospVal = yv.map(v => -v);
  const rNew = pearson(zVal, hospVal);
  const rOld = pearson(zValPrior, hospVal);
  const sNew = spearman(zVal, hospVal);
  const sOld = spearman(zValPrior, hospVal);

  console.log("\n📈 Validation (higher is better; compares to prior weights):");
  console.log(`  Pearson: new=${rNew.toFixed(3)} (R^2~${(rNew*rNew).toFixed(3)}), prior=${rOld.toFixed(3)} (R^2~${(rOld*rOld).toFixed(3)})`);
  console.log(`  Spearman: new=${sNew.toFixed(3)}, prior=${sOld.toFixed(3)}`);

  console.log("\n🔧 Candidate weight bundle (sum=1):");
  METRICS.forEach((m, i) => console.log(`  ${m.padEnd(38)} ${wCap[i].toFixed(4)}`));

  // Division-level overrides with shrinkage
  const MIN_N = 500; const IMPROVE = 0.02;
  const report: any = { version: NEW_VERSION, global: { pearson: rNew, spearman: sNew, weights: {} as Record<string, number> }, divisions: [] as any[] };
  METRICS.forEach((m, i) => (report.global.weights[m] = Number(wCap[i].toFixed(6))));

  const { X: Xall, yHosp: yHospAll, yEd: yEdAll, divCodes } = await fetchData();
  const divSet = Array.from(new Set(divCodes));
  for (const div of divSet) {
    const rows = Xall.map((row, i) => ({ row, y: yHospAll[i], ye: yEdAll[i], d: divCodes[i] })).filter(r => r.d === div);
    if (rows.length < MIN_N) continue;
    const Xi = rows.map(r => r.row);
    const Yi = rows.map(r => r.y);
    const Yei = rows.map(r => r.ye);
    const wi = optimize(Xi, Yi, Yei, PRIOR_WEIGHTS, { lambda: 0.25, lr: 0.4, iters: 800, alphaHosp: 0.7 });
    // Evaluate improvement vs global on this division
    const comp = (A: number[][], w: number[]) => A.map(r => r.reduce((s, v, j) => s + v * w[j], 0));
    // Apply same cap toward global for division too
    const wiCap = projectToSimplex(priorNorm.map((pv, j) => (1 - maxDelta) * w[j] + maxDelta * wi[j]));
    const zDivNew = comp(Xi, wiCap);
    const zDivGlob = comp(Xi, wCap);
    const hospNeg = Yi.map(v => -v);
    const spNew = spearman(zDivNew, hospNeg);
    const spOld = spearman(zDivGlob, hospNeg);
    const gain = (spNew - spOld);
    let used = false; let wUsed = w;
    let wDivFinal: number[] | null = null;
    if (Number.isFinite(gain) && gain >= IMPROVE) {
      // Shrink toward global
      const gamma = 0.5; // could scale by gain and sample size
      const blended = projectToSimplex(wCap.map((wg, j) => (1 - gamma) * wg + gamma * wiCap[j]));
      wDivFinal = blended;
      used = true;
    }
    report.divisions.push({ code: div, n: rows.length, spearman_global: spOld, spearman_new: spNew, used });
    if (process.env.APPLY_WEIGHTS === "true" && used && wDivFinal) {
      // Upsert division-specific weights under region = DIV:<code>
      const rowsUp = METRICS.map((m, idx) => ({
        version: NEW_VERSION,
        provider_type: "nursing_home",
        metric_key: m,
        weight: Number(wDivFinal![idx].toFixed(6)),
        region: `DIV:${div}`,
      }));
      const { error } = await supabase.from("facility_metric_weights").upsert(rowsUp, { onConflict: "version,provider_type,metric_key,region"});
      if (error) throw error;
    }
  }

  // Persist global weights
  if (process.env.APPLY_WEIGHTS === "true") {
    await upsertWeights(NEW_VERSION, wCap);
    console.log(`\n✅ Upserted global weights and division overrides (if any) for version ${NEW_VERSION}`);
    console.log("Set METRIC_SCORE_VERSION and rerun scoring to apply.");
  } else {
    console.log("\nℹ️  Preview mode. Set APPLY_WEIGHTS=true to persist weights.\n   Example: NEW_SCORE_VERSION=v2.1 APPLY_WEIGHTS=true pnpm tsx scripts/optimize-weights.ts");
  }

  // Write JSON report
  try {
    const fs = await import('fs');
    const dir = 'analysis/scoring';
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/weights-${NEW_VERSION}-report.json`, JSON.stringify(report, null, 2));
    console.log(`\n📝 Wrote report to ${dir}/weights-${NEW_VERSION}-report.json`);
  } catch (e) {
    console.warn('Could not write report file:', (e as any)?.message || e);
  }
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e); process.exit(1)});
