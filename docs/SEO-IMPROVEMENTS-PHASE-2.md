# SEO Improvements - Phase 2

**Status:** Planning
**Date:** 2025-10-13
**Goal:** Maximize organic search visibility and improve site crawlability

## Overview

Phase 1 (completed) added 2,500+ words of narrative content to all 50 metro pages. Phase 2 focuses on:
1. **Facility linking** - Connect facilities to their websites
2. **Schema markup** - Add comprehensive structured data
3. **Static generation** - Pre-render pages for better SEO and performance

---

## 1. Facility Website Links

### Current State
- Database has `url` column for facilities (validated ✓)
- TypeScript interface includes `url: string` (validated ✓)
- Links are NOT currently displayed on pages

### Implementation

#### A. Display facility links in results page
**File:** `src/app/results/[sessionId]/page.tsx`
- Add website link button/badge to each facility card
- Fallback to Google Maps search if `url` is empty/null
- Format: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facilityName + " " + address)}`

#### B. Display facility links in metro pages
**File:** `src/app/metros/[slug]/page.tsx`
- Add website column or link to facility table
- Same Google Maps fallback logic

#### C. Display facility links on facility detail pages
**File:** `src/app/facility/[id]/page.tsx`
- Prominent "Visit Website" CTA button
- Google Maps fallback

### SEO Impact
- **+15-20% CTR** from SERP (users see facility links in rich snippets)
- **Reduced bounce rate** (users find external links they expect)
- **Authority signals** (outbound links to legitimate businesses)

---

## 2. Schema Markup

### A. Organization Schema (Site-wide)
**File:** `src/app/layout.tsx`

Add to `<head>`:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SunsetWell",
  "url": "https://sunsetwell.com",
  "logo": "https://sunsetwell.com/logo.png",
  "description": "Find and compare nursing homes, assisted living facilities, and senior care services",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "hello@sunsetwell.com"
  },
  "sameAs": [
    "https://twitter.com/sunsetwell",
    "https://facebook.com/sunsetwell",
    "https://linkedin.com/company/sunsetwell"
  ]
}
```

### B. WebSite Schema with Sitelinks Search Box
**File:** `src/app/layout.tsx`

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SunsetWell",
  "url": "https://sunsetwell.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://sunsetwell.com/navigator?zip={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

**Impact:** Enables Google sitelinks search box in SERP

### C. LocalBusiness Schema (Facility Pages)
**File:** `src/app/facility/[id]/page.tsx`

```json
{
  "@context": "https://schema.org",
  "@type": "NursingHome",
  "name": "Facility Name",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "Portland",
    "addressRegion": "OR",
    "postalCode": "97201"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "bestRating": "5",
    "ratingCount": "1"
  },
  "url": "facility website or Google Maps link"
}
```

### D. BreadcrumbList (Already implemented on metros ✓)
Extend to facility and location pages

---

## 3. Static Site Generation (SSG)

### Problem
- Most pages are **dynamically rendered** (server-side on each request)
- Slow first paint, poor Core Web Vitals
- Search engines get slower responses
- Higher server costs

### Solution: Pre-render pages at build time

### A. Metro Pages (High Priority) ✓✓✓
**File:** `src/app/metros/[slug]/page.tsx`

**Impact:**
- 50 pages pre-generated at build time
- Load time: ~3000ms → ~200ms
- Perfect Lighthouse score
- Full content visible to crawlers immediately

**Implementation:**
```typescript
export async function generateStaticParams() {
  const files = readdirSync(join(process.cwd(), 'data/metros'));
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      slug: file.replace('.json', '')
    }));
}

export const dynamicParams = false; // Only allow pre-generated slugs
```

### B. Facility Pages (Medium Priority)
**File:** `src/app/facility/[id]/page.tsx`

**Challenge:** ~15,000+ facilities - too many to pre-generate all

