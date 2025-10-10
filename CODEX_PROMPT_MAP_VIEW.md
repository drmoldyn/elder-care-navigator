# Task: Implement Interactive Map View for Facility Search

## Overview
Build an interactive Google Maps view that displays facility search results as map markers with clustering, allowing users to visually explore care options by location.

## Context
- We currently have a list-based search at `/navigator` with results from `/api/match`
- We've added a "Search on Map" button on the homepage that routes to `/navigator?view=map`
- All facilities are being geocoded with latitude/longitude coordinates (42,956+ facilities)
- Google Maps API key is available at `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`
- This feature is referenced in `docs/PROFESSIONAL-FEATURES.md` as a foundation for professional tools

## Requirements

### 1. Map View Route (`/navigator?view=map`)
**What to build:**
- Detect `?view=map` query parameter in the existing `/navigator` page
- Conditionally render either the list view (current) or new map view
- Add a toggle UI element to switch between "List View" and "Map View"

**Implementation notes:**
- Use Next.js `useSearchParams()` to detect `view=map`
- Preserve all other search parameters (zipCode, insurance, careType, etc.)
- Toggle should be a button group or tabs near the top of results

**Example UI:**
```tsx
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setView('list')}
    className={view === 'list' ? 'active' : ''}
  >
    📋 List View
  </button>
  <button
    onClick={() => setView('map')}
    className={view === 'map' ? 'active' : ''}
  >
    🗺️ Map View
  </button>
</div>
```

---

### 2. Google Maps Integration
**What to build:**
- Install `@googlemaps/js-api-loader` package
- Create a `MapView` component that renders a Google Map
- Initialize map centered on the user's search ZIP code coordinates
- Set appropriate zoom level (11-13 for city/region view)

**Implementation notes:**
- Load Google Maps API using the loader:
```tsx
import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  version: "weekly",
  libraries: ["marker", "geocoding"]
});
```

- Use `useEffect` to initialize map on component mount
- Clean up map instance on unmount
- Handle loading states (show spinner while map loads)

**Geocode ZIP code to center map:**
- Use Google Geocoding API to convert search ZIP to lat/lng
- Cache ZIP → lat/lng conversions in localStorage for performance
- Default to continental US center (39.8283° N, 98.5795° W) if ZIP unavailable

---

### 3. Display Facility Markers
**What to build:**
- For each facility in search results, create a map marker at its latitude/longitude
- Use **marker clustering** to handle 100+ results without performance issues
- Markers should be color-coded by facility type:
  - 🏥 Red: Skilled Nursing Facilities (SNF)
  - 🏡 Blue: Assisted Living Facilities (ALF)
  - 🏠 Green: Home Health Agencies

**Implementation notes:**
- Use `@googlemaps/markerclusterer` for clustering:
```bash
pnpm add @googlemaps/markerclusterer
```

```tsx
import { MarkerClusterer } from '@googlemaps/markerclusterer';

const markers = facilities.map(facility =>
  new google.maps.Marker({
    position: { lat: facility.latitude, lng: facility.longitude },
    map: map,
    title: facility.name
  })
);

new MarkerClusterer({ markers, map });
```

- Only display facilities that have valid lat/lng (skip facilities still being geocoded)
- Filter markers based on current search filters (insurance, care type, needs)

---

### 4. Interactive Facility Info Cards
**What to build:**
- When user clicks a marker, show an info window with facility details
- Info window should include:
  - Facility name
  - Address
  - Star rating (if available from CMS data)
  - Distance from search ZIP
  - "View Details" button that links to facility detail page

**Example Info Window Content:**
```tsx
const infoWindowContent = `
  <div style="padding: 10px; max-width: 300px;">
    <h3 style="margin: 0 0 8px 0; font-weight: bold;">${facility.name}</h3>
    <p style="margin: 4px 0; font-size: 14px;">
      📍 ${facility.address}<br/>
      ${facility.city}, ${facility.state} ${facility.zip}
    </p>
    ${facility.overallRating ? `
      <p style="margin: 4px 0;">
        ⭐ ${facility.overallRating}/5 Stars
      </p>
    ` : ''}
    <p style="margin: 4px 0; color: #666; font-size: 13px;">
      ${distance.toFixed(1)} miles away
    </p>
    <a
      href="/facility/${facility.id}"
      style="display: inline-block; margin-top: 8px; padding: 8px 16px; background: #FF9B6A; color: white; text-decoration: none; border-radius: 8px;"
    >
      View Details →
    </a>
  </div>
