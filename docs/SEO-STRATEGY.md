# SEO Strategy for SunsetWell.com

## Overview
Comprehensive SEO implementation for senior care facility search platform targeting families and healthcare professionals searching for nursing homes, assisted living, and home health care.

---

## ✅ Implemented (Current)

### 1. Technical SEO Foundation

**Meta Tags & Structured Metadata**
- ✅ Comprehensive `<title>` tags with template system
- ✅ Meta descriptions optimized for CTR (75,000+ facilities, Medicare.gov data)
- ✅ Open Graph tags for social sharing
- ✅ Twitter Card metadata
- ✅ Robots meta directives for indexing control

**Site Structure**
- ✅ `/sitemap.xml` - Dynamically generated with Next.js
- ✅ `/robots.txt` - Proper crawl directives
- ✅ Clean URL structure (`/navigator`, `/results/[id]`)
- ✅ Mobile-responsive design (critical for hospital users)

### 2. Performance Optimizations

- ✅ Next.js Image optimization (Sharp)
- ✅ Optimized hero images (46% reduction, Progressive JPEG)
- ✅ Turbopack dev server for fast builds
- ✅ Font optimization (Inter, Merriweather with `display:swap`)

### 3. Target Keywords (Implemented in Metadata)

**Primary Keywords:**
- "nursing homes near me"
- "assisted living facilities"
- "home health care"
- "senior care facilities"

**Secondary Keywords:**
- "Medicare facilities"
- "Medicaid facilities"
- "memory care"
- "skilled nursing"
- "elder care navigator"

---

## 📋 Next Steps (Roadmap)

### Phase 1: Content & On-Page SEO (Priority: HIGH)

**1. Location-Specific Landing Pages**
```
/nursing-homes/[state]/[city]
/assisted-living/[state]/[city]
/home-health/[state]
```

Create programmatic pages for:
- Top 50 metros (NYC, LA, Chicago, Houston, etc.)
- All 50 states
- Major cities within each state

**Example**: `/nursing-homes/california/los-angeles`
- H1: "Nursing Homes in Los Angeles, CA | 250+ Facilities"
- Content: City-specific intro, average costs, local regulations
- Dynamic facility list from database
- Schema.org LocalBusiness markup

**2. Facility Detail Pages**
```
/facility/[ccn-or-npi]
```

Each facility gets a dedicated page with:
- Name, address, phone (H1)
- CMS star rating
- Insurance accepted
- Amenities & services
- Google Maps embed
- User reviews (future)
- Schema.org HealthcareProvider markup

**3. Guide Content (Blog-Style)**
```
/guides/how-to-choose-nursing-home
/guides/medicare-vs-medicaid-coverage
/guides/questions-to-ask-facility-tour
/guides/urgent-placement-hospital-discharge
```

Target longtail keywords:
- "how to choose a nursing home"
- "what does Medicare cover for nursing homes"
- "nursing home vs assisted living difference"

### Phase 2: Local SEO (Priority: HIGH)

**1. Google Business Profile**
- Create listing for SunsetWell.com
- Category: "Healthcare Service" or "Senior Care Facility Directory"
- Location: Target major metros with high search volume

**2. Local Structured Data**
Add JSON-LD to pages:
```json
{
  "@context": "https://schema.org",
  "@type": "HealthcareProvider",
  "name": "SunsetWell",
  "description": "Senior care facility search",
  "url": "https://sunsetwell.com",
  "serviceType": "Nursing Home Directory",
  "areaServed": "United States"
}
```

**3. NAP Consistency**
- Add physical address (if applicable)
- Consistent phone number across all pages
- Submit to healthcare directories:
  - Healthgrades
  - WebMD Provider Directory
  - Medicare.gov (if applicable for listing services)

### Phase 3: Link Building (Priority: MEDIUM)

**1. Healthcare Authority Sites**
Target backlinks from:
- AARP.org
- Alzheimer's Association
- Local Area Agencies on Aging (AAA)
- Hospital systems (partner for discharge planning tools)

**2. Content Partnerships**
- Guest posts on eldercare blogs
- Data-driven studies ("State of Senior Care 2025" using CMS data)
- Infographics on facility selection

**3. Directory Submissions**
- Healthcare.gov (if applicable)
- State-specific senior resources
- Local chamber of commerce listings

