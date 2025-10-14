# SunsetWell Scoring Coverage Summary

**Date**: October 14, 2025
**Status**: VERIFIED COMPLETE ✅

## Overall Status

Successfully completed the SunsetWell scoring pipeline with comprehensive coverage across all facility types.

## Facility Coverage (VERIFIED with pagination)

### Skilled Nursing Facilities (SNFs)
- **Total facilities**: 14,752
- **With CCN identifiers**: 14,752 (100.0%) ✅
- **With state data**: 14,752 (100.0%) ✅
- **With precise geolocation**: 14,752 (100.0%) ✅
- **With CMS quality data**: 14,614 (99.1%)
- **With supplemental harm metrics**: 14,752 (100.0%)
- **With SunsetWell scores**: **14,752 (100.0%) ✅**

### Why 100% Coverage Now?

- Shared feature loader (`scripts/scoring/feature-utils.ts`) hydrates long-stay MDS outcomes, deficiency severity, and complaint/incident rates from processed CSVs.
- Missing data guardrails drop only sparse features (>10% missingness) while median-imputing the rest.
- Pagination bug (default 1,000 row limit) resolved with `.order('facility_id')` and consistent loops in both training and scoring scripts.
- Result: every facility with valid Bed/CCN metadata receives a score, aligned with CMS reporting breadth.

### Other Facility Types
- **Assisted Living**: 44,636 facilities (SunsetWell coverage 39,463 / 44,636 = 88.4%)
- **Home Health**: 13,741 facilities (SunsetWell coverage pending)
- **Hospice**: Scoring in discovery stage

## Pipeline Components

### 1. State Population ✅
**Status**: 100% Complete
- All 14,752 nursing homes now have populated `states` arrays
- Extracted from CMS provider data (nursing-homes-providers.csv)
- Critical for peer-group normalization (facilities compared within their state)

### 2. Predictive Harm Training ✅
**Status**: Complete
- `scripts/train-v2_3-weights.ts` learns weights over 27 predictors with PHI labels.
- Median imputations, scaling bounds, and calibration quantiles stored in config.

### 3. Score Calculation ✅
**Status**: Complete
- `scripts/calculate-sunsetwell-scores-v2_3.ts` hydrates features via shared utilities.
- 14,752 facilities scored (100% coverage) with percentiles computed per state/division group.
- Results emitted to `data/cms/processed/sunsetwell-scores-v2_3.csv`.

## Database Schema

### sunsetwell_scores table
```typescript
{
  id: UUID (primary key)
  facility_id: UUID (references resources.id)
  overall_score: number (0-100 scale)
  overall_percentile: number (peer-adjusted ranking)
  version: string ("v2")
  calculation_date: date
  created_at: timestamp
  updated_at: timestamp
}
```

Note: Currently only `overall_score` and `overall_percentile` are populated. Future work may add category-specific scores (quality, staffing, safety, care).

## Next Steps

1. **Expand CMS Data Collection**
   - Import additional CMS metrics to increase scoring coverage
   - Target: 80%+ coverage for nursing homes

2. **Add ALF and Home Health Scoring**
   - Acquire CMS data for assisted living facilities
   - Acquire CMS data for home health agencies
   - Adapt scoring model for these provider types

3. **Score Category Breakdowns**
   - Populate quality_score, staffing_score, safety_score, care_score fields
   - Provide more granular insights for users

4. **Historical Trending**
   - Track score changes over time
   - Alert on significant deterioration

## Technical Notes

### Scripts Created
- `populate-states-parallel.ts` - Parallel batch updates for state population
- `normalize-facility-metrics.ts` - Z-score normalization by peer group
- `calculate-sunsetwell-scores-full.ts` - Full scoring with pagination
- `comprehensive-facility-survey.ts` - Coverage analysis

### Performance Optimizations
- Parallel batch updates (50 concurrent) for state population
- Pagination for large dataset queries (prevent 1000-row default limit)
- Efficient peer-group aggregation for normalization

### Data Quality
- 100% of nursing homes have states for peer grouping ✅
- 100% of nursing homes have predictive features after imputation ✅
- 100% of nursing homes now have SunsetWell scores ✅
- 88.4% of assisted living facilities have SunsetWell scores (state data limitations) ✅
- Pagination/order issues resolved across scripts ✅
- Coverage verified via `analysis/scoring/v2_3_evaluation.json` and ad-hoc count scripts ✅

## Files Modified
- Added state population scripts
- Enhanced scoring scripts with pagination
- Created comprehensive survey tools
- Documented scoring methodology
