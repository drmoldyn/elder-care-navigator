# Data Pipeline Documentation

## Overview

This document describes the complete data pipeline for collecting, processing, and importing thousands of elder care resources organized by **insurance coverage**, **geolocation**, and **proximity to major medical systems** (within 120 miles).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  DATA SOURCES                                                    │
├─────────────────────────────────────────────────────────────────┤
│  • CMS Provider Data (Medicare/Medicaid certified)              │
│    - Home Health Agencies (~11,000)                             │
│    - Nursing Homes (~15,000)                                    │
│    - Hospice Providers (~6,000)                                 │
│    - Hospitals (~6,000)                                         │
│  • State Open Data Portals (CA, IL, NY, FL, etc.)               │
│  • Academic Datasets (GitHub assisted living - 44,000+)         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: DOWNLOAD                                               │
│  scripts/download-cms-data.sh                                   │
│  → Downloads CSV files to data/cms/                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: PROCESS & TRANSFORM                                    │
│  scripts/process-cms-data.ts                                    │
│  → Maps CMS fields to our schema                                │
│  → Outputs to data/cms/processed/                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: GEOCODE ADDRESSES                                      │
│  scripts/geocode-addresses.ts                                   │
│  → Adds lat/long coordinates (Census API)                       │
│  → Outputs to data/cms/geocoded/                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: IMPORT TO DATABASE                                     │
│  scripts/import-resources-enhanced.ts                           │
│  → Inserts into Supabase resources table                        │
│  → Optionally computes proximity to medical systems             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  DATABASE (Supabase PostgreSQL + PostGIS)                       │
│  • resources table (elder care facilities)                      │
│  • medical_systems table (hospitals within 120 miles)           │
│  • resource_medical_proximity table (precomputed distances)     │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Enhanced Resources Table

The `resources` table has been enhanced with:

**Geolocation Fields:**
- `street_address` - Full street address
- `city` - City name
- `state` - 2-letter state code
- `zip_code` - 5-digit ZIP code
- `county` - County name
- `latitude` - Decimal latitude (8 decimal places)
- `longitude` - Decimal longitude (8 decimal places)
- `geolocation` - PostGIS geography point (auto-generated from lat/long)

**Insurance Coverage:**
- `medicare_accepted` - Boolean
- `medicaid_accepted` - Boolean
- `private_insurance_accepted` - Boolean
- `veterans_affairs_accepted` - Boolean
- `insurance_notes` - Additional insurance details

**Provider Identification:**
- `facility_id` - CMS CCN, state license number, or unique ID
- `npi` - National Provider Identifier
- `provider_type` - nursing_home, assisted_living, home_health, hospice, adult_day_care, hospital

**Facility Characteristics:**
- `total_beds` - Number of licensed beds
- `ownership_type` - for_profit, non_profit, government
- `quality_rating` - CMS 5-star rating (1-5)
- `services_offered` - Array of services
- `specialties` - Array of specialties (e.g., dementia care, stroke recovery)

### Medical Systems Table

New table for tracking major hospitals and medical centers:

```sql
medical_systems (
  id uuid,
  name text,
  cms_provider_id text,
  npi text,
  street_address text,
  city text,
  state text,
  zip_code text,
  county text,
  latitude decimal,
  longitude decimal,
  geolocation geography,
  hospital_type text, -- acute_care, critical_access, childrens, va, dod
  bed_count integer,
  is_teaching_hospital boolean,
  trauma_level text, -- level_1, level_2, level_3, level_4
  academic_affiliation text,
  phone text,
  website text,
  cms_quality_rating decimal
)
```

### Resource-Medical Proximity Table

Precomputed proximity relationships for performance:

```sql
resource_medical_proximity (
  id uuid,
  resource_id uuid → resources,
  medical_system_id uuid → medical_systems,
  distance_miles decimal(6,2),
  drive_time_minutes integer
)
```

## Step-by-Step Usage Guide

### Prerequisites

