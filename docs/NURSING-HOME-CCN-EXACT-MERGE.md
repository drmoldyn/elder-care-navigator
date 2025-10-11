# Nursing Home CCN Exact-Merge Runbook

**Date:** October 11, 2025  
**Owner:** Data Engineering (Codex)  
**Status:** ✅ Ready for execution

---

## Overview

We must merge CMS CCN identifiers and quality metrics into existing nursing home records **without losing the geocodes already captured in Supabase**. Many legacy rows lack CCNs, so we only trust merges where both the **facility name _and_ street address match exactly** between the CMS CSV and our database. This runbook walks through the scripted workflow that:

1. Normalizes and compares CMS + Supabase data to isolate 100% confident matches.
2. Updates those matches in place, preserving latitude/longitude.
3. Segregates non-matching rows for fresh import + post-hoc geocoding.
4. Flags any legacy DB rows no longer present in CMS for manual cleanup.

The legacy "delete everything and re-import" plan is archived in `docs/ARCHIVE/deprecated/RE-IMPORT-PLAN-WITH-CCN.md` and should **not** be used.

---

## Prerequisites

- ✅ `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (service-role key required).  
- ✅ CMS source file `data/cms/nursing-homes-providers.csv` is up to date (download fresh from `https://data.cms.gov/provider-data/dataset/4pq5-n9py`).  
- ✅ Scripts installed via `pnpm install` (ensures `tsx` runner available).  
- ✅ Supabase role executing these scripts has permissions to `SELECT`, `UPDATE`, and `INSERT` on `resources`.

Optional but recommended:
- Take a database snapshot or export the `resources` table for the `provider_type = 'nursing_home'` subset in case you need to roll back.

---

## Step 0 — Re-process CMS Data

Ensure the processed nursing home CSV includes city, state, zip, and county values before matching.

```bash
pnpm tsx scripts/process-cms-data.ts
```

Artifacts:
- `data/cms/processed/nursing-homes-processed.csv` (overwritten)
- `data/cms/processed/nursing-homes-processed.csv.backup` created by the script (if configured) — keep for safety.

Verify spot-check: `head data/cms/processed/nursing-homes-processed.csv` should show populated `city`, `state`, and `zip_code` columns.

---

## Step 1 — Generate Merge Plan

Run the planner script to analyze exact matches and produce working files.

```bash
pnpm tsx scripts/generate-nursing-home-merge-plan.ts
```

Outputs (all under `data/cms/processed/`):

| File | Purpose |
|------|---------|
| `nursing-homes-exact-matches.csv` | Rows with a **unique exact match** on name + address. Safe for in-place updates. Contains Supabase `resource_id`, preserved lat/lng, `location_quality`, `city_match`, and all CMS fields. |
| `nursing-homes-marked-to-delete.csv` | CMS rows that lack a confident match (missing address data, duplicate matches, etc.). These will be imported as **new** resources after deleting/retiring the legacy entries. |
| `nursing-homes-db-without-cms.csv` | Existing Supabase rows that did not find a CMS counterpart. Review before deleting or archiving them. |

Console summary also lists mismatch reasons (`missing_fields`, `ambiguous_db_duplicates`, etc.) to prioritize clean-up work.

### Quick QA

- Check that exact matches count aligns with your expectations (target ≥95% of total CMS rows).  
- Glance at the first few rows of each output file to confirm formatting.

---

## Step 2 — Review and Confirm Exact Match Set

Before applying updates:

1. Spot-check `nursing-homes-exact-matches.csv` — ensure `facility_name`, `address`, and `location_quality` look sensible (`latlong_exact` or `insufficient_data`). Escalate any rows showing `latlong_mismatch`.  
2. Confirm `existing_latitude`/`existing_longitude` columns are populated (they should reflect Supabase values).  
3. If match coverage dips below ~85%, revisit normalization rules or address duplicate suppression (most misses are categorized as `ambiguous_db_duplicates`).

---

## Step 3 — Apply Exact-Match Updates

Run the merge script. It updates CCN, address metadata, and quality metrics for every exact match while leaving latitude / longitude untouched.

```bash
pnpm tsx scripts/run-nursing-home-exact-merge.ts
```

What it does:
- Sets `facility_id` (CCN) on matched rows.
- Aligns `title`, `street_address`, `city`, `zip_code`, `county`, `total_beds`, and `ownership_type` with CMS.
- Updates all staffing + quality metrics (staffing ratings, turnover, inspection scores, etc.).
- Touches `updated_at` for auditing.

