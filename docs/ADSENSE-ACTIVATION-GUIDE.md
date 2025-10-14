# Google AdSense Activation Guide

## Current Status
✅ **Infrastructure Ready** - All AdSense components are built and integrated
🔧 **Need Configuration** - Requires Google AdSense account and Publisher ID

---

## Step-by-Step Activation Process

### **Step 1: Apply for Google AdSense (1-3 days)**

1. **Visit**: https://www.google.com/adsense
2. **Sign in** with your Google account (or create one)
3. **Click "Get Started"**
4. **Add your website**: Enter `sunsetwell.com`
5. **Fill out required information**:
   - Country: United States
   - Accept AdSense terms and conditions
   - Submit application

#### What Google Checks:
- ✅ Site has enough original content
- ✅ Site complies with AdSense policies
- ✅ Site has good user experience
- ✅ Site navigation is clear

**Expected Timeline**: 1-3 days for initial review

---

### **Step 2: Verify Site Ownership**

Once your application is submitted, Google will provide a verification code. You have two options:

#### **Option A: HTML Meta Tag (Recommended)**

Google will provide a code like:
```html
<meta name="google-adsense-account" content="ca-pub-XXXXXXXXXXXXXXXX">
```

**To add it:**

1. Open `/src/app/layout.tsx`
2. Find line 78 where it says:
   ```typescript
   // google: 'paste-your-adsense-verification-code-here',
   ```
3. Uncomment and replace with your code:
   ```typescript
   google: 'ca-pub-XXXXXXXXXXXXXXXX',
   ```

#### **Option B: DNS TXT Record**

If you manage DNS directly:
1. Go to your DNS provider (e.g., Vercel, Cloudflare)
2. Add TXT record with the code Google provides
3. Wait 24-48 hours for DNS propagation

---

### **Step 3: Add Publisher ID to Environment**

Once approved, you'll receive a Publisher ID like: `ca-pub-1234567890123456`

**To activate ads:**

1. Open `.env.local` (line 33)
2. Replace the placeholder:
   ```bash
   NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
   ```
   With your actual ID:
   ```bash
   NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-1234567890123456
   ```

3. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   pnpm dev
   ```

✅ **Ads will now load!** You'll see placeholders in development and real ads in production.

---

### **Step 4: Create Ad Units in AdSense Dashboard**

After approval, create specific ad units:

1. **Go to**: AdSense Dashboard → Ads → Overview
2. **Click "By ad unit"** → "+ New ad unit"

#### **Create These Ad Units:**

##### **Ad Unit 1: State Pages - Mid Content**
- **Name**: State Pages - Sponsored Resources
- **Type**: Display ads → Responsive
- **Format**: Horizontal or square
- **Copy the ad slot ID** (e.g., `1234567890`)

##### **Ad Unit 2: State Pages - Bottom Content**
- **Name**: State Pages - Planning Resources
- **Type**: Display ads → Responsive
- **Format**: Horizontal or square
- **Copy the ad slot ID** (e.g., `0987654321`)

---

### **Step 5: Update Ad Slot IDs**

Replace the placeholder ad slot IDs in `/src/app/states/[state]/page.tsx`:

**Line 410** (First ad):
```typescript
<AdSenseUnit
  adSlot="1234567890"  // ← Replace with your actual Ad Unit 1 slot ID
  adFormat="auto"
  fullWidthResponsive={true}
  className="min-h-[250px]"
/>
```

**Line 616** (Second ad):
```typescript
<AdSenseUnit
  adSlot="0987654321"  // ← Replace with your actual Ad Unit 2 slot ID
  adFormat="auto"
  fullWidthResponsive={true}
  className="min-h-[250px]"
/>
```

---

## Testing & Verification

### **In Development** (localhost:3000)

1. Visit any state page: `http://localhost:3000/states/fl`
2. You should see:
   - Gray placeholder boxes with "AdSense Placeholder" text
   - Ad slot IDs displayed
   - Text: "Set NEXT_PUBLIC_ADSENSE_PUBLISHER_ID"

✅ **If you see placeholders** = Setup is correct, just needs Publisher ID

### **After Adding Publisher ID**

1. Restart dev server
2. Visit state page again
3. You should see:
   - **Development**: Test ads (Google blocks real ads in dev)
   - **Production**: Real ads (after deployment)

### **In Production** (sunsetwell.com)

1. Deploy to Vercel/production
2. Add environment variable in Vercel:
   - Go to: Vercel Dashboard → Project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` = `ca-pub-XXXXXXXXXXXXXXXX`
   - Redeploy
3. Visit `https://sunsetwell.com/states/fl`
4. **Right-click ad area** → Inspect → Should see Google ad iframes

⚠️ **Note**: New ad units may take 24-48 hours to start serving ads after creation.

---

## Current Ad Placements

### **State Pages** (`/states/[state]`)

✅ **Ad 1: After Top Facilities List**
- **Location**: After "Top Nursing Homes in [State]" section
- **Why**: User has seen quality content, natural break
- **Format**: Responsive (300x250 or larger)
- **Label**: "Sponsored Resources"

