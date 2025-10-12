export interface ZipCoordinates {
  lat: number;
  lng: number;
}

const CACHE_KEY = "sunsetwell:zip-geocode-cache";
const memoryCache = new Map<string, ZipCoordinates>();
let localCacheLoaded = false;

function normalizeZip(zip: string): string {
  return zip.trim().slice(0, 5);
}

function loadLocalStorageCache() {
  if (localCacheLoaded || typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, ZipCoordinates>;
      Object.entries(parsed).forEach(([zip, coords]) => {
        if (typeof coords?.lat === "number" && typeof coords?.lng === "number") {
          memoryCache.set(zip, coords);
        }
      });
    }
  } catch (error) {
    console.warn("Failed to load ZIP geocode cache", error);
  } finally {
    localCacheLoaded = true;
  }
}

function persistLocalStorageCache(zip: string, coords: ZipCoordinates) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const cache: Record<string, ZipCoordinates> = {};
    if (!localCacheLoaded) {
      loadLocalStorageCache();
    }

    memoryCache.forEach((value, key) => {
      cache[key] = value;
    });

    cache[zip] = coords;
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Failed to persist ZIP geocode cache", error);
  }
}

export function getCachedZipCoordinates(zip: string): ZipCoordinates | undefined {
  const normalized = normalizeZip(zip);
  if (!normalized) {
    return undefined;
  }

  if (!localCacheLoaded) {
    loadLocalStorageCache();
  }

  return memoryCache.get(normalized);
}

export function cacheZipCoordinates(zip: string, coords: ZipCoordinates) {
  const normalized = normalizeZip(zip);
  if (!normalized) {
    return;
  }

  memoryCache.set(normalized, coords);
  persistLocalStorageCache(normalized, coords);
}

export async function geocodeZip(
  zip: string,
  apiKey?: string
): Promise<ZipCoordinates | null> {
  const normalized = normalizeZip(zip);
  if (!normalized) {
    return null;
  }

  const cached = getCachedZipCoordinates(normalized);
  if (cached) {
    return cached;
  }

  if (!apiKey) {
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(normalized)}&component=country:US&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
      const location = data.results[0]?.geometry?.location;
      if (typeof location?.lat === "number" && typeof location?.lng === "number") {
        const coords = { lat: location.lat, lng: location.lng };
        cacheZipCoordinates(normalized, coords);
        return coords;
      }
    }

    console.warn("No geocode results for ZIP", normalized, data.status);
    return null;
  } catch (error) {
    console.error("Failed to geocode ZIP", normalized, error);
    return null;
  }
}
