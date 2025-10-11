# State Assisted Living Facility (ALF) Data Sources

_Last Updated: 2025-10-10_

## Overview

This document provides comprehensive information about ALF data sources for the 4 priority states: California, Florida, Texas, and New York. It includes source URLs, data availability, field mappings, access requirements, and implementation recommendations.

---

## Summary Matrix

| State | Data Quality | Access Method | Downloadable | Inspections | Pricing | Recommended Priority |
|-------|-------------|---------------|--------------|-------------|---------|---------------------|
| **California** | ⭐⭐⭐⭐ | Manual Download | ✅ Yes (CSV) | ⚠️ Partial | ❌ No | **HIGH** |
| **Florida** | ⭐⭐⭐⭐⭐ | Manual Download | ✅ Yes (CSV) | ✅ Yes | ❌ No | **HIGHEST** |
| **Texas** | ⭐⭐⭐ | Data Request | ❌ Request Only | ✅ Yes | ❌ No | **MEDIUM** |
| **New York** | ⭐⭐⭐⭐ | Automated Download | ✅ Yes (CSV API) | ⚠️ Partial | ❌ No | **HIGH** |

**Legend:**
- ⭐⭐⭐⭐⭐ = Excellent (comprehensive, current, easy access)
- ⭐⭐⭐⭐ = Good (comprehensive, current, requires some manual steps)
- ⭐⭐⭐ = Fair (limited data or difficult access)

---

## California

### Overview
California regulates assisted living facilities as **Residential Care Facilities for the Elderly (RCFE)** through the Department of Social Services, Community Care Licensing Division (CCLD).

### Primary Data Sources

#### 1. Community Care Licensing - RCFE Facility Locations
- **URL:** https://data.ca.gov/dataset/community-care-licensing-residential-elder-care-facility-locations
- **Format:** CSV
- **Access:** Public, no registration required
- **Update Frequency:** Monthly (typically)
- **Download Method:** Manual download from California Open Data Portal

#### 2. Licensed and Certified Healthcare Facilities
- **URL:** https://data.chhs.ca.gov/dataset/licensed-and-certified-healthcare-facilities
- **Format:** CSV
- **Access:** Public, no registration required
- **Update Frequency:** Weekly
- **Download Method:** Manual download from CA Health & Human Services Open Data Portal

#### 3. ALW (Assisted Living Waiver) Facilities
- **URL:** https://data.ca.gov/dataset/alw-assisted-living-facilities
- **Format:** CSV
- **Access:** Public, no registration required
- **Note:** Subset of RCFEs participating in Medi-Cal waiver program

### Available Data Fields

✅ **Available:**
- Facility License Number
- Facility Name
- Physical Address (Street, City, ZIP)
- County
- Phone Number
- Licensed Capacity
- License Status (Active, Inactive, etc.)
- Facility Type (740 RCFE, 741 RCFE-CCRC)
- Licensee/Owner Name
- Administrator Name (sometimes)
- License Issue/Expiration Dates

❌ **NOT Available:**
- Memory care certification (requires manual review)
- Medicaid/Medi-Cal acceptance (except ALW subset)
- Pricing information
- Quality ratings
- Inspection scores (requires separate lookup)

### Inspection Data

**Source:** Community Care Licensing Facility Search
- **URL:** https://www.ccld.dss.ca.gov/carefacilitysearch/
- **Access Method:** Web search interface (no bulk download)
- **Available From:** April 16, 2015 (inspections), January 11, 2016 (complaints)
- **Data Fields:** Inspection dates, deficiencies, corrective actions
- **Acquisition:** Requires web scraping or individual facility queries

### Pricing Data

**Not Available** in state data. Alternative sources:
- Genworth Cost of Care Survey (regional averages)
- Facility websites (manual collection)
- Third-party databases (NIC MAP, A Place for Mom)

### Data Quality Assessment

**Strengths:**
- Comprehensive facility list
- Regular updates
- Good address data quality
- CSV format easy to process

**Limitations:**
- Memory care certification not indicated
- No pricing information
- Inspection data requires separate acquisition
- Some facilities may have outdated contact info

### Implementation Recommendations

**Phase 1:** Download and import RCFE facility list
- Use Community Care Licensing dataset
- ~7,000-8,000 facilities expected
- Good for initial population

