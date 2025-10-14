# Scripts Overview

Utilities for data generation, migrations, and ops.

## Migrations
- Create a new timestamped migration:
  - `pnpm tsx scripts/new-migration.ts "add_user_table"`
  - Creates `supabase/migrations/YYYYMMDDHHMM_add_user_table.sql`
- Apply a specific migration (RPC with fallbacks):
  - `pnpm tsx scripts/apply-migration.ts supabase/migrations/<file>.sql`
  - If path omitted, resolves latest `*add_staffing_metrics.sql`
- Service area migration helper:
  - `pnpm tsx scripts/run-service-area-migration.ts supabase/migrations/<file>.sql`
  - If path omitted, resolves latest `*create_service_areas.sql`
- Check duplicate legacy numeric prefixes:
  - `pnpm tsx scripts/check-migration-prefixes.ts` (warn)
  - `pnpm tsx scripts/check-migration-prefixes.ts --strict` (fail on dupes)

- Run a migration file:
  - Batch: `pnpm migration:run --file supabase/migrations/<file>.sql`
  - Split statements: `pnpm migration:run --file supabase/migrations/<file>.sql --split`
  - Dry-run (no execution): `pnpm migration:run --file supabase/migrations/<file>.sql --dry-run`
  - Uses `scripts/lib/exec-sql.ts` which prefers `{ query }` param; falls back for compatibility.

## Sitemaps & Revalidation
- Generate sitemap is handled by Next.js at `src/app/sitemap.ts` (single sitemap policy).
- Build revalidation payloads for changed facilities/locations:
  - `pnpm tsx scripts/generate-revalidate-list.ts`
  - Outputs `revalidate.json` with `facilityIds`, `locationSlugs`.
- Trigger revalidation via workflow:
  - GitHub Actions: `.github/workflows/revalidate.yml` (requires secrets).

## Metro Data
- Generate metro JSON + narrative using Supabase scores:
  - `pnpm tsx scripts/generate-metro-rankings.ts`
  - Produces `data/metros/*.json` and `docs/METRO-RANKINGS-50.md`
  - Notes:
    - Uses multi-state allowances and city alias expansions.
    - Guarantees up to 20 items via state-level top-ups.
    - Marks top-up entries with `topUp: true` for UI disclosure.
