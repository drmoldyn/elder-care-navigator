import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint to test Supabase connection
 */
export async function GET() {
  try {
    const envCheck = {
      SUPABASE_URL_present: !!process.env.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL_present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_URL_value: process.env.SUPABASE_URL?.slice(0, 30) + '...',
      NEXT_PUBLIC_SUPABASE_URL_value: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
      runtime: process.env.NEXT_RUNTIME || 'nodejs',
    };

    console.log('[DEBUG] Environment check:', envCheck);

    // Test simple query
    const { data, error } = await supabaseServer
      .from("resources")
      .select("id, title")
      .limit(1);

    if (error) {
      console.error('[DEBUG] Query error:', error);
      return NextResponse.json({
        status: 'error',
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        envCheck,
      }, { status: 500 });
    }

    console.log('[DEBUG] Query successful, found', data?.length, 'results');

    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection working',
      recordsFetched: data?.length ?? 0,
      envCheck,
    });
  } catch (error) {
    console.error('[DEBUG] Unexpected error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
