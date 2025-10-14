#!/usr/bin/env tsx
import 'dotenv/config';

type Location = { city: string; state: string };

interface Payload {
  secret?: string;
  paths?: string[];
  facilityIds?: string[];
  locations?: Location[];
  locationSlugs?: string[];
  revalidateLocationsIndex?: boolean;
}

function parseArgs(argv: string[]): { file?: string; baseUrl?: string } {
  const out: { file?: string; baseUrl?: string } = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;
    if (!arg.startsWith('--') && !out.file) {
      out.file = arg;
      continue;
    }
    if (arg === '--base' || arg === '--base-url') {
      out.baseUrl = argv[i + 1];
      i++;
      continue;
    }
  }
  return out;
}

async function main() {
  const { file, baseUrl } = parseArgs(process.argv);
  const BASE = baseUrl || process.env.REVALIDATE_BASE_URL || 'http://localhost:3000';
  const SECRET = process.env.REVALIDATE_SECRET;

  if (!SECRET) {
    console.error('REVALIDATE_SECRET is not set.');
    process.exit(1);
  }

  let payload: Payload | null = null;

  if (file) {
    try {
      const fs = await import('fs');
      const json = fs.readFileSync(file, 'utf-8');
      payload = JSON.parse(json) as Payload;
    } catch (err) {
      console.error(`Failed to read payload file: ${file}`);
      console.error(err);
      process.exit(1);
    }
  } else {
    // Allow constructing a small payload from env for convenience
    const paths = (process.env.REVALIDATE_PATHS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const facilityIds = (process.env.REVALIDATE_FACILITY_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const locationSlugs = (process.env.REVALIDATE_LOCATION_SLUGS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const revalidateLocationsIndex = process.env.REVALIDATE_LOCATIONS_INDEX === 'true';
    payload = { paths, facilityIds, locationSlugs, revalidateLocationsIndex };
  }

  if (!payload) {
    console.error('No payload provided. Pass a JSON file path or set env vars.');
    process.exit(1);
  }

  // Always inject secret. Accept either header or body; body here for simplicity.
  payload.secret = SECRET;

  const url = `${BASE.replace(/\/$/, '')}/api/revalidate`;
  console.log(`[revalidate] POST ${url}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const out = (() => { try { return JSON.parse(text); } catch { return text; } })();

  if (!res.ok) {
    console.error('Revalidate failed:', out);
    process.exit(1);
  }

  console.log('Revalidate success:', out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

