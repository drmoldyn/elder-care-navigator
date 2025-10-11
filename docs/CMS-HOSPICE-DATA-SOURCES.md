# CMS Hospice Data Sources

This document describes all CMS hospice quality data sources used in the Nonnie World platform, including download URLs, field mappings, refresh schedules, and measure definitions.

## Overview

CMS publishes hospice quality data through the **Hospice Quality Reporting Program (HQRP)** and **CAHPS Hospice Survey** on the Provider Data Catalog at data.cms.gov. This data is used to populate quality metrics and family experience ratings for hospice providers in our database.

**Data Authority:** Centers for Medicare & Medicaid Services (CMS)
**Public Portal:** [data.cms.gov/provider-data](https://data.cms.gov/provider-data/topics/hospice-care)
**Refresh Schedule:** Quarterly (February, May, August, November)
**Current Refresh:** August 2025

---

## Data Sources

### 1. Hospice General Information

**Dataset ID:** `252m-zfp9`
**Purpose:** Core provider information with overall star ratings
**Download URL:** `https://data.cms.gov/provider-data/api/1/datastore/query/252m-zfp9/0/download?format=csv`

**Key Fields:**
- `CMS Certification Number (CCN)` - Primary identifier for hospice providers
- `Facility Name` - Provider name
- `Address`, `City`, `State`, `Zip Code`, `County Name` - Location
- `Phone Number` - Contact phone
- `Quality of patient care star rating` - 1-5 stars (overall quality)
- `Quality of caregiver experience star rating` - 1-5 stars (CAHPS)
- `Ownership Type` - For-profit, non-profit, government

**File Format:** CSV
**Typical Size:** ~5,000 rows, ~2 MB
**Update Frequency:** Quarterly

**Field Mapping:**
| CMS Field | Database Column | Type |
|-----------|----------------|------|
| CMS Certification Number (CCN) | facility_id | text |
| Facility Name | title | text |
| Quality of patient care star rating | hospice_quality_star | numeric(2,1) |
| Quality of caregiver experience star rating | hospice_cahps_star | numeric(2,1) |
| Address | address_street | text |
| City | address_city | text |
| State | states[1] | text |
| Zip Code | address_zip | text |
| County Name | address_county | text |
| Phone Number | contact_phone | text |
| Ownership Type | ownership_type | text |

---

### 2. CAHPS Hospice Survey Data

**Dataset ID:** `7cv8-v37d`
**Purpose:** Family/caregiver experience survey results
**Download URL:** `https://data.cms.gov/provider-data/api/1/datastore/query/7cv8-v37d/0/download?format=csv`

**Key Fields:**
- `CMS Certification Number (CCN)` - Provider identifier
- `Measure Name` - Survey question/measure (e.g., "Willing to recommend this hospice")
- `Measure Code` - CMS measure code
- `Score` - Top-box percentage (% "Always" or "Definitely Yes")
- `Number of Completed Surveys` - Sample size
- `Survey Response Rate Percent` - Response rate
- `Footnote` - Suppression reasons (e.g., sample size too small)

**File Format:** CSV
**Typical Size:** ~40,000 rows, ~5 MB
**Update Frequency:** Quarterly
**Reporting Period:** 8 rolling quarters (e.g., Q1 2023 - Q4 2024)
**Minimum Sample Size:** 30 completed surveys required for public reporting

**CAHPS Measures:**

| Measure Name | Database Column | Description |
|--------------|----------------|-------------|
| Willing to Recommend this Hospice | hospice_willing_to_recommend_percent | % who would "definitely" recommend |
| Communication with Family | hospice_communication_percent | % reporting hospice team communicated well |
| Getting Timely Help | hospice_getting_timely_help_percent | % who got help when needed |
| Treating Patient with Respect | hospice_treating_with_respect_percent | % reporting respectful care |
| Emotional and Spiritual Support | hospice_emotional_support_percent | % receiving emotional/spiritual support |

**CAHPS Response Rates:**
- **November 2025 Update:** 28% average response rate
- Survey sent to family members 2-3 months after patient death
- Top-box scoring (only highest responses counted)

**Field Mapping:**
| CMS Field | Database Table.Column | Type |
|-----------|----------------------|------|
| CCN | hospice_cahps.ccn | text |
| Measure Name | hospice_cahps.survey_measure | text |
| Measure Code | hospice_cahps.measure_code | text |
| Score | hospice_cahps.score | numeric(5,2) |
| Score | hospice_cahps.top_box_percentage | numeric(5,2) |
| Number of Completed Surveys | hospice_cahps.number_of_completed_surveys | integer |
| Survey Response Rate Percent | hospice_cahps.response_rate | numeric(5,2) |
| Footnote | hospice_cahps.footnote | text |

---

### 3. Hospice Quality Measures

**Dataset ID:** `yc9t-dgbk`
**Purpose:** Individual clinical quality measure scores
**Download URL:** `https://data.cms.gov/provider-data/api/1/datastore/query/yc9t-dgbk/0/download?format=csv`

**Key Fields:**
- `CMS Certification Number (CCN)` - Provider identifier
- `Measure Name` - Quality measure description
- `Measure Code` - CMS measure code
- `Score` - Percentage or rate
- `Measure Start Date` / `Measure End Date` - Reporting period

**File Format:** CSV
**Typical Size:** ~30,000 rows, ~4 MB
**Update Frequency:** Quarterly
**Data Source:** Hospice Item Set (HIS) / HOPE assessment tool

**Quality Measures:**

| Measure Name | Database Column | Type | Better |
|--------------|----------------|------|--------|
| Pain Brought to Comfortable Level | hospice_pain_management_percent | Outcome | Higher |
| Symptoms Managed | hospice_symptom_management_percent | Outcome | Higher |
| Medication Review | hospice_medication_review_percent | Process | Higher |
| Discussion of Beliefs/Values | hospice_discussion_of_beliefs_percent | Process | Higher |
| Chemotherapy in Last 2 Weeks of Life | hospice_chemotherapy_in_last_2_weeks | Process | Lower |

**Important Notes:**
- **October 1, 2025:** Transition from HIS to HOPE data collection tool
- Some measures have minimum case requirements (typically 20 cases)
- Suppressed data indicated in footnotes

**Field Mapping:**
| CMS Field | Database Table.Column | Type |
|-----------|----------------------|------|
| CCN | hospice_quality_metrics.ccn | text |
| Measure Name | hospice_quality_metrics.metric_name | text |
| Measure Code | hospice_quality_metrics.measure_code | text |
| Score | hospice_quality_metrics.metric_value | numeric(10,2) |
| Measure Start Date | hospice_quality_metrics.measure_start_date | date |
| Measure End Date | hospice_quality_metrics.measure_end_date | date |

---

### 4. Hospice National Data (Optional)

**Dataset ID:** `3xeb-u9wp`
**Purpose:** National averages and benchmarks
**Download URL:** `https://data.cms.gov/provider-data/api/1/datastore/query/3xeb-u9wp/0/download?format=csv`

**Use Case:** Comparative analysis (show how provider compares to national average)

**File Format:** CSV
**Typical Size:** ~100 rows, <100 KB
**Update Frequency:** Quarterly

---

### 5. Hospice Service Area (Optional)

**Dataset ID:** `95rg-2usp`
**Purpose:** ZIP codes served by each hospice
**Download URL:** `https://data.cms.gov/provider-data/api/1/datastore/query/95rg-2usp/0/download?format=csv`

**Key Fields:**
- `CMS Certification Number (CCN)`
- `Zip Code` - Service area ZIP
- `County Name` - Service area county
- `State`

**File Format:** CSV
**Typical Size:** ~150,000 rows, ~5 MB (many-to-many relationship)
**Update Frequency:** Quarterly

**Field Mapping:**
| CMS Field | Database Column | Type |
|-----------|----------------|------|
| County Name (aggregated) | hospice_service_area_counties | text[] |

---

## Refresh Schedule

### Quarterly Update Cycle

CMS updates hospice data **quarterly** in the following months:
- **February** (Q1 refresh)
- **May** (Q2 refresh)
- **August** (Q3 refresh)
- **November** (Q4 refresh)

### Reporting Periods

- **CAHPS Survey:** 8 rolling quarters (2 years of data)
  - Example: November 2025 = Q1 2023 through Q4 2024
- **Quality Measures:** Varies by measure (typically 1-4 quarters)
- **Star Ratings:** Based on most recent complete reporting period

### Our Update Process

1. **Download:** Run `scripts/download-cms-hospice-data.sh` after CMS quarterly refresh
2. **Process:** Run `scripts/process-hospice-quality.ts` to normalize data
3. **Import:** Run `scripts/import-hospice-quality.ts` to update database
4. **Verify:** Check data quality and completeness

---

## CAHPS Measure Definitions

The CAHPS Hospice Survey measures family/caregiver experience with hospice care. All measures use **top-box scoring** (only the most positive responses count).

### Core Measures

#### 1. Communication with Family
**Question:** "How often did the hospice team communicate well with you?"
**Top-box:** "Always"
**What it measures:** Quality and clarity of communication

#### 2. Getting Timely Help
**Question:** "How often did you get the help you needed from the hospice team as soon as you needed it?"
**Top-box:** "Always"
**What it measures:** Responsiveness to patient/family needs

#### 3. Treating Patient with Respect
**Question:** "How often did the hospice team treat your family member with respect?"
**Top-box:** "Always"
**What it measures:** Dignity and respectful care

#### 4. Emotional and Spiritual Support
**Question:** "Did you get the emotional and spiritual support you needed?"
**Top-box:** "Yes, definitely"
**What it measures:** Holistic care addressing emotional/spiritual needs

#### 5. Willing to Recommend
**Question:** "Would you recommend this hospice to your friends and family?"
**Top-box:** "Definitely yes"
**What it measures:** Overall satisfaction and quality

### Survey Details

- **Survey Timing:** Sent 2-3 months after patient death
- **Respondent:** Family member or caregiver
- **Sample:** Patients who died while under hospice care
- **Exclusions:** Patients under age 18, respite-only care, <2 days of care
- **Languages:** English and Spanish
- **Mode:** Mail with telephone follow-up

---

## Quality Measure Definitions

### Outcome Measures

#### Pain Brought to Comfortable Level
**Measure:** Percentage of patients who reported pain was brought to a comfortable level within 48 hours
**Data Source:** Hospice Item Set (HIS) / HOPE assessment
**Better:** Higher percentage
**Why it matters:** Core hospice goal is comfort and pain management

#### Symptoms Managed
**Measure:** Percentage of patients with symptoms (dyspnea, constipation, etc.) managed effectively
**Data Source:** HIS / HOPE
**Better:** Higher percentage
**Why it matters:** Effective symptom management is key to quality of life

### Process Measures

#### Medication Review
**Measure:** Percentage of patients who received comprehensive medication review
**Data Source:** HIS / HOPE
**Better:** Higher percentage
**Why it matters:** Ensures appropriate medication management for comfort

#### Discussion of Beliefs/Values
**Measure:** Percentage of patients/families who had beliefs and values discussed
**Data Source:** HIS / HOPE
**Better:** Higher percentage
**Why it matters:** Patient-centered care respects individual values

#### Chemotherapy in Last 2 Weeks
**Measure:** Percentage of patients receiving chemotherapy in last 2 weeks of life
**Data Source:** Medicare claims
**Better:** LOWER percentage
**Why it matters:** Aggressive treatment near death may indicate poor hospice appropriateness

---

## Data Quality Notes

### Suppression Rules

CMS suppresses data when:
- **Sample size too small:** <30 completed CAHPS surveys
- **Privacy concerns:** <11 patients for some measures
- **Insufficient data:** Provider not eligible for measure

Suppressed data appears with footnotes in the CSV files.

### Data Limitations

1. **CAHPS Response Rates:** ~28% average (may not represent all patients)
2. **Self-selection bias:** Families with strong opinions more likely to respond
3. **Small providers:** May not have enough cases for all measures
4. **New providers:** Need time to accumulate data for reporting
5. **Measure changes:** CMS updates measures periodically

### Data Validation

When importing, we validate:
- CCN format and existence
- Star ratings are 1-5
- Percentages are 0-100
- Survey counts are positive integers
- Reporting periods are valid dates

---

## Usage in Application

### Provider Search & Filtering

Users can filter hospices by:
- **Star ratings:** Quality and CAHPS stars
- **Quality measures:** Pain management, symptom control
- **Service area:** Counties served
- **Minimum survey count:** Ensure statistical reliability

### Provider Detail Pages

Display:
- Overall quality star rating (1-5)
- CAHPS family experience star (1-5)
- Key quality measures with national benchmarks
- Service area coverage map
- Data freshness (reporting period)

### Quality Indicators

**High-Quality Indicators:**
- 4-5 star ratings
- >90% pain management
- >85% willing to recommend
- >100 CAHPS surveys (good sample size)

**Caution Flags:**
- <3 star ratings
- <30 CAHPS surveys (may not be reliable)
- High chemotherapy in last 2 weeks (>10%)
- Missing data (footnotes indicate suppression)

---

## Technical Implementation

### Database Schema

```sql
-- Main quality columns on resources table
ALTER TABLE resources ADD COLUMN hospice_quality_star numeric(2,1);
ALTER TABLE resources ADD COLUMN hospice_cahps_star numeric(2,1);
ALTER TABLE resources ADD COLUMN hospice_pain_management_percent numeric(5,2);
-- ... (see migration 0011_hospice_quality.sql for full schema)

-- Detailed CAHPS data
CREATE TABLE hospice_cahps (
  ccn text,
  survey_measure text,
  score numeric(5,2),
  -- ...
);

-- Detailed quality metrics
CREATE TABLE hospice_quality_metrics (
  ccn text,
  metric_name text,
  metric_value numeric(10,2),
  -- ...
);
```

### Import Process

1. **Download:** `scripts/download-cms-hospice-data.sh`
   - Downloads 3-5 CSV files from CMS API
   - Saves with dated filenames (e.g., `hospice-general-Aug2025.csv`)
   - Verifies row counts and file sizes
   - Creates download manifest

2. **Process:** `scripts/process-hospice-quality.ts`
   - Reads raw CMS CSVs
   - Normalizes field names
   - Maps measures to database columns
   - Aggregates service area counties
   - Outputs 3 processed CSVs

3. **Import:** `scripts/import-hospice-quality.ts`
   - Updates resources table by CCN
   - Inserts/updates CAHPS data (upsert)
   - Inserts/updates quality metrics (upsert)
   - Uses batch processing (100 records/batch)
   - Reports errors and statistics

### Indexes

Key indexes for performance:
```sql
CREATE INDEX idx_resources_hospice_quality_star ON resources (hospice_quality_star);
CREATE INDEX idx_resources_hospice_cahps_star ON resources (hospice_cahps_star);
CREATE INDEX idx_hospice_cahps_ccn ON hospice_cahps (ccn);
CREATE INDEX idx_hospice_quality_metrics_ccn ON hospice_quality_metrics (ccn);
```

---

## References

- **CMS Hospice Quality Reporting:** https://www.cms.gov/medicare/quality/hospice
- **Provider Data Catalog:** https://data.cms.gov/provider-data/topics/hospice-care
- **CAHPS Hospice Survey:** https://www.hospicecahpssurvey.org/
- **Care Compare:** https://www.medicare.gov/care-compare/
- **Data Dictionary:** https://data.cms.gov/provider-data/sites/default/files/data_dictionaries/hospice/HOSPICE_Data_Dictionary.pdf

---

## Changelog

### August 2025 Refresh
- Initial implementation of hospice quality data pipeline
- Added support for CAHPS survey data
- Created normalized database schema
- Implemented automated import scripts

### Future Updates
- **October 2025:** Transition from HIS to HOPE data collection tool
- **November 2025:** Next quarterly refresh expected
- **2026:** Potential new measures added to HQRP

---

## Support

For questions about:
- **Data sources:** Refer to CMS Provider Data Catalog
- **Measure definitions:** See CMS HQRP documentation
- **Technical issues:** Check script logs and error output
- **Data quality:** Review suppression footnotes in source CSVs
