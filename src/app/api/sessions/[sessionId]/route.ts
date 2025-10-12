import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/sessions/[sessionId]
 *
 * Fetches a session and its matched resources
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // 1. Fetch session
    const { data: session, error: sessionError } = await supabaseServer
      .from("user_sessions")
      .select(
        "id, session_token, user_data, care_type, latitude, longitude, search_radius_miles, created_at"
      )
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // 2. Fetch matched resources
    const userData = (session.user_data ?? {}) as Record<string, unknown>;
    const matchedResourceIds = Array.isArray(userData?.matched_resources)
      ? (userData.matched_resources as string[])
      : [];

    let resources: unknown[] = [];
    if (matchedResourceIds.length > 0) {
      const { data: resourceData, error: resourceError } = await supabaseServer
        .from("resources")
        .select("*")
        .in("id", matchedResourceIds);

      if (resourceError) {
        console.error("Failed to fetch resources:", resourceError);
      } else {
        resources = resourceData || [];
      }
    }

    return NextResponse.json({
      session: {
        ...session,
        user_data: userData,
      },
      resources,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
