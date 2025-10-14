#!/usr/bin/env tsx
/**
 * Flags duplicate numeric prefixes among migration filenames.
 * Legacy scheme: 0001_..., 0002_...
 *
 * Usage:
 *  pnpm tsx scripts/check-migration-prefixes.ts          # warn only
 *  pnpm tsx scripts/check-migration-prefixes.ts --strict # exit 1 on duplicates
 */

import fs from 'fs';
import path from 'path';

const STRICT = process.argv.includes('--strict');
const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

function main() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log(`No migrations directory at ${MIGRATIONS_DIR}`);
    process.exit(0);
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  type Entry = { file: string; prefix: string };
  const entries: Entry[] = files.map(file => {
    const m = file.match(/^(\d+)_/);
    return { file, prefix: m ? m[1] : '' };
  });

  // Only consider legacy short numeric prefixes (<=4 digits) for duplicate detection
  const legacy = entries.filter(e => e.prefix && e.prefix.length <= 4);
  const groups = new Map<string, string[]>();
  for (const e of legacy) {
    const arr = groups.get(e.prefix) || [];
    arr.push(e.file);
    groups.set(e.prefix, arr);
  }

  const duplicates = [...groups.entries()].filter(([, files]) => files.length > 1);

  if (duplicates.length === 0) {
    console.log('✔ No duplicate legacy numeric prefixes found.');
    process.exit(0);
  }

  console.log('⚠️  Duplicate legacy numeric prefixes found in supabase/migrations:');
  for (const [prefix, list] of duplicates) {
    console.log(`  ${prefix}:`);
    list.forEach(f => console.log(`   - ${f}`));
  }

  if (STRICT) {
    process.exit(1);
  }
}

main();

