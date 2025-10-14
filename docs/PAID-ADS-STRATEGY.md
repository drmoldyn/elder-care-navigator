# Paid Advertising Strategy for SunsetWell

## Overview
Comprehensive Google Ads strategy building on our AdSense foundation. Focus on conversion tracking, remarketing, and dedicated landing pages for paid campaigns.

**Note:** This complements (not replaces) our AdSense passive monetization strategy in `GOOGLE-ADS-INTEGRATION.md`.

---

## 🎯 Strategic Alignment

### **Current Foundation (Completed):**
✅ Google AdSense infrastructure for passive revenue
✅ Mobile-first design (48px touch targets, click-to-call)
✅ SEO structured data (FAQPage, HealthcareOrganization)
✅ Map view with insurance filtering
✅ 73,000+ facilities with Medicare.gov verification

### **Codex's Recommendations (Evaluated):**
All recommendations are **approved** and align with our goals:
- ✅ No conflicts with AdSense (different use case)
- ✅ Leverage existing SEO/mobile work
- ✅ Build on sunset brand design system
- ✅ Complement existing conversion funnel

---

## 📊 Paid Ads vs. AdSense Comparison

| Aspect | **Google AdSense** (Implemented) | **Google Ads** (This Doc) |
|--------|----------------------------------|---------------------------|
| **Purpose** | Passive revenue from display ads | Active traffic acquisition |
| **Role** | We show others' ads | We buy ads to get users |
| **Cost** | Free (we get paid) | Budget required ($500-5k/mo) |
| **Control** | Low (Google picks ads) | High (we control targeting) |
| **ROI** | $300-900/mo at 10k visitors | Variable (depends on LTV) |
| **Conflicts?** | ❌ None - complementary | ✅ Different objectives |

**Recommendation:** Implement both simultaneously. AdSense generates passive income while Google Ads drives targeted traffic.

---

## 🚀 Phase 1: Measurement & Tracking (Week 1-2)

### **1. Google Tag Manager (GTM) Setup**

**Why:** Single tag deployment, no code changes needed for new tracking

#### **Implementation:**

**A. Install GTM Container**
```tsx
// src/app/layout.tsx - Add to <head>
<Script
  id="gtm-script"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-XXXXXXX');
    `,
  }}
/>

{/* Add to <body> */}
<noscript>
  <iframe
    src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
    height="0"
    width="0"
    style={{ display: 'none', visibility: 'hidden' }}
  />
</noscript>
```

**B. Environment Variable**
```bash
# .env.local
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

**C. Create GTM Component**
```tsx
// src/components/analytics/gtm.tsx
"use client";

import Script from "next/script";

export function GoogleTagManager() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  if (!gtmId) return null;

  return (
    <>
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}
```

---

### **2. Conversion Tracking Setup**

#### **Defined Conversions:**

| Conversion | Trigger | Value | Notes |
|------------|---------|-------|-------|
| **Lead Form Submit** | Request info modal submitted | $50 | High intent - facility inquiry |
| **Phone Click** | `tel:` link clicked | $30 | Immediate action - very high intent |
| **View Results Session** | Navigator completed → results page | $10 | Mid-funnel - matched with facilities |
| **Compare Facilities** | Added to comparison | $5 | Research phase - evaluating options |
| **Map Search** | Map view used | $3 | Exploratory - lower intent |

#### **Implementation:**

**A. Create Event Tracking Helper**
```tsx
// src/lib/analytics/events.ts
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    });
  }
};

export const trackConversion = (conversionName: string, value: number, params?: Record<string, any>) => {
  trackEvent('conversion', {
    conversion_name: conversionName,
    conversion_value: value,
    currency: 'USD',
    ...params,
  });
};
```

**B. Wire Up Conversions**

**Lead Form Submit:**
```tsx
// src/components/modals/request-info-modal.tsx
import { trackConversion } from '@/lib/analytics/events';

const handleSubmit = async (data: FormData) => {
  // ... existing submit logic

  trackConversion('lead_form_submit', 50, {
    facility_id: facilityId,
    facility_name: facilityName,
    form_type: 'request_info',
  });
};
```

