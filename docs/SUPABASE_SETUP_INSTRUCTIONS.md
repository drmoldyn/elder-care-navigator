# Supabase Setup Instructions
**Elder Care Navigator - Infrastructure Provisioning**

---

## Quick Setup (8 minutes total)

### Step 1: Create Supabase Project (2 minutes)

1. Visit https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Organization:** (select existing or create new)
   - **Name:** `elder-care-navigator`
   - **Database Password:** Generate a strong password (save it securely - you'll need it for direct DB access)
   - **Region:** Choose closest to your users (any region works for MVP)
   - **Pricing Plan:** Free
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

---

### Step 2: Enable pgcrypto Extension (30 seconds)

**Option A - Via Dashboard (Recommended):**
1. Navigate to **Database** → **Extensions** (left sidebar)
2. Search for `pgcrypto`
3. Click **Enable** toggle

**Option B - Via SQL Editor:**
1. Go to **SQL Editor** (left sidebar)
2. Paste: `create extension if not exists "pgcrypto" with schema public;`
3. Click **Run** (or press Cmd/Ctrl + Enter)

---

### Step 3: Run Database Migration (1 minute)

1. Stay in **SQL Editor** (or navigate there)
2. Open the file `supabase/migrations/0001_init.sql` from your project
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **Run** (bottom right)
6. Verify success: You should see "Success. No rows returned"

**What this creates:**
- `resources` table (150 elder care resources catalog)
- `user_sessions` table (anonymous navigator submissions)
- `leads` table (service provider routing)
- `resource_feedback` table (community validation)
- All indexes for performance (GIN indexes for arrays, full-text search)

---

### Step 4: Verify Schema (30 seconds)

1. Go to **Table Editor** (left sidebar)
2. You should see 4 tables listed:
   - ✓ `resources`
   - ✓ `user_sessions`
   - ✓ `leads`
   - ✓ `resource_feedback`

If any are missing, re-run the migration SQL from Step 3.

---

### Step 5: Copy API Keys (1 minute)

1. Go to **Settings** → **API** (left sidebar)
2. Copy the following values:

**Project URL:**
```
https://[your-project-ref].supabase.co
```

**anon public key** (starts with `eyJhbGc...`):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**service_role key** (starts with `eyJhbGc...`):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT:**
- The `service_role` key has admin privileges - NEVER commit it to Git or expose it client-side
- Only use it in server-side API routes
- The `anon` key is safe to expose publicly (it's prefixed with `NEXT_PUBLIC_`)

---

### Step 6: Provide Keys to Claude Code

Share back in this format (obfuscate middle characters for security):

```
Project URL: https://abc...xyz.supabase.co
Anon Key: eyJhbGc...xyz
Service Role Key: eyJhbGc...xyz
```

Claude Code will then:
- Create `.env.local` for local development
- Configure Vercel environment variables
- Complete the deployment pipeline

---

## Troubleshooting

**"Extension pgcrypto already exists"**
- This is fine - it means it was enabled automatically or in a previous step

**"Relation 'resources' already exists"**
- Migration was already run. Check Table Editor to verify all 4 tables exist
- If schema looks correct, you're good to proceed

**Can't find API keys**
- Make sure you're in the correct project (check project name in top left)
- Navigate to Settings (gear icon) → API section

**Migration fails with syntax error**
- Make sure you copied the ENTIRE contents of `0001_init.sql`
- Check that no characters were corrupted during copy/paste

**Database password required but lost**
- You only need the password for direct database access (not for API keys)
- If needed later, you can reset it in Settings → Database

---

## Next Steps After Setup

Once you provide the API keys, Claude Code will:
1. Update `.env.local` and `.env.example` in the repo
2. Configure Vercel environment variables
3. Run first deployment
4. Update documentation with provisioning status
5. Mark Day 1 Supabase tasks as complete

---

**Estimated total time:** 5-8 minutes
**Status:** Awaiting manual provisioning via browser
