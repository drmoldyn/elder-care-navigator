# Immediate Next Steps - Elder Care Navigator

## Current Status

✅ **Complete:**
- Navigator form (6 steps) with state management
- Results page with AI guidance polling
- Database schema (original)
- Enhanced schema migration ready (PostGIS, geolocation, insurance)
- Data pipeline infrastructure (download, process, geocode, import scripts)
- 90,000+ facilities available from CMS + GitHub datasets
- Monetization strategy documented
- Competitive strategy documented

🔄 **In Progress:**
- Database migration application
- Data import
- Results page showing actual resources

## Week 1: Core Infrastructure (THIS WEEK)

### Day 1: Database Migration & Data Import

**1. Apply Database Migration to Supabase**
```bash
# In Supabase Dashboard:
# 1. Database → Extensions → Enable "postgis"
# 2. SQL Editor → New Query
# 3. Copy/paste content from: supabase/migrations/0002_add_geolocation_and_medical_systems.sql
# 4. Run migration
```

**Expected outcome:**
- ✅ PostGIS extension enabled
- ✅ Resources table enhanced with geolocation, insurance, provider fields
- ✅ Medical systems table created
- ✅ Proximity relationship table created
- ✅ Spatial functions and indexes active

**2. Download CMS Data (5 minutes)**
```bash
./scripts/download-cms-data.sh
```

**Expected outcome:**
- ✅ 11,000+ home health agencies
- ✅ 15,000+ nursing homes
- ✅ 6,000+ hospice providers
- ✅ 6,000+ hospitals
- Files saved in `data/cms/`

**3. Process CMS Data (2 minutes)**
```bash
pnpm tsx scripts/process-cms-data.ts
```

**Expected outcome:**
- ✅ Data mapped to our schema
- ✅ Processed files in `data/cms/processed/`
- ✅ Ready for import (without geocoding initially for speed)

**4. Import Initial Dataset (10 minutes)**
```bash
# Import without geocoding first (fast track)
pnpm tsx scripts/import-resources-enhanced.ts data/cms/processed/home-health-processed.csv
pnpm tsx scripts/import-resources-enhanced.ts data/cms/processed/nursing-homes-processed.csv
pnpm tsx scripts/import-resources-enhanced.ts data/cms/processed/hospice-processed.csv
```

**Expected outcome:**
- ✅ 32,000+ resources in database
- ✅ Organized by insurance coverage (Medicare, Medicaid, etc.)
- ✅ Organized by state, city, ZIP code
- ⏳ Geocoding (run later in background)

### Day 2-3: Update UI to Display Resources

**1. Update Results Page (`src/app/results/[sessionId]/page.tsx`)**

**Current:** Shows only AI guidance, placeholder for resources

**New features needed:**
- Display actual matched resources from database
- Show insurance acceptance badges (Medicare, Medicaid, Private, VA)
- Display facility details (address, phone, rating, services)
- Group by provider type (nursing home, home health, etc.)
- Add "Contact Facility" CTA (email capture for lead gen)
- Show proximity to medical systems (once migration applied)

**Changes:**
```typescript
// Fetch matched resources from database
const { data: resources } = await supabase
  .from('resources')
  .select('*')
  .in('id', session.matched_resources);

// Display resource cards with:
// - Facility name, type, address
// - Insurance badges
// - Quality rating (CMS stars)
// - Contact CTA (email gate)
```

**2. Create Facility Detail Page (`src/app/facility/[id]/page.tsx`)**

**Features:**
- Full facility information (all fields from database)
- Map showing location
- Nearby medical systems (once proximity data available)
- Services and specialties
- Insurance acceptance details
- "Request Information" form (lead capture)
- "Call Now" button (click tracking)

**3. Add Resource Filtering to Navigator**

**Enhance search with:**
- Insurance type selector (Medicare, Medicaid, Private, VA)
- Provider type filter (nursing home, assisted living, home health, etc.)
- Quality rating filter (4+ stars)
- Distance radius (5, 10, 25, 50 miles from ZIP)

### Day 4-5: Lead Capture Infrastructure

**1. Create Lead Capture Flow**

**Email gate on:**
- "See contact information" button
- "Request tour" button
- "Download comparison PDF" button

**Implementation:**
```typescript
// Modal/form to capture email
// Store lead in database
// Send lead to facility (future: via email or API)
// Track conversion (facility reports back)
```

**2. Create Leads Table (if not exists)**

