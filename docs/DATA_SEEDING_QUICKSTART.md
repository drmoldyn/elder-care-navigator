# Data Seeding Quickstart Guide

## Quick Summary

This guide will help you seed **thousands of elder care resources** organized by:
- ✅ **Insurance coverage** (Medicare, Medicaid, Private, VA)
- ✅ **Geolocation** (city, state, ZIP code with lat/long coordinates)
- ✅ **Proximity to major medical systems** (within 120 miles)

**Total available resources:** 90,000+ facilities nationwide

## Prerequisites

- Supabase project with PostGIS extension enabled
- Node.js and pnpm installed
- Environment variables configured (`.env.local`)

## Five-Step Process

### Step 1: Enable PostGIS Extension (1 minute)

In Supabase Dashboard:
1. Go to **Database** → **Extensions**
2. Search for "postgis"
3. Click **Enable**

### Step 2: Apply Database Migration (2 minutes)

Open Supabase SQL Editor and run:

```bash
# Copy content from:
supabase/migrations/0003_add_geolocation_and_medical_systems.sql
```

This adds:
- Geolocation fields (lat/long, PostGIS geography)
- Insurance coverage fields (Medicare, Medicaid, Private, VA)
- Medical systems table (hospitals)
- Proximity relationship table
- Spatial indexes and functions

### Step 3: Download CMS Data (5 minutes)

```bash
./scripts/download-cms-data.sh
```

Downloads 4 datasets:
- Home Health Agencies (~11,000)
- Nursing Homes (~15,000)
- Hospice Providers (~6,000)
- Hospitals (~6,000)

**Total:** ~38,000 facilities

### Step 4: Process Data (2 minutes)

```bash
pnpm tsx scripts/process-cms-data.ts
```

Transforms CMS data into our schema format.

### Step 5: Geocode & Import (Background Process)

**Option A: Import Without Coordinates (Fast - 10 minutes)**

```bash
# Import all datasets without geocoding
pnpm tsx scripts/import-resources-enhanced.ts data/cms/processed/home-health-processed.csv
pnpm tsx scripts/import-resources-enhanced.ts data/cms/processed/nursing-homes-processed.csv
pnpm tsx scripts/import-resources-enhanced.ts data/cms/processed/hospice-processed.csv
```

**Option B: Import With Full Geocoding (Slow - 11+ hours)**

```bash
# Geocode addresses first (run overnight)
pnpm tsx scripts/geocode-addresses.ts \
  data/cms/processed/home-health-processed.csv \
  data/cms/geocoded/home-health-geocoded.csv

# Then import with proximity computation
pnpm tsx scripts/import-resources-enhanced.ts \
  data/cms/geocoded/home-health-geocoded.csv \
  --compute-proximity
```

**Recommendation:** Start with Option A to get data loaded quickly. Geocode in background later.

## Immediate Results

After Step 5 (Option A), you'll have:
- ✅ **32,000+ resources** in your database
- ✅ Organized by **insurance coverage**
- ✅ Filterable by **state, city, ZIP code**
- ✅ Provider types (home health, nursing home, hospice)
- ✅ CMS quality ratings
- ⏳ Geocoding coordinates (pending)
- ⏳ Medical system proximity (pending)

## Adding More Data

### Assisted Living Facilities (44,638 facilities)

```bash
# Download from GitHub
curl -L https://raw.githubusercontent.com/antonstengel/assisted-living-data/main/assisted-living-facilities.csv \
  -o data/assisted-living.csv

# Process and import
pnpm tsx scripts/import-resources-enhanced.ts data/assisted-living.csv
```

### State Databases

**California (~5,000 facilities):**
```bash
curl -L "https://data.chhs.ca.gov/dataset/healthcare-facility-locations/resource/your-resource-id/download/facilities.csv" \
  -o data/california-facilities.csv
```

**Illinois (~2,000 facilities):**
```bash
curl -L "https://data.illinois.gov/api/views/idph-home-health/rows.csv?accessType=DOWNLOAD" \
  -o data/illinois-home-health.csv
```

## Querying Your Data

### Find by Insurance

```sql
-- Medicare-accepting home health in Los Angeles
SELECT * FROM resources
WHERE provider_type = 'home_health'
  AND medicare_accepted = true
  AND city = 'Los Angeles'
  AND state = 'CA';
```

### Find by Location

```sql
-- All nursing homes in ZIP code
SELECT * FROM resources
WHERE provider_type = 'nursing_home'
  AND zip_code = '90001';
```

### Find by Quality

```sql
-- 5-star rated facilities
SELECT * FROM resources
WHERE quality_rating >= 4.5
ORDER BY quality_rating DESC;
```

## Next Steps

1. **Verify import:** Check resource counts in Supabase dashboard
2. **Update UI:** Modify results page to display resources
3. **Geocode addresses:** Run geocoding overnight for proximity features
4. **Import hospitals:** Load medical systems table for 120-mile proximity
5. **Schedule updates:** Set up quarterly refresh from CMS (Jan, Apr, Jul, Oct)

## Troubleshooting

**Q: Import fails with "column does not exist"**
A: Make sure you ran migration `0003_add_geolocation_and_medical_systems.sql`

**Q: Geocoding is too slow**
A: Use Option A to import without coordinates first. Geocode in background.

**Q: How do I update data quarterly?**
A: Re-run `download-cms-data.sh` and `import-resources-enhanced.ts` (upsert mode)

## Full Documentation

See [`DATA_PIPELINE.md`](./DATA_PIPELINE.md) for complete technical documentation.
