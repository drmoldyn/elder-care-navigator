# Google Tag Manager Setup & Testing Guide

## Phase 1: GTM Account Setup

### 1. Create GTM Account
1. Go to https://tagmanager.google.com
2. Click "Create Account"
3. Account Name: `SunsetWell`
4. Container Name: `sunsetwell.com`
5. Target Platform: **Web**
6. Click "Create" and accept Terms of Service

### 2. Configure GTM Container ID
1. Copy your Container ID (format: `GTM-XXXXXXX`)
2. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
   ```
3. Restart dev server: `pnpm dev`

## Phase 2: Development Testing

### 1. Enable GTM Preview Mode
1. In GTM, click **Preview** (top right)
2. Enter your development URL: `http://localhost:3003`
3. Click **Connect**
4. A new tab will open with GTM debugger attached

### 2. Test Event Tracking

**Navigate to results page:**
1. Go to homepage
2. Fill out navigator form
3. Submit to reach `/results/[sessionId]`

**Expected Events in GTM Preview:**

#### A. Page View Event (`view_results_session`)
- **Trigger:** Results page loads with facilities
- **Event:** `conversion`
- **Data Layer Variables:**
  ```javascript
  {
    event: "conversion",
    conversion_name: "view_results_session",
    conversion_value: 10,
    currency: "USD",
    sessionId: "abc123...",
    facilityCount: 12,
    zipCode: "22201",
    conditions: ["mobility", "memory_care"]
  }
  ```

#### B. Phone Click Event (`phone_click`)
- **Trigger:** Click "Call" or "Call Now" button
- **Event:** `conversion`
- **Data Layer Variables:**
  ```javascript
  {
    event: "conversion",
    conversion_name: "phone_click",
    conversion_value: 30,
    currency: "USD",
    facilityId: "uuid-123",
    facilityName: "Sunrise Senior Living",
    phoneNumber: "+1-555-123-4567"
  }
  ```

### 3. Console Verification (Development Mode)

In browser console, you should see:
```
[GTM] Container GTM-XXXXXXX loaded
[Analytics] Event tracked: conversion {conversion_name: "view_results_session", ...}
[Analytics] Event tracked: conversion {conversion_name: "phone_click", ...}
```

### 4. Check dataLayer Directly

In browser console:
```javascript
// View all events
window.dataLayer

// Filter for conversion events
window.dataLayer.filter(e => e.event === 'conversion')
```

## Phase 3: Production Setup

### 1. GTM Tags Configuration

#### Tag 1: Google Analytics 4 (GA4)
1. **Tag Type:** Google Analytics: GA4 Event
2. **Configuration Tag:** Create new GA4 Configuration
3. **Measurement ID:** Get from Google Analytics (G-XXXXXXXXXX)
4. **Trigger:** All Pages

#### Tag 2: Google Ads Conversion Tracking
1. **Tag Type:** Google Ads Conversion Tracking
2. **Conversion ID:** Get from Google Ads (AW-XXXXXXXXXX)
3. **Conversion Label:** Create separate labels for:
   - `lead_form_submit` (value: $50)
   - `phone_click` (value: $30)
   - `view_results_session` (value: $10)
   - `compare_facilities` (value: $5)
4. **Trigger:** Custom Event → `conversion`
5. **Trigger Conditions:** `conversion_name equals phone_click` (repeat for each)

### 2. Variables Configuration

Create these **Data Layer Variables** in GTM:

| Variable Name | Data Layer Variable Name |
|--------------|--------------------------|
| DL - Conversion Name | `conversion_name` |
| DL - Conversion Value | `conversion_value` |
| DL - Currency | `currency` |
| DL - Facility ID | `facilityId` |
| DL - Facility Name | `facilityName` |
| DL - Session ID | `sessionId` |
| DL - Facility Count | `facilityCount` |
| DL - Zip Code | `zipCode` |

### 3. Deploy Container
1. Click **Submit** (top right)
2. Version Name: `v1.0 - Initial conversion tracking`
3. Description: `Phone clicks, results views, form submits`
4. Click **Publish**

### 4. Production Testing
1. Deploy to production with `NEXT_PUBLIC_GTM_ID` set
2. Use GTM Preview on production domain
3. Verify events fire correctly
4. Check Google Analytics Real-Time report
5. Verify conversions in Google Ads (24-48hr delay)

## Phase 4: Advanced Tracking (Future)

### Events Not Yet Implemented
These are defined in `src/lib/analytics/events.ts` but not wired up yet:

- `trackLeadFormSubmit()` - Request info form submission ($50)
- `trackCompareFacilities()` - Add to comparison ($5)
- `trackMapSearch()` - Map view search ($3)
- `trackFilterUsage()` - Filter application
- `trackFormAbandonment()` - Incomplete forms
- `trackError()` - Error tracking

### Remarketing Audiences
Create in GA4 → Admin → Audiences:
1. **All Visitors** (baseline)
2. **Viewed Results** (conversion event: `view_results_session`)
3. **Phone Clickers** (conversion event: `phone_click`)
4. **Non-Converters** (viewed results but no phone/form)
5. **Memory Care Searchers** (conditions contains "memory_care")
6. **VA Eligible** (insurance contains "VA")

## Troubleshooting

### GTM Not Loading
- Check `.env.local` has `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX`
- Verify no console errors
- Check Network tab for `gtm.js` request
- Restart dev server after adding env var

### Events Not Firing
- Check browser console for `[Analytics] Event tracked` logs
- Verify `window.dataLayer` exists
- Check GTM Preview debugger
- Ensure component is client-side (`onClick` works)

### dataLayer Empty
- GTM container may not be loaded yet
- Check GTM Preview connection
- Hard refresh page (Cmd+Shift+R)

### Conversions Not in Google Ads
- Allow 24-48 hours for data
- Verify conversion tag has correct label
- Check GTM tag fired in Preview
- Verify conversion action is active in Ads

## Testing Checklist

- [ ] GTM account created
- [ ] Container ID added to `.env.local`
- [ ] Dev server restarted
- [ ] GTM Preview connected to localhost:3003
- [ ] Results page loads without errors
- [ ] `view_results_session` event fires on page load
- [ ] Console shows "[Analytics] Event tracked: conversion"
- [ ] `phone_click` event fires on button click
- [ ] dataLayer shows both events
- [ ] GA4 tag configured in GTM
- [ ] Google Ads conversion tags configured
- [ ] Variables created for all data layer fields
- [ ] Container published to production
- [ ] Production deployment tested
- [ ] Real-Time reports showing data in GA4
- [ ] Conversions appearing in Google Ads (48hr wait)

## Resources

- [GTM Documentation](https://support.google.com/tagmanager)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)
- [Google Ads Conversion Tracking](https://support.google.com/google-ads/answer/6095821)
- [dataLayer Reference](https://developers.google.com/tag-platform/tag-manager/datalayer)

## Current Implementation Status

✅ **Completed:**
- GTM container component (`src/components/analytics/google-tag-manager.tsx`)
- Event tracking helpers (`src/lib/analytics/events.ts`)
- Results page view tracking
- Phone click tracking (mobile + desktop)
- Environment configuration

⏳ **Next Steps:**
1. Create GTM account and configure container ID
2. Test with GTM Preview in development
3. Wire up remaining conversions (form submit, compare, map)
4. Configure GA4 and Google Ads tags
5. Deploy to production
