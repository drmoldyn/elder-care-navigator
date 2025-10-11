# SunsetWell Facility Scoring Model

_Last updated: 2025-10-10_

## Objectives
- Combine diverse quality, staffing, inspection, and affordability metrics into a single composite score that is peer-comparable and explainable.
- Normalize metrics within relevant peer groups (facility type + region) so facilities are measured against local competitors.
- Produce percentile-based scores that are easy for families, social workers, and facilities to interpret.
- Keep the scoring pipeline reproducible, auditable, and versioned.

## Phase 1 Empirical Findings (2025-10-10)
### Data coverage snapshot (nursing homes)
- 14,752 facilities with CMS star ratings and staffing detail; regression-ready sample of 12,470 rows after requiring complete predictors.
- Mean inspection star rating 2.81 (sd 1.28) and overall quality rating 2.92 (sd 1.42), confirming skew toward the middle of the five-star range.
- Average total nurse hours per resident day 3.85 (sd 0.92); RN-specific hours average 0.68 with a long right tail (max 9.42) indicating rare high-intensity sites.
- Staff turnover is high: mean total nurse turnover 46.9% (sd 14.6) and RN turnover 43.8% (sd 20.9).
- Safety outcomes are noisy: substantiated complaints mean 6.39 (sd 11.46) and facility-reported incidents mean 2.04 (sd 4.29), both heavy-tailed.

### Correlation highlights (see `docs/scoring-analysis.json`)
- Health inspection rating is tightly coupled with the CMS overall rating (r = 0.89) and inversely related to complaints (r = -0.44).
- Staffing adequacy and stability matter: total nurse hours correlates with the overall rating (r = 0.33), while RN turnover correlates inversely with staffing stars (r = -0.51) and overall rating (r = -0.38).
- Complaints and incidents show moderate correlations with turnover (r ≈ 0.21) but weaker ties to staffing hours, suggesting stability is a better safety signal than raw staffing counts.

### Multi-outcome regression (details in `docs/regression-results.json`)
- Predictors: standardized inspection, quality, staffing stars, staffing hours, and turnover metrics.
- Outcomes: log-transformed substantiated complaints and facility-reported incidents (safety proxies), plus overall star rating (face-validity check).
- Complaints model explains 35.1% of variance; incidents 16.3%; overall rating 91.1% (expected because CMS overall aggregates similar metrics).
- Protective signals (negative coefficients) dominate for inspections and staffing stars; turnover adds risk even after controlling for other factors.

### Derived relative importances (normalized absolute coefficients)
| Metric | Complaints | Incidents | Combined |
|--------|------------|-----------|----------|
| Health inspection rating | 0.53 | 0.53 | 0.53 |
| Quality measure rating | 0.03 | 0.05 | 0.04 |
| Staffing rating | 0.20 | 0.07 | 0.14 |
| Total nurse hours / resident day | 0.06 | 0.12 | 0.09 |
| RN hours / resident day | 0.08 | 0.12 | 0.10 |
| Total nurse staff turnover | 0.07 | 0.04 | 0.06 |
| RN turnover | 0.01 | 0.08 | 0.05 |

These combined weights suggest inspections remain the strongest predictor of adverse outcomes, but staffing adequacy (rating + hours) and stability (turnover) together account for ~44% of the explainable variance, exceeding CMS's historical 20% staffing weight.

### Recommended starting weights (SunsetWell Score v2 draft)
- **Inspection & Compliance (0.53)**: `health_inspection_rating` (cap contribution at 0.55 to avoid over-dominance).
- **Staffing Capacity (0.32)**: `staffing_rating` (0.14), `total_nurse_hours_per_resident_per_day` (0.09), `rn_hours_per_resident_per_day` (0.09).
- **Staffing Stability (0.10)**: `total_nurse_staff_turnover` (0.06), `rn_turnover` (0.04) with inverse scoring (lower is better).
- **Clinical Quality Measures (0.05)**: `quality_measure_rating` retained for completeness despite lower predictive power; revisit once rehospitalization and pressure-ulcer detail joins the dataset.
- Normalize each component within peer-group percentiles before applying weights to preserve comparability across states and facility sizes.

