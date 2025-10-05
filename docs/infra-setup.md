# Infrastructure Setup Guide

## Overview
This document details the infrastructure setup for **Elder Care Navigator**, including Supabase configuration, database migration, environment variables, and Vercel deployment.

---

## Supabase Project Setup

> **Status:** Awaiting manual provisioning (2025-10-04)
> **Quick Start Guide:** See [SUPABASE_SETUP_INSTRUCTIONS.md](./SUPABASE_SETUP_INSTRUCTIONS.md) for step-by-step browser setup

### 1. Create Supabase Project

1. Visit [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Configure your project:
   - **Name:** `elder-care-navigator` (or your preferred name)
   - **Database Password:** Generate a strong password and save it securely
   - **Region:** Choose closest to your target users
   - **Pricing Plan:** Free tier is sufficient for MVP
4. Wait for project provisioning (~2 minutes)

### 2. Enable pgcrypto Extension

The `pgcrypto` extension is required for email encryption (privacy protection) and UUID generation.

**Via Supabase Dashboard:**
1. Navigate to **Database** → **Extensions**
2. Search for `pgcrypto`
3. Click **Enable**

**Via SQL Editor:**
```sql
create extension if not exists "pgcrypto" with schema public;
```

### 3. Run Database Migration

Our schema is stored in `supabase/migrations/0001_init.sql` and includes:
- `resources` table (catalog of elder care resources)
- `user_sessions` table (anonymous navigator submissions)
- `leads` table (service provider routing)
- `resource_feedback` table (community validation)
- Full-text search indexes and performance optimizations

**Option A: Using Supabase Dashboard**
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/0001_init.sql`
3. Paste into the SQL Editor
4. Click **Run**
5. Verify success: Check **Table Editor** to confirm all 4 tables exist

**Option B: Using Supabase CLI (Recommended)**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (get project ref from dashboard URL)
supabase link --project-ref your-project-ref

# Push migration to remote database
supabase db push

# Verify schema
supabase db diff
```

### 4. Verify Schema

Check that all tables and indexes were created:

```sql
-- List all tables
select table_name from information_schema.tables
where table_schema = 'public';

-- Expected output:
-- resources
-- user_sessions
-- leads
-- resource_feedback

-- Verify indexes on resources table
select indexname from pg_indexes
where tablename = 'resources';

-- Expected: idx_resources_category, idx_resources_conditions, etc.
```

---

## Environment Variables

### Required Environment Variables

Create a `.env.local` file in your project root using `.env.example` as a template:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Anthropic Claude API
CLAUDE_API_KEY=sk-ant-...

# Email Service (Resend)
RESEND_API_KEY=re_...
```

### Where to Find Supabase Keys

1. Go to your Supabase project dashboard
2. Click **Settings** → **API**
3. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep secret!**

### Where to Find Other API Keys

**Claude API:**
- Sign up at [console.anthropic.com](https://console.anthropic.com)
- Navigate to **API Keys** → **Create Key**

**Resend (Email):**
- Sign up at [resend.com](https://resend.com)
- Navigate to **API Keys** → **Create API Key**

---

## Security Configuration (Optional but Recommended)

### Row Level Security (RLS)

RLS policies are **TBD** for MVP but recommended for production. Here's the planned approach:

**For `resources` table:**
```sql
-- Enable RLS
alter table resources enable row level security;

-- All users can read resources
create policy "Resources are publicly readable"
  on resources for select
  using (true);

-- Only service role can modify (admin-only)
create policy "Only admins can modify resources"
  on resources for all
  using (auth.jwt() ->> 'role' = 'service_role');
```

**For `user_sessions` table:**
```sql
-- Enable RLS
alter table user_sessions enable row level security;

-- Anonymous users can insert their own sessions
create policy "Anyone can create sessions"
  on user_sessions for insert
  with check (true);

-- Users can only read their own sessions (via session ID in URL)
create policy "Users can read own session"
  on user_sessions for select
  using (id::text = current_setting('request.jwt.claims', true)::json->>'session_id');
```

⚠️ **Note:** RLS implementation is deferred to post-MVP. For now, API routes enforce access control.

### Data Retention Policy

To comply with privacy best practices, implement automatic session purging:

**Option 1: Supabase Edge Function (Recommended)**
```sql
-- Create purge function
create or replace function purge_old_sessions()
returns void as $$
begin
  delete from user_sessions
  where created_at < now() - interval '60 days';
end;
$$ language plpgsql;

-- Schedule daily execution via pg_cron (requires Supabase Pro)
-- Or trigger manually/via Edge Function
```

**Option 2: Manual Cron Job**
```bash
# Add to your deployment CI/CD or serverless cron
# Call API route that executes the purge function
```

**Recommended Steps:**
1. Document the 60-day retention policy in your Privacy Policy
2. Implement purge function now (even if not automated)
3. Upgrade to scheduled execution post-launch

---

## Vercel Deployment

> **Status:** Awaiting manual provisioning (2025-10-04)
> **Prerequisite:** Supabase project must be created first to obtain environment variable values

### 1. Create Vercel Project

1. Install Vercel CLI (optional but helpful):
   ```bash
   npm install -g vercel
   ```

2. **Via Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click **Add New** → **Project**
   - Import your Git repository
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)

3. **Configure Build Settings:**
   - Build Command: `pnpm build` (or `npm run build`)
   - Output Directory: `.next` (default)
   - Install Command: `pnpm install` (or leave default)

### 2. Configure Environment Variables in Vercel

Go to **Project Settings** → **Environment Variables** and add:

| Variable Name                     | Value                          | Environment         |
|-----------------------------------|--------------------------------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | `https://your-project.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | `eyJhbGc...` (anon key)        | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY`       | `eyJhbGc...` (service role)    | Production, Preview |
| `CLAUDE_API_KEY`                  | `sk-ant-...`                   | Production, Preview |
| `RESEND_API_KEY`                  | `re_...`                       | Production, Preview |

⚠️ **Security Note:**
- Never commit `.env.local` to Git (already in `.gitignore`)
- Use Vercel's encrypted environment variables for secrets
- Service role key should **only** be used server-side

### 3. First Deploy Checklist

Before triggering your first production deployment:

- [ ] Database migration applied to Supabase
- [ ] All environment variables configured in Vercel
- [ ] `.env.example` committed to repo (without actual values)
- [ ] Build succeeds locally (`pnpm build`)
- [ ] No TypeScript errors (`pnpm type-check` if available)
- [ ] Linter passes (`pnpm lint`)

**Deploy:**
```bash
# Via CLI
vercel --prod

# Or via Git
git push origin main  # Auto-deploys if connected to Vercel
```

### 4. Verify Deployment

After deployment:
1. Visit your deployment URL (e.g., `elder-care-navigator.vercel.app`)
2. Check Vercel **Deployments** tab for build logs
3. Test basic functionality:
   - Homepage loads
   - No console errors (check browser DevTools)
   - Supabase connection works (test a simple query if applicable)

---

## Local Development Verification

Before pushing to Vercel, verify everything works locally:

### 1. Install Dependencies
```bash
pnpm install
# or: npm install / yarn install
```

### 2. Set Up Environment
```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your actual keys
```

### 3. Run Development Server
```bash
pnpm dev
# or: npm run dev

# Server runs at http://localhost:3000
```

### 4. Run Linter
```bash
pnpm lint
# Fix auto-fixable issues:
pnpm lint --fix
```

### 5. Type Check (if configured)
```bash
pnpm type-check
# or: npx tsc --noEmit
```

### 6. Test Supabase Connection

Create a simple test page (`src/app/test-db/page.tsx`):
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resources')
    .select('count')
    .single()

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return <div>Database connected! Resources count: {data?.count || 0}</div>
}
```

Visit `http://localhost:3000/test-db` to verify.

