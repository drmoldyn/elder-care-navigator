import type { SessionContext } from "@/types/domain";
import { supabaseServer } from "@/lib/supabase/server";
import { haversineDistanceMiles } from "@/lib/location/distance";

export interface ResourceRecord {
  id?: string;
  latitude?: number | null;
  longitude?: number | null;
  quality_rating?: number | null;
  title?: string;
  category?: string[];
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  insurance_accepted?: string[] | null;
  available_beds?: number | null;
  overall_rating?: number | null;
  sunsetwell_score?: number | null;
  facility_scores?: Array<{ score: number }> | null;
  service_area_match?: boolean;
  service_area_zip?: string;
  distance?: number;
  [key: string]: unknown;
}

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

type CareScope = "facility" | "home_services" | "both";

export const FACILITY_PROVIDER_TYPES = [
  "nursing_home",
  "assisted_living_facility",
  "skilled_nursing_facility",
  "memory_care_facility",
];

export const HOME_SERVICE_PROVIDER_TYPES = [
  "home_health_agency",
  "home_health",
  "home_care_agency",
  "hospice",
];

export const FACILITY_CATEGORIES = [
  "nursing_home",
  "assisted_living",
  "memory_care",
  "skilled_nursing",
];

export const HOME_SERVICE_CATEGORIES = [
  "home_health",
  "home_care",
  "hospice",
  "home_services",
];

/**
 * Build filters from session context
 */
