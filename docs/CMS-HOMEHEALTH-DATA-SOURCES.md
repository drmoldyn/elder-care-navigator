# CMS Home Health Data Sources

Phase 2: Home Health Quality Metrics

## Overview

This document describes the CMS datasets used for home health quality metrics, patient experience (CAHPS), and service area data. These datasets are publicly available from the CMS Provider Data Catalog at [data.cms.gov](https://data.cms.gov).

## Data Sources

### 1. Home Health Care Agencies - Provider Information & Quality Ratings

**Dataset ID**: `6jpm-sxkc`

**URL**: https://data.cms.gov/provider-data/dataset/6jpm-sxkc

**Download URL**: https://data.cms.gov/provider-data/api/1/datastore/query/6jpm-sxkc/0/download?format=csv

**Description**: Primary dataset containing home health agency provider information including location, contact details, services offered, and quality star ratings.

**Update Frequency**: Quarterly (January, April, July, October)

**Last Verified**: October 2025

**Key Fields**:
- `CMS Certification Number (CCN)` - Unique identifier for home health agencies
- `Provider Name` - Agency name
- `Address`, `City`, `State`, `Zip Code`, `County Name` - Location information
- `Phone Number` - Contact phone
- `Ownership Type` - Ownership classification
- `Date Certified` - When agency was Medicare-certified
- `Quality of patient care star rating` - Overall quality rating (1-5 stars)
- `HHCAHPS star rating` - Patient experience rating (1-5 stars)

**Quality Measures** (percentages):
- How often patients got care in a timely manner
- How often patients can take their drugs correctly by mouth
- How often patients got better at bathing
- How often patients got better at walking or moving around
- How often patients got better at getting in and out of bed
- How often patients got better at breathing
- How often home health patients had to be admitted to the hospital
- How often patients receiving home health care needed urgent, unplanned care in the ER

**CAHPS Measures** (star ratings):
- How often the home health team gave care in a professional way
- How patients rated the overall care from the home health agency
- How often the home health team communicated well with patients
- How often the home health team discussed medicines, pain, and home safety
- Willingness to recommend the agency

### 2. Home Health Care - National Quality Measures

**Dataset ID**: `97z8-de96`

**URL**: https://data.cms.gov/provider-data/dataset/97z8-de96

**Download URL**: https://data.cms.gov/provider-data/api/1/datastore/query/97z8-de96/0/download?format=csv

**Description**: National-level aggregated quality measures for home health care.

**Update Frequency**: Quarterly

**Use Case**: National benchmarking and trend analysis

### 3. Home Health Care - State by State Quality Data

**Dataset ID**: `tee5-ixt5`

**URL**: https://data.cms.gov/provider-data/dataset/tee5-ixt5

**Download URL**: https://data.cms.gov/provider-data/api/1/datastore/query/tee5-ixt5/0/download?format=csv

**Description**: State-level aggregated quality measures for comparative analysis.

**Update Frequency**: Quarterly

**Use Case**: State-level benchmarking and geographic analysis

### 4. Patient Survey (HHCAHPS) - Home Health CAHPS Survey Results

**Dataset ID**: `ccn4-8vby`

**URL**: https://data.cms.gov/provider-data/dataset/ccn4-8vby

**Download URL**: https://data.cms.gov/provider-data/api/1/datastore/query/ccn4-8vby/0/download?format=csv

**Description**: Patient experience survey results from the Home Health Care Consumer Assessment of Healthcare Providers and Systems (HHCAHPS) survey.

**Update Frequency**: Quarterly

**Current Reporting Period**: Q1 2024 - Q4 2024

**Survey Domains**:
- Communication between providers and patients
- Specific care issues
- Overall rating of home health care
- Willingness to recommend

**Note**: HHCAHPS is the first national, standardized, and publicly reported survey of home health care patients' perspectives.

### 5. Home Health Care - Service Areas by Zip Code

**Dataset ID**: `m5eg-upu5`

**URL**: https://data.cms.gov/provider-data/dataset/m5eg-upu5

**Download URL**: https://data.cms.gov/provider-data/api/1/datastore/query/m5eg-upu5/0/download?format=csv

**Description**: Service area coverage showing which ZIP codes each home health agency serves.

**Update Frequency**: Quarterly

**Key Fields**:
- `CMS Certification Number (CCN)` - Links to agency
- `Zip Code` - Service area ZIP code
- `County Name` - Service area county
- `State` - Service area state

**Use Case**: Geographic matching for user searches, service area analysis

## Field Mappings

### Database: `resources` Table

| CMS Field | Database Column | Type | Notes |
|-----------|----------------|------|-------|
| CMS Certification Number (CCN) | `cms_ccn` | text | Primary identifier |
| CMS Certification Number (CCN) | `facility_id` | text | Also stored here for consistency |
| Provider Name | `title` | text | Facility name |
| Date Certified | `date_certified` | date | Certification date |
| Ownership Type | `ownership_type` | text | Ownership classification |
| Quality of patient care star rating | `hh_quality_star` | numeric(2,1) | 1-5 stars |
| HHCAHPS star rating | `hh_patient_experience_star` | numeric(2,1) | 1-5 stars |
| How often patients got care in a timely manner | `hh_timely_care_percent` | numeric(5,2) | Percentage |
| How often patients can take their drugs correctly | `hh_manages_meds_percent` | numeric(5,2) | Percentage |
| How often patients got better at bathing | `hh_improvement_bathing_percent` | numeric(5,2) | Percentage |
| How often patients got better at walking | `hh_improvement_walking_percent` | numeric(5,2) | Percentage |
| How often patients got better at breathing | `hh_improvement_breathing_percent` | numeric(5,2) | Percentage |
| Hospital admission rate | `hh_acute_hospitalization_percent` | numeric(5,2) | Percentage |
| ER use rate | `hh_er_use_percent` | numeric(5,2) | Percentage |
| Willingness to recommend (converted) | `hh_recommend_percent` | numeric(5,2) | Star rating × 20 |
| Service ZIP codes (aggregated) | `hh_service_zip_codes` | text[] | Array of ZIP codes |
| Service counties (aggregated) | `hh_service_counties` | text[] | Array of counties |

### Database: `home_health_quality_metrics` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `ccn` | text | CMS Certification Number |
| `metric_name` | text | Name of quality metric |
| `metric_category` | text | Category: quality_of_care, patient_experience, utilization |
| `metric_value` | numeric(10,2) | Numeric value |
| `metric_type` | text | Type: percentage, count, rate, star_rating |
| `reporting_period` | text | e.g., 'Q1 2024' |
| `reporting_start_date` | date | Period start |
| `reporting_end_date` | date | Period end |
| `data_source` | text | Always 'CMS_HOME_HEALTH_COMPARE' |

### Database: `home_health_utilization` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `ccn` | text | CMS Certification Number |
| `total_episodes` | integer | Total episodes of care |
| `total_patients` | integer | Total unique patients |
| `avg_visits_per_episode` | numeric(6,2) | Average visits per episode |
| `avg_skilled_nursing_visits` | numeric(6,2) | Average SN visits |
| `avg_pt_visits` | numeric(6,2) | Average PT visits |
| `avg_ot_visits` | numeric(6,2) | Average OT visits |
| `avg_st_visits` | numeric(6,2) | Average ST visits |
| `avg_home_health_aide_visits` | numeric(6,2) | Average aide visits |
| `reporting_period` | text | Reporting period |

**Note**: Utilization data may require separate download from CMS Program Statistics.

## Quality Metric Definitions

### Star Ratings (1-5 scale)

- **5 stars**: Much better than the national average
- **4 stars**: Better than the national average
- **3 stars**: About the same as the national average
- **2 stars**: Worse than the national average
- **1 star**: Much worse than the national average

### Quality of Patient Care Star Rating

Composite rating based on:
1. How often patients get better at walking or moving around
2. How often patients get better at getting in and out of bed
3. How often patients get better at bathing
4. How often patients breathing improved
5. How often patients' ability to take oral medications improved
6. How often patients had to be admitted to the hospital
7. How often patients needed urgent, unplanned care in the ER
8. How often physician-recommended actions to address medication issues were completely timely
9. How often patients got care in a timely manner

### HHCAHPS Star Rating

Based on patient survey responses about:
- Care of patients (professional manner)
- Communication between providers and patients
- Specific care issues (medications, pain, safety)
- Overall rating of care
- Willingness to recommend the agency

### Percentage Metrics

All percentage metrics represent:
- **Higher is better**: Improvement measures (bathing, walking, breathing, medication management, timely care)
- **Lower is better**: Utilization measures (hospitalization, ER use)

## Data Refresh Schedule

**Frequency**: Quarterly

**Refresh Months**: January, April, July, October

**Recommended Import Schedule**:
- Download data in the second week of refresh month
- Process and import within 1 week
- Validate data quality before marking as production-ready

**Current Data Period**:
- HHCAHPS: Q1 2024 - Q4 2024
- Quality Measures: Most recent 12-month rolling period
- Service Areas: Current as of last refresh

## Data Quality Notes

### Known Issues

1. **Missing Data**: Some agencies may not have star ratings if they:
   - Are newly certified (< 6 months)
   - Have insufficient patient volume
   - Did not submit required OASIS assessments

2. **Percentages vs. Stars**:
   - Quality measures are reported as percentages (0-100)
   - Patient experience is reported as stars (1-5)
   - Our import converts recommendation stars to percentages (star × 20)

3. **Service Areas**:
   - Service area data may be incomplete for some agencies
   - ZIP codes are self-reported by agencies
   - Some agencies serve multiple states

4. **Data Lag**:
   - Quality measures reflect care from 12-24 months prior
   - CAHPS surveys reflect experiences from prior year
   - Service areas are most current

### Validation Checks

When importing data, validate:
- CCN format: Should be 6 characters (e.g., "123456")
- Star ratings: 1.0 to 5.0 only
- Percentages: 0 to 100 only
- Dates: Valid date formats
- ZIP codes: 5-digit format

## Additional Resources

### CMS Official Pages

- **Home Health Quality Reporting Program**: https://www.cms.gov/medicare/quality/home-health
- **Home Health Star Ratings**: https://www.cms.gov/medicare/quality/home-health/home-health-star-ratings
- **HHCAHPS Home**: https://homehealthcahps.org
- **Provider Data Catalog**: https://data.cms.gov/provider-data/topics/home-health-services

### Contact

For questions about home health quality measures:
- Email: HomeHealthQualityQuestions@cms.hhs.gov

For questions about HHCAHPS:
- Email: HomeHealthCAHPS@cms.hhs.gov

## Change Log

| Date | Changes |
|------|---------|
| 2025-10-10 | Initial documentation for Phase 2 implementation |
| 2025-07-01 | OASIS mandate: All patients regardless of payer (effective date) |

## Next Steps

After importing this data:

1. **Phase 3**: Nursing Home Staffing & Deficiencies
2. **Phase 4**: Hospital Quality & Safety
3. **Phase 5**: Geographic & Demographic Enrichment

## Scripts

- **Download**: `scripts/download-cms-homehealth-data.sh`
- **Process**: `scripts/process-homehealth-quality.ts`
- **Import**: `scripts/import-homehealth-quality.ts`
- **Migration**: `supabase/migrations/0010_home_health_quality.sql`
