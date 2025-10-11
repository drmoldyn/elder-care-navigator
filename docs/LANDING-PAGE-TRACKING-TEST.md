# Landing Page Tracking Test Guide

## Testing CTA Click Tracking in Development

### Prerequisites
- Dev server running: `pnpm dev` (http://localhost:3003)
- Browser console open (F12 → Console tab)
- GTM Preview mode NOT required for basic testing (console logs work without GTM)

---

## Test 1: Memory Care Landing Page

### Navigate to Page
```
http://localhost:3003/landing/memory-care
```

### Expected Console Output (Page Load)
```
[GTM] NEXT_PUBLIC_GTM_ID not set. GTM will not load. Set in .env.local to enable.
```
*This is expected in development without GTM configured*

### Test Hero CTA Click
1. Click **"Find Memory Care Facilities →"** button in hero
2. Check browser console for:
   ```
   [Analytics] Event tracked: conversion {
     conversion_name: "landing_page_cta_click",
     conversion_value: 3,
     currency: "USD",
     landingPage: "memory-care",
     ctaPosition: "hero",
     ctaText: "Find Memory Care Facilities →",
     destination: "/navigator?condition=memory_care"
   }
   ```
3. Verify redirect to: `/navigator?condition=memory_care`

### Test Mid-Page CTA Click
1. Scroll to "How SunsetWell Works" section
2. Click **"Start Your Search Now →"** button
3. Check browser console for:
   ```
   [Analytics] Event tracked: conversion {
     conversion_name: "landing_page_cta_click",
     conversion_value: 3,
     currency: "USD",
     landingPage: "memory-care",
     ctaPosition: "mid-page",
     ctaText: "Start Your Search Now →",
     destination: "/navigator?condition=memory_care"
   }
   ```

### Test Footer CTA Click
1. Scroll to bottom final CTA card
2. Click **"Start Your Free Search →"** button
3. Check browser console for:
   ```
   [Analytics] Event tracked: conversion {
     conversion_name: "landing_page_cta_click",
     conversion_value: 3,
     currency: "USD",
     landingPage: "memory-care",
     ctaPosition: "footer",
     ctaText: "Start Your Free Search →",
     destination: "/navigator?condition=memory_care"
   }
   ```

### Non-Tracked Clicks (Should NOT Log)
- Click **"How It Works"** anchor link → No console log (expected)
- Scroll to sections → No console log (expected)

---

## Test 2: VA Benefits Landing Page

### Navigate to Page
```
http://localhost:3003/landing/va-benefits
```

### Test Hero CTA
- Click **"Search VA-Approved Facilities →"**
- Expected console log:
  ```
  landingPage: "va-benefits"
  ctaPosition: "hero"
  destination: "/navigator?insurance=VA"
  ```

### Test Mid-Page CTA
- Scroll to "How It Works" → Click **"Start Your Search →"**
- Expected console log:
  ```
  landingPage: "va-benefits"
  ctaPosition: "mid-page"
  destination: "/navigator?insurance=VA"
  ```

### Test Footer CTA
- Scroll to bottom → Click **"Find VA-Approved Facilities →"**
- Expected console log:
  ```
  landingPage: "va-benefits"
  ctaPosition: "footer"
  destination: "/navigator?insurance=VA"
  ```

### Non-Tracked Clicks
- **"Learn About VA Benefits"** anchor link → No console log
- External VA.gov links → No console log
- Phone number links → No console log (different tracking)

---

## Test 3: Urgent Placement Landing Page

### Navigate to Page
```
http://localhost:3003/landing/urgent-placement
```

### Test Hero CTA
- Click **"Find Available Beds Now →"**
- Expected console log:
  ```
  landingPage: "urgent-placement"
  ctaPosition: "hero"
  destination: "/navigator?urgent=true"
  ```

### Test Footer CTA
- Scroll to bottom → Click **"Search Available Beds →"**
- Expected console log:
  ```
  landingPage: "urgent-placement"
  ctaPosition: "footer"
  destination: "/navigator?urgent=true"
  ```

**Note:** This page only has 2 tracked CTAs (no mid-page CTA)

### Non-Tracked Clicks
- **"Common Urgent Situations"** anchor link → No console log

---

## Test 4: Medicaid Facilities Landing Page

### Navigate to Page
```
http://localhost:3003/landing/medicaid-facilities
```

### Test Hero CTA
- Click **"Search Medicaid Facilities →"**
- Expected console log:
  ```
  landingPage: "medicaid-facilities"
  ctaPosition: "hero"
  destination: "/navigator?insurance=Medicaid"
  ```

### Test Mid-Page CTA
- Scroll to "How It Works" → Click **"Start Your Search →"**
- Expected console log:
  ```
  landingPage: "medicaid-facilities"
  ctaPosition: "mid-page"
  destination: "/navigator?insurance=Medicaid"
  ```

### Test Footer CTA
- Scroll to bottom → Click **"Search Medicaid Facilities →"**
- Expected console log:
  ```
  landingPage: "medicaid-facilities"
  ctaPosition: "footer"
  destination: "/navigator?insurance=Medicaid"
  ```

### Non-Tracked Clicks
- **"Check Eligibility"** anchor link → No console log
- External resource links (Medicaid.gov, etc.) → No console log

---

## Hero Image Visual Verification

### Memory Care (`/landing/memory-care`)
- **Hero Image:** hero-1.jpg with lavender/sky-blue/sunset-orange gradient overlay
- **Text Color:** White (H1) and white/90 (body)
- **Badge:** Lavender background with dark text
- **Readability:** Text should be clearly visible over image

### VA Benefits (`/landing/va-benefits`)
- **Hero Image:** hero-2.jpg with sky-blue/sunset-gold/lavender gradient overlay
- **Text Color:** White (H1) and white/90 (body)
- **Badge:** Sky-blue background with dark text
- **Readability:** Text should be clearly visible over image

### Urgent Placement (`/landing/urgent-placement`)
- **Hero Image:** hero-3.jpg with sunset-orange/sunset-gold/sky-blue gradient overlay
- **Text Color:** White (H1), white/90 (body), white/80 (small text)
- **Badge:** Sunset-orange background with dark text
- **Readability:** Text should be clearly visible over image

### Medicaid Facilities (`/landing/medicaid-facilities`)
- **Hero Image:** hero-4.jpg with sunset-gold/lavender/sky-blue gradient overlay
- **Text Color:** White (H1) and white/90 (body)
- **Badge:** Sunset-gold background with dark text
- **Readability:** Text should be clearly visible over image

---

## Testing with GTM Preview (Production Testing)

### Setup GTM (When Ready)
1. Create GTM account at https://tagmanager.google.com
2. Get Container ID (format: GTM-XXXXXXX)
3. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
   ```
4. Restart dev server: `pnpm dev`

### Enable GTM Preview
1. In GTM dashboard, click **Preview** (top right)
2. Enter: `http://localhost:3003`
3. Click **Connect**
4. New tab opens with GTM debugger

### Test in GTM Preview Mode

#### Navigate to Landing Page
```
http://localhost:3003/landing/memory-care
```

#### Click CTA Button
GTM Preview should show:
- **Tag Manager Loaded**
- **Event Fired:** `conversion`
- **Data Layer Variables:**
  - `event`: "conversion"
  - `conversion_name`: "landing_page_cta_click"
  - `conversion_value`: 3
  - `currency`: "USD"
  - `landingPage`: "memory-care"
  - `ctaPosition`: "hero"
  - `ctaText`: "Find Memory Care Facilities →"
  - `destination`: "/navigator?condition=memory_care"

#### Verify in dataLayer
In GTM Preview → **Data Layer** tab:
```javascript
{
  event: "conversion",
  conversion_name: "landing_page_cta_click",
  conversion_value: 3,
  currency: "USD",
  landingPage: "memory-care",
  ctaPosition: "hero",
  ctaText: "Find Memory Care Facilities →",
  destination: "/navigator?condition=memory_care"
}
```

---

## Production Testing (After Deployment)

### GA4 Real-Time Report
1. Go to Google Analytics → Reports → Real-time
2. Navigate to landing page on live site
3. Click CTA button
4. Verify event appears in real-time report:
   - **Event Name:** `conversion`
   - **Event Parameters:** `conversion_name`, `conversion_value`, `landingPage`, etc.

### Google Ads Conversion Tracking
1. After GTM tags configured with Google Ads conversion tracking
2. Click CTA on live landing page
3. Wait 24-48 hours for data
4. Check Google Ads → Tools → Conversions
5. Verify `landing_page_cta_click` conversions recorded
6. Verify value = $3 per conversion

---

## Troubleshooting

### Console Shows: "[Analytics] dataLayer not available"
**Cause:** GTM not loaded (NEXT_PUBLIC_GTM_ID not set)
**Fix:** This is expected in development. Tracking still works via console logs. For full testing, add GTM_ID to .env.local

### No Console Logs on CTA Click
**Possible Causes:**
1. Browser console not open → Open F12 → Console tab
2. Console filter hiding messages → Clear console filters
3. JavaScript error → Check console for red errors
4. Wrong button clicked → Ensure clicking tracked CTA, not anchor link

**Debug Steps:**
1. Open console before clicking
2. Click CTA button
3. Check for `[Analytics] Event tracked:` message
4. If missing, check for JavaScript errors

### Redirect Happens But No Console Log
**Cause:** onClick fires after navigation starts
**Fix:** This is normal behavior. Check console immediately when clicking (log appears briefly before redirect)

**Alternative:** Disable redirect temporarily to see logs:
1. Edit `TrackedCTAButton` component
2. Add `e.preventDefault()` in onClick
3. Click button → Console log appears without redirect
4. Remove preventDefault after testing

### Hero Image Not Showing
**Possible Causes:**
1. Image path incorrect → Check `/public/images/hero/` directory
2. Image quality warning → Safe to ignore (Next.js 16 requirement)
3. CSS z-index issue → Hero image should be z-0, content z-10

**Debug Steps:**
1. Check browser Network tab for 404 on image
2. Verify image exists: `ls public/images/hero/hero-1.jpg`
3. Check CSS: Image should have `position: absolute` and `z-index: 0`

### Text Not Readable Over Image
**Cause:** Gradient overlay not dark enough
**Fix:** Increase opacity in gradient overlay:
```tsx
<div className="absolute inset-0 bg-gradient-to-br from-lavender/95 via-sky-blue/90 to-sunset-orange/85" />
```
(Increased from /90, /80, /70)

---

## Test Checklist

### Development Testing (No GTM Required)
- [ ] Memory Care hero CTA logs to console
- [ ] Memory Care mid-page CTA logs to console
- [ ] Memory Care footer CTA logs to console
- [ ] VA Benefits hero CTA logs to console
- [ ] VA Benefits mid-page CTA logs to console
- [ ] VA Benefits footer CTA logs to console
- [ ] Urgent Placement hero CTA logs to console
- [ ] Urgent Placement footer CTA logs to console
- [ ] Medicaid Facilities hero CTA logs to console
- [ ] Medicaid Facilities mid-page CTA logs to console
- [ ] Medicaid Facilities footer CTA logs to console
- [ ] All anchor links do NOT log (expected)
- [ ] All external links do NOT log (expected)

### Visual Verification
- [ ] Memory Care hero image loads with gradient overlay
- [ ] Memory Care text is white and readable
- [ ] VA Benefits hero image loads with gradient overlay
- [ ] VA Benefits text is white and readable
- [ ] Urgent Placement hero image loads with gradient overlay
- [ ] Urgent Placement text is white and readable
- [ ] Medicaid Facilities hero image loads with gradient overlay
- [ ] Medicaid Facilities text is white and readable
- [ ] All badges have proper backgrounds and contrast
- [ ] All CTAs have proper hover states

### Functional Verification
- [ ] All CTAs redirect to correct navigator URL with query params
- [ ] Memory Care → `/navigator?condition=memory_care`
- [ ] VA Benefits → `/navigator?insurance=VA`
- [ ] Urgent Placement → `/navigator?urgent=true`
- [ ] Medicaid Facilities → `/navigator?insurance=Medicaid`

### GTM Preview Testing (When GTM Configured)
- [ ] GTM Preview connects to localhost:3003
- [ ] CTA clicks fire `conversion` event in GTM debugger
- [ ] dataLayer shows all tracking parameters
- [ ] All 11 tracked CTAs work in GTM Preview

### Production Testing (After Deployment)
- [ ] Real-time GA4 events appear for CTA clicks
- [ ] Google Ads conversions recorded (24-48hr delay)
- [ ] Conversion value = $3 per landing page CTA click
- [ ] Landing page source/medium tracked in GA4

---

## Summary

**Total Tracked CTAs:** 11
- Memory Care: 3
- VA Benefits: 3
- Urgent Placement: 2
- Medicaid Facilities: 3

**Tracking Data Captured:**
- Landing page slug
- CTA position (hero/mid-page/footer)
- CTA text
- Destination URL with query params
- Conversion value: $3

**Events in GTM:**
- Event name: `conversion`
- Conversion name: `landing_page_cta_click`
- Conversion value: 3 (USD)

**Ready for:** Google Ads campaign launch with full conversion attribution!
