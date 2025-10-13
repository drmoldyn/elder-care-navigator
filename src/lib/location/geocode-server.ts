import { supabaseServer } from "@/lib/supabase/server";

export interface ZipCoordinates {
  lat: number;
  lng: number;
}

const SUCCESS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ERROR_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function normalizeZip(zip: string): string {
  return zip.trim().slice(0, 5);
}

export async function getCachedZipCoordinatesServer(zip: string): Promise<ZipCoordinates | null> {
  const normalized = normalizeZip(zip);
  if (!normalized) return null;

  const { data, error } = await supabaseServer
    .from("zip_geocode_cache")
    .select("latitude, longitude, updated_at, error_status")
    .eq("zip", normalized)
    .maybeSingle();

  if (error) {
    console.error("[geocode-server] Failed to read cache", error);
    return null;
  }

  if (!data) return null;

  const updatedAt = data.updated_at ? new Date(data.updated_at).getTime() : 0;
  const age = Date.now() - updatedAt;

  if (data.error_status) {
    if (age < ERROR_COOLDOWN_MS) {
      return null;
    }
    return null;
  }

  if (typeof data.latitude === "number" && typeof data.longitude === "number") {
    if (age < SUCCESS_TTL_MS) {
      return { lat: data.latitude, lng: data.longitude };
    }
  }

  return null;
}

async function upsertZipCache(
  zip: string,
  coords: ZipCoordinates | null,
  errorStatus?: string,
  errorMessage?: string
) {
  const normalized = normalizeZip(zip);
  if (!normalized) return;

  const payload: Record<string, unknown> = {
    zip: normalized,
    updated_at: new Date().toISOString(),
  };

  if (coords) {
    payload.latitude = coords.lat;
    payload.longitude = coords.lng;
    payload.error_status = null;
    payload.error_message = null;
  } else {
    payload.latitude = null;
    payload.longitude = null;
    payload.error_status = errorStatus ?? "ERROR";
    payload.error_message = errorMessage ?? null;
  }

  const { error } = await supabaseServer
    .from("zip_geocode_cache")
    .upsert(payload, { onConflict: "zip" });

  if (error) {
    console.error("[geocode-server] Failed to upsert cache", error);
  }
}

export async function fetchZipCoordinatesServer(zip: string): Promise<ZipCoordinates | null> {
  const normalized = normalizeZip(zip);
  if (!normalized) return null;

  const cached = await getCachedZipCoordinatesServer(normalized);
  if (cached) {
    return cached;
  }

  const apiKey =
    process.env.GOOGLE_GEOCODING_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("[geocode-server] Missing Google Geocoding API key");
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    normalized
  )}&components=country:US&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
      const location = data.results[0]?.geometry?.location;
      if (typeof location?.lat === "number" && typeof location?.lng === "number") {
        const coords = { lat: location.lat, lng: location.lng };
        await upsertZipCache(normalized, coords);
        return coords;
      }
    }

    await upsertZipCache(normalized, null, data.status, data.error_message);
    console.warn("[geocode-server] Geocoding failed", normalized, data.status, data.error_message);
    return null;
  } catch (error) {
    console.error("[geocode-server] Exception during geocode", error);
    await upsertZipCache(normalized, null, "EXCEPTION", (error as Error)?.message);
    return null;
  }
}

export async function getOrFetchZipCoordinates(zip: string): Promise<ZipCoordinates | null> {
  const cached = await getCachedZipCoordinatesServer(zip);
  if (cached) {
    return cached;
  }

  return fetchZipCoordinatesServer(zip);
}
