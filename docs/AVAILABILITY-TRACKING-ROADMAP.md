# Bed Availability Tracking System — Deferred Implementation Plan

Status: Deferred (do not build now). This document outlines a pragmatic, incremental approach to track and surface facility bed availability when we’re ready.

## Why There’s No “Public Feed”
- CMS and most states publish capacity/census with lag (historical), not real-time vacancies.
- Day-to-day availability lives with each facility’s admissions team.
- Therefore: combine self-reported updates + clear freshness labels + optional probabilistic hints.

## Non‑Goals (For Now)
- No web scraping at scale.
- No guaranteed real-time counts.
- No complex auth/CRM; keep initial version lightweight.

## Phase Plan

### Phase 1 — Self‑Reported Availability (MVP)
- Admissions update a simple status:
  - `immediate` (beds now), `short_wait` (1–2 weeks), `waitlist` (3+ weeks), `unknown`.
  - Optional: `beds_available`, `waitlist_weeks`, payer acceptance (Medicare/Medicaid/Private/VA), freeform `notes`.
- TTL policy: treat updates as fresh for 10 days; after TTL, degrade to `unknown`.
- Surfaces:
  - Results list: badge + filter + slight sort boost for `immediate`.
  - Facility page: status badge + “Updated N days ago” + mini history.
  - Facility Portal: quick form to submit updates.

### Phase 2 — Partner & Chain Feeds (Optional)
- Nightly CSV/API pushes from chains (if obtained via BD).
- Same TTL/labels; mark source as `chain_api`.

### Phase 3 — Probabilistic “Likely Availability” (Optional)
- If no self-report: compute “likely openings” from CMS occupancy trends (residents/beds), staffing capacity, and stability signals.
- Label as `estimated (CMS)`, never “beds now”.

## Data Model

Use what exists, add small pieces:

- Write table (already present):
  - `facility_availability_updates` (append-only) — see API: src/app/api/facility/availability/route.ts
    - Fields (proposed superset): `facility_id (uuid)`, `status (text enum)`, `beds_available (int, nullable)`, `waitlist_weeks (int, nullable)`, `accepts_medicaid (bool)`, `accepts_medicare (bool)`, `accepts_private_pay (bool)`, `notes (text)`, `source ('facility'|'chain_api'|'staff'|'estimated')`, `reported_by (text/email, nullable)`, `created_at (timestamptz)`, `expires_at (timestamptz)`.
- Read model (materialized view or table):
  - `facility_current_availability` (one row per facility):
    - `facility_id`, `status`, `beds_available`, `waitlist_weeks`, `accepts_*`, `source`, `updated_at`, `fresh (bool)`, `is_estimated (bool)`.

Example MV logic (pseudo-SQL):
- Pick latest update per facility where `now() < expires_at`.
- Else set `status = 'unknown'`, `fresh = false`.
- Optionally compute `estimated` when no fresh data.

## API Endpoints

- Write (exists): `POST /api/facility/availability`
  - Validated by `availabilityUpdateSchema` (src/lib/validation/facility.ts).
  - Extend schema to include `status`, `source`, `expires_at` (server-populate TTL).
- Read (new):
  - `GET /api/facility/:id/availability/current` → single facility status.
  - `GET /api/facility/availability?status=immediate&state=TX` → for filters/sorting on results.
- Facility preferences (exists): `POST /api/facility/preferences` for notification routing.

Auth (later):
- Magic-link email to facility domains for authenticated updates.
- For MVP, accept unauthenticated writes but throttle + moderate (see “Trust & QA”).

## Aggregation & TTL

- Nightly job (cron):
  - Mark expired updates as stale (`fresh = false`), rebuild `facility_current_availability`.
  - Optionally compute/refresh “estimated” rows for facilities without fresh data.
- Config:
  - Default TTL: 10 days (ENV: `AVAILABILITY_TTL_DAYS=10`).
- Scripts location:
  - Add a `scripts/availability/` folder with `rebuild-current-availability.ts`.

## UI Integration

- Results page (src/app/results/[sessionId]/page.tsx):
  - Show badge next to facility name:
    - `immediate` → “Beds now” (green)
    - `short_wait` → “Short wait (1–2 wks)”
    - `waitlist` → “Waitlist”
    - `unknown` → “Availability unknown”
  - Filters: “Beds now” and “Short wait”.
  - Sort boost: `immediate` > `short_wait` > others (stable tie-breaker by score/distance).
- Facility page (/facility/[id], to be added):
  - Status badge + “Updated N days ago”.
  - Simple timeline (last 3 updates).
  - “Update availability” CTA (opens portal).

- Facility Portal (src/app/facility/portal/page.tsx):
  - Reuse form to submit `status`, optional `beds_available`/`waitlist_weeks`, payer flags.
  - Show preview of how this will appear to users.

## Labels, Trust & QA

- Source labels: `Self‑reported`, `Chain feed`, `Estimated (CMS)`.
- Freshness: show “Updated X days ago” everywhere.
- Moderation:
  - Keep append-only audit (`facility_availability_updates` is already append-only).
  - Optional “pending review” queue for brand-new facilities or suspicious swings (skip for MVP).
- Rate limiting:
  - Use real store (Upstash/Redis) instead of in‑memory for writes to `/api/facility/availability` (current limiter: src/lib/middleware/rate-limit.ts).

## Analytics & Notifications

- Track events (src/lib/analytics/events.ts):
  - `availability_update_submitted` (facility_id, status, source)
  - `availability_badge_viewed` (status, page_type)
  - `filter_usage` with `filterType='availability'`
- (Later) Email/SMS one-tap update links to facilities (weekly cadence).

## Security & Privacy

- No PHI. Only high-level availability + payer flags.
- Validate inputs; strip PII in `notes` if needed.
- Apply IP + facility ID rate limiting; add captcha if spam appears.

## Implementation Checklist (Deferred)

- [ ] DB: Add MV/table `facility_current_availability`; add `status`, `source`, `expires_at` columns to updates if missing.
- [ ] API: Extend POST `/api/facility/availability` to accept `status`; add GET endpoints for current availability.
- [ ] Job: Nightly cron to rebuild current availability and expire stale rows.
- [ ] UI: Results badges + filters; facility page timeline; portal form polish.
- [ ] Analytics: Fire events for updates, badges, and filters.
- [ ] Docs: User-facing explanation: “How availability works” (self‑reported, last updated, estimates).

## File Pointers (to integrate later)

- Availability write API: src/app/api/facility/availability/route.ts
- Validation schemas: src/lib/validation/facility.ts
- Facility Portal (submission UI): src/app/facility/portal/page.tsx
- Results list (badges/filters): src/app/results/[sessionId]/page.tsx
- Analytics helpers: src/lib/analytics/events.ts
- Rate limiting (replace/integrate with Redis): src/lib/middleware/rate-limit.ts
- Supabase server client: src/lib/supabase/server.ts

## Rollout

1) Pilot in 1–2 metros with outreach to top facilities.
2) Monitor accuracy and user interactions; adjust TTL and UI labels.
3) Scale regionally; add partner feeds where available.
4) Only then consider estimated availability and auth/magic links.