**Phone Click:**
```tsx
// src/components/results/facility-card.tsx (or wherever tel: links are)
<a
  href={`tel:${facility.contact_phone}`}
  onClick={() => {
    trackConversion('phone_click', 30, {
      facility_id: facility.id,
      facility_name: facility.title,
    });
  }}
  className="..."
>
  📞 Call
</a>
```

**View Results Session:**
```tsx
// src/app/results/[sessionId]/page.tsx
'use client';

import { useEffect } from 'react';
import { trackConversion } from '@/lib/analytics/events';

export default function ResultsPage({ params, searchParams }: Props) {
  useEffect(() => {
    // Track when user lands on results page
    trackConversion('view_results_session', 10, {
      session_id: params.sessionId,
      facility_count: resources.length,
    });
  }, [params.sessionId]);

  // ... rest of component
}
```

**Compare Facilities:**
```tsx
// src/components/comparison/comparison-bar.tsx
import { trackConversion } from '@/lib/analytics/events';

const handleAddFacility = (facility: Resource) => {
  addFacility(facility);

  trackConversion('compare_facilities', 5, {
    facility_id: facility.id,
    facility_count: selectedFacilities.length + 1,
  });
};
```

**Map Search:**
```tsx
// src/components/navigator/map-view.tsx
import { trackEvent } from '@/lib/analytics/events';

const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault();

  trackEvent('map_search', {
    zip_code: searchState.zip,
    state: searchState.state,
    care_type: searchState.careType,
    insurance: searchState.insurance.join(','),
  });

  // ... existing logic
};
```

---

### **3. Google Analytics 4 (GA4) Integration**

**Create GA4 Tag in GTM:**
1. Go to GTM → Tags → New
2. Tag Type: Google Analytics: GA4 Configuration
3. Measurement ID: `G-XXXXXXXXXX` (from GA4)
4. Trigger: All Pages
5. Save & Publish

**Enhanced Measurement (Auto-tracked):**
- Page views
- Scrolls
- Outbound clicks
- Site search
- Video engagement

**Custom Events (Already wired via GTM):**
- All conversions defined above
- Available in GA4 → Reports → Engagement → Events

---

### **4. Google Ads Conversion Tracking**

**Setup in Google Ads:**
1. Google Ads → Goals → Conversions → New conversion action
2. For each conversion:
   - Website conversion
   - Manual code installation (use GTM)
   - Set value (from table above)
   - Set conversion window (30 days recommended)

**Create Conversion Tags in GTM:**
1. GTM → Tags → New
2. Tag Type: Google Ads Conversion Tracking
3. Conversion ID: `AW-XXXXXXXXXX`
4. Conversion Label: (unique per conversion)
5. Trigger: Custom Event (e.g., `conversion` event with `conversion_name` = `lead_form_submit`)
6. Save & Publish

**Example GTM Trigger:**
```
Trigger Type: Custom Event
Event Name: conversion
This trigger fires on: Some Custom Events
Fire this trigger when: conversion_name equals lead_form_submit
```

---

## 🎨 Phase 2: Landing Pages (Week 3-4)

### **Dedicated Campaign Landing Pages**

**Why:** Higher Quality Score, better conversion rates, A/B testing without touching core flow

#### **Landing Page Themes:**

**1. Memory Care Focus** (`/landing/memory-care`)
- Target: Families dealing with dementia/Alzheimer's
- Keywords: "memory care near me", "Alzheimer's facilities"
- Copy angle: Specialized care, secure environments, trained staff
- Hero image: Seniors engaged in memory activities

**2. VA Benefits** (`/landing/va-benefits`)
- Target: Veterans and military families
- Keywords: "VA nursing homes", "veterans benefits senior care"
- Copy angle: VA-accepted facilities, honor military service
- Trust badge: "Veterans Affairs Accepted" filter

**3. Urgent Placement** (`/landing/urgent-placement`)
- Target: Hospital discharge planners, families in crisis
- Keywords: "hospital discharge placement", "urgent nursing home"
- Copy angle: 24-48 hour placement, immediate availability
- CTA: "Find Available Beds Now" (not "Start Search")