---

## Troubleshooting

### Common Issues

**1. "Invalid API key" errors**
- Double-check that environment variables are set correctly
- Restart dev server after changing `.env.local`
- In Vercel, redeploy after updating environment variables

**2. Database connection fails**
- Verify `NEXT_PUBLIC_SUPABASE_URL` matches your project URL exactly
- Check that Supabase project is not paused (free tier auto-pauses after inactivity)
- Confirm migration was applied successfully

**3. "relation 'resources' does not exist"**
- Migration wasn't run or failed
- Re-run `supabase db push` or apply SQL manually via dashboard

**4. Vercel build fails**
- Check build logs in Vercel dashboard
- Ensure all environment variables are set for the correct environment
- Test `pnpm build` locally to reproduce the error

**5. Email encryption not working**
- Verify `pgcrypto` extension is enabled
- Check that the migration including encryption functions ran successfully

---

## Performance Optimization Checklist

Post-deployment optimizations:

- [ ] Enable Supabase connection pooling (automatic for most queries)
- [ ] Add caching headers to API routes (resources, guidance)
- [ ] Monitor query performance via Supabase dashboard
- [ ] Set up Vercel Analytics to track page load times
- [ ] Implement ISR (Incremental Static Regeneration) for static pages
- [ ] Optimize images using Next.js `<Image>` component
- [ ] Enable Vercel Edge Functions for low-latency API routes (optional)

---

## Monitoring & Observability

### Supabase Monitoring

**Dashboard Metrics:**
- Database size and query performance
- API request count and latency
- Active connections
- Error logs

**Access:**
- Go to **Reports** in Supabase dashboard
- Set up log drains for production (Supabase Pro feature)

### Vercel Analytics

**Enable Analytics:**
1. Go to **Project Settings** → **Analytics**
2. Enable **Web Analytics** (free)
3. Optionally enable **Speed Insights** for performance monitoring

**Custom Instrumentation:**
```typescript
// Track custom events (e.g., form completions)
import { track } from '@vercel/analytics'

track('navigator_completed', {
  urgency: sessionData.urgency_factors,
  resourcesMatched: matchedResources.length,
})
```

---

## Backup & Recovery

### Automated Backups

Supabase provides daily automated backups on paid plans. For MVP (free tier):

- **Point-in-time recovery:** Not available on free tier
- **Manual exports:** Use Supabase dashboard or `pg_dump` regularly

### Manual Backup Script

```bash
# Export database schema + data
pg_dump -h db.your-project-ref.supabase.co \
  -U postgres \
  -d postgres \
  --no-owner \
  --no-acl \
  -f backup-$(date +%Y%m%d).sql
```

**Recommended Cadence:** Weekly manual backups during MVP, then upgrade to Supabase Pro for automated backups.

---

## Next Steps

Once infrastructure is set up:

1. **Seed Resources:** Use CSV importer (see `docs/architecture.md`)
2. **Test Navigator Flow:** Submit a test session via the form
3. **Verify Email Delivery:** Confirm Resend integration works
4. **Monitor Logs:** Watch Supabase and Vercel logs during initial traffic
5. **Review Security:** Implement RLS policies before handling sensitive data at scale

---

**Last Updated:** 2025-10-04
**Status:** Production-ready for MVP
