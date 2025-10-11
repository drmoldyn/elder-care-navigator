# CMS Nursing Home Quality & Inspection Data Sources

This document catalogs all CMS data sources used for nursing home quality metrics, health deficiencies, and enforcement actions.

## Overview

CMS (Centers for Medicare & Medicaid Services) publishes nursing home data through their Provider Data Catalog at **data.cms.gov** and **data.medicare.gov**. These datasets are updated regularly and provide comprehensive quality and compliance information for all Medicare/Medicaid-certified nursing homes in the United States.

---

## Data Sources

### 1. Health Deficiencies

**Description:** Complete list of all health deficiencies cited during state surveys of nursing homes, including scope, severity, and correction status.

**Dataset Information:**
- **Dataset ID:** `r5ix-sfxw`
- **Dataset Name:** Health Deficiencies
- **Publisher:** Centers for Medicare & Medicaid Services
- **Category:** Nursing Home Compare

**Download URLs:**
- **Primary:** https://data.cms.gov/provider-data/dataset/r5ix-sfxw
- **Secondary:** https://data.medicare.gov/Nursing-Home-Compare/Health-Deficiencies/r5ix-sfxw/data
- **API (CSV):** https://data.medicare.gov/api/views/r5ix-sfxw/rows.csv?accessType=DOWNLOAD
- **API (JSON):** https://data.medicare.gov/resource/r5ix-sfxw.json

**File Format:** CSV
**Typical Size:** ~2-5 GB (millions of rows)
**Update Frequency:** Monthly (typically first week of month)
**Last Updated:** Check filedate column in data

**Key Fields:**
- `Federal Provider Number` (CCN) - 6-character facility identifier
- `Provider Name` - Nursing home name
- `Deficiency Tag` - F-tag code (e.g., F323 for quality of care)
- `Tag Description` - Description of the regulation violated
- `Scope Severity Code` - Letter code indicating scope and severity
- `Scope` - Isolated, Pattern, or Widespread
- `Severity` - Minimal harm, Actual harm, Immediate jeopardy, etc.
- `Inspection Date` - Date deficiency was cited
- `Survey Type` - Health, Fire Safety, Life Safety
- `Inspection ID` - Unique survey identifier
- `Deficiency Corrected` - Y/N
- `Correction Date` - Date deficiency was corrected
- `Filedate` - Data processing date

**Scope/Severity Codes:**
- **A-C:** Pattern (isolated=D-F, widespread=G-I)
- **A/D/G:** No actual harm with potential for minimal harm
- **B/E/H:** No actual harm with potential for more than minimal harm
- **C/F/I:** Actual harm
- **J/K/L:** Immediate jeopardy to resident health or safety

---

### 2. Penalties

**Description:** Civil money penalties (CMPs) and denial of payment for new admissions (DPNA) imposed on nursing homes for federal regulation violations.

**Dataset Information:**
- **Dataset ID:** `g6vv-u9sr`
- **Dataset Name:** Penalties
- **Publisher:** Centers for Medicare & Medicaid Services
- **Category:** Nursing Home Compare

**Download URLs:**
- **Primary:** https://data.cms.gov/provider-data/dataset/g6vv-u9sr
- **Secondary:** https://data.medicare.gov/Nursing-Home-Compare/Penalties/g6vv-u9sr
- **API (CSV):** https://data.medicare.gov/api/views/g6vv-u9sr/rows.csv?accessType=DOWNLOAD
- **Direct Download Example:** https://data.cms.gov/provider-data/sites/default/files/resources/[hash]/NH_Penalties_[Month][Year].csv

**File Format:** CSV
**Typical Size:** ~5-20 MB (thousands of rows)
**Update Frequency:** Monthly
**Timeframe:** Rolling 3-year window

