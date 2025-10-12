import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sessionContextSchema } from "@/lib/validation/session";
import { matchResourcesSQL } from "@/lib/matching/sql-matcher";
import { rateLimit } from "@/lib/middleware/rate-limit";
import type { MatchRequestPayload, MatchResponsePayload } from "@/types/api";

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
    const { allowed, resetAt } = await rateLimit(request, {
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
    const body = (await request.json()) as MatchRequestPayload;
    const previewMode = Boolean(body.preview);
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

    const resourceSummaries = matchedResources
      .map((resource) => {
        const id = resource.id ? String(resource.id) : undefined;
        if (!id) {
          return null;
        }

        return {
          id,
          title: resource.title ?? "Untitled Resource",
          providerType: (resource.provider_type as string | undefined) ?? null,
          latitude: typeof resource.latitude === "number" ? resource.latitude : null,
          longitude:
            typeof resource.longitude === "number" ? resource.longitude : null,
          address: (resource.address as string | undefined) ?? null,
          city: (resource.city as string | undefined) ?? null,
          state: (resource.state as string | undefined) ?? null,
          zip: (resource.zip as string | undefined) ?? null,
          overallRating:
            typeof resource.overall_rating === "number"
              ? resource.overall_rating
              : null,
          sunsetwellScore:
            typeof resource.sunsetwell_score === "number"
              ? resource.sunsetwell_score
              : null,
          distanceMiles:
            typeof resource.distance === "number" ? resource.distance : null,
          serviceAreaMatch: resource.service_area_match ?? false,
          serviceAreaZip: resource.service_area_zip ?? null,
        };
      })
      .filter((summary): summary is NonNullable<typeof summary> => summary !== null);

    // 3. Create user session record
    let sessionId: string | null = null;
    let jobId = "preview";

    if (!previewMode) {
      const sessionToken = randomUUID();
      const { data: session, error: sessionError } = await supabaseServer
        .from("user_sessions")
        .insert({
          session_token: sessionToken,
          user_data: {
            relationship: sessionContext.relationship,
            conditions: sessionContext.conditions,
            zip_code: sessionContext.zipCode,
            city: sessionContext.city,
            state: sessionContext.state,
            living_situation: sessionContext.livingSituation || "long_distance",
            urgency_factors: sessionContext.urgencyFactors,
            email: sessionContext.email,
            email_subscribed: sessionContext.emailSubscribed ?? false,
            matched_resources: resourceSummaries.map((summary) => summary.id),
          },
          care_type: sessionContext.careType,
          latitude: sessionContext.latitude,
          longitude: sessionContext.longitude,
          search_radius_miles: sessionContext.searchRadiusMiles,
        })
        .select("id")
        .single();

      if (sessionError || !session) {
        console.error("Failed to create session (continuing without persistence):", sessionError);
      } else {
        sessionId = session.id;
        jobId = sessionToken;
      }
    }

    // 4. Prepare response (simplified - no scoring, just matched resources)
    const response: MatchResponsePayload = {
      sessionId,
      resources: resourceSummaries.map((summary) => ({
        resourceId: summary.id,
        score: {
          resourceId: summary.id,
          score: 100,
          reasons: [],
        },
        rank: "recommended" as const,
      })),
      resourceSummaries,
      guidance: {
        status: "pending",
        jobId,
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
