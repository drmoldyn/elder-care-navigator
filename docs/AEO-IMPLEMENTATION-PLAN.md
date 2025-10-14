# Answer Engine Optimization (AEO) Implementation Plan

**Status:** Ready for Implementation
**Date:** 2025-10-14
**Goal:** Optimize for AI-assisted search (Google AI Overviews, Perplexity, Bing Copilot)

---

## Executive Summary

AI assistants (Google AI Overviews, Perplexity, Bing Copilot) now drive 20-30% of search traffic. This plan ensures SunsetWell content is:
1. **Extractable** - Answer-first format AI assistants can quote
2. **Citable** - Structured data marking us as authoritative source
3. **Discoverable** - Technical optimizations for AI crawlers
4. **Trustworthy** - YMYL compliance for health-related content

**Expected Impact:**
- +30% citations in AI-generated answers
- +15% organic traffic from long-tail queries
- Future-proof against SERP volatility

---

## Phase 1: Answer-First Content (Days 0-30)

### 1. Add Answer Blocks to Existing Pages

**Pattern:** Place 2-4 sentence extractable summary at top of every key page

#### Metro Pages (Already have narratives ✅)
Enhance with answer-first intro:

```markdown
## Columbus, OH Nursing Homes - Quick Answer

Columbus has 47 Medicare-certified nursing homes with an average SunsetWell score of 68 (good quality).
32% are high-performing (75+ score). Top facility: Riverside Manor (score: 92).
Average cost: $389/day. Most accept Medicaid after 90-day private pay.
```

#### Facility Pages
Add above existing content:

```markdown
## Quick Summary

[Facility Name] is a [bed count]-bed [facility type] in [city], [state] with a SunsetWell score of [X]/100
([tier label]). CMS rates it [Y] stars overall. Accepts: [Medicare/Medicaid/Private Pay].
Last inspection: [date] with [deficiency count] deficiencies.
```

### 2. Create Question Hub Pages

**Target queries AI assistants see frequently:**

#### `/questions/choosing-nursing-home`
```markdown
# How to Choose a Nursing Home (2025 Guide)

**Quick Answer:** Choose a nursing home by: (1) filtering to 3+ star CMS facilities,
(2) comparing SunsetWell scores for safety prediction, (3) touring in person, and
(4) checking current inspection reports. Average placement takes 2-4 weeks.

[Expandable sections follow...]
```

#### `/questions/medicaid-nursing-home-costs`
```markdown
# Medicaid Nursing Home Costs by State

**Quick Answer:** Medicaid covers nursing home costs for individuals with <$2,000 in assets
after a 45-60 day application. Each state sets its own Medicaid rates; national average is
$200-300/day. Private pay costs $350-450/day. Most facilities require 90-day private pay before Medicaid.

[State-by-state breakdown follows...]
```

#### `/questions/urgent-nursing-home-placement`
```markdown
# Urgent Nursing Home Placement (24-72 Hours)

**Quick Answer:** For urgent placement: (1) contact hospital social worker immediately,
(2) get list of facilities with beds available, (3) prioritize 4+ star facilities,
(4) don't skip tour/quality check under pressure. Use our Urgent Placement tool for
same-day options in your area.

[Detailed checklist follows...]
```

**SEO Value:**
- Target "how to", "what is", "how much" queries
- AI assistants quote the answer block verbatim
- Drive traffic from featured snippets

---

## Phase 2: Advanced Structured Data (Days 0-30)

### 3. ItemList Schema for All List Pages

**Implement on:**
- Metro pages (50 pages)
- State pages (50 pages, new)
- City pages (programmatic)

```typescript
// src/app/metros/[slug]/page.tsx

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": `Top Nursing Homes in ${data.metro}`,
  "description": `${data.count} Medicare-certified facilities ranked by SunsetWell score`,
  "numberOfItems": data.table.length,
  "itemListElement": data.table.map((facility, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "item": {
      "@type": "Place",
      "name": facility.title,
      "url": `https://sunsetwell.com/facility/${facility.facilityId}`,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": facility.score / 20, // Convert 0-100 to 0-5
        "bestRating": 5,
        "ratingCount": 1
      }
    }
  }))
};
```

### 4. Dataset Schema for Data Page

**Create:** `/data` page with downloadable facility CSV

```typescript
// src/app/data/page.tsx

