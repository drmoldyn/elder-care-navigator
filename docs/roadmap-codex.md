# Codex Monetization Roadmap

_Last updated: 2025-10-11_

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


## SunsetWell Score Integration ✅ COMPLETED

### Completed ✅
- [x] **Scoring Model Development**: Empirical weight derivation via regression analysis (see `docs/scoring-model.md`)
- [x] **Database Schema**: Tables for `facility_scores`, `facility_metrics_normalized`, `peer_groups`, `benchmark_metrics`
- [x] **Peer Group Hierarchy**: State → Census division → national with size/ownership stratification
- [x] **Metrics Dashboard**: Interactive visualization at `/metrics` with component breakdowns
- [x] **Documentation**: Comprehensive specs in `docs/SUNSETWELL-SCORE-UI-SPEC.md`
- [x] **Table View UI**: Replaced card layout with scannable comparison table showing:
  - Distance | Facility Name | Health ⭐ | Staffing ⭐ | Quality ⭐ | **SunsetWell Score (bold, color-coded)**
- [x] **Color-Coded Markers**: Map pins color-coded by SunsetWell Score (green 90+/light green 75+/yellow 60+/orange 40+/red <40)
- [x] **API Integration**: Joined `facility_scores` table v2 in matching API route with proper versioning
- [x] **Score Helper Utilities**: Created `score-helpers.ts` with color coding and badge functions
- [x] **Data Plumbing Fixes**: Fixed field names, null handling, and version filtering per Codex review
- [x] **Score Calculation Pipeline**: Migrations completed, automated refresh via `scripts/normalize-facility-metrics.ts`

### Next Steps
- [ ] **Facility Detail Pages**: Deep-dive quality breakdown with score explanations
- [ ] **Professional Dashboard**: Benchmark comparisons and trend analysis for facility partners
- [ ] **Score Expansion**: Extend to assisted living, home health, and hospice providers
- [ ] **Transparency Page**: Public methodology documentation for end users

## Future Considerations

- [x] Normalization engine for facility metrics (aggregate 5-Star components, staffing ratios, deficiencies) with facility-type and region-aware scaling.
- [ ] Public/partner API surface for agent-to-agent integrations (social workers, hospital EMRs, virtual assistants).
- [ ] Sandboxed developer portal + API keys for third-party agent testing.
- [ ] Intent-specific product bundles (DME, home safety) tied to matching logic.