1. **Apply database migration:**
   ```bash
   # Copy migration SQL to Supabase SQL Editor and run:
   supabase/migrations/0003_add_geolocation_and_medical_systems.sql
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set environment variables:**
   ```bash
   # .env.local should have:
   NEXT_PUBLIC_SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   ```

### Step 1: Download CMS Datasets

```bash
# Download all CMS datasets (~50,000 resources)
./scripts/download-cms-data.sh
```

**Output:**
- `data/cms/home-health-agencies.csv` (~11,000 rows)
- `data/cms/nursing-homes-providers.csv` (~15,000 rows)
- `data/cms/hospice-providers.csv` (~6,000 rows)
- `data/cms/hospitals.csv` (~6,000 rows)

**Expected time:** 2-5 minutes

### Step 2: Process CMS Data

Transform raw CMS data into our schema format:

```bash
pnpm tsx scripts/process-cms-data.ts
```

**Output:**
- `data/cms/processed/home-health-processed.csv`
- `data/cms/processed/nursing-homes-processed.csv`
- `data/cms/processed/hospice-processed.csv`
- `data/cms/processed/hospitals-medical-systems.csv`

**Expected time:** 1-2 minutes

### Step 3: Geocode Addresses

Add latitude/longitude coordinates using the free US Census Geocoding API:

```bash
# Geocode each dataset
pnpm tsx scripts/geocode-addresses.ts \
  data/cms/processed/home-health-processed.csv \
  data/cms/geocoded/home-health-geocoded.csv

pnpm tsx scripts/geocode-addresses.ts \
  data/cms/processed/nursing-homes-processed.csv \
  data/cms/geocoded/nursing-homes-geocoded.csv

pnpm tsx scripts/geocode-addresses.ts \
  data/cms/processed/hospice-processed.csv \
  data/cms/geocoded/hospice-geocoded.csv

pnpm tsx scripts/geocode-addresses.ts \
  data/cms/processed/hospitals-medical-systems.csv \
  data/cms/geocoded/hospitals-geocoded.csv
```

**Rate limiting:** ~1 request/second (Census API best practice)

**Expected time:**
- Home health: ~3 hours (11,000 addresses)
- Nursing homes: ~4 hours (15,000 addresses)
- Hospice: ~2 hours (6,000 addresses)
- Hospitals: ~2 hours (6,000 addresses)
- **Total: ~11 hours** (can run in background overnight)

**Optimization:** Run geocoding in parallel for multiple files to reduce total time.

### Step 4: Import Resources to Database

Import geocoded data with optional proximity computation:

```bash
# Import home health agencies WITH proximity computation
pnpm tsx scripts/import-resources-enhanced.ts \
  data/cms/geocoded/home-health-geocoded.csv \
  --compute-proximity

# Import nursing homes WITH proximity computation
pnpm tsx scripts/import-resources-enhanced.ts \
  data/cms/geocoded/nursing-homes-geocoded.csv \
  --compute-proximity

# Import hospice providers WITH proximity computation
pnpm tsx scripts/import-resources-enhanced.ts \
  data/cms/geocoded/hospice-geocoded.csv \
  --compute-proximity
```

**Expected time per dataset:**
- Without proximity: 2-5 minutes
- With proximity: 10-30 minutes (depends on medical systems in database)

### Step 5: Import Medical Systems

Import hospitals into the `medical_systems` table:

```bash
# First, create a separate import script for medical_systems table
# OR manually import via SQL:

COPY medical_systems (
  cms_provider_id, name, street_address, city, state, zip_code,
  latitude, longitude, hospital_type, phone, cms_quality_rating
)
FROM '/path/to/hospitals-geocoded.csv'
WITH (FORMAT CSV, HEADER true);
```

## Data Organization

### By Insurance Coverage

Resources are filterable by insurance acceptance:

```sql
-- Find Medicare-accepting home health in a ZIP code
SELECT * FROM resources
WHERE provider_type = 'home_health'
  AND medicare_accepted = true
  AND zip_code = '90001';

-- Find facilities accepting ALL insurance types
SELECT * FROM resources
WHERE medicare_accepted = true
  AND medicaid_accepted = true
  AND private_insurance_accepted = true
  AND veterans_affairs_accepted = true;
```

### By Geolocation

Find resources near a specific location:

```sql
-- Find resources within 50 miles of coordinates
SELECT
  *,
  calculate_distance_miles(
    ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326)::geography,
    geolocation
  ) as distance
FROM resources
WHERE ST_DWithin(
  ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326)::geography,
  geolocation,
  50 * 1609.34 -- 50 miles to meters
)
ORDER BY distance ASC;
```

### By Proximity to Medical Systems

Find resources near major hospitals:

```sql
-- Find all resources within 120 miles of teaching hospitals
SELECT
  r.*,
  ms.name as nearest_hospital,
  rmp.distance_miles
FROM resources r
JOIN resource_medical_proximity rmp ON r.id = rmp.resource_id
JOIN medical_systems ms ON rmp.medical_system_id = ms.id
WHERE ms.is_teaching_hospital = true
  AND rmp.distance_miles <= 120
