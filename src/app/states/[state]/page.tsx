import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getStateStatistics, getTopStateFacilities, getStateCities } from "@/lib/states/queries";
import { getStateInfo, ALL_US_STATE_CODES } from "@/data/state-info";
import { ensureAbsoluteUrl, formatPhoneNumber } from "@/lib/utils/url";
import { getMetroSlugForCity } from "@/lib/metro-slug-map";
import { AdSenseUnit } from "@/components/ads/adsense-script";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const dynamicParams = false;

// Generate pages for all 50 states + DC
export async function generateStaticParams() {
  return ALL_US_STATE_CODES.map((stateCode) => ({
    state: stateCode.toLowerCase(),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const stateCode = state.toUpperCase();
  const stateInfo = getStateInfo(stateCode);

  if (!stateInfo) {
    return { title: "State Not Found" };
  }

  const stats = await getStateStatistics(stateCode);
  const facilityCount = stats?.totalFacilities || 0;
  const avgScore = stats?.averageScore || 0;
  const highPerformingPct = stats?.highPerformingPercentage || 0;

  return {
    title: `Best Nursing Homes in ${stateInfo.name} (2025) - Rankings & Costs | SunsetWell`,
    description: `Find quality nursing homes in ${stateInfo.name}. Compare ${facilityCount} facilities with SunsetWell scores, CMS ratings, and costs. ${highPerformingPct}% high-performing facilities. Average score: ${avgScore.toFixed(1)}. Expert rankings based on CMS data.`,
    keywords: [
      `nursing homes ${stateInfo.name}`,
      `best nursing homes ${stateInfo.name}`,
      `${stateInfo.name} nursing home costs`,
      `Medicaid nursing homes ${stateInfo.name}`,
      `skilled nursing facilities ${stateInfo.name}`,
    ],
    openGraph: {
      title: `Best Nursing Homes in ${stateInfo.name} (2025)`,
      description: `Expert rankings of ${facilityCount} nursing homes with quality scores, costs, and Medicaid information.`,
      type: "website",
    },
  };
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Average";
  return "Below Average";
}

function getScoreColorClasses(score: number) {
  if (score >= 90)
    return "bg-green-700 text-white";
  if (score >= 75)
    return "bg-green-500 text-white";
  if (score >= 60)
    return "bg-yellow-400 text-gray-900";
  if (score >= 40)
    return "bg-orange-500 text-white";
  return "bg-red-500 text-white";
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const stateCode = state.toUpperCase();
  const stateInfo = getStateInfo(stateCode);

  if (!stateInfo) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="font-serif text-2xl font-bold">State Not Found</h1>
        <p className="mt-2 text-slate-600">
          We don&apos;t have information for this state yet. Please check back soon.
        </p>
      </main>
    );
  }

  // Fetch data in parallel for optimal performance
  const [stats, topFacilities, cities] = await Promise.all([
    getStateStatistics(stateCode),
    getTopStateFacilities(stateCode, 20),
    getStateCities(stateCode, 15),
  ]);

  // Cities will link to metros when available via getMetroSlugForCity

  // Structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://sunsetwell.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "States",
        item: "https://sunsetwell.com/locations",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: stateInfo.name,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How much does a nursing home cost in ${stateInfo.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Nursing home costs in ${stateInfo.name} typically range from ${stateInfo.averageCosts.monthlyRange} per month for private pay. ${stateInfo.averageCosts.context}`,
        },
      },
      {
        "@type": "Question",
        name: `Does Medicaid cover nursing home care in ${stateInfo.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, Medicaid covers nursing home care in ${stateInfo.name} for eligible individuals. The asset limit is ${stateInfo.medicaidInfo.assetLimit} and monthly income limit is ${stateInfo.medicaidInfo.monthlyIncomeLimit}. Processing typically takes ${stateInfo.medicaidInfo.averageProcessingTime}.`,
        },
      },
      {
        "@type": "Question",
        name: `How many nursing homes are in ${stateInfo.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${stateInfo.name} has ${stats?.totalFacilities || "hundreds of"} Medicare-certified facilities including ${stats?.totalSkilledNursing || "many"} skilled nursing homes, ${stats?.totalAssistedLiving || "numerous"} assisted living communities, and ${stats?.totalHomeHealth || "many"} home health agencies.`,
        },
      },
    ],
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-3.jpg"
          alt={`Senior care in ${stateInfo.name}`}
          fill
          className="object-cover"
          quality={90}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-sunset-orange/20 via-sky-blue/30 to-lavender/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
        <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-lavender/40 via-lavender/25 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-sky-blue/40 via-sky-blue/25 to-transparent" />
      </div>

      <div className="mx-auto max-w-5xl p-6 relative z-10">
        {/* Breadcrumbs */}
        <nav className="text-sm text-white/90 mb-6">
          <Link href="/" className="hover:text-sunset-orange">
            Home
          </Link>
          {" / "}
          <Link href="/locations" className="hover:text-sunset-orange">
            Locations
          </Link>
          {" / "}
          <span className="text-white font-semibold">{stateInfo.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-white mb-3 drop-shadow-lg">
            Nursing Homes in {stateInfo.name}
          </h1>
          {stats && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-md border border-white/20">
                <span className="text-gray-600">Total Facilities:</span>
                <span className="ml-2 font-semibold text-gray-900">{stats.totalFacilities}</span>
              </div>
              <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-md border border-white/20">
                <span className="text-gray-600">Avg Score:</span>
                <span className="ml-2 font-semibold text-gray-900">{stats.averageScore.toFixed(1)}</span>
              </div>
              <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-md border border-white/20">
                <span className="text-gray-600">High-Performing:</span>
                <span className="ml-2 font-semibold text-gray-900">{stats.highPerformingPercentage}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Answer Block for AEO */}
        {stats && (
          <div className="mb-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-md">
            <h2 className="text-sm font-semibold text-blue-800 uppercase mb-2">Quick Answer</h2>
            <p className="text-gray-800 text-lg leading-relaxed">
              {stateInfo.name} has <strong>{stats.totalFacilities} Medicare-certified facilities</strong>{" "}
              with an average SunsetWell score of <strong>{stats.averageScore.toFixed(1)}/100</strong>.{" "}
              <strong>{stats.highPerformingPercentage}%</strong> are high-performing (75+ score).{" "}
              Average monthly cost: <strong>{stateInfo.averageCosts.monthlyRange}</strong>.{" "}
              {stats.medicaidAcceptanceRate && (
                <>
                  <strong>{Math.round(stats.medicaidAcceptanceRate)}%</strong> of facilities accept Medicaid.
                </>
              )}
            </p>
          </div>
        )}

        {/* Compassionate Narrative */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Finding Care in {stateInfo.name}</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            {stateInfo.narrative.split("\n\n").map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </section>

        {/* Statistics */}
        {stats && (
          <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{stateInfo.name} at a Glance</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Facility Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Skilled Nursing Facilities:</span>
                    <span className="font-semibold text-gray-900">{stats.totalSkilledNursing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assisted Living Communities:</span>
                    <span className="font-semibold text-gray-900">{stats.totalAssistedLiving}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Home Health Agencies:</span>
                    <span className="font-semibold text-gray-900">{stats.totalHomeHealth}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Quality Metrics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average SunsetWell Score:</span>
                    <span className="font-semibold text-gray-900">{stats.averageScore.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Median Score:</span>
                    <span className="font-semibold text-gray-900">{stats.medianScore.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">High-Performing (75+):</span>
                    <span className="font-semibold text-gray-900">
                      {stats.highPerformingCount} ({stats.highPerformingPercentage}%)
                    </span>
                  </div>
                  {stats.averageCMSRating && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg CMS Star Rating:</span>
                      <span className="font-semibold text-gray-900">{stats.averageCMSRating.toFixed(1)} stars</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Top Facilities */}
        {topFacilities.length > 0 && (
          <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Top Nursing Homes in {stateInfo.name}
            </h2>
            <div className="space-y-4">
              {topFacilities.map((facility, index) => {
                const websiteUrl = (facility.website
                  ? ensureAbsoluteUrl(facility.website)
                  : null) ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${facility.title} ${facility.address || ""} ${facility.city || ""} ${stateInfo.code}`
                    )}`;
                const phoneDisplay = facility.phone ? formatPhoneNumber(facility.phone) ?? facility.phone : null;

                return (
                  <div
                    key={facility.id}
                    className="border-2 border-slate-200 hover:border-sunset-orange/40 rounded-lg p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-sunset-orange/10 text-sunset-orange font-bold">
                            #{index + 1}
                          </span>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              <a
                                href={websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-sunset-orange"
                              >
                                {facility.title}
                              </a>
                            </h3>
                            {facility.city && (
                              <p className="text-sm text-slate-600 mt-1">
                                {facility.city}
                                {facility.address && ` • ${facility.address}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                          {facility.healthInspectionRating && (
                            <div>
                              <span className="font-medium">Health:</span>{" "}
                              {"⭐".repeat(Math.round(facility.healthInspectionRating))}
                            </div>
                          )}
                          {facility.staffingRating && (
                            <div>
                              <span className="font-medium">Staffing:</span>{" "}
                              {"⭐".repeat(Math.round(facility.staffingRating))}
                            </div>
                          )}
                          {facility.qualityMeasureRating && (
                            <div>
                              <span className="font-medium">Quality:</span>{" "}
                              {"⭐".repeat(Math.round(facility.qualityMeasureRating))}
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm">
                          {phoneDisplay && <span className="text-slate-600">📞 {phoneDisplay}</span>}
                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sunset-orange hover:underline"
                          >
                            Visit website →
                          </a>
                          <Link href={`/facility/${facility.id}`} className="text-slate-600 hover:text-sunset-orange">
                            View SunsetWell profile →
                          </Link>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-flex items-baseline gap-2 px-4 py-2 rounded-lg font-bold text-2xl ${getScoreColorClasses(
                            facility.sunsetwellScore
                          )}`}
                        >
                          <span>{facility.sunsetwellScore}</span>
                          {facility.sunsetwellPercentile && (
                            <span className="text-base opacity-90">({facility.sunsetwellPercentile}%)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">{getScoreLabel(facility.sunsetwellScore)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Ad Placement 1: After Top Facilities, Before Cities */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-4 border border-sunset-orange/10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
            Sponsored Resources
          </p>
          <AdSenseUnit
            adSlot="1234567890"
            adFormat="auto"
            fullWidthResponsive={true}
            className="min-h-[250px]"
          />
        </section>

        {/* Cities */}
        {cities.length > 0 && (
          <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse by City</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cities.map((city) => {
                const metroSlug = getMetroSlugForCity(city.city, stateInfo.code);
                const href = metroSlug
                  ? `/metros/${metroSlug}`
                  : `/locations/${city.city.toLowerCase().replace(/\s+/g, "-")}-${stateInfo.code.toLowerCase()}`;

                return (
                  <Link
                    key={city.city}
                    href={href}
                    className="flex flex-col p-3 bg-gray-50 hover:bg-sunset-orange/5 rounded-lg hover:shadow-md transition-all"
                  >
                    <span className="font-semibold text-gray-900">{city.city}</span>
                    <span className="text-sm text-gray-600">{city.count} facilities</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Medicaid Information */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Medicaid Coverage in {stateInfo.name}
          </h2>
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Many families need help paying for nursing home care. Medicaid is a vital resource, but the rules
              vary by state. Here&apos;s what you need to know about Medicaid nursing home coverage in {stateInfo.name}.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Eligibility Requirements</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Monthly Income Limit:</span>
                    <br />
                    <span className="font-semibold text-gray-900">
                      {stateInfo.medicaidInfo.monthlyIncomeLimit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Asset Limit:</span>
                    <br />
                    <span className="font-semibold text-gray-900">{stateInfo.medicaidInfo.assetLimit}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Processing Time:</span>
                    <br />
                    <span className="font-semibold text-gray-900">
                      {stateInfo.medicaidInfo.averageProcessingTime}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How to Apply</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {stateInfo.medicaidInfo.applicationProcess}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-3">Important Tips for {stateInfo.name} Families</h3>
              <ul className="space-y-2 text-sm text-amber-900">
                {stateInfo.medicaidInfo.helpfulTips.map((tip, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-sunset-orange flex-shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Costs */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nursing Home Costs in {stateInfo.name}</h2>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{stateInfo.averageCosts.dailyRate}</span>
              <span className="text-gray-600">/day average</span>
            </div>
            <div>
              <span className="text-gray-600">Monthly Range: </span>
              <span className="font-semibold text-gray-900">{stateInfo.averageCosts.monthlyRange}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{stateInfo.averageCosts.context}</p>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="text-blue-900">
                <strong>Medicare Coverage:</strong> Medicare Part A covers skilled nursing facility care for
                up to 100 days following a qualifying hospital stay (3+ days). Days 1-20 are fully covered;
                days 21-100 require a copay ($204/day in 2025).
              </p>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {stateInfo.name} Resources & Advocacy
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Oversight & Complaints</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-gray-900">{stateInfo.resources.ombudsman.name}</div>
                  <a
                    href={`tel:${stateInfo.resources.ombudsman.phone.replace(/\D/g, "")}`}
                    className="text-gray-600 hover:text-sunset-orange"
                  >
                    {stateInfo.resources.ombudsman.phone}
                  </a>
                  <br />
                  <a
                    href={stateInfo.resources.ombudsman.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sunset-orange hover:underline"
                  >
                    Visit website →
                  </a>
                  <p className="text-gray-600 mt-2 text-xs">
                    The ombudsman helps resolve complaints and advocates for nursing home residents&apos; rights.
                  </p>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{stateInfo.resources.healthDept.name}</div>
                  <a
                    href={stateInfo.resources.healthDept.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sunset-orange hover:underline"
                  >
                    View inspection reports →
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Support & Guidance</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-gray-900">{stateInfo.resources.aging.name}</div>
                  <a
                    href={`tel:${stateInfo.resources.aging.phone.replace(/\D/g, "")}`}
                    className="text-gray-600 hover:text-sunset-orange"
                  >
                    {stateInfo.resources.aging.phone}
                  </a>
                  <br />
                  <a
                    href={stateInfo.resources.aging.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sunset-orange hover:underline"
                  >
                    Visit website →
                  </a>
                  <p className="text-gray-600 mt-2 text-xs">
                    Area agencies on aging provide care planning, caregiver support, and benefit counseling.
                  </p>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Medicare Nursing Home Compare</div>
                  <a
                    href="https://www.medicare.gov/care-compare"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sunset-orange hover:underline"
                  >
                    medicare.gov/care-compare →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ad Placement 2: Before CTA */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-4 border border-lavender/20">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
            Planning Your Next Steps
          </p>
          <AdSenseUnit
            adSlot="0987654321"
            adFormat="auto"
            fullWidthResponsive={true}
            className="min-h-[250px]"
          />
        </section>

        {/* CTA */}
        <section className="mb-8 bg-gradient-to-r from-sunset-orange to-sunset-orange/80 rounded-xl shadow-md p-6 text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to Find the Right Facility?</h2>
          <p className="mb-4 text-white/90">
            Use our personalized navigator to find facilities that match your loved one&apos;s needs, insurance, and
            location in {stateInfo.name}.
          </p>
          <Link
            href="/navigator"
            className="inline-block bg-white text-sunset-orange px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Navigator Tool →
          </Link>
        </section>

        {/* Disclaimer */}
        <div className="p-4 bg-white/95 backdrop-blur-md rounded-lg text-xs text-gray-700 shadow-md border border-white/20">
          <p className="mb-2">
            <strong>Disclaimer:</strong> This guide is educational only. SunsetWell scores are based on CMS
            data and peer-group analysis. Medicaid eligibility rules change frequently—always verify current
            requirements with your state Medicaid office. Always tour facilities personally, speak with staff,
            review current state inspection reports, and consult healthcare professionals before making
            placement decisions.
          </p>
          <p>
            Last updated: January 2025 | Data source: CMS Nursing Home Compare, {stateInfo.resources.healthDept.name}, SunsetWell Analysis
          </p>
        </div>
      </div>
    </main>
  );
}
