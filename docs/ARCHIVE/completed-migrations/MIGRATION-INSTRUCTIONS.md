# Geocoding Migration Instructions

The geocoding columns need to be added to the database before running the geocoding script.

## Option 1: Supabase SQL Editor (Recommended)

1. Open the Supabase SQL Editor:
   https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql/new

2. Copy and paste the following SQL:

```sql
-- Add geocoding columns to resources table

ALTER TABLE resources
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS geocode_quality VARCHAR(50);

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_resources_coordinates ON resources(latitude, longitude);

-- Create index for finding non-geocoded facilities
CREATE INDEX IF NOT EXISTS idx_resources_geocoded ON resources(geocoded_at) WHERE geocoded_at IS NULL;

COMMENT ON COLUMN resources.latitude IS 'Facility latitude (Google Geocoding API)';
COMMENT ON COLUMN resources.longitude IS 'Facility longitude (Google Geocoding API)';
COMMENT ON COLUMN resources.geocoded_at IS 'Timestamp when geocoding was performed';
COMMENT ON COLUMN resources.geocode_quality IS 'Geocoding accuracy from Google API';
```

3. Click **RUN** button

4. Verify success - you should see a message like "Success. No rows returned"

## Option 2: Command Line (if you have psql)

If you have the database connection string with psql access:

```bash
psql <your-connection-string> < scripts/add-geocoding-columns.sql
```

## Verification

After running the migration, verify it worked:

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

## Next Steps

Once the migration is complete, run the geocoding script:

```bash
# Test with 10 facilities first
pnpm tsx scripts/geocode-facilities.ts --batch-size=10 --dry-run

# If successful, run on all facilities
pnpm tsx scripts/geocode-facilities.ts --batch-size=100
```
