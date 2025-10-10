# Mobile Design Plan

## 📱 Design Philosophy

### Key Principles for Mobile Elder Care Search
1. **Large touch targets** (min 44px) - Users may have reduced dexterity
2. **High contrast text** - Better visibility for aging eyes
3. **Simplified navigation** - Reduce cognitive load
4. **Thumb-friendly zones** - Important actions in easy-to-reach areas
5. **Minimal scrolling** - Key info above the fold
6. **Fast loading** - May be used in hospitals with poor connectivity

---

## 🏠 Homepage Mobile (320px - 768px)

### Layout Changes
- **Single column stack** instead of centered card
- **Full-width elements** with padding only
- **Sticky CTA button** at bottom of screen for easy access

### Specific Adaptations

#### Hero Section
```
┌─────────────────────┐
│   [Reduced padding] │
│                     │
│  Find the right     │
│  care for your      │  ← Smaller heading (text-3xl)
│  loved one          │
│                     │
│  Search verified... │  ← Shorter tagline
│                     │
│  ✓ Medicare verified│  ← Trust badges stack
│  ✓ 59,000+ facilities
│  ✓ Updated daily    │
│                     │
└─────────────────────┘
```

#### Search Form
- **Expand to full screen** (bg gradient continues)
- **Remove rounded corners** on mobile (feels more native)
- **Larger input fields** (py-4 instead of py-3)
- **Single-column checkboxes** for care needs

#### Crisis Banner
- **Sticky at top** when scrolling (alternative: sticky bottom)
- **Collapsible** - Show "🚨 Urgent?" with expand option

---

## 🔍 Results Page Mobile (Major Changes Needed)

### Problem: 3-column layout won't work on mobile

### Solution: Tab-based interface

```
┌─────────────────────────┐
│ Care Facilities Near You│ ← Header
│ 44,636 facilities       │
├─────────────────────────┤
│  [List] [Map] [Filter] │ ← Tabs
├─────────────────────────┤
│                         │
│   Facility Card 1       │
│   ⭐⭐⭐⭐⭐             │
│   123 Main St           │
│   ✓ 3 beds available    │
│   [Call] [Directions]   │
│                         │
│   Facility Card 2       │
│   ⭐⭐⭐⭐              │
│   ...                   │
│                         │
└─────────────────────────┘
```

### Tab 1: List View (Default)
- **Compact facility cards** (less padding)
- **Swipeable cards** (optional) for quick browsing
- **Infinite scroll** or pagination
- **Quick filters** at top (insurance dropdown, star rating)

### Tab 2: Map View
- **Full-screen map** with facility pins
- **Bottom sheet** showing facility when pin tapped
- **"List view" button** to switch back

### Tab 3: Filters (Modal)
- **Full-screen overlay** with filters
- **Apply button** at bottom (sticky)
- **Clear all** option
- **Show count** of results as filters change

---

## 📋 Navigator Flow Mobile

### Current state: Already mobile-friendly ✅
- Single-column cards
- Large touch targets
- Progress indicator works well

### Minor improvements:
1. **Sticky progress bar** at top
2. **Larger buttons** (py-4 instead of py-3)
3. **Back button** in header instead of in form

---

## 🧭 Navigation Mobile

### Current header needs mobile menu

```
┌─────────────────────────┐
│ ☰  Elder Care Navigator│ ← Hamburger + Logo
└─────────────────────────┘

When ☰ tapped:
┌─────────────────────────┐
│ Elder Care Navigator  ✕ │
├─────────────────────────┤
│ 🏠 Home                 │
│ 🔍 Find Facilities      │
│ 📞 Urgent Help          │
│ 📚 Resources            │
│ ℹ️  About               │
└─────────────────────────┘
```

---

## 🎨 Mobile-Specific Tailwind Classes

### Breakpoint Strategy
```css
/* Mobile-first approach */
default         → 320px - 640px  (sm:)
sm:            → 640px+
md:            → 768px+
lg:            → 1024px+  (show map sidebar)
```

### Common Patterns

