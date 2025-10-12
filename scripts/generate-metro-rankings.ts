#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase credentials (SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Row = {
  id: string;
  title: string;
  city: string | null;
  states: string[] | null;
  provider_type: string | null;
  overall_rating: number | null;
  health_inspection_rating: number | null;
  staffing_rating: number | null;
  total_nurse_hours_per_resident_per_day: number | null;
  facility_scores: Array<{ score: number; version: string }>;
};

type CityKey = string; // `${city}|${state}`

function toKey(city: string, state: string): CityKey {
  return `${city}|${state}`;
}

function slugifyCityState(city: string, state: string): string {
  return `${city.toLowerCase().replace(/\s+/g, "-")}-${state.toLowerCase()}`;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main() {
  console.log("Fetching SNFs with v2 scores...");
  const { data, error } = await supabase
    .from("resources")
    // Select full row to tolerate column differences across environments
    .select(`*, facility_scores!inner(score, version)`) 
    .in("provider_type", ["nursing_home", "skilled_nursing_facility"]) // SNFs
    .eq("facility_scores.version", "v2")
    .not("city", "is", null);

  if (error) {
    console.error("Supabase error:", error);
    process.exit(1);
  }

  const facilities: Row[] = (data || []) as any;

  // Group by city (derive state by majority vote)
  const byCity = new Map<string, Row[]>();
  for (const r of facilities) {
    const city = (r.city || "").toString().trim();
    if (!city) continue;
    const key = city;
    const list = byCity.get(key) || [];
    list.push(r);
    byCity.set(key, list);
  }

  // Rank cities by SNF count
  const rankedCities = Array.from(byCity.entries())
    .map(([city, rows]) => ({ city, rows, count: rows.length }))
    .sort((a, b) => b.count - a.count);

  const topN = rankedCities.slice(0, 50);

  // Build featured cities JSON
  const featured = topN.map(({ city, rows }) => {
    // Derive state by majority from states[0]
    const votes = new Map<string, number>();
    rows.forEach(r => {
      const st = Array.isArray((r as any).states) && (r as any).states[0] ? String((r as any).states[0]).trim() : '';
      if (!st) return;
      votes.set(st, (votes.get(st) || 0) + 1);
    });
    const state = Array.from(votes.entries()).sort((a,b)=>b[1]-a[1])[0]?.[0] || '';
    return { city, state, slug: state ? slugifyCityState(city, state) : city.toLowerCase().replace(/\s+/g,'-') };
  });

  const featuredPath = path.join(process.cwd(), "data", "featured-cities.json");
  fs.mkdirSync(path.dirname(featuredPath), { recursive: true });
  fs.writeFileSync(featuredPath, JSON.stringify(featured, null, 2));
  console.log(`✔ Wrote featured cities JSON (${featured.length}) → ${featuredPath}`);

  // Build narrative rankings Markdown
  const lines: string[] = [];
  lines.push("# Top 50 U.S. Metro Areas by Skilled Nursing Facilities (SNFs)");
  lines.push("");
  lines.push("This report ranks U.S. metro areas by the number of nursing homes (SNFs) with SunsetWell v2 scores and provides a short narrative for each metro’s quality landscape.");
  lines.push("");

  for (const { city, rows, count } of topN) {
    // Derive state by majority
    const votes = new Map<string, number>();
    rows.forEach(r => {
      const st = Array.isArray((r as any).states) && (r as any).states[0] ? String((r as any).states[0]).trim() : '';
      if (!st) return;
      votes.set(st, (votes.get(st) || 0) + 1);
    });
    const state = Array.from(votes.entries()).sort((a,b)=>b[1]-a[1])[0]?.[0] || '';
    const scores = rows
      .map(r => (Array.isArray((r as any).facility_scores) && (r as any).facility_scores[0] ? (r as any).facility_scores[0].score as number : 0))
      .filter(n => typeof n === "number");
    const avgScore = avg(scores);
    const medScore = median(scores);
    const pctHigh = Math.round((scores.filter(s => s >= 75).length / scores.length) * 100);

    const sortedByScoreDesc = [...rows].sort((a, b) => {
      const sa = (Array.isArray((a as any).facility_scores) && (a as any).facility_scores[0]?.score) || 0;
      const sb = (Array.isArray((b as any).facility_scores) && (b as any).facility_scores[0]?.score) || 0;
      return sb - sa;
    });
    const top15 = sortedByScoreDesc.slice(0, 15);

    lines.push(`## ${city}${state ? ", " + state : ""} — ${count} SNFs`);
    lines.push("");
    lines.push(`- Average SunsetWell Score: ${avgScore.toFixed(1)} (median ${medScore.toFixed(1)})`);
    lines.push(`- High-performing share (≥ 75): ${pctHigh}%`);
    lines.push("");

    // Narrative
    const qualityTrend = pctHigh >= 40 ? "a sizable cluster of high-performing facilities" : pctHigh >= 20 ? "a meaningful group of above-average performers" : "a smaller share of top performers";
    lines.push(
      `Overall, ${city} shows ${qualityTrend}. The average SunsetWell score of ${avgScore.toFixed(1)} ` +
      `suggests ${avgScore >= 75 ? "generally excellent" : avgScore >= 60 ? "solid" : "mixed"} quality across the market. ` +
      `Families should still compare options on inspection history, staffing hours, and care stability.`
    );
    lines.push("");

    // Table header
    lines.push(`| # | Facility | SunsetWell | Health | Staffing | Quality | RN hrs | Total nurse hrs |`);
    lines.push(`|:-:|:---------|-----------:|-------:|---------:|--------:|------:|----------------:|`);

    const get = (o: any, k: string): number | null => (typeof o?.[k] === 'number' ? o[k] : null);
    const fmt = (n: number | null, d = 1) => (n == null ? '—' : n.toFixed(d));

    top15.forEach((r, i) => {
      const score = (Array.isArray((r as any).facility_scores) && (r as any).facility_scores[0]?.score) || 0;
      const health = get(r, 'health_inspection_rating');
      const staffing = get(r, 'staffing_rating');
      const quality = get(r, 'quality_measure_rating');
      const rnHrs = get(r, 'rn_staffing_hours_per_resident_per_day');
      const totalHrs = get(r, 'total_nurse_staffing_hours_per_resident_per_day') ?? get(r, 'total_nurse_hours_per_resident_per_day');
      lines.push(`| ${i + 1} | ${(r as any).title} | ${score.toFixed(0)} | ${fmt(health, 0)} | ${fmt(staffing, 0)} | ${fmt(quality, 0)} | ${fmt(rnHrs)} | ${fmt(totalHrs)} |`);
    });
    lines.push("");
  }

  const outPath = path.join(process.cwd(), "docs", "METRO-RANKINGS-50.md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n"));
  console.log(`✔ Wrote rankings narrative → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
