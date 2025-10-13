import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import Link from "next/link";

import { getFacilitiesByFacilityIds } from "@/lib/facilities/queries";
import { ensureAbsoluteUrl, formatPhoneNumber } from "@/lib/utils/url";
import Image from "next/image";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Facility {
  rank: number;
  facilityId: string;
  title: string;
  score: number;
  percentile: number;
  health: number | null;
  staffing: number | null;
  quality: number | null;
  rnHours: number | null;
  totalNurseHours: number | null;
}

interface MetroData {
  metro: string;
  city: string;
  state: string;
  count: number;
  averageScore: string;
  highPerformerShare: number;
  narrative: string;
  table: Facility[];
}

function getTierLabel(score: number): string {
  if (score >= 90) return "Exceptional Care";
  if (score >= 75) return "Excellent Options";
  if (score >= 60) return "Above Average";
  if (score >= 40) return "Mixed Quality";
  return "Lower-Performing";
}

function getTierColorClasses(score: number) {
  if (score >= 90) return {
    border: "border-emerald-200 hover:border-emerald-400",
    badge: "bg-emerald-100 text-emerald-700",
    score: "text-emerald-700"
  };
  if (score >= 75) return {
    border: "border-blue-200 hover:border-blue-400",
    badge: "bg-blue-100 text-blue-700",
    score: "text-blue-700"
  };
  if (score >= 60) return {
    border: "border-sky-200 hover:border-sky-400",
    badge: "bg-sky-100 text-sky-700",
    score: "text-sky-700"
  };
  if (score >= 40) return {
    border: "border-slate-200 hover:border-slate-400",
    badge: "bg-slate-100 text-slate-700",
    score: "text-slate-700"
  };
  return {
    border: "border-gray-200 hover:border-gray-400",
    badge: "bg-gray-100 text-gray-700",
    score: "text-gray-700"
  };
}

function getQualityAssessment(avgScore: number): string {
  if (avgScore >= 80) return "excellent";
  if (avgScore >= 65) return "good to excellent";
  if (avgScore >= 50) return "mixed";
  if (avgScore >= 35) return "below average";
  return "concerning";
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const file = path.join(process.cwd(), "data", "metros", `${slug}.json`);
  if (fs.existsSync(file)) {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as MetroData;
    return {
      title: `${raw.metro} SNF Rankings | SunsetWell`,
      description: `Skilled nursing facility rankings for ${raw.metro} with SunsetWell scores, peer-group percentiles, and key CMS quality metrics.`,
    };
  }
  return { title: "Metro Rankings" };
}

