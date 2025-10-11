import type { SessionContext } from "@/types/domain";
import { supabaseServer } from "@/lib/supabase/server";
import { calculateDistance, getBoundingBox, type Coordinates } from "@/lib/utils/distance";
import {
  FACILITY_CATEGORIES,
  FACILITY_PROVIDER_TYPES,
  fetchHomeServiceResources,
  type ResourceRecord,
} from "./sql-matcher";

interface MatchFilters {
  location?: Coordinates;
  searchRadiusMiles?: number;
  insuranceTypes?: Array<"medicare" | "medicaid" | "private" | "veterans_affairs">;
  providerTypes?: string[];
  categories?: string[];
  minQualityRating?: number;
}

async function geocodeZipCode(zipCode: string): Promise<Coordinates | null> {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("Google Geocoding API key not configured. Falling back to ZIP prefix matching.");
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode},USA&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  return null;
}

async function buildFacilityFiltersFromSession(session: SessionContext): Promise<MatchFilters> {
  const filters: MatchFilters = {};

  if (session.zipCode) {
    const location = await geocodeZipCode(session.zipCode);
    if (location) {
      filters.location = location;
    }
  }

  filters.searchRadiusMiles = session.searchRadiusMiles || 50;
  filters.categories = [...FACILITY_CATEGORIES];
  filters.providerTypes = [...FACILITY_PROVIDER_TYPES];

  return filters;
}

export async function matchResourcesGeocoded(
  session: SessionContext
): Promise<ResourceRecord[]> {
  const carePreference = session.careType ?? "facility";
  const includeFacilities = carePreference === "facility" || carePreference === "both";
  const includeHomeServices = carePreference === "home_services" || carePreference === "both";

  if (!includeFacilities) {
    if (!includeHomeServices) {
      return [];
    }

    return fetchHomeServiceResources(session);
  }

  const filters = await buildFacilityFiltersFromSession(session);

  if (!filters.location) {
    console.warn("No location found, using fallback matching");
    const { matchResourcesSQL } = await import("./sql-matcher");
    return matchResourcesSQL(session);
  }

  let query = supabaseServer
    .from("resources")
    .select("*")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  const bbox = getBoundingBox(filters.location, filters.searchRadiusMiles || 50);
  query = query
    .gte("latitude", bbox.minLat)
    .lte("latitude", bbox.maxLat)
    .gte("longitude", bbox.minLng)
    .lte("longitude", bbox.maxLng);

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

  const { data, error } = await query;

  if (error) {
    console.error("Geocoded matching error:", error);
    throw new Error(`Failed to match resources: ${error.message}`);
  }

  const resourceRows = (data ?? []) as ResourceRecord[];
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

  resourceRows
    .map((facility) => {
      const latitude = typeof facility.latitude === "number" ? facility.latitude : Number(facility.latitude ?? Number.NaN);
      const longitude = typeof facility.longitude === "number" ? facility.longitude : Number(facility.longitude ?? Number.NaN);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      const distance = calculateDistance(filters.location!, {
        latitude,
        longitude,
      });

      return {
        ...facility,
        distance,
      } as ResourceRecord;
    })
    .filter((facility): facility is ResourceRecord & { distance: number } => {
      return Boolean(facility) && facility !== null && typeof facility.distance === "number";
    })
    .sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      const aRating = typeof a.quality_rating === "number" ? a.quality_rating : 0;
      const bRating = typeof b.quality_rating === "number" ? b.quality_rating : 0;
      return bRating - aRating;
    })
    .forEach(addResource);

  if (includeHomeServices) {
    const homeServices = await fetchHomeServiceResources(session);
    homeServices.forEach(addResource);
  }

  return orderedResults;
}

export async function getGeocodingStats(): Promise<{
  total: number;
  geocoded: number;
  percentage: number;
}> {
  const { count: total } = await supabaseServer
    .from("resources")
    .select("*", { count: "exact", head: true });

  const { count: geocoded } = await supabaseServer
    .from("resources")
    .select("*", { count: "exact", head: true })
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  return {
    total: total || 0,
    geocoded: geocoded || 0,
    percentage: total ? Math.round(((geocoded ?? 0) / total) * 100) : 0,
  };
}
