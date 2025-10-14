export interface ZipCoordinates {
  lat: number;
  lng: number;
}

const CACHE_KEY = "sunsetwell:zip-geocode-cache";
const NEG_CACHE_KEY = "sunsetwell:zip-geocode-negative";
const NEG_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const memoryCache = new Map<string, ZipCoordinates>();
let localCacheLoaded = false;
let localNegCacheLoaded = false;
const negativeCache = new Map<string, number>(); // zip -> expiresAt

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

function loadLocalStorageNegativeCache() {
  if (localNegCacheLoaded || typeof window === "undefined") {
    return;
  }
  try {
    const raw = window.localStorage.getItem(NEG_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, number>;
      Object.entries(parsed).forEach(([zip, expiresAt]) => {
        if (typeof expiresAt === "number" && expiresAt > Date.now()) {
          negativeCache.set(zip, expiresAt);
        }
      });
    }
  } catch (error) {
    console.warn("Failed to load ZIP negative cache", error);
  } finally {
    localNegCacheLoaded = true;
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

export async function geocodeZip(zip: string): Promise<ZipCoordinates | null> {
  const normalized = normalizeZip(zip);
  if (!normalized) {
    return null;
  }

  if (!localNegCacheLoaded) {
    loadLocalStorageNegativeCache();
  }

  const neg = negativeCache.get(normalized);
  if (typeof neg === "number" && neg > Date.now()) {
    return null;
  }

  const cached = getCachedZipCoordinates(normalized);
  if (cached) {
    return cached;
  }

  if (typeof window === "undefined") {
    console.warn("geocodeZip called on server without cache; returning null");
    return null;
  }

  try {
    const response = await fetch(`/api/geocode?zip=${encodeURIComponent(normalized)}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.warn("Failed to geocode ZIP via API", normalized, error);
      // Record negative cache for a day to avoid retries
      const expiresAt = Date.now() + NEG_TTL_MS;
      negativeCache.set(normalized, expiresAt);
      if (typeof window !== "undefined") {
        try {
          const obj: Record<string, number> = {};
          negativeCache.forEach((v, k) => {
            if (v > Date.now()) obj[k] = v;
          });
          window.localStorage.setItem(NEG_CACHE_KEY, JSON.stringify(obj));
        } catch {}
      }
      return null;
    }

    const data = await response.json();
    if (typeof data.latitude === "number" && typeof data.longitude === "number") {
      const coords = { lat: data.latitude, lng: data.longitude };
      cacheZipCoordinates(normalized, coords);
      return coords;
    }
  } catch (error) {
    console.error("Failed to geocode ZIP via API", normalized, error);
  }

  // Default: add a short negative cache to prevent hammering
  const expiresAt = Date.now() + NEG_TTL_MS;
  negativeCache.set(normalized, expiresAt);
  if (typeof window !== "undefined") {
    try {
      const obj: Record<string, number> = {};
      negativeCache.forEach((v, k) => {
        if (v > Date.now()) obj[k] = v;
      });
      window.localStorage.setItem(NEG_CACHE_KEY, JSON.stringify(obj));
    } catch {}
  }
  return null;
}
