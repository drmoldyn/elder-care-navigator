#!/usr/bin/env tsx
/*
 * Unified migration helper.
 *
 * Usage examples:
 *   pnpm tsx scripts/migrate.ts --file supabase/migrations/202510141200_add_index.sql
 *   pnpm tsx scripts/migrate.ts --file supabase/migrations/202510141200_add_index.sql --split
 *   pnpm tsx scripts/migrate.ts --file supabase/migrations/202510141200_add_index.sql --dry-run
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { execSql } from './lib/exec-sql';

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') {
      args.file = argv[++i];
    } else if (a === '--split') {
      args.split = true;
    } else if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    }
  }
  return args;
}

function splitStatements(sql: string): string[] {
  // Naive splitter: split on semicolons not in lines starting with --
  const lines = sql.split('\n');
  const chunks: string[] = [];
  let current = '';
  for (const line of lines) {
    const l = line.trim();
    if (l.startsWith('--')) {
      current += line + '\n';
      continue;
    }
    current += line + '\n';
    if (line.includes(';')) {
      const parts = current.split(';');
      for (let i = 0; i < parts.length - 1; i++) {
        const stmt = parts[i].trim();
        if (stmt) chunks.push(stmt);
      }
      current = parts[parts.length - 1];
    }
  }
  const tail = current.trim();
  if (tail) chunks.push(tail);
  return chunks;
}

async function main() {
  const { file, split, dryRun, help } = parseArgs(process.argv.slice(2));
  if (help || !file) {
    console.log(`\nUnified migration helper\n\nUsage:\n  pnpm tsx scripts/migrate.ts --file supabase/migrations/<file>.sql [--split] [--dry-run]\n`);
    process.exit(file ? 0 : 1);
  }

  const resolved = path.isAbsolute(String(file)) ? String(file) : path.join(process.cwd(), String(file));
  if (!fs.existsSync(resolved)) {
    console.error('✖ Migration file not found:', resolved);
    process.exit(1);
  }

  const sql = fs.readFileSync(resolved, 'utf-8');
  console.log('▶ Applying migration:', path.relative(process.cwd(), resolved));
  console.log('   Size:', sql.length, 'bytes');
  if (dryRun) {
    console.log('\n-- Dry run enabled. SQL not executed.');
    process.exit(0);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('✖ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  if (split) {
    const stmts = splitStatements(sql);
    console.log('• Executing', stmts.length, 'statements');
    for (let i = 0; i < stmts.length; i++) {
      const stmt = stmts[i];
      process.stdout.write(`  [${i + 1}/${stmts.length}] `);
      const res = await execSql(supabase, stmt, { supabaseUrl: url, serviceKey: key });
      if (!res.ok) {
        console.error('\n✖ Statement failed. Aborting.');
        console.error(res.error);
        console.error('\nFirst 200 chars of statement:\n', stmt.slice(0, 200));
        process.exit(1);
      }
      console.log('OK');
    }
    console.log('✓ Migration completed (split mode).');
  } else {
    const res = await execSql(supabase, sql, { supabaseUrl: url, serviceKey: key });
    if (!res.ok) {
      console.error('✖ Batch execution failed. Try --split or run manually in Supabase SQL Editor.');
      console.error(res.error);
      process.exit(1);
    }
    console.log('✓ Migration completed (batch mode).');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

