import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { generateGuidance } from "@/lib/ai/guidance";
import type { Resource, SessionContext } from "@/types/domain";
import type { GuidancePollResponse } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/guidance/:sessionId
 *
 * Poll for AI guidance generation status
 * Returns pending/complete/failed with optional guidance text
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    // 1. Fetch session from Supabase
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

    // 2. If guidance already exists, return it immediately
    if (session.ai_guidance) {
      const response: GuidancePollResponse = {
        sessionId,
        status: "complete",
        guidance: session.ai_guidance,
        fallback: false, // TODO: track whether fallback was used
      };
      return NextResponse.json(response, { status: 200 });
    }

    // 3. Generate guidance now (synchronous for MVP; can be queued later)
    const { data: resources, error: resourceError } = await supabaseServer
      .from("resources")
      .select("*")
      .in("id", session.matched_resources || []);

    if (resourceError) {
      console.error("Failed to fetch matched resources:", resourceError);
      return NextResponse.json(
        { error: "Failed to fetch resources" },
        { status: 500 }
      );
    }

    // Transform DB resources to TypeScript types
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

    const sessionContext: SessionContext = {
      relationship: session.relationship,
      conditions: session.conditions,
      zipCode: session.zip_code,
      city: session.city,
      state: session.state,
      careType: session.care_type ?? undefined,
      livingSituation: session.living_situation,
      urgencyLevel: undefined, // Not stored separately in DB
      urgencyFactors: session.urgency_factors,
      careGoals: undefined,
      budget: undefined,
      email: session.email,
      emailSubscribed: session.email_subscribed ?? false,
    };

    const { guidance, fallback } = await generateGuidance({
      session: sessionContext,
      matchedResources: typedResources,
    });

    // 4. Store guidance back to session
    const { error: updateError } = await supabaseServer
      .from("user_sessions")
      .update({ ai_guidance: guidance })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Failed to update session with guidance:", updateError);
      // Still return the guidance even if DB update fails
    }

    const response: GuidancePollResponse = {
      sessionId,
      status: "complete",
      guidance,
      fallback,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in /api/guidance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
