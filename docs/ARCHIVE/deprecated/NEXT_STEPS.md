# Quick Reference: Complete the Staffing Metrics Import

## ✅ What's Done
1. ✅ Updated processing scripts with 16 new staffing columns
2. ✅ Re-processed nursing homes CSV with staffing data (14,752 facilities)
3. ✅ Updated import script to include staffing columns
4. ✅ Created migration file with database schema changes

## 🚧 What's Needed

### Step 1: Apply Database Migration (5 minutes)
```
1. Open: https://cxadvvjhouprybyvryyd.supabase.co/project/cxadvvjhouprybyvryyd/sql
2. Copy/paste: supabase/migrations/0008_add_staffing_metrics.sql
3. Click "Run"
4. Verify: Should see "Success. No rows returned"
```

### Step 2: Delete Old Nursing Homes (1 minute)
```bash
pnpm tsx scripts/delete-old-nursing-homes.ts
```

### Step 3: Import New Data with Staffing Metrics (5-10 minutes)
```bash
pnpm tsx scripts/import-resources-simple.ts data/cms/processed/nursing-homes-processed.csv
```

### Step 4: Verify (1 minute)
```bash
pnpm tsx scripts/check-nursing-homes.ts
```

## 📊 Expected Results
- 14,752 nursing homes imported
- 14,535 (98.5%) with staffing ratings
- Staffing hours, turnover, and quality metrics populated

## 📝 Quick Test Query
After import, run in Supabase SQL Editor:
```sql
SELECT 
  title,
  city,
  staffing_rating,
  total_nurse_hours_per_resident_per_day,
  health_inspection_rating
FROM resources
WHERE 'nursing_home' = ANY(category)
  AND staffing_rating IS NOT NULL
LIMIT 5;
```

## 🆘 Troubleshooting
- **Import fails with "column does not exist"**: Migration not applied yet (do Step 1)
- **No staffing data showing**: Check CSV has the columns: `head -1 data/cms/processed/nursing-homes-processed.csv | grep staffing_rating`
- **Different facility count**: Old data not deleted (do Step 2 again)

## 📁 Modified Files
- `/Users/dtemp/Desktop/nonnie-world/scripts/process-cms-data.ts`
- `/Users/dtemp/Desktop/nonnie-world/scripts/import-resources-simple.ts`
- `/Users/dtemp/Desktop/nonnie-world/data/cms/processed/nursing-homes-processed.csv` (9.6MB, 14,752 rows)

## 🔗 Related Files
- Migration SQL: `supabase/migrations/0008_add_staffing_metrics.sql`
- Full Summary: `STAFFING_METRICS_SUMMARY.md`
