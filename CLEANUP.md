# Repository Cleanup Report

Date: 2025-10-14
Author: Codex

This report catalogs places to clean up, dedupe, archive, enhance, or fix for logical consistency. Items are grouped by area with precise file references and recommended action.

## Security & Secrets
- Local `.env.local` is not tracked (verified):
  - git ls-files .env.local → no output
  - git log -- .env.local → no commits
  - `.gitignore` already ignores `.env*` (root: .gitignore:52)
  - Action: keep `.env.local` local-only; no repo changes needed.
- Double-check other env files:
  - `.env.production` is tracked but has no secrets (placeholders): `.env.production:1`
  - `.env.example` documents required vars and is safe to track.
  - Action: ensure secrets are only set in Vercel Project Settings; avoid adding real values to `.env.production`.

## Migrations
- Duplicate legacy numeric prefixes (keep for now; move to timestamps going forward):
  - `supabase/migrations/0008_add_staffing_metrics.sql`, `supabase/migrations/0008_reporting_views.sql`
  - `supabase/migrations/0014_facility_scores.sql`, `supabase/migrations/0014_sunsetwell_scoring.sql`
  - `supabase/migrations/0015_score_reliability.sql`, `supabase/migrations/0015_user_sessions_location.sql`
- Action: New timestamped convention documented (supabase/migrations/README.md). Use `pnpm migration:new` and review duplicate report from `pnpm migration:check`.
- Script coupling to filenames fixed:
  - `scripts/apply-migration.ts` now resolves latest `*add_staffing_metrics.sql` or a passed path (scripts/apply-migration.ts:1).
  - `scripts/run-service-area-migration.ts` now resolves latest `*create_service_areas.sql` or a passed path (scripts/run-service-area-migration.ts:1).
- RPC param inconsistencies:
  - Some scripts call `supabase.rpc('exec_sql', { sql: ... })` while others use `{ query: ... }`. Standardize on one input key name that matches your Postgres function signature.
    - uses `sql`: scripts/add-geocoding-columns-supabase.ts:52
    - uses `query`: scripts/apply-migration.ts:38, scripts/run-service-area-migration.ts:42
  - Recommendation: Update or overload your RPC to accept a single `query text` argument and standardize scripts.

## CI / Workflows
- Added migration prefix check workflow: `.github/workflows/migration-check.yml`.
- Existing workflows:
  - Revalidate (manual/remote): `.github/workflows/revalidate.yml`
  - Scheduled data refresh: `.github/workflows/data-refresh.yml`
- Action: Validate secrets for revalidate workflow (`REVALIDATE_SECRET`, `REVALIDATE_BASE_URL`) and test a dry run. Consider switching the migration prefix check to `--strict` after legacy cleanup.

## AEO / SEO Consistency
- Single sitemap decision: Adopted. Canonical sitemap is `/sitemap.xml` only.
  - Updated docs: `docs/AEO-IMPLEMENTATION-PLAN.md` now shows a single Sitemap line.
  - Code already generates a unified sitemap: `src/app/sitemap.ts`.
  - robots.txt already references only `/sitemap.xml`: `public/robots.txt`.
- Rich Results and JSON-LD
  - ItemList numeric ratings implemented (src/app/metros/[slug]/page.tsx:269–273) and confirmed deployed.
  - FAQPage is generated from `enhancedNarrative.faqs` and injected (src/app/metros/[slug]/page.tsx:283–287); ensure production includes these blocks after narrative enrichment (we ran enrich script).

## Data Generation (Metros)
- Implemented radius-constrained selection using a centroid of anchor facilities (defining city first; otherwise expanded cities). Default radius 150 miles (`METRO_RADIUS_MILES`).
  - If ≥ 12 facilities fall within the radius, use only those (cap at 20; allow fewer than 20).
  - If < 12 within the radius, top up from allowed states (IL/IN/WI for Chicago; NY/NJ/PA for NYC; etc.) by score to a max of 20.
  - Top-ups outside the radius are labeled with `topUp: true` in `data/metros/*.json` for transparency.
  - File: scripts/generate-metro-rankings.ts