**Key Fields:**
- `Federal Provider Number` (CCN)
- `Provider Name`
- `Provider Address`
- `Provider City`
- `Provider State`
- `Provider Zip Code`
- `Penalty Type` - "Civil Money Penalty" or "Denial of Payment for New Admissions"
- `Penalty Date` - Date penalty was imposed
- `Fine Amount` - Dollar amount (for CMPs only)
- `Payment Denial Start Date` - Start of DPNA period
- `Payment Denial End Date` - End of DPNA period
- `Processing Date`
- `Filedate` - Data processing date

**Penalty Types:**
- **Civil Money Penalty (CMP):** Monetary fine for violations
- **Denial of Payment for New Admissions (DPNA):** Facility cannot admit new Medicare/Medicaid residents

---

### 3. MDS Quality Measures

**Description:** Quality measures based on the Minimum Data Set (MDS) 3.0 resident assessments, including both long-stay and short-stay measures.

**Dataset Information:**
- **Dataset ID:** `djen-97ju`
- **Dataset Name:** MDS Quality Measures
- **Publisher:** Centers for Medicare & Medicaid Services
- **Category:** Nursing Home Compare

**Download URLs:**
- **Primary:** https://data.cms.gov/provider-data/dataset/djen-97ju
- **Secondary:** https://data.medicare.gov/Nursing-Home-Compare/MDS-Quality-Measures/djen-97ju/data
- **API (CSV):** https://data.medicare.gov/api/views/djen-97ju/rows.csv?accessType=DOWNLOAD
- **API (JSON):** https://data.medicare.gov/resource/djen-97ju.json

**File Format:** CSV
**Typical Size:** ~500 MB - 1 GB
**Update Frequency:** Quarterly (January, April, July, October)
**Reporting Period:** 4-quarter rolling average

**Key Fields:**
- `Federal Provider Number` (CCN)
- `Provider Name`
- `Measure Code` - CMS measure identifier (e.g., "401", "451")
- `Measure Description` - Full measure name
- `Four Quarter Average Score` - Average rate over 4 quarters
- `Score` - Current quarter score
- `Denominator` - Number of eligible residents
- `Numerator` - Number with the outcome
- `Footnote` - Data quality notes
- `Performance Rating` - Below Average, Average, Above Average
- `Measure Period` or `Quarter` - Reporting period (e.g., "Q4 2024")
- `Filedate` - Data processing date

**Common Measure Codes:**
- **401:** Percentage of short-stay residents who were rehospitalized
- **408:** Percentage of short-stay residents who have had an outpatient ED visit
- **426:** Percentage of long-stay residents experiencing one or more falls with major injury
- **430:** Percentage of long-stay residents with a urinary tract infection
- **434:** Percentage of long-stay residents who have depressive symptoms
- **451:** Percentage of long-stay residents who got antipsychotic medication
- **455:** Percentage of long-stay high-risk residents with pressure ulcers
- **470:** Percentage of long-stay residents assessed and given pneumococcal vaccine
- **680:** Percentage of long-stay residents who needed and got a flu shot for current season

---

### 4. Claims-based Quality Measures (Optional)

**Description:** Quality measures derived from Medicare claims data rather than MDS assessments.

**Dataset Information:**
- **Dataset ID:** `ijdk-6vr8` (may vary)
- **Dataset Name:** Claims-based Quality Measures
- **Publisher:** Centers for Medicare & Medicaid Services

**Note:** This dataset may be integrated with MDS measures or available separately. Check data.cms.gov for current availability.

---

## Field Mappings

### CMS Column → Our Database Schema

#### Health Deficiencies → `nursing_home_deficiencies`

| CMS Field | Our Field | Type | Notes |
|-----------|-----------|------|-------|
| Federal Provider Number | provider_id | text | CCN identifier |
| Provider Name | provider_name | text | Facility name |
| Deficiency Tag | deficiency_tag | text | F-tag code |
| Tag Description | deficiency_description | text | Violation description |
| Scope Severity Code | scope_severity_code | text | Letter code (A-L) |
| Scope | scope | text | Isolated/Pattern/Widespread |
| Severity | severity | text | Harm level description |
| Inspection Date | survey_date | date | MM/DD/YYYY → YYYY-MM-DD |
| Survey Type | survey_type | text | Health/Fire/Life Safety |
| Inspection ID | inspection_id | text | Survey identifier |
| Deficiency Corrected | is_corrected | boolean | Y/N → true/false |
| Correction Date | correction_date | date | MM/DD/YYYY → YYYY-MM-DD |
| Filedate | data_as_of | date | Processing date |

