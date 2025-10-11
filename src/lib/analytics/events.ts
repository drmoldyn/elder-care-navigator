/**
 * Analytics event tracking utilities
 * Sends events to Google Tag Manager dataLayer
 *
 * Events are then processed by GTM and sent to:
 * - Google Analytics 4 (user behavior)
 * - Google Ads (conversion tracking)
 * - Other tags configured in GTM
 */

/**
 * Generic event tracker
 * Pushes custom events to dataLayer for GTM processing
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>
) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Event tracked:", eventName, eventParams);
    }
  } else if (process.env.NODE_ENV === "development") {
    console.warn("[Analytics] dataLayer not available. Is GTM loaded?");
  }
};

/**
 * Conversion tracking
 * Tracks high-value user actions with monetary value
 *
 * Conversion values guide Google Ads Smart Bidding
 */
export const trackConversion = (
  conversionName: string,
  value: number,
  params?: Record<string, unknown>
) => {
  trackEvent("conversion", {
    conversion_name: conversionName,
    conversion_value: value,
    currency: "USD",
    ...params,
  });
};

/**
 * Pre-defined conversion types
 * Based on user journey and intent level
 */

/**
 * Lead form submitted (highest intent)
 * Value: $50 - User requested facility contact
 */
export const trackLeadFormSubmit = (params: {
  facilityId: string;
  facilityName: string;
  formType: string;
  email?: string;
}) => {
  trackConversion("lead_form_submit", 50, params);
};

/**
 * Phone number clicked (very high intent)
 * Value: $30 - User initiated phone call
 */
export const trackPhoneClick = (params: {
  facilityId: string;
  facilityName: string;
  phoneNumber: string;
}) => {
  trackConversion("phone_click", 30, params);
};

/**
 * Viewed results session (mid-funnel)
 * Value: $10 - User completed navigator and saw matches
 */
export const trackViewResultsSession = (params: {
  sessionId: string;
  facilityCount: number;
  conditions?: string[];
  zipCode?: string;
}) => {
  trackConversion("view_results_session", 10, params);
};

/**
 * Added facility to comparison (research phase)
 * Value: $5 - User evaluating options
 */
export const trackCompareFacilities = (params: {
  facilityId: string;
  facilityCount: number;
}) => {
  trackConversion("compare_facilities", 5, params);
};

/**
 * Used map search (exploratory)
 * Value: $3 - User exploring via map
 */
export const trackMapSearch = (params: {
  zipCode?: string;
  state?: string;
  careType: string;
  insurance?: string[];
  radius?: number;
}) => {
  trackEvent("map_search", {
    ...params,
    insurance: params.insurance?.join(","),
  });
};

/**
 * Page view tracking
 * Automatically tracked by GTM, but can be manually triggered for SPAs
 */
export const trackPageView = (params: {
  page_path: string;
  page_title: string;
}) => {
  trackEvent("page_view", params);
};

/**
 * Form abandonment tracking
 * Tracks when user starts but doesn't complete a form
 */
export const trackFormAbandonment = (params: {
  formType: string;
  fieldsFilled: number;
  totalFields: number;
}) => {
  trackEvent("form_abandonment", params);
};

/**
 * Filter usage tracking
 * Tracks which filters users apply most often
 */
export const trackFilterUsage = (params: {
  filterType: string; // 'insurance', 'care_type', 'conditions', etc.
  filterValue: string;
  resultsCount?: number;
}) => {
  trackEvent("filter_usage", params);
};

/**
 * Social share tracking
 * If users share facility info
 */
export const trackSocialShare = (params: {
  platform: string; // 'facebook', 'twitter', 'email', etc.
  contentType: string; // 'facility', 'comparison', 'results'
  contentId?: string;
}) => {
  trackEvent("social_share", params);
};

/**
 * Download tracking
 * PDF comparisons, facility lists, etc.
 */
export const trackDownload = (params: {
  fileType: string; // 'pdf', 'csv', etc.
  fileName: string;
  contentType: string; // 'comparison', 'facility_list'
}) => {
  trackEvent("download", params);
};

/**
 * Error tracking
 * Track errors for debugging and UX improvement
 */
export const trackError = (params: {
  errorType: string; // 'api_error', 'validation_error', etc.
  errorMessage: string;
  page?: string;
}) => {
  trackEvent("error", params);
};

/**
 * Landing page CTA click tracking
 * Tracks when users click CTAs on landing pages
 */
export const trackLandingPageCTA = (params: {
  landingPage: string; // 'memory-care', 'va-benefits', 'urgent-placement', 'medicaid-facilities'
  ctaPosition: string; // 'hero', 'mid-page', 'footer'
  ctaText: string;
  destination: string;
}) => {
  trackConversion("landing_page_cta_click", 3, params);
};
