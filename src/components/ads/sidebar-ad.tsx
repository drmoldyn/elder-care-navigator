import { AdContainer } from "./ad-container";
import { AdSenseUnit } from "./adsense-script";

/**
 * Desktop sidebar ad for results and map pages
 * Hidden on mobile (< 1024px)
 * Vertical rectangle format (300x600)
 */
export function SidebarAd() {
  return (
    <div className="hidden lg:block">
      <AdContainer variant="sidebar" className="sticky top-4">
        <p className="mb-3 text-sm font-medium text-gray-700">
          Related Services
        </p>
        <AdSenseUnit
          adSlot="3456789012" // Replace with actual slot ID from AdSense
          adFormat="vertical"
          fullWidthResponsive={false}
          style={{
            display: "inline-block",
            width: "300px",
            height: "600px",
          }}
        />
      </AdContainer>
    </div>
  );
}
