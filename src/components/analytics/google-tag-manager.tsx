"use client";

import Script from "next/script";

/**
 * Google Tag Manager (GTM) component
 * Loads GTM container for centralized tag management
 *
 * Setup:
 * 1. Create GTM account at https://tagmanager.google.com
 * 2. Create container (Web)
 * 3. Copy container ID (format: GTM-XXXXXXX)
 * 4. Add to .env.local: NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
 *
 * Benefits:
 * - Add/edit tracking tags without code changes
 * - Google Analytics 4, Google Ads, remarketing tags
 * - A/B testing tools, conversion tracking
 * - No redeployment needed for new tags
 */
export function GoogleTagManager() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  // Don't load GTM if no container ID configured
  if (!gtmId) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[GTM] NEXT_PUBLIC_GTM_ID not set. GTM will not load. Set in .env.local to enable."
      );
    }
    return null;
  }

  return (
    <>
      {/* GTM Script */}
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

      {/* GTM NoScript Fallback */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}

/**
 * TypeScript declaration for dataLayer
 * Allows TypeScript to recognize window.dataLayer
 */
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}
