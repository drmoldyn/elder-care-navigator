import type { SessionContext } from "@/types/domain";
import { supabaseServer } from "@/lib/supabase/server";
import { calculateDistance, getBoundingBox, type Coordinates } from "@/lib/utils/distance";

/**
 * Geocode-based matching using precise lat/lng coordinates
 * Much more accurate than ZIP code prefix approximation
 */

interface MatchFilters {
  location?: Coordinates;
  searchRadiusMiles?: number;
  insuranceTypes?: Array<"medicare" | "medicaid" | "private" | "veterans_affairs">;
  providerTypes?: string[];
  categories?: string[];
  minQualityRating?: number;
}

/**
 * Geocode a ZIP code to get lat/lng
 * Uses Google Geocoding API
 */
async function geocodeZipCode(zipCode: string): Promise<Coordinates | null> {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('Google Geocoding API key not configured. Falling back to ZIP prefix matching.');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode},USA&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  return null;
}

/**
 * Build filters from session context
 */
export async function buildFiltersFromSession(session: SessionContext): Promise<MatchFilters> {
  const filters: MatchFilters = {};

  // Geocode the user's ZIP code
  if (session.zipCode) {
    filters.location = await geocodeZipCode(session.zipCode);
  }

  // Search radius (default 50 miles)
  filters.searchRadiusMiles = session.searchRadiusMiles || 50;

  // Default to looking for nursing homes and assisted living
  filters.categories = ["nursing_home", "assisted_living"];
  filters.providerTypes = ["nursing_home", "assisted_living_facility"];

  return filters;
}

/**
 * Main geocoded matching function
 * Returns facilities sorted by distance from user's location
 */
export async function matchResourcesGeocoded(
  session: SessionContext
): Promise<Array<any>> {
  const filters = await buildFiltersFromSession(session);

  // If we couldn't geocode the ZIP, fall back to SQL matcher
  if (!filters.location) {
    console.warn('No location found, using fallback matching');
    // Import and use the original SQL matcher as fallback
    const { matchResourcesSQL } = await import('./sql-matcher');
    return matchResourcesSQL(session);
  }

  let query = supabaseServer
    .from("resources")
    .select("*")
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  // Use bounding box to pre-filter results (optimization)
  const bbox = getBoundingBox(filters.location, filters.searchRadiusMiles || 50);
  query = query
    .gte('latitude', bbox.minLat)
    .lte('latitude', bbox.maxLat)
    .gte('longitude', bbox.minLng)
    .lte('longitude', bbox.maxLng);

  // Provider type filter
  if (filters.providerTypes && filters.providerTypes.length > 0) {
    query = query.in("provider_type", filters.providerTypes);
  }

  // Category filter
  if (filters.categories && filters.categories.length > 0) {
    query = query.overlaps("category", filters.categories);
  }

  // Insurance filter
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

  // Quality filter
  if (filters.minQualityRating !== undefined) {
    query = query.gte("quality_rating", filters.minQualityRating);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Geocoded matching error:", error);
    throw new Error(`Failed to match resources: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Calculate precise distances and filter by radius
  const facilitiesWithDistance = data
    .map((facility) => {
      const distance = calculateDistance(filters.location!, {
        latitude: facility.latitude,
        longitude: facility.longitude,
      });

      return {
        ...facility,
        distance,
      };
    })
    .filter((facility) => facility.distance <= (filters.searchRadiusMiles || 50))
    .sort((a, b) => {
      // Sort by distance first, then by quality rating
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      // Higher quality rating first (nulls last)
      const aRating = a.quality_rating || 0;
      const bRating = b.quality_rating || 0;
      return bRating - aRating;
    });

  return facilitiesWithDistance;
}

/**
 * Get statistics about geocoded facilities
 */
export async function getGeocodingStats(): Promise<{
  total: number;
  geocoded: number;
  percentage: number;
}> {
  const { count: total } = await supabaseServer
    .from('resources')
    .select('*', { count: 'exact', head: true });

  const { count: geocoded } = await supabaseServer
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  return {
    total: total || 0,
    geocoded: geocoded || 0,
    percentage: total ? Math.round((geocoded! / total) * 100) : 0,
  };
}