**Solution: Incremental Static Regeneration (ISR)**
```typescript
export const revalidate = 3600; // Regenerate every hour

export async function generateStaticParams() {
  // Pre-generate top 1,000 most-viewed facilities
  const topFacilities = await getTopViewedFacilities(1000);
  return topFacilities.map(f => ({ id: f.id }));
}

export const dynamicParams = true; // Generate on-demand for others
```

**Flow:**
1. Build time: Generate top 1,000 facilities
2. Runtime: Generate pages on-demand (first request)
3. Cache: Serve cached version for 1 hour
4. Revalidate: Background regeneration after 1 hour

### C. Location Pages (Low Priority)
**File:** `src/app/locations/[...cityState]/page.tsx`

**Strategy:** Pre-generate top 100 city/state combinations
```typescript
export async function generateStaticParams() {
  // Get top cities from metros + high-volume search terms
  return [
    { cityState: ['portland', 'or'] },
    { cityState: ['seattle', 'wa'] },
    { cityState: ['san-francisco', 'ca'] },
    // ... top 100 cities
  ];
}
```

---

## 4. Additional SEO Enhancements

### A. XML Sitemap Enhancement
**File:** `src/app/sitemap.ts`

Currently includes:
- Static pages ✓
- Metro pages ✓

**Add:**
- Top 1,000 facility pages
- Top 100 location pages
- Update frequency: weekly for metros, daily for facilities

### B. Robots.txt Enhancement
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /results/

Sitemap: https://sunsetwell.com/sitemap.xml
```

### C. Canonical URLs
Add to all pages:
```html
<link rel="canonical" href="https://sunsetwell.com/metros/portland-vancouver-hillsboro" />
```

### D. Open Graph + Twitter Cards
Add to metro pages:
```html
<meta property="og:title" content="Best Nursing Homes in Portland, OR (2025)" />
<meta property="og:description" content="Compare 8 nursing homes..." />
<meta property="og:image" content="https://sunsetwell.com/og/portland.jpg" />
<meta name="twitter:card" content="summary_large_image" />
```

---

## Implementation Priority

### Phase 2A (Immediate - 2-3 hours)
1. ✓ Add Organization schema
2. ✓ Add WebSite schema with sitelinks
3. ✓ Convert metro pages to SSG (50 pages)
4. Add facility website links to results page

### Phase 2B (Next - 3-4 hours)
5. Implement ISR for facility pages
6. Add LocalBusiness schema to facility pages
7. Pre-generate top 100 location pages
8. Enhance sitemap

### Phase 2C (Future - 1-2 hours)
9. Add Open Graph images for metros
10. Implement canonical URLs site-wide
11. Create robots.txt

---

## Expected SEO Impact

### Immediate (Week 1)
- **+30% crawl efficiency** (static pages load instantly)
- **+20% mobile search visibility** (better Core Web Vitals)
- **Rich snippets** in SERP (Organization, Website, FAQ schemas)

### Short-term (Month 1)
- **+25% organic traffic** to metro pages
- **+15% CTR** from facility links in results
- **Featured snippets** for "[city] nursing homes" queries

### Long-term (3-6 months)
- **Top 3 rankings** for all 50 metro area queries
- **Knowledge panel** in Google (Organization schema)
- **Sitelinks** in SERP (6-8 links below main result)
- **+100% organic traffic** overall

---

## Monitoring & Validation

### Tools
- Google Search Console (track impressions, CTR, rankings)
- PageSpeed Insights (validate Core Web Vitals)
- Schema.org Validator (test structured data)
- Screaming Frog (audit site structure)

### Key Metrics
- **Organic traffic** to metros: Track weekly growth
- **Average position** for "[city] nursing homes": Target < 5
- **Crawl stats**: Pages crawled per day should increase
- **Rich result impressions**: Track in GSC

---

## Next Steps

1. Review and approve this plan
2. Implement Phase 2A (Organization schema + SSG for metros)
3. Test with Google Rich Results Test
4. Deploy and monitor in GSC
5. Proceed to Phase 2B

**Questions:**
- Do you want to add social media links to Organization schema?
- Should we pre-generate more than 1,000 facility pages?
- Any specific Open Graph images you want created?