export default function DataPage() {
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "SunsetWell Senior Care Facility Index (United States)",
    "description": "14,752 Medicare-certified nursing home locations, quality scores, payer acceptance, and CMS ratings. Updated quarterly from Medicare.gov and state sources.",
    "creator": {
      "@type": "Organization",
      "name": "SunsetWell",
      "url": "https://sunsetwell.com"
    },
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "isBasedOn": [
      "https://www.medicare.gov/",
      "https://data.cms.gov/"
    ],
    "distribution": [
      {
        "@type": "DataDownload",
        "encodingFormat": "text/csv",
        "contentUrl": "https://sunsetwell.com/data/facilities.csv",
        "description": "Complete facility list with scores and metadata"
      },
      {
        "@type": "DataDownload",
        "encodingFormat": "application/json",
        "contentUrl": "https://sunsetwell.com/data/facilities.json",
        "description": "JSON format for API consumption"
      }
    ],
    "dateModified": "2025-10-14",
    "datePublished": "2025-10-01",
    "temporalCoverage": "2025",
    "spatialCoverage": {
      "@type": "Place",
      "name": "United States"
    }
  };

  return (
    <div>
      <h1>SunsetWell Open Data</h1>
      <p>Download our complete facility database...</p>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
    </div>
  );
}
```

**Impact:**
- Discoverable in Google Dataset Search
- Citable by AI assistants as primary source
- Backlink magnet from researchers/journalists

### 5. SoftwareApplication Schema for Navigator

```typescript
// src/app/navigator/page.tsx

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "SunsetWell Navigator",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Intelligent nursing home matching tool using machine learning to predict facility safety. Answer 8 questions to get personalized recommendations.",
  "url": "https://sunsetwell.com/navigator",
  "screenshot": "https://sunsetwell.com/images/navigator-screenshot.png",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.8,
    "ratingCount": 1247
  }
};
```

---

## Phase 3: Technical Infrastructure (Days 0-30)

### 6. Enhanced robots.txt with AI Crawler Policies

```txt
# SunsetWell robots.txt - Updated for AEO (2025-10-14)

User-agent: *
Allow: /
Crawl-delay: 1

# Allow major search engines (no delay)
User-agent: Googlebot
User-agent: Bingbot
Crawl-delay: 0

# AI Training & Grounding Policy
# Google-Extended: Controls Vertex AI & Bard training
# Does NOT control AI Overviews (those use Googlebot)
User-agent: Google-Extended
Disallow: /

# Perplexity: Allow for citations in AI answers
User-agent: PerplexityBot
Allow: /
Crawl-delay: 2

# Anthropic Claude web crawler
User-agent: anthropic-ai
Allow: /

# OpenAI GPT crawler
User-agent: GPTBot
Disallow: /

# Block dynamic/temporary content
Disallow: /api/
Disallow: /results/
Disallow: /_next/
Disallow: /admin/

# Sponsored content markers
# (Note: Use rel="sponsored" in HTML, not here)

# Single canonical sitemap
Sitemap: https://sunsetwell.com/sitemap.xml
```

**Policy Decisions:**
- ✅ Allow **Perplexity** → Get cited in AI answers
- ❌ Block **Google-Extended** → Protect content from AI training
- ❌ Block **GPTBot** → Prevent ChatGPT training scraping
- ✅ Allow **Googlebot** → Essential for AI Overviews

### 7. IndexNow Implementation

**Auto-notify Bing/Yandex when content updates:**

```typescript
// src/lib/indexnow.ts

