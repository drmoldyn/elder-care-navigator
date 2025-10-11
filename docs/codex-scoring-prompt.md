# Codex Task: Develop SunsetWell Empirical Scoring Model

## Project Root

**Work from:** `/Users/dtemp/Desktop/nonnie-world`

All paths referenced in this document are relative to this root directory.

## Context

You are working on **SunsetWell** (sunsetwell.com), a senior care facility navigator that helps families find nursing homes, assisted living, home health, and hospice care. The application uses a Next.js 15 frontend with a Supabase PostgreSQL database containing ~75,000 facilities with CMS (Centers for Medicare & Medicaid Services) quality data.

## Your Mission

Develop an **empirically-weighted scoring algorithm** called the "SunsetWell Score" that normalizes facility quality metrics within regional peer groups and provides percentile rankings. This score should be more meaningful than raw CMS ratings by:

1. **Normalizing for regional variation** (rural vs urban, state-level differences)
2. **Weighting metrics based on actual patient outcomes** (not arbitrary weights)
3. **Providing peer-group percentiles** (compare apples to apples)
4. **Being transparent and explainable** to end users

## Database Schema

### Primary Table: `resources`
Contains all facilities with these key columns:

**Identifiers:**
- `facility_id` (TEXT, primary key)
- `provider_type` (nursing_home, assisted_living, home_health, hospice)
- `state`, `county`, `zip_code`

**CMS Quality Ratings (Nursing Homes):**
- `overall_rating` (1-5 stars)
- `health_inspection_rating` (1-5 stars)
- `quality_measures_rating` (1-5 stars)
- `staffing_rating` (1-5 stars)

**Staffing Metrics:**
- `rn_staffing_hours_per_resident_per_day`
- `total_nurse_staffing_hours_per_resident_per_day`
- `reported_nurse_aide_staffing_hours_per_resident_per_day`
- `total_number_of_nurse_staff_hours_per_resident_per_day`

**Quality/Safety (from migrations 0008-0013):**
- `total_weighted_health_survey_score`
- `number_of_facility_reported_incidents`
- `number_of_substantiated_complaints`
- `number_of_fines`
- `total_amount_of_fines`

**Related Tables:**
- `nursing_home_quality_metrics` - detailed quality measures
- `nursing_home_deficiencies` - inspection deficiencies by scope/severity
- `nursing_home_penalties` - financial penalties and CMPs
- `home_health_quality_metrics` - HH-specific outcomes
- `hospice_quality_metrics` - hospice CAHPS and outcomes
- `assisted_living_inspections` - ALF inspection results

### New Scoring Tables (migration 0014)

**`peer_groups`** - Define comparison groups
```sql
- id, name, facility_type
- criteria (JSONB) - e.g., {"state": "VA", "bed_count_min": 50, "bed_count_max": 150}
```

**`benchmark_metrics`** - Statistical benchmarks per peer group
```sql
- peer_group_id, metric_name
- mean, median, std_dev, p10, p25, p50, p75, p90
- sample_count, calculation_date
```

**`sunsetwell_scores`** - Calculated scores
```sql
- facility_id, peer_group_id
- overall_score (0-100)
- quality_score, staffing_score, safety_score, care_score (0-100 each)
- overall_percentile, quality_percentile, staffing_percentile, safety_percentile
- metric_percentiles (JSONB) - individual metric percentiles
```

## Your Tasks

### Phase 1: Data Analysis & Weight Determination (CURRENT)

**File:** `docs/scoring-model.md`

1. **Analyze CMS methodology**
   - Review how CMS calculates their 5-star ratings
   - Document their weights (Health Inspections ~60%, Staffing ~20%, Quality ~20%)
   - Identify which metrics predict good outcomes

2. **Correlation analysis**
   - Calculate correlations between metrics and outcomes:
     - Deficiency counts vs. serious citations
     - Staffing levels vs. quality ratings
     - Quality measures vs. patient incidents
   - Identify redundant metrics (high multicollinearity)

3. **Determine empirical weights**
   - Option A: Use CMS weights as baseline (proven methodology)
   - Option B: Run regression with outcomes as dependent variable
   - Option C: PCA to identify principal components
   - **Recommended:** Start with CMS, validate with correlation analysis

4. **Define peer groups**
   - By facility type (nursing home, ALF, home health, hospice)
   - By size (bed count quartiles)
   - By geography (state, MSA vs rural)
   - By ownership (for-profit, non-profit, government)

### Phase 2: Benchmark Calculation

Create a script to:
1. Calculate statistical benchmarks (mean, median, percentiles) for each metric within each peer group
2. Store results in `benchmark_metrics` table
3. Handle missing data gracefully
4. Update monthly as new data arrives

### Phase 3: Score Calculation

Create a script to:
1. Assign each facility to appropriate peer group(s)
2. Calculate component scores (0-100) using z-scores or percentile-based normalization
3. Combine component scores using empirical weights
4. Calculate percentile rankings within peer group
5. Store in `sunsetwell_scores` table
6. Handle edge cases (facilities with missing data, new facilities)

### Phase 4: Validation

1. **Face validity:** Do high-scoring facilities have fewer deficiencies?
2. **Predictive validity:** Do scores correlate with future outcomes?
3. **Distribution check:** Are scores normally distributed within peer groups?
4. **Outlier analysis:** Flag facilities with anomalous score/data combinations

## Data Sources Available

All CMS data has been imported:
- Nursing Homes Provider Info (~15,500 facilities)
- Home Health Agencies (~12,000 agencies)
- Hospice Providers (~5,000 providers)
- Hospital medical systems (~6,000 hospitals)

CMS data dictionaries are in `data/cms/` directory.

## Technical Stack

- **Database:** Supabase (PostgreSQL 15)
- **Scripts:** TypeScript with tsx runner
- **Data processing:** Can use Python if needed for statistical analysis
- **Environment:** Node.js 20.x, pnpm package manager

## Key Constraints

1. **Transparency:** Scoring must be explainable to non-technical users
2. **Fairness:** Must not disadvantage small/rural/minority-serving facilities
3. **Data quality:** Handle missing data gracefully (not all facilities have all metrics)
4. **Performance:** Scores should be pre-calculated, not computed on-demand
5. **Maintainability:** Algorithm should be updateable as CMS methodology evolves

## Success Criteria

✅ Empirically-derived weights based on outcome correlations or CMS methodology
✅ Peer group definitions that enable fair comparisons
✅ Scores that discriminate between high and low quality facilities
✅ Percentile rankings that add context to raw scores
✅ Documentation of methodology for users
✅ Validation showing scores predict actual quality

## Getting Started

1. Review `docs/scoring-model.md` for initial research
2. Query the database to understand data distribution and completeness
3. Analyze correlations between metrics
4. Document proposed weighting methodology
5. Implement benchmark calculation script
6. Implement score calculation script
7. Run validation analyses

## Questions to Answer

1. What metrics are most predictive of quality outcomes?
2. How should we weight different facility types (nursing home vs hospice)?
3. What peer group stratifications provide the most meaningful comparisons?
4. How do we handle facilities with incomplete data?
5. Should weights vary by facility type or geography?
6. How often should scores be recalculated?

## Reference Files

- Database migrations: `supabase/migrations/0008-0014_*.sql`
- Existing matching logic: `src/lib/matching/*.ts`
- CMS data dictionaries: `data/cms/`
- Scoring model research: `docs/scoring-model.md`

---

**Start by reviewing the database schema, analyzing metric distributions, and proposing an empirical weighting methodology in `docs/scoring-model.md`. Focus on transparency, fairness, and statistical rigor.**
