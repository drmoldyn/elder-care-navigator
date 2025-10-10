# Vercel Deployment Guide - Elder Care Navigator

## Status: Ready to Deploy ✅

All prerequisites are complete:
- ✅ Supabase database migrated with all tables
- ✅ Initial resources seeded (2 resources)
- ✅ Local development server tested (runs on port 3004)
- ✅ Code pushed to GitHub: https://github.com/drmoldyn/elder-care-navigator

---

## Deployment Steps

### 1. Create Vercel Project

Go to: https://vercel.com/new

1. Click **"Import Git Repository"**
2. Select: `drmoldyn/elder-care-navigator`
3. Configure project:
   - **Framework Preset**: Next.js
   - **Build Command**: `pnpm build --turbopack`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install`

### 2. Set Environment Variables

Before deploying, add these environment variables in Vercel:

**Project Settings → Environment Variables**

```bash
# Supabase Configuration
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Claude API (optional for now - will use fallback guidance)
# Get from: https://console.anthropic.com/settings/keys
CLAUDE_API_KEY=your_claude_api_key_or_leave_as_TODO_ADD_LATER

# Resend Email (optional for now)
# Get from: https://resend.com/api-keys
RESEND_API_KEY=your_resend_api_key_or_leave_as_TODO_ADD_LATER
```

**Important**:
- Set all variables to **Production, Preview, and Development** environments
- The `SUPABASE_SERVICE_ROLE_KEY` should only be in **Production and Preview** (NOT Development for security)

### 3. Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Once deployed, you'll get a URL like: `https://elder-care-navigator.vercel.app`

### 4. Verify Deployment

Test these URLs after deployment:

1. **Homepage**: `https://your-app.vercel.app`
   - Should show the roadmap-aligned hero

2. **Navigator**: `https://your-app.vercel.app/navigator`
   - Should show the relationship step form

3. **API Health Check**: Test `/api/match` endpoint
   - Make a POST request with sample session data
   - Should return matched resources

### 5. Test End-to-End Flow

1. Go to `/navigator`
2. Select a relationship
3. Continue through steps (currently only step 1 works)
4. Once complete form is built, submit should:
   - Call `/api/match`
   - Return 2 resources (from seed data)
   - Generate AI guidance (fallback for now)

---

## What's Working Now

✅ **Infrastructure**:
- Supabase database with all tables
- GitHub repository
- Environment variables configured

✅ **Backend APIs**:
- `/api/match` - Matching algorithm + session creation
- `/api/guidance/:sessionId` - AI guidance (with fallback)

✅ **Frontend**:
- Homepage with roadmap content
- Navigator step 1 (relationship selection)

---

## What's Still TODO

### High Priority (Week 1)
- [ ] Complete navigator steps 2-6 (conditions, location, living_situation, urgency, review)
- [ ] Build results page (`/results/[sessionId]`)
- [ ] Wire up form submission to `/api/match`
- [ ] Add Claude API key for real AI guidance
- [ ] Add Resend API key for email delivery

### Medium Priority (Week 2)
- [ ] Seed more resources (target: 150+)
- [ ] Add click tracking
- [ ] Email capture form
- [ ] Lead submission flow

### Low Priority (Week 3+)
- [ ] PDF export
- [ ] Affiliate tracking
- [ ] Analytics dashboard

---

## Environment Variables Checklist

Before deploying, ensure you have:

- [x] `NEXT_PUBLIC_SUPABASE_URL` - ✅ Set
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - ✅ Set
- [x] `SUPABASE_SERVICE_ROLE_KEY` - ✅ Set
- [ ] `CLAUDE_API_KEY` - ⏳ TODO (using fallback for now)
- [ ] `RESEND_API_KEY` - ⏳ TODO (email disabled for now)

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure `pnpm` is detected (should auto-detect from `pnpm-lock.yaml`)
- Verify all imports are correct

### Runtime Errors
- Check Function logs in Vercel dashboard
- Verify environment variables are set correctly
- Test API routes individually

### Database Connection Issues
- Verify Supabase credentials
- Check that tables exist via Supabase dashboard
- Test connection locally first

---

## Quick Deploy Command

If using Vercel CLI:

```bash
vercel --prod
```

Make sure to set environment variables first via dashboard or:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

---

## Next Steps After Deployment

1. **Share the URL** with stakeholders for initial feedback
2. **Monitor Function logs** for any runtime errors
3. **Continue building** the remaining navigator steps
4. **Seed more resources** to improve matching quality
5. **Get Claude API key** for production AI guidance

---

**Repository**: https://github.com/drmoldyn/elder-care-navigator
**Latest Commit**: `8aa262a` (migration fixes + seeding)
