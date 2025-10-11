import { AdContainer } from "./ad-container";
import { AdSenseUnit } from "./adsense-script";

/**
 * Homepage ad placement: Below hero, above "How it works"
 * Horizontal banner format for desktop, responsive on mobile
 */
export function HomepageAd() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex justify-center">
        <AdContainer variant="homepage">
          <AdSenseUnit
            adSlot="1234567890" // Replace with actual slot ID from AdSense
            adFormat="horizontal"
            style={{ minHeight: "90px" }}
          />
        </AdContainer>
      </div>
    </div>
  );
}
