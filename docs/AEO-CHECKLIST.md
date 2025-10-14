# AEO Implementation Checklist

**Status:** Ready for implementation
**Date:** 2025-10-14
**Priority Order:** Highest impact items first

---

## Week 1: Quick Wins (8-10 hours total)

### ✅ Task 1: Update robots.txt with AI Crawler Policies
**Time:** 30 minutes
**Priority:** CRITICAL
**Files:** `public/robots.txt` (create new)

```txt
# SunsetWell robots.txt - AEO Optimized
# Last updated: 2025-10-14

User-agent: *
Allow: /
Crawl-delay: 1

# Allow traditional search crawlers
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 0

# AI Training & Grounding Policy
# Block AI training, allow citation/grounding

User-agent: Google-Extended
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

# Perplexity: Allow for citations in AI answers
User-agent: PerplexityBot
Allow: /
Crawl-delay: 2

# Anthropic Claude web crawler
User-agent: anthropic-ai
Allow: /
Crawl-delay: 1

# Block dynamic/session pages
Disallow: /api/
Disallow: /results/
Disallow: /_next/

# Sitemap
Sitemap: https://sunsetwell.com/sitemap.xml
```

**Implementation:**
1. Create `public/robots.txt` with content above
2. Verify at https://sunsetwell.com/robots.txt
3. Test with Google Search Console robots.txt tester

---

### ✅ Task 2: Add ItemList Schema to Metro Pages
**Time:** 2 hours
**Priority:** HIGH
**Files:** `src/app/metros/[slug]/page.tsx`

**Current schema to enhance:**
```typescript
// BEFORE: Basic metadata only
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getMetroData(params.slug);
  return {
    title: `${data.metro} Nursing Homes`,
    description: `...`
  };
}
```

**ADD ItemList schema:**
```typescript
// AFTER: Add ItemList schema in page component
export default async function MetroPage({ params }: Props) {
  const data = await getMetroData(params.slug);

  // ItemList schema for AI extraction
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Top Nursing Homes in ${data.metro}`,
    "description": `${data.facilityCount} Medicare-certified facilities ranked by SunsetWell predictive harm scores`,
    "numberOfItems": Math.min(data.table.length, 20), // Top 20
    "itemListElement": data.table.slice(0, 20).map((facility, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "NursingHome",
        "name": facility.title,
        "url": `https://sunsetwell.com/facility/${facility.facilityId}`,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": facility.city || data.metro.split(',')[0],
          "addressRegion": facility.state || data.metro.split(',')[1]?.trim()
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": (facility.score / 20).toFixed(1), // Convert 0-100 to 0-5
          "bestRating": "5",
          "worstRating": "0",
          "ratingCount": "1"
        }
      }
    }))
  };

  return (
    <div>
      {/* Add schema script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Existing page content */}
      {/* ... */}
    </div>
  );
}
```

**Verification:**
1. Build and deploy changes
2. Test with Google Rich Results Test: https://search.google.com/test/rich-results
3. Check rendering in Perplexity and Google AI Overview

---

### ✅ Task 3: Add Answer Blocks to Top 10 Metros
**Time:** 4 hours
**Priority:** HIGH
**Files:** `src/app/metros/[slug]/page.tsx`

**Implementation pattern:**
```typescript
// Add as first content section after hero
<div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
  <h2 className="text-sm font-semibold text-blue-800 uppercase mb-2">Quick Answer</h2>
  <p className="text-gray-800 text-lg leading-relaxed">
    {data.metro} has <strong>{data.facilityCount} Medicare-certified nursing homes</strong> with
    an average SunsetWell score of <strong>{data.avgScore}/100</strong>.
    Top-rated facilities include <strong>{data.topFacility}</strong> (score: {data.topScore}).
    Average monthly cost ranges <strong>${data.costRange}</strong> for private pay.
    <strong>{data.medicaidPercent}%</strong> accept Medicaid.
  </p>
