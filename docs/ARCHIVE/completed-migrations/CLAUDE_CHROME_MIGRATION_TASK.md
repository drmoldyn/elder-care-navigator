# Claude Chrome - Supabase Migration Verification Task

## Context
You previously helped set up the Supabase project for Elder Care Navigator. The database tables were created, but we're encountering errors when trying to insert data - columns that should exist are not being found. We need to verify the migration ran correctly and fix any issues.

## Current Status
- ✅ Supabase project created: `elder-care-navigator` (ID: cxadvvjhouprybyvryyd)
- ✅ Project URL: https://cxadvvjhouprybyvryyd.supabase.co
- ✅ Tables exist: `resources`, `user_sessions`, `leads`, `resource_feedback`
- ❌ **Problem**: Attempting to insert data into `resources` table fails with errors like:
  - "Could not find the 'audience' column"
  - "Could not find the 'affiliate_network' column"

This suggests the migration SQL may not have run completely or correctly.

---

## Task 1: Verify Current Table Schema

### Steps:
1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql/new

2. **Run this query** to see what columns currently exist in the `resources` table:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'resources'
ORDER BY ordinal_position;
```

3. **Copy the entire results** and report back with:
   - How many columns exist
   - List of all column names
   - Any obvious missing columns compared to the expected schema below

---

## Task 2: Run Complete Migration (If Needed)

If the schema is incomplete or missing columns, **run this complete migration SQL**:

### Migration SQL to Run:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- Drop existing resources table if it's incomplete
DROP TABLE IF EXISTS resource_feedback CASCADE;
DROP TABLE IF EXISTS resources CASCADE;

-- Resources catalog (COMPLETE VERSION)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Core Info
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  best_for TEXT,

  -- Categorization
  category TEXT[] NOT NULL,
  conditions TEXT[] NOT NULL,
  urgency_level TEXT NOT NULL,

  -- Location
  location_type TEXT NOT NULL,
  states TEXT[],
  requires_zip BOOLEAN DEFAULT FALSE,

  -- Audience
  audience TEXT[] NOT NULL,
  living_situation TEXT[],

  -- Resource Details
  cost TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  hours_available TEXT,

  -- Monetization
  affiliate_url TEXT,
  affiliate_network TEXT,
  is_sponsored BOOLEAN DEFAULT FALSE,

  -- Metadata
  source_authority TEXT NOT NULL,
  last_verified TIMESTAMPTZ,
  click_count INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,

  -- Search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(best_for, ''))
  ) STORED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources USING gin (category);
CREATE INDEX IF NOT EXISTS idx_resources_conditions ON resources USING gin (conditions);
CREATE INDEX IF NOT EXISTS idx_resources_urgency ON resources (urgency_level);
CREATE INDEX IF NOT EXISTS idx_resources_location ON resources (location_type);
CREATE INDEX IF NOT EXISTS idx_resources_search ON resources USING gin (search_vector);

-- Recreate resource_feedback table
CREATE TABLE resource_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id),

  helpful BOOLEAN NOT NULL,
  comment TEXT,

  ip_hash TEXT,
  UNIQUE(resource_id, ip_hash)
);
```

### Instructions:
1. Copy the SQL above
2. Paste into SQL Editor
3. Click **"Run"**
4. Verify success (should show "Success. No rows returned")

---

## Task 3: Re-verify Schema

After running the migration (if needed), **run the verification query again**:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'resources'
ORDER BY ordinal_position;
```

**Expected columns** (32 total):
- id (uuid)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
- title (text)
- url (text)
- description (text)
- best_for (text)
- category (ARRAY)
- conditions (ARRAY)
- urgency_level (text)
- location_type (text)
- states (ARRAY)
- requires_zip (boolean)
- audience (ARRAY)
- living_situation (ARRAY)
- cost (text)
- contact_phone (text)
- contact_email (text)
- hours_available (text)
- affiliate_url (text)
- affiliate_network (text)
- is_sponsored (boolean)
- source_authority (text)
- last_verified (timestamp with time zone)
- click_count (integer)
- upvotes (integer)
- search_vector (tsvector)

---

## Task 4: Report Back

Once complete, provide:

1. **Verification query results** showing all column names
2. **Confirmation** that all 27+ columns exist (including `audience`, `affiliate_network`, `living_situation`, etc.)
3. **Any errors encountered** during the migration
4. **Screenshot** of the successful query result (optional but helpful)

---

## Why This Matters

The application code is trying to insert data with these exact column names. If the schema doesn't match, all resource imports will fail and the app won't work. Getting this right now will unblock:
- Seeding initial resources
- Testing the matching algorithm
- Testing the navigator flow
- Deploying to Vercel

---

## Questions?

If anything is unclear:
- The migration file location in the repo: `supabase/migrations/0001_init.sql`
- The GitHub repo: https://github.com/drmoldyn/elder-care-navigator
- All columns should be exactly as shown in the expected list above

**Priority**: HIGH - This is blocking all development progress.

---

**Once you complete this task and confirm all columns exist, the development team can proceed with seeding data and testing the application.**
