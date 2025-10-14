# SunsetWell Improvement Roadmap (Excluding Availability Tracking)

Status: Active. This plan captures prioritized, implementation‑ready improvements across functionality, UX, monetization, analytics, SEO, data, and performance. Bed‑availability tracking is intentionally deferred; see AVAILABILITY‑TRACKING‑ROADMAP.md when that initiative is resumed.

## Top Priorities (Quick Wins)

1) Wire up filters on Results page
- Connect UI controls to query params; re-fetch data; apply SQL filters.
- Start: `src/app/results/[sessionId]/page.tsx:754` (MobileFilterModal open) and `src/app/results/[sessionId]/page.tsx:762` (desktop filter sidebar).
- Use/extend matcher filters in `src/lib/matching/sql-matcher.ts:93` and insurance conditions at `src/lib/matching/sql-matcher.ts:114`.

2) Replace embedded map with FacilityMap
- Use `src/components/map/facility-map.tsx:1` for clustered, score‑colored markers and "Search this area".
- Replace iframe at `src/app/results/[sessionId]/page.tsx:893` with `<FacilityMap resources={...} userZip={...} />`.

3) Track high‑value conversions
- Lead modal: after successful POST, call `trackLeadFormSubmit` with facility context.
  - Hook: `src/components/request-info-modal.tsx:54`.
- Ensure phone clicks tracked wherever tel: links exist (already in results; extend to compare page).

## Functionality

- Results Filters (E2E)
  - Sync filters ↔ query params ↔ fetch; disable unimplemented filters.
  - Apply filter logic in SQL matcher; avoid client‑side filtering for accuracy/perf.

- Map Integration
  - Replace iframe with `<FacilityMap />` to reflect actual matches (colored by SunsetWell score).
  - Keep the mobile "Map" tab behavior; preserve sticky metrics bar.

- Facility Detail Pages
  - New route `/facility/[id]`: address, payer acceptance, CMS ratings, SunsetWell score breakdown, contact actions, partner offers.
  - Link targets already referenced in map info windows.

- SunsetWell Score surfacing
  - `sunsetwell_score` and `sunsetwell_percentile` now populated for every SNF (v2.3). Ensure RSC queries (`src/lib/facilities/queries.ts`) continue to expose these fields.
  - Update UI states/tooltips to reflect the predictive harm model (color bands already aligned; add copy via `getSunsetWellScoreTooltip`).

- Multi‑Location Search (Optional)
  - Support a secondary ZIP (e.g., family member). Use `matchResourcesMultipleLocations` (`src/lib/matching/sql-matcher.ts:140`).

- Compare Improvements
  - Add shareable link (encode selected IDs in query), and bulk "Request info for all" (queue individual requests with confirmation).

## UX / Design

- Shared Hero/Backdrop
  - Extract reusable Hero with image + gradient overlays; replace repeated hero code in homepage, navigator, results loading, etc.

- Readability & Feedback
  - Skeletons, empty/error states, and sticky score column on mobile.
  - Tooltips using `getSunsetWellScoreTooltip` for score context.

- Accessibility
  - Verify focus traps and keyboard navigation for modals/tabs.
  - Ensure sufficient contrast with brand pastels; adjust where needed.

- Performance
  - Limit `priority` images to homepage hero; lazy‑load others.

## Monetization

- AdSense Placements (honor env guard in layout)
  - Inline ad after Nth result using `ResultsInlineAd` (component at `src/components/ads/results-inline-ad.tsx:8`).
  - Desktop sidebar using `SidebarAd` (component at `src/components/ads/sidebar-ad.tsx:9`).
  - Comparison page ad using `CompareAd` (component at `src/components/ads/compare-ad.tsx:8`).

- Lead Capture Enhancements
  - Option to gate contact info after email capture (progressive disclosure in modal).

- Sponsored Listings (Phaseable)
  - Surface “Featured” badge + top‑of‑list placement; add label + GTM event.

- Affiliate/Partners
  - Contextual partner tiles on results (e.g., devices on home care queries); data at `src/data/partner-offers.ts:1` and UI `src/components/partners/partner-grid.tsx:1`.

## Analytics & Experimentation

- Event Wiring
  - Lead submit: `trackLeadFormSubmit` in `src/components/request-info-modal.tsx:54`.
  - Phone click: extend to compare page.
  - Filter usage: call `trackFilterUsage` when filters change.
  - Map search: fire `trackMapSearch` on "Search this area".

- Funnels & QA
  - GA4/GTM dashboards for Navigator → Results → Lead/Call.
  - A/B test gate placement via GTM.

## SEO / Impact