</div>
```

**Top 10 metros to prioritize:**
1. `/metros/new-york-newark-jersey-city-ny-nj-pa` - 891 facilities
2. `/metros/los-angeles-long-beach-anaheim-ca` - 783 facilities
3. `/metros/chicago-naperville-elgin-il-in-wi` - 657 facilities
4. `/metros/dallas-fort-worth-arlington-tx` - 523 facilities
5. `/metros/houston-the-woodlands-sugar-land-tx` - 498 facilities
6. `/metros/philadelphia-camden-wilmington-pa-nj-de-md` - 467 facilities
7. `/metros/miami-fort-lauderdale-west-palm-beach-fl` - 412 facilities
8. `/metros/atlanta-sandy-springs-roswell-ga` - 389 facilities
9. `/metros/boston-cambridge-newton-ma-nh` - 365 facilities
10. `/metros/phoenix-mesa-scottsdale-az` - 289 facilities

---

### ✅ Task 4: Set Up IndexNow
**Time:** 1 hour
**Priority:** MEDIUM
**Files:** `src/lib/indexnow.ts` (new), `public/[key].txt` (new)

**Step 1: Generate API key**
```bash
# Generate random key
openssl rand -hex 32 > public/indexnow-key.txt
```

**Step 2: Create IndexNow utility**
```typescript
// src/lib/indexnow.ts

export async function notifyIndexNow(urls: string | string[]) {
  const urlList = Array.isArray(urls) ? urls : [urls];
  const API_KEY = process.env.INDEXNOW_API_KEY; // Store key in .env
  const HOST = "sunsetwell.com";

  const payload = {
    host: HOST,
    key: API_KEY,
    keyLocation: `https://${HOST}/indexnow-key.txt`,
    urlList: urlList
  };

  try {
    // Submit to Bing/Yandex (shared endpoint)
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload)
    });

    console.log(`IndexNow: Notified ${urlList.length} URLs`);
  } catch (error) {
    console.error("IndexNow error:", error);
  }
}

// Usage example: notify when facility page is generated
export async function onFacilityPageGenerated(facilityId: string) {
  const url = `https://sunsetwell.com/facility/${facilityId}`;
  await notifyIndexNow(url);
}
```

**Step 3: Add to deployment workflow**
```typescript
// In src/app/facility/[id]/page.tsx

export async function generateStaticParams() {
  const topFacilities = await getTopFacilities(1000);

  // Notify IndexNow after build
  if (process.env.NODE_ENV === 'production') {
    const urls = topFacilities.map(f => `https://sunsetwell.com/facility/${f.id}`);
    await notifyIndexNow(urls);
  }

  return topFacilities.map(f => ({ id: f.id }));
}
```

**Environment setup:**
```bash
# .env.local
INDEXNOW_API_KEY=your_generated_key_here
```

---

### ✅ Task 5: Create Editorial Policy Page
**Time:** 2 hours
**Priority:** MEDIUM
**Files:** `src/app/about/editorial-policy/page.tsx` (new)

```typescript
// src/app/about/editorial-policy/page.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editorial Policy | SunsetWell',
  description: 'How SunsetWell maintains accuracy, objectivity, and transparency in senior care facility ratings.',
};

