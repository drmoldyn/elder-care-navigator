# Google AdSense Setup Guide

Quick start guide for enabling Google AdSense on SunsetWell.com.

---

## Prerequisites

- Google account
- Domain ownership verification
- Live website (ads cannot be tested on localhost with real IDs)

---

## Step 1: Create AdSense Account

1. Go to https://www.google.com/adsense
2. Click "Get Started"
3. Enter your website URL: `sunsetwell.com`
4. Enter your email address
5. Accept terms and conditions

---

## Step 2: Verify Domain Ownership

Google will provide a verification code. Add it to your site:

**Method 1: DNS Verification (Recommended)**
```bash
# Add TXT record to your DNS settings
# Name: @
# Value: google-site-verification=XXXXXXXXXXXXXXXXXXXX
```

**Method 2: HTML Meta Tag**
Already handled by our layout.tsx if you add to metadata.verification:
```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  verification: {
    google: 'your-google-verification-code',
  },
};
```

---

## Step 3: Wait for Approval

- Google reviews your site (1-2 weeks)
- They check for:
  - Original content ✓ (we have facility search)
  - Privacy policy ✓ (add to footer)
  - Sufficient content ✓ (75k facilities)
  - Compliant content ✓ (healthcare is allowed)

---

## Step 4: Get Your Publisher ID

Once approved:
1. Go to AdSense dashboard
2. Find your publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXX`)
3. Copy it

---

## Step 5: Configure Environment Variables

Add to `.env.local` (NOT committed to git):

```bash
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-1234567890123456
```

Restart your dev server:
```bash
pnpm dev
```

---

## Step 6: Create Ad Units in AdSense Dashboard

### Homepage Ad
1. Go to AdSense → Ads → By ad unit → Display ads
2. Click "New ad unit"
3. Name: "SunsetWell - Homepage Banner"
4. Ad size: Responsive
5. Copy ad slot ID (e.g., `1234567890`)

### Results Inline Ad
1. Create another ad unit
2. Name: "SunsetWell - Results Inline"
3. Ad size: Responsive rectangle
4. Copy ad slot ID

### Sidebar Ad (Desktop)
1. Create another ad unit
2. Name: "SunsetWell - Sidebar"
3. Ad size: Vertical rectangle (300x600)
4. Copy ad slot ID

### Compare Page Ad
1. Create another ad unit
2. Name: "SunsetWell - Compare Bottom"
3. Ad type: Matched content
4. Copy ad slot ID

---

## Step 7: Update Ad Slot IDs

Replace placeholder IDs in these files:

**src/components/ads/homepage-ad.tsx:**
```tsx
<AdSenseUnit
  adSlot="YOUR_HOMEPAGE_SLOT_ID" // Replace 1234567890
  adFormat="horizontal"
/>
```

**src/components/ads/results-inline-ad.tsx:**
```tsx
<AdSenseUnit
  adSlot="YOUR_RESULTS_SLOT_ID" // Replace 2345678901
  adFormat="auto"
/>
```

**src/components/ads/sidebar-ad.tsx:**
```tsx
<AdSenseUnit
  adSlot="YOUR_SIDEBAR_SLOT_ID" // Replace 3456789012
  adFormat="vertical"
/>
```

**src/components/ads/compare-ad.tsx:**
```tsx
<AdSenseUnit
  adSlot="YOUR_COMPARE_SLOT_ID" // Replace 4567890123
  adFormat="fluid"
/>
```

---

## Step 8: Deploy to Production

Ads won't show in development (you'll see placeholders). Deploy to Vercel/production:

```bash
git add .
git commit -m "Add Google AdSense integration"
git push origin main
```

Set environment variable in Vercel:
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` = `ca-pub-XXXXXXXXXXXXXXXX`
3. Redeploy

---

## Step 9: Verify Ads Are Showing

1. Visit your live site (not localhost)
2. Open DevTools → Network tab
3. Filter by "googlesyndication"
4. You should see requests to AdSense servers
5. Ads may take 10-30 minutes to start showing after deployment

**Initial ad serving notes:**
- Ads are blank for first 24-48 hours (Google is learning)
- You may see PSAs (Public Service Announcements) initially
- Revenue tracking starts after first impressions

---

## Testing Without Real Ads

During development, the components show placeholders:

```
┌─────────────────────────────┐
│  AdSense Placeholder         │
│  Set NEXT_PUBLIC_ADSENSE_... │
│  Slot: 1234567890            │
└─────────────────────────────┘
```

