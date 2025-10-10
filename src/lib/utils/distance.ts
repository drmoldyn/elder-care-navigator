/**
 * Distance calculation utilities using Haversine formula
 *
 * Accurately calculates distances between two lat/lng coordinates
 * on Earth's surface (great-circle distance)
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 *
 * @param coord1 First coordinate {latitude, longitude}
 * @param coord2 Second coordinate {latitude, longitude}
 * @returns Distance in miles
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 3959; // Earth's radius in miles (use 6371 for kilometers)

  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);
  const deltaLat = toRadians(coord2.latitude - coord1.latitude);
  const deltaLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if coordinates are within a given radius
 *
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @param radiusMiles Maximum distance in miles
 * @returns true if within radius, false otherwise
 */
export function isWithinRadius(
  coord1: Coordinates,
  coord2: Coordinates,
  radiusMiles: number
): boolean {
  const distance = calculateDistance(coord1, coord2);
  return distance <= radiusMiles;
}

/**
 * Sort an array of items by distance from a reference point
 *
 * @param items Array of items with lat/lng
 * @param referencePoint Reference coordinate
 * @param getCoordinates Function to extract coordinates from item
 * @returns Sorted array with distances
 */
export function sortByDistance<T>(
  items: T[],
  referencePoint: Coordinates,
  getCoordinates: (item: T) => Coordinates | null
): Array<T & { distance: number }> {
  return items
    .map((item) => {
      const coords = getCoordinates(item);
      const distance = coords ? calculateDistance(referencePoint, coords) : Infinity;
      return { ...item, distance };
    })
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Filter items within a radius and sort by distance
 *
 * @param items Array of items with lat/lng
 * @param referencePoint Reference coordinate
 * @param radiusMiles Maximum distance in miles
 * @param getCoordinates Function to extract coordinates from item
 * @returns Filtered and sorted array with distances
 */
export function filterAndSortByDistance<T>(
  items: T[],
  referencePoint: Coordinates,
  radiusMiles: number,
  getCoordinates: (item: T) => Coordinates | null
): Array<T & { distance: number }> {
  const sorted = sortByDistance(items, referencePoint, getCoordinates);
  return sorted.filter((item) => item.distance <= radiusMiles);
}

/**
 * Format distance for display
 *
 * @param miles Distance in miles
 * @returns Formatted string (e.g., "2.3 miles", "0.5 miles")
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return 'Less than 0.1 miles';
  }
  return `${miles.toFixed(1)} mile${miles !== 1 ? 's' : ''}`;
}

/**
 * Get approximate bounding box for a radius search
 * Useful for optimizing database queries before precise distance calculation
 *
 * @param center Center coordinate
 * @param radiusMiles Radius in miles
 * @returns Bounding box {minLat, maxLat, minLng, maxLng}
 */
export function getBoundingBox(
  center: Coordinates,
  radiusMiles: number
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  // Approximate degrees per mile
  // At equator: 1 degree latitude ≈ 69 miles
  // Longitude varies by latitude
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.cos(toRadians(center.latitude)));

  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLng: center.longitude - lngDelta,
    maxLng: center.longitude + lngDelta,
  };
}