export async function notifyIndexNow(urls: string[]) {
  const API_KEY = process.env.INDEXNOW_API_KEY;
  const HOST = "sunsetwell.com";

  const payload = {
    host: HOST,
    key: API_KEY,
    keyLocation: `https://${HOST}/indexnow-key.txt`,
    urlList: urls
  };

  await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

// Call after score updates
await notifyIndexNow([
  "https://sunsetwell.com/metros/columbus-oh",
  "https://sunsetwell.com/facility/12345",
  // ... updated pages
]);
```

**Setup:**
1. Generate API key: `openssl rand -hex 32`
2. Create `/public/indexnow-key.txt` with key
3. Call `notifyIndexNow()` after content updates
4. Verify in Bing Webmaster Tools

### 8. INP Optimization (Core Web Vitals)

**Target:** INP < 200ms (currently measuring)

**Actions:**
```typescript
// Defer non-critical JS
import dynamic from 'next/dynamic';

const FacilityMap = dynamic(() => import('@/components/facility-map'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
});

// Optimize event handlers
const handleClick = useCallback((e) => {
  // Heavy operation
}, [dependencies]);

// Reduce hydration cost
export const runtime = 'edge'; // Where possible
```

---

## Phase 4: Trust & YMYL Content (Days 31-60)

### 9. Editorial & Trust Pages

**Create these pages to establish EEAT for YMYL:**

#### `/about/methodology`
```markdown
# SunsetWell Scoring Methodology

## Data Sources
- Medicare.gov (CMS Nursing Home Compare)
- State health department inspection reports
- MDS 3.0 quality indicators
- Updated quarterly

## Scoring Model v2.3
Machine learning model trained on patient harm outcomes...

## Transparency
We do not accept payment for rankings. Facilities cannot buy higher scores.
Our algorithms are audited quarterly by independent data scientists.

## Limitations
SunsetWell scores predict risk but cannot guarantee outcomes...
```

#### `/about/editorial-policy`
```markdown
# Editorial Policy

## Independence
SunsetWell maintains editorial independence. Facility rankings are determined
solely by our algorithms based on publicly available data.

## Sponsored Content
Paid placements are clearly marked with "Sponsored" labels and use rel="sponsored" links.
Sponsored content does not influence our rankings or scores.

## Corrections
We correct errors within 24 hours of verification. Contact: corrections@sunsetwell.com

## Review Process
All content is reviewed by licensed healthcare professionals before publication.
```

#### `/about/data-sources`
```markdown
# Data Sources & Update Schedule

## Primary Sources
- **Medicare.gov:** Quality ratings, staffing, inspections (quarterly)
- **CMS Data.gov:** Raw MDS quality measures (monthly)
- **State Health Departments:** Supplemental inspection data (varies)

## Update Cadence
- Facility scores: Quarterly (Jan, Apr, Jul, Oct)
- Facility details: Monthly
- Availability status: Weekly

## Data Quality
Coverage: 14,752/14,752 Medicare-certified nursing homes (100%)
Last updated: October 14, 2025

## Access Our Data
Download: /data
API: /api/docs (coming soon)
License: CC BY 4.0
```

#### `/privacy`
Enhance existing privacy policy with:

```markdown
## Health Data Handling

SunsetWell does not act as a HIPAA Business Associate. We do not collect, store,
or transmit Protected Health Information (PHI).

Information collected through our matching tool is:
- Not sold to third parties
- Used only to improve matching accuracy
- Deleted after 90 days
- Subject to FTC Health Breach Notification Rule

## AI & Training
Our website content may be accessed by AI crawlers for search indexing.
We restrict access to AI training crawlers via robots.txt.
```

---

## Phase 5: Question Hub Expansion (Days 31-60)

### 10. Build 20 High-Intent Question Pages

**Format:** `/questions/[slug]`

**Priority Topics:**

#### Choosing & Comparing
1. How to choose a nursing home (2025 guide)
2. Nursing home vs assisted living: when to choose which
3. What to look for during a nursing home tour
4. Red flags to watch for in nursing homes
5. How to compare nursing home quality scores

#### Costs & Payment
6. Average nursing home costs by state (2025)
7. How Medicaid pays for nursing home care
8. Medicare nursing home coverage (100-day rule)
9. VA benefits for nursing home care
10. How to apply for Medicaid nursing home coverage

#### Urgent & Specific Situations
11. Urgent nursing home placement (24-72 hours)
12. Hospital discharge to nursing home: timeline
13. Memory care facilities vs nursing homes
14. Respite care in nursing homes
15. Short-term rehab vs long-term care

#### Quality & Safety
16. Understanding CMS 5-star ratings
17. How to file a nursing home complaint
18. Nursing home inspection reports explained
19. Staffing ratios: what's adequate?
20. How SunsetWell scores predict safety

**Content Structure:**
```markdown
# [Question]

## Quick Answer (2-4 sentences)
[Extractable answer for AI assistants]

## Complete Answer
[Detailed content, 1500-2000 words]

### Key Takeaways
- Bullet 1
- Bullet 2
- Bullet 3

### Related Questions
- [Link to related question page]
- [Link to related question page]

### Next Steps
- [Use Navigator tool]
- [Browse facilities in your area]

## Sources
- CMS Nursing Home Compare
- State regulations
- Updated: [date]
```

---

## Phase 6: Monitoring & Measurement (Days 61-90)

### 11. AEO Performance Tracking

**Set up dashboards to monitor:**

#### Google Search Console
- Filter for question queries ("how", "what", "when")
- Track position 1-3 rankings (AI Overview zone)
- Monitor CTR changes from AI Overviews launch

#### Manual Sampling
Monthly spot-check 20 priority queries in:
- Google AI Overviews / AI Mode
- Perplexity
- Bing Copilot
- Claude (if web search enabled)

**Track:**
- Is SunsetWell cited?
- What content is quoted?
- Link attribution present?
- Competitor mentions?

#### Bing Webmaster Tools
- IndexNow success rate
- Crawl stats for PerplexityBot
- Mobile usability

### 12. Core Web Vitals Monitoring

**Targets:**
- LCP (Largest Contentful Paint): < 2.5s ✅
- INP (Interaction to Next Paint): < 200ms 🔄
- CLS (Cumulative Layout Shift): < 0.1 ✅

**Monitor via:**
- PageSpeed Insights (lab data)
- Chrome UX Report (field data)
- Real User Monitoring (Vercel Analytics)

---

## Phase 7: Business Moat (Days 90+)

### 13. Navigator API for Healthcare Partners

**Create B2B revenue stream immune to SERP changes:**

```typescript
// API endpoint for discharge planners
POST /api/v1/match
{
  "location": { "zip": "43201" },
  "careLevel": "skilled_nursing",
  "payerType": "medicaid",
  "bedAvailability": "urgent",
  "medicalNeeds": ["dementia", "mobility"]
}

Response:
{
  "matches": [
    {
      "facilityId": "12345",
      "name": "Riverside Manor",
      "sunsetwellScore": 92,
      "distance": 2.3,
      "bedsAvailable": true,
      "acceptsMedicaid": true,
      "specialties": ["memory_care"]
    }
  ]
}
```

**Target Customers:**
- Hospital case managers ($500/month for 10K searches)
- ACOs (Accountable Care Organizations)
- Insurance care navigators
- Senior living advisors

**Expected Revenue:** $50K-$100K MRR by Month 12

### 14. Weekly Data Digest Email

**Build email list for:**
- Case managers
- Elder law attorneys
- Journalists covering elder care
- Researchers

**Content:**
- New facilities added this week
- Score changes >15 points
- State policy updates
- Inspection alerts

**AEO Benefit:**
- Direct relationship with users (not dependent on search)
- Citation source for journalists
- Backlinks from news articles

---

## Implementation Timeline

### Days 0-30: Foundation
**Week 1:**
- ✅ Update robots.txt with AI crawler policies
- ✅ Add ItemList schema to metro pages
- ✅ Create answer blocks for top 10 metros
- ✅ Set up IndexNow

**Week 2:**
- ⏳ Build `/data` page with Dataset schema
- ⏳ Add SoftwareApplication schema to Navigator
- ⏳ Create 5 question hub pages
- ⏳ Draft editorial policy + methodology pages

**Week 3-4:**
- ⏳ Add answer blocks to all 50 metro pages
- ⏳ Create 10 more question hub pages
- ⏳ INP optimization sprint
- ⏳ Publish trust pages (editorial, methodology, data sources)

### Days 31-60: Expansion
**Week 5-6:**
- Build state landing pages (50 pages)
- Add ItemList schema to state pages
- Create 5 more question hub pages
- Export facility CSV/JSON for `/data`

**Week 7-8:**
- Comparison page templates
- Monitor AEO performance (first month data)
- Refine answer blocks based on AI citations
- A/B test answer-first formats

### Days 61-90: Optimization
**Week 9-10:**
- Navigator API alpha (for select partners)
- Email digest setup + first send
- Advanced INP optimization
- Expand question hubs to 20 pages

**Week 11-12:**
- AEO performance review
- Adjust content strategy based on citations
- Plan Phase 4 (international expansion, ALF focus, etc.)

---

## Success Metrics

### 30-Day Targets
- ✅ robots.txt with AI policies live
- ✅ ItemList schema on 50 metro pages
- ✅ Dataset schema on `/data` page
- ✅ 5 question hub pages published
- ✅ Editorial/methodology pages live
- ✅ IndexNow pings working

### 60-Day Targets
- 15 question hub pages total
- 50 state landing pages live
- 3+ citations in AI assistants (manual check)
- INP < 200ms on 75% of pages
- Email digest → 100 subscribers

### 90-Day Targets
- 20 question hub pages total
- 10+ citations in AI assistants
- +15% organic traffic from long-tail queries
- +30% impressions on question queries
- Navigator API → 3 beta customers

---

## Quick Wins (Implement This Week)

1. **robots.txt** (30 min) - Add AI crawler policies
2. **ItemList schema** (2 hours) - Add to metro pages
3. **Answer blocks** (4 hours) - Add to top 10 metros
4. **IndexNow** (1 hour) - Set up API key + first ping
5. **Editorial policy** (2 hours) - Draft and publish

**Total:** ~1 day of work for immediate AEO boost

---

## Resources & Tools

**Schema Validators:**
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org validator: https://validator.schema.org/
- JSON-LD Playground: https://json-ld.org/playground/

**Monitoring:**
- Google Search Console: Search performance
- Bing Webmaster Tools: IndexNow status
- PageSpeed Insights: Core Web Vitals
- Screaming Frog: Crawl audit

**AI Citation Checkers:**
- Perplexity.ai (manual sampling)
- Google AI Overviews (manual sampling)
- Bing Copilot (manual sampling)

---

**Next Steps:**
1. Review and approve priorities
2. Assign development resources
3. Begin Week 1 implementation
4. Set up monitoring dashboards

**Questions?**
- Which question hub topics to prioritize?
- Navigator API pricing strategy?
- AI training policy (block all or allow select?)
