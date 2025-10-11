import { AdContainer } from "./ad-container";
import { AdSenseUnit } from "./adsense-script";

/**
 * Results page inline ad: After 3rd facility card (desktop) or 5th card (mobile)
 * Responsive rectangle format
 */
export function ResultsInlineAd() {
  return (
    <div className="my-6">
      <AdContainer variant="results">
        <div className="mb-2">
          <p className="text-sm text-gray-600">
            Related services for your senior care search
          </p>
        </div>
        <AdSenseUnit
          adSlot="2345678901" // Replace with actual slot ID from AdSense
          adFormat="auto"
          style={{ minHeight: "250px" }}
        />
      </AdContainer>
    </div>
  );
}
