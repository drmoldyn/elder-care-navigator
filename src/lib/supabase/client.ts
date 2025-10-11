import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabaseBrowser: SupabaseClient | undefined;

function getSupabaseBrowser(): SupabaseClient | undefined {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    return undefined;
  }

  if (_supabaseBrowser) {
    return _supabaseBrowser;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase client initialised with missing configuration. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return undefined;
  }

  _supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);
  return _supabaseBrowser;
}

// Use a Proxy to delay initialization until first access
export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseBrowser();
    if (!client) {
      return undefined;
    }
    const value = Reflect.get(client, prop, client);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
}) as SupabaseClient | undefined;

export type SupabaseBrowserClient = typeof supabaseBrowser;
