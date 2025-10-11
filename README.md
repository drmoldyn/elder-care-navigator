# SunsetWell Elder Care Navigator

**A production-ready tool to help families find nursing homes and assisted living facilities with empirically-derived quality scores and peer-group comparisons.**

🔍 **75,000+ facilities nationwide** | 📊 **SunsetWell Score** | 💊 **Medicare.gov verified** | 📱 **Mobile-optimized**

---

## ✨ Features

### 🌟 SunsetWell Score (NEW)
- **Empirical Scoring Model**: Composite 0-100 score derived from regression analysis of safety outcomes
- **Peer-Group Normalization**: Facilities compared within their region and facility type for fair "apples-to-apples" comparisons
- **Component Breakdown**:
  - Inspection & Compliance (53%)
  - Staffing Capacity & Hours (32%)
  - Safety & Stability (15%)
- **Visual Quality Indicators**: Color-coded scores (green/yellow/orange/red) in table view and map markers
- **Transparent Methodology**: Weights based on predicting substantiated complaints and facility-reported incidents

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
- **61,346 facilities** loaded and searchable
- **16,708 nursing homes** (CMS Medicare.gov)
- **44,636 assisted living facilities** (State databases)

### Data Quality
- ✅ 99.7% have street addresses
- ✅ 89.7% have bed counts
- ✅ 27% have quality ratings (nursing homes only)

### Test Data Quality

```bash
pnpm tsx scripts/test-data-quality.ts
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
pnpm tsx scripts/test-data-quality.ts
```

**Output**:
- Total facilities: 61,346
- Insurance coverage: 99.997% (Medicare/Medicaid)
- Sample facilities with ratings and addresses

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
- ✅ Database: 75,000+ facilities (nursing homes, assisted living, home health, hospice)
- ✅ Search: ZIP code + insurance filtering with distance sorting
- ✅ Design: Professional, mobile-responsive with table & map views
- ✅ Address-level geocoding for precise distance calculations
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
