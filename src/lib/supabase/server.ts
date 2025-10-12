import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabaseServer: SupabaseClient | null = null;

function getSupabaseServer(): SupabaseClient {
  if (_supabaseServer) {
    return _supabaseServer;
  }

  // Use server-only SUPABASE_URL first, fallback to NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Detailed logging for debugging
  console.log("[supabaseServer] Initializing Supabase client");
  console.log("[supabaseServer] SUPABASE_URL present:", !!process.env.SUPABASE_URL);
  console.log("[supabaseServer] NEXT_PUBLIC_SUPABASE_URL present:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("[supabaseServer] Using URL:", supabaseUrl?.slice(0, 30) + '...');
  console.log("[supabaseServer] Key defined:", !!supabaseServiceKey);
  console.log("[supabaseServer] Key starts with:", supabaseServiceKey?.slice(0, 20) + '...');

  if (!supabaseUrl || !supabaseServiceKey) {
    const errorMsg = `Missing Supabase environment variables. URL: ${!!supabaseUrl}, Key: ${!!supabaseServiceKey}`;
    console.error("[supabaseServer]", errorMsg);
    throw new Error(errorMsg);
  }

  _supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseServer;
}

/**
 * Server-side Supabase client with service role key
 * Use only in API routes or server components
 * Has elevated permissions - handle with care
 */
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseServer();
    const value = Reflect.get(client, prop, client);
    // Bind methods to the client to preserve `this` context
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export type SupabaseServerClient = typeof supabaseServer;
