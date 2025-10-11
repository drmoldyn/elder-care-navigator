import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      message,
      timeline,
      facilityId,
      facilityName,
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !facilityId || !facilityName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Store the lead in database
    const { data, error } = await supabaseServer
      .from("info_requests")
      .insert({
        name,
        email,
        phone,
        message,
        timeline,
        facility_id: facilityId,
        facility_name: facilityName,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing info request:", error);
      return NextResponse.json(
        { error: "Failed to store request" },
        { status: 500 }
      );
    }

    // TODO: Send email notification to facility and user
    // This would integrate with SendGrid, Resend, or similar

    return NextResponse.json({
      success: true,
      requestId: data.id,
    });
  } catch (error) {
    console.error("Error processing info request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
