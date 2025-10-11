import { AdContainer } from "./ad-container";
import { AdSenseUnit } from "./adsense-script";

/**
 * Compare page ad: Below comparison table
 * Matched content format for native look
 */
export function CompareAd() {
  return (
    <div className="mt-12">
      <AdContainer variant="compare">
        <div className="mb-4 text-center">
          <p className="text-sm font-medium text-gray-700">
            Planning Your Next Steps
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Helpful resources for senior care transitions
          </p>
        </div>
        <AdSenseUnit
          adSlot="4567890123" // Replace with actual slot ID from AdSense
          adFormat="fluid"
          adLayout="-6t+ed+2i-1n-4w" // Matched content layout
          style={{ minHeight: "280px" }}
        />
      </AdContainer>
    </div>
  );
}