**4. Medicaid Facilities** (`/landing/medicaid`)
- Target: Families concerned about affordability
- Keywords: "Medicaid nursing homes", "affordable senior care"
- Copy angle: Medicaid-accepted, transparent pricing
- Trust badge: "Medicaid Verified" facilities

#### **Landing Page Template:**

```tsx
// src/app/landing/[theme]/page.tsx
import { SearchForm } from '@/components/landing/search-form';
import { TrustBadges } from '@/components/landing/trust-badges';
import { Testimonial } from '@/components/landing/testimonial';

export default function LandingPage({ params }: { params: { theme: string } }) {
  const config = LANDING_CONFIGS[params.theme];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center">
        <Image src={config.heroImage} alt={config.heroAlt} fill className="object-cover" />
        <div className="relative z-10 text-center text-white max-w-3xl px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {config.headline}
          </h1>
          <p className="text-xl mb-8">
            {config.subheadline}
          </p>
          <SearchForm theme={params.theme} defaultFilters={config.filters} />
        </div>
      </section>

      {/* Trust Section */}
      <TrustBadges stats={config.stats} />

      {/* How It Works */}
      <section className="py-16 bg-neutral-warm/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            {config.processTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {config.steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-sunset-orange rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <Testimonial quote={config.testimonial} />

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-sunset-orange to-sunset-gold text-white text-center">
        <h2 className="text-3xl font-bold mb-4">{config.ctaHeadline}</h2>
        <p className="text-xl mb-8">{config.ctaSubheadline}</p>
        <button className="bg-white text-sunset-orange px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all">
          {config.ctaButton}
        </button>
      </section>
    </div>
  );
}
```

#### **Landing Page Configuration:**

```tsx
// src/lib/landing/configs.ts
export const LANDING_CONFIGS = {
  'memory-care': {
    headline: 'Find Specialized Memory Care Facilities Near You',
    subheadline: 'Compassionate Alzheimer's and dementia care with trained staff and secure environments',
    heroImage: '/images/landing/memory-care-hero.jpg',
    heroAlt: 'Senior with caregiver in memory care facility',
    filters: {
      conditions: ['dementia'],
      careType: 'facility',
    },
    stats: {
      facilities: '12,000+',
      states: 'All 50 States',
      verification: 'Medicare.gov Verified',
    },
    processTitle: 'How to Find the Right Memory Care',
    steps: [
      { title: 'Tell Us Your Needs', description: 'Share your loved one's condition and location' },
      { title: 'View Specialized Facilities', description: 'See memory care units with trained staff' },
      { title: 'Compare & Contact', description: 'Call facilities directly or request info' },
    ],
    testimonial: {
      quote: 'SunsetWell helped us find a memory care facility for my mother in 2 days. The staff understood her Alzheimer\'s needs.',
      author: 'Sarah M., Adult Daughter',
    },
    ctaHeadline: 'Ready to Find Compassionate Memory Care?',
    ctaSubheadline: '12,000+ specialized facilities across all 50 states',
    ctaButton: 'Search Memory Care Facilities',
  },
  'va-benefits': {
    // ... similar structure
  },
  'urgent-placement': {
    // ... similar structure
  },
  'medicaid': {
    // ... similar structure
  },
};
```

---

## 📞 Phase 3: Call Tracking (Week 5)

### **Dynamic Number Insertion (DNI)**

**Why:** Attribute phone leads back to specific campaigns

#### **Providers:**
- **CallRail** - $45/mo, easy integration, Google Ads sync
- **DialogTech** - Enterprise, healthcare-focused
- **Marchex** - AI call analytics

#### **Implementation (CallRail):**

**A. Add CallRail Script**
```tsx
// src/components/analytics/call-tracking.tsx
"use client";

import Script from "next/script";

export function CallTracking() {
  return (
    <Script
      src="https://cdn.callrail.com/companies/XXXXXXXXX/YYYYYYYYYY/12/swap.js"
      strategy="afterInteractive"
    />
  );
}
```

**B. Mark Phone Numbers for Swapping**
```tsx
// Before:
<a href="tel:555-123-4567">555-123-4567</a>

// After:
<a href="tel:555-123-4567" className="callrail-phone-number">
  555-123-4567
</a>
```

