# 🚀 Run This SQL Migration

## Step 1: Open Supabase SQL Editor

Click this link to open the SQL editor:
**https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql/new**

## Step 2: Copy This SQL

```sql
-- Add geocoding columns to resources table
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS geocode_quality VARCHAR(50);

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_resources_coordinates
ON resources(latitude, longitude);

-- Create index for finding non-geocoded facilities
CREATE INDEX IF NOT EXISTS idx_resources_geocoded
ON resources(geocoded_at) WHERE geocoded_at IS NULL;

-- Add comments
COMMENT ON COLUMN resources.latitude IS 'Facility latitude (Google Geocoding API)';
COMMENT ON COLUMN resources.longitude IS 'Facility longitude (Google Geocoding API)';
COMMENT ON COLUMN resources.geocoded_at IS 'Timestamp when geocoding was performed';
COMMENT ON COLUMN resources.geocode_quality IS 'Geocoding accuracy from Google API';
```

## Step 3: Click "RUN"

You should see: **"Success. No rows returned"**

## Step 4: Verify

Run this command to verify the migration worked:

```bash
pnpm tsx scripts/run-geocoding-migration.ts
```

You should see:
```
✅ Geocoding columns already exist!
   latitude: ✓
   longitude: ✓
   geocoded_at: ✓
   geocode_quality: ✓
```

## Step 5: Run Geocoding

Now you can geocode the facilities:

```bash
# Test with 5 facilities first
pnpm tsx scripts/geocode-facilities.ts --batch-size=5 --dry-run

# If successful, geocode 100 facilities
pnpm tsx scripts/geocode-facilities.ts --batch-size=100

# Continue running until all 61,346 are geocoded
```

---

**That's it!** Once you complete Step 1-3, the geocoding script will be ready to run.
