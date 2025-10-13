import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Understanding SunsetWell Scores | SunsetWell",
  description: "Learn how our predictive quality scores help you find the safest nursing homes and assisted living facilities. About twice as accurate as CMS ratings at predicting adverse health events.",
};

export default function ScoringMethodologyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            What Does the SunsetWell Score Mean?
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Understanding our predictive quality ratings
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Overview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            The SunsetWell Score is a 0-100 rating that predicts a nursing home&apos;s likelihood of adverse health events for residents. We provide <strong>two separate metrics</strong>:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                1. SunsetWell Score (0-100)
              </h3>
              <p className="text-gray-600">
                Absolute healthcare quality measure
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                2. Percentile Rank (0-100)
              </h3>
              <p className="text-gray-600">
                How this facility compares to peers in your state
              </p>
            </div>
          </div>
        </section>

        {/* Understanding Your Two Scores */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Understanding Your Two Scores</h2>

          {/* SunsetWell Score */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              1. SunsetWell Score: Absolute Healthcare Quality
            </h3>
            <p className="text-gray-700 mb-4">
              <strong>What it measures:</strong> How good is this facility at preventing adverse health events?
            </p>

            <div className="bg-white p-6 rounded-lg border border-gray-200 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">The score range:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-green-700">90-100:</span>
                  <span className="text-gray-700">Excellent - Top tier quality, minimal risk</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-green-600">75-89:</span>
                  <span className="text-gray-700">Very Good - Strong performance, low risk</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-yellow-600">60-74:</span>
                  <span className="text-gray-700">Good - Adequate quality, moderate risk</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-orange-600">40-59:</span>
                  <span className="text-gray-700">Fair - Mixed performance, elevated risk</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-red-600">0-39:</span>
                  <span className="text-gray-700">Poor - Serious concerns, high risk</span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-2">
              <strong>Example:</strong> A facility with a score of 78 has &quot;Very Good&quot; healthcare quality, meaning it shows strong performance at preventing adverse events.
            </p>
            <p className="text-gray-700">
              <strong>Key point:</strong> This score is NOT peer-normalized. A score of 78 means the same thing whether the facility is in California or Wyoming - it&apos;s an absolute measure of healthcare quality.
            </p>
          </div>

          {/* Percentile Rank */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              2. Percentile Rank: How You Compare to Local Options
            </h3>
            <p className="text-gray-700 mb-4">
              <strong>What it measures:</strong> How does this facility compare to other nursing homes you might be considering in the same state?
            </p>

            <div className="bg-white p-6 rounded-lg border border-gray-200 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">The percentile range:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium">90-100:</span>
                  <span className="text-gray-700">Top 10% in your state - Exceptional</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium">75-89:</span>
                  <span className="text-gray-700">Top quartile - Better than most</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium">50-74:</span>
                  <span className="text-gray-700">Above average - Better than half</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium">25-49:</span>
                  <span className="text-gray-700">Below average - Worse than half</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium">0-24:</span>
                  <span className="text-gray-700">Bottom quartile - Needs improvement</span>
                </div>
              </div>
            </div>

            <p className="text-gray-700">
              <strong>Example:</strong> 85th percentile in California means this facility ranks better than 85% of California nursing homes (top 15%).
            </p>
          </div>
        </section>

        {/* Why Two Numbers Matter */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Two Numbers Matter</h2>
          <p className="text-gray-700 mb-6">
            The SunsetWell Score and Percentile Rank answer different questions:
          </p>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900">SunsetWell Score answers:</p>
                <p className="text-gray-700">&quot;Is this facility good at preventing adverse health events?&quot;</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Percentile Rank answers:</p>
                <p className="text-gray-700">&quot;How does this facility compare to my other options in this state?&quot;</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Scenario A: Competitive Market</h4>
              <p className="text-gray-700 mb-2">Facility in San Francisco, CA</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-3">
                <li>SunsetWell Score: 78 (Very Good absolute quality)</li>
                <li>Percentile: 60th (Above average in very competitive market)</li>
              </ul>
              <p className="text-gray-600 italic">
                This is a good facility, but CA has many excellent options. You might find better nearby.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Scenario B: Less Competitive Market</h4>
              <p className="text-gray-700 mb-2">Facility in rural Wyoming</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-3">
                <li>SunsetWell Score: 78 (Very Good absolute quality)</li>
                <li>Percentile: 95th (Top 5% in this market)</li>
              </ul>
              <p className="text-gray-600 italic">
                This is a good facility AND it&apos;s one of the best available in your area. Strong choice.
              </p>
            </div>
          </div>
        </section>

        {/* How We Calculate */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Calculate the Score</h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Sources</h3>
            <p className="text-gray-700 mb-3">We analyze quality metrics from:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li><strong>CMS Medicare.gov:</strong> Official federal nursing home data</li>
              <li><strong>Health Inspections:</strong> Survey deficiencies and violations</li>
              <li><strong>Staffing Information:</strong> Nurse hours per resident, turnover rates</li>
              <li><strong>Quality Measures:</strong> Clinical outcomes reported to CMS</li>
              <li><strong>Safety Outcomes:</strong> Substantiated complaints and facility-reported incidents</li>
            </ul>
            <p className="text-gray-600 mt-3 text-sm">
              All data comes from publicly available federal sources.
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Approach</h3>
            <p className="text-gray-700 mb-4">
              We analyze years of data from 14,752 nursing homes to identify which factors ACTUALLY predict adverse health events (substantiated complaints and facility-reported incidents).
            </p>
            <p className="text-gray-700 font-semibold mb-3">
              Our analyses show that about 1/3 of adverse health events in nursing home residents can currently be explained by available quality metrics. Our score captures all of these risks in one number, resulting in a score that is about twice as accurate as the CMS 5-star rating at predicting adverse outcomes.
            </p>
            <p className="text-gray-700">
              We consider multiple factors including health inspection results (strongest predictor of safety issues), staffing adequacy, staff stability, and clinical quality measures.
            </p>
          </div>
        </section>

        {/* Comparison with CMS */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How the SunsetWell Score Compares to CMS Stars</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">CMS 5-Star Rating</h3>
              <p className="text-gray-600 text-sm mb-3">Official Federal Rating</p>
              <p className="text-gray-700 mb-3">
                CMS rates all nursing homes 1-5 stars based on health inspections, staffing levels, and quality measures using a simple formula.
              </p>
              <p className="text-gray-700 font-semibold">When to use it:</p>
              <p className="text-gray-700">Filter out unacceptable facilities (avoid 1-2 star facilities)</p>
            </div>

            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">SunsetWell Score</h3>
              <p className="text-gray-600 text-sm mb-3">Predictive Analytics</p>
              <p className="text-gray-700 mb-3">
                A 0-100 score predicting the likelihood of adverse health events, based on multivariate analysis of which factors actually predict safety problems.
              </p>
              <p className="text-gray-700 font-semibold">When to use it:</p>
              <p className="text-gray-700">Compare facilities that pass your CMS threshold to identify which is truly safer</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Using Both Ratings Together</h3>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li><strong>Filter with CMS Stars:</strong> Eliminate facilities with 1-2 stars (serious compliance issues). Consider only 3-5 star facilities.</li>
              <li><strong>Compare with SunsetWell Score:</strong> Among acceptable facilities, use our score to rank by predicted safety. Use the percentile to understand local market context.</li>
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Is the SunsetWell Score official?</h3>
              <p className="text-gray-700">
                No. CMS 5-star ratings are the only official federal ratings. Our score is analytical research based on publicly available CMS data.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Why is your score different from CMS?</h3>
              <p className="text-gray-700">
                CMS uses a simple formula (add/subtract stars). We use multivariate statistical analysis to identify which factors actually predict adverse events. Our approach is approximately twice as accurate at predicting safety outcomes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Can facilities game your score?</h3>
              <p className="text-gray-700">
                We don&apos;t disclose our exact analytical methods or weightings to mitigate this risk. However, the underlying principle is that facilities that improve actual quality (better inspections, lower turnover, adequate staffing) will score higher.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Which rating should I trust more?</h3>
              <p className="text-gray-700">
                Both are valuable. Use CMS stars to set your minimum threshold, then use SunsetWell Score to compare among acceptable facilities. Think of it like buying a car: CMS is the safety rating (must pass), SunsetWell is the Consumer Reports ranking (which one is best).
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">How often are scores updated?</h3>
              <p className="text-gray-700">
                We recalculate scores quarterly when CMS releases new data.
              </p>
            </div>
          </div>
        </section>

        {/* Coverage & Limitations */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Coverage & Limitations</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Coverage</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>14,380 nursing homes scored (97.5% of US nursing homes)</li>
                <li>39,463 assisted living facilities scored (88.4% of US ALFs)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Updates</h3>
              <p className="text-gray-700">
                Scores are recalculated quarterly when CMS releases new data.
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Current score version: v2 (launched October 2025)
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Important Notes</h3>
            <p className="text-gray-700 mb-3">
              <strong>Not a guarantee:</strong> No score can perfectly predict future outcomes. Healthcare quality depends on many factors, some of which can&apos;t be measured from available data.
            </p>
            <p className="text-gray-700 mb-3">
              <strong>Visit in person:</strong> Use our score as a starting point, but always visit facilities in person, talk to staff, and trust your instincts.
            </p>
            <p className="text-gray-700">
              <strong>Individual needs vary:</strong> A high-scoring facility might not be the right fit for your specific situation. Consider your loved one&apos;s medical needs, location preferences, and family priorities.
            </p>
          </div>
        </section>

        {/* Legal Disclaimer */}
        <section className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Legal Disclaimer</h2>
          <p className="text-gray-600 text-sm mb-3">
            SunsetWell Scores are analytical tools based on publicly available data and should not be considered medical advice. Always consult with healthcare professionals and visit facilities in person before making placement decisions. Past performance does not guarantee future results.
          </p>
          <p className="text-gray-600 text-sm">
            CMS 5-Star Ratings are the official federal quality ratings for nursing homes. For official quality information, visit Medicare.gov.
          </p>
        </section>
      </main>

      {/* Footer CTA */}
      <div className="bg-indigo-600 text-white py-12 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Find Quality Care?</h2>
          <p className="text-indigo-100 mb-6">
            Search our database of 73,000+ facilities with SunsetWell Scores
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
          >
            Start Your Search
          </Link>
        </div>
      </div>
    </div>
  );
}
