# SEO Improvements - Phase 3

**Status:** Planning
**Date:** 2025-10-14
**Prerequisites:** Phase 2 completed ✅ (facility links, schema markup, SSG for metros, enhanced sitemap)

## Overview

Phase 3 focuses on advanced technical SEO, content expansion, and conversion optimization to maximize organic visibility and user engagement.

---

## Completed (Phase 2 Recap)

✅ Facility website links with Google Maps fallback
✅ Organization + WebSite schema markup
✅ Static site generation for all 50 metro pages
✅ Enhanced sitemap with 176+ URLs
✅ v2.3 scoring improvements with validated claims

---

## Phase 3A: Advanced Technical SEO (High Priority)

### 1. Incremental Static Regeneration (ISR) for Facility Pages

**Current State:**
- 14,752 facility pages are dynamically rendered
- Slow TTFB and poor Core Web Vitals
- Search engines wait for server render

**Solution:**
Pre-generate top facilities + on-demand generation for others

**Implementation:**
```typescript
// src/app/facility/[id]/page.tsx

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  // Pre-generate top 1,000 most-viewed facilities based on:
  // 1. High SunsetWell scores (>= 75)
  // 2. Large metros (top 50)
  // 3. High CMS star ratings (4-5 stars)

  const topFacilities = await getTopFacilities(1000);
  return topFacilities.map(f => ({ id: f.id }));
}

export const dynamicParams = true; // Generate others on-demand
```

**Expected Impact:**
- Load time: 3000ms → 200ms for top 1,000 facilities
- Better rankings for competitive facility searches
- +20% organic traffic to facility pages

---

### 2. robots.txt Enhancement

**Current:** No robots.txt
**New:** Create strategic crawl directives

```txt
User-agent: *
Allow: /
Allow: /metros/
Allow: /facility/
Allow: /locations/

# Block dynamic/temporary pages
Disallow: /api/
Disallow: /results/

# Rate limiting for aggressive crawlers
User-agent: Googlebot
Crawl-delay: 0

User-agent: *
Crawl-delay: 1

Sitemap: https://sunsetwell.com/sitemap.xml
```

---

### 3. Canonical URLs Site-Wide

Add canonical tags to prevent duplicate content issues:

```typescript
// In layout or page metadata
canonical: `https://sunsetwell.com${pathname}`
```

**Priority pages:**
- All metros
- Top 1,000 facilities
- Location pages
- Landing pages

---

## Phase 3B: Rich Content & Snippets (Medium Priority)

### 4. Open Graph Images for Metro Pages

**Goal:** Increase social share CTR by 200%

**Implementation:**
Use Vercel OG Image Generation:

```typescript
// src/app/metros/[slug]/opengraph-image.tsx

import { ImageResponse } from 'next/og';