#### Penalties → `nursing_home_penalties`

| CMS Field | Our Field | Type | Notes |
|-----------|-----------|------|-------|
| Federal Provider Number | provider_id | text | CCN identifier |
| Provider Name | provider_name | text | Facility name |
| Provider Address | provider_address | text | Street address |
| Provider City | provider_city | text | City |
| Provider State | provider_state | text | State abbreviation |
| Provider Zip Code | provider_zip | text | 5-digit ZIP |
| Penalty Type | penalty_type | text | CMP or DPNA |
| Penalty Date | penalty_date | date | MM/DD/YYYY → YYYY-MM-DD |
| Fine Amount | fine_amount | numeric(10,2) | Dollar amount |
| Payment Denial Start Date | payment_denial_start_date | date | DPNA start |
| Payment Denial End Date | payment_denial_end_date | date | DPNA end |
| Processing Date | processing_date | date | Processing date |
| Filedate | data_as_of | date | Data as of date |

#### MDS Quality Measures → `nursing_home_quality_metrics`

| CMS Field | Our Field | Type | Notes |
|-----------|-----------|------|-------|
| Federal Provider Number | provider_id | text | CCN identifier |
| Provider Name | provider_name | text | Facility name |
| Measure Code | measure_code | text | CMS measure ID |
| Measure Description | measure_name | text | Full measure name |
| Four Quarter Average Score | score | numeric(6,2) | Percentage or rate |
| Denominator | denominator | integer | Eligible residents |
| Numerator | numerator | integer | With outcome |
| Performance Rating | performance_category | text | Below/Average/Above |
| Footnote | footnote | text | Data quality notes |
| Measure Period / Quarter | measure_period_start, measure_period_end | date | Parsed from quarter |
| Filedate | data_as_of | date | Processing date |

#### Extended Resources Fields

Additional summary fields added to the `resources` table:

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| last_survey_date | date | Max survey_date from deficiencies | Most recent inspection |
| deficiency_count | integer | Count from deficiencies | Current uncorrected count |
| total_penalties_amount | numeric(10,2) | Sum from penalties | Last 3 years |
| health_survey_rating | numeric(2,1) | From provider info | 1-5 stars |
| qm_survey_rating | numeric(2,1) | From provider info | 1-5 stars |
| staffing_survey_rating | numeric(2,1) | From provider info | 1-5 stars |
| has_immediate_jeopardy | boolean | Derived from deficiencies | Severity = J/K/L |
| has_substandard_care | boolean | Derived from deficiencies | Substandard quality flag |
| has_civil_money_penalty | boolean | Derived from penalties | Has CMP in last 3 years |
| has_payment_denial | boolean | Derived from penalties | Has DPNA in last 3 years |

---

## Data Refresh Schedule

| Dataset | Update Frequency | Typical Release Day | Notes |
|---------|------------------|---------------------|-------|
| Health Deficiencies | Monthly | First Wednesday | Based on state survey submissions |
| Penalties | Monthly | First Wednesday | Same as deficiencies |
| MDS Quality Measures | Quarterly | Mid-month (Jan/Apr/Jul/Oct) | 4-quarter rolling window |
| Provider Information | Monthly | First Wednesday | Base facility data |

**Recommended Refresh Cadence:** Monthly (first week of each month)

---

## Known Data Quality Issues

### 1. Missing or Incomplete Records
- **Issue:** Some facilities may have incomplete deficiency records if surveys are in progress
- **Mitigation:** Check `Filedate` and only use finalized records