`;

const infoWindow = new google.maps.InfoWindow({
  content: infoWindowContent
});

marker.addListener('click', () => {
  infoWindow.open(map, marker);
});
```

**Implementation notes:**
- Close other info windows when opening a new one (only one open at a time)
- Calculate distance from search ZIP using Haversine formula or `google.maps.geometry.spherical.computeDistanceBetween()`
- Sanitize HTML content to prevent XSS (use DOMPurify or similar)

---

### 5. Sync Map with List Results
**What to build:**
- When user pans/zooms the map, update visible results to match map bounds
- Show result count: "Showing 23 of 156 facilities in current map view"
- Add "Search this area" button that re-queries based on map bounds

**Implementation notes:**
- Listen to map `bounds_changed` event:
```tsx
map.addListener('bounds_changed', () => {
  const bounds = map.getBounds();
  const visibleFacilities = facilities.filter(f =>
    bounds?.contains({ lat: f.latitude, lng: f.longitude })
  );
  setVisibleCount(visibleFacilities.length);
});
```

- Debounce the bounds change handler (300ms) to avoid excessive re-renders
- Don't auto-refresh results on every pan (only when user clicks "Search this area")

---

### 6. Mobile Responsiveness
**What to build:**
- On mobile, map should be full-width and take 60% of viewport height
- Add a collapsible list view below the map on mobile
- Tapping a facility in the list should highlight/open its marker on the map

**Implementation notes:**
- Use responsive classes:
```tsx
<div className="h-[60vh] md:h-[600px] w-full">
  {/* Map container */}
</div>
```

- On mobile, use a bottom sheet or drawer for facility list
- Consider using `react-spring` or native CSS transitions for smooth animations

---

