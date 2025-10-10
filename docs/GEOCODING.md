# Geocoding System

## Overview

The Elder Care Navigator uses **address-level geocoding** (not ZIP code-level) for precise distance calculations. Each facility's street address is geocoded to get exact latitude/longitude coordinates, enabling accurate "X miles away" calculations.

---

## Why Address-Level Geocoding?

### ZIP Code Approximation (Old Method)
- ❌ Uses 3-digit ZIP prefix matching
- ❌ Approximates: same prefix ≈ 30 miles, ±1 prefix ≈ 100 miles
- ❌ Inaccurate: 2 facilities in same ZIP could be 10 miles apart
- ❌ Can't show "2.3 miles away"

### Address-Level Geocoding (New Method)
- ✅ Uses Google Geocoding API on full street address
- ✅ Accurate to building/rooftop level
- ✅ Can calculate exact distances ("2.3 miles")
- ✅ Enables radius filtering (show only within 10 miles)
- ✅ Sorts results by actual distance

---

## Setup

### 1. Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Geocoding API** and **Maps Embed API**
3. Create API key
4. Restrict key to:
   - Geocoding API
   - Maps Embed API
   - Your production domain (for security)

### 2. Add to Environment

```bash
# .env.local
GOOGLE_GEOCODING_API_KEY=your-api-key-here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key-here  # For client-side maps
```

### 3. Run Database Migration

```bash
# Add lat/lng columns to resources table
psql $DATABASE_URL < scripts/add-geocoding-columns.sql
```

Or manually run:
```sql
ALTER TABLE resources
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN geocoded_at TIMESTAMP,
ADD COLUMN geocode_quality VARCHAR(50);

CREATE INDEX idx_resources_coordinates ON resources(latitude, longitude);
```

---

## Geocoding Facilities

### Batch Geocoding Script

```bash
# Dry run (test without updating database)
pnpm tsx scripts/geocode-facilities.ts --dry-run

# Geocode 100 facilities
pnpm tsx scripts/geocode-facilities.ts --batch-size=100

# Geocode all facilities (run multiple times)
pnpm tsx scripts/geocode-facilities.ts --batch-size=1000
```

### Rate Limits

**Google Geocoding API**:
- Free tier: 40,000 requests/month
- Rate limit: 50 requests/second
- Cost: $5 per 1,000 requests after free tier

**Our Implementation**:
- 10 requests/second (100ms delay between requests)
- ~36,000 requests/hour
- Can geocode all 61,346 facilities in ~2 hours
- Estimated cost: $0 (within free tier)

### Monitoring Progress

```bash
# Check how many facilities are geocoded
pnpm tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { count } = await supabase.from('resources').select('*', {count: 'exact', head: true}).not('latitude', 'is', null);
console.log(\`Geocoded: \${count?.toLocaleString()} / 61,346\`);
"
```

---

## How Distance Calculation Works

### 1. User Enters ZIP Code
```typescript
// User searches: ZIP 10001, radius 25 miles
const userZip = "10001";
const radius = 25;
```

### 2. Geocode User's ZIP Code
```typescript
// Google Geocoding API returns:
{
  latitude: 40.7506,
  longitude: -73.9971
}
// This is the center of Manhattan (Empire State Building area)
```

### 3. Get Facilities in Bounding Box
```typescript
// Optimization: Pre-filter using bounding box
// Bounding box for 25-mile radius:
{
  minLat: 40.3882,  // ~25 miles south
  maxLat: 41.1130,  // ~25 miles north
  minLng: -74.4183, // ~25 miles west
  maxLng: -73.5759  // ~25 miles east
}
```

### 4. Calculate Precise Distances
```typescript
// For each facility in bounding box:
const distance = haversine(
  {lat: 40.7506, lng: -73.9971},  // User location
  {lat: 40.7589, lng: -73.9851}   // Facility location
);
// Result: 0.6 miles
```

### 5. Filter & Sort
```typescript
// Only keep facilities within radius
facilities
  .filter(f => f.distance <= 25)
  .sort((a, b) => a.distance - b.distance);

// Result:
[
  { name: "The 80th Street Residence", distance: 0.6 },
  { name: "West Seventy-Fourth Street Home", distance: 1.2 },
  { name: "Vista On 5th", distance: 2.3 },
  ...
]
```

---

## Haversine Formula

Calculates great-circle distance between two points on Earth.

```typescript
function calculateDistance(coord1, coord2) {
  const R = 3959; // Earth radius in miles (6371 for km)

  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLon = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(coord1.lat)) *
    Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 0.1 miles
}
```

**Accuracy**: ±0.5% (precise enough for our use case)

---

## Geocode Quality Levels

Google returns different quality levels:

| Quality | Meaning | Example |
|---------|---------|---------|
| `ROOFTOP` | Exact building location | Best (most facilities) |
| `RANGE_INTERPOLATED` | Estimated along street | Good (some facilities) |
| `GEOMETRIC_CENTER` | Center of area (ZIP, city) | Fair (fallback) |
| `APPROXIMATE` | General area | Poor (rare) |

**Our Implementation**:
- Store `geocode_quality` in database
- Prefer `ROOFTOP` when available
- Flag `APPROXIMATE` results for manual review