#### Responsive Text
```jsx
// Headings
className="text-3xl md:text-4xl lg:text-6xl"

// Body text
className="text-sm md:text-base"

// Buttons
className="text-base md:text-lg"
```

#### Responsive Spacing
```jsx
// Padding
className="px-4 md:px-6 lg:px-8"
className="py-6 md:py-8 lg:py-16"

// Gaps
className="gap-3 md:gap-4 lg:gap-6"
```

#### Layout Shifts
```jsx
// Stack on mobile, row on desktop
className="flex flex-col md:flex-row"

// Hide on mobile, show on desktop
className="hidden lg:block"

// Show on mobile, hide on desktop
className="block lg:hidden"
```

---

## 🔧 Implementation Priority

### Phase 1: Critical Mobile Fixes (Do Now)
1. ✅ Homepage is already responsive
2. **Results page mobile tabs** - HIGH PRIORITY
3. **Mobile navigation menu** - HIGH PRIORITY
4. **Touch target audit** - Ensure all buttons ≥44px

### Phase 2: Enhancements (Next)
1. **Sticky CTA on homepage**
2. **Collapsible crisis banner**
3. **Swipeable facility cards**
4. **Bottom sheet for map pins**

### Phase 3: Performance (Later)
1. **Image optimization** (if we add facility photos)
2. **Lazy loading** for facility list
3. **PWA features** (offline mode, add to home screen)

---

## 📐 Mobile Wireframe: Results Page

### Mobile List View
```
┌─────────────────────────────┐
│ ← Care Facilities Near You  │
│   44,636 facilities          │
├─────────────────────────────┤
│ [List] [Map] [Filter (2)]   │ ← Tabs (badge shows active filter count)
├─────────────────────────────┤
│ 📍 Within 50 mi  [Change]   │ ← Quick location indicator
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ Sunrise Senior Living   │ │
│ │ ⭐⭐⭐⭐⭐ 5.0        │ │
│ │                         │ │
│ │ 123 Main St, Anytown    │ │
│ │ 2.3 miles away          │ │
│ │                         │ │
│ │ 💚 3 beds available     │ │
│ │ 💳 Medicare, Medicaid   │ │
│ │                         │ │
│ │ [📞 Call] [📍 Directions]│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Oakwood Care Center     │ │
│ │ ⭐⭐⭐⭐ 4.0           │ │
│ │ ...                     │ │
│                             │
└─────────────────────────────┘
```

### Mobile Map View
```
┌─────────────────────────────┐
│ ← Back to List              │
├─────────────────────────────┤
│                             │
│      🗺️                    │
│        Map Area             │
│      (Full screen)          │
│         📍 📍              │
│       📍     📍            │
│                             │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│ When pin tapped:            │
│ ┌─────────────────────────┐ │
│ │ Sunrise Senior Living   │ │ ← Bottom sheet (swipe up for details)
│ │ ⭐⭐⭐⭐⭐ · 2.3 mi    │ │
│ │ [View Details →]        │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Mobile Filter View (Full-screen modal)
```
┌─────────────────────────────┐
│ ✕ Filters                   │
├─────────────────────────────┤
│                             │
│ Insurance Accepted          │
│ ☑️ Medicare                 │
│ ☐ Medicaid                  │
│ ☐ VA Benefits               │
│ ☐ Private Insurance         │
│                             │
│ Star Rating                 │
│ ☑️ 5 stars                  │
│ ☐ 4+ stars                  │
│ ☐ 3+ stars                  │
│                             │
│ Availability                │
│ ☐ Beds available now        │
│                             │
│ Distance                    │
│ ━━━●━━━━━━━━ 50 mi        │
│ 5 mi              100 mi    │
│                             │
│                             │
│                             │
│ [Clear All]                 │
├─────────────────────────────┤
│ [Show 127 Facilities]       │ ← Sticky bottom button
└─────────────────────────────┘
```

---

## 🎯 Mobile UX Patterns for Elder Care

### 1. **One-Tap Actions**
```jsx
// Bad: Requires precise tap on small link
<a href="tel:555-1234">Call</a>

