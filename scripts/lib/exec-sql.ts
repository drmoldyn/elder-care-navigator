#!/usr/bin/env tsx
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ExecSqlOptions {
  supabaseUrl?: string;
  serviceKey?: string;
}

/**
 * Execute DDL via RPC function `exec_sql`, trying both `{ query }` and `{ sql }` param names.
 * Falls back to REST call to `/rest/v1/rpc/exec` if provided with URL+service key.
 */
export async function execSql(
  supabase: SupabaseClient,
  statement: string,
  opts: ExecSqlOptions = {}
): Promise<{ ok: boolean; error?: any }> {
  try {
    let { error } = (await supabase.rpc('exec_sql', { query: statement as any })) as any;
    if (error) {
      ({ error } = (await supabase.rpc('exec_sql', { sql: statement as any })) as any);
    }
    if (!error) return { ok: true };

    // REST fallback
    if (opts.supabaseUrl && opts.serviceKey) {
      const resp = await fetch(`${opts.supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          apikey: opts.serviceKey,
          Authorization: `Bearer ${opts.serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: statement }),
      });
      if (resp.ok) return { ok: true };
      return { ok: false, error: await resp.text() };
    }
    return { ok: false, error };
  } catch (err) {
    return { ok: false, error: err };
  }
}