To test with test ads (won't generate revenue):
- AdSense automatically serves test ads in development mode
- `data-adtest="on"` is set automatically

---

## Monitoring Performance

### AdSense Dashboard
- Go to https://adsense.google.com
- View: Earnings, Impressions, CTR, RPM
- Report by: Ad unit, page, country

### Google Analytics (Optional)
Link AdSense to Analytics for deeper insights:
1. AdSense → Account → Access and authorization → Google Analytics integration
2. Select your Analytics property
3. View ad performance alongside user behavior

---

## Troubleshooting

### Ads not showing?

**Check 1: Publisher ID set?**
```bash
echo $NEXT_PUBLIC_ADSENSE_PUBLISHER_ID
# Should output: ca-pub-XXXXXXXXXXXXXXXX
```

**Check 2: Environment variable in Vercel?**
- Vercel Dashboard → Settings → Environment Variables
- Must be prefixed with `NEXT_PUBLIC_` to be available in browser

**Check 3: Ad blockers disabled?**
- Test in incognito mode
- Check if your network/ISP blocks ads

**Check 4: Console errors?**
- Open DevTools → Console
- Look for AdSense-related errors
- Common: "AdSense account not approved" or "Ad request failed"

**Check 5: Page policy violations?**
- AdSense → Policy center
- Check for violations (e.g., too many ads, content issues)

### Low revenue / blank ads?

- **First 48 hours**: Normal - Google is learning
- **Ad blockers**: ~25% of users block ads (can't prevent)
- **Low traffic**: Need volume for revenue (target: 10k+ monthly visitors)
- **Non-targeted ads**: Takes time for Google to learn your audience

---

## Best Practices

### Do:
✅ Place ads in natural content breaks
✅ Use clear "Sponsored" labels
✅ Monitor bounce rate (remove ads if it increases >5%)
✅ Use responsive ad formats for mobile
✅ Respect user experience (fewer ads on mobile)

### Don't:
❌ Click your own ads (account ban risk)
❌ Ask users to click ads
❌ Place ads above all organic content
❌ Use more than 3 ad units per page
❌ Place ads too close to buttons (accidental clicks)

---

## Revenue Expectations

**Conservative estimates for senior care niche:**

| Monthly Visitors | Impressions | Revenue/Month |
|------------------|-------------|---------------|
| 10,000           | 30,000      | $300 - $900   |
| 50,000           | 150,000     | $1,500 - $4,500 |
| 100,000          | 300,000     | $3,000 - $9,000 |

**Assumptions:**
- 3 ad impressions per visitor
- $10 CPM (cost per 1,000 impressions)
- 1% CTR (click-through rate)
- $2 CPC (cost per click)

**Actual revenue depends on:**
- User location (US/UK = higher CPM)
- Device type (desktop = higher CPM than mobile)
- Ad placement (above fold = higher viewability)
- Seasonality (Q4 = higher ad spend)

---

## Privacy & Compliance

### Required: Privacy Policy

Add to footer with link to privacy policy covering:
- We use Google AdSense
- Cookies/tracking for personalized ads
- Users can opt-out via Google Ad Settings
- Link to Google's privacy policy

**Example footer text:**
```
SunsetWell uses cookies and works with Google AdSense to show you relevant ads.
View our Privacy Policy | Manage Ad Settings
```

### GDPR/CCPA Compliance

For EU/California users:
1. Add cookie consent banner (use OneTrust or Cookiebot)
2. Allow users to opt-out of personalized ads
3. Update privacy policy with data collection details

**Simple implementation:**
```tsx
// src/components/layout/cookie-consent.tsx
"use client";

import { useState, useEffect } from 'react';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setShow(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm">
          We use cookies and work with Google AdSense to provide relevant ads.
          <a href="/privacy" className="underline ml-1">Learn more</a>
        </p>
        <button
          onClick={handleAccept}
          className="bg-sunset-orange text-white px-6 py-2 rounded-lg text-sm font-semibold"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
```

---

## Next Steps

1. ✅ Apply for AdSense account
2. ✅ Get approved (wait 1-2 weeks)
3. ✅ Add publisher ID to environment variables
4. ✅ Create ad units and update slot IDs
5. ✅ Deploy to production
6. ⏳ Monitor performance for first week
7. ⏳ Adjust placements if bounce rate increases
8. ⏳ Scale traffic via SEO (see docs/SEO-STRATEGY.md)

---

Built with care for SunsetWell.com 🌅