CallRail automatically swaps with tracking numbers based on campaign source.

---

## 🎯 Phase 4: Remarketing (Week 6-8)

### **Remarketing Audiences**

#### **Defined Audiences:**

| Audience | Definition | Use Case | Campaign Type |
|----------|-----------|----------|---------------|
| **Map Searchers** | Visited `/navigator?view=map` | Engaged, needs reminding | Display, Discovery |
| **Results Viewers** | Reached `/results/[id]` but didn't click facility | Warm, needs nudge | Search, Display |
| **Comparison Users** | Added facility to comparison | Hot, ready to convert | Search, Performance Max |
| **Cart Abandoners** | Clicked "Request Info" but didn't submit | Very hot, friction point | Display, YouTube |
| **Phone Clickers** | Clicked `tel:` link | Highest intent, called | Exclude from ads (already converted) |

#### **Implementation:**

**A. Create Remarketing Tags in GTM**
1. GTM → Tags → New
2. Tag Type: Google Ads Remarketing
3. Conversion ID: `AW-XXXXXXXXXX`
4. Trigger: Create custom triggers per audience
5. Save & Publish

**B. Custom Triggers (Examples):**

**Map Searchers:**
```
Trigger Type: Page View
Page URL: contains /navigator?view=map
```

**Results Viewers:**
```
Trigger Type: Page View
Page Path: matches RegEx ^/results/[^/]+$
```

**Comparison Users:**
```
Trigger Type: Custom Event
Event Name: compare_facilities
```

**Cart Abandoners:**
```
Trigger Type: Element Visibility
Element Selector: [data-modal="request-info"]
Minimum Percent Visible: 50%
AND
Does NOT fire on: Custom Event conversion where conversion_name equals lead_form_submit
```

---

### **Remarketing Campaign Structure**

#### **Display Retargeting:**

**Creative Variations:**
1. **Urgency:** "Still looking for senior care? 73,000+ facilities waiting" + CTA: "View Your Matches"
2. **Social Proof:** "Join 10,000+ families who found care on SunsetWell" + CTA: "Search Facilities"
3. **Value Prop:** "Medicare.gov verified data. Compare facilities for free." + CTA: "Start Comparing"