### 2. Date Format Variations
- **Issue:** CMS sometimes changes date formats between releases
- **Mitigation:** Our processing script handles MM/DD/YYYY, YYYY-MM-DD, and YYYYMMDD

### 3. Null Values
- **Issue:** Quality measures may have null scores with footnotes explaining why
- **Mitigation:** Store footnotes and handle nulls gracefully in queries

### 4. CCN Changes
- **Issue:** Facilities can change CCN numbers if ownership changes
- **Mitigation:** Use provider name + address for fuzzy matching when joining

### 5. Measure Period Parsing
- **Issue:** Measure period format varies (e.g., "Q4 2024" vs "2024 Q4")
- **Mitigation:** Processing script normalizes to start/end dates

### 6. Scope/Severity Code Variations
- **Issue:** Some older records may use different coding systems
- **Mitigation:** Our processing script maps common variations

---

## API Access Notes

### Socrata Open Data API (SODA)

All datasets use the Socrata API format:

**CSV Download:**
```
https://data.medicare.gov/api/views/{dataset-id}/rows.csv?accessType=DOWNLOAD
```

**JSON API:**
```
https://data.medicare.gov/resource/{dataset-id}.json
```

**Query Parameters:**
- `$limit` - Number of rows (default 1000, max 50000)
- `$offset` - Pagination offset
- `$where` - SQL-like filtering
- `$select` - Column selection
- `$order` - Sorting

**Example:**
```
https://data.medicare.gov/resource/r5ix-sfxw.json?$limit=100&$where=deficiency_corrected='N'
```

### Rate Limits
- **Anonymous:** 1000 requests/day
- **App Token:** Higher limits (register at data.cms.gov)

---

## Data Dictionary Resources

**Official CMS Documentation:**
- Nursing Home Data Dictionary: https://data.cms.gov/provider-data/sites/default/files/data_dictionaries/nursing_home/NH_Data_Dictionary.pdf
- MDS 3.0 Quality Measures User's Manual: https://www.cms.gov/Medicare/Quality-Initiatives-Patient-Assessment-Instruments/NursingHomeQualityInits/Downloads/MDS-30-QM-USERS-MANUAL.pdf
- Five-Star Quality Rating System Guide: https://www.cms.gov/medicare/provider-enrollment-and-certification/certificationandcomplianc/downloads/usersguide.pdf

---

## Contact

**CMS Provider Data Catalog Support:**
- Email: BetterCare@cms.hhs.gov
- Website: https://data.cms.gov

**Dataset-Specific Issues:**
- Report issues via the feedback button on individual dataset pages

---

## Pipeline Usage

### Full Pipeline Execution

```bash
# 1. Download latest data
./scripts/download-cms-quality-data.sh

# 2. Process and normalize data
pnpm tsx scripts/process-quality-data.ts

# 3. Import to database
pnpm tsx scripts/import-quality-data.ts
```

### Expected Runtime

- **Download:** 5-15 minutes (depends on network speed)
- **Processing:** 2-5 minutes
- **Import:** 10-30 minutes (depends on data volume)
- **Total:** ~20-50 minutes for full pipeline

### Output Files

**Raw Data (data/cms/raw/):**
- `health-deficiencies-YYYYMMDD.csv`
- `penalties-YYYYMMDD.csv`
- `mds-quality-measures-YYYYMMDD.csv`
- Symlinks to `-latest.csv` versions

**Processed Data (data/cms/processed/):**
- `deficiencies-processed.csv`
- `penalties-processed.csv`
- `quality-metrics-processed.csv`

---

## Next Phases

This Phase 1 implementation covers the core quality and inspection datasets. Future phases will add:

**Phase 2:** Staffing data (PBJ - Payroll-Based Journal)
**Phase 3:** Ownership and business relationships
**Phase 4:** Financial and operational metrics
**Phase 5:** COVID-19 data

---

**Last Updated:** October 10, 2025
**Maintained By:** Nonnie World Data Team
