import { NextRequest, NextResponse } from "next/server";
import { leadPreferenceSchema } from "@/lib/validation/facility";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = leadPreferenceSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    const { error } = await supabaseServer
      .from("facility_accounts")
      .upsert(
        {
          facility_id: payload.facilityId,
          notify_email: payload.notifyEmail ?? true,
          notify_sms: payload.notifySms ?? false,
          notification_email: payload.notificationEmail ?? null,
          notification_phone: payload.notificationPhone ?? null,
        },
        {
          onConflict: "facility_id",
        }
      );

    if (error) {
      console.error("Failed to update lead preferences", error);
      return NextResponse.json(
        { error: "Unable to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Preferences saved" }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error handling preference update", error);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
