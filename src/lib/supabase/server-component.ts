import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for Server Components
 * Uses server-only environment variables (no NEXT_PUBLIC_ prefix)
 * IMPORTANT: NEXT_PUBLIC_* vars are for client-side. Server Components need server-only vars.
 */
export function createServerComponentClient() {
  // Use server-only SUPABASE_URL instead of NEXT_PUBLIC_SUPABASE_URL (client-side)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[createServerComponentClient] Initializing...');
  console.log('[createServerComponentClient] URL present:', !!supabaseUrl);
  console.log('[createServerComponentClient] Key present:', !!supabaseKey);

  if (!supabaseUrl) {
    console.error('[createServerComponentClient] Missing SUPABASE_URL');
    throw new Error('Missing SUPABASE_URL environment variable (server-only)');
  }

  if (!supabaseKey) {
    console.error('[createServerComponentClient] Missing SUPABASE_SERVICE_ROLE_KEY');
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  console.log('[createServerComponentClient] Creating client with service role key');

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