**Phase 2:** Enrich with ALW data
- Cross-reference ALW facilities
- Mark Medi-Cal acceptance

**Phase 3:** Scrape inspection data (optional)
- Use facility license numbers
- Query CCLD facility search
- Rate limit: 1 request/second
- Estimated time: 2-3 hours for all facilities

---

## Florida

### Overview
Florida licenses assisted living facilities through the **Agency for Health Care Administration (AHCA)**. Data is accessible via the Florida HealthFinder portal.

### Primary Data Source

#### Florida HealthFinder
- **URL:** https://quality.healthfinder.fl.gov
- **Format:** CSV export (from web interface)
- **Access:** Public, no registration required
- **Update Frequency:** Real-time (database-backed)
- **Download Method:** Manual export via search interface

### Download Process

1. Visit HealthFinder portal
2. Select "Search by Facility Type/Location"
3. Choose "Assisted Living Facility (ALF)" from dropdown
4. Leave location blank for statewide results
5. Click "Search"
6. When prompted "Dataset too large", click "Download"
7. Receive CSV with all ALF records

### Available Data Fields

✅ **Available:**
- AHCA Provider Number (License Number)
- Facility Name
- Physical Address (Street, City, ZIP)
- County
- Phone Number
- Administrator Name
- Owner/Operator Name
- License Status
- Number of Beds (Total Capacity)
- Bed Types
- **Specialty Licenses:**
  - Extended Congregate Care (ECC)
  - Limited Mental Health
  - Limited Nursing Services
- Inspection Reports (links to PDFs)
- Deficiencies/Violations (from inspections)

❌ **NOT Available:**
- Explicit memory care certification (but ECC is indicator)
- Medicaid acceptance (post-2018 moved to SMMC LTC program)
- Pricing information
- Quality ratings

### Inspection Data

**Access:** Integrated into HealthFinder facility profiles
- **Forms Used:**
  - Form 2567: Federal regulation deficiencies
  - Form 3020-0001: State regulation deficiencies
- **Download:** Available per facility (PDF format)
- **Bulk Access:** Contact AHCA for bulk data

### Specialty Certifications

**Extended Congregate Care (ECC):**
- Allows facilities to serve residents with greater needs
- Often includes memory care/dementia services
- Good proxy for memory care capability

**Limited Mental Health:**
- Serves residents with mental health diagnoses
- Additional training requirements

**Limited Nursing Services (LNS):**
- Provides limited nursing care
- For residents with chronic conditions

### Data Quality Assessment

**Strengths:**
- ⭐⭐⭐⭐⭐ **EXCELLENT** overall quality
- Comprehensive facility information
- Includes specialty certifications
- Real-time data
- Inspection reports accessible
- Clean, well-structured CSV export

**Limitations:**
- No explicit Medicaid acceptance flag
- No pricing data
- Requires manual download (no API)

### Implementation Recommendations

**Recommended: START WITH FLORIDA**

**Phase 1:** Initial import
- Download full ALF list via HealthFinder
- ~3,000-3,500 facilities expected
- Highest quality state data

**Phase 2:** Parse specialty licenses
- Use ECC as memory care indicator
- Flag LNS and Limited Mental Health

**Phase 3:** Inspection data (optional)
- Extract inspection dates from facility profiles
- Consider web scraping for violation details
- Or request bulk data from AHCA

**Why Florida First:**
- Best data quality
- Easiest access
- Most comprehensive fields
- Good documentation

---

## Texas

### Overview
Texas licenses assisted living facilities through the **Health and Human Services Commission (HHSC)** under Texas Administrative Code, Title 26, Chapter 553. Data is accessible via the TULIP portal.

### Primary Data Source

#### TULIP (Texas Unified Licensure Information Portal)
- **URL:** https://apps.hhs.texas.gov/LTCSearch/
- **Format:** Web search interface (no direct CSV export)
- **Access:** Public, no registration required
- **Update Frequency:** Real-time
- **Download Method:** **Requires Public Information Request**

### Data Access Methods

#### Option 1: TULIP Portal (Individual Lookup)
- Search by facility name, city, county, or ZIP
- View individual facility profiles
- Includes inspections, violations, enforcement actions
- **No bulk download capability**

