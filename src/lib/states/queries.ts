import { supabaseServer } from "@/lib/supabase/server";

export interface StateStatistics {
  state: string;
  totalFacilities: number;
  totalSkilledNursing: number;
  totalAssistedLiving: number;
  totalHomeHealth: number;
  averageScore: number;
  medianScore: number;
  highPerformingCount: number; // Score >= 75
  highPerformingPercentage: number;
  averageCMSRating: number | null;
  facilitiesWithScores: number;
  medicaidAcceptanceRate: number | null;
  medicareAcceptanceRate: number | null;
}

export interface StateFacility {
  id: string;
  facilityId: string | null;
  title: string;
  providerType: string | null;
  city: string | null;
  address: string | null;
  zipCode: string | null;
  phone: string | null;
  website: string | null;
  sunsetwellScore: number;
  sunsetwellPercentile: number | null;
  overallRating: number | null;
  healthInspectionRating: number | null;
  staffingRating: number | null;
  qualityMeasureRating: number | null;
}

export interface StateCityCount {
  city: string;
  count: number;
}

/**
 * Get comprehensive statistics for a state
 * Optimized with selective column fetching
 */
export async function getStateStatistics(stateCode: string): Promise<StateStatistics | null> {
  const upperState = stateCode.toUpperCase();

  // Get only essential data for statistics - optimized query
  const { data: facilities, error } = await supabaseServer
    .from("resources")
    .select(`
      id,
      provider_type,
      sunsetwell_scores!inner(overall_score, overall_percentile)
    `)
    .contains("states", [upperState])
    .order("overall_score", { ascending: false, referencedTable: "sunsetwell_scores" });

  if (error || !facilities || facilities.length === 0) {
    console.error("[getStateStatistics] Error or no facilities found:", error);
    return null;
  }

  // Calculate statistics
  const scores = facilities
    .map((f) => {
      const scoreData = Array.isArray(f.sunsetwell_scores) ? f.sunsetwell_scores[0] : null;
      return scoreData?.overall_score ?? null;
    })
    .filter((s): s is number => s !== null);

  // Note: overall_rating, accepts_medicaid, accepts_medicare not fetched to optimize query speed
  const ratings: number[] = [];
  const medicaidFacilities = 0;
  const medicareFacilities = 0;

  const totalFacilities = facilities.length;
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const sortedScores = [...scores].sort((a, b) => a - b);
  const medianScore =
    sortedScores.length > 0
      ? sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)]
      : 0;

  const highPerformingCount = scores.filter((s) => s >= 75).length;
  const highPerformingPercentage = totalFacilities > 0 ? (highPerformingCount / totalFacilities) * 100 : 0;

  const averageCMSRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  // Count by provider type
  const snfCount = facilities.filter((f) => f.provider_type === "nursing_home").length;
  const alfCount = facilities.filter((f) => f.provider_type === "assisted_living").length;
  const hhCount = facilities.filter((f) => f.provider_type === "home_health").length;

  const medicaidRate = totalFacilities > 0 ? (medicaidFacilities / totalFacilities) * 100 : null;
  const medicareRate = totalFacilities > 0 ? (medicareFacilities / totalFacilities) * 100 : null;

  return {
    state: upperState,
    totalFacilities,
    totalSkilledNursing: snfCount,
    totalAssistedLiving: alfCount,
    totalHomeHealth: hhCount,
    averageScore: Math.round(averageScore * 10) / 10,
    medianScore: Math.round(medianScore * 10) / 10,
    highPerformingCount,
    highPerformingPercentage: Math.round(highPerformingPercentage * 10) / 10,
    averageCMSRating: averageCMSRating ? Math.round(averageCMSRating * 10) / 10 : null,
    facilitiesWithScores: scores.length,
    medicaidAcceptanceRate: medicaidRate ? Math.round(medicaidRate * 10) / 10 : null,
    medicareAcceptanceRate: medicareRate ? Math.round(medicareRate * 10) / 10 : null,
  };
}

/**
 * Get top facilities in a state
 * Optimized to fetch only top N facilities, not all facilities
 */
export async function getTopStateFacilities(stateCode: string, limit = 20): Promise<StateFacility[]> {
  const upperState = stateCode.toUpperCase();

  const { data, error } = await supabaseServer
    .from("resources")
    .select(`
      id,
      facility_id,
      title,
      provider_type,
      city,
      street_address,
      zip_code,
      contact_phone,
      url,
      health_inspection_rating,
      staffing_rating,
      quality_measure_rating,
      sunsetwell_scores!inner(overall_score, overall_percentile)
    `)
    .contains("states", [upperState])
    .order("overall_score", { ascending: false, referencedTable: "sunsetwell_scores" })
    .limit(limit);

  if (error || !data) {
    console.error("[getTopStateFacilities] Error:", error);
    return [];
  }

  return data.map((row) => {
    const scoreData = Array.isArray(row.sunsetwell_scores) ? row.sunsetwell_scores[0] : null;
    return {
      id: row.id,
      facilityId: row.facility_id ?? null,
      title: row.title,
      providerType: row.provider_type ?? null,
      city: row.city ?? null,
      address: row.street_address ?? null,
      zipCode: row.zip_code ?? null,
      phone: row.contact_phone ?? null,
      website: row.url ?? null,
      sunsetwellScore: scoreData?.overall_score ?? 0,
      sunsetwellPercentile: scoreData?.overall_percentile ?? null,
      overallRating: null, // Removed to optimize query
      healthInspectionRating: row.health_inspection_rating ?? null,
      staffingRating: row.staffing_rating ?? null,
      qualityMeasureRating: row.quality_measure_rating ?? null,
    };
  });
}

/**
 * Get cities in a state with facility counts
 */
export async function getStateCities(stateCode: string, limit = 20): Promise<StateCityCount[]> {
  const upperState = stateCode.toUpperCase();

  const { data, error } = await supabaseServer
    .from("resources")
    .select("city")
    .contains("states", [upperState])
    .not("city", "is", null);

  if (error || !data) {
    console.error("[getStateCities] Error:", error);
    return [];
  }

  // Count cities
  const cityCounts = new Map<string, number>();
  data.forEach((row) => {
    const city = row.city as string;
    if (city) {
      cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    }
  });

  // Convert to array and sort by count
  return Array.from(cityCounts.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