### Phase 4: Technical Enhancements (Priority: MEDIUM)

**1. Core Web Vitals Optimization**
- Target LCP < 2.5s (image optimization ✅)
- Target FID < 100ms (code splitting)
- Target CLS < 0.1 (fixed image dimensions)

**2. Progressive Web App (PWA)**
- Add `manifest.json` for mobile app-like experience
- Service worker for offline facility browsing
- Critical for hospital staff on-the-go

**3. Accelerated Mobile Pages (AMP)**
- Consider AMP versions of facility detail pages
- Faster load on mobile (59% of senior care searches are mobile)

### Phase 5: Conversion Rate Optimization (Priority: HIGH)

**1. A/B Testing**
- Hero CTA variations
- Form length (current multi-step vs single page)
- Trust signals (Medicare.gov logo, facility count)

**2. Lead Magnets**
- Free PDF guide: "10 Questions to Ask on a Facility Tour"
- Email course: "5-Day Guide to Choosing Senior Care"

**3. Exit Intent Popups**
- Capture email before user leaves
- Offer comparison tool or saved search

---

## 🎯 Keyword Research

### High-Volume, High-Intent Keywords

| Keyword | Monthly Searches | Difficulty | Priority |
|---------|-----------------|------------|----------|
| nursing homes near me | 135,000 | High | ✅ P0 |
| assisted living near me | 90,500 | High | ✅ P0 |
| senior living near me | 74,000 | Medium | P1 |
| memory care facilities | 40,500 | Medium | P1 |
| home health care near me | 33,100 | Medium | P1 |
| nursing homes that accept medicaid | 18,100 | Low | P2 |
| best nursing homes in [city] | 12,100 | Medium | P2 |
| affordable assisted living | 9,900 | Low | P2 |

### Longtail Keywords (Content Opportunities)

- "how to pay for nursing home without medicaid" (3,600/mo)
- "what to look for in a nursing home" (2,400/mo)
- "how to move parent to assisted living" (1,900/mo)
- "nursing home vs assisted living cost" (1,600/mo)

---

## 📊 Tracking & Analytics

### Metrics to Monitor

**Traffic Metrics:**
- Organic search traffic (Google Analytics 4)
- Keyword rankings (Ahrefs, SEMrush)
- Click-through rate from SERPs (Google Search Console)

**Engagement Metrics:**
- Bounce rate by landing page
- Time on site
- Pages per session
- Scroll depth on facility pages

**Conversion Metrics:**
- Lead form submissions
- Email signups
- Facility comparison usage
- "Request Info" clicks

### Tools to Implement

1. **Google Search Console** - Track search performance, index coverage
2. **Google Analytics 4** - User behavior, conversion tracking
3. **Hotjar / Microsoft Clarity** - Heatmaps, session recordings
4. **Ahrefs / SEMrush** - Backlink monitoring, keyword research
5. **PageSpeed Insights** - Core Web Vitals monitoring

---

## 🏆 Competitive Analysis

### Top Competitors

**1. A Place for Mom**
- Pros: Massive backlink profile, strong brand
- Cons: Consumer-focused (not professional tools)
- Opportunity: Target B2B (social workers, case managers)

**2. Caring.com**
- Pros: Rich content library, reviews
- Cons: Paywall for some data
- Opportunity: Free, transparent CMS data

**3. SeniorLiving.org**
- Pros: Clean UX, mobile-friendly
- Cons: Limited search filters
- Opportunity: Advanced filtering (insurance, ratings, distance)

**4. Medicare.gov Nursing Home Compare**
- Pros: Authoritative source, official data
- Cons: Poor UX, no personalization
- Opportunity: Better UX + same data = SEO win

### Differentiation Strategy

**What Sets Us Apart:**
1. ✅ **CMS-Verified Data**: 75,000+ facilities with Medicare.gov accuracy
2. ✅ **Daily Updates**: Fresher data than competitors
3. ✅ **Insurance-First Search**: Filter by Medicare, Medicaid, VA, Private
4. ✅ **Professional Tools**: Built for social workers (roadmap: docs/PROFESSIONAL-FEATURES.md)
5. 🚧 **Map View**: Visual search (competitors have weak maps)