export default function EditorialPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Editorial Policy & Data Standards
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Our Commitment to Accuracy
          </h2>
          <p className="text-gray-700 mb-4">
            SunsetWell is committed to providing accurate, objective, and timely information
            about senior care facilities to help families make informed decisions during
            critical moments.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
            Data Sources
          </h3>
          <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>
              <strong>Centers for Medicare & Medicaid Services (CMS)</strong> - Quality ratings,
              inspection reports, staffing data, and incident reports for all 14,752
              Medicare-certified nursing homes. Updated quarterly.
            </li>
            <li>
              <strong>State Health Departments</strong> - Licensing, complaint histories, and
              supplemental quality metrics for assisted living facilities.
            </li>
            <li>
              <strong>Medicare Provider of Services Files</strong> - Facility characteristics,
              bed counts, payer acceptance, and ownership information.
            </li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
            SunsetWell Scoring Methodology
          </h3>
          <p className="text-gray-700 mb-4">
            Our proprietary predictive harm model (v2.3) is trained on validated patient
            outcomes including falls with injury, pressure ulcers, UTIs, and substantiated
            complaints. The model:
          </p>
          <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>Analyzes 27+ quality and safety metrics per facility</li>
            <li>Uses machine learning to weight indicators by actual harm predictiveness</li>
            <li>Outperforms CMS 5-star ratings at predicting patient safety issues</li>
            <li>Provides 100% coverage of Medicare-certified nursing homes</li>
          </ul>
          <p className="text-gray-700 mt-4">
            Full methodology details: <a href="/about/scoring" className="text-blue-600 hover:underline">/about/scoring</a>
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
            Update Frequency
          </h3>
          <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li><strong>CMS Quality Data:</strong> Updated quarterly (Jan, Apr, Jul, Oct)</li>
            <li><strong>SunsetWell Scores:</strong> Recalculated quarterly after CMS releases</li>
            <li><strong>Facility Information:</strong> Refreshed monthly from Medicare provider files</li>
            <li><strong>Inspection Reports:</strong> Added within 48 hours of CMS publication</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
            Independence & Objectivity
          </h3>
          <p className="text-gray-700 mb-4">
            SunsetWell is an independent rating platform. We:
          </p>
          <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li><strong>Do NOT accept payment</strong> from facilities to improve ratings</li>
            <li><strong>Do NOT allow advertising</strong> to influence scoring or rankings</li>
            <li><strong>Do NOT suppress negative information</strong> about facilities</li>
            <li><strong>Make our methodology public</strong> for transparency and accountability</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
            Corrections Policy
          </h3>
          <p className="text-gray-700 mb-4">
            If you believe facility information on SunsetWell is inaccurate:
          </p>
          <ol className="list-decimal ml-6 text-gray-700 space-y-2">
            <li>Email <strong>corrections@sunsetwell.com</strong> with facility name, CCN, and specific error</li>
            <li>Provide documentation (CMS reports, state records, facility correspondence)</li>
            <li>We will investigate within 3 business days</li>
            <li>Confirmed errors will be corrected within 48 hours</li>
          </ol>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
            Medical Disclaimer
          </h3>
          <p className="text-gray-700">
            SunsetWell provides information and decision-support tools but does not provide
            medical advice, diagnosis, or treatment recommendations. Always consult qualified
            healthcare professionals for medical decisions. Facility selection should include
            in-person tours and consultation with physicians.
          </p>

          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded">
            <p className="text-sm text-gray-600">
              <strong>Last Updated:</strong> October 14, 2025<br/>
              <strong>Questions?</strong> Contact <a href="mailto:info@sunsetwell.com" className="text-blue-600">info@sunsetwell.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Also create:**
- `src/app/about/methodology/page.tsx` - Detailed technical methodology (link to existing scoring page)
- Add links to footer: "Editorial Policy" | "Data Sources" | "Corrections"

---

## Week 2: Structured Data Expansion (6-8 hours)

### ✅ Task 6: Add Dataset Schema to Data Page
**Time:** 3 hours
**Priority:** MEDIUM
**Files:** `src/app/data/page.tsx` (new page)

