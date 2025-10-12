import { supabaseServer } from "@/lib/supabase/server";

export interface LocationFacility {
  id: string;
  title: string;
  provider_type: string;
  city: string | null;
  states: string[] | null;
  address: string | null;
  phone: string | null;
  sunsetwell_score: number;
  // Specific metrics for description
  health_inspection_rating?: number | null;
  staffing_rating?: number | null;
  quality_measure_rating?: number | null;
  total_nurse_hours_per_resident_per_day?: number | null;
}

export interface LocationStats {
  totalFacilities: number;
  avgScore: number;
  topFacilities: LocationFacility[];
  providerTypeBreakdown: Record<string, number>;
}

/**
 * Parse location slug into city and state
 * Example: "los-angeles-ca" -> { city: "Los Angeles", state: "CA" }
 */
export function parseLocationSlug(slug: string): { city: string; state: string } | null {
  const parts = slug.split("-");
  if (parts.length < 2) return null;

  // Last part should be 2-letter state code
  const state = parts[parts.length - 1].toUpperCase();
  if (state.length !== 2) return null;

  // Everything before the last part is the city name
  const city = parts
    .slice(0, -1)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return { city, state };
}

/**
 * Get top facilities and statistics for a specific location
 */
export async function getLocationData(
  city: string,
  state: string
): Promise<LocationStats | null> {
  console.log('[getLocationData] Starting query for', city, state);
  console.log('[getLocationData] Environment check:');
  console.log('[getLocationData] - SUPABASE_URL present:', !!process.env.SUPABASE_URL);
  console.log('[getLocationData] - NEXT_PUBLIC_SUPABASE_URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('[getLocationData] - SUPABASE_SERVICE_ROLE_KEY present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('[getLocationData] - Runtime:', process.env.NEXT_RUNTIME || 'nodejs');

  const supabase = supabaseServer;

  // Query facilities with scores in this location
  // Note: states is an array, so we use contains operator
  const { data, error } = await supabase
    .from("resources")
    .select(
      `
      id,
      title,
      provider_type,
      city,
      states,
      street_address,
      health_inspection_rating,
      staffing_rating,
      quality_measure_rating,
      total_nurse_hours_per_resident_per_day,
      facility_scores!inner(score, version)
    `
    )
    .eq("facility_scores.version", "v2")
    .ilike("city", `%${city}%`)
    .contains("states", [state]);

  if (error) {
    console.error("[getLocationData] Error fetching location data for", city, state);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Process facilities with scores
  const facilities: LocationFacility[] = data
    .filter((facility) => {
      const scores = facility.facility_scores as unknown as Array<{ score: number }>;
      return Array.isArray(scores) && scores.length > 0;
    })
    .map((facility) => {
      const scores = facility.facility_scores as unknown as Array<{ score: number }>;
      return {
        id: facility.id,
        title: facility.title,
        provider_type: facility.provider_type ?? "Unknown",
        city: facility.city,
        states: facility.states,
        address: facility.street_address,
        phone: null,
        sunsetwell_score: scores[0].score,
        health_inspection_rating: facility.health_inspection_rating,
        staffing_rating: facility.staffing_rating,
        quality_measure_rating: facility.quality_measure_rating,
        total_nurse_hours_per_resident_per_day: facility.total_nurse_hours_per_resident_per_day,
      };
    })
    .sort((a, b) => b.sunsetwell_score - a.sunsetwell_score); // Sort by score descending

  console.log("[getLocationData] Processed", facilities.length, "facilities with scores for", city, state);

  if (facilities.length === 0) {
    console.log("[getLocationData] No facilities with scores for", city, state);
    return null;
  }

  // Calculate statistics
  const totalFacilities = facilities.length;
  const avgScore =
    facilities.reduce((sum, f) => sum + f.sunsetwell_score, 0) / totalFacilities;

  const providerTypeBreakdown: Record<string, number> = {};
  facilities.forEach((f) => {
    providerTypeBreakdown[f.provider_type] =
      (providerTypeBreakdown[f.provider_type] ?? 0) + 1;
  });

  return {
    totalFacilities,
    avgScore,
    topFacilities: facilities.slice(0, 20), // Top 20 for the page
    providerTypeBreakdown,
  };
}

/**
 * Get all unique city-state combinations that have facilities with scores
 * Used for generating static params
 */
export async function getAvailableLocations(): Promise<
  Array<{ city: string; state: string }>
> {
  const supabase = supabaseServer;

  const { data, error } = await supabase
    .from("resources")
    .select("city, states, facility_scores!inner(score, version)")
    .eq("facility_scores.version", "v2")
    .not("city", "is", null)
    .not("states", "is", null);

  if (error) {
    console.error("Error fetching available locations:", error);
    return [];
  }

  // Get unique city-state combinations
  const locationSet = new Set<string>();
  const locations: Array<{ city: string; state: string }> = [];

  data?.forEach((row) => {
    if (row.city && Array.isArray(row.states) && row.states.length > 0) {
      // Use first state in the array
      const state = row.states[0];
      const key = `${row.city}|${state}`;
      if (!locationSet.has(key)) {
        locationSet.add(key);
        locations.push({ city: row.city, state });
      }
    }
  });

  return locations;
}

/**
 * Get the top N city/state combinations by facility count (with v2 scores)
 * Useful for populating the /locations index with “featured” cities.
 */
export async function getTopRankedLocations(limit: number = 51): Promise<
  Array<{ city: string; state: string; count: number }>
> {
  const supabase = supabaseServer;

  const { data, error } = await supabase
    .from("resources")
    .select("city, states, facility_scores!inner(score, version)")
    .eq("facility_scores.version", "v2")
    .not("city", "is", null)
    .not("states", "is", null);

  if (error) {
    console.error("Error computing top-ranked locations:", error);
    return [];
  }

  const counts = new Map<string, { city: string; state: string; count: number }>();
  (data || []).forEach((row: { city?: string | null; states?: unknown }) => {
    const city = typeof row.city === 'string' ? row.city.trim() : '';
    const statesArr = Array.isArray(row.states) ? row.states as Array<string> : [];
    const st = statesArr[0] ? String(statesArr[0]).trim() : '';
    if (!city || !st) return;
    const key = `${city}|${st}`;
    const prev = counts.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      counts.set(key, { city, state: st, count: 1 });
    }
  });

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
    .slice(0, limit);
}

/**
 * Generate a location slug from city and state
 * Example: "Los Angeles", "CA" -> "los-angeles-ca"
 */
export function generateLocationSlug(city: string, state: string): string {
  return `${city.toLowerCase().replace(/\s+/g, "-")}-${state.toLowerCase()}`;
}
