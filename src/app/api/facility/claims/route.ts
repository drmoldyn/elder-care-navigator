import { NextRequest, NextResponse } from "next/server";
import { facilityClaimRequestSchema } from "@/lib/validation/facility";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = facilityClaimRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    const { error } = await supabaseServer.from("facility_claim_requests").insert({
      facility_id: payload.facilityId,
      requester_name: payload.requesterName,
      requester_email: payload.requesterEmail,
      requester_phone: payload.requesterPhone,
      message: payload.message,
      status: "pending",
    });

    if (error) {
      console.error("Failed to store facility claim", error);
      return NextResponse.json(
        { error: "Unable to submit claim" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Claim submitted" }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error handling facility claim", error);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