### Open analytical actions
- Incorporate deficiency counts, fine totals, and immediate jeopardy flags once imported to validate the safety component against regulatory outcomes.
- Extend the regression framework to assisted living, hospice, and home health using their modality-specific outcome measures.
- Test alternative link functions (e.g., Poisson for counts) and penalized regression to handle multicollinearity between staffing metrics.

## Data Pipeline Overview
1. **Raw Metrics**: Imported into `resources` and supporting tables via the nightly data refresh (CMS nursing home/home health/hospice feeds, state ALF data).
2. **Normalization Step** (`scripts/normalize-facility-metrics.ts`):
   - Groups facilities by provider type and state.
   - Computes mean, standard deviation, z-score, and percentile for each metric.
   - Stores results in `facility_metrics_normalized` with the current `score_version`.
3. **Peer Group Benchmarks** (`scripts/calculate-benchmarks.ts`):
   - Pulls peer group definitions from Supabase.
   - Applies criteria filters (state, bed count, ownership, rurality) to eligible facilities.
   - Calculates mean, std dev, and p10/p25/p50/p75/p90 for each metric within the group and upserts into `benchmark_metrics`.
   - Accepts optional `BENCHMARK_CALCULATION_DATE=YYYY-MM-DD` to backfill historical benchmark snapshots.
4. **Weighting & Aggregation**:
   - Retrieves metric weights from `facility_metric_weights` (if present) or falls back to defaults.
   - Calculates weighted composite scores per facility and rescales to a 0–100 percentile within the peer group.
   - Upserts scores into `facility_scores`.
5. **Reporting/Consumption**: Scores feed UI components (facility detail pages, professional dashboard, facility portal) and analytics exports.

## Metric Catalog (v1)
| Metric Key | Column | Provider Types | Direction | Notes |
|------------|--------|----------------|-----------|-------|
| `staffing_rating` | `staffing_rating` | nursing_home | Higher is better | CMS staffing star rating |
| `health_inspection_rating` | `health_inspection_rating` | nursing_home | Higher is better | CMS inspection star rating |
| `quality_measure_rating` | `quality_measure_rating` | nursing_home | Higher is better | CMS quality star rating |
| `total_nurse_hours_per_resident_per_day` | `total_nurse_hours_per_resident_per_day` | nursing_home | Higher is better | Total nurse hours |
| `rn_hours_per_resident_per_day` | `rn_hours_per_resident_per_day` | nursing_home | Higher is better | Registered nurse hours |
| `total_nurse_staff_turnover` | `total_nurse_staff_turnover` | nursing_home | Lower is better | Nurse turnover percent |
| `number_of_facility_reported_incidents` | `number_of_facility_reported_incidents` | nursing_home | Lower is better | Past 3 years |
| `number_of_substantiated_complaints` | `number_of_substantiated_complaints` | nursing_home | Lower is better | Past 3 years |
| `licensed_capacity` | `licensed_capacity` | assisted_living | Higher is better | Licensed beds |
| `medicaid_accepted` | `medicaid_accepted` | assisted_living | Higher is better | Boolean converted to 0/1 |
| `home_health_quality_star` | `home_health_quality_star` | home_health | Higher is better | CMS quality star rating |
| `home_health_cahps_star` | `home_health_cahps_star` | home_health | Higher is better | CMS CAHPS star rating |
| `hospice_quality_star` | `hospice_quality_star` | hospice | Higher is better | Hospice quality rating |
| `hospice_family_experience_star` | `hospice_family_experience_star` | hospice | Higher is better | Hospice family experience |

> Metrics will expand as additional state / partner feeds land. Each addition should update `METRICS` in `scripts/normalize-facility-metrics.ts` and defaults in `DEFAULT_WEIGHTS`.

## Weighting Strategy
- Seed `facility_metric_weights` with the regression-derived nursing home bundle, keyed to `score_version = 'v2'` and documented in `docs/regression-results.json`.
- `scripts/normalize-facility-metrics.ts` now defaults to `METRIC_SCORE_VERSION=v2` and loads metric metadata/weights from `scripts/scoring/config.ts` for consistency across scripts.
- Persist component percentiles (`inspection`, `staffing_capacity`, `staffing_stability`, `clinical_quality`) in `sunsetwell_scores.metric_percentiles` for explainability and UI breakdowns.
- Backfill missing metrics with peer-group medians and emit a completeness flag so rural facilities are not penalized for data sparsity.
- Allow provider-type overrides by storing distinct weight bundles per `[provider_type, score_version]` to support modality-specific models as additional regressions land.
- Recompute and version weights quarterly; log every run in `score_calculations` with the dataset snapshot and feature list used for training.

