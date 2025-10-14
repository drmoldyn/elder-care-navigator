# SunsetWell Elder Care Navigator

**A production-ready tool to help families find nursing homes and assisted living facilities with empirically-derived quality scores and peer-group comparisons.**

🔍 **73,000+ facilities nationwide** | 📊 **SunsetWell Score** | 💊 **Medicare.gov verified** | 📱 **Mobile-optimized**

---

## ✨ Features

### 🌟 SunsetWell Score (v2.3 Predictive Harm Model)
- **Absolute Composite (0–100)**: Empirical weights learned from PHI labels span 27 CMS predictors (inspection depth, staffing coverage & turnover, long-stay MDS harm measures, complaint/incident rates, per-bed state benchmarks).
- **Peer Percentile (0–100)**: Separate rank within state/division + size/ownership groups so families can compare similar facilities instantly.
- **Component Coverage**:
  - Inspection & Enforcement (scope/severity index, deficiency volume)
  - Staffing Capacity & Stability (RN/LPN/CNA & weekend hours, turnover, bed scale)
  - Patient Outcomes (falls, pressure injuries, antipsychotics, weight loss, incontinence, complaint/incident rates)
  - Market Context (state per-bed harm benchmarks for calibration)
- **Visual Quality Indicators**: Color-coded scores (green/yellow/orange/red) drive table view, map markers, and badges.
- **Transparent Methodology**: Reproducible scripts + configuration documented in `docs/scoring-model.md` & `docs/SCORING-CHANGELOG.md`.
- **Reliability & Calibration**: Percentile context retained; 5th–95th national range sits ~18–77 for intuitive reading.

### Search & Discovery
- **Table View**: Scannable comparison table showing distance, quality metrics, and SunsetWell Score
- **Interactive Map**: Color-coded markers by SunsetWell Score for geographic quality insights
- **Address-Level Geocoding**: Precise distance calculations using facility street addresses
- **Insurance-First Search**: Filter by Medicare, Medicaid, VA Benefits, or Private Insurance
- **Distance Sorting**: Results sorted by actual distance from your location
- **Quality Metrics**: Health inspection, staffing, and quality measure ratings from CMS
- **Mobile-Responsive**: Tab-based interface optimized for stressed users on phones
- **One-Tap Actions**: Call facilities or get directions with a single tap

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested with v22.19.0)
- pnpm 10+
- Supabase account (for database)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Edit .env.local with:
# - Supabase credentials
# - Google Geocoding API key
```

### Geocoding Setup

For accurate distance calculations, you need to:

1. **Get Google Geocoding API Key**: Follow `GEOCODING-SETUP.md`
2. **Run Database Migration**: Add lat/lng columns to database
3. **Geocode Facilities**: Process all 61,346 addresses (~2 hours)

See **[GEOCODING-SETUP.md](./GEOCODING-SETUP.md)** for complete instructions.

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3004](http://localhost:3004) in your browser.

---

## 📊 Database

### Current Status
- **73,129 facilities** loaded and searchable
- **14,752 skilled nursing facilities** (CMS Medicare.gov)
- **44,636 assisted living facilities** (State databases)
- **13,741 home health agencies** (CMS Medicare.gov)

### Data Quality & Coverage

#### Skilled Nursing Facilities (SNFs)
- ✅ 14,752 total facilities (100%)
- ✅ 14,752 with CCN identifiers (100%)
- ✅ 14,752 with precise geolocation (100%)
- ✅ 14,752 with state data for peer grouping (100%)
- ✅ 14,614 with CMS quality metrics (99.1%)
- ✅ **14,752 with SunsetWell Scores (100.0%)**
- 📈 Harm model now includes MDS harm measures, deficiency severity index, per-bed complaint/incident rates, and staffing depth metrics for every SNF.

#### Assisted Living Facilities (ALFs)
- ✅ 44,636 total facilities (100%)
- ✅ 39,216 with facility IDs (87.9%)
- ✅ 44,229 with precise geolocation (99.1%)
- ✅ 44,636 with state data for peer grouping (100%)
- ✅ **39,463 with SunsetWell Scores (88.4%)**

#### Home Health Agencies
- ✅ 13,741 total facilities (100%)
- ✅ 13,741 with CCN identifiers (100%)
- ✅ 13,740 with precise geolocation (100.0%)
- ✅ 13,741 with state data for peer grouping (100%)
- ⏳ 0 with SunsetWell Scores (CMS data import pending)

**Note**: SunsetWell Scores require sufficient CMS reporting across staffing, quality, safety, and harm dimensions. Nursing homes now reach full coverage (14,752 / 14,752) via imputed harm features; assisted living remains limited by state reporting (88.4%).

### Test Data Quality

```bash
pnpm tsx scripts/comprehensive-facility-survey.ts
```

### Test Search Functionality

```bash
pnpm tsx scripts/test-search.ts
```

---

## 🏗️ Architecture

### Stack
- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Fonts**: Google Fonts (Merriweather + Inter)
- **Deployment**: Vercel (recommended)

### Key Files
```
src/
├── app/
│   ├── page.tsx                       # Homepage with search form
│   ├── navigator/page.tsx             # Multi-step questionnaire
│   ├── results/[sessionId]/page.tsx   # Results with map
│   └── api/
│       ├── match/route.ts             # Search API
│       └── sessions/[id]/route.ts     # Session retrieval
├── components/
│   ├── layout/                        # Header, footer, nav
│   ├── navigator/                     # Questionnaire steps
│   └── results/                       # Mobile tabs, filters
└── lib/
    ├── matching/
    │   ├── geocoded-matcher.ts        # Address-level geocoding matcher
    │   └── sql-matcher.ts             # ZIP prefix fallback
    └── utils/
        └── distance.ts                # Haversine distance calculation