export function buildFiltersFromSession(
  session: SessionContext,
  scope: CareScope = (session.careType ?? "facility") as CareScope
): MatchFilters {
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

  const categories = new Set<string>();
  const providerTypes = new Set<string>();

  const carePreference = scope;

  if (carePreference === "facility" || carePreference === "both") {
    FACILITY_CATEGORIES.forEach((category) => categories.add(category));
    FACILITY_PROVIDER_TYPES.forEach((type) => providerTypes.add(type));
  }

  if (carePreference === "home_services" || carePreference === "both") {
    HOME_SERVICE_CATEGORIES.forEach((category) => categories.add(category));
    HOME_SERVICE_PROVIDER_TYPES.forEach((type) => providerTypes.add(type));
  }

  if (categories.size > 0) {
    filters.categories = Array.from(categories);
  }

  if (providerTypes.size > 0) {
    filters.providerTypes = Array.from(providerTypes);
  }

  if (session.insuranceTypes && session.insuranceTypes.length > 0) {
    filters.insuranceTypes = session.insuranceTypes;
  }

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

async function fetchFacilityResources(
  session: SessionContext
): Promise<ResourceRecord[]> {
  const filters = buildFiltersFromSession(session, "facility");

  let query = supabaseServer
    .from("resources")
    .select(`
      *,
      facility_scores!left(score, version, calculated_at)
    `)
    .eq("facility_scores.version", "v2")
    .order("calculated_at", { ascending: false, referencedTable: "facility_scores" })
    .limit(1, { referencedTable: "facility_scores" });

  if (filters.zipCodes && filters.zipCodes.length > 0) {
    const primaryZip = filters.zipCodes[0];
    const radiusMiles = filters.searchRadiusMiles || 50;
    const proximityPrefixes = getProximityZips(primaryZip, radiusMiles);
    const zipConditions = proximityPrefixes.map((prefix) => `zip_code.like.${prefix}%`);
    query = query.or(zipConditions.join(","));
  } else if (filters.states && filters.states.length > 0) {
    query = query.contains("states", filters.states);
  }

  if (filters.providerTypes && filters.providerTypes.length > 0) {
    query = query.in("provider_type", filters.providerTypes);
  }

  if (filters.categories && filters.categories.length > 0) {
    query = query.overlaps("category", filters.categories);
  }

  if (filters.insuranceTypes && filters.insuranceTypes.length > 0) {
    const insuranceConditions = filters.insuranceTypes
      .map((type) => {
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
      })
      .filter(Boolean);

    if (insuranceConditions.length > 0) {
      query = query.or(insuranceConditions.join(","));
    }
  }

  if (filters.minQualityRating !== undefined) {
    query = query.gte("quality_rating", filters.minQualityRating);
  }

  query = query.order("quality_rating", { ascending: false, nullsFirst: false });
  query = query.order("title", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("SQL matching error:", error);
    throw new Error(`Failed to match resources: ${error.message}`);
  }

  // Process facility_scores join to extract sunsetwell_score
  const processed = (data ?? []).map((resource: ResourceRecord) => {
    const score = Array.isArray(resource.facility_scores) && resource.facility_scores.length > 0
      ? resource.facility_scores[0].score
      : null;

    return {
      ...resource,
      sunsetwell_score: typeof score === "number" ? score : null,
    };
  });

  return processed as ResourceRecord[];
}

export async function fetchHomeServiceResources(
  session: SessionContext
): Promise<ResourceRecord[]> {
  const zipCode = session.zipCode?.slice(0, 5);

  if (!zipCode) {
    return [];
  }

  const { data: serviceAreas, error } = await supabaseServer
    .from("home_health_service_areas")
    .select("ccn")
    .eq("zip_code", zipCode);

  if (error) {
    console.error("Service area lookup failed:", error);
    return [];
  }

  const ccns = Array.from(
    new Set((serviceAreas ?? []).map((row) => row.ccn).filter((ccn): ccn is string => Boolean(ccn)))
  );

  if (ccns.length === 0) {
    return [];
  }

  const { data: agencies, error: agencyError } = await supabaseServer
    .from("resources")
    .select("*")
    .in("facility_id", ccns)
    .in("provider_type", HOME_SERVICE_PROVIDER_TYPES);

  if (agencyError) {
    console.error("Failed to load home service agencies:", agencyError);
    return [];
  }

  const unique = new Map<string, ResourceRecord>();
  (agencies ?? []).forEach((agency) => {
    const id = String(agency.id ?? "");
    if (!id) {
      return;
    }
    unique.set(id, {
      ...agency,
      service_area_match: true,
      service_area_zip: zipCode,
    });
  });

  return Array.from(unique.values());
}

/**
 * Main SQL-based matching function
 * Returns ALL matching facilities (no artificial limit)
 */
export async function matchResourcesSQL(
  session: SessionContext
): Promise<ResourceRecord[]> {
  const carePreference = (session.careType ?? "facility") as CareScope;

  const shouldIncludeFacilities = carePreference === "facility" || carePreference === "both";
  const shouldIncludeHomeServices = carePreference === "home_services" || carePreference === "both";

  const uniqueResources = new Map<string, ResourceRecord>();
  const orderedResults: ResourceRecord[] = [];

  const addResource = (resource: ResourceRecord) => {
    const id = String(resource.id ?? "");
    if (!id || uniqueResources.has(id)) {
      return;
    }
    uniqueResources.set(id, resource);
    orderedResults.push(resource);
  };

  if (shouldIncludeFacilities) {
    let facilityResources = await fetchFacilityResources(session);

    const userLat = typeof session.latitude === "number" ? session.latitude : null;
    const userLng = typeof session.longitude === "number" ? session.longitude : null;
    const radiusMiles = session.searchRadiusMiles ?? 50;

    if (facilityResources.length > 0 && userLat !== null && userLng !== null) {
      facilityResources = facilityResources
        .map((resource) => {
          if (typeof resource.latitude === "number" && typeof resource.longitude === "number") {
            const distance = haversineDistanceMiles(
              userLat,
              userLng,
              resource.latitude,
              resource.longitude
            );
            return { ...resource, distance } as ResourceRecord;
          }
          return resource;
        })
        .filter((resource) => {
          if (typeof resource.distance === "number") {
            return resource.distance <= radiusMiles;
          }
          return true;
        })
        .sort((a, b) => {
          if (typeof a.distance === "number" && typeof b.distance === "number") {
            return a.distance - b.distance;
          }
          if (typeof a.distance === "number") return -1;
          if (typeof b.distance === "number") return 1;
          return 0;
        });
    }

    facilityResources.forEach(addResource);
  }

  if (shouldIncludeHomeServices) {
    const homeServices = await fetchHomeServiceResources(session);
    homeServices.forEach(addResource);
  }

  return orderedResults;
}

/**
 * Add additional search locations (e.g., near multiple family members)
 */
export async function matchResourcesMultipleLocations(
  session: SessionContext,
  additionalZips: string[]
): Promise<ResourceRecord[]> {
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
  const uniqueMatches = new Map<string, ResourceRecord>();
  for (const matches of allMatches) {
    for (const match of matches) {
      const resourceId = String(match.id ?? "");
      if (!resourceId) {
        continue;
      }
      if (!uniqueMatches.has(resourceId)) {
        uniqueMatches.set(resourceId, match);
      }
    }
  }

  return Array.from(uniqueMatches.values());
}
