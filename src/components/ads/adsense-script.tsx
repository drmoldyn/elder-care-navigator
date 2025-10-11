"use client";

import Script from "next/script";
import { useEffect } from "react";

interface AdSenseScriptProps {
  publisherId: string;
}

/**
 * Global AdSense script loader
 * Add to root layout.tsx
 */
export function AdSenseScript({ publisherId }: AdSenseScriptProps) {
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

interface AdSenseUnitProps {
  adSlot: string;
  adFormat?: "auto" | "fluid" | "horizontal" | "rectangle" | "vertical";
  adLayout?: string;
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Individual AdSense ad unit
 * Must be wrapped in AdContainer for consistent styling
 */
export function AdSenseUnit({
  adSlot,
  adFormat = "auto",
  adLayout,
  fullWidthResponsive = true,
  style,
  className = "",
}: AdSenseUnitProps) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "";

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // @ts-expect-error - adsbygoogle is loaded by external script
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  // Show placeholder in development
  if (process.env.NODE_ENV === "development" && !publisherId) {
    return (
      <div
        className={`flex min-h-[250px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 ${className}`}
        style={style}
      >
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">
            AdSense Placeholder
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Set NEXT_PUBLIC_ADSENSE_PUBLISHER_ID
          </p>
          <p className="mt-1 text-xs text-gray-400">Slot: {adSlot}</p>
        </div>
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{
        display: "block",
        ...style,
      }}
      data-ad-client={publisherId}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-ad-layout-key={adLayout}
      data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      data-adtest={process.env.NODE_ENV === "development" ? "on" : "off"}
    />
  );
}