```

---

## 🔍 Search Examples

### Example 1: Manhattan Nursing Homes
```typescript
// ZIP: 10001, Insurance: Medicare + Medicaid, Rating: 4+
// Results: High-quality facilities in Manhattan area
```

### Example 2: Beverly Hills Assisted Living
```typescript
// ZIP: 90210, Type: Assisted Living
// Results: 88 facilities in 902xx ZIP codes
```

### Example 3: Nationwide Medicare Search
```typescript
// Insurance: Medicare, Rating: 4+, Type: Nursing Home
// Results: 6,262 facilities nationwide
```

---

## 📱 Mobile Features

- ✅ **Tab Navigation**: List / Map / Filters
- ✅ **44px Touch Targets** (WCAG AAA accessibility)
- ✅ **Hamburger Menu** with emoji icons
- ✅ **One-Tap Calling** (`tel:` links)
- ✅ **One-Tap Directions** (Google Maps integration)
- ✅ **Full-Screen Filters** (modal on mobile)

---

## 📖 Documentation

### Core Documentation
- **[docs/scoring-model.md](./docs/scoring-model.md)**: SunsetWell Score methodology and peer group strategy ⭐ **SCORING**
- **[docs/SCORING-CHANGELOG.md](./docs/SCORING-CHANGELOG.md)**: Versioned scoring updates
- **[docs/SUNSETWELL-SCORE-UI-SPEC.md](./docs/SUNSETWELL-SCORE-UI-SPEC.md)**: UI specification for score integration
- **[GEOCODING-SETUP.md](./GEOCODING-SETUP.md)**: Complete geocoding setup guide
- **[docs/GEOCODING.md](./docs/GEOCODING.md)**: Technical geocoding documentation

### Product Documentation
- **[PRODUCTION-READY-SUMMARY.md](./PRODUCTION-READY-SUMMARY.md)**: Complete feature list, test results, and roadmap
- **[IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)**: Technical implementation details
- **[docs/ADDITIONAL_SERVICES.md](./docs/ADDITIONAL_SERVICES.md)**: Future service expansion plan
- **[design-examples/MOBILE-DESIGN-PLAN.md](./design-examples/MOBILE-DESIGN-PLAN.md)**: Mobile UX strategy

### Data & Analysis
- **[docs/regression-approach.md](./docs/regression-approach.md)**: Regression methodology for weight derivation
- **[docs/codex-scoring-prompt.md](./docs/codex-scoring-prompt.md)**: Context for scoring model development

---

## 🎨 Design System

### Typography
- **Headlines**: Merriweather (serif) - conveys trust and authority
- **Body Text**: Inter (sans-serif) - modern and readable

### Colors
- **Primary**: Indigo 600 (#4f46e5)
- **Gradient**: Indigo → Purple (hero sections)
- **Text**: Gray 900 (high contrast)

### Spacing
- **Mobile**: px-4 (16px padding)
- **Desktop**: px-6 md:px-8 (24-32px padding)

---

## 🧪 Testing

### Data Quality Test
```bash
pnpm tsx scripts/comprehensive-facility-survey.ts
```

**Output**:
- Total facilities by type (SNF / ALF / Home Health)
- SunsetWell coverage counts (expect 14,752 / 14,752 SNFs scored)
- Missing data diagnostics for scored metrics

### Search Functionality Test
```bash
pnpm tsx scripts/test-search.ts
```

**Output**:
- ZIP code proximity search results
- Filter combinations (Medicare + 4+ stars)
- Multiple location tests

---

## 🚧 Setup Required

### Before Production Launch

1. **Geocoding Setup** (see [GEOCODING-SETUP.md](./GEOCODING-SETUP.md))
   - [ ] Get Google Geocoding API key
   - [ ] Run database migration
   - [ ] Geocode all 61,346 facilities (~2 hours, ~$107)
   - [ ] Update API to use geocoded matcher
   - [ ] Display distances in UI

2. **Google Maps Integration**
   - [ ] Add Maps JavaScript API key
   - [ ] Replace placeholder map with real map
   - [ ] Add facility markers with clustering

3. **Crisis Mode Page**
   - [ ] Create `/urgent-placement` page
   - [ ] Emergency contact forms
   - [ ] 24/7 helpline integration

### Medium Priority
- ❌ Facility detail pages
- ❌ Save/favorite facilities
- ❌ User accounts

See [PRODUCTION-READY-SUMMARY.md](./PRODUCTION-READY-SUMMARY.md) for complete list.

---

## 📈 Roadmap

### Phase 1 (COMPLETED ✅)
- ✅ Database: 73,129 facilities (14,752 nursing homes, 44,636 assisted living, 13,741 home health)
- ✅ Search: ZIP code + insurance filtering with distance sorting
- ✅ Design: Professional, mobile-responsive with table & map views
- ✅ Address-level geocoding for precise distance calculations (99.9% coverage)
- ✅ Google Maps integration with interactive markers
- ✅ Production deployment on Vercel (sunsetwell.com)

### Phase 2 (IN PROGRESS 🚧)
- ✅ **SunsetWell Score**: Empirically-derived composite quality scoring
- ✅ **Peer Group Normalization**: Hierarchical comparison groups (state → division → national)
- ✅ **Metrics Dashboard**: Interactive visualization at /metrics
- 🚧 **UI Integration**: Table view with quality metrics and color-coded scores
- 🚧 **Map Markers**: Color coding by SunsetWell Score
- [ ] **Facility Detail Pages**: Deep-dive into individual facility quality breakdown
- [ ] **Score Explanations**: Transparent methodology display for end users

### Phase 3 (Next)
- [ ] **Professional Portal**: Facility dashboards with trend analysis and benchmarking
- [ ] **Score Calculations**: Automated nightly score refresh pipeline
- [ ] **Expand Scoring**: Extend SunsetWell Score to assisted living, home health, hospice
- [ ] **Crisis Mode Page**: `/urgent-placement` with emergency contact forms
- [ ] **SEO Optimization**: Location-specific landing pages
- [ ] **Elder Law Directory**: Attorney referral network integration

#### Near-Term SEO & Traffic Priorities
1. Launch crawlable facility detail pages with HealthcareProvider schema, canonical URLs, and internal links from search/location experiences to capture long-tail intent while increasing AdSense-eligible inventory.
2. Scale programmatic location coverage (state → city → ZIP) with static generation, sitemap inclusion, and navigation surfacing so bots and users can reach hundreds of geo-specific pages.
3. Publish an editorial guides hub (coverage checklists, Medicare vs. Medicaid explainers, discharge playbooks) to deepen content quality and support both SEO breadth and AdSense policy alignment.
4. Close technical SEO gaps: supply the referenced logo asset for organization schema, fix broken nav targets (e.g., `/urgent-placement`, `/results/compare`), and generate XML sitemap indexes for new sections.
5. Finalize AdSense readiness by replacing placeholder slot IDs, optimizing placements across results and navigator flows, and monitoring layout shifts to satisfy policy and Core Web Vitals requirements.

See [docs/ADDITIONAL_SERVICES.md](./docs/ADDITIONAL_SERVICES.md) and [docs/roadmap-codex.md](./docs/roadmap-codex.md) for full roadmap.

---

## 🤝 Contributing

This project was built with [Claude Code](https://claude.com/claude-code).

### Development Workflow
1. Create a feature branch
2. Run tests: `pnpm tsx scripts/test-*.ts`
3. Test on mobile devices
4. Submit PR with screenshots

---

## 📄 License

MIT License - See LICENSE file for details

### Data Attribution
- **CMS Medicare.gov**: Public domain
- **State Licensing Databases**: Public records
- **Quality Ratings**: CMS 5-Star Rating System

---

## 📞 Support

For questions or issues:
1. Check [PRODUCTION-READY-SUMMARY.md](./PRODUCTION-READY-SUMMARY.md)
2. Review [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)
3. Run test scripts to verify setup

---

**Built with**:
🤖 Claude Code | ⚡ Next.js 15 | 🎨 Tailwind CSS | 🗄️ Supabase

**Status**: Ready for production testing
**Version**: 1.0.0-beta
**Last Updated**: 2025-10-10
### Evaluate Scoring Performance

```bash
pnpm tsx scripts/evaluate-sunsetwell-vs-cms.ts
```

Outputs correlation of SunsetWell Score and CMS Stars vs hospitalization rates per 1,000 resident-days.

### Optimize Metric Weights (v2.1)

Preview optimized weights vs. long-stay hospitalization/ED:

```bash
pnpm tsx scripts/optimize-weights.ts
```

Persist optimized global weights (and division overrides when beneficial):

```bash
NEW_SCORE_VERSION=v2.1 APPLY_WEIGHTS=true pnpm tsx scripts/optimize-weights.ts
```

Apply them in scoring:

```bash
METRIC_SCORE_VERSION=v2.1 pnpm tsx scripts/calculate-sunsetwell-scores-full.ts
```