- Programmatic Sitemaps
  - Expand `src/app/sitemap.ts:3` to include `/locations` and city pages from `getAvailableLocations()` (`src/lib/locations/queries.ts:93`).

- Location Pages
  - Continue adding city/state pages using measured scores; ensure internal links from `/locations` (`src/app/locations/page.tsx:1`).

- Structured Data
  - Add `BreadcrumbList` JSON‑LD to location & facility pages; ensure FAQ where applicable; keep existing Org/FAQ.

## Data Quality

- Score Availability
  - ✅ SNF coverage: 14,752 / 14,752 scored in v2.3 predictive harm release.
  - Next: extend pipeline to Assisted Living & Home Health once modality-specific features and targets are defined.

- Harm Model Maintenance
  - Monitor CMS feeds for penalty/IJ completeness; reintroduce dropped predictors (`penalty_total_amount`, `deficiency_ij_count`) once missingness < 10%.
  - Backfill explanation UI (top drivers, worst harm metrics) in Results & Facility Detail pages.

- Insurance Flags
  - Normalize display across views; wire filters to SQL via `insuranceTypes` in matcher.

- Contact Data Hygiene
  - Normalize tel: and address formatting for consistent displays and linking.

## Performance, Reliability, Security

- Rate Limiting
  - Replace in‑memory limiter with Redis/Upstash compatible implementation (`src/lib/middleware/rate-limit.ts:10`).

- Supabase Logging (Production)
  - Remove verbose env logging in production inside `src/lib/supabase/server.ts:13`.

- Geocoding Cache
  - Keep client ZIP caching; consider server‑side KV for hot ZIPs if needed.

- Error Reporting
  - Add Sentry/PostHog for API and client errors.

## Implementation Outline

- Filters E2E
  - Add local state ↔ query param sync (desktop + mobile).
  - On change: update URL (shallow) and re-fetch session resources (or call a dedicated search endpoint).
  - Apply filter conditions in `sql-matcher` (insurance, ratings min, distance, etc.).

- Map Upgrade
  - Import and render `<FacilityMap />` in results.
  - Pass `resources` with lat/lng + score; wire `onBoundsSearch` to refetch (optional phase).

- Facility Detail Pages
  - Route `/facility/[id]` SSR or RSC; fetch facility + score + metrics.
  - Add “Request Info” CTA (reuse modal) and partner tiles.

- Analytics
  - Insert conversion/event calls at points noted; validate in GTM preview.

- Ads
  - Insert components at natural breaks; guard load with `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` (already respected by layout).

## Definition of Done

- Filters persist via URL and affect results deterministically via server‑side filtering.
- Map shows matched facilities with SunsetWell‑colored markers; “Search this area” works or is hidden.
- Lead and phone conversions tracked in GTM; events visible in GA4 real‑time.
- Basic facility detail pages live and linked from results/map.
- Ads render (in production) and are invisible in dev without keys.
- No prod console noise from Supabase server client; rate limiter backed by durable store.
- Lighthouse acceptable on mobile (no massive CLS/LCP regressions).

## Non‑Goals

- Real‑time bed availability (deferred; see AVAILABILITY‑TRACKING‑ROADMAP.md).
- Complex ML for scoring or availability estimation.
- New data sources beyond what’s documented in `docs/`.

## File Pointers (Where to Start)

- Results (filters + map + ads):
  - `src/app/results/[sessionId]/page.tsx:754`
  - `src/components/results/mobile-filter-modal.tsx:1`
  - `src/components/map/facility-map.tsx:1`
  - `src/components/ads/results-inline-ad.tsx:8`
  - `src/components/ads/sidebar-ad.tsx:9`

- Matching / Filters:
  - `src/lib/matching/sql-matcher.ts:93`
  - `src/lib/matching/sql-matcher.ts:114`

- Lead Modal + Analytics:
  - `src/components/request-info-modal.tsx:54`
  - `src/lib/analytics/events.ts:61`

- Sessions API (include score):
  - `src/app/api/sessions/[sessionId]/route.ts:45`

- Sitemaps & Locations:
  - `src/app/sitemap.ts:3`
  - `src/app/locations/page.tsx:1`
  - `src/lib/locations/queries.ts:93`

- Supabase & Rate Limiting:
  - `src/lib/supabase/server.ts:13`
  - `src/lib/middleware/rate-limit.ts:10`

---

Notes for Codex:
- Keep changes minimal and focused per section; prefer server‑side filtering over client‑side for correctness.
- Add small, verifiable increments (feature flags or UI toggles) rather than large refactors.
- Use existing patterns (env‑guarded third‑party scripts, analytics helpers, componentized ads) to stay consistent with the codebase.