## App UI Linking (Website-first policy)
- Implemented facility name → website linking (with Maps fallback) across:
  - Metro lists: src/app/metros/[slug]/page.tsx:452–464
  - Locations lists: src/app/locations/[...cityState]/page.tsx:155–162
  - Results list: src/app/results/[sessionId]/page.tsx:404–412, 620–626
  - Map InfoWindow (title → Maps query): src/components/map/facility-map.tsx:192–201
  - Action: If you want InfoWindow to link to the actual website, extend the map search API to return website URLs and pass through to MapResource.

## Map Implementation Consistency
- Results page map: Replaced Google Maps iframe with `<FacilityMap />` to render real matched facilities and consistent UX.
  - Updated: src/app/results/[sessionId]/page.tsx (uses dynamic import of `FacilityMap` and maps the list resources to `MapResource`).
  - Note: `userLocation` is not persisted in results; `FacilityMap` centers on clustered resources or zip when available.

## Docs: Duplicates/Archive Hygiene
- Active vs archived docs with overlapping names:
  - `docs/IMPROVEMENTS-ROADMAP.md` (active) vs `docs/ARCHIVE/IMPROVEMENTS-ROADMAP.md` (archive). Keep active; move archive subfolder under `docs/ARCHIVE/deprecated/` consistently.
  - `docs/VERCEL_DEPLOYMENT.md` in archive vs deployment notes elsewhere. Keep one canonical deployment guide.
- Many archived planning docs: `docs/ARCHIVE/*` and `docs/ARCHIVE/deprecated/*`. Recommend adding an index README in `docs/ARCHIVE` that clarifies their historical context and points to current sources.
- AEO docs vs code:
  - AEO-IMPLEMENTATION-PLAN.md references `/data` page with Dataset schema which does not exist yet. Either build it or remove references.

## Scripts: Consolidation & Consistency
- RPC consistency: Attempted confirmation of `exec_sql` param; RPC function not found in local schema cache, so retained compatibility fallback in helper. Preferred param going forward: `{ query }`.
  - New: `scripts/lib/exec-sql.ts`
  - Updated to use helper: `scripts/apply-migration.ts`, `scripts/run-service-area-migration.ts`, `scripts/add-geocoding-columns-supabase.ts`
  - Script documentation: Added `scripts/README.md` covering common tasks.
  - Remaining: Consider consolidating separate migration helpers into a single CLI with flags.
- ESLint warnings:
  - `src/app/navigator/page.tsx:37` unused `googleApiKey` (follow-up removal recommended).
  - `src/components/navigator/map-view.tsx` unused var removed.

## API & Types Consistency
- Match response summaries (snake vs camel): `MatchResponseResourceSummary` uses camelCase (src/types/api.ts:14). Ensure API payloads match exactly; normalize server responses if needed.
- Revalidation API uses `x-revalidate-secret` header and supports multiple fields (src/app/api/revalidate/route.ts:1). Workflows expect `REVALIDATE_SECRET`. Ensure secrets are set in Vercel.

## Sitemap & Robots
- Only one sitemap generator present (src/app/sitemap.ts:7). If you want granular sitemaps (facilities, questions), scaffold new `app/sitemap-*.ts` and route entries, then update robots.txt accordingly.
- `robots.txt` global rules are correct (public/robots.txt:4–16). Confirm whether you want `Crawl-delay: 1` globally or drop it; Google ignores crawl-delay.

## Analysis & Large Files
- `analysis/` and `data/assisted-living/*.csv` include large and potentially unneeded assets for the web app build.
  - Action: Confirm whether these belong in the repo. If kept, consider Git LFS or separate data storage.

## Stray Files
- Removed accidental stray file from prior patching (comma-and-els.length). Confirm no other odd files remain in history.

## Suggested Next Steps (Quick Wins)
- Rotate Supabase keys; remove `.env.local` from repo (and purge from history if needed).
- Run `pnpm migration:check --strict` locally and plan to remove/rename legacy duplicates over time.
- Confirm DB `exec_sql` function signature uses `query text`; once confirmed, we can remove the `{ sql }` fallback in the helper.
- Results map replacement completed; monitor for UX improvements.
- Decide on multi-sitemap strategy; update robots and docs accordingly.
- Add README to `docs/ARCHIVE` and move duplicates into `deprecated/` with pointers to current docs.
