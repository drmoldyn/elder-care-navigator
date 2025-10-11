# Facility Identifiers Crosswalk

**Status:** Phase 4 Implementation Complete
**Last Updated:** 2025-10-10

## Overview

The Facility Identifiers Crosswalk is a foundational infrastructure component that enables linking facilities across different data sources using multiple identifier types. This system is critical for integrating CMS data, state licensing databases, and third-party datasets into unified facility profiles.

## Table of Contents

- [Architecture](#architecture)
- [Identifier Types](#identifier-types)
- [Database Schema](#database-schema)
- [Confidence Scoring System](#confidence-scoring-system)
- [Usage Guide](#usage-guide)
- [Adding New Identifiers](#adding-new-identifiers)
- [Lookup Functions](#lookup-functions)
- [Duplicate Resolution](#duplicate-resolution)
- [Data Quality & Verification](#data-quality--verification)
- [ETL Integration](#etl-integration)
- [Troubleshooting](#troubleshooting)

---

## Architecture

The crosswalk system consists of:

1. **Database Table:** `facility_identifiers` - Central table storing all identifier mappings
2. **Helper Library:** `scripts/lib/identifier-lookup.ts` - TypeScript functions for lookups and management
3. **Population Script:** `scripts/populate-identifiers.ts` - Initial data population from existing resources
4. **Verification Script:** `scripts/verify-identifiers.ts` - Data quality checks and reporting

### Design Philosophy

- **One facility, many identifiers:** Each resource can have multiple identifiers (CCN, NPI, state license, etc.)
- **Source tracking:** All identifiers track their data source for audit trails
- **Confidence scoring:** Support for fuzzy matching with confidence levels (0.0 to 1.0)
- **State-aware:** State-specific identifiers (like licenses) are scoped to their state
- **Verification support:** Manual verification tracking for high-value matches

---

## Identifier Types

### CCN (CMS Certification Number)
- **Used by:** Nursing homes, home health agencies, hospice providers
- **Format:** 6-digit number (e.g., "123456")
- **Scope:** National
- **Source:** Centers for Medicare & Medicaid Services (CMS)
- **Uniqueness:** One CCN per facility

### NPI (National Provider Identifier)
- **Used by:** All Medicare/Medicaid providers
- **Format:** 10-digit number (e.g., "1234567890")
- **Scope:** National
- **Source:** National Plan and Provider Enumeration System (NPPES)
- **Uniqueness:** One NPI per provider organization

### STATE_LICENSE
- **Used by:** Assisted living facilities, state-regulated providers
- **Format:** Varies by state (e.g., "ALF-123456", "FL12345")
- **Scope:** State-specific
- **Source:** State health departments or licensing boards
- **Uniqueness:** One license per facility per state

### MEDICARE_ID
- **Used by:** Medicare providers (when different from CCN)
- **Format:** Varies
- **Scope:** National
- **Source:** CMS
- **Uniqueness:** One ID per provider

### MEDICAID_ID
- **Used by:** Medicaid providers
- **Format:** Varies by state
- **Scope:** State-specific
- **Source:** State Medicaid agencies
- **Uniqueness:** One ID per provider per state

---

## Database Schema

### Table: `facility_identifiers`

```sql
CREATE TABLE facility_identifiers (
  id uuid PRIMARY KEY,
  resource_id uuid REFERENCES resources(id),
  identifier_type text,  -- CCN, NPI, STATE_LICENSE, MEDICARE_ID, MEDICAID_ID
  identifier_value text,
  state text,            -- 2-letter code, NULL for national IDs
  source text,           -- CMS, STATE_LICENSING, MANUAL, IMPORT, API
  confidence_score numeric(3, 2),  -- 0.0 to 1.0
  verified_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);
```

### Indexes

- **Unique index:** `(identifier_type, identifier_value, COALESCE(state, ''))`
  - Prevents duplicate identifiers within the same state
  - Allows same license number in different states

- **Lookup index:** `(identifier_type, identifier_value)`
  - Fast lookups by identifier

- **Resource index:** `(resource_id)`
  - Quick retrieval of all identifiers for a facility

### Views

#### `view_facility_identifier_summary`

Aggregated view showing identifier usage and potential duplicates:

```sql
SELECT
  identifier_type,
  identifier_value,
  state,
  COUNT(DISTINCT resource_id) as resource_count,
  array_agg(DISTINCT resource_id) as resource_ids,
  array_agg(DISTINCT facility_names) as facility_names,
  MIN(confidence_score) as min_confidence,
  MAX(confidence_score) as max_confidence
FROM facility_identifiers
GROUP BY identifier_type, identifier_value, state;
```

---

## Confidence Scoring System

Confidence scores indicate the reliability of an identifier match:

### Score Ranges

| Score | Category | Description | Use Case |
|-------|----------|-------------|----------|
| 1.0 | Perfect | Exact match from authoritative source | CMS-provided CCN/NPI |
| 0.9-0.99 | High | Strong match with minor uncertainty | Name + address + city match |
| 0.7-0.89 | Medium | Probable match requiring review | Fuzzy name match + ZIP |
| <0.7 | Low | Weak match, manual verification needed | Address-only match |

### Setting Confidence Scores

```typescript
// Exact match from CMS data
await addIdentifier({
  resourceId: 'abc-123',
  type: 'CCN',
  value: '123456',
  source: 'CMS',
  confidence: 1.0
});

// Fuzzy match from state data
await addIdentifier({
  resourceId: 'def-456',
  type: 'STATE_LICENSE',
  value: 'ALF-789',
  source: 'STATE_LICENSING',
  state: 'FL',
  confidence: 0.85  // Good match but not perfect
});
```

### Best Practices

1. **Use 1.0 for authoritative matches:** CMS data linking CCN to NPI
2. **Use 0.9+ for high-quality fuzzy matches:** Name + full address
3. **Use 0.7-0.89 for probable matches:** Name + city + state
4. **Use <0.7 for uncertain matches:** Require manual verification
5. **Verify low-confidence matches:** Update `verified_at` after manual review

---

## Usage Guide

### Basic Workflow

1. **Initial Population:** Run once to extract existing CCN/NPI data
2. **Ongoing Integration:** Use lookup functions in ETL scripts
3. **Quality Monitoring:** Run verification regularly
4. **Duplicate Resolution:** Investigate and resolve conflicts

### Initial Setup

```bash
# 1. Apply database migration
pnpm tsx scripts/apply-migration.ts supabase/migrations/0012_facility_identifiers.sql

# 2. Populate identifiers from existing resources
pnpm tsx scripts/populate-identifiers.ts

# 3. Verify data quality
pnpm tsx scripts/verify-identifiers.ts
```

---

## Adding New Identifiers

### Via TypeScript Code

```typescript
import { addIdentifier } from './scripts/lib/identifier-lookup';

// Add a state license
await addIdentifier({
  resourceId: 'abc-123',
  type: 'STATE_LICENSE',
  value: 'ALF-456789',
  source: 'STATE_LICENSING',
  state: 'CA',
  confidence: 1.0
});

// Add an NPI
await addIdentifier({
  resourceId: 'abc-123',
  type: 'NPI',
  value: '1234567890',
  source: 'IMPORT',
  confidence: 1.0
});
```

### Via SQL

```sql
INSERT INTO facility_identifiers (
  resource_id,
  identifier_type,
  identifier_value,
  state,
  source,
  confidence_score
) VALUES (
  'abc-123-uuid',
  'STATE_LICENSE',
  'ALF-456789',
  'CA',
  'STATE_LICENSING',
  1.0
);
```

### In ETL Scripts

```typescript
import { linkResources, addIdentifier } from './lib/identifier-lookup';

// Try to find existing resource
const resource = await linkResources([
  { type: 'CCN', value: row.ccn },
  { type: 'STATE_LICENSE', value: row.license, state: row.state }
]);

if (resource) {
  // Update existing resource
  console.log(`Found existing facility: ${resource.title}`);
} else {
  // Create new resource
  const newResource = await createResource(row);

  // Add identifiers
  if (row.ccn) {
    await addIdentifier({
      resourceId: newResource.id,
      type: 'CCN',
      value: row.ccn,
      source: 'CMS',
      confidence: 1.0
    });
  }

  if (row.license) {
    await addIdentifier({
      resourceId: newResource.id,
      type: 'STATE_LICENSE',
      value: row.license,
      source: 'STATE_LICENSING',
      state: row.state,
      confidence: 1.0
    });
  }
}
```

---

## Lookup Functions

### Find by CCN

```typescript
import { findResourceByCCN } from './scripts/lib/identifier-lookup';

const resource = await findResourceByCCN('123456');
if (resource) {
  console.log(`Found: ${resource.title}`);
}
```

### Find by NPI

```typescript
import { findResourceByNPI } from './scripts/lib/identifier-lookup';

const resource = await findResourceByNPI('1234567890');
```

### Find by State License

```typescript
import { findResourceByStateLicense } from './scripts/lib/identifier-lookup';

const resource = await findResourceByStateLicense('CA', 'ALF-456789');
```

### Multi-Identifier Lookup (Priority-Based)

```typescript
import { linkResources } from './scripts/lib/identifier-lookup';

// Try multiple identifiers in order of preference
const resource = await linkResources([
  { type: 'CCN', value: '123456' },           // Try CCN first
  { type: 'NPI', value: '1234567890' },       // Then NPI
  { type: 'STATE_LICENSE', value: 'ALF-789', state: 'FL' }  // Finally state license
]);
```

### Get All Identifiers for a Resource

```typescript
import { getResourceIdentifiers } from './scripts/lib/identifier-lookup';

const identifiers = await getResourceIdentifiers('abc-123-uuid');
console.log(`This facility has ${identifiers.length} identifiers:`);
identifiers.forEach(id => {
  console.log(`  ${id.identifier_type}: ${id.identifier_value}`);
});
```

---

## Duplicate Resolution

### Types of Duplicates

1. **Legitimate Duplicates:** Multi-location chains with same corporate NPI
2. **Data Errors:** Same facility imported twice from different sources
3. **Merged Facilities:** Facilities that have changed ownership/CCN
4. **ID Reuse:** Old CCN/license reassigned to new facility

### Finding Duplicates

```bash
# Run verification script
pnpm tsx scripts/verify-identifiers.ts
```

Or via code:

```typescript
import { findDuplicateIdentifiers } from './scripts/lib/identifier-lookup';

const duplicates = await findDuplicateIdentifiers();
duplicates.forEach(dup => {
  console.log(`${dup.identifier_type} ${dup.identifier_value} → ${dup.resource_count} resources`);
});
```

### Resolution Process

1. **Investigate:** Review facility details to determine the cause
2. **Verify:** Check authoritative sources (CMS, state databases)
3. **Decide:**
   - **Keep both:** If legitimately different facilities
   - **Merge:** If duplicate entries for same facility
   - **Remove:** If one is obsolete or incorrect

4. **Update:**
   ```sql
   -- Remove incorrect identifier
   DELETE FROM facility_identifiers WHERE id = 'bad-id-uuid';

   -- Or update resource_id to merge
   UPDATE facility_identifiers
   SET resource_id = 'correct-resource-uuid'
   WHERE id = 'identifier-uuid';
   ```

5. **Document:** Add notes to facility record about the resolution

---

## Data Quality & Verification

### Running Verification

```bash
pnpm tsx scripts/verify-identifiers.ts
```

### Verification Report Contents

1. **Identifier Statistics**
   - Total count
   - Breakdown by type (CCN, NPI, etc.)
   - Breakdown by source (CMS, STATE_LICENSING, etc.)
   - Verification status

2. **Resource Coverage**
   - Resources with identifiers
   - Resources without identifiers
   - Average identifiers per resource

3. **Confidence Score Distribution**
   - Perfect matches (1.0)
   - High confidence (0.9-0.99)
   - Medium confidence (0.7-0.89)
   - Low confidence (<0.7)

4. **Potential Duplicates**
   - Identifiers linked to multiple resources
   - Facility names for review

5. **Geographic Distribution**
   - Top states by identifier count

### Quality Metrics

| Metric | Target | Action if Below Target |
|--------|--------|------------------------|
| Resources with identifiers | >95% | Investigate missing identifiers |
| Perfect confidence scores | >90% | Review fuzzy matches |
| Duplicate identifiers | <1% | Investigate and resolve |
| Verified low-confidence | 100% | Manual verification process |

### Manual Verification

```typescript
import { verifyIdentifier } from './scripts/lib/identifier-lookup';

// After manual review, mark as verified
await verifyIdentifier('identifier-uuid');
```

---

## ETL Integration

### Pattern 1: Lookup-First Import

```typescript
// Best for: Updating existing facilities with new data

const ccn = row['CCN'];
const resource = await findResourceByCCN(ccn);

if (resource) {
  // Update existing resource
  await supabase
    .from('resources')
    .update({
      quality_rating: row['Overall Rating'],
      total_beds: row['Bed Count']
    })
    .eq('id', resource.id);
} else {
  console.log(`CCN ${ccn} not found - creating new resource`);
  // Create new resource and add identifier
}
```

### Pattern 2: Multi-Source Linking

```typescript
// Best for: Merging data from multiple sources

const resource = await linkResources([
  { type: 'CCN', value: row.ccn },
  { type: 'STATE_LICENSE', value: row.state_license, state: row.state },
  { type: 'NPI', value: row.npi }
]);

if (!resource) {
  // No existing resource found - create new one
  const newResource = await createResource(row);

  // Add all available identifiers
  if (row.ccn) await addIdentifier({ ... });
  if (row.state_license) await addIdentifier({ ... });
  if (row.npi) await addIdentifier({ ... });
}
```

### Pattern 3: Fuzzy Matching with Confidence

```typescript
// Best for: State data without CMS identifiers

// Try exact match first
let resource = await findResourceByStateLicense(state, license);

if (!resource) {
  // Try fuzzy matching on name + address
  resource = await fuzzyMatchFacility({
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state
  });

  if (resource && resource.matchScore > 0.7) {
    // Add identifier with confidence score
    await addIdentifier({
      resourceId: resource.id,
      type: 'STATE_LICENSE',
      value: license,
      source: 'STATE_LICENSING',
      state: state,
      confidence: resource.matchScore
    });
  }
}
```

---

## Troubleshooting

### Issue: Duplicate Key Error on Insert

**Cause:** Attempting to add an identifier that already exists

**Solution:**
```typescript
try {
  await addIdentifier({ ... });
} catch (error) {
  if (error.message.includes('duplicate key')) {
    console.log('Identifier already exists, skipping');
  } else {
    throw error;
  }
}
```

### Issue: Resource Not Found by CCN

**Possible causes:**
1. CCN not yet in crosswalk table
2. CCN formatted incorrectly (extra spaces, leading zeros)
3. Resource deleted but identifier remains

**Investigation:**
```sql
-- Check if identifier exists
SELECT * FROM facility_identifiers
WHERE identifier_type = 'CCN'
AND identifier_value = '123456';

-- Check if resource still exists
SELECT r.* FROM resources r
JOIN facility_identifiers fi ON fi.resource_id = r.id
WHERE fi.identifier_value = '123456';
```

### Issue: Too Many Duplicates

**Cause:** Data imported multiple times or from overlapping sources

**Solution:**
1. Run verification script to identify duplicates
2. Review facility details to determine correct mapping
3. Delete or merge duplicates
4. Re-run population script with `TRUNCATE facility_identifiers` first

### Issue: Low Confidence Scores Not Being Verified

**Process:**
1. Export low-confidence matches for review
2. Manual verification by staff
3. Update verification status:
```typescript
await verifyIdentifier('identifier-uuid');
```

---

## Future Enhancements

### Planned Features

1. **Temporal Tracking:** Track identifier changes over time (facility ID transfers, mergers)
2. **Relationship Mapping:** Parent-child relationships (corporate chains, multi-location)
3. **External API Integration:** Real-time validation against CMS and state databases
4. **Automated Fuzzy Matching:** ML-based matching for state data without CMS IDs
5. **Audit Logging:** Detailed change history for compliance

### Migration Path for ID Changes

```typescript
// Future: Track historical identifiers
interface HistoricalIdentifier {
  identifier_value: string;
  valid_from: Date;
  valid_to: Date | null;
  reason: 'MERGER' | 'TRANSFER' | 'REISSUE' | 'CORRECTION';
}
```

---

## References

- [CMS Provider Data Catalog](https://data.cms.gov/provider-data/)
- [NPPES NPI Registry](https://npiregistry.cms.hhs.gov/)
- [Data Acquisition Plan](./data-acquisition-plan.md)
- [Database Schema Documentation](./SUPABASE_SETUP_INSTRUCTIONS.md)

---

## Support

For issues or questions:
1. Check this documentation
2. Run verification script for diagnostics
3. Review database schema and indexes
4. Consult data acquisition plan for context

**Document Version:** 1.0
**Last Reviewed:** 2025-10-10
