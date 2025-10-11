# Comprehensive Data Acquisition & Integration Plan

_Last updated: 2025-10-10_

## Overview
For each facility type, we will:
1. Gather authoritative datasets (CMS, state, third-party).
2. Normalize identifiers using a `facility_identifiers` crosswalk (CCN, NPI, state license, internal IDs).
3. Build ETL scripts to ingest, standardize, and merge data into unified profile views.
4. Create Supabase migrations/views to expose the enriched metrics to the application.

---

## Nursing Homes

### Primary Sources
- **CMS Provider Data Catalog**
  - `nursing-home-provider-info` (overall 5-star, ownership, bed counts)
  - `nursing-home-staffing` (RN/LPN/CNA hours, turnover)
  - `nursing-home-quality-measures` (clinical outcomes, rehospitalizations)
  - `nursing-home-inspections` (health deficiencies, scope/severity)
  - `nursing-home-enforcement` (CMPs, DPNA, enforcement actions)
- **State Health Departments**
  - Licensing databases (state-specific IDs, waiver participation)
  - Cost reports / rate sheets (private pay rates, Medicaid tiers)
  - Special certifications (memory care, ventilator units, secured units)
- **Third-Party**
  - Genworth Cost of Care (price benchmarks)
  - Nursing Home CAHPS (if not in CMS feed)
  - Hospital/ACO preferred networks (where available)

### Migration & Schema
- Extend `resources` with:
  - staffing ratio fields (RN_hours_per_resident, nurse_aide_hours, etc.)
  - quality metrics (rehospitalization_rate, pressure_ulcer_rate, etc.)
  - inspection scores (deficiency_count, last_survey_date)
- Create supporting tables:
  - `nursing_home_deficiencies`
  - `nursing_home_staffing_history`
  - `nursing_home_quality_metrics`
  - `nursing_home_penalties`
  - `facility_identifiers` (ccn, npi, state_license)

### ETL Steps
1. Download latest CMS CSVs monthly (cron + versioned storage).
2. Ingest into staging tables (`stg_cms_*`).
3. Upsert into core tables using CCN joins.
4. Map state datasets via crosswalk (license → resource id). Use fuzzy matching fallback.
5. Populate materialized view `view_nursing_home_profile` summarizing metrics for front-end/API.

### Profile Usage
- Search filters (deficiency-free, high staffing, low rehospitalization).
- Facility detail pages (timeline of inspections, staffing trends).
- Pro dashboard widgets (top/bottom performers, risk alerts).

---

## Assisted Living Facilities

### Primary Sources
- **State Licensing Databases** (most ALFs are state-regulated, not CMS)
  - Facility listings with license numbers, capacity, levels of care
  - Specialty certifications (memory care, limited nursing services)
  - Inspection reports / citations (state-level)
  - Medicaid waiver participation, cost tiers
- **Third-Party**
  - NIC MAP Vision / commercial datasets (if accessible)
  - Genworth Cost of Care / state price surveys
  - Family satisfaction surveys (JoBrown, Caring.com if data-sharing agreements achieved)

### Migration & Schema
- Extend `resources` to include ALF-specific fields:
  - `license_number`, `license_status`, `licensed_capacity`
  - `memory_care_certified`, `secure_unit`
  - `monthly_cost_low`, `monthly_cost_high`
  - `inspection_score`, `last_inspection_date`
- Tables:
  - `assisted_living_inspections`
  - `assisted_living_pricing`
  - `facility_identifiers` (state_license + optional NPI/other IDs)

### ETL Steps
1. For each state, build ingestion scripts parsing CSV/JSON feeds.
2. Standardize columns (license number, status, capacity).
3. Join to `resources` via crosswalk (license + address matching).
4. Store raw inspection/pricing data in normalized tables.
5. Create `view_assisted_living_profile` summarizing capacity, pricing, inspection history.

