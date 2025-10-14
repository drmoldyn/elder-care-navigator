#!/usr/bin/env tsx
/**
 * Enforces migration filename convention for new files:
 *  - Legacy numeric prefixes (e.g., 0001_...) are allowed only for files added before CUTOVER.
 *  - New files must use timestamped format: YYYYMMDDHHMMSS_<name>.sql
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const CUTOVER_ISO = '2025-10-14T00:00:00Z'; // date we adopted timestamp naming

function firstAddIso(filePath: string): string | null {
  try {
    const out = execSync(
      `git log --diff-filter=A --follow --format=%aI -- "${filePath}" | tail -n 1`,
      { encoding: 'utf-8' }
    ).trim();
    return out || null;
  } catch {
    return null;
  }
}

function isTimestamped(name: string): boolean {
  return /^\d{14}_.+\.sql$/.test(name);
}

function isLegacyNumeric(name: string): boolean {
  return /^\d{1,4}_.+\.sql$/.test(name);
}

function main() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('No migrations dir; skipping.');
    process.exit(0);
  }

  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'));
  const violations: string[] = [];

  for (const f of files) {
    const full = path.join(MIGRATIONS_DIR, f);
    if (isTimestamped(f)) continue;
    if (isLegacyNumeric(f)) {
      const iso = firstAddIso(full);
      if (!iso) continue; // unknown, allow
      if (new Date(iso).getTime() >= new Date(CUTOVER_ISO).getTime()) {
        violations.push(`${f} (added ${iso})`);
      }
      continue; // pre-cutover legacy allowed
    }
    // Any other pattern is a violation
    violations.push(f);
  }

  if (violations.length > 0) {
    console.error('✖ Migration filename convention violations found:');
    violations.forEach(v => console.error('  -', v));
    console.error('\nExpected: YYYYMMDDHHMMSS_<description>.sql for new files.');
    process.exit(1);
  } else {
    console.log('✔ Migration filenames conform to convention.');
  }
}

main();