export default async function MetroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const file = path.join(process.cwd(), "data", "metros", `${slug}.json`);
  if (!fs.existsSync(file)) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="font-serif text-2xl font-bold">Rankings not found</h1>
        <p className="mt-2 text-slate-600">We have not generated rankings for this metro yet.</p>
      </main>
    );
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as MetroData;

  const facilityIds = Array.from(
    new Set(
      data.table
        .map((facility) => (facility.facilityId ? String(facility.facilityId) : null))
        .filter((value): value is string => Boolean(value))
    )
  );

  const facilitySummaries = await getFacilitiesByFacilityIds(facilityIds);
  const facilitiesByFacilityId = new Map<string, typeof facilitySummaries[number]>();
  facilitySummaries.forEach((facility) => {
    if (facility.facilityId) {
      facilitiesByFacilityId.set(facility.facilityId, facility);
    }
  });

  // Group facilities by tier
  const tierGroups = {
    exceptional: data.table.filter(f => f.score >= 90),
    excellent: data.table.filter(f => f.score >= 75 && f.score < 90),
    aboveAvg: data.table.filter(f => f.score >= 60 && f.score < 75),
    mixed: data.table.filter(f => f.score >= 40 && f.score < 60),
    lower: data.table.filter(f => f.score < 40),
  };

  const avgScore = parseFloat(data.averageScore);
  const qualityLevel = getQualityAssessment(avgScore);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-2.jpg"
          alt={`Senior care in ${data.metro}`}
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
          <Link href="/" className="hover:text-sunset-orange">Home</Link>
          {' / '}
          <Link href="/metros" className="hover:text-sunset-orange">Metro Rankings</Link>
          {' / '}
          <span className="text-white font-semibold">{data.metro}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-white mb-3 drop-shadow-lg">
            Best Nursing Homes in {data.metro}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-md border border-white/20">
              <span className="text-gray-600">Facilities:</span>
              <span className="ml-2 font-semibold text-gray-900">{data.count}</span>
            </div>
            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-md border border-white/20">
              <span className="text-gray-600">Avg Score:</span>
              <span className="ml-2 font-semibold text-gray-900">{avgScore.toFixed(1)}</span>
            </div>
            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-md border border-white/20">
              <span className="text-gray-600">High-Performing:</span>
              <span className="ml-2 font-semibold text-gray-900">{data.highPerformerShare}%</span>
            </div>
          </div>
        </div>

      {data.table.length === 0 ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-900">
            <strong>No facility data available for this metro yet.</strong> We are working to add more facilities.
            Please check back soon or explore other metros.
          </p>
        </div>
      ) : (
        <>
        {/* Market Overview */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Market Overview</h2>
            <p className="text-gray-700 leading-relaxed">
              {data.city}&apos;s skilled nursing landscape shows <strong>{qualityLevel} quality</strong> with {data.count} facilities
              averaging a SunsetWell score of {avgScore.toFixed(1)}. {data.highPerformerShare}% of facilities score 75 or higher,
              indicating {data.highPerformerShare >= 40 ? 'strong' : data.highPerformerShare >= 20 ? 'moderate' : 'limited'} availability of high-performing options.
            </p>
            {data.table.length > 1 && (
              <p className="mt-3 text-gray-700 leading-relaxed">
                The {Math.abs(data.table[0].score - data.table[data.table.length - 1].score)}-point gap between highest and lowest-rated facilities
                highlights quality variation in this market. Families should review current state inspection reports, tour multiple facilities,
                and verify Medicaid/Medicare acceptance before making decisions.
              </p>
            )}
          </section>

        {/* Score Distribution */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Score Distribution</h2>
            <div className="space-y-3">
              {[
                { label: '90-100 (Exceptional)', count: tierGroups.exceptional.length, color: 'bg-emerald-500' },
                { label: '75-89 (Excellent)', count: tierGroups.excellent.length, color: 'bg-blue-500' },
                { label: '60-74 (Above Average)', count: tierGroups.aboveAvg.length, color: 'bg-sky-500' },
                { label: '40-59 (Mixed)', count: tierGroups.mixed.length, color: 'bg-slate-500' },
                { label: '0-39 (Lower)', count: tierGroups.lower.length, color: 'bg-gray-400' },
              ].map((tier) => {
                const width = data.count > 0 ? (tier.count / data.count) * 100 : 0;
                return (
                  <div key={tier.label} className="flex items-center gap-3">
                    <div className="w-40 text-sm text-gray-700">{tier.label}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className={`${tier.color} h-full rounded-full flex items-center justify-end pr-2 text-white text-xs font-semibold`}
                        style={{ width: `${Math.max(width, tier.count > 0 ? 8 : 0)}%` }}
                      >
                        {tier.count > 0 && tier.count}
                      </div>
                    </div>
                    <div className="w-24 text-sm text-gray-600">{tier.count} {tier.count === 1 ? 'facility' : 'facilities'}</div>
                  </div>
                );
              })}
            </div>
          </section>

        {/* Tiered Facility Listings */}
        {Object.entries(tierGroups).map(([key, facilities]) => {
          if (facilities.length === 0) return null;
          const score = facilities[0].score;
          const tierLabel = getTierLabel(score);

          return (
            <section key={key} className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {score >= 90 && '🏆 '}
                  {score >= 75 && score < 90 && '⭐ '}
                  {score >= 40 && score < 60 && '✓ '}
                  {score < 40 && '⚠️ '}
                  {tierLabel} ({score >= 90 ? '90-100' : score >= 75 ? '75-89' : score >= 60 ? '60-74' : score >= 40 ? '40-59' : '0-39'})
                </h2>
                <div className="space-y-6">
                  {facilities.map((facility) => {
                    const facilityColors = getTierColorClasses(facility.score);
                    const summary = facilitiesByFacilityId.get(String(facility.facilityId));
                    const websiteUrl = summary?.website ? ensureAbsoluteUrl(summary.website) : null;
                    const phoneDisplay = summary?.phone ? formatPhoneNumber(summary.phone) ?? summary.phone : null;
                    const addressLine = summary
                      ? [summary.address, summary.city, summary.state, summary.zipCode]
                          .filter(Boolean)
                          .join(", ")
                      : null;
                    const profileHref = summary ? `/facility/${summary.id}` : null;

                    return (
                      <div key={facility.facilityId} className={`border-2 ${facilityColors.border} rounded-lg p-5 hover:shadow-md transition-all`}>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`flex items-center justify-center w-10 h-10 rounded-full ${facilityColors.badge} font-bold`}>
                                #{facility.rank}
                              </span>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {profileHref ? (
                                    <Link href={profileHref} className="hover:text-sunset-orange">
                                      {facility.title}
                                    </Link>
                                  ) : (
                                    facility.title
                                  )}
                                </h3>
                                {addressLine && (
                                  <p className="text-sm text-slate-600 mt-1">{addressLine}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Health:</span> {facility.health ? '⭐'.repeat(facility.health) : '—'}
                              </div>
                              <div>
                                <span className="font-medium">Staffing:</span> {facility.staffing ? '⭐'.repeat(facility.staffing) : '—'}
                              </div>
                              <div>
                                <span className="font-medium">Quality:</span> {facility.quality ? '⭐'.repeat(facility.quality) : '—'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-baseline gap-2 px-4 py-2 rounded-lg font-bold text-2xl ${
                              facility.score >= 90
                                ? "bg-green-700 text-white"
                                : facility.score >= 75
                                ? "bg-green-500 text-white"
                                : facility.score >= 60
                                ? "bg-yellow-400 text-gray-900"
                                : facility.score >= 40
                                ? "bg-orange-500 text-white"
                                : "bg-red-500 text-white"
                            }`}>
                              <span>{facility.score}</span>
                              <span className="text-base opacity-90">({facility.percentile}%)</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              {facility.score >= 90 ? "Exceptional" : facility.score >= 75 ? "Excellent" : facility.score >= 60 ? "Good" : facility.score >= 40 ? "Average" : "Below Average"}
                            </div>
                          </div>
                        </div>
                        {facility.score < 40 && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                            <strong>⚠️ Note:</strong> Lower scores indicate quality concerns. Families should carefully review current state inspection reports,
                            conduct thorough personal tours, and verify current staffing levels before making decisions.
                          </div>
                        )}
                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                          {phoneDisplay && (
                            <span className="flex items-center gap-1">
                              📞 {phoneDisplay}
                            </span>
                          )}
                          {websiteUrl && (
                            <a
                              href={websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sunset-orange hover:underline"
                            >
                              Visit website →
                            </a>
                          )}
                          {profileHref && (
                            <Link href={profileHref} className="text-slate-600 hover:text-sunset-orange">
                              View SunsetWell profile →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

        {/* Decision Guide */}
        <section className="mb-8 bg-white/90 backdrop-blur-md rounded-xl p-6 border border-lavender/40 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Choose the Right Facility</h2>
            <div className="space-y-4 text-gray-700">
              {tierGroups.exceptional.length + tierGroups.excellent.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">If quality is your top priority:</h3>
                  <p>
                    → Consider: {[...tierGroups.exceptional, ...tierGroups.excellent].slice(0, 3).map(f => f.title).join(', ')}
                    <br/>
                    These facilities score 75+ and demonstrate consistent excellence in health inspections, staffing, and quality measures.
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">For urgent placement:</h3>
                <p>
                  Contact top-rated facilities first to check availability. Consider expanding search to nearby metros if needed.
                  Avoid rushing into lower-scoring facilities—invest time in thorough evaluation even in emergencies.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                <p>
                  <strong>Important:</strong> Always tour facilities personally, review current state inspection reports,
                  and verify Medicare/Medicaid acceptance before making final decisions. Scores provide objective comparison
                  but cannot replace in-person evaluation.
                </p>
              </div>
            </div>
          </section>

        {/* Comparison Table */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20 overflow-x-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Detailed Comparison</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Facility</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">
                    <div>SunsetWell Score<sup className="text-[10px]">®</sup></div>
                    <div className="text-xs font-normal text-gray-500 mt-1">
                      (0-100 weighted)
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">
                    <div>Percentile</div>
                    <div className="text-xs font-normal text-gray-500 mt-1">
                      (vs. state peers)
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Health</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Staffing</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.table.map((facility) => {
                  const summary = facilitiesByFacilityId.get(String(facility.facilityId));
                  const websiteUrl = summary?.website ? ensureAbsoluteUrl(summary.website) : null;
                  const profileHref = summary ? `/facility/${summary.id}` : null;

                  return (
                  <tr key={facility.facilityId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center font-semibold">{facility.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {profileHref ? (
                          <Link href={profileHref} className="font-semibold text-slate-900 hover:text-sunset-orange">
                            {facility.title}
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-900">{facility.title}</span>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                          {websiteUrl && (
                            <a
                              href={websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sunset-orange hover:underline"
                            >
                              Visit website
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${
                        facility.score >= 90 ? 'text-emerald-700' :
                        facility.score >= 75 ? 'text-emerald-600' :
                        facility.score >= 60 ? 'text-blue-600' :
                        facility.score >= 40 ? 'text-slate-600' : 'text-slate-500'
                      }`}>
                        {facility.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-medium">{facility.percentile}</td>
                    <td className="px-4 py-3 text-center">{facility.health ? '⭐'.repeat(facility.health) : '—'}</td>
                    <td className="px-4 py-3 text-center">{facility.staffing ? '⭐'.repeat(facility.staffing) : '—'}</td>
                    <td className="px-4 py-3 text-center">{facility.quality ? '⭐'.repeat(facility.quality) : '—'}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

        {/* Resources */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Resources</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">State Oversight</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• State Health Department: Check current inspection reports</li>
                  <li>• Medicare Nursing Home Compare: medicare.gov/care-compare</li>
                  <li>• State Ombudsman: Resident advocacy and complaints</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Financial Planning</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Elder Law Attorney Referral: Plan Medicaid eligibility</li>
                  <li>• Veterans Benefits: VA Aid & Attendance</li>
                  <li>• Long-Term Care Insurance: Review policy coverage</li>
                </ul>
              </div>
            </div>
          </section>

        {/* Disclaimer */}
        <div className="p-4 bg-white/95 backdrop-blur-md rounded-lg text-xs text-gray-700 shadow-md border border-white/20">
            <p className="mb-2">
              <strong>Disclaimer:</strong> This guide is educational only. SunsetWell scores are based on CMS data and peer-group analysis.
              Always tour facilities personally, speak with staff, review current state inspection reports, and consult healthcare
              professionals before making placement decisions.
            </p>
            <p>
              Last updated: January 2025 | Data source: CMS Nursing Home Compare, State Health Departments, SunsetWell Analysis
            </p>
        </div>
      </>
    )}
      </div>
    </main>
  );
}