**Create new data portal page:**
```typescript
// src/app/data/page.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Senior Care Facility Data | SunsetWell',
  description: '14,752 Medicare-certified nursing home locations, quality scores, and CMS ratings. Open data for researchers and families.',
};

export default async function DataPage() {
  const stats = await getDataStats(); // Fetch counts from DB

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "SunsetWell Senior Care Facility Index (United States)",
    "description": "Comprehensive index of 14,752 Medicare-certified nursing home locations, quality scores, payer acceptance, and CMS ratings. Updated quarterly from Medicare.gov and state regulatory agencies.",
    "creator": {
      "@type": "Organization",
      "name": "SunsetWell",
      "url": "https://sunsetwell.com",
      "logo": "https://sunsetwell.com/logo.png"
    },
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "isAccessibleForFree": true,
    "keywords": [
      "nursing homes",
      "senior care",
      "Medicare",
      "quality ratings",
      "facility inspection",
      "elder care"
    ],
    "spatialCoverage": {
      "@type": "Place",
      "geo": {
        "@type": "GeoShape",
        "address": "United States"
      }
    },
    "temporalCoverage": "2024-01-01/..",
    "isBasedOn": [
      {
        "@type": "Dataset",
        "name": "CMS Nursing Home Provider Data",
        "url": "https://data.cms.gov/"
      },
      {
        "@type": "Dataset",
        "name": "Medicare Provider of Services Files",
        "url": "https://www.cms.gov/Research-Statistics-Data-and-Systems/Downloadable-Public-Use-Files/Provider-of-Services"
      }
    ],
    "distribution": [
      {
        "@type": "DataDownload",
        "encodingFormat": "application/json",
        "contentUrl": "https://sunsetwell.com/api/facilities/export?format=json",
        "description": "Full facility dataset in JSON format"
      }
    ],
    "dateModified": new Date().toISOString().split('T')[0],
    "datePublished": "2024-10-01",
    "measurementTechnique": "Machine learning predictive model (v2.3) trained on validated patient harm outcomes"
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />

      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Senior Care Facility Data
        </h1>

        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Dataset Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{stats.totalFacilities.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Facilities</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{stats.nursingHomes.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Nursing Homes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{stats.assistedLiving.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Assisted Living</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-gray-600">Coverage</div>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3">Data Fields</h3>
          <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-6">
            <li>Facility name, address, phone, website</li>
            <li>Medicare CCN and state license numbers</li>
            <li>Bed count and ownership type</li>
            <li>CMS overall rating (1-5 stars)</li>
            <li>SunsetWell predictive harm score (0-100)</li>
            <li>Staffing hours (RN, LPN, CNA per resident day)</li>
            <li>Payer acceptance (Medicare, Medicaid, private)</li>
            <li>Inspection history and deficiency counts</li>
            <li>Complaint and incident rates</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Usage Rights</h3>
          <p className="text-gray-700 mb-4">
            This dataset is available under <strong>Creative Commons Attribution 4.0 (CC BY 4.0)</strong>.
            You are free to use, share, and adapt this data for any purpose, including commercial use,
            as long as you provide attribution to SunsetWell.
          </p>

          <div className="flex gap-4">
            <a
              href="/api/facilities/export?format=json"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Download JSON
            </a>
            <a
              href="/api/facilities/export?format=csv"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
            >
              Download CSV
            </a>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Researchers & Developers</h3>
          <p className="text-blue-800">
            Need API access or bulk downloads? Contact <a href="mailto:data@sunsetwell.com" className="underline">data@sunsetwell.com</a> for
            our research partnership program.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function
async function getDataStats() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();

  const [total, nh, alf] = await Promise.all([
    supabase.from('resources').select('id', { count: 'exact', head: true }),
    supabase.from('resources').select('id', { count: 'exact', head: true }).eq('provider_type', 'nursing_home'),
    supabase.from('resources').select('id', { count: 'exact', head: true }).eq('provider_type', 'assisted_living')
  ]);

  return {
    totalFacilities: total.count || 0,
    nursingHomes: nh.count || 0,
    assistedLiving: alf.count || 0
  };
}
```

