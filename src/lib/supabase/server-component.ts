import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for Server Components
 * Uses server-only environment variables (no NEXT_PUBLIC_ prefix)
 * IMPORTANT: NEXT_PUBLIC_* vars are for client-side. Server Components need server-only vars.
 */
export function createServerComponentClient() {
  // Use NEXT_PUBLIC_SUPABASE_URL - it works in both client AND server runtime
  // (Same pattern as the working server.ts)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[createServerComponentClient] Initializing...');
  console.log('[createServerComponentClient] URL present:', !!supabaseUrl);
  console.log('[createServerComponentClient] URL value:', supabaseUrl?.slice(0, 30) + '...');
  console.log('[createServerComponentClient] Key present:', !!supabaseKey);
  console.log('[createServerComponentClient] Key value:', supabaseKey?.slice(0, 20) + '...');

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