// Good: Large button, entire area tappable
<button className="w-full py-4 bg-green-600 text-white rounded-xl text-lg font-semibold">
  📞 Call Now: (555) 123-4234
</button>
```

### 2. **Clear Visual Hierarchy**
- **Most important info first**: Facility name, rating, availability
- **Secondary info**: Address, distance, insurance
- **Actions at bottom**: Call, directions, view details

### 3. **Progressive Disclosure**
```
Card collapsed (default):
┌─────────────────┐
│ Facility Name   │
│ ⭐⭐⭐⭐⭐     │
│ 2.3 mi · $$$   │
│ [Expand ▼]      │
└─────────────────┘

Card expanded:
┌─────────────────┐
│ Facility Name   │
│ ⭐⭐⭐⭐⭐     │
│ 2.3 mi · $$$   │
│                 │
│ Full address... │
│ Services...     │
│ Insurance...    │
│ [Call] [Map]    │
│ [Collapse ▲]    │
└─────────────────┘
```

### 4. **Smart Defaults**
- **Auto-detect location** (with permission)
- **Pre-select "Medicare"** (most common)
- **Default to 50-mile radius**

---

## 📊 Mobile Analytics to Track

1. **Tap heatmap** - Where users tap most
2. **Scroll depth** - How far down results they go
3. **Filter usage** - Which filters are most used
4. **Call-to-action clicks** - "Call Now" vs "Directions" vs "View Details"
5. **Tab switching** - List vs Map preference
6. **Form abandonment** - Where in navigator they drop off

---

## 🚀 Quick Wins (Implement First)

### 1. Results Page Mobile Tabs
**Effort**: Medium | **Impact**: High
- Users can't use 3-column layout on mobile
- Tab pattern is familiar and intuitive

### 2. Touch Target Audit
**Effort**: Low | **Impact**: High
- Scan all buttons, ensure min 44px height
- Add more padding to clickable areas

### 3. Mobile Navigation Menu
**Effort**: Low | **Impact**: Medium
- Hamburger menu with main links
- Standard pattern, quick to implement

### 4. Sticky Bottom CTA
**Effort**: Low | **Impact**: Medium
- Keep "Find Facilities" always visible
- Increases conversion on homepage

---

## 🧪 Testing Checklist

### Device Testing
- [ ] iPhone SE (smallest modern iPhone, 375px)
- [ ] iPhone 12/13/14 (standard size, 390px)
- [ ] iPhone 14 Pro Max (large, 430px)
- [ ] Android (Galaxy S21, 360px)
- [ ] Tablet (iPad, 768px)

### Functionality Testing
- [ ] All buttons are tappable (44px min)
- [ ] Forms work with mobile keyboards
- [ ] Maps zoom/pan smoothly
- [ ] Filters apply correctly
- [ ] "Call Now" opens phone dialer
- [ ] "Directions" opens maps app
- [ ] No horizontal scrolling
- [ ] Text is readable without zooming

### Performance Testing
- [ ] Loads in <3s on 3G
- [ ] Images optimized
- [ ] No layout shift (CLS)
- [ ] Smooth scrolling (60fps)

---

## 💡 Inspiration (Mobile-First Healthcare Sites)

1. **Zocdoc** - Clean facility cards, large CTAs
2. **WebMD** - Tabbed interface for complex content
3. **GoodRx** - Excellent filter UI on mobile
4. **Airbnb** - Map/List toggle pattern
5. **Google Maps** - Bottom sheet for details

---

## 📝 Next Steps

1. Create mobile-specific components:
   - `<MobileTabNav />` - For List/Map/Filter tabs
   - `<MobileFilterModal />` - Full-screen filter overlay
   - `<MobileFacilityCard />` - Optimized compact card
   - `<MobileMapView />` - With bottom sheet

2. Update existing components:
   - Add responsive classes to results page
   - Add mobile menu to Header
   - Add sticky CTA to homepage

3. Test on real devices
   - Especially with older adults if possible
   - A/B test different layouts

---

**Goal**: Make it so easy, a stressed family member can find a facility in under 2 minutes on their phone while sitting in a hospital waiting room.
