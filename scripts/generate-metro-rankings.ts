#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import metros from "../data/top-50-metros.json" assert { type: "json" };

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
  facility_id?: string | null;
  title: string;
  city: string | null;
  states: string[] | null;
  provider_type: string | null;
  overall_rating: number | null;
  health_inspection_rating: number | null;
  staffing_rating: number | null;
  total_nurse_hours_per_resident_per_day: number | null;
  sunsetwell_scores: Array<{ overall_score: number; overall_percentile: number; calculation_date: string }>;
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

function snfType(pt: string | null | undefined): 'SNF' | 'OTHER' {
  return pt === 'nursing_home' || pt === 'skilled_nursing_facility' ? 'SNF' : 'OTHER';
}

function percentile(score: number, dist: number[]): number {
  if (!dist.length) return 0;
  const sorted = [...dist].sort((a, b) => a - b);
  // Find index of last value <= score (binary search)
  let lo = 0, hi = sorted.length - 1, pos = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= score) { pos = mid; lo = mid + 1; } else { hi = mid - 1; }
  }
  if (pos < 0) return 0;
  if (sorted.length === 1) return 100;
  const p = Math.round((pos / (sorted.length - 1)) * 100);
  return Math.max(0, Math.min(100, p));
}

async function main() {
  console.log("Fetching SNFs with SunsetWell scores...");
  const { data, error } = await supabase
    .from("resources")
    .select(`id, facility_id, title, city, states, provider_type, health_inspection_rating, staffing_rating, quality_measure_rating, sunsetwell_scores!inner(overall_score, overall_percentile, calculation_date)`)
    .in("provider_type", ["nursing_home", "skilled_nursing_facility"]) // SNFs
    .not("city", "is", null);

  if (error) {
    console.error("Supabase error:", error);
    process.exit(1);
  }

  // Filter to only facilities with sunsetwell_scores and take most recent score if multiple
  const facilities: Row[] = ((data || []) as any[]).filter(f => {
    const scores = (f as any).sunsetwell_scores;
    if (!Array.isArray(scores) || scores.length === 0) return false;
    // Sort by date descending and keep only the most recent
    scores.sort((a: any, b: any) => new Date(b.calculation_date).getTime() - new Date(a.calculation_date).getTime());
    (f as any).sunsetwell_scores = [scores[0]];
    return true;
  });

  // Precompute peer distributions by state for SNFs
  const peerScores = new Map<string, number[]>(); // key `${state}|SNF` or `US|SNF`
  const pushPeer = (key: string, score: number) => {
    const arr = peerScores.get(key) || [];
    arr.push(score);
    peerScores.set(key, arr);
  };

  for (const f of facilities) {
    if (snfType(f.provider_type) !== 'SNF') continue;
    const sc = Array.isArray((f as any).sunsetwell_scores) && (f as any).sunsetwell_scores[0]
      ? (f as any).sunsetwell_scores[0].overall_score as number
      : undefined;
    if (typeof sc !== 'number') continue;
    const st = Array.isArray((f as any).states) && (f as any).states[0] ? String((f as any).states[0]).trim() : '';
    if (st) pushPeer(`${st}|SNF`, sc);
    pushPeer('US|SNF', sc);
  }

  // Use predefined Top 50 metros by population
  type Metro = { name: string; city: string; state: string };
  const metroList: Metro[] = metros as any;

  // Distance helpers
  function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.7613; // miles
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  const DEFAULT_RADIUS = Number(process.env.METRO_RADIUS_MILES || 150);

  // Index facilities by uppercase city for quick match
  const byCity = new Map<string, Row[]>();
  for (const r of facilities) {
    const city = (r.city || "").toString().trim().toUpperCase();
    if (!city) continue;
    const list = byCity.get(city) || [];
    list.push(r);
    byCity.set(city, list);
  }

  // Extract all city names from metro name (e.g., "New York–Newark–Jersey City" → ["New York", "Newark", "Jersey City"])
function extractCitiesFromMetro(metroName: string): string[] {
  return metroName
    .split(/[–—-]/) // Split on dashes/hyphens
    .map(s => s.trim())
    .filter(s => s.length > 0 && !/^(The|County)$/i.test(s)); // Remove "The", "County"
}

  // Multi-state allowances for major multi-state metros
  const METRO_STATES: Record<string, string[]> = {
    'New York–Newark–Jersey City': ['NY', 'NJ', 'PA'],
    'Chicago–Naperville–Elgin': ['IL', 'IN', 'WI'],
    'Washington–Arlington–Alexandria': ['DC', 'VA', 'MD'],
  };

  // City alias expansions to better capture metro area facilities
  const METRO_CITY_ALIASES: Record<string, string[]> = {
    'New York–Newark–Jersey City': ['Brooklyn', 'Bronx', 'Queens', 'Staten Island', 'Manhattan'],
    'Los Angeles–Long Beach–Anaheim': ['Santa Ana', 'Glendale', 'Pasadena', 'Torrance', 'Inglewood', 'Burbank', 'Fullerton', 'Garden Grove', 'Huntington Beach'],
    'Chicago–Naperville–Elgin': ['Evanston', 'Skokie', 'Cicero', 'Oak Park', 'Schaumburg', 'Arlington Heights'],
    'San Francisco–Oakland–Berkeley': ['San Mateo', 'Redwood City', 'Daly City', 'Fremont', 'San Leandro', 'Hayward', 'Walnut Creek'],
    'Seattle–Tacoma–Bellevue': ['Redmond', 'Kirkland', 'Renton', 'Kent', 'Federal Way', 'Auburn'],
  };

  const topN = metroList.map(m => {
    const cities = extractCitiesFromMetro(m.name);
    const allowedStates = METRO_STATES[m.name] || [m.state];
    const expandedCities = [...cities, ...(METRO_CITY_ALIASES[m.name] || [])];
    const BROAD_CITY_ALIASES: Record<string, string[]> = {
      'New York–Newark–Jersey City': [
        'Yonkers','New Rochelle','Mount Vernon','White Plains','Hoboken','Bayonne','Union City','West New York','Fort Lee','Clifton','Passaic','Hackensack','Paterson','Elizabeth','Staten Island','Brooklyn','Bronx','Queens','Manhattan','Newark','Jersey City'
      ],
      'Los Angeles–Long Beach–Anaheim': [
        'Santa Monica','Beverly Hills','Santa Ana','Glendale','Pasadena','Torrance','Inglewood','Burbank','Fullerton','Garden Grove','Huntington Beach','Irvine','Anaheim','Long Beach','Los Angeles'
      ],
      'Chicago–Naperville–Elgin': [
        'Evanston','Skokie','Cicero','Oak Park','Schaumburg','Arlington Heights','Naperville','Elgin','Chicago'
      ],
    };
    const allRows: Row[] = [];
    const topUpIds = new Set<string>();
    const seen = new Set<string>();

    // Match facilities from any city in the metro area, filtering by state
    for (const cityName of expandedCities) {
      const cityRows = byCity.get(cityName.toUpperCase()) || [];
      for (const row of cityRows) {
        const facilityId = (row as any).facility_id || (row as any).id;
        const facilityState = Array.isArray((row as any).states) && (row as any).states[0] ? String((row as any).states[0]).trim() : '';

        // Match if facility is in the metro's state set
        if (facilityId && !seen.has(facilityId) && (allowedStates.includes(facilityState))) {
          allRows.push(row);
          seen.add(facilityId);
        }
      }
    }

    // Apply radius filter using centroid of defining city (or expanded cities) if available
    let centroid: { lat: number; lon: number } | null = null;
    const anchor = byCity.get(m.city.toUpperCase()) || [];
    const anchorWithCoords = anchor.filter(r => typeof (r as any).latitude === 'number' && typeof (r as any).longitude === 'number');
    const expandedWithCoords = allRows.filter(r => typeof (r as any).latitude === 'number' && typeof (r as any).longitude === 'number');
    const centroidSource = anchorWithCoords.length > 0 ? anchorWithCoords : expandedWithCoords;
    if (centroidSource.length > 0) {
      const sum = centroidSource.reduce((acc, r: any) => ({ lat: acc.lat + Number(r.latitude), lon: acc.lon + Number(r.longitude) }), { lat: 0, lon: 0 });
      centroid = { lat: sum.lat / centroidSource.length, lon: sum.lon / centroidSource.length };
    }
    if (centroid) {
      const within = allRows.filter((r: any) => {
        const lat = Number(r.latitude);
        const lon = Number(r.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
        const d = haversineMiles(centroid!.lat, centroid!.lon, lat, lon);
        return d <= DEFAULT_RADIUS;
      });
      // If we have at least 12 within radius, prefer within and skip top-ups beyond radius
      if (within.length >= 12) {
        // Replace allRows with within and mark seen accordingly
        seen.clear();
        allRows.length = 0;
        for (const r of within) {
          allRows.push(r);
          const fid = (r as any).facility_id || (r as any).id;
          if (fid) seen.add(String(fid));
        }
        // Guard: set a flag to bypass broad/state top-ups to keep fewer than 20 allowed
        if (allRows.length < 20) {
          // We will not fill further unless below 12 (handled below). So do nothing here.
        }
      }
    }

    // If we still have fewer than 20, top up with best-scoring facilities from broader alias cities within allowed states
    if (allRows.length < 12) {
      const broad = BROAD_CITY_ALIASES[m.name] || [];
      const broadUpper = new Set(broad.map(c => c.toUpperCase()));
      const broadCandidates: Row[] = [];
      for (const cityName of broadUpper) {
        const rowsForCity = byCity.get(cityName) || [];
        for (const r of rowsForCity) {
          const st = Array.isArray((r as any).states) && (r as any).states[0] ? String((r as any).states[0]).trim() : '';
          const fid = (r as any).facility_id || (r as any).id;
          if (fid && !seen.has(fid) && allowedStates.includes(st)) {
            broadCandidates.push(r);
            seen.add(fid);
          }
        }
      }
      broadCandidates.sort((a, b) => {
        const sa = (Array.isArray((a as any).sunsetwell_scores) && (a as any).sunsetwell_scores[0]?.overall_score) || 0;
        const sb = (Array.isArray((b as any).sunsetwell_scores) && (b as any).sunsetwell_scores[0]?.overall_score) || 0;
        return sb - sa;
      });
      for (const r of broadCandidates) {
        if (allRows.length >= 20) break;
        const fid = (r as any).facility_id || (r as any).id;
        allRows.push(r);
        if (fid) topUpIds.add(String(fid));
      }
    }

    // Final fallback: if still fewer than 20, fill from any facilities in allowed states by top score
    if (allRows.length < 12) {
      const stateCandidates = facilities
        .filter(r => {
          const st = Array.isArray((r as any).states) && (r as any).states[0] ? String((r as any).states[0]).trim() : '';
          const fid = (r as any).facility_id || (r as any).id;
          return fid && !seen.has(fid) && allowedStates.includes(st);
        })
        .sort((a, b) => {
          const sa = (Array.isArray((a as any).sunsetwell_scores) && (a as any).sunsetwell_scores[0]?.overall_score) || 0;
          const sb = (Array.isArray((b as any).sunsetwell_scores) && (b as any).sunsetwell_scores[0]?.overall_score) || 0;
          return sb - sa;
        });
      for (const r of stateCandidates) {
        if (allRows.length >= 20) break;
        const fid = (r as any).facility_id || (r as any).id;
        allRows.push(r);
        seen.add(fid);
        if (fid) topUpIds.add(String(fid));
      }
    }

    return {
      city: m.city,
      state: m.state,
      rows: allRows,
      count: allRows.length,
      metaName: m.name,
      topUpIds: Array.from(topUpIds),
    } as const;
  });

  // Build featured cities JSON directly from metro list
  const featured = topN.map(m => ({ city: m.city, state: m.state, slug: slugifyCityState(m.city, m.state) }));

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

  for (const m of topN) {
    const { city, rows, count, metaName, state, topUpIds } = m as unknown as { city: string; rows: Row[]; count: number; metaName: string; state: string; topUpIds?: string[] };
    const scores = rows
      .map(r => (Array.isArray((r as any).sunsetwell_scores) && (r as any).sunsetwell_scores[0] ? (r as any).sunsetwell_scores[0].overall_score as number : 0))
      .filter(n => typeof n === "number");
    const avgScore = avg(scores);
    const medScore = median(scores);
    const pctHigh = Math.round((scores.filter(s => s >= 75).length / scores.length) * 100);

    const sortedByScoreDesc = [...rows].sort((a, b) => {
      const sa = (Array.isArray((a as any).sunsetwell_scores) && (a as any).sunsetwell_scores[0]?.overall_score) || 0;
      const sb = (Array.isArray((b as any).sunsetwell_scores) && (b as any).sunsetwell_scores[0]?.overall_score) || 0;
      return sb - sa;
    });
    const top15 = sortedByScoreDesc.slice(0, 15);

    lines.push(`## ${metaName} — ${count} SNFs`);
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
    lines.push(`| # | Facility | SunsetWell | Percentile | Health | Staffing | Quality | RN hrs | Total nurse hrs |`);
    lines.push(`|:-:|:---------|-----------:|----------:|-------:|---------:|--------:|------:|----------------:|`);

    const get = (o: any, k: string): number | null => (typeof o?.[k] === 'number' ? o[k] : null);
    const fmt = (n: number | null, d = 1) => (n == null ? '—' : n.toFixed(d));

    top15.forEach((r, i) => {
      const score = (Array.isArray((r as any).sunsetwell_scores) && (r as any).sunsetwell_scores[0]?.overall_score) || 0;
      const percentile = (Array.isArray((r as any).sunsetwell_scores) && (r as any).sunsetwell_scores[0]?.overall_percentile) || 0;
      const health = get(r, 'health_inspection_rating');
      const staffing = get(r, 'staffing_rating');
      const quality = get(r, 'quality_measure_rating');
      lines.push(`| ${i + 1} | ${(r as any).title} | ${score.toFixed(0)} | ${Math.round(percentile)} | ${fmt(health, 0)} | ${fmt(staffing, 0)} | ${fmt(quality, 0)} | — | — |`);
    });
    lines.push("");
  }

  const outPath = path.join(process.cwd(), "docs", "METRO-RANKINGS-50.md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n"));
  console.log(`✔ Wrote rankings narrative → ${outPath}`);

  // Write per-metro JSON payloads for site rendering
  const metrosDir = path.join(process.cwd(), "data", "metros");
  fs.mkdirSync(metrosDir, { recursive: true });
  for (const m of topN) {
    const { city, rows, count, metaName, state } = m as any;
    const topUpIds: string[] = (m as any).topUpIds || [];

    // Table rows
    const sorted = [...rows].sort((a, b) => {
      const sa = (Array.isArray((a as any).sunsetwell_scores) && (a as any).sunsetwell_scores[0]?.overall_score) || 0;
      const sb = (Array.isArray((b as any).sunsetwell_scores) && (b as any).sunsetwell_scores[0]?.overall_score) || 0;
      return sb - sa;
    }).slice(0, 30);

    const tbl = sorted.map((r, i) => {
      const score = (Array.isArray((r as any).sunsetwell_scores) && (r as any).sunsetwell_scores[0]?.overall_score) || 0;
      const percentile = (Array.isArray((r as any).sunsetwell_scores) && (r as any).sunsetwell_scores[0]?.overall_percentile) || 0;
      const health = typeof (r as any).health_inspection_rating === 'number' ? (r as any).health_inspection_rating : null;
      const staffing = typeof (r as any).staffing_rating === 'number' ? (r as any).staffing_rating : null;
      const quality = typeof (r as any).quality_measure_rating === 'number' ? (r as any).quality_measure_rating : null;
      const fid = (r as any).facility_id || (r as any).id;
      return {
        rank: i + 1,
        facilityId: fid,
        title: (r as any).title as string,
        score: Math.round(score),
        percentile: Math.round(percentile),
        health: health,
        staffing: staffing,
        quality: quality,
        rnHours: null,
        totalNurseHours: null,
        topUp: fid ? (topUpIds || []).includes(String(fid)) : false,
      };
    });

    const scoresForAvg = rows.map(r => ((Array.isArray((r as any).sunsetwell_scores) && (r as any).sunsetwell_scores[0]) ? (r as any).sunsetwell_scores[0].overall_score : 0) as number);
    const avgSc = avg(scoresForAvg);
    const qualityTier = avgSc >= 75 ? 'generally excellent' : avgSc >= 60 ? 'solid' : 'mixed';
    const highPerformers = tbl.filter(t => t.score >= 75).length;
    const performerTrend = rows.length ? (highPerformers / tbl.length >= 0.4 ? 'a sizable cluster of high-performing facilities' : (highPerformers / tbl.length >= 0.2 ? 'a meaningful group of above-average performers' : 'a smaller share of top performers')) : 'a smaller share of top performers';

    const summary = {
      metro: metaName,
      city,
      state,
      count,
      averageScore: avgSc.toFixed(1),
      highPerformerShare: Math.round((scoresForAvg.filter(s => s >= 75).length / (scoresForAvg.length || 1)) * 100),
      narrative: `Overall, ${city} shows ${performerTrend}. The average SunsetWell score suggests ${qualityTier} quality across the market. Families should still compare options on inspection history, staffing hours, and care stability.`,
      table: tbl,
    };

    const slug = metaName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const metroPath = path.join(metrosDir, `${slug}.json`);
    fs.writeFileSync(metroPath, JSON.stringify(summary, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
