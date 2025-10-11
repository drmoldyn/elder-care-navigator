# Nursing Home Re-Import Plan with CCN *(Deprecated)*

> ⚠️ **Deprecated on October 11, 2025.** This plan has been superseded by the exact-match merge workflow documented in `docs/NURSING-HOME-CCN-EXACT-MERGE.md`.

**Date:** October 11, 2025
**Status:** ✅ Ready to execute
**Reason:** Name-based matching failed validation (77.2% accuracy, 22.8% duplicates)

---

## Executive Summary

**Problem:** Current nursing homes lack CCN (facility_id), making accurate quality metric matching impossible.

**Solution:** Re-import from freshly processed CMS data WITH CCN included.

**Status:** ✅ Data re-processed with CCN - ready for clean re-import

---

## Validation Results

Ran validation script on 500 random facilities matching by name:

```
✅ Exact matches:       386 (77.2%)  ← Below 95% threshold
⚠️  Multiple matches:    114 (22.8%)  ← Duplicates causing misassignment
❌ No match found:      0 (0.0%)

💡 RECOMMENDATION: ❌ LOW ACCURACY - Re-import from scratch with CCN
```

**Critical Issues:**
1. 23% of facilities have duplicate names in database
2. Name-based matching randomly picks one duplicate → misassigns quality metrics
3. Location cross-check impossible (data missing in both CSV and DB)

**Solution:** Use CCN (Federal Provider Number) for 100% accurate matching

---

## Root Cause Analysis

### Why CCN Was Missing

**Problem:** Column name mismatch in processing script

**CMS Source File:**
```
"CMS Certification Number (CCN)","Provider Name",...
015009,"BURNS NURSING HOME, INC."
015010,COOSA VALLEY HEALTHCARE CENTER
```

**Processing Script (OLD - BROKEN):**
```typescript
facility_id: cleanString(row["Federal Provider Number"]),  // ❌ Wrong column name!
```

**Processing Script (NEW - FIXED):**
```typescript
facility_id: cleanString(row["CMS Certification Number (CCN)"] || row["Federal Provider Number"]),  // ✅ Fixed!
```

---

## Solution: Clean Re-Import

### Step 1: ✅ Re-Process CMS Data (COMPLETED)

```bash
pnpm tsx scripts/process-cms-data.ts
```

**Result:**
```
✅ Processed 14,752 nursing homes
📂 File: data/cms/processed/nursing-homes-processed.csv
✅ CCN populated: 015009, 015010, 015012, etc.
```

### Step 2: Delete Old Nursing Homes

**Option A: Via Script (Recommended - Safe)**
```bash
cat > scripts/delete-nursing-homes.ts << 'EOF'
#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteNursingHomes() {
  console.log("🗑️  Deleting old nursing homes...");
  console.log("⏱️  This may take a moment for 16,708 records...\n");

  const { error, count } = await supabase
    .from("resources")
    .delete({ count: "exact" })
    .eq("provider_type", "nursing_home");

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  console.log(`✅ Deleted ${count} nursing homes`);
  console.log("💾 Database is now ready for fresh import with CCN");
}

deleteNursingHomes();
EOF

chmod +x scripts/delete-nursing-homes.ts
pnpm tsx scripts/delete-nursing-homes.ts
```

**Option B: Via Supabase SQL Editor (If script fails)**
```sql
-- Delete all nursing homes
DELETE FROM resources WHERE provider_type = 'nursing_home';

-- Verify deletion
SELECT COUNT(*) FROM resources WHERE provider_type = 'nursing_home';
-- Should return 0
```

**Expected Output:**
```
🗑️  Deleting old nursing homes...
⏱️  This may take a moment for 16,708 records...

✅ Deleted 16708 nursing homes
💾 Database is now ready for fresh import with CCN
```

### Step 3: Import Fresh Data with CCN

```bash
pnpm tsx scripts/import-resources-simple.ts data/cms/processed/nursing-homes-processed.csv 2>&1 | tee fresh-import-with-ccn.log
```

**Expected Output:**
```
📂 Found 14,752 rows in nursing-homes-processed.csv

Processing records...
✅ Inserted: 14,752
✅ Updated: 0
⚠️  Skipped: 0
❌ Errors: 0

✨ Import complete!
```

**Note:** Count decreases from 16,708 → 14,752 because CMS updated their dataset.

### Step 4: Verify CCN Population

```bash
pnpm tsx scripts/check-nursing-homes.ts
```

**Expected Output:**
```
📊 Total nursing homes in database: 14752

📋 Sample record (first one):
   - Title: BURNS NURSING HOME, INC.
   - Facility ID: 015009  ← ✅ CCN present!
   - City, State: RUSSELLVILLE, AL
   - Staffing Rating: 5.0
   - Total Nurse Hours: 4.64
   - Health Inspection Rating: 2.0
```

