import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sessionContextSchema } from "@/lib/validation/session";
import { rankResources, filterByMinimumScore } from "@/lib/matching/scorer";
import { rateLimit } from "@/lib/middleware/rate-limit";
import type { Resource } from "@/types/domain";
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

    // 2. Fetch all resources from Supabase
    const { data: resources, error: fetchError } = await supabaseServer
      .from("resources")
      .select("*");

    if (fetchError) {
      console.error("Failed to fetch resources:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch resources" },
        { status: 500 }
      );
    }

    // 3. Transform snake_case DB fields to camelCase TypeScript
    const typedResources: Resource[] = (resources || []).map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      title: r.title,
      url: r.url,
      description: r.description,
      bestFor: r.best_for,
      category: r.category,
      conditions: r.conditions,
      urgencyLevel: r.urgency_level,
      locationType: r.location_type,
      states: r.states,
      requiresZip: r.requires_zip,
      audience: r.audience,
      livingSituation: r.living_situation,
      cost: r.cost,
      contactPhone: r.contact_phone,
      contactEmail: r.contact_email,
      hoursAvailable: r.hours_available,
      affiliateUrl: r.affiliate_url,
      affiliateNetwork: r.affiliate_network,
      isSponsored: r.is_sponsored,
      sourceAuthority: r.source_authority,
      lastVerified: r.last_verified,
      clickCount: r.click_count,
      upvotes: r.upvotes,
    }));

    // 4. Run matching algorithm
    const rankedMatches = rankResources(typedResources, sessionContext);
    const filteredMatches = filterByMinimumScore(rankedMatches, 20);

    // 5. Create user session record
    const { data: session, error: sessionError } = await supabaseServer
      .from("user_sessions")
      .insert({
        relationship: sessionContext.relationship,
        conditions: sessionContext.conditions,
        zip_code: sessionContext.zipCode,
        city: sessionContext.city,
        state: sessionContext.state,
        living_situation: sessionContext.livingSituation || "long_distance",
        urgency_factors: sessionContext.urgencyFactors,
        email: sessionContext.email,
        matched_resources: filteredMatches.map((m) => m.resource.id),
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

    // 6. Prepare response
    const response: MatchResponsePayload = {
      sessionId: session.id,
      resources: filteredMatches.map((m) => ({
        resourceId: m.resource.id,
        score: m.score,
        rank: m.priority,
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
