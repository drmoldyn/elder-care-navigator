import { NextRequest, NextResponse } from "next/server";
import { getOrFetchZipCoordinates } from "@/lib/location/geocode-server";
import { rateLimit } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Lightweight rate limit to prevent abuse and external API costs
  const { allowed, resetAt } = rateLimit(request, { max: 30, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "X-RateLimit-Reset": new Date(resetAt).toISOString() } }
    );
  }

  const { searchParams } = new URL(request.url);
  const zipParam = searchParams.get("zip")?.trim();

  if (!zipParam) {
    return NextResponse.json({ error: "Missing zip parameter" }, { status: 400 });
  }

  const zip = zipParam.slice(0, 5);
  if (!/^[0-9]{5}$/.test(zip)) {
    return NextResponse.json({ error: "Invalid ZIP code" }, { status: 400 });
  }

  try {
    const coords = await getOrFetchZipCoordinates(zip);

    if (!coords) {
      return NextResponse.json(
        { error: "ZIP not found in cache", zip },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { zip, latitude: coords.lat, longitude: coords.lng },
      {
        headers: {
          // Cache successful lookups at the CDN for 30 days; allow SWR
          "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("[api/geocode] Unexpected error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