#### Option 2: Public Information Request (RECOMMENDED)
- **Contact:** Texas Health and Human Services Commission
- **Department:** Regulatory Services Division
- **Phone:** (512) 438-3011
- **Portal:** https://www.hhs.texas.gov/about-hhs/leadership/public-information
- **Request:** "Complete list of licensed Assisted Living Facilities with facility details, inspection history, and violation records"
- **Format:** Request CSV or Excel
- **Timeline:** 10-30 business days

#### Option 3: Regulatory Services Annual Report
- **URL:** https://www.hhs.texas.gov/sites/default/files/documents/ltc-regulatory-services-annual-report-2024.pdf
- **Contains:** Aggregate statistics only (not facility-level data)
- **Use:** Background context and trend analysis

### Available Data Fields

✅ **Available (via TULIP or data request):**
- Facility License Number
- Facility Name
- DBA (Doing Business As) Name
- Physical Address (Street, City, County, ZIP)
- Phone Number
- License Status (Active, Inactive, Expired)
- License Type
- Licensed Capacity
- Administrator Name
- Inspection Dates
- **Violation Data:**
  - Type C Violations (most serious)
  - Type B Violations
  - Type A Violations
- Enforcement Actions
- Administrative Penalties (dollar amounts)

❌ **NOT Available:**
- Memory care certification
- Medicaid acceptance
- Pricing information
- Quality ratings

### Violation Classification (Texas)

**Type C (Class I):**
- Most serious
- Poses imminent threat to health/safety
- Example: Medication errors, abuse/neglect

**Type B (Class II):**
- Moderate severity
- Could lead to negative outcomes
- Example: Inadequate staffing, safety hazards

**Type A (Class III):**
- Minor violations
- Administrative issues
- Example: Documentation errors, minor maintenance

### Enforcement Data

FY 2023 Statistics:
- 79 administrative penalties assessed to ALFs
- Total penalties: $171,522
- Average penalty: ~$2,171

### Data Quality Assessment

**Strengths:**
- Comprehensive violation/enforcement data
- Real-time TULIP search
- Detailed inspection records

**Limitations:**
- ⚠️ **No bulk download** available
- Requires data request or web scraping
- Slower access compared to other states
- Limited facility characteristic data

### Implementation Recommendations

**Phase 1: Submit Data Request**
- File public information request with HHSC
- Request facility list + inspection/violation data
- Expect 2-4 week turnaround

**Phase 2: Process Data**
- Import facility list
- Parse violation counts by type
- Flag facilities with Type C violations

**Phase 3: Alternative (if request denied)**
- Implement web scraper for TULIP
- Iterate through Texas counties
- Extract facility data from search results
- Rate limit: 1-2 requests/second
- Estimated time: 6-10 hours

**Recommendation:** Pursue data request first. Web scraping as fallback.

---

## New York

### Overview
New York regulates **Adult Care Facilities (ACF)** through the Department of Health. New York uses different terminology than other states ("Adult Care Facility" vs "Assisted Living Facility").

### Primary Data Sources

#### 1. Health Facility General Information
- **URL:** https://health.data.ny.gov/Health/Health-Facility-General-Information/vn5v-hh5r
- **API URL:** https://health.data.ny.gov/api/views/vn5v-hh5r/rows.csv?accessType=DOWNLOAD
- **Format:** CSV (automated download via API)
- **Access:** Public, no registration required
- **Update Frequency:** Weekly

#### 2. Health Facility Certification Information
- **URL:** https://health.data.ny.gov/Health/Health-Facility-Certification-Information/2g9y-7kqm
- **API URL:** https://health.data.ny.gov/api/views/2g9y-7kqm/rows.csv?accessType=DOWNLOAD
- **Format:** CSV (automated download via API)
- **Access:** Public, no registration required
- **Update Frequency:** Weekly

**Important:** These two datasets must be joined on **Facility ID**

### Facility Types in New York

New York regulates three types of Adult Care Facilities:

1. **Adult Homes**
   - For adults needing supervision (not 24-hour skilled nursing)
   - Most similar to assisted living in other states

2. **Residences for Adults**
   - For adults functioning independently with minimal supervision
   - Lower level of care

3. **Enriched Housing Programs**
   - Enhanced supportive services in community-based settings
   - Intermediate level of care

### Available Data Fields

