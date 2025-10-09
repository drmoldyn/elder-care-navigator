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
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    // 1. Fetch session
    const { data: session, error: sessionError } = await supabaseServer
      .from("user_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // 2. Fetch matched resources
    let resources = [];
    if (session.matched_resources && session.matched_resources.length > 0) {
      const { data: resourceData, error: resourceError } = await supabaseServer
        .from("resources")
        .select("*")
        .in("id", session.matched_resources);

      if (resourceError) {
        console.error("Failed to fetch resources:", resourceError);
      } else {
        resources = resourceData || [];
      }
    }

    return NextResponse.json({
      session,
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
