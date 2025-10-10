import type { SessionContext } from "@/types/domain";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * SQL-based matching using database queries
 * No AI, no scoring - just direct filtering based on user criteria
 */

interface MatchFilters {
  zipCodes?: string[]; // Support multiple ZIPs (e.g., near multiple family members)
  states?: string[];
  searchRadiusMiles?: number; // Default: 50 miles
  insuranceTypes?: Array<"medicare" | "medicaid" | "private" | "veterans_affairs">;
  providerTypes?: string[];
  categories?: string[];
  minQualityRating?: number;
}

/**
 * Build filters from session context
 */
export function buildFiltersFromSession(session: SessionContext): MatchFilters {
  const filters: MatchFilters = {};

  // Location: Support multiple ZIPs/regions
  if (session.zipCode) {
    filters.zipCodes = [session.zipCode];
  }

  if (session.state) {
    filters.states = [session.state];
  }

  // Search radius (default 50 miles)
  filters.searchRadiusMiles = session.searchRadiusMiles || 50;

  // Default to looking for nursing homes and assisted living
  filters.categories = ["nursing_home", "assisted_living"];
  filters.providerTypes = ["nursing_home", "assisted_living_facility"];

  return filters;
}

/**
 * Calculate ZIP proximity based on search radius
 * Uses 3-digit ZIP prefix approximation
 *
 * Rough approximation:
 * - Same prefix (±0): ~30 miles
 * - ±1 prefix: ~100 miles
 * - ±2 prefix: ~250 miles
 * - ±3 prefix: ~400 miles
 */
function getProximityZips(zipCode: string, radiusMiles: number = 50): string[] {
  const prefix = zipCode.substring(0, 3);
  const prefixNum = parseInt(prefix, 10);

  // Map radius to ZIP prefix range
  let prefixRange: number;
  if (radiusMiles <= 30) {
    prefixRange = 0; // Same prefix only
  } else if (radiusMiles <= 100) {
    prefixRange = 1; // ±1 prefix (~100 miles)
  } else if (radiusMiles <= 250) {
    prefixRange = 2; // ±2 prefix (~250 miles)
  } else {
    prefixRange = 3; // ±3 prefix (~400 miles)
  }

  // Generate proximity prefixes
  const proximityPrefixes: string[] = [];
  for (let i = Math.max(0, prefixNum - prefixRange); i <= Math.min(999, prefixNum + prefixRange); i++) {
    proximityPrefixes.push(i.toString().padStart(3, "0"));
  }

  return proximityPrefixes;
}

/**
 * Main SQL-based matching function
 * Returns ALL matching facilities (no artificial limit)
 */
export async function matchResourcesSQL(
  session: SessionContext
): Promise<Array<any>> {
  const filters = buildFiltersFromSession(session);

  let query = supabaseServer
    .from("resources")
    .select("*");

  // Location filter with configurable search radius (default 50 miles)
  if (filters.zipCodes && filters.zipCodes.length > 0) {
    const primaryZip = filters.zipCodes[0];
    const radiusMiles = filters.searchRadiusMiles || 50; // Default to 50 miles
    const proximityPrefixes = getProximityZips(primaryZip, radiusMiles);

    // Match facilities within proximity
    const zipConditions = proximityPrefixes.map((prefix) => `zip_code.like.${prefix}%`);
    query = query.or(zipConditions.join(","));
  } else if (filters.states && filters.states.length > 0) {
    // State-level fallback if no ZIP provided
    query = query.contains("states", filters.states);
  }

  // Provider type filter
  if (filters.providerTypes && filters.providerTypes.length > 0) {
    query = query.in("provider_type", filters.providerTypes);
  }

  // Category filter
  if (filters.categories && filters.categories.length > 0) {
    query = query.overlaps("category", filters.categories);
  }

  // Insurance filter (if we add this to form later)
  if (filters.insuranceTypes && filters.insuranceTypes.length > 0) {
    const insuranceConditions = filters.insuranceTypes.map((type) => {
      switch (type) {
        case "medicare":
          return "medicare_accepted.eq.true";
        case "medicaid":
          return "medicaid_accepted.eq.true";
        case "private":
          return "private_insurance_accepted.eq.true";
        case "veterans_affairs":
          return "veterans_affairs_accepted.eq.true";
        default:
          return "";
      }
    }).filter(Boolean);

    if (insuranceConditions.length > 0) {
      query = query.or(insuranceConditions.join(","));
    }
  }

  // Quality filter (optional - only show 3+ star facilities)
  if (filters.minQualityRating !== undefined) {
    query = query.gte("quality_rating", filters.minQualityRating);
  }

  // Order by quality rating (best first), then alphabetically
  query = query.order("quality_rating", { ascending: false, nullsFirst: false });
  query = query.order("title", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("SQL matching error:", error);
    throw new Error(`Failed to match resources: ${error.message}`);
  }

  return data || [];
}

/**
 * Add additional search locations (e.g., near multiple family members)
 */
export async function matchResourcesMultipleLocations(
  session: SessionContext,
  additionalZips: string[]
): Promise<Array<any>> {
  // Combine primary ZIP with additional ZIPs
  const allZips = [
    ...(session.zipCode ? [session.zipCode] : []),
    ...additionalZips,
  ];

  // Run matching for each ZIP and combine results
  const allMatches = await Promise.all(
    allZips.map(async (zip) => {
      const modifiedSession = { ...session, zipCode: zip };
      return matchResourcesSQL(modifiedSession);
    })
  );

  // Deduplicate by facility_id
  const uniqueMatches = new Map();
  for (const matches of allMatches) {
    for (const match of matches) {
      if (!uniqueMatches.has(match.id)) {
        uniqueMatches.set(match.id, match);
      }
    }
  }

  return Array.from(uniqueMatches.values());
}