**Verification Query:**
```bash
pnpm tsx -e "
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  const { count: total } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('provider_type', 'nursing_home');

  const { count: withCCN } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('provider_type', 'nursing_home')
    .not('facility_id', 'is', null);

  console.log('Total nursing homes:', total);
  console.log('With CCN (facility_id):', withCCN);
  console.log('Percentage with CCN:', ((withCCN / total) * 100).toFixed(1) + '%');
}

verify();
"
```

**Expected:**
```
Total nursing homes: 14752
With CCN (facility_id): 14752
Percentage with CCN: 100.0%
```

### Step 5: Re-Geocode Facilities

Since we deleted old records with geocoding, we need to geocode the fresh imports:

```bash
# Start geocoding in background
pnpm tsx scripts/geocode-facilities.ts --provider-type=nursing_home 2>&1 | tee geocoding-nursing-homes.log &
```

**Cost Estimate:**
- 14,752 facilities × $0.005/geocode = **$73.76**

**Time Estimate:**
- At 500/batch with 1sec delay = ~30 minutes

**Monitor Progress:**
```bash
tail -f geocoding-nursing-homes.log
```

### Step 6: Calculate SunsetWell Scores

Once geocoding completes and quality metrics are in place:

```bash
# 1. Normalize metrics within peer groups
pnpm tsx scripts/normalize-facility-metrics.ts

# 2. Calculate composite scores
pnpm tsx scripts/calculate-sunsetwell-scores.ts

# 3. Verify scores
pnpm tsx -e "
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkScores() {
  const { count } = await supabase
    .from('facility_scores')
    .select('*', { count: 'exact', head: true })
    .eq('version', 'v2');

  console.log('Facilities with SunsetWell Scores:', count);
  console.log('Expected: ~14,500 (facilities with complete data)');
}

checkScores();
"
```

---

## Benefits of Clean Re-Import

### ✅ Advantages
1. **100% Accurate Matching** - CCN is unique federal identifier
2. **No Duplicate Issues** - CCN matching eliminates ambiguity
3. **Latest CMS Data** - Fresh from source (14,752 current facilities)
4. **Clean Slate** - No legacy data issues or orphaned records
5. **Future-Proof** - All quality metric updates can match by CCN

### ⚠️ Disadvantages
1. **Geocoding Cost** - $73.76 for 14,752 facilities
2. **Geocoding Time** - ~30 minutes processing time
3. **Temporary Downtime** - Brief period with no nursing homes (during delete/import)

---

## Rollback Plan (If Needed)

If something goes wrong, the old geocoded data still exists in the current CSV:

```bash
# Rollback: Re-import old processed file (without CCN but with old geocoding)
# This file is saved as: data/cms/processed/nursing-homes-processed.csv.backup

cp data/cms/processed/nursing-homes-processed.csv.backup data/cms/processed/nursing-homes-processed-old.csv
pnpm tsx scripts/import-resources-simple.ts data/cms/processed/nursing-homes-processed-old.csv
```

**Backup current processed file first:**
```bash
cp data/cms/processed/nursing-homes-processed.csv data/cms/processed/nursing-homes-processed-with-ccn.csv
```

---

## Timeline

| Step | Time | Cost | Status |
|------|------|------|--------|
| 1. Re-process CMS data | 1 min | $0 | ✅ DONE |
| 2. Delete old records | 1 min | $0 | ⏸️ READY |
| 3. Import fresh data | 2 min | $0 | ⏸️ READY |
| 4. Verify CCN | 1 min | $0 | ⏸️ READY |
| 5. Re-geocode | 30 min | $73.76 | ⏸️ PENDING |
| 6. Calculate scores | 5 min | $0 | ⏸️ PENDING |
| **TOTAL** | **~40 min** | **$73.76** | |

---

## Decision Point

**Execute re-import?**

**YES** ✅
- Clean slate with 100% accurate CCN matching
- Latest CMS data (14,752 facilities)
- One-time geocoding cost ($74)
- Future updates will match perfectly by CCN

**NO** ❌
- Continue with flawed name-based matching
- 23% risk of misassigned quality metrics
- No path forward for SunsetWell Score accuracy

---

## Recommended Action

```bash
# Execute the full re-import sequence:

# 1. Delete old nursing homes
pnpm tsx scripts/delete-nursing-homes.ts

# 2. Import fresh with CCN
pnpm tsx scripts/import-resources-simple.ts data/cms/processed/nursing-homes-processed.csv

# 3. Verify
pnpm tsx scripts/check-nursing-homes.ts

# 4. Geocode (in background)
pnpm tsx scripts/geocode-facilities.ts --provider-type=nursing_home &

# 5. Wait for geocoding, then calculate scores
# (Run steps 6 after geocoding completes)
```

**Total time to complete:** ~40 minutes
**Total cost:** $73.76 (geocoding only)
**Result:** Clean, accurate nursing home data with 100% CCN matching

---

**Next Action:** Execute the re-import plan above for clean, accurate data.
