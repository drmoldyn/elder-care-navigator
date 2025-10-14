#!/usr/bin/env tsx
/**
 * Convert legacy numeric-prefixed migrations (e.g., 0008_...) to timestamped
 * filenames (YYYYMMDDHHmmss_<rest>.sql) using the file's first git add time (UTC).
 *
 * Dry-run by default. Pass --apply to actually rename files.
 *
 * Usage:
 *  pnpm tsx scripts/convert-migrations-to-timestamped.ts          # show plan only
 *  pnpm tsx scripts/convert-migrations-to-timestamped.ts --apply  # perform rename
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const APPLY = process.argv.includes('--apply');

function isLegacy(file: string): boolean {
  return /^\d{1,4}_.+\.sql$/.test(file);
}

function firstAddIso(filePath: string): string | null {
  try {
    // Strict ISO 8601 with TZ, first add commit
    const out = execSync(
      `git log --diff-filter=A --follow --format=%aI -- "${filePath}" | tail -n 1`,
      { encoding: 'utf-8' }
    ).trim();
    return out || null;
  } catch {
    return null;
  }
}

function formatTs(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}${mm}${dd}${hh}${mi}${ss}`;
}

function uniqueTargetName(dir: string, base: string): string {
  // If collision, add _a, _b suffix before .sql
  let candidate = base;
  let n = 0;
  while (fs.existsSync(path.join(dir, candidate))) {
    n += 1;
    const m = base.match(/^(.*)\.sql$/)!
    const stem = m[1];
    candidate = `${stem}_${String.fromCharCode(96 + n)}.sql`; // _a, _b, ...
  }
  return candidate;
}

function main() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error('No migrations directory found at', MIGRATIONS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .filter(isLegacy)
    .sort();

  if (files.length === 0) {
    console.log('No legacy numeric-prefixed migrations found.');
    return;
  }

  const plan: Array<{ from: string; to: string }> = [];
  const taken = new Set<string>(
    fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'))
  );

  for (const f of files) {
    const from = path.join(MIGRATIONS_DIR, f);
    const iso = firstAddIso(from) || new Date().toISOString();
    const ts = formatTs(iso);
    const rest = f.replace(/^\d+_/, '');
    const targetBase = `${ts}_${rest}`;
    // Ensure uniqueness against both existing files and already-planned targets
    let toName = targetBase;
    let bump = 0;
    while (taken.has(toName)) {
      bump += 1;
      const m = targetBase.match(/^(.*)\.sql$/)!;
      toName = `${m[1]}_${String.fromCharCode(96 + bump)}.sql`;
    }
    taken.add(toName);
    const to = path.join(MIGRATIONS_DIR, toName);
    plan.push({ from, to });
  }

  console.log('Migration rename plan:');
  for (const { from, to } of plan) {
    console.log(' -', path.basename(from), '→', path.basename(to));
  }

  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply to perform renames.');
    return;
  }

  for (const { from, to } of plan) {
    fs.renameSync(from, to);
  }

  console.log('\n✔ Renamed files.');
}

main();