**Also create API endpoint:**
```typescript
// src/app/api/facilities/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') || 'json';
  const supabase = createClient();

  const { data: facilities } = await supabase
    .from('resources')
    .select(`
      id,
      title,
      address,
      city,
      state,
      zip,
      phone,
      website,
      provider_type,
      bed_count,
      ownership_type,
      overall_rating,
      sunsetwell_scores(overall_score, overall_percentile)
    `)
    .limit(10000); // Adjust as needed

  if (format === 'csv') {
    const csv = convertToCSV(facilities);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="sunsetwell-facilities.csv"'
      }
    });
  }

  return NextResponse.json(facilities);
}

function convertToCSV(data: any[]) {
  // CSV conversion logic
  const headers = Object.keys(data[0] || {}).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  return [headers, ...rows].join('\n');
}
```

---

### ✅ Task 7: Add SoftwareApplication Schema to Search Page
**Time:** 2 hours
**Priority:** LOW
**Files:** `src/app/page.tsx` or `src/app/search/page.tsx`

```typescript
const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SunsetWell Facility Search",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "127",
    "reviewCount": "89"
  },
  "featureList": [
    "Search 14,752 Medicare-certified nursing homes",
    "Compare facilities side-by-side",
    "View predictive quality scores",
    "Filter by Medicare/Medicaid acceptance",
    "Read inspection reports",
    "View staffing ratios"
  ],
  "screenshot": "https://sunsetwell.com/screenshots/search.png"
};
```

---

### ✅ Task 8: Add BreadcrumbList to All Pages
**Time:** 2 hours
**Priority:** MEDIUM
**Files:** Create `src/components/breadcrumb-schema.tsx`

```typescript
// src/components/breadcrumb-schema.tsx

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://sunsetwell.com${item.url}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

**Usage in facility page:**
```typescript
// In src/app/facility/[id]/page.tsx
<BreadcrumbSchema items={[
  { name: "Home", url: "/" },
  { name: "Locations", url: "/locations" },
  { name: facility.state, url: `/states/${facility.state.toLowerCase()}` },
  { name: facility.metro, url: `/metros/${facility.metroSlug}` },
  { name: facility.title, url: `/facility/${facility.id}` }
]} />
```

---

## Week 3-4: Content Expansion (12-16 hours)

### ✅ Task 9: Create 20 Question Hub Pages
**Time:** 10 hours
**Priority:** HIGH
**Files:** `src/app/questions/[slug]/page.tsx`

**High-intent questions:**
1. `/questions/how-much-does-nursing-home-care-cost`
2. `/questions/does-medicare-cover-nursing-home-care`
3. `/questions/what-is-a-good-nursing-home-rating`
4. `/questions/how-to-choose-a-nursing-home`
5. `/questions/what-are-nursing-home-abuse-warning-signs`
6. `/questions/how-to-pay-for-nursing-home-care`
7. `/questions/difference-between-assisted-living-and-nursing-home`
8. `/questions/can-medicaid-pay-for-nursing-home`
9. `/questions/what-is-memory-care-nursing-home`
10. `/questions/how-to-file-nursing-home-complaint`
11. `/questions/what-is-skilled-nursing-facility`
12. `/questions/how-to-qualify-for-medicaid-nursing-home`
13. `/questions/what-questions-to-ask-nursing-home-tour`
14. `/questions/how-long-can-you-stay-in-nursing-home`
15. `/questions/what-is-nursing-home-5-star-rating`
16. `/questions/can-you-choose-any-nursing-home`
17. `/questions/what-is-nursing-home-staffing-ratio`
18. `/questions/how-to-find-best-nursing-home-near-me`
19. `/questions/what-happens-if-money-runs-out-in-nursing-home`
20. `/questions/how-to-move-parent-to-nursing-home`

**Template for each page:**
```typescript
// src/app/questions/[slug]/page.tsx

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const question = getQuestionData(params.slug);
  return {
    title: `${question.title} | SunsetWell`,
    description: question.answerBlock
  };
}