Already exists in schema:
```sql
CREATE TABLE leads (
  id uuid,
  session_id uuid,
  lead_type text,
  name text,
  email text,
  phone text,
  zip_code text,
  message text,
  urgency text,
  sent_to_provider text,
  status text
);
```

**3. Build Lead Tracking Dashboard (MVP)**

**Simple admin page:**
- List of leads captured
- Facility they're interested in
- Lead source (which search/page)
- Status (new, contacted, converted)

## Week 2: Content & SEO

### State Landing Pages (Auto-Generated)

**Create:** `src/app/[state]/page.tsx`

**Auto-generate 50 pages:**
- California Elder Care Resources
- Texas Nursing Homes & Assisted Living
- Florida Senior Care Facilities
- etc.

**Content from database:**
- "X facilities in [State]"
- "Insurance accepted: Medicare, Medicaid, Private, VA"
- Top cities with most facilities
- Link to search filtered by state

### Core Blog Posts (SEO)

**Write 20-30 articles targeting:**
1. "How to Choose a Nursing Home That Accepts Medicare"
2. "Assisted Living vs. Skilled Nursing: What's Covered by Insurance?"
3. "Finding Home Health Agencies Near Major Hospitals"
4. "Hospital Discharge Planning: 72-Hour Checklist"
5. "Medicare Coverage for Nursing Homes: Complete Guide"
6. "[State] Medicaid Long-Term Care Benefits"
7. "VA Benefits for Elder Care: What's Covered?"
8. "How to Find Elder Care Near Your Parent's Doctor"
9. "Cost of Nursing Home Care by State (2025)"
10. "Emergency Elder Care Placement: What to Do in 48 Hours"

**SEO optimization:**
- Target long-tail keywords (less competition)
- Link to search with pre-filled filters
- Include state-specific information
- Email capture via "Download Checklist" CTAs

### Crisis Mode Landing Page

**Create:** `/crisis` or `/hospital-discharge`

**Features:**
- "Parent being discharged in 72 hours?"
- Expedited search (filter by immediate availability + insurance)
- Emergency checklist
- "Call now" CTAs (not forms)
- Link to facilities known for fast admissions

## Week 3-4: Monetization Launch

### 1. Lead Generation Pilot

**Outreach to 50-100 facilities:**
- Email/call facilities in database
- Pitch: "We're sending families searching for [your services]"
- Offer: "First 5 leads free, then $75 per qualified lead"
- Track: Which facilities convert leads to residents

**Lead qualification criteria:**
- Email + phone provided
- Insurance matches facility
- Location within facility's service area
- Expressed interest (clicked contact/requested tour)

### 2. Sponsored Listings Package

**Tier 1: Featured Listing** ($200-300/month)
- "Featured" badge in search results
- Top 3 position in relevant searches
- Highlighted in comparison tools

**Tier 2: Premium Listing** ($400-500/month)
- Everything in Tier 1
- Priority in state landing pages
- Featured in blog post recommendations

### 3. Device Vendor Outreach

**Target 10-20 vendors:**
- Medical alert systems (Life Alert, Medical Guardian)
- Mobility devices (Invacare, Drive Medical)
- Home monitoring (Nest, Ring)
- Medication management (MedMinder, Hero)

**Ad packages:**
- Sidebar ads on search results ($300-500/month)
- Sponsored blog posts ($500-1,000/post)
- Comparison tool sponsorship ($800-1,500/month)

## Month 2: Scaling & Optimization

### 1. Geocoding (Background Process)

**Run overnight:**
```bash
# Geocode all facilities (takes ~11 hours for 38,000)
pnpm tsx scripts/geocode-addresses.ts \
  data/cms/processed/home-health-processed.csv \
  data/cms/geocoded/home-health-geocoded.csv

# Repeat for nursing homes, hospice
```

**Then re-import with proximity computation:**
```bash
pnpm tsx scripts/import-resources-enhanced.ts \
  data/cms/geocoded/home-health-geocoded.csv \
  --compute-proximity
```

### 2. Add Assisted Living Dataset

**Download GitHub dataset (44,000 facilities):**
```bash
curl -L https://raw.githubusercontent.com/antonstengel/assisted-living-data/main/assisted-living-facilities.csv \
  -o data/assisted-living.csv

# Process and import
pnpm tsx scripts/import-resources-enhanced.ts data/assisted-living.csv
```

**Total database:** 80,000+ facilities

### 3. Medical Systems Import

**Import hospitals to medical_systems table:**
```bash
# Process hospital data
# Import via SQL or custom script
# Compute proximity for all resources
```

