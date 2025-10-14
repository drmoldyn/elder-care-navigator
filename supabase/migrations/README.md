# Database Migrations

This project historically used zero‑padded numeric prefixes (e.g., `0001_init.sql`).
Over time, a few duplicate numbers were introduced (e.g., multiple `0008_*` files).
While Supabase applies files lexicographically and our migrations are mostly idempotent,
duplicate numbers make ordering ambiguous for fresh environments and complicate reviews.

## New Convention (Timestamped Filenames)

All new migrations should use a UTC timestamp prefix followed by a short, kebab‑case name:

```
YYYYMMDDHHMM_<description>.sql
```

Examples
- `2025101400_add_service_area_indexes.sql`
- `202510141215_create_view_facility_quality.sql`

Rationale
- Timestamps are naturally ordered and unique.
- Avoids numeric collisions like `0008_*.sql`.

## Idempotent DDL

Write migrations so they can be safely re‑applied:
- Use `create table if not exists`, `create index if not exists`,
  `alter table ... add column if not exists`, and `drop ... if exists` where possible.
- For views, prefer `create or replace view`.

## Applying Migrations

We do not auto‑execute DDL in production. Use the Supabase SQL editor or approved SQL RPCs.

Helpers in `scripts/`:
- `pnpm tsx scripts/apply-migration.ts supabase/migrations/<file.sql>`
  - If no path is provided, the script searches for a file ending with
    `add_staffing_metrics.sql` and chooses the most recent.
- `pnpm tsx scripts/run-service-area-migration.ts supabase/migrations/<file.sql>`
  - If no path is provided, the script searches for a file ending with
    `create_service_areas.sql` and chooses the most recent.

## Duplicate Number Check

Run a light check to flag duplicate numeric prefixes (legacy scheme):

```
pnpm tsx scripts/check-migration-prefixes.ts            # warn only
pnpm tsx scripts/check-migration-prefixes.ts --strict   # exit non‑zero if duplicates found
```

CI runs the non‑strict mode by default. Enable `--strict` once all legacy duplicates are pruned.

