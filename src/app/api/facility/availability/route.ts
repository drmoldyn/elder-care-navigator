import { NextRequest, NextResponse } from "next/server";
import { availabilityUpdateSchema } from "@/lib/validation/facility";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = availabilityUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    const { error } = await supabaseServer.from("facility_availability_updates").insert({
      facility_id: payload.facilityId,
      account_id: payload.accountId,
      beds_available: payload.bedsAvailable ?? null,
      waitlist_weeks: payload.waitlistWeeks ?? null,
      accepts_medicaid: payload.acceptsMedicaid ?? null,
      accepts_medicare: payload.acceptsMedicare ?? null,
      accepts_private_pay: payload.acceptsPrivatePay ?? null,
      notes: payload.notes ?? null,
    });

    if (error) {
      console.error("Failed to store availability update", error);
      return NextResponse.json(
        { error: "Unable to submit availability update" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Availability update stored" }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error handling availability update", error);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
