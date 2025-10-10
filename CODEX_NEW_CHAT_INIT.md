# Codex Reinitialization Prompt

**Context**: You ran out of token limit in your previous chat. This prompt will help you reinitialize with the current project state.

---

## Project Overview

**Name**: SunsetWell.com (formerly Elder Care Navigator)
**Purpose**: Senior care facility search platform matching families with nursing homes, assisted living facilities, and home health agencies based on location, insurance, and care needs.

**Tech Stack**:
- Next.js 15.5.4 (App Router, Turbopack)
- TypeScript
- Supabase (PostgreSQL with PostGIS)
- Tailwind CSS v4
- React 19

---

## Current State (As of Oct 10, 2025)

### ✅ Completed Features

1. **Database & Data Pipeline**
   - ✅ All migrations applied (0003-0006)
   - ✅ 75,087 total facilities imported:
     - 16,708 Nursing Homes (95.8% geocoded)
     - 44,636 Assisted Living Facilities (99.5% geocoded)
     - 13,741 Home Health Agencies (63.1% geocoded - still in progress)
   - ✅ Service area matching for home health (528,025 ZIP mappings)
   - ✅ PostGIS geolocation with lat/lng coordinates

2. **Brand Redesign (Just Completed by Claude Code)**
   - ✅ Sunset-themed color palette implemented
   - ✅ Hero image integration with decorative gradient columns
   - ✅ Tailwind v4 CSS-first configuration
   - ✅ Image optimization (46% size reduction)
   - ✅ Responsive glassmorphism search card
   - ✅ "Search on Map" button added (not yet functional)

3. **Core Features**
   - ✅ Multi-step navigator flow (location → insurance → care needs)
   - ✅ Geocoded facility matching with distance calculation
   - ✅ Insurance filtering (Medicare, Medicaid, VA, Private)
   - ✅ Info request modal for lead generation
   - ✅ Mobile-responsive design

### 🚧 In Progress

1. **Geocoding**: 5,069 home health facilities remaining (automated script running)
2. **Map View**: Prompt created (CODEX_PROMPT_MAP_VIEW.md) but NOT implemented yet

### 📋 Immediate Next Steps

**Your task is to implement the interactive map view feature.** See `CODEX_PROMPT_MAP_VIEW.md` for full specifications.

---

## Key Files to Review

### Critical Files
1. **`CODEX_PROMPT_MAP_VIEW.md`** - Your main task specification
2. **`src/app/page.tsx`** - Homepage with sunset design
3. **`src/app/navigator/page.tsx`** - Search flow (needs map view toggle)
4. **`src/app/api/match/route.ts`** - Facility matching API
5. **`src/app/globals.css`** - Tailwind v4 color definitions
6. **`docs/PROFESSIONAL-FEATURES.md`** - Future roadmap for social workers/case managers

### Important Context
- **`docs/PHOTO-STYLE-GUIDE.md`** - Brand visual guidelines
- **`docs/SERVICE-AREA-MATCHING.md`** - How home health ZIP matching works
- **`supabase/migrations/0003_*.sql`** - Geolocation schema
- **`scripts/check-geocoding-complete.ts`** - Monitor geocoding progress

---

## Environment Setup

You should already have access to:
- `.env.local` with Supabase credentials
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - for map implementation
- Dev server runs on port 3000 (or 3003/3004 if 3000 in use)

**Start dev server**: `pnpm dev`

---

## Your Task: Implement Map View

### Overview
Add an interactive Google Maps view at `/navigator?view=map` that displays facility search results as markers with clustering.

### Key Requirements (from CODEX_PROMPT_MAP_VIEW.md)
1. ✅ Detect `?view=map` query parameter in `/navigator`
2. ✅ Add toggle UI between "List View" and "Map View"
3. ✅ Integrate Google Maps with `@googlemaps/js-api-loader`
4. ✅ Display facilities as color-coded markers (SNF=red, ALF=blue, HH=green)
5. ✅ Implement marker clustering with `@googlemaps/markerclusterer`
6. ✅ Show info windows on marker click (facility name, address, rating, distance)
7. ✅ Center map on user's search ZIP code
8. ✅ Mobile responsive

### Dependencies to Install
```bash
pnpm add @googlemaps/js-api-loader @googlemaps/markerclusterer
pnpm add -D @types/google.maps
```

### New Files to Create
1. `src/components/MapView.tsx` - Main map component
2. `src/components/FacilityMarker.tsx` - Custom marker rendering
3. `src/hooks/useGoogleMaps.ts` - Map API loader hook
4. `src/utils/geocoding.ts` - ZIP geocoding & distance helpers

### Files to Modify
1. `src/app/navigator/page.tsx` - Add view toggle
2. `src/app/api/match/route.ts` - Ensure lat/lng in response

---

## Success Criteria

- ✅ Map loads at `/navigator?view=map`
- ✅ Toggle between list/map views without losing search state
- ✅ At least 80% of facilities show as markers (some may not be geocoded yet)
- ✅ Clicking marker opens info window with correct data
- ✅ Map centers on search ZIP
- ✅ Clustering works (zoom out to see clusters)
- ✅ Mobile responsive (60vh height on mobile)

---

## Brand Colors (Use These in Map UI)

Defined in `src/app/globals.css` under `@theme inline`:
- `sunset-orange`: #FF9B6A (primary buttons, SNF markers)
- `sunset-gold`: #FFD16A (accents)
- `sky-blue`: #6BA3C4 (ALF markers)
- `lavender`: #B4A5C7 (decorative elements)

---

## Important Notes

1. **Tailwind v4**: This project uses Tailwind CSS v4 with CSS-first configuration. Colors are defined in `globals.css` NOT `tailwind.config.ts`.

2. **Geocoding Status**: Not all facilities have lat/lng yet. Filter out `null` values:
   ```tsx
   const geocodedFacilities = facilities.filter(f =>
     f.latitude !== null && f.longitude !== null
   );
   ```

3. **Performance**: Limit initial markers to 500. Use lazy loading for map component.

4. **Next.js Image**: Use quality=82 (not 90) per optimization standards.

5. **Provider Type Column**: Database uses `provider_type` (not `facility_type`):
   - `nursing_home`
   - `assisted_living_facility`
   - `home_health`

---

## Git Workflow

Current branch: `main`
Latest commits:
- `8536458` - Sunset brand redesign
- `6024a3b` - Tailwind v4 color fixes + image optimization

**Before starting**:
```bash
git pull origin main
```

**When done**:
```bash
git add .
git commit -m "Implement interactive map view with Google Maps

- Added map view toggle at /navigator?view=map
- Integrated Google Maps with marker clustering
- Color-coded markers by facility type
- Info windows with facility details and distance
- Mobile responsive design

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Questions?

Refer to:
1. **`CODEX_PROMPT_MAP_VIEW.md`** - Detailed implementation guide
2. **`docs/PROFESSIONAL-FEATURES.md`** - Context on why map view matters
3. **`src/app/page.tsx`** - Example of current design patterns

Good luck! 🚀