✅ **Ad 2: Before Final CTA**
- **Location**: Before "Ready to Find the Right Facility?" section
- **Why**: User has completed research, planning next steps
- **Format**: Responsive (728x90 or larger)
- **Label**: "Planning Your Next Steps"

---

## Expected Revenue

### **Conservative Estimates** (Senior Care Niche)

| Monthly Visitors | Ad Impressions | Estimated Revenue/Month |
|------------------|----------------|-------------------------|
| 10,000           | 20,000         | $500 - $1,000           |
| 50,000           | 100,000        | $2,500 - $5,000         |
| 100,000          | 200,000        | $5,000 - $10,000        |

**Assumptions**:
- 2 ad impressions per state page visit
- CPM: $5-$10 (senior care is high-value niche)
- CTR: 0.5-1% (contextual relevance)

---

## Monitoring & Optimization

### **Week 1-2: Baseline Metrics**

Track these in Google Analytics:

1. **User Experience**:
   - Bounce rate (should stay < 50%)
   - Session duration (should maintain 2+ minutes)
   - Pages per session (should maintain 3+)

2. **Ad Performance** (AdSense Dashboard):
   - Impressions per day
   - Click-through rate (CTR) - target: > 0.5%
   - Revenue per thousand impressions (RPM) - target: > $5
   - Viewability - target: > 70%

### **Optimization Actions**

**If UX metrics decline**:
- Remove bottom ad (keep only mid-content ad)
- Test different ad formats
- Add more spacing around ads

**If ad performance is low (<$2 RPM)**:
- Enable "Auto ads" in AdSense (let Google optimize placement)
- Create more targeted ad units
- Review allowed/blocked ad categories

---

## Best Practices for Maximum Revenue

### **1. Enable Auto Ads** (After 2 weeks)

Let Google's AI optimize placements:
1. Go to AdSense → Ads → Overview
2. Click "Get started" under Auto ads
3. Select your site → Enable Auto ads
4. Configure settings:
   - ✅ Anchor ads (mobile bottom)
   - ✅ Vignette ads (page transitions)
   - ✅ In-page ads
   - ❌ Overlay ads (too intrusive)

### **2. Optimize Ad Formats**

Best performers for content sites:
- **Responsive display**: Adapts to any screen size
- **Matched content**: Native-looking, high engagement
- **In-article ads**: Blend with content

### **3. Monitor Policy Compliance**

Check AdSense Dashboard daily for:
- ⚠️ Policy violations (fix immediately)
- 📊 Invalid traffic reports
- 💰 Payment threshold ($100 minimum)

---

## Troubleshooting

### **Problem**: Ads not showing in production

**Solutions**:
1. Check environment variable is set in Vercel
2. Verify Publisher ID is correct (should start with `ca-pub-`)
3. Check browser console for errors
4. Wait 24-48 hours after creating ad units
5. Ensure no ad blocker is active

### **Problem**: "Ad serving limit placed on your AdSense account"

**Cause**: Google detected suspicious activity (click fraud, invalid traffic)

**Solutions**:
1. Review AdSense policy center for specific issues
2. Stop clicking your own ads
3. Check for bot traffic
4. Wait for review (typically 30 days)

### **Problem**: Low earnings despite high traffic

**Solutions**:
1. Enable Auto ads for better placement
2. Review ad categories (block low-paying categories)
3. Ensure ads are viewable (above fold or mid-content)
4. Check RPM in AdSense - if < $2, investigate

### **Problem**: Ads look bad / clash with design

**Solutions**:
1. Use responsive ad format (not fixed sizes)
2. Add custom CSS to ad containers
3. Use AdSense's "Review center" to block ugly ads
4. Enable "Sensitive category blocking" for brand safety

---

## Next Steps After Activation

### **Week 1**: Monitor closely
- Check AdSense dashboard daily
- Track bounce rate and session duration
- Adjust placements if UX suffers

### **Week 2-4**: Expand placements
Once baseline is established, consider adding ads to:
- Metro pages (`/metros/[slug]`)
- Location pages (`/locations/[...cityState]`)
- Compare page (`/compare`)
- Search results page

### **Month 2+**: Optimize for revenue
- Test different ad formats (A/B testing)
- Enable Auto ads
- Block low-performing ad categories
- Explore AdSense experiments

---

## Support Resources

- **AdSense Help Center**: https://support.google.com/adsense
- **Policy Center**: https://www.google.com/adsense/new/u/0/pub-XXXXXX/policy-center
- **AdSense Academy**: https://adsenseacademy.withgoogle.com/
- **Community Forum**: https://support.google.com/adsense/community

---

## Quick Reference: File Locations

| File | Purpose | Line Numbers |
|------|---------|--------------|
| `.env.local` | Add Publisher ID | Line 33 |
| `src/app/layout.tsx` | Verification code | Line 78 |
| `src/app/layout.tsx` | AdSense script loader | Line 160 |
| `src/app/states/[state]/page.tsx` | Ad placements | Lines 410, 616 |
| `src/components/ads/adsense-script.tsx` | AdSense components | Full file |

---

**Questions?** Check the documentation in `/docs/GOOGLE-ADS-INTEGRATION.md` for detailed strategy and additional placement recommendations.