export default async function Image({ params }: { params: { slug: string } }) {
  const data = await getMetroData(params.slug);

  return new ImageResponse(
    (
      <div style={{ /* gradient background */ }}>
        <h1>{data.metro} Nursing Homes</h1>
        <p>{data.count} facilities | Avg Score: {data.averageScore}</p>
        <p>{data.highPerformerShare}% high-performing</p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

**Impact:**
- +200% social media CTR
- Better LinkedIn/Facebook/Twitter previews
- Brand awareness

---

### 5. FAQ Schema for Landing Pages

Add FAQ schema to key landing pages:

```typescript
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does Medicaid nursing home care cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Medicaid covers nursing home costs for eligible individuals..."
      }
    }
  ]
};
```

**Pages to add:**
- `/landing/medicaid-facilities`
- `/landing/memory-care`
- `/landing/urgent-placement`
- `/landing/va-benefits`

---

### 6. LocalBusiness Schema for Top Facilities

Enhance facility pages with richer schema:

```typescript
{
  "@context": "https://schema.org",
  "@type": "NursingHome",
  "name": "Facility Name",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": sunsetwellScore / 20, // Convert 0-100 to 0-5
    "bestRating": "5",
    "worstRating": "0",
    "ratingCount": "1"
  },
  "address": {...},
  "telephone": "...",
  "priceRange": "$$-$$$",
  "openingHours": "Mo-Su 00:00-23:59",
  "hasMap": googleMapsUrl
}
```

---

## Phase 3C: Content Expansion (Medium Priority)

### 7. State-Level Landing Pages

**Create:** 50 state landing pages

**Template:** `/states/[state]/page.tsx`

**Content:**
- Overview of nursing homes in [State]
- Average costs by metro area
- Medicaid eligibility for [State]
- Top-rated metros in [State]
- Link to metros within state

**SEO Value:**
- Target keywords: "[state] nursing homes", "nursing home costs [state]"
- Internal linking hub for metros
- +15-20% organic traffic

---

### 8. Comparison Pages

**Create:** Head-to-head facility comparisons

**URL Structure:** `/compare/[facility1-vs-facility2]`

**Auto-generate** for:
- Top facility vs #2 in same metro
- Facilities with same CMS rating but different SunsetWell scores
- Facilities in neighboring metros

**SEO Value:**
- Target "vs" queries
- High conversion (users ready to decide)
- +10% CTR from SERP

---

### 9. Blog/Resources Section

**Create:** `/resources` with evergreen content

**Initial articles:**
1. "How to Choose a Nursing Home: Complete Guide"
2. "Understanding Medicare vs Medicaid Coverage"
3. "10 Red Flags to Watch for During Facility Tours"
4. "How to File a Nursing Home Complaint"
5. "Understanding SunsetWell Scores vs CMS Stars"

**SEO Value:**
- Target informational queries
- Build topical authority
- Backlink opportunities
- +25% organic traffic from long-tail keywords

---

## Phase 3D: Performance & UX (Low Priority)

### 10. Image Optimization

**Current:** Some unoptimized images
**Solution:**
- Use Next.js Image component everywhere
- Implement AVIF format with WebP fallback
- Lazy load below-the-fold images

**Expected:** +10% PageSpeed score

---

### 11. Core Web Vitals Optimization

**Targets:**
- LCP: < 2.5s ✅ (achieved with SSG)
- FID: < 100ms (check interactivity)
- CLS: < 0.1 (check layout shifts)

**Actions:**
- Reserve space for async content
- Avoid layout shifts from maps/images
- Optimize JavaScript bundles

---

### 12. Internal Linking Strategy

**Implement:**
- Related facilities widget (same metro, similar scores)
- "Nearby metros" links
- Contextual links in narratives
- Breadcrumb navigation everywhere

**Expected:** +15% pages/session, -10% bounce rate

---

## Phase 3E: Conversion Optimization (High Value)

### 13. Enhanced Call-to-Actions

**Add to facility pages:**
- "Request Tour" button with form modal
- "Call Now" click-to-call with tracking
- "Download Checklist" lead magnet
- "Save to Compare" persistent functionality

---

### 14. Trust Signals

**Implement:**
- Badges: "100% Coverage", "v2.3 Predictive Model"
- Testimonials from families (if available)
- "As Featured In" section
- Updated date stamps on all content

---

### 15. Exit Intent Popups

**Trigger:** User about to leave without interaction

**Offer:**
- "Download Free Facility Comparison Checklist"
- "Get Email Alerts for New Quality Scores"
- "Subscribe to Newsletter"

**Expected:** +5% lead capture rate

---

## Implementation Timeline

### Week 1-2: Technical SEO
- ISR for top 1,000 facilities
- robots.txt + canonical URLs
- Performance audit + fixes

### Week 3-4: Rich Content
- OG images for metros
- FAQ schema for landing pages
- LocalBusiness schema for top facilities

### Week 5-6: Content Expansion
- State landing pages (50 pages)
- Initial blog posts (5 articles)
- Comparison pages template

### Week 7-8: Conversion Optimization
- Enhanced CTAs
- Trust signals
- Lead capture forms

---

## Success Metrics

### SEO Metrics (3 months)
- Organic traffic: +50-75%
- Indexed pages: 176 → 1,200+
- Avg position: 15 → 8
- Featured snippets: 0 → 10+

### Business Metrics
- Lead capture rate: +20%
- Pages/session: +15%
- Bounce rate: -10%
- Time on site: +25%

---

## Priority Recommendations

**Implement First:**
1. ISR for facility pages (biggest technical win)
2. robots.txt + canonical URLs (prevent issues)
3. OG images for metros (social visibility)
4. State landing pages (expand footprint)

**Can Wait:**
1. Blog section (high effort)
2. Exit intent popups (test first)
3. Comparison pages (validate demand)

---

## Tools & Monitoring

**SEO Tools:**
- Google Search Console (track indexing, CTR, position)
- Screaming Frog (audit crawlability)
- Ahrefs/SEMrush (track rankings, backlinks)
- PageSpeed Insights (Core Web Vitals)

**Analytics:**
- Google Analytics 4 (traffic, behavior)
- Hotjar (heatmaps, recordings)
- Mixpanel (conversion funnels)

---

## Next Steps

1. Review and approve Phase 3 priorities
2. Allocate development resources
3. Set up tracking infrastructure
4. Begin Week 1 implementation
5. Weekly progress reviews

**Questions:**
- Which Phase 3 components should we prioritize?
- Do we have resources for blog content creation?
- Should we implement exit intent popups or A/B test first?
- Any specific state landing pages to prioritize?

---

**Last Updated:** 2025-10-14
**Status:** Ready for review and implementation
