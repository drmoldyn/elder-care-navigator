#!/usr/bin/env tsx
/**
 * Scaffolds a new timestamped migration file under supabase/migrations.
 * Usage: pnpm tsx scripts/new-migration.ts "add_user_table"
 */

import fs from 'fs';
import path from 'path';

function nowUtcTimestamp(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}${mm}${dd}${hh}${mi}`;
}

function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function main() {
  const nameArg = process.argv.slice(2).join(' ').trim();
  if (!nameArg) {
    console.error('Usage: pnpm tsx scripts/new-migration.ts "<description>"');
    process.exit(1);
  }

  const dir = path.join(process.cwd(), 'supabase', 'migrations');
  fs.mkdirSync(dir, { recursive: true });

  const ts = nowUtcTimestamp();
  const slug = toSlug(nameArg);
  const filename = `${ts}_${slug}.sql`;
  const full = path.join(dir, filename);

  if (fs.existsSync(full)) {
    console.error('File already exists:', filename);
    process.exit(1);
  }

  const header = `-- Migration: ${slug}\n-- Created (UTC): ${new Date().toISOString()}\n\n`;
  fs.writeFileSync(full, header);
  console.log('✔ Created', path.relative(process.cwd(), full));
}

main();