### 7. Performance Optimizations
**What to build:**
- Lazy-load the map (don't load Google Maps API until user switches to Map View)
- Implement marker clustering with progressive rendering (render clusters first, individual markers on zoom)
- Limit initial markers to 500 (show "500+ facilities" message if more)

**Implementation notes:**
- Use dynamic import for map component:
```tsx
const MapView = dynamic(() => import('@/components/MapView'), {
  loading: () => <MapSkeleton />,
  ssr: false
});
```

- Set cluster options for better performance:
```tsx
const clusterer = new MarkerClusterer({
  markers,
  map,
  algorithm: new SuperClusterAlgorithm({ radius: 200 }),
  renderer: {
    render: ({ count, position }) =>
      new google.maps.Marker({
        label: { text: String(count), color: "white", fontSize: "12px" },
        position,
        icon: {
          url: '/cluster-icon.svg',
          scaledSize: new google.maps.Size(40, 40)
        }
      })
  }
});
```

---

## Technical Specifications

### New Files to Create
1. **`src/components/MapView.tsx`** - Main map component
2. **`src/components/FacilityMarker.tsx`** - Custom marker rendering logic
3. **`src/hooks/useGoogleMaps.ts`** - Hook to load and manage Google Maps API
4. **`src/utils/geocoding.ts`** - Helper to geocode ZIP codes and calculate distances

### Modified Files
1. **`src/app/navigator/page.tsx`** - Add view toggle and conditionally render MapView
2. **`src/app/api/match/route.ts`** - Ensure response includes lat/lng for all facilities

### Dependencies to Install
```bash
pnpm add @googlemaps/js-api-loader @googlemaps/markerclusterer
pnpm add -D @types/google.maps
```

### Environment Variables
Ensure `.env.local` has:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

---

## Acceptance Criteria

**Must Have (MVP):**
- ✅ Map view accessible via `/navigator?view=map`
- ✅ Toggle between list and map views without losing search state
- ✅ Facilities display as markers with lat/lng from database
- ✅ Marker clustering works for 100+ results
- ✅ Clicking marker shows info window with facility details
- ✅ Map centers on user's search ZIP code
- ✅ Mobile responsive (map takes majority of screen on small devices)

**Nice to Have (Future Enhancements):**
- 🔮 "Get Directions" link in info window (opens Google Maps navigation)
- 🔮 Filter markers by facility type/insurance without re-querying API
- 🔮 Heatmap overlay showing facility density by region
- 🔮 Save map state in URL (zoom level, center) for shareable links

**Out of Scope (Don't Build Now):**
- Street View integration
- Custom map styles/themes
- Drawing tools (draw radius around ZIP)
- Multi-location search (compare multiple ZIPs)

---

## Data Schema Reference

### Facility Object (from `/api/match` response)
```typescript
interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;  // From geocoding, may be null if not yet geocoded
  longitude: number | null;
  facilityType: 'nursing_home' | 'assisted_living' | 'home_health';
  overallRating?: number;   // CMS 5-star rating (1-5)
  // ... other fields
}
```

**Important:** Not all facilities have lat/lng yet (geocoding in progress). Filter out `null` lat/lng before creating markers:
```tsx
const geocodedFacilities = facilities.filter(f =>
  f.latitude !== null && f.longitude !== null
);
```

---

## Testing Checklist

Before submitting, verify:
- [ ] Map loads without errors when navigating to `/navigator?view=map`
- [ ] Markers appear for at least 80% of search results (some may not be geocoded yet)
- [ ] Clicking a marker opens info window with correct facility data
- [ ] Toggling between list/map views preserves search filters
- [ ] Map is responsive on mobile (tested on iPhone/Android viewport)
- [ ] Clustering works (zoom out to see clusters, zoom in to see individual markers)
- [ ] No console errors related to Google Maps API
- [ ] Page load performance is acceptable (< 3s to interactive map)

---

## UI/UX Design Notes

**Color Palette (from `tailwind.config.ts`):**
- Primary: `sunset-orange` (#FF9B6A) and `sunset-gold` (#FFD16A)
- Secondary: `sky-blue` (#6BA3C4)
- Accent: `lavender` (#B4A5C7)

**Map Styles:**
- Use a clean, minimal Google Maps style (consider "Silver" or "Retro" themes)
- Match marker colors to brand palette where possible
- Ensure high contrast for accessibility (white text on dark backgrounds)

**Error States:**
- If Google Maps fails to load: Show friendly error with retry button
- If no facilities have geocoding: "We're still processing location data. Please try list view."
- If user denies location: Don't block map, just center on search ZIP

---

## Additional Context

### Why This Matters
- **User Value**: Visual exploration is more intuitive than scrolling lists for location-based decisions
- **Competitive Advantage**: Most elder care search sites have poor or no map views
- **Foundation for Phase 2**: Professional users will need map tools for territory management and multi-client placement

### Performance Targets
- Time to Interactive (TTI): < 3 seconds on 4G connection
- Max markers before clustering: 500 (show "500+ results" message)
- Map pan/zoom FPS: 60fps (smooth scrolling)

### Accessibility
- Ensure keyboard navigation works (Tab to markers, Enter to open info window)
- Provide text alternative: "Map showing X facilities in [location]"
- Use ARIA labels for map controls
- High contrast mode support (test with browser extensions)

---

## Questions for Clarification

If you encounter any blockers, please ask about:
1. **API Rate Limits**: Google Maps API has free tier limits (should be fine for MVP, but monitor usage)
2. **Geocoding Quality**: Some facilities may have incorrect lat/lng - how should we handle disputes?
3. **Cluster Thresholds**: At what zoom level should clusters break into individual markers? (suggest: zoom 13+)
4. **Info Window vs Side Panel**: Should we show full facility details in info window, or use a side panel like Airbnb?

---

## Success Metrics

After launch, we'll measure:
- % of users who click "Search on Map" button (target: 30%+)
- Avg time spent in map view vs list view
- Click-through rate from map markers to facility detail pages
- Mobile vs desktop usage patterns

---

## References

- **Google Maps Documentation**: https://developers.google.com/maps/documentation/javascript
- **Marker Clustering Guide**: https://developers.google.com/maps/documentation/javascript/marker-clustering
- **Professional Features Roadmap**: `docs/PROFESSIONAL-FEATURES.md`
- **Photo Style Guide** (for map marker icons): `docs/PHOTO-STYLE-GUIDE.md`

---

Built with care for SunsetWell.com 🌅