### 4. Advanced Features

**Cost Calculator:**
- Input: Insurance type, care level, state
- Output: Estimated monthly cost
- Comparison: Facility vs. home care costs

**Facility Comparison Tool:**
- Select 3-5 facilities
- Side-by-side comparison
- Export as PDF (email gate)

**Checklist Generators:**
- "20 Questions to Ask on Tour"
- "Red Flags to Watch For"
- Downloadable (email capture)

## Month 3: Growth & Marketing

### 1. Paid Acquisition

**Google Ads ($5k-10k/month):**
- Target keywords:
  - "nursing home accepts Medicare"
  - "assisted living near [hospital]"
  - "home health agencies [city]"
- Goal: $3-5 cost per lead, sell for $75-150

**Facebook/Instagram:**
- Target adult children (45-65)
- Interests: Caregiving, AARP, senior living
- Creative: "Find elder care that accepts your insurance"

### 2. Partnership Outreach

**Hospital Discharge Planners:**
- Co-branded search tool
- Educational materials
- Track referrals

**Area Agencies on Aging (AAA):**
- Widget for their websites
- Resource referrals
- Data sharing agreements

**Senior Organizations:**
- AARP partnership exploration
- Senior center workshops
- Community events

### 3. Analytics & Optimization

**Track:**
- Search volume by insurance type
- Most searched locations
- Conversion rates by facility type
- Lead quality scores
- Revenue per visitor

**Optimize:**
- A/B test email capture flows
- Improve search relevance
- Refine lead qualification
- Adjust pricing based on conversion data

## Success Metrics

### Week 1 Targets
- ✅ 32,000+ resources in database
- ✅ Migration applied successfully
- ✅ Results page showing real resources
- ✅ Basic lead capture working

### Month 1 Targets
- 1,000+ searches performed
- 100+ email captures (10% conversion)
- 10+ leads sent to facilities
- $500-1,000 revenue (first leads)

### Month 3 Targets
- 10,000+ searches/month
- 1,500+ email captures
- 100+ leads/month
- $5,000-8,000 MRR

### Month 6 Targets
- 50,000+ searches/month
- 7,500+ email captures
- 500+ leads/month
- $25,000-40,000 MRR

## Technical Debt to Address

1. **Type safety:** Update types for new schema fields
2. **Validation:** Add Zod schemas for new resource fields
3. **Error handling:** Improve database error messages
4. **Performance:** Add caching for common searches
5. **Mobile:** Optimize UI for mobile devices
6. **Accessibility:** Ensure WCAG compliance

## Files to Update

### Priority 1 (This Week)
- [ ] `src/app/results/[sessionId]/page.tsx` - Display real resources
- [ ] `src/app/facility/[id]/page.tsx` - Create facility detail page
- [ ] `src/types/domain.ts` - Add new resource fields
- [ ] `src/lib/matching/scorer.ts` - Use insurance and proximity data

### Priority 2 (Week 2)
- [ ] `src/app/[state]/page.tsx` - State landing pages
- [ ] `src/app/blog/` - Blog post infrastructure
- [ ] `src/components/LeadCaptureModal.tsx` - Email capture
- [ ] `src/app/crisis/page.tsx` - Hospital discharge page

### Priority 3 (Week 3-4)
- [ ] `src/app/admin/leads/page.tsx` - Lead dashboard
- [ ] `src/components/CostCalculator.tsx` - Cost estimator
- [ ] `src/components/FacilityComparison.tsx` - Comparison tool
- [ ] `src/app/api/leads/route.ts` - Lead capture API

## Command Reference

### Database Operations
```bash
# Apply migration (Supabase SQL Editor)
# Copy: supabase/migrations/0002_add_geolocation_and_medical_systems.sql

# Download CMS data
./scripts/download-cms-data.sh

# Process data
pnpm tsx scripts/process-cms-data.ts

# Import data (fast - no geocoding)
pnpm tsx scripts/import-resources-enhanced.ts data/cms/processed/[file].csv

# Geocode (slow - run overnight)
pnpm tsx scripts/geocode-addresses.ts [input] [output]

# Import with proximity
pnpm tsx scripts/import-resources-enhanced.ts [file] --compute-proximity
```

### Development
```bash
# Start dev server
pnpm dev

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Build
pnpm build
```

---

**Current Focus:** Apply migration → Import data → Update results page

**Next Milestone:** 32,000 resources live, lead capture working

**Revenue Target:** First $500 in leads by end of Month 1
