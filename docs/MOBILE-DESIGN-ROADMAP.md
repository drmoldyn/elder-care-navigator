# Mobile & Design Improvements Roadmap

## Overview
Plan for implementing sunset brand design across all pages with mobile-first approach for hospital staff and caregivers searching on mobile devices.

---

## ✅ Completed

### Homepage (`/`)
- ✅ Sunset color palette with decorative columns
- ✅ Hero image with gradient overlays
- ✅ Glassmorphism search card
- ✅ Mobile-responsive form (grid layout collapses on small screens)
- ✅ Trust bar with verification badges
- ✅ "Search on Map" button (visual only, functionality pending)

### SEO Foundation
- ✅ Comprehensive metadata (Open Graph, Twitter Cards)
- ✅ Sitemap.xml and robots.txt
- ✅ Keyword optimization
- ✅ Mobile-first indexing ready

---

## 🚧 In Progress (This Session)

### 1. Navigator Page (`/navigator`) - Multi-Step Form

**Current State:**
- Plain design with minimal styling
- Multi-step wizard (relationship → conditions → care type → location → living situation → urgency → review)
- Desktop-focused layout

**Mobile Pain Points:**
- Small tap targets for radio buttons/checkboxes
- Difficult to see progress through steps
- Back button not obvious on mobile
- Form feels cramped on small screens

**Improvements Needed:**

#### A. Mobile-Optimized Step Indicator
```tsx
// Add to top of navigator page
<div className="mb-8">
  <div className="flex items-center justify-between max-w-md mx-auto">
    {NAVIGATOR_STEPS.map((step, index) => (
      <div key={step} className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          currentStepIndex >= index
            ? 'bg-sunset-orange text-white'
            : 'bg-gray-200 text-gray-500'
        }`}>
          {index + 1}
        </div>
        <span className="text-xs mt-1 hidden md:block">{step}</span>
      </div>
    ))}
  </div>
  <div className="text-center text-sm text-muted-foreground mt-2">
    Step {currentStepIndex + 1} of {NAVIGATOR_STEPS.length}
  </div>
</div>
```

#### B. Larger Touch Targets
```tsx
// Update radio/checkbox styling
className="w-6 h-6 text-sunset-orange border-2 border-gray-300 rounded focus:ring-sunset-orange/50 cursor-pointer"
```

#### C. Sticky Navigation Bar (Mobile)
```tsx
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 md:hidden z-50 shadow-lg">
  {currentStepIndex > 0 && (
    <button
      onClick={handleBack}
      className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl"
    >
      ← Back
    </button>
  )}
  <button
    onClick={handleNext}
    className="flex-1 bg-gradient-to-r from-sunset-orange to-sunset-gold text-white font-semibold py-3 rounded-xl"
  >
    Continue →
  </button>
</div>
```

#### D. Add Sunset Branding
- Orange accent colors for active states
- Soft gradient backgrounds per step
- Consistent with homepage aesthetic

---

### 2. Results Page (`/results/[sessionId]`)

**Current State:**
- List view with facility cards
- Basic filters
- Comparison bar at bottom
- Mobile tabs implemented (list/map/filters)

**Mobile Pain Points:**
- Facility cards too dense on mobile
- CTA buttons (Request Info, Compare) hard to tap
- No quick call button for urgent needs
- Distance/rating not prominent enough

**Improvements Needed:**

#### A. Mobile-Optimized Facility Cards
```tsx
<div className="bg-white rounded-xl shadow-md p-4 mb-3 border border-gray-200 hover:border-sunset-orange transition-all">
  {/* Header */}
  <div className="flex justify-between items-start mb-3">
    <div className="flex-1">
      <h3 className="font-bold text-lg text-gray-900 mb-1">{facility.title}</h3>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="flex items-center">
          📍 {facility.distance?.toFixed(1)} mi
        </span>
        {facility.overall_rating && (
          <span className="flex items-center">
            ⭐ {facility.overall_rating}/5
          </span>
        )}
      </div>
    </div>
    {/* Quick Compare Checkbox */}
    <input
      type="checkbox"
      checked={isSelected(facility.id)}
      onChange={() => isSelected(facility.id) ? removeFacility(facility.id) : addFacility(facility)}
      className="w-6 h-6 text-sunset-orange rounded"
    />
  </div>

  {/* Address */}
  <p className="text-sm text-gray-600 mb-3">
    {facility.address}, {facility.city}, {facility.state}
  </p>

  {/* Tags */}
  <div className="flex flex-wrap gap-2 mb-3">
    {facility.insurance_accepted?.map(ins => (
      <Badge key={ins} className="bg-sky-blue/10 text-sky-blue border-sky-blue/20">
        {ins}
      </Badge>
    ))}
  </div>

  {/* Mobile CTAs - Full Width */}
  <div className="grid grid-cols-2 gap-2">
    <a
      href={`tel:${facility.contact_phone}`}
      className="bg-sunset-orange text-white font-semibold py-3 rounded-xl text-center flex items-center justify-center gap-2"
    >
      📞 Call
    </a>
    <button
      onClick={() => setRequestInfoModal({ isOpen: true, facilityName: facility.title, facilityId: facility.id })}
      className="bg-sky-blue text-white font-semibold py-3 rounded-xl"
    >
      Get Info
    </button>
  </div>