---

## Fallback Strategy

If geocoding fails or API key is missing:

```typescript
// geocoded-matcher.ts
if (!filters.location) {
  console.warn('No location found, using fallback matching');
  // Fall back to ZIP prefix matching
  return matchResourcesSQL(session);
}
```

**Fallback = ZIP prefix approximation** (current implementation)

---

## API Usage Optimization

### 1. Only Geocode Once
- Store results in `latitude`, `longitude` columns
- Use `geocoded_at` timestamp to track when geocoded
- Don't re-geocode unless address changes

### 2. Batch Processing
- Process 100-1000 facilities per run
- Use `--batch-size` flag to control
- Resume from where you left off (queries `WHERE latitude IS NULL`)

### 3. Caching User ZIP Codes
```typescript
// Cache geocoded ZIP codes to avoid re-querying
const zipCache = new Map<string, Coordinates>();

async function geocodeZipCode(zip: string): Promise<Coordinates> {
  if (zipCache.has(zip)) return zipCache.get(zip)!;

  const coords = await callGoogleAPI(zip);
  zipCache.set(zip, coords);
  return coords;
}
```

---

## Testing

### Test Distance Calculation
```bash
pnpm tsx -e "
import { calculateDistance } from './src/lib/utils/distance.js';
const d = calculateDistance(
  { latitude: 40.7506, longitude: -73.9971 },  // Empire State Building
  { latitude: 40.7589, longitude: -73.9851 }   // Central Park
);
console.log(\`Distance: \${d} miles\`);
// Expected: ~0.6 miles
"
```

### Test Geocoding
```bash
# Dry run on 10 facilities
pnpm tsx scripts/geocode-facilities.ts --batch-size=10 --dry-run
```

### Verify Results
```sql
-- Check geocoded facilities
SELECT
  title,
  street_address,
  latitude,
  longitude,
  geocode_quality,
  geocoded_at
FROM resources
WHERE latitude IS NOT NULL
LIMIT 10;
```

---

## Monitoring & Maintenance

### Check Geocoding Progress
```bash
pnpm tsx scripts/test-geocoding-stats.ts
```

### Find Failed Geocoding
```sql
-- Facilities with addresses but no geocoding
SELECT title, street_address, city, zip_code
FROM resources
WHERE street_address IS NOT NULL
  AND latitude IS NULL
LIMIT 100;
```

### Re-geocode Failed Addresses
```bash
# Run geocoding again (skips already-geocoded)
pnpm tsx scripts/geocode-facilities.ts --batch-size=100
```

---

## Cost Estimation

### Geocoding Costs
- **One-time setup**: Geocode 61,346 facilities
- **Free tier**: First 40,000 requests free
- **Paid**: 21,346 requests × $0.005 = **$106.73**
- **Total one-time cost**: ~$107

### Ongoing Costs
- **New facilities**: ~100/month × $0.005 = **$0.50/month**
- **User searches**: Geocode ZIP codes (cached after first use)
- **User search cost**: ~1,000 searches/month × $0.005 = **$5/month**

**Total Monthly Cost**: ~$6/month

### Alternative: Free ZIP Code Database
- Use free ZIP code database for user searches
- Example: https://github.com/zauberware/postal-codes-js
- Only use Google API for facility addresses (one-time)
- **Reduces ongoing cost to ~$1/month**

---

## Production Checklist

- [ ] Add `GOOGLE_GEOCODING_API_KEY` to `.env.local`
- [ ] Run database migration (add lat/lng columns)
- [ ] Geocode all 61,346 facilities (`pnpm tsx scripts/geocode-facilities.ts`)
- [ ] Test distance calculation with sample searches
- [ ] Update `/api/match` to use `matchResourcesGeocoded`
- [ ] Display distances in results UI ("2.3 miles away")
- [ ] Set up API key restrictions in Google Cloud Console
- [ ] Monitor API usage in Google Cloud Console
- [ ] Set up billing alerts (>$10/month)

---

## Troubleshooting

### "OVER_QUERY_LIMIT" Error
**Problem**: Hit Google API rate limit
**Solution**:
- Reduce batch size: `--batch-size=50`
- Increase delay between requests (edit `sleep(100)` to `sleep(200)`)
- Check daily quota in Google Cloud Console

### "ZERO_RESULTS" Error
**Problem**: Google can't find the address
**Solution**:
- Check if address is valid
- Try geocoding with just city + ZIP
- Mark as needs manual review

### No API Key Warning
**Problem**: `GOOGLE_GEOCODING_API_KEY` not set
**Solution**:
- Add to `.env.local`
- Restart dev server: `pnpm dev`

---

## Future Enhancements

1. **Bulk Geocoding Service** - Use commercial service for faster initial import
2. **Address Validation** - Validate addresses before geocoding
3. **Manual Override** - UI for manually correcting bad geocoding
4. **ZIP Code Cache Table** - Store geocoded ZIP codes to reduce API calls
5. **Proximity Clusters** - Group nearby facilities for better map UX

---

**Estimated Setup Time**: 2-3 hours (mostly waiting for geocoding to complete)
**Maintenance**: 5 minutes/month (geocode new facilities)
