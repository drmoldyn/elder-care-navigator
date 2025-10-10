import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sessionContextSchema } from "@/lib/validation/session";
import { matchResourcesSQL } from "@/lib/matching/sql-matcher";
import { rateLimit } from "@/lib/middleware/rate-limit";
import type { MatchResponsePayload } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/match
 *
 * Accepts a SessionContext, matches against resources, creates a session record,
 * and enqueues AI guidance generation
 */
export async function POST(request: NextRequest) {
  try {
    // 0. Rate limiting (20 requests per 15 minutes per IP)
    const { allowed, resetAt } = rateLimit(request, {
      max: 20,
      windowMs: 15 * 60 * 1000,
    });

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(resetAt).toISOString(),
          },
        }
      );
    }

    // 1. Parse and validate request body
    const body = await request.json();
    const validation = sessionContextSchema.safeParse(body.session);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid session data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const sessionContext = validation.data;

    // 2. Run SQL-based matching (deterministic, database-driven)
    const matchedResources = await matchResourcesSQL(sessionContext);

    // 3. Create user session record
    const { data: session, error: sessionError } = await supabaseServer
      .from("user_sessions")
      .insert({
        relationship: sessionContext.relationship,
        conditions: sessionContext.conditions,
        zip_code: sessionContext.zipCode,
        city: sessionContext.city,
        state: sessionContext.state,
        care_type: sessionContext.careType,
        living_situation: sessionContext.livingSituation || "long_distance",
        urgency_factors: sessionContext.urgencyFactors,
        email: sessionContext.email,
        email_subscribed: sessionContext.emailSubscribed ?? false,
        matched_resources: matchedResources.map((r) => r.id),
      })
      .select("id")
      .single();

    if (sessionError) {
      console.error("Failed to create session:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // 4. Prepare response (simplified - no scoring, just matched resources)
    const response: MatchResponsePayload = {
      sessionId: session.id,
      resources: matchedResources.map((r) => ({
        resourceId: r.id,
        score: 100, // All matches are relevant (no scoring)
        rank: "recommended" as const, // All are recommended
      })),
      guidance: {
        status: "pending",
        jobId: session.id, // For now, jobId = sessionId
      },
    };

    // TODO: Enqueue AI guidance generation job here
    // For now, guidance stays pending until /api/guidance/:sessionId is called

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in /api/match:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