</div>
```

#### B. Sticky Filter Bar (Mobile)
```tsx
<div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 p-3 flex items-center justify-between shadow-sm">
  <span className="font-semibold">{resources.length} Facilities</span>
  <button
    onClick={() => setMobileTab('filters')}
    className="bg-sky-blue text-white px-4 py-2 rounded-lg font-medium"
  >
    🔧 Filters {filterCount > 0 && `(${filterCount})`}
  </button>
</div>
```

#### C. Bottom Navigation for Mobile Tabs
- Already implemented with `MobileTabs` component
- Enhance with sunset colors:
```tsx
<MobileTabs
  activeTab={mobileTab}
  onTabChange={setMobileTab}
  filterCount={filterCount}
  className="bg-white border-t-2 border-sunset-orange/20"
/>
```

---

### 3. Compare Page (`/compare`)

**Current State:**
- Basic comparison table
- Side-by-side facility details
- Not mobile-optimized

**Mobile Pain Points:**
- Horizontal scrolling required
- Text too small to read
- Can't see all comparison fields at once

**Improvements Needed:**

#### A. Accordion-Style Mobile View
```tsx
<div className="md:hidden">
  {facilities.map(facility => (
    <div key={facility.id} className="bg-white rounded-xl shadow-md p-4 mb-4">
      <h3 className="font-bold text-lg mb-3">{facility.name}</h3>
      {comparisonFields.map(field => (
        <div key={field.key} className="py-2 border-b border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase">{field.label}</div>
          <div className="text-base mt-1">{facility[field.key]}</div>
        </div>
      ))}
    </div>
  ))}
</div>
```

#### B. Desktop Side-by-Side (Keep)
```tsx
<div className="hidden md:block overflow-x-auto">
  <table className="w-full">
    {/* Existing comparison table */}
  </table>
</div>
```

#### C. Sticky CTA Bar
```tsx
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden shadow-lg">
  <button className="w-full bg-gradient-to-r from-sunset-orange to-sunset-gold text-white font-semibold py-3 rounded-xl">
    Request Info for All ({selectedFacilities.length})
  </button>