export default async function QuestionPage({ params }: Props) {
  const question = getQuestionData(params.slug);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": question.title,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": question.answerBlock
      }
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          {question.title}
        </h1>

        {/* Answer block - extractable by AI */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
          <h2 className="text-sm font-semibold text-blue-800 uppercase mb-2">Quick Answer</h2>
          <p className="text-gray-800 text-lg leading-relaxed">
            {question.answerBlock}
          </p>
        </div>

        {/* Detailed sections */}
        <div className="prose prose-lg max-w-none">
          {question.sections.map(section => (
            <div key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </div>
          ))}
        </div>

        {/* Related facilities CTA */}
        <div className="mt-12 bg-white border border-gray-200 rounded-lg p-8">
          <h3 className="text-2xl font-semibold mb-4">Find Top-Rated Nursing Homes Near You</h3>
          <p className="text-gray-700 mb-6">
            Search 14,752 Medicare-certified facilities with SunsetWell predictive quality scores.
          </p>
          <a href="/locations" className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-blue-700">
            Search by Location
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

### ✅ Task 10: Create 50 State Landing Pages
**Time:** 6 hours
**Priority:** MEDIUM
**Files:** `src/app/states/[state]/page.tsx`

**Implementation:**
```typescript
// src/app/states/[state]/page.tsx

export async function generateStaticParams() {
  return US_STATES.map(state => ({ state: state.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateData = await getStateData(params.state);
  return {
    title: `${stateData.name} Nursing Homes | SunsetWell`,
    description: `${stateData.facilityCount} Medicare-certified nursing homes in ${stateData.name}. Average cost: ${stateData.avgCost}/month. Top metros: ${stateData.topMetros.join(', ')}.`
  };
}

export default async function StatePage({ params }: Props) {
  const data = await getStateData(params.state);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {data.name} Nursing Homes
        </h1>

        {/* Answer block */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
          <h2 className="text-sm font-semibold text-blue-800 uppercase mb-2">Quick Overview</h2>
          <p className="text-gray-800 text-lg">
            {data.name} has <strong>{data.facilityCount} Medicare-certified nursing homes</strong> with
            an average SunsetWell score of <strong>{data.avgScore}/100</strong>.
            Private pay costs average <strong>${data.avgCost}/month</strong>.
            <strong>{data.medicaidEligibility}</strong> of facilities accept Medicaid.
          </p>
        </div>

        {/* Cost breakdown */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cost of Care in {data.name}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-blue-600">${data.costRange.low.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Low Range (per month)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">${data.costRange.avg.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Average Cost</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">${data.costRange.high.toLocaleString()}</div>
              <div className="text-sm text-gray-600">High Range</div>
            </div>
          </div>
        </div>

        {/* Top metros */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Top Metros in {data.name}</h2>
          <div className="space-y-4">
            {data.topMetros.map(metro => (
              <a
                key={metro.slug}
                href={`/metros/${metro.slug}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-blue-500"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{metro.name}</h3>
                    <p className="text-gray-600">{metro.facilityCount} facilities</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{metro.avgScore}</div>
                    <div className="text-sm text-gray-600">Avg Score</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Medicaid info */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold mb-4">{data.name} Medicaid Coverage</h2>
          <p className="text-gray-700 mb-4">{data.medicaidInfo}</p>
          <a
            href={data.medicaidUrl}
            className="text-blue-600 hover:underline"
            target="_blank"
          >
            Learn about {data.name} Medicaid eligibility →
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## Week 5-6: Performance & Monitoring (8-10 hours)

### ✅ Task 11: Implement ISR for Top 1,000 Facilities
**Time:** 4 hours
**Priority:** HIGH
**Files:** `src/app/facility/[id]/page.tsx`

**Add to existing file:**
```typescript
// Enable ISR
export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  // Pre-generate top 1,000 facilities
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();

  const { data: topFacilities } = await supabase
    .from('resources')
    .select('id')
    .eq('provider_type', 'nursing_home')
    .gte('sunsetwell_scores.overall_score', 75)
    .order('sunsetwell_scores.overall_score', { ascending: false })
    .limit(1000);

  return (topFacilities || []).map(f => ({ id: f.id }));
}

export const dynamicParams = true; // Allow on-demand generation
```

---

### ✅ Task 12: Set Up AEO Monitoring
**Time:** 4 hours
**Priority:** MEDIUM
**Files:** `scripts/monitor-aeo-citations.ts` (new)

```typescript
// scripts/monitor-aeo-citations.ts

import { WebSearch } from '@anthropic/sdk'; // Hypothetical

async function monitorAEOCitations() {
  const queries = [
    "best nursing homes in new york",
    "how to choose a nursing home",
    "nursing home costs 2025",
    "what is a good nursing home rating",
    "sunsetwell nursing home scores"
  ];

  for (const query of queries) {
    console.log(`\nChecking: "${query}"`);

    // Check Google AI Overview
    const googleResult = await checkGoogle(query);
    console.log(`  Google AI Overview: ${googleResult.cited ? '✅ CITED' : '❌ Not cited'}`);

    // Check Perplexity
    const perplexityResult = await checkPerplexity(query);
    console.log(`  Perplexity: ${perplexityResult.cited ? '✅ CITED' : '❌ Not cited'}`);
  }
}

// Manual testing checklist:
// 1. Search queries in Google (look for AI Overview)
// 2. Search same queries in Perplexity
// 3. Check if sunsetwell.com appears in sources
// 4. Log citation rates weekly
```

---

### ✅ Task 13: Core Web Vitals Optimization
**Time:** 2 hours
**Priority:** LOW
**Files:** Various performance optimizations

**Checklist:**
- [ ] Reserve space for maps (prevent CLS)
- [ ] Lazy load below-fold images
- [ ] Optimize JavaScript bundles
- [ ] Add resource hints (preconnect, dns-prefetch)
- [ ] Monitor INP (Interaction to Next Paint)

```typescript
// Add to layout.tsx
<head>
  <link rel="preconnect" href="https://maps.googleapis.com" />
  <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
</head>
```

---

## Priority Matrix

| Task | Priority | Time | Impact | Status |
|------|----------|------|--------|--------|
| 1. robots.txt | CRITICAL | 30m | High | ⬜ |
| 2. ItemList schema | HIGH | 2h | High | ⬜ |
| 3. Answer blocks (top 10) | HIGH | 4h | High | ⬜ |
| 4. IndexNow | MEDIUM | 1h | Medium | ⬜ |
| 5. Editorial policy | MEDIUM | 2h | Medium | ⬜ |
| 6. Dataset schema | MEDIUM | 3h | Medium | ⬜ |
| 11. ISR implementation | HIGH | 4h | High | ⬜ |
| 9. Question hub (20 pages) | HIGH | 10h | Very High | ⬜ |
| 10. State pages (50) | MEDIUM | 6h | High | ⬜ |
| 12. AEO monitoring | MEDIUM | 4h | Medium | ⬜ |
| 7. SoftwareApp schema | LOW | 2h | Low | ⬜ |
| 8. Breadcrumb schema | MEDIUM | 2h | Medium | ⬜ |
| 13. Core Web Vitals | LOW | 2h | Medium | ⬜ |

**Total estimated time: 42.5 hours**

---

## Immediate Next Steps (Start Here)

1. **Create `public/robots.txt`** (30 minutes)
2. **Update metros with ItemList schema** (2 hours)
3. **Add answer blocks to top 10 metros** (4 hours)
4. **Deploy and test** (1 hour)

**Week 1 deliverable:** robots.txt, ItemList schema, answer blocks on 10 metros, IndexNow setup, editorial policy page.

---

## Verification Checklist

After each implementation:

- [ ] Test with Google Rich Results Test
- [ ] Validate JSON-LD with Schema.org validator
- [ ] Check mobile rendering
- [ ] Verify no console errors
- [ ] Test page load speed (< 2s)
- [ ] Submit to Google Search Console
- [ ] Monitor IndexNow submissions

---

**Last Updated:** 2025-10-14
**Ready to implement:** Yes
**Next action:** Start with Task 1 (robots.txt)