## Scoring Runbook
- **Apply schema migrations**: run `supabase/migrations/0014_facility_scores.sql` and `supabase/migrations/0014_sunsetwell_scoring.sql` in the Supabase SQL editor (creates `facility_metric_weights`, `facility_metrics_normalized`, `facility_scores`, `peer_groups`, `benchmark_metrics`, and supporting functions).
- **Seed model weights**: `METRIC_SCORE_VERSION=v2 pnpm tsx scripts/seed-metric-weights.ts` (idempotent upsert of the v2 bundle).
- **Seed peer cohorts**: `pnpm tsx scripts/seed-peer-groups.ts` (builds geography → size → ownership hierarchy and populates `peer_groups`).
- **Normalize metrics**: `METRIC_SCORE_VERSION=v2 pnpm tsx scripts/normalize-facility-metrics.ts` (writes `facility_metrics_normalized` + `facility_scores`).
- **Refresh benchmarks**: `BENCHMARK_CALCULATION_DATE=$(date +%F) pnpm tsx scripts/calculate-benchmarks.ts` (recomputes distribution stats for every peer group).
- **Validate**: inspect `score_calculations` log rows and spot-check `sunsetwell_scores` for expected sample counts before exposing to end users.

## Versioning & Auditing
- `SCORE_VERSION` (env `METRIC_SCORE_VERSION`, default `v2`) allows parallel scoring models.
- Each run records `calculated_at` and `score_version` in normalized metrics and scores tables.
- To roll out a new model, populate `facility_metric_weights` with the new version and re-run the script with `METRIC_SCORE_VERSION=new_version`.

## Scheduled Execution
- `scripts/run-data-refresh.ts` invokes the normalization script after data imports.
- GitHub Action `.github/workflows/data-refresh.yml` runs weekly (and can be triggered manually).
- Supabase views/tables are ready for downstream consumption by APIs and dashboards.

## Peer Group Strategy
- **Hierarchy**: assign peers by `(facility_type → state → Census division → national)` and only keep a slice when the sample stays healthy (≥30 facilities). States that fall below the threshold roll into their division (e.g., South Atlantic); any remainder becomes a multi-state pool.
- **Size bands**: nursing homes use 0–59, 60–119, 120–179, and 180+ beds; assisted living uses 0–49, 50–99, 100–149, and 150+ licensed capacity. If any segment drops under 20 facilities we collapse back to an “all sizes” cohort. Home health and hospice currently remain single-size groups until reliable volume metrics are available.
- **Ownership splits**: within each size cohort we split into for-profit vs nonprofit/government when both sub-samples retain ≥20 facilities; otherwise ownership stays merged. Raw Supabase `ownership_type` strings are captured in `criteria.ownership_types` so downstream matching is deterministic.
- **Missing data safeguards**: facilities without bed data are routed to an `allow_unknown_bed_count` cohort when enough volume exists; otherwise they remain in the parent group to avoid losing coverage.
- **Automation**: `scripts/seed-peer-groups.ts` builds the hierarchy, applies the thresholds, and upserts `peer_groups` records with JSON criteria (states, bed bounds, ownership filters, etc.). Thresholds can be tuned via `PEER_GROUP_MIN_STATE`, `PEER_GROUP_MIN_DIVISION`, and `PEER_GROUP_MIN_SEGMENT` env vars.
- **Maintenance**: rerun the seeding script after every major ingest (or quarterly) and refresh benchmarks via `scripts/calculate-benchmarks.ts` so percentile stats track the active peer definitions.

## Next Enhancements
- Expand metric coverage for assisted living, home health, and hospice as state data matures.
- Run assisted living / home health / hospice regressions once modality-specific outcomes (e.g., CAHPS, hospitalization rates) are verified.
- Surface “SunsetWell Score” and contribution breakdowns in facility detail pages.
- Provide professional/facility portals with trend charts and benchmarking tools.