</div>
```

---

## 🎨 Design System Updates

### Color Usage Guidelines

**Primary Actions:**
- Buttons: `bg-gradient-to-r from-sunset-orange to-sunset-gold`
- Hover: `hover:from-sunset-gold hover:to-sunset-orange`
- Focus rings: `focus:ring-sunset-orange/50`

**Secondary Actions:**
- Buttons: `bg-sky-blue`
- Hover: `hover:bg-sky-blue/90`

**Decorative Elements:**
- Background overlays: `bg-lavender/20`
- Borders: `border-sunset-orange/20`

**Text:**
- Headings: `text-gray-900`
- Body: `text-gray-700`
- Muted: `text-gray-500`

### Mobile Breakpoints

```css
/* Tailwind defaults */
sm: 640px   /* Mobile landscape, small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

**Usage:**
- Show mobile layout: `block md:hidden`
- Show desktop layout: `hidden md:block`
- Responsive padding: `px-4 md:px-6 lg:px-8`
- Responsive font sizes: `text-base md:text-lg`

---

## 📱 Mobile UX Best Practices

### Touch Targets
- Minimum 48x48px for all interactive elements
- Spacing between buttons: 8px minimum
- Use `py-3` or `py-4` for buttons (12px or 16px padding)

### Typography
- Base font size: 16px (avoids mobile zoom)
- Line height: 1.5 (readable on small screens)
- Headings: Scale down on mobile (`text-2xl md:text-3xl lg:text-4xl`)

### Forms
- Labels above inputs (not beside)
- Full-width inputs on mobile
- Large input fields: `py-3.5` (14px padding)
- Use `inputmode` for better mobile keyboards:
  ```tsx
  <input type="text" inputMode="numeric" /> // ZIP code
  <input type="email" inputMode="email" /> // Email
  <input type="tel" inputMode="tel" /> // Phone
  ```

### Navigation
- Sticky header on mobile
- Bottom navigation for key actions
- Breadcrumbs hidden on mobile (use back button)

---

## 🚀 Implementation Priority

### Phase 1: Critical Mobile Fixes (This Week)
1. **Navigator Page**
   - [ ] Add mobile step indicator
   - [ ] Larger touch targets for radio/checkbox
   - [ ] Sticky bottom navigation bar
   - [ ] Apply sunset colors

2. **Results Page**
   - [ ] Redesign facility cards for mobile
   - [ ] Add click-to-call buttons
   - [ ] Sticky filter bar at top
   - [ ] Enhance mobile tabs with sunset colors

### Phase 2: Polish & Enhancements (Next Week)
3. **Compare Page**
   - [ ] Accordion-style mobile view
   - [ ] Sticky CTA bar
   - [ ] Keep desktop side-by-side table

4. **Global Improvements**
   - [ ] Add loading skeletons (facility cards, forms)
   - [ ] Add empty states (no results, no comparison)
   - [ ] Add error states (API failures)
   - [ ] Toast notifications for actions (added to comparison, info requested)

### Phase 3: Progressive Enhancements (Future)
5. **PWA Features**
   - [ ] Add `manifest.json` for "Add to Home Screen"
   - [ ] Service worker for offline facility browsing
   - [ ] Push notifications for new facilities

6. **Advanced Mobile Features**
   - [ ] GPS-based location detection
   - [ ] Swipe gestures for facility cards
   - [ ] Voice search (Web Speech API)
   - [ ] Haptic feedback on button presses

---

## 📊 Mobile Performance Targets

### Core Web Vitals (Mobile)
- **LCP** (Largest Contentful Paint): < 2.5s
  - Hero image optimization ✅
  - Lazy load facility cards ✅

- **FID** (First Input Delay): < 100ms
  - Use React.lazy() for heavy components
  - Debounce search inputs

- **CLS** (Cumulative Layout Shift): < 0.1
  - Fixed image dimensions ✅
  - Reserve space for dynamic content

### Lighthouse Score Targets
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 95
- **SEO**: > 95

---

## 🧪 Testing Checklist

### Mobile Devices to Test
- [ ] iPhone SE (small screen, 375x667)
- [ ] iPhone 12/13/14 (standard, 390x844)
- [ ] iPhone 14 Pro Max (large, 430x932)
- [ ] Samsung Galaxy S22 (Android, 360x800)
- [ ] iPad Mini (tablet, 768x1024)

### Browsers to Test
- [ ] Safari (iOS)
- [ ] Chrome (Android)
- [ ] Samsung Internet
- [ ] Firefox (mobile)

### Test Scenarios
1. **Hospital Discharge Planner**
   - Scenario: Social worker in hospital needs to find SNF for patient being discharged tomorrow
   - Device: iPhone on hospital WiFi
   - Actions: Search by ZIP → Filter by Medicare → Call top 3 facilities

2. **Family Member at Work**
   - Scenario: Daughter searching during lunch break for mother's assisted living
   - Device: Personal phone on 4G
   - Actions: Search by location → Compare 3 facilities → Request info

3. **Caregiver at Home**
   - Scenario: Adult son exploring home health options for father
   - Device: iPad on home WiFi
   - Actions: Browse by care type → Read guidance → Save multiple options

---

## 📝 Component Updates Needed

### New Components to Create

1. **`MobileStepIndicator.tsx`**
   - Progress dots for multi-step forms
   - Step labels (hide on very small screens)
   - Responsive sizing

2. **`MobileFacilityCard.tsx`**
   - Optimized layout for small screens
   - Quick actions (call, info, compare)
   - Swipe-to-compare (future enhancement)

3. **`StickyMobileNav.tsx`**
   - Fixed bottom bar with primary actions
   - Context-aware (changes per page)
   - Sunset-themed buttons

4. **`LoadingSkeleton.tsx`**
   - Placeholder UI while content loads
   - Matches actual component dimensions
   - Smooth animation

### Components to Update

1. **`Header.tsx`**
   - Make sticky on mobile (`fixed top-0`)
   - Reduce height on scroll
   - Add shadow when scrolled

2. **`Footer.tsx`**
   - Collapse links on mobile
   - Larger touch targets
   - Remove less important links on small screens

3. **`ComparisonBar.tsx`**
   - Move to bottom on mobile (currently floating)
   - Full-width CTA
   - Show facility count prominently

---

Built with care for SunsetWell.com 🌅
