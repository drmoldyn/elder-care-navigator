# Database Migrations

This project historically used zero‑padded numeric prefixes (e.g., `0001_init.sql`).
Over time, a few duplicate numbers were introduced (e.g., multiple `0008_*` files).
While Supabase applies files lexicographically and our migrations are mostly idempotent,
duplicate numbers make ordering ambiguous for fresh environments and complicate reviews.

## New Convention (Timestamped Filenames)

All new migrations should use a UTC timestamp prefix followed by a short, kebab‑case name. Use seconds to ensure uniqueness when multiple files land within the same minute.

```
YYYYMMDDHHMMSS_<description>.sql
```

Examples
- `20251014000000_add_service_area_indexes.sql`
- `20251014121530_create_view_facility_quality.sql`

Rationale
- Timestamps are naturally ordered and unique.
- Avoids numeric collisions like `0008_*.sql`.

## Idempotent DDL

Write migrations so they can be safely re‑applied:
- Use `create table if not exists`, `create index if not exists`,
  `alter table ... add column if not exists`, and `drop ... if exists` where possible.
- For views, prefer `create or replace view`.

## Applying Migrations

You can apply migrations via:
- Supabase SQL Editor (manual)
- API with a secure RPC (recommended for CI)

Helpers in `scripts/`:
- `pnpm tsx scripts/new-migration.ts "add_user_table"` – scaffolds a timestamped file.
- `pnpm tsx scripts/convert-migrations-to-timestamped.ts` – dry‑run legacy → timestamped rename.
- `pnpm tsx scripts/convert-migrations-to-timestamped.ts --apply` – perform rename.
- `pnpm tsx scripts/apply-migration.ts supabase/migrations/<file.sql>` – apply via API (RPC/REST fallback).
  - If no path is provided, it searches for a file ending with `add_staffing_metrics.sql` and chooses the most recent.
- `pnpm tsx scripts/run-service-area-migration.ts supabase/migrations/<file.sql>` – targeted helper.
  - If no path is provided, it searches for a file ending with `create_service_areas.sql` and chooses the most recent.

## Duplicate Number Check

Run a light check to flag duplicate numeric prefixes (legacy scheme):

```
pnpm tsx scripts/check-migration-prefixes.ts            # warn only
pnpm tsx scripts/check-migration-prefixes.ts --strict   # exit non‑zero if duplicates found
```

CI runs the non‑strict mode by default. Enable `--strict` once all legacy duplicates are pruned.

## RPC for API‑Driven DDL

For API‑driven migrations, create a secure function in your Supabase project:

```sql
create or replace function public.exec_sql(query text)
returns void
language plpgsql
security definer
as $$
begin
  execute query;
end;
$$;

revoke all on function public.exec_sql(text) from public;
grant execute on function public.exec_sql(text) to authenticated, service_role;
```

Our migration helpers (`scripts/lib/exec-sql.ts`) will call `exec_sql` and fall back to REST if needed.

### CI Auto‑apply (optional)

This repo includes a workflow to auto‑apply changed migrations on pushes to `main`:
- `.github/workflows/apply-migrations.yml`
- Requires GitHub secrets: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Applies only files changed in the push (sorted). Also supports manual dispatch with a specific `file` input.
