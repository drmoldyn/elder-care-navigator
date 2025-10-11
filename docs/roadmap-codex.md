# Codex Monetization Roadmap

_Last updated: 2025-10-10_

## Active Focus Areas

1. **Facility Partner Portal (Leads & Availability)**
   - [x] Define Supabase schema for facility users, availability updates, and feature toggles
   - [x] Stub authenticated facility routes (`/facility/portal`) with placeholder UI
   - [x] Create API endpoints for claiming profiles and updating availability
   - [x] Integrate lead delivery preferences (email/SMS) once tracking hooks land

2. **Professional Dashboard (Social Workers / Case Managers)**
   - [x] Outline required data model: clients, placement notes, saved searches
   - [x] Build initial `/pro` dashboard shell with mocked widgets
   - [x] Explore pricing/entitlement flags for future billing integration

3. **Affiliate & Marketplace Enablement**
   - [x] Catalog priority partners (elder law, Medicaid planners, medical devices)
   - [x] Design partner listing component & call-to-action pattern
   - [x] Connect partner clicks to analytics funnel (dependent on Claude’s tracking rollout)

4. **Data & Reporting Products**
   - [x] Draft Supabase views for demand metrics (search volume, insurance mix)
   - [x] Prototype export/report pipeline (CSV + PDF) for market insights

## Coordination Notes

- Claude Code is onboarding Google Ads, GTM, and measurement; defer any analytics snippets until his changes land.
- Keep new routes/components feature-flagged to avoid exposing incomplete workflows to end users.
- Maintain compatibility with existing lead modal and session persistence—no breaking API changes without alignment.

## Upcoming Checkpoints

- **Daily:** update completion checkboxes as tasks finish or reprioritize
- **Weekly:** reassess revenue impact, unblock dependencies (tracking, auth, billing)

---

_Short URL for status sharing: `docs/roadmap-codex.md`_