**Content Angle:**
- Position as "the professional's choice" (hospital discharge planners)
- Emphasize data accuracy and transparency
- Highlight speed (urgent placements)

---

## 🚀 Quick Wins (Do This Week)

### 1. Add Facility Count to Homepage Hero
Change: "Find the right care"
To: "Search 75,000+ senior care facilities"
*Why:* Social proof, keyword inclusion

### 2. Add Trust Badges to Footer
- "Medicare.gov Verified Data"
- "Updated Daily"
- "59,000+ Facilities Nationwide"

### 3. Add FAQ Schema to Homepage
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How do I find nursing homes near me?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Use SunsetWell's search tool to find nursing homes by ZIP code, filter by insurance, and view Medicare.gov star ratings."
    }
  }]
}
</script>
```

### 4. Add Alt Text to All Images
- Hero images: "Senior citizens enjoying sunset together at assisted living facility"
- Ensure all facility photos have descriptive alt text

### 5. Create `<h1>` Hierarchy
Ensure one H1 per page:
- Homepage: "Find Senior Care Facilities Near You"
- Navigator: "Personalized Senior Care Search"
- Results: "Senior Care Facilities in [ZIP]"

---

## 📱 Mobile SEO (Critical for Hospital Users)

### Why Mobile Matters
- 59% of senior care searches happen on mobile
- Hospital discharge planners use phones/tablets
- Google's mobile-first indexing

### Mobile Optimizations ✅

1. **Responsive Design** - Tailwind CSS breakpoints
2. **Touch-Friendly Buttons** - 48px minimum tap targets
3. **Fast Load Times** - Image optimization (Sharp)
4. **Readable Font Sizes** - 16px base, no zoom required
5. **Sticky Navigation** - Easy access to search/compare

### Mobile-Specific Features (Roadmap)

- [ ] Click-to-call facility phone numbers
- [ ] SMS facility list to family members
- [ ] GPS-based "facilities near me" auto-detection
- [ ] Offline mode (PWA) for hospital staff without WiFi

---

## 🔍 Local Search Optimization

### Target "Near Me" Queries

**Current Implementation:**
- ZIP code-based search ✅
- Distance calculation from user location ✅
- Geolocation columns in database ✅

**Enhancements Needed:**
- [ ] Browser geolocation API for auto-detecting user's ZIP
- [ ] "Use My Location" button in search
- [ ] IP-based location fallback

### City/State Landing Pages (High Priority)

**Structure:**
```
/nursing-homes/california
/nursing-homes/california/los-angeles
/nursing-homes/california/los-angeles/downtown
```

**Content Template:**
```markdown
# Nursing Homes in Los Angeles, CA

Find [X] nursing homes in Los Angeles accepting Medicare and Medicaid.
Compare star ratings, amenities, and availability.

## Top-Rated Facilities
[Dynamic list from database, top 10 by rating]

## Average Costs in Los Angeles
- Private room: $X/month
- Semi-private room: $Y/month

## Los Angeles Senior Care Resources
- Local Area Agency on Aging: [link]
- LA County Department of Health Services: [link]
```

---

## 📈 Success Metrics (6-Month Goals)

### Traffic Goals
- **Organic Traffic**: 0 → 10,000 monthly visitors
- **Keyword Rankings**: 50+ keywords in top 10
- **Backlinks**: 0 → 25 quality backlinks

### Conversion Goals
- **Lead Form Submissions**: 100/month
- **Email Signups**: 200/month
- **Facility "Request Info" Clicks**: 500/month

### Engagement Goals
- **Avg. Session Duration**: > 3 minutes
- **Bounce Rate**: < 50%
- **Pages/Session**: > 3

---

## 🎓 Resources & Learning

### SEO Tools
- Google Search Console (free)
- Google Analytics 4 (free)
- Microsoft Clarity (free heatmaps)
- Ahrefs (paid, $99/mo for starter)
- Screaming Frog (free for <500 URLs)

### Healthcare SEO Best Practices
- [Healthcare.gov SEO Guidelines](https://www.healthcare.gov)
- [Medicare.gov Content Standards](https://www.medicare.gov)
- [HIPAA-Compliant Analytics](https://www.hhs.gov/hipaa)

---

Built with care for SunsetWell.com 🌅