✅ **From General Information dataset:**
- Facility ID (unique identifier)
- Facility Name
- Description of Services
- Street Address, City, State, ZIP
- County
- Phone Number
- Facility Type Code

✅ **From Certification Information dataset:**
- Facility ID (links to general info)
- Operating Certificate Number
- Operator Name
- Operator Phone
- Service Type Description
- Bed Count / Capacity
- Certification Date

❌ **NOT Available:**
- Memory care certification
- Medicaid acceptance (though many ACFs do accept)
- Pricing information
- Quality ratings
- Inspection scores (requires separate lookup)

### Inspection Data

**NYS Adult Care Facility Profiles**
- **URL:** https://profiles.health.ny.gov/acf/
- **Access:** Web search interface
- **Available:** Inspection dates, violations, corrective actions
- **Acquisition Methods:**
  1. Individual facility lookup using Facility ID
  2. Web scraping (automated)
  3. FOIL request (Freedom of Information Law)

**Quarterly Survey Reports**
- **URL:** https://www.health.ny.gov/facilities/adult_care/reports.htm
- **Format:** PDF summary reports
- **Contains:** Aggregate statistics by county
- **Not Useful For:** Individual facility data

### FOIL Request Information

For bulk inspection data:
- **Contact:** NYS Department of Health FOIL Office
- **URL:** https://www.health.ny.gov/regulations/foil/
- **Request:** "Adult Care Facility inspection records for past 3 years"
- **Timeline:** 20 business days (by law)

### Data Quality Assessment

**Strengths:**
- ✅ Automated CSV download (API access)
- Good data structure
- Weekly updates
- Comprehensive facility information
- ~534 facilities (manageable dataset size)

**Limitations:**
- Must join two datasets
- Different terminology (ACF vs ALF)
- Inspection data requires separate acquisition
- Some facilities may not match "assisted living" concept

### Implementation Recommendations

**Phase 1: Automated Download**
- Use API URLs to download both CSV files
- Easiest state for automated acquisition
- Implement in download script

**Phase 2: Data Merging**
- Join datasets on Facility ID
- Filter for Adult Homes and Enriched Housing (most similar to ALF)
- Exclude Residences for Adults (too low care level)

**Phase 3: Import and Categorize**
- Map to assisted_living provider_type
- Note facility type in description
- Expected: 300-400 facilities (after filtering)

**Phase 4: Inspection Data (Optional)**
- Use Facility IDs to query Health Profiles
- Or submit FOIL request for bulk data
- Web scraping: ~1-2 hours for all facilities

**Recommendation:** Start with Phase 1-2 (easiest state for automation)

---

## Field Availability Matrix

| Field | California | Florida | Texas | New York |
|-------|-----------|---------|-------|----------|
| **Core Fields** |
| License/Facility ID | ✅ | ✅ | ✅ | ✅ |
| Facility Name | ✅ | ✅ | ✅ | ✅ |
| Street Address | ✅ | ✅ | ✅ | ✅ |
| City | ✅ | ✅ | ✅ | ✅ |
| State | ✅ | ✅ | ✅ | ✅ |
| ZIP Code | ✅ | ✅ | ✅ | ✅ |
| County | ✅ | ✅ | ✅ | ✅ |
| Phone | ✅ | ✅ | ✅ | ✅ |
| **Licensing** |
| License Status | ✅ | ✅ | ✅ | ❌ |
| License Dates | ✅ | ❌ | ❌ | ✅ Cert Date |
| Licensed Capacity | ✅ | ✅ | ✅ | ✅ |
| Facility Type | ✅ | ✅ | ✅ | ✅ |
| **Operators** |
| Administrator | ⚠️ Sometimes | ✅ | ✅ | ❌ |
| Owner/Licensee | ✅ | ✅ | ❌ | ✅ Operator |
| **Services** |
| Memory Care Cert | ❌ | ⚠️ ECC proxy | ❌ | ❌ |
| Medicaid Acceptance | ⚠️ ALW only | ❌ | ❌ | ❌ |
| Specialty Services | ❌ | ✅ | ❌ | ⚠️ Service Desc |
| **Quality** |
| Inspection Dates | 🔍 Separate | ✅ | ✅ | 🔍 Separate |
| Violations | 🔍 Separate | ✅ Available | ✅ | 🔍 Separate |
| Enforcement Actions | 🔍 Separate | ✅ Available | ✅ | 🔍 Separate |
| Pricing | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ = Included in primary dataset
- ⚠️ = Partial or proxy data available
- ❌ = Not available
- 🔍 = Requires separate lookup/scraping

