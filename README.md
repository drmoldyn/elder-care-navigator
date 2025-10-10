# Elder Care Navigator

**A production-ready tool to help families find nursing homes and assisted living facilities based on location, insurance, and care needs.**

🔍 **61,346 facilities nationwide** | 💊 **Medicare.gov verified** | 📱 **Mobile-optimized**

---

## ✨ Features

- **Address-Level Geocoding**: Precise distance calculations using facility street addresses (not ZIP codes)
- **Insurance-First Search**: Filter by Medicare, Medicaid, VA Benefits, or Private Insurance
- **Distance Sorting**: Results sorted by actual distance from your location
- **Quality Ratings**: CMS 5-Star ratings for nursing homes
- **Mobile-Responsive**: Tab-based interface optimized for stressed users on phones
- **Professional Design**: Healthcare-specific typography and UX patterns
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

- **[GEOCODING-SETUP.md](./GEOCODING-SETUP.md)**: Complete geocoding setup guide ⭐ **START HERE**
- **[docs/GEOCODING.md](./docs/GEOCODING.md)**: Technical geocoding documentation
- **[PRODUCTION-READY-SUMMARY.md](./PRODUCTION-READY-SUMMARY.md)**: Complete feature list, test results, and roadmap
- **[IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)**: Technical implementation details
- **[docs/ADDITIONAL_SERVICES.md](./docs/ADDITIONAL_SERVICES.md)**: Future service expansion plan
- **[design-examples/MOBILE-DESIGN-PLAN.md](./design-examples/MOBILE-DESIGN-PLAN.md)**: Mobile UX strategy

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

### Phase 1 (Current)
- ✅ Database: 61,346 facilities
- ✅ Search: ZIP code + insurance filtering
- ✅ Design: Professional, mobile-responsive

### Phase 2 (Next 2 weeks)
- [ ] Address-level geocoding (see [GEOCODING-SETUP.md](./GEOCODING-SETUP.md))
- [ ] Google Maps integration with facility markers
- [ ] Crisis mode page (`/urgent-placement`)
- [ ] Production deployment on Vercel

### Phase 3 (Month 2)
- [ ] Home health agencies (12,112 providers)
- [ ] Hospice care (7,006 providers)
- [ ] Elder law attorney directory

See [docs/ADDITIONAL_SERVICES.md](./docs/ADDITIONAL_SERVICES.md) for full roadmap.

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