**Targeting:**
- Results Viewers (didn't convert)
- Map Searchers (exploratory)
- Exclude: Phone Clickers, Lead Submitters (already converted)

**Budget:** $300/month (low-cost brand awareness)

---

#### **Performance Max (PMax):**

**Asset Groups:**
- Headlines: "Find Senior Care Facilities Near You", "Medicare.gov Verified Data", "Compare 73,000+ Facilities"
- Descriptions: Pull from landing page copy
- Images: Sunset hero images (already optimized)
- Audience signals: Comparison Users, Results Viewers

**Budget:** $1,000/month (Google's AI optimizes across Search, Display, YouTube, Gmail)

---

## 🔍 Phase 5: Campaign Structure (Week 9-12)

### **Google Ads Campaign Hierarchy**

#### **Campaign 1: Brand Protection**
- **Type:** Search
- **Keywords:** "SunsetWell", "SunsetWell.com"
- **Budget:** $100/month (low, defensive)
- **Goal:** Protect brand from competitors bidding on our name

---

#### **Campaign 2: High-Intent Search**
- **Type:** Search
- **Keywords:**
  - Tier 1 (Exact match): "nursing homes near me", "assisted living near me"
  - Tier 2 (Phrase match): "memory care facilities [location]", "Medicaid nursing homes"
  - Tier 3 (Broad match modifier): +urgent +nursing +home +placement
- **Budget:** $2,000/month
- **Landing Pages:** Theme-specific (memory care, VA, urgent, Medicaid)
- **Goal:** Drive qualified traffic at $5-10 CPC

**Ad Copy Example (Urgent Placement):**
```
Headline 1: Urgent Nursing Home Placement
Headline 2: Hospital Discharge in 48 Hours?
Headline 3: 73,000+ Facilities | Immediate Availability
Description: Medicare.gov verified facilities with available beds. Search by insurance, location, and care needs. Free comparison tool.
CTA: Find Available Beds Now
```

---

#### **Campaign 3: Discovery/Display (Remarketing)**
- **Type:** Display
- **Audiences:** Results Viewers, Map Searchers, Cart Abandoners
- **Budget:** $500/month
- **Creative:** Sunset-branded banners with urgency/social proof
- **Goal:** Re-engage warm traffic at $1-3 CPM

---

#### **Campaign 4: Performance Max**
- **Type:** Performance Max (Google's AI)
- **Budget:** $1,500/month
- **Audiences:** Comparison Users, Results Viewers
- **Assets:** Landing page content, sunset hero images
- **Goal:** Maximize conversions across all Google inventory

---

### **Budget Allocation (Total: $4,100/month)**

| Campaign | Monthly Budget | Expected Clicks | Expected Conversions | CPA Target |
|----------|----------------|-----------------|----------------------|------------|
| Brand Protection | $100 | 50 | 10 | $10 |
| High-Intent Search | $2,000 | 200-400 | 40-80 | $25-50 |
| Display Retargeting | $500 | 500-1,000 | 10-20 | $25-50 |
| Performance Max | $1,500 | Variable | 30-60 | $25-50 |
| **Total** | **$4,100** | **750-1,450** | **90-170** | **~$25** |

**Assumptions:**
- Avg CPC: $5-10 (high-intent senior care keywords)
- Conversion Rate: 10-20% (well-optimized landing pages)
- Lead Value: $50-100 (based on LTV estimates)

---

## 💡 Phase 6: Creative & Messaging

### **Ad Variant Themes (Codex's Suggestion)**

#### **1. Urgency-Focused**
**Target:** Hospital discharge planners, families in crisis
```
Headline: Hospital Discharge in 48 Hours?
Description: Find facilities with immediate availability. Medicare/Medicaid accepted. Call now.
Landing Page: /landing/urgent-placement
```

#### **2. Insurance-Focused**
**Target:** Families concerned about affordability
```
Headline: Medicaid-Accepting Nursing Homes Near You
Description: 15,000+ verified Medicaid facilities. Free comparison tool. No hidden costs.
Landing Page: /landing/medicaid
```

#### **3. Proximity-Focused**
**Target:** Families near specific hospitals
```
Headline: Nursing Homes Near [Hospital Name]
Description: 50+ facilities within 5 miles of [Hospital]. Compare ratings, availability, and insurance.
Landing Page: /results with pre-filtered ZIP
```
*(Use Dynamic Search Ads with location insertion)*

#### **4. Condition-Specific**
**Target:** Families dealing with specific needs
```
Headline: Memory Care for Alzheimer's & Dementia
Description: Specialized facilities with trained staff and secure environments. 12,000+ options nationwide.
Landing Page: /landing/memory-care
```

---

## 🌱 Phase 7: Lead Nurture (Week 13+)

### **Email Automation (Resend)**

**Trigger:** Lead form submitted but didn't call facility

**Email Sequence:**

**Day 0 (Immediate):**
- Subject: "Your SunsetWell Facility Matches"
- Content: Recap of facilities they inquired about, links to detailed profiles
- CTA: "Call [Facility Name]" buttons

**Day 2:**
- Subject: "3 Questions to Ask on Your Facility Tour"
- Content: Checklist PDF, facility comparison tips
- CTA: "Schedule Tours Now"

**Day 5:**
- Subject: "Still Looking for Senior Care? Here's What Others Chose"
- Content: Success stories, testimonials from similar situations
- CTA: "View More Facilities"

**Day 10:**
- Subject: "New Facilities Added Near You"
- Content: Latest additions in their ZIP code
- CTA: "Explore New Options"

#### **Implementation:**

```tsx
// src/lib/email/nurture.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNurtureEmail(stage: number, lead: Lead) {
  const templates = {
    0: {
      subject: 'Your SunsetWell Facility Matches',
      template: 'facility-matches',
    },
    2: {
      subject: '3 Questions to Ask on Your Facility Tour',
      template: 'tour-checklist',
    },
    5: {
      subject: 'Still Looking for Senior Care? Here's What Others Chose',
      template: 'social-proof',
    },
    10: {
      subject: 'New Facilities Added Near You',
      template: 'new-facilities',
    },
  };

  const { subject, template } = templates[stage];

  await resend.emails.send({
    from: 'SunsetWell <noreply@sunsetwell.com>',
    to: lead.email,
    subject,
    react: EmailTemplate({ template, lead }),
  });
}
```

---

### **Simple CRM Dashboard (Supabase)**

**Create Leads Table:**
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT NOT NULL,
  phone TEXT,
  session_id UUID REFERENCES user_sessions(id),
  facility_id TEXT,
  facility_name TEXT,
  source TEXT, -- 'organic', 'google_ads', 'display', etc.
  campaign TEXT, -- UTM campaign name
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted', 'lost'
  value NUMERIC, -- estimated LTV
  notes TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
```

**Dashboard Page:**
```tsx
// src/app/admin/leads/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function LeadsPage() {
  const supabase = createClient();

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Leads Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard title="New Leads" value={stats.new} color="blue" />
        <StatCard title="Contacted" value={stats.contacted} color="yellow" />
        <StatCard title="Converted" value={stats.converted} color="green" />
        <StatCard title="Avg. Value" value={`$${stats.avgValue}`} color="purple" />
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leads?.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{lead.email}</div>
                  <div className="text-sm text-gray-500">{lead.phone}</div>
                </td>
                <td className="px-6 py-4 text-sm">{lead.facility_name}</td>
                <td className="px-6 py-4">
                  <Badge variant={getBadgeVariant(lead.source)}>
                    {lead.source}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm">${lead.value || 0}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(lead.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 🔒 Phase 8: Compliance & Privacy (Week 14)

### **Privacy Audit**

#### **1. Updated Cookie Banner**

```tsx
// src/components/privacy/cookie-consent.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setShow(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      advertising: true,
      timestamp: new Date().toISOString(),
    }));
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true, // Always required
      analytics: false,
      advertising: false,
      timestamp: new Date().toISOString(),
    }));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-6 z-50 shadow-2xl">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">We Use Cookies</h3>
            <p className="text-sm text-gray-300">
              We use cookies and work with Google Analytics, Google Ads, and Google Tag Manager to improve your experience and measure our marketing effectiveness.
              {' '}
              <Link href="/privacy-policy" className="underline">
                Learn more
              </Link>
              {' | '}
              <Link href="/cookie-settings" className="underline">
                Customize settings
              </Link>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              className="px-6 py-2 bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              Decline Optional
            </button>
            <button
              onClick={handleAccept}
              className="px-6 py-2 bg-sunset-orange rounded-lg text-sm font-semibold hover:bg-sunset-orange/90 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

#### **2. Privacy Policy Updates**

Add to `/privacy-policy` page:

**Tracking Technologies Section:**
```
We use the following tracking technologies:

1. Google Tag Manager - Tag management system
2. Google Analytics 4 - Website analytics and user behavior
3. Google Ads - Conversion tracking and remarketing
4. CallRail (optional) - Call tracking and analytics

You can opt-out of:
- Google Analytics: https://tools.google.com/dlpage/gaoptout
- Google Ads: https://adssettings.google.com
- Interest-based advertising: https://optout.aboutads.info

Data collected:
- Browsing behavior (pages visited, time on site)
- Device information (browser, OS, screen size)
- Location (city/state from IP, not precise GPS)
- Search queries (ZIP code, insurance type, conditions)

Data NOT collected:
- Health information (HIPAA-protected)
- Social Security numbers
- Financial account information
- Precise geolocation without consent
```

**Third-Party Sharing:**
```
We share data with:
- Google LLC (Analytics, Ads, Tag Manager)
- CallRail (if call tracking enabled)
- Resend (email delivery)

We do NOT sell your personal information.
```

---

#### **3. HIPAA Considerations**

**Important:** SunsetWell is **not** a covered entity under HIPAA because we don't provide healthcare services or process claims. However, we should still:

**Best Practices:**
- ✅ Don't collect Protected Health Information (PHI)
- ✅ Don't ask for diagnoses (we ask for general "conditions" only)
- ✅ Don't store medical records
- ✅ Use secure connections (HTTPS only)
- ✅ Anonymize analytics data (no PII in GA4)

**Safe Data Points:**
- ✅ ZIP code (location)
- ✅ Insurance type (Medicare, Medicaid, etc.)
- ✅ General conditions (dementia, mobility, etc.) - NOT specific diagnoses
- ✅ Relationship (adult child, spouse, etc.)

**Unsafe Data Points (DO NOT COLLECT):**
- ❌ Full name + diagnosis together
- ❌ Social Security numbers
- ❌ Medical record numbers
- ❌ Specific medical history

---

## 📊 Measurement & Optimization

### **Key Performance Indicators (KPIs)**

| Metric | Target | Current | Tool |
|--------|--------|---------|------|
| **Traffic Metrics** | | | |
| Organic Traffic | 10,000/mo | 0 | GA4 |
| Paid Traffic | 5,000/mo | 0 | Google Ads |
| CTR (Search Ads) | 3-5% | - | Google Ads |
| Quality Score | 7+ | - | Google Ads |
| **Conversion Metrics** | | | |
| Lead Form Submissions | 200/mo | - | GA4 + GTM |
| Phone Clicks | 100/mo | - | CallRail |
| View Results Sessions | 500/mo | - | GA4 |
| Conversion Rate | 10-20% | - | GA4 |
| **Revenue Metrics** | | | |
| Cost Per Lead (CPL) | $25-50 | - | Google Ads |
| Lead Value (LTV) | $100-200 | - | CRM |
| ROAS | 2:1+ | - | Google Ads |
| **UX Metrics** | | | |
| Bounce Rate | <50% | - | GA4 |
| Avg. Session Duration | 3+ min | - | GA4 |
| Pages/Session | 3+ | - | GA4 |

---

### **Weekly Optimization Checklist**

**Mondays - Campaign Review:**
- [ ] Check budget pacing (spending evenly across month?)
- [ ] Identify top-performing keywords (add to exact match)
- [ ] Identify underperforming keywords (pause or adjust bids)
- [ ] Review Quality Scores (< 6? Fix ad copy or landing page)

**Wednesdays - Creative Testing:**
- [ ] Launch new ad variant (test headline/description)
- [ ] Review landing page bounce rates (> 60%? Test new copy)
- [ ] Check remarketing creative fatigue (same users seeing ads 10+ times?)

**Fridays - Conversion Analysis:**
- [ ] Review lead quality (are they converting to tours/placements?)
- [ ] Analyze conversion paths (which touchpoints matter most?)
- [ ] Update bid strategies (shift budget to top-converting campaigns)
- [ ] Report to stakeholders (leads, CPL, ROAS)

---

## 💰 ROI Projection

### **Conservative Scenario (Month 6)**

**Investment:**
- Google Ads: $4,100/month
- CallRail: $45/month
- Email (Resend): $20/month
- **Total: $4,165/month**

**Returns:**
- Paid traffic: 5,000 visitors/month
- Conversion rate: 10%
- Leads: 500/month
- Lead value: $100 (avg)
- **Revenue: $50,000/month**

**Net Profit: $45,835/month**
**ROI: 1,100%**

**Assumptions:**
- 10% of leads convert to facility placements
- SunsetWell earns $100 per placement (affiliate or lead gen)
- OR: $50,000 in AdSense passive revenue from traffic

---

### **Aggressive Scenario (Month 12)**

**Investment:**
- Google Ads: $10,000/month (scaled up)
- CallRail: $145/month (premium)
- Email: $80/month
- CRM/Tools: $200/month
- **Total: $10,425/month**

**Returns:**
- Paid traffic: 15,000 visitors/month
- Conversion rate: 15% (optimized)
- Leads: 2,250/month
- Lead value: $150 (higher quality)
- **Revenue: $337,500/month**

**Net Profit: $327,075/month**
**ROI: 3,038%**

---

## 🚀 Implementation Timeline

| Phase | Week | Key Deliverables | Owner |
|-------|------|------------------|-------|
| **Phase 1: Tracking** | 1-2 | GTM setup, conversion tracking, GA4 integration | Dev Team |
| **Phase 2: Landing Pages** | 3-4 | 4 theme landing pages (memory care, VA, urgent, Medicaid) | Dev + Marketing |
| **Phase 3: Call Tracking** | 5 | CallRail integration, dynamic number insertion | Dev Team |
| **Phase 4: Remarketing** | 6-8 | Audience creation, display creatives, PMax setup | Marketing |
| **Phase 5: Campaigns** | 9-12 | Launch search, display, PMax campaigns | Marketing |
| **Phase 6: Creative** | 9-12 | Ad variants, A/B testing | Marketing |
| **Phase 7: Nurture** | 13+ | Email automation, CRM dashboard | Dev + Marketing |
| **Phase 8: Compliance** | 14 | Cookie banner, privacy policy updates | Legal + Dev |
| **Ongoing** | Weekly | Optimization, reporting, scaling | Marketing |

---

## ✅ Success Criteria

### **Month 3 Goals:**
- [ ] GTM tracking 100% accurate (verified in GA4)
- [ ] 4 landing pages live and converting at 10%+
- [ ] 100+ leads from paid ads
- [ ] CPL below $50
- [ ] Quality Score 6+ on core keywords

### **Month 6 Goals:**
- [ ] 500+ leads/month from paid ads
- [ ] CPL below $30 (economies of scale)
- [ ] ROAS 3:1 or higher
- [ ] Remarketing audiences building (10k+ users)
- [ ] Email nurture converting 5% of leads

### **Month 12 Goals:**
- [ ] 2,000+ leads/month
- [ ] CPL below $25
- [ ] ROAS 5:1 or higher
- [ ] Organic + Paid traffic synergy (50/50 split)
- [ ] Self-sustaining (ads pay for themselves + profit)

---

## 🎓 Training & Resources

### **Google Ads Certification:**
- Free at https://skillshop.withgoogle.com
- Modules: Search, Display, Measurement, Shopping

### **GTM Training:**
- Analytics Mania GTM course (free)
- Measure School YouTube channel

### **Call Tracking:**
- CallRail Academy (free video tutorials)

### **Healthcare Ads Compliance:**
- Google Ads Healthcare policy: https://support.google.com/adspolicy/answer/176031
- FTC health claims guidelines

---

## 📝 Final Recommendations

### **Codex's Suggestions - Evaluation:**

| Suggestion | Status | Priority | Notes |
|------------|--------|----------|-------|
| Ship GTM + GA4 | ✅ Approved | P0 | Foundation for all tracking |
| Define conversions | ✅ Approved | P0 | 5 conversions identified |
| Remarketing audiences | ✅ Approved | P1 | High ROI, low cost |
| Dedicated landing pages | ✅ Approved | P0 | Critical for QS + conversion |
| Call tracking (DNI) | ✅ Approved | P1 | CallRail recommended |
| Performance Max + Display | ✅ Approved | P1 | Best for remarketing |
| Ad variants (urgency/insurance) | ✅ Approved | P0 | Matches our filters |
| Structured data on landing pages | ✅ Approved | P1 | Leverage existing SEO work |
| Location-focused content | ✅ Approved | P2 | SEO synergy |
| Email nurture | ✅ Approved | P1 | Resend already integrated |
| CRM dashboard | ✅ Approved | P1 | Supabase-based |
| Privacy audit | ✅ Approved | P0 | Legal requirement |

**All recommendations approved.** No conflicts identified.

---

## 🔗 Integration with Existing Work

### **Builds On:**
- ✅ Mobile-first design (landing pages reuse components)
- ✅ SEO structured data (copy to landing pages)
- ✅ Click-to-call buttons (already instrumented for tracking)
- ✅ Map view (additional conversion point)
- ✅ Sunset brand (consistent creative)

### **Complements:**
- ✅ AdSense (different revenue stream)
- ✅ Organic SEO (paid ads boost while SEO ramps)
- ✅ Content strategy (landing pages = SEO pages)

---

Built with care for SunsetWell.com 🌅

**Created:** October 10, 2025
**Status:** Ready for Implementation
