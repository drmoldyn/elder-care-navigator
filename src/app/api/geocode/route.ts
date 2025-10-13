import { NextRequest, NextResponse } from "next/server";
import { getOrFetchZipCoordinates } from "@/lib/location/geocode-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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
        { error: "Unable to geocode ZIP", zip },
        { status: 502 }
      );
    }

    return NextResponse.json({ zip, latitude: coords.lat, longitude: coords.lng });
  } catch (error) {
    console.error("[api/geocode] Unexpected error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