---

## Recommended Implementation Order

### Priority 1: Florida (Start Here)
**Rationale:**
- Highest quality data
- Most comprehensive fields
- Easy manual download
- Specialty license flags (ECC)
- ~3,000-3,500 facilities

**Timeline:** 1-2 days
1. Download CSV from HealthFinder
2. Process with process-alf-fl.ts
3. Match to existing resources
4. Import new facilities

### Priority 2: New York (Easiest Automation)
**Rationale:**
- Automated CSV download via API
- Good data structure
- Smaller dataset (~400 facilities after filtering)
- Can build automation template

**Timeline:** 2-3 days
1. Automate download via API
2. Merge two datasets
3. Filter for relevant facility types
4. Process and import

### Priority 3: California (Largest Dataset)
**Rationale:**
- Large dataset (~7,000+ facilities)
- Good baseline data
- Multiple data sources to merge
- Most facilities to add

**Timeline:** 3-4 days
1. Download RCFE and ALW datasets
2. Merge and deduplicate
3. Process large volume
4. Import in batches

### Priority 4: Texas (Most Complex)
**Rationale:**
- Requires data request (wait time)
- No direct download
- Good violation data (when available)
- Can start while waiting for other states

**Timeline:** 2-4 weeks (including request wait time)
1. Submit public information request
2. While waiting, implement other states
3. Process data when received
4. Import facilities

---

## Common Challenges & Solutions

### Challenge 1: Memory Care Certification
**Problem:** No state explicitly indicates memory care in base data

**Solutions:**
1. Use proxies:
   - Florida: ECC certification
   - All states: Facility name contains "memory care" or "dementia"
2. Scrape inspection reports for memory care mentions
3. Manual facility website review
4. User-submitted data via facility portal

### Challenge 2: Pricing Data
**Problem:** No state provides pricing in licensing data

**Solutions:**
1. Genworth Cost of Care (regional averages)
2. Facility website scraping
3. Third-party data partnerships (NIC MAP)
4. Facility portal (self-reported)
5. User surveys/reviews

### Challenge 3: Medicaid Acceptance
**Problem:** Limited availability in state data

**Solutions:**
1. California: ALW dataset (Medi-Cal waiver)
2. All states: CMS Medicaid claims data (if facilities bill Medicaid)
3. State Medicaid provider directories
4. Facility portal (self-reported)
5. Manual verification via phone/website

### Challenge 4: Data Freshness
**Problem:** Facilities open/close, addresses change

**Solutions:**
1. Schedule monthly re-downloads
2. Implement change detection
3. User feedback mechanism
4. Facility portal for self-updates
5. Flag stale data (>6 months)

### Challenge 5: Address Matching
**Problem:** Fuzzy matching can have false positives

**Solutions:**
1. Multi-strategy matching (exact, fuzzy, ZIP+name)
2. Human review of fuzzy matches below 90% confidence
3. Manual verification tool in admin portal
4. Store match confidence scores
5. Allow manual override

---

## Data Maintenance & Updates

### Update Schedule

**Monthly:**
- Florida HealthFinder re-download
- New York API downloads
- California RCFE dataset

**Quarterly:**
- Texas data request (if available)
- Genworth pricing updates
- Inspection data refresh

**Annual:**
- Full data quality audit
- Dead facility cleanup
- Address verification

### Change Detection

Implement change tracking:
```sql
-- Track facility changes
CREATE TABLE facility_changes (
  id UUID PRIMARY KEY,
  resource_id UUID REFERENCES resources(id),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  detected_at TIMESTAMPTZ,
  source TEXT
);
```

Monitor for:
- License status changes (Active → Inactive)
- Address changes
- Capacity changes
- New facilities
- Closed facilities

---

## Next Steps

### Immediate Actions

1. **Run Florida Import (Week 1)**
   ```bash
   ./scripts/download-alf-fl.sh
   pnpm tsx scripts/process-alf-fl.ts
   pnpm tsx scripts/match-alf-to-resources.ts --state=FL
   ```