Script output includes a progress ticker and a final summary (`updated`, `skipped`, `errors`). Investigate any errors before continuing.

### Post-merge sanity checks

```bash
# Ensure CCNs are populated on updated rows
pnpm tsx -e "
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const run = async () => {
  const { count } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('provider_type', 'nursing_home')
    .not('facility_id', 'is', null);
  console.log('Facilities with CCN:', count);
};
run();
"
```

Spot-check a handful of rows directly in Supabase to confirm lat/lng remained intact.

---

## Step 4 — Handle Non-matching Facilities

### 4.1 Retire legacy rows without a CMS match

- Review `data/cms/processed/nursing-homes-db-without-cms.csv`.  
- Decide whether each facility should be deleted, marked inactive, or kept (e.g., if CMS dropped it but we still need it in app).  
- Document decisions in the file before handing off to ops for deletion.

### 4.2 Import unmatched CMS rows as new facilities

1. Prepare these rows for insert: `data/cms/processed/nursing-homes-marked-to-delete.csv`.  
2. Remove or archive the corresponding legacy Supabase records once you are confident they refer to the same facilities.  
3. Import the CSV as new entries (now with CCN + metrics). Suggested script:

```bash
pnpm tsx scripts/import-resources-simple.ts data/cms/processed/nursing-homes-marked-to-delete.csv --provider-type=nursing_home
```

4. After import, add geocodes for the newly created rows:

```bash
pnpm tsx scripts/geocode-facilities.ts --provider-type=nursing_home --missing-only
```

5. Re-run score normalization & calculation if needed:

```bash
pnpm tsx scripts/normalize-facility-metrics.ts
pnpm tsx scripts/calculate-benchmarks.ts
```

Maintain a log of imported resource IDs to assist QA.

---

## Step 5 — QA Checklist

- [ ] Randomly verify 10 facilities where CCN was newly added. Ensure CCN matches CMS data and geocode is unchanged.  
- [ ] Confirm at least one facility that moved through the "marked to delete" path was successfully re-imported and geocoded.  
- [ ] Validate that `staffing_rating`, `health_inspection_rating`, and `quality_measure_rating` show non-null values for updated rows.  
- [ ] Compare total facility count in Supabase vs. CMS CSV; differences should match the size of `nursing-homes-db-without-cms.csv`.

---

## Escalation & Troubleshooting

| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| `generate-nursing-home-merge-plan` reports very low exact matches | Address normalization too strict or input CSV missing city/state | Verify `data/cms/processed/nursing-homes-processed.csv` has populated address fields. Adjust normalization logic (e.g., add abbreviation replacements) and rerun. |
| `run-nursing-home-exact-merge` skipping records due to missing `facility_id` | Input CSV row lacks CCN | Investigate CMS source; CCN should be present. If not, hold the facility for manual review. |
| Supabase update errors with `column "state" does not exist` | Schema mismatch (state stored in `states` array) | Script intentionally avoids updating `state`; double-check custom column names before modifying. |
| Geocodes overwritten with blanks | Should not happen—script does not touch latitude/longitude. If observed, restore from backup and inspect custom triggers. |

---

## Deliverables for Claude Code Subagents

Provide the following artifacts when delegating execution:

1. This runbook file (`docs/NURSING-HOME-CCN-EXACT-MERGE.md`).
2. Processed CMS CSV (`data/cms/processed/nursing-homes-processed.csv`).
3. Script command list:
   - `pnpm tsx scripts/process-cms-data.ts`
   - `pnpm tsx scripts/generate-nursing-home-merge-plan.ts`
   - `pnpm tsx scripts/run-nursing-home-exact-merge.ts`
   - `pnpm tsx scripts/import-resources-simple.ts data/cms/processed/nursing-homes-marked-to-delete.csv --provider-type=nursing_home`
   - `pnpm tsx scripts/geocode-facilities.ts --provider-type=nursing_home --missing-only`
4. Output CSVs for review before import.
5. QA checklist above for sign-off.

Keep all command outputs (`tee` into logs) for auditable history, especially when performing deletes or imports.

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-10-11 | Initial exact-match merge plan documented | Codex |

---

Questions or issues? Tag Codex in `#data-pipeline` before running destructive steps.
