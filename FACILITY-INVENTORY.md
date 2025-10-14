# SunsetWell Facility Inventory

**Last Updated**: October 13, 2025
**Verification Method**: Multiple independent scripts with proper pagination
**Status**: VERIFIED COMPLETE ✅

---

## Executive Summary

- **Total Facilities**: 73,129
- **With SunsetWell Scores**: 53,843 (73.6%)
- **Score Version**: v2

---

## Detailed Breakdown

### 🏥 Skilled Nursing Facilities (SNFs)

**Source**: CMS Medicare.gov Provider Data

| Metric | Count | Percentage |
|--------|-------|------------|
| Total facilities | 14,752 | 100.0% |
| With CCN identifiers | 14,752 | 100.0% |
| With precise geolocation (lat/lng) | 14,752 | 100.0% |
| With state data for peer grouping | 14,752 | 100.0% |
| With CMS quality metrics | 14,614 | 99.1% |
| **With SunsetWell Scores** | **14,380** | **97.5%** ✅ |

**Data Quality Notes**:
- 100% geolocation coverage using CMS-provided addresses
- 100% state coverage for peer-group normalization
- 97.5% scoring coverage aligns with CMS data availability
- Missing scores (2.5%) represent facilities with insufficient metric combinations

---

### 🏡 Assisted Living Facilities (ALFs)

**Source**: State licensing databases (all 50 states)

| Metric | Count | Percentage |
|--------|-------|------------|
| Total facilities | 44,636 | 100.0% |
| With facility IDs | 39,216 | 87.9% |
| With precise geolocation (lat/lng) | 44,229 | 99.1% |
| With state data for peer grouping | 44,636 | 100.0% |
| **With SunsetWell Scores** | **39,463** | **88.4%** ✅ |

**Data Quality Notes**:
- 99.1% geolocation coverage using state-provided addresses
- 100% state coverage for peer-group normalization
- 88.4% scoring coverage - excellent for ALFs (no federal CMS data requirement)
- State-level facility IDs vary by state (some states don't provide IDs)

---

### 🏠 Home Health Agencies

**Source**: CMS Medicare.gov Provider Data

| Metric | Count | Percentage |
|--------|-------|------------|
| Total facilities | 13,741 | 100.0% |
| With CCN identifiers | 13,741 | 100.0% |
| With precise geolocation (lat/lng) | 13,740 | 100.0% |
| With state data for peer grouping | 13,741 | 100.0% |
| With CMS quality metrics | 0 | 0.0% |
| **With SunsetWell Scores** | **0** | **0.0%** ⏳ |

**Data Quality Notes**:
- 100% geolocation coverage using CMS-provided addresses
- 100% state coverage for peer-group normalization
- **Scoring pending**: Awaiting CMS quality metrics import for home health agencies
- CMS provides quality star ratings for home health - import in progress

---

## Scoring Methodology (v2 - VERIFIED CORRECT)

### Two Distinct Metrics

**1. SunsetWell Score (`overall_score`)**:
- **Definition**: Non-normalized weighted composite score (0-100 scale)
- **Purpose**: Absolute quality measure based on facility performance
- **Calculation**:
  1. Calculate weighted z-scores for each metric within peer group
  2. Sum weighted z-scores: `composite_z = Σ(weight × z_score)`
  3. Normalize to 0-100 scale: `score = 50 + (composite_z × 25)`
  4. Clamp to range: `max(0, min(100, score))`
- **Example**: A facility with excellent staffing (z=+2) and good inspections (z=+1) might score 75

**2. Percentile Rank (`overall_percentile`)**:
- **Definition**: Peer-group relative ranking (0-100)
- **Purpose**: Shows where facility ranks compared to similar facilities in same state
- **Calculation**: Rank facility's `overall_score` within peer group (state + provider_type)
- **Example**: Score of 75 might be 85th percentile in competitive state, 95th percentile in less competitive state

### Metric Weights

**For Nursing Homes** (weighted composite):
- Inspection & Compliance: 53% (`health_inspection_rating`)
- Staffing: 14% (`staffing_rating`)
- Nurse Hours: 9% each (`total_nurse_hours_per_resident_per_day`, `rn_hours_per_resident_per_day`)
- Staff Turnover: 6% + 4% (`total_nurse_staff_turnover`, `rn_turnover`)
- Quality Measures: 5% (`quality_measure_rating`)

**For Assisted Living** (adapted weights):
- State inspection results
- Staffing adequacy
- License status and compliance

### Peer Group Hierarchy

Scores are calculated within peer groups (for fair comparison):
1. **Primary**: State + Provider Type (e.g., "CA nursing_home")
2. **Fallback**: Census Division + Provider Type
3. **Last Resort**: National + Provider Type

### Technical Implementation

**Correct Script**: `scripts/calculate-sunsetwell-scores-full.ts`
- Generates BOTH `overall_score` (absolute) AND `overall_percentile` (relative)
- Uses proper z-score normalization within peer groups
- Verified correct methodology in v2 scores (99% of facilities show score ≠ percentile)

**Incorrect Script** (DO NOT USE): `scripts/normalize-facility-metrics.ts`
- Bug: Replaces weighted composite with just percentile rank
- Result: overall_score = overall_percentile (wrong!)
- This script is for metric normalization only, not final scoring

---

## Verification Scripts

The following scripts were used to verify these counts:

1. **check-provider-types.ts**: Confirms total facility counts by type
2. **comprehensive-facility-inventory.ts**: Full inventory with data quality metrics
3. **quick-score-check.ts**: Rapid verification of score coverage
4. **diagnose-score-discrepancy.ts**: Detailed analysis of scoring coverage

All scripts use proper pagination to avoid Supabase's 1,000-row default limit.

---

## Known Issues & Limitations

### Resolved ✅
- ✅ Pagination bugs in Supabase queries (was capping at 1,000 rows)
- ✅ State population for peer grouping (now 100% coverage)
- ✅ Score calculation for all facility types with data

### In Progress 🚧
- 🚧 Home health CMS quality data import
- 🚧 Hospice agency data acquisition

### Future Enhancements 🔮
- Score category breakdowns (quality, staffing, safety subscores)
- Historical score tracking and trending
- Automated nightly score refresh pipeline

---

## Data Sources

### Primary Sources
- **CMS Medicare.gov**: Nursing homes and home health agencies
- **State Licensing Databases**: Assisted living facilities (all 50 states)
- **CMS 5-Star Rating System**: Quality metrics for nursing homes

### Data Refresh Schedule
- **Current**: Manual refresh on demand
- **Planned**: Automated nightly refresh pipeline

---

## Contact & Support

For questions about facility data or scoring:
1. Review this document
2. Check `/docs/scoring-model.md` for methodology
3. Run verification scripts in `/scripts/`

---

**Last Verification**: October 13, 2025
**Verification Scripts**: See `/scripts/comprehensive-facility-inventory.ts`
**Data Version**: v2
