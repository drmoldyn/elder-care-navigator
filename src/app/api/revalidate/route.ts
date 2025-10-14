import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generateLocationSlug } from "@/lib/locations/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RevalidatePayload {
  secret?: string;
  // Explicit paths to revalidate (e.g., ["/facility/abc", "/locations/los-angeles-ca"]) 
  paths?: string[];
  // Convenience inputs
  facilityIds?: string[]; // maps to /facility/[id]
  locations?: Array<{ city: string; state: string }>; // maps to /locations/[city-state]
  locationSlugs?: string[]; // e.g. ["los-angeles-ca"]
  revalidateLocationsIndex?: boolean; // also revalidate /locations
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RevalidatePayload | null;
    const secret = body?.secret ?? request.headers.get("x-revalidate-secret") ?? "";

    if (!process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: "REVALIDATE_SECRET is not configured" },
        { status: 500 }
      );
    }

    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const toRevalidate = new Set<string>();

    // Direct paths
    (body?.paths ?? []).forEach((p) => {
      if (typeof p === "string" && p.startsWith("/")) {
        toRevalidate.add(p);
      }
    });

    // Facilities
    (body?.facilityIds ?? []).forEach((id) => {
      if (id && typeof id === "string") {
        toRevalidate.add(`/facility/${id}`);
      }
    });

    // Locations via { city, state }
    (body?.locations ?? []).forEach((loc) => {
      if (loc && loc.city && loc.state) {
        const slug = generateLocationSlug(loc.city, loc.state);
        toRevalidate.add(`/locations/${slug}`);
      }
    });

    // Locations via slugs
    (body?.locationSlugs ?? []).forEach((slug) => {
      if (slug && typeof slug === "string") {
        toRevalidate.add(`/locations/${slug}`);
      }
    });

    if (body?.revalidateLocationsIndex) {
      toRevalidate.add("/locations");
    }

    if (toRevalidate.size === 0) {
      return NextResponse.json({ ok: true, count: 0, paths: [] });
    }

    // Execute revalidation
    const paths = Array.from(toRevalidate);
    paths.forEach((p) => revalidatePath(p));

    return NextResponse.json({ ok: true, count: paths.length, paths });
  } catch (error) {
    console.error("[revalidate] Unexpected error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