### Profile Usage
- Filters (memory care certification, secure unit, Medicaid acceptance).
- Pricing comparisons in results/detail pages.
- Pro dashboard alerts for inspection issues or capacity changes.

---

## Home Health Agencies

### Primary Sources
- **CMS Provider Data Catalog**
  - `home-health-compare` (quality measures, patient experience)
  - `home-health-agencies` (ownership, services, CCN/NPI)
  - `home-health-utilization` (visit types, utilization rates)
- **State Data**
  - License lists (if separate from CMS).
  - Medicaid waiver enrollments.
- **Third-Party**
  - HHCAHPS detailed scores.
  - Partnership lists (hospital referrals).

### Migration & Schema
- Extend `resources` for home health fields:
  - `hh_quality_star`, `hh_patient_experience_star`
  - Visit mix (skilled nursing visit %, PT %, OT %)
  - `average_episodes`
- Tables:
  - `home_health_quality_metrics`
  - `home_health_utilization`

### ETL Steps
1. Download CMS datasets; ingest into staging tables keyed by CCN.
2. Join with existing service area mappings (ZIP coverage).
3. Normalize HHCAHPS data if separate feed, match via CCN/NPI.
4. Create `view_home_health_profile` for aggregated metrics.

### Profile Usage
- Map markers with quality scores.
- Filters (high patient experience, low readmissions).
- Service-area recommendations in portal/pro dashboards.

---

## Hospice Providers

### Primary Sources
- **CMS Hospice Compare**
  - Quality measures (pain management, family experience)
  - Utilization and discharge metrics
- **State Licensing**
  - Facility locations, service areas, staffing info
- **Third-Party**
  - CAHPS Hospice Survey (family satisfaction)

### Migration & Schema
- Add fields:
  - `hospice_quality_star`, `caHps_family_experience`
  - `length_of_stay_avg`, `visits_last_days_life`
- Tables:
  - `hospice_quality_metrics`
  - `hospice_service_area` (if distinct from existing mappings)

### ETL Steps
1. Ingest CMS hospice datasets monthly.
2. Match via CCN, update core resource fields.
3. Merge state-level licensing & service-area info using crosswalk.
4. Build `view_hospice_profile` summarizing key metrics.

### Profile Usage
- Search filters (hospice quality rating, inpatient vs. at-home focus).
- Dashboard insights (average length of stay, visit intensity).

---

## Crosswalk & Data Governance
- Implement `facility_identifiers` table with columns: `resource_id`, `ccn`, `npi`, `state`, `state_license`, `source`, `confidence_score`.
- ETL pipelines update crosswalk first, then downstream tables.
- Maintain audit logs for overrides/manual matches.
- Version control data files (S3 or Supabase storage) with timestamps.

## Unified Profiles & Exposure
- Build materialized views (`view_facility_profile`) per facility type combining CMS, state, and third-party metrics.
- API layer exposes these views to front-end (e.g., `GET /api/facilities/[id]/profile`).
- Back-office dashboards (pro portal, facility portal) query the same views for consistent data.
- Use Supabase row-level security to ensure only aggregated/non-PII data is exposed publicly.

## Automation & Refresh Cadence
- Schedule monthly CMS imports via GitHub Actions (see `.github/workflows/data-refresh.yml`) or Supabase cron.
- Orchestrator script `scripts/run-data-refresh.ts` sequences download → process → import tasks with optional `DRY_RUN`.
- State data refresh frequency varies; monitor source change logs and set reminders (quarterly/annually).
- Add smoke tests post-import to validate row counts, key metrics, and missing identifier percentage.

## Next Steps
1. Implement `facility_identifiers` migration and populate with existing CCNs/NPIs.
2. Stand up staging tables and initial ETL scripts for CMS nursing home data.
3. Prioritize high-demand states for ALF data (e.g., CA, FL, TX, NY) and build ingestion pipelines.
4. Integrate quality metrics into search filters and detail pages once views available.