2. **Run New York Import (Week 1-2)**
   ```bash
   ./scripts/download-alf-ny.sh
   pnpm tsx scripts/process-alf-ny.ts
   pnpm tsx scripts/match-alf-to-resources.ts --state=NY
   ```

3. **Run California Import (Week 2-3)**
   ```bash
   ./scripts/download-alf-ca.sh
   pnpm tsx scripts/process-alf-ca.ts
   pnpm tsx scripts/match-alf-to-resources.ts --state=CA
   ```

4. **Submit Texas Data Request (Week 1)**
   - Submit public information request to HHSC
   - Continue with other states while waiting
   - Process TX data when received (Week 4+)

### Future Enhancements

1. **Inspection Data Scraping**
   - Build scrapers for CA and NY inspection portals
   - Store in assisted_living_inspections table
   - Display on facility detail pages

2. **Pricing Data Collection**
   - Partner with Genworth for regional data
   - Implement facility self-reporting portal
   - Scrape facility websites

3. **Memory Care Indicators**
   - NLP analysis of facility descriptions
   - Inspection report keyword extraction
   - User-submitted facility features

4. **Automation**
   - Schedule monthly data refreshes
   - Automated change detection
   - Email alerts for significant changes

5. **Data Quality**
   - Phone number verification
   - Address geocoding
   - Facility status monitoring

---

## Blockers & Risks

### Identified Blockers

1. **Texas Data Request Delay**
   - **Risk:** 2-4 week wait time
   - **Mitigation:** Start with other states, TX import is Phase 4
   - **Impact:** Low (can launch without TX data)

2. **Inspection Data Acquisition**
   - **Risk:** Requires web scraping or additional requests
   - **Mitigation:** Phase 2 enhancement, not critical for MVP
   - **Impact:** Medium (inspection data valuable but not essential)

3. **Memory Care Identification**
   - **Risk:** Not explicitly flagged in most state data
   - **Mitigation:** Use proxies (ECC in FL, name keywords)
   - **Impact:** Medium (many users search for memory care)

### Risks

1. **Data Accuracy**
   - State data may be outdated
   - Facilities may have closed
   - Phone numbers may be incorrect
   - **Mitigation:** User feedback, facility portal, verification

2. **Duplicate Resources**
   - May create duplicates if matching fails
   - **Mitigation:** Strong matching algorithm, manual review tool

3. **Legal/Compliance**
   - Terms of use on state websites
   - Web scraping restrictions
   - **Mitigation:** Review ToS, use public APIs where available

---

## Conclusion

**Recommended Approach:**
1. Start with **Florida** (highest quality, easiest access)
2. Follow with **New York** (automated download, good template)
3. Import **California** (largest dataset, good ROI)
4. Add **Texas** when data received (good violation data)

**Expected Results:**
- ~12,000-14,000 ALF facilities across 4 states
- Comprehensive coverage in high-demand markets
- Foundation for national expansion

**Timeline:**
- Week 1-2: FL + NY imports
- Week 2-3: CA import
- Week 4+: TX import (pending data request)

**Success Metrics:**
- 95%+ match rate for existing facilities
- <5% duplicate creation rate
- 100% of active facilities imported
- All license numbers captured in facility_identifiers

---

## Appendix: State Contact Information

### California
- **Agency:** CA Dept of Social Services, Community Care Licensing Division
- **Website:** https://www.cdss.ca.gov/inforesources/community-care-licensing
- **Phone:** (916) 651-8848
- **Data Portal:** https://data.ca.gov

### Florida
- **Agency:** FL Agency for Health Care Administration (AHCA)
- **Website:** https://ahca.myflorida.com
- **Phone:** (850) 412-3700
- **Data Portal:** https://quality.healthfinder.fl.gov

### Texas
- **Agency:** TX Health and Human Services Commission (HHSC)
- **Website:** https://www.hhs.texas.gov
- **Phone:** (512) 438-3011
- **TULIP Portal:** https://apps.hhs.texas.gov/LTCSearch/

### New York
- **Agency:** NY State Department of Health
- **Website:** https://www.health.ny.gov/facilities/adult_care/
- **Phone:** (518) 408-1133
- **Data Portal:** https://health.data.ny.gov

---

**Document Version:** 1.0
**Author:** Data Acquisition Team
**Last Updated:** 2025-10-10