ORDER BY rmp.distance_miles ASC;
```

## Data Sources Reference

### CMS Datasets

| Dataset | URL | Records | Update Frequency |
|---------|-----|---------|------------------|
| Home Health Agencies | https://data.cms.gov/provider-data/dataset/6jpm-sxkc | ~11,000 | Quarterly |
| Nursing Homes | https://data.cms.gov/provider-data/dataset/4pq5-n9py | ~15,000 | Quarterly |
| Hospice Providers | https://data.cms.gov/provider-data/dataset/252m-zfp9 | ~6,000 | Quarterly |
| Hospitals | https://data.cms.gov/provider-data/dataset/xubh-q36u | ~6,000 | Quarterly |

### State Datasets

| State | URL | Records | Type |
|-------|-----|---------|------|
| California | https://data.chhs.ca.gov/dataset/healthcare-facility-locations | ~5,000 | All licensed facilities |
| Illinois | https://data.illinois.gov/dataset/idph-home-health-agencies-directory | ~2,000 | Home health, hospice |
| New York | https://health.data.ny.gov/Health/Licensed-Home-Care-Services-Agency-Registration-St/uk9g-nvzj | ~1,400 | Licensed home care |

### Academic Datasets

| Dataset | URL | Records | Notes |
|---------|-----|---------|-------|
| Assisted Living Facilities | https://github.com/antonstengel/assisted-living-data | 44,638 | All 50 states + DC, 1.2M beds |

## Scaling to Thousands of Records

### Current Pipeline Capacity

With the CMS datasets alone:
- **Home Health:** ~11,000 agencies
- **Nursing Homes:** ~15,000 facilities
- **Hospice:** ~6,000 providers
- **Total from CMS:** ~32,000 resources

### Expansion Strategy

1. **Week 1-2:** CMS datasets (32,000 records)
2. **Week 3:** Add GitHub assisted living dataset (44,638 records)
3. **Week 4:** Add state databases CA, IL, NY, FL, TX (15,000+ records)
4. **Target:** 90,000+ comprehensive elder care resources

### Quarterly Maintenance

CMS updates data quarterly (Jan, Apr, Jul, Oct):

```bash
# Re-download latest data
./scripts/download-cms-data.sh

# Re-process and geocode only new/changed records
pnpm tsx scripts/process-cms-data.ts
# ... geocode and import
```

## Performance Considerations

### Geocoding Bottleneck

Geocoding is the slowest step (~1 req/sec):

**Solutions:**
1. **Batch processing:** Run overnight or over weekend
2. **Parallel processing:** Geocode multiple files simultaneously
3. **Caching:** Store geocoded results, only geocode new addresses
4. **Paid services:** Google Maps API ($5/1000 requests) or Mapbox for faster geocoding

### Database Indexing

Migration includes optimized indexes:
- GiST index on `geolocation` for fast spatial queries
- B-tree indexes on `zip_code`, `state`, `provider_type`
- GIN indexes on insurance acceptance fields
- Precomputed `resource_medical_proximity` table

### Proximity Computation

Computing proximity for 30,000 resources × 6,000 hospitals = 180M calculations.

**Optimization:**
- Only compute within 120-mile radius (dramatically reduces calculations)
- Precompute and store in `resource_medical_proximity` table
- Update only when new resources/hospitals added
- Use spatial indexes (GiST) for fast lookups

## Troubleshooting

### Geocoding Failures

**Issue:** Census API returns no match

**Solutions:**
1. Check address formatting (street abbreviations, suite numbers)
2. Fall back to ZIP code centroid
3. Manual correction for critical facilities
4. Use alternative geocoding services (Google, Mapbox)

### Import Errors

**Issue:** Database constraint violations

**Solutions:**
1. Check required fields are populated
2. Validate data types (boolean, integer, decimal)
3. Review Supabase logs for specific error messages
4. Use `--skip-errors` flag to continue on failures

### Migration Issues

**Issue:** PostGIS extension not available

**Solution:**
```sql
-- Enable PostGIS in Supabase dashboard:
-- Settings → Database → Extensions → Enable "postgis"
```

## Next Steps

1. **Apply migration:** Run `0003_add_geolocation_and_medical_systems.sql` in Supabase
2. **Download data:** Execute `./scripts/download-cms-data.sh`
3. **Process data:** Run `pnpm tsx scripts/process-cms-data.ts`
4. **Geocode (background):** Start geocoding overnight
5. **Import:** Load geocoded data with proximity computation
6. **Verify:** Check database counts and sample queries
7. **Update UI:** Modify results page to display resources by proximity and insurance

## Support

For issues or questions:
- Check Supabase logs for database errors
- Review CMS dataset documentation
- Verify Census Geocoding API status: https://geocoding.geo.census.gov/geocoder/
- Consult PostGIS documentation for spatial queries
