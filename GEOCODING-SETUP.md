# Geocoding Setup Guide

This guide will walk you through setting up address-level geocoding for the Elder Care Navigator.

## Prerequisites

- Supabase database with `resources` table
- Google Cloud account for Geocoding API

## Step 1: Get Google Geocoding API Key

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable billing (required for Geocoding API)

### 1.2 Enable Geocoding API

1. Navigate to **APIs & Services** → **Library**
2. Search for "Geocoding API"
3. Click **Enable**

### 1.3 Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the API key

### 1.4 Restrict API Key (Recommended)

1. Click on the API key you just created
2. Under **API restrictions**, select "Restrict key"
3. Select only:
   - Geocoding API
   - Maps JavaScript API (if using maps)
4. Under **Application restrictions**:
   - For development: None
   - For production: HTTP referrers (add your domain)
5. Click **Save**

## Step 2: Add API Key to Environment

Add the API key to your `.env.local` file:

```bash
# .env.local

# Existing Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://cxadvvjhouprybyvryyd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Add this line:
GOOGLE_GEOCODING_API_KEY=your-google-api-key-here

# Optional: For client-side maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-api-key-here
```

## Step 3: Run Database Migration

The migration adds these columns to the `resources` table:
- `latitude` (DECIMAL 10,8)
- `longitude` (DECIMAL 11,8)
- `geocoded_at` (TIMESTAMP)
- `geocode_quality` (VARCHAR 50)

### Option A: Supabase SQL Editor (Recommended)

1. Open: https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql/new

2. Copy and paste this SQL:

```sql
-- Add geocoding columns to resources table
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS geocode_quality VARCHAR(50);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resources_coordinates
ON resources(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_resources_geocoded
ON resources(geocoded_at) WHERE geocoded_at IS NULL;
```

3. Click **RUN**

4. Verify success: You should see "Success. No rows returned"

### Option B: Command Line (Advanced)

If you have direct database access:

```bash
psql <connection-string> < scripts/add-geocoding-columns.sql
```

## Step 4: Test Geocoding (Dry Run)

Test on 10 facilities without updating the database:

```bash
pnpm tsx scripts/geocode-facilities.ts --batch-size=10 --dry-run
```

Expected output:
```
🗺️  Geocoding Facility Addresses
============================================================
🔍 DRY RUN MODE - No database updates will be made

📊 Facilities needing geocoding: 61,346
⚙️  Batch size: 10
⏱️  Rate limit: 50 requests/second (Google free tier)

[1/10] The 80th Street Residence
   📍 240 East 80th Street, New York NY 10075
   ✅ Geocoded: 40.773821, -73.955704 (ROOFTOP)
...
```

## Step 5: Run Batch Geocoding

Once the dry run succeeds, geocode all facilities:

```bash
# Start with 100 facilities
pnpm tsx scripts/geocode-facilities.ts --batch-size=100

# Run multiple times until all are geocoded
pnpm tsx scripts/geocode-facilities.ts --batch-size=1000
```

### Rate Limits

- **Google Free Tier**: 40,000 requests/month
- **Script Rate**: 10 requests/second (100ms delay)
- **Time Estimate**: ~2 hours for all 61,346 facilities
- **Cost Estimate**:
  - First 40,000: Free
  - Remaining 21,346 × $0.005 = **$106.73**
  - **Total one-time cost**: ~$107

### Monitor Progress

Check how many facilities have been geocoded:

```bash
pnpm tsx scripts/run-geocoding-migration.ts
```

Or query directly:

```sql
SELECT COUNT(*)
FROM resources
WHERE latitude IS NOT NULL;
```

## Step 6: Update API to Use Geocoded Matching

Once geocoding is complete, update the matching API:

```typescript
// app/api/match/route.ts

import { matchResourcesGeocoded } from '@/lib/matching/geocoded-matcher';

export async function POST(request: Request) {
  const session = await request.json();

  // Use geocoded matcher instead of SQL matcher
  const results = await matchResourcesGeocoded(session);

  return Response.json(results);
}
```

## Step 7: Update UI to Display Distances

Update the results page to show distances:

```typescript
// components/results/facility-card.tsx

<div className="flex items-center gap-2 text-sm text-gray-600">
  <MapPin className="h-4 w-4" />
  <span>{facility.city}, {facility.state}</span>
  {facility.distance && (
    <span className="font-semibold text-indigo-600">
      • {facility.distance} miles away
    </span>
  )}
</div>
```

## Verification

Test the complete flow:

1. Go to http://localhost:3004
2. Enter ZIP code: 10001
3. Select radius: 25 miles
4. Click "Find Care Options"
5. Verify:
   - Results show "X miles away"
   - Results are sorted by distance (closest first)
   - Map markers appear at correct locations

## Troubleshooting

### "Missing API Key" Error

```bash
❌ Missing GOOGLE_GEOCODING_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

**Solution**: Add `GOOGLE_GEOCODING_API_KEY=...` to `.env.local`

### "OVER_QUERY_LIMIT" Error

```bash
⚠️  Geocoding failed (OVER_QUERY_LIMIT)
```

**Solution**:
- Wait 24 hours for quota to reset
- Or reduce batch size: `--batch-size=50`
- Or increase delay in script (edit `sleep(100)` to `sleep(200)`)

### "ZERO_RESULTS" Error

Some addresses can't be geocoded. This is normal. The script will:
- Log the address
- Skip to next facility
- Continue processing

### Geocoding Columns Not Found

```bash
❌ Geocoding columns not found in database
```

**Solution**: Run the database migration (Step 3)

## Cost Management

### Free Tier

- 40,000 requests/month free
- Resets monthly

### Reducing Costs

1. **Use ZIP Code Database for User Searches**
   - Only geocode facilities (one-time)
   - Use free ZIP database: https://github.com/zauberware/postal-codes-js
   - Saves ~$5/month

2. **Cache Results**
   - Store geocoded ZIP codes in Redis/memory
   - Avoid re-geocoding same ZIP

3. **Set Billing Alerts**
   - Google Cloud Console → Billing → Budgets & Alerts
   - Set alert at $10/month

## Next Steps

After geocoding is complete:

1. ✅ All 61,346 facilities have lat/lng coordinates
2. ✅ Distance calculations are accurate to ±0.5%
3. ✅ Results sorted by actual distance
4. ✅ Can filter by precise radius (5, 10, 25, 50 miles)
5. ✅ Map markers appear at exact locations

## Reference Documentation

- Full documentation: `docs/GEOCODING.md`
- Migration SQL: `scripts/add-geocoding-columns.sql`
- Geocoding script: `scripts/geocode-facilities.ts`
- Distance utilities: `src/lib/utils/distance.ts`
- Geocoded matcher: `src/lib/matching/geocoded-matcher.ts`
