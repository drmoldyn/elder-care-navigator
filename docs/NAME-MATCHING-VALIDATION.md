# Name Matching Validation Strategy

**Date:** October 11, 2025
**Status:** ✅ Validation informs exact-match merge plan

---

## Problem Statement

We need to merge CCNs and quality metrics from the CMS CSV into existing records **without losing geocoding**. Because legacy records lack CCNs, we can only trust merges where we are 100% certain of the facility identity.

**Key constraints:**
- Legacy database entries contain geocoding but no CCN.
- Fresh CMS CSV contains CCN and quality data but no coordinates.
- Only facilities with an **exact match on both facility name AND street address** should be merged in-place.

## Risk Assessment Question

**Can we trust name-based matching?** Or will it misassign quality metrics to wrong facilities?

---

## Validation Approach

### Test Design

We created `/scripts/validate-name-matching.ts` to:

1. **Sample randomly** - Test 500 facilities from CSV (configurable)
2. **Match by name** - Use case-insensitive ILIKE matching (same as merge script)
3. **Cross-check location** - Verify city, state, and address match for accuracy
4. **Identify problems**:
   - Facilities that don't match at all
   - Multiple matches (ambiguous names)
   - Name matches but location differs (potential misassignment)

### Success Criteria

The validation script is now used to **identify the safe subset for an exact-match merge**:

- **Exact match on name + address ≥85%** (with the remainder mostly flagged as `ambiguous_db_duplicates`) → Proceed with the scripted merge for the matched subset.
- **Ambiguous or missing match** → Export to `nursing-homes-marked-to-delete.csv` for full re-import (geocoding happens later).
- **If exact matches fall below threshold or many `no_matching_resource` rows appear** → Halt and revisit normalization heuristics before merging.

---

## Running Validation

```bash
# Test with 500 random facilities
pnpm tsx scripts/validate-name-matching.ts 500

# Or test with different sample size
pnpm tsx scripts/validate-name-matching.ts 1000
```

---

## What the Script Reports

### 1. Name Matching Stats
- **Exact matches** - Name matches perfectly (case-sensitive)
- **Case-insensitive matches** - Name matches ignoring case
- **Multiple matches** - Name found multiple times (ambiguous)
- **No match** - Name not found in DB at all

### 2. Location Verification
For matched records, checks if location data aligns:
- **City match** - CSV city == DB city
- **State match** - CSV state == DB state
- **Address match** - CSV address == DB address

### 3. Potential Misassignments
Shows cases where:
- Name matched successfully
- BUT location data doesn't align
- **This indicates possible wrong facility assignment!**

### 4. Recommendation
Based on results, script recommends:
- ✅ Safe to proceed with merge
- ⚠️ Review mismatches first
- ❌ Re-import from scratch with CCN

---

## Decision Tree

```
┌─────────────────────────────────────┐
│ Run Validation (500 sample)         │
└────────────────┬────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Match Rate?   │
         └───────┬───────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
     ▼           ▼           ▼
  ≥95%        85-95%       <85%
     │           │           │
     ▼           ▼           ▼
┌────────┐  ┌────────┐  ┌──────────────┐
│Location│  │Location│  │  RE-IMPORT   │
│Errors? │  │Errors? │  │  FROM        │
└───┬────┘  └───┬────┘  │  SCRATCH     │
    │           │        │              │
  ≤2%  >2%    Any       │  Get CMS     │
    │     │      │        │  data with   │
    ▼     ▼      ▼        │  CCN         │
  ✅   ⚠️    ⚠️         └──────────────┘
 MERGE REVIEW REVIEW
  SAFE  FIRST  FIRST
```

---

## Updated Merge Strategy (October 11, 2025)

We are **no longer deleting and re-importing the entire nursing home dataset**. Instead, we:

1. **Identify exact matches** using normalized facility name + street address comparisons between Supabase and the processed CMS CSV.
2. **Merge CCN + quality metrics** into the matched records *in place* while preserving existing latitude/longitude.
3. **Export non-matching CMS rows** (no match or multiple conflicting matches) into `data/cms/processed/nursing-homes-marked-to-delete.csv` for subsequent fresh import + geocoding.
4. **Flag legacy DB records without a CMS counterpart** for manual review before removal.

### Why exact matching?
- Geocoding was expensive; preserving it requires absolute certainty that the record is the same facility.
- CCN is the ultimate identifier, but legacy rows lack it. Name + address is the strongest shared key we control.
- Once the matched subset is updated, the remaining facilities can be re-imported cleanly with CCN and geocoded later.

### Supporting scripts
- `scripts/validate-name-matching.ts` ⇒ quantifies exact matches vs. ambiguous cases.
- `scripts/generate-nursing-home-merge-plan.ts` (new) ⇒ produces:
  - `nursing-homes-exact-matches.csv` for safe in-place updates
  - `nursing-homes-marked-to-delete.csv` for full re-import
  - `nursing-homes-db-without-cms.csv` to review legacy records lacking CMS coverage
- `scripts/run-nursing-home-exact-merge.ts` (new) ⇒ applies CCN + quality metrics to the matched subset.

See `docs/NURSING-HOME-CCN-EXACT-MERGE.md` for the detailed runbook.

---

## Current Status

✅ **Validation feeds the merge plan** — rerun after adjusting normalization rules.

Check results with:
```bash
cat name-matching-validation.log
```

Or monitor progress:
```bash
tail -f name-matching-validation.log
```

---

## Next Steps (Pending Results)

### If Exact Match Rate ≥95%
1. ✅ Run `scripts/generate-nursing-home-merge-plan.ts`
2. ✅ Execute `scripts/run-nursing-home-exact-merge.ts`
3. ✅ Geocode any records inserted from `nursing-homes-marked-to-delete.csv` after import

### If Exact Match Rate <95%
1. ❌ **Do NOT run merge**
2. Investigate normalization (remove punctuation, handle abbreviations)
3. Rerun validation until confidence threshold met
5. Re-import fresh with CCN
6. Re-geocode (budget ~$85)

---

**Decision Point:** Wait for validation results before proceeding.
