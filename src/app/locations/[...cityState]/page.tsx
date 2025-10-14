import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocationData, parseLocationSlug } from "@/lib/locations/queries";
import { getMetroSlugForCity } from "@/lib/metro-slug-map";
import { ensureAbsoluteUrl, formatPhoneNumber } from "@/lib/utils/url";
import type { Metadata } from "next";

interface LocationPageProps {
  params: Promise<{ cityState: string[] }>;
}

export const runtime = 'nodejs';
export const dynamic = 'force-static';
// Cache page output per path; refresh weekly (on-demand revalidation will keep fresh)
export const revalidate = 604800; // 7 days

function toSlug(cityState: string[]): string {
  return (cityState || []).join("/") || "";
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { cityState } = await params;
  const slug = toSlug(cityState);
  const parsed = parseLocationSlug(slug);
  if (!parsed) {
    return { title: "Location Not Found" };
  }
  const { city, state } = parsed;
  return {
    title: `Top Senior Care Facilities in ${city}, ${state} | SunsetWell`,
    description: `Discover the highest-rated senior care facilities in ${city}, ${state} based on SunsetWell quality scores. Compare nursing homes, assisted living facilities, and memory care options.`,
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { cityState } = await params;
  const slug = toSlug(cityState);
  const parsed = parseLocationSlug(slug);
  if (!parsed) {
    // Redirect to locations index if invalid
    redirect('/locations');
  }
  const { city, state } = parsed;

  // Try to redirect to metro page if mapping exists
  const metroSlug = getMetroSlugForCity(city, state);
  if (metroSlug) {
    redirect(`/metros/${metroSlug}`);
  }

  // If no metro mapping, show the database-driven location page
  const locationData = await getLocationData(city, state);

  const hasData = Boolean(locationData);
  const totalFacilitiesDisplay = hasData ? locationData!.totalFacilities : 0;
  const avgScoreDisplay = hasData ? locationData!.avgScore : 0;
  const topFacilitiesDisplay = hasData ? locationData!.topFacilities : [];
  const providerTypeBreakdownDisplay = hasData ? locationData!.providerTypeBreakdown : ({} as Record<string, number>);

  function getScoreLabel(score: number): string {
    if (score >= 90) return "Exceptional";
    if (score >= 75) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Average";
    return "Below Average";
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-1.jpg"
          alt={`Senior care in ${city}, ${state}`}
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

      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col gap-6 md:gap-8 px-4 md:px-6 py-10 md:py-14 relative z-10">
        <header className="space-y-3 md:space-y-4">
          <nav className="text-xs md:text-sm text-white/90">
            <Link href="/" className="hover:text-sunset-orange">Home</Link>{" / "}
            <Link href="/locations" className="hover:text-sunset-orange">Locations</Link>{" / "}
            <span className="text-white font-medium">{city}, {state}</span>
          </nav>

          <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
            Senior Care in {city}, {state}
          </h1>

          {hasData ? (
            <p className="text-base md:text-lg text-white/90 max-w-3xl drop-shadow">
              Explore {totalFacilitiesDisplay} quality-rated senior living facilities in {city}. All
              facilities are ranked by SunsetWell scores—an objective quality metric combining
              health inspections, staffing levels, and resident outcomes.
            </p>
          ) : (
            <p className="text-base md:text-lg text-white/90 max-w-3xl drop-shadow">
              We&apos;re preparing detailed rankings for {city}. Check back soon, or
              <span> </span>
              <a href="/navigator" className="text-sunset-orange hover:underline font-medium">use the facility search</a>
              <span> </span>
              to find options anywhere in the US.
            </p>
          )}
        </header>

        {hasData && (
          <section className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
            <div className="rounded-xl border border-white/20 bg-white/95 backdrop-blur-md p-4 md:p-5 shadow-md">
              <p className="text-xs md:text-sm text-slate-500">Facilities</p>
              <p className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900">{totalFacilitiesDisplay}</p>
            </div>

            <div className="rounded-xl border border-white/20 bg-white/95 backdrop-blur-md p-4 md:p-5 shadow-md">
              <p className="text-xs md:text-sm text-slate-500">Avg. Score</p>
              <p className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900">{avgScoreDisplay.toFixed(0)}</p>
            </div>

            {Object.entries(providerTypeBreakdownDisplay).slice(0, 2).map(([type, count]) => (
              <div key={type} className="rounded-xl border border-white/20 bg-white/95 backdrop-blur-md p-4 md:p-5 shadow-md">
                <p className="text-xs md:text-sm text-slate-500 capitalize">{type.replace("_", " ")}</p>
                <p className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900">{count}</p>
              </div>
            ))}
          </section>
        )}

        {hasData && (
          <section className="rounded-2xl border border-white/20 bg-white/95 backdrop-blur-md p-4 md:p-6 shadow-md">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900">Highest-Rated Facilities</h2>
              <p className="mt-1 text-sm text-slate-600">Facilities ranked by SunsetWell quality score (0-100 scale)</p>
            </div>
            <div className="space-y-3 md:space-y-4">
              {topFacilitiesDisplay.map((facility, index) => {
                const websiteUrl = facility.website ? ensureAbsoluteUrl(facility.website) : null;
                const phoneDisplay = facility.phone ? formatPhoneNumber(facility.phone) ?? facility.phone : null;

                return (
                  <div key={facility.id} className="rounded-lg border border-slate-200 bg-white/98 p-4 md:p-5 hover:border-sunset-orange/40 hover:shadow-lg transition-all">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                      <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-sunset-orange/10 text-sunset-orange font-semibold text-sm">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-semibold text-slate-900 truncate">{facility.title}</h3>
                          <p className="text-xs md:text-sm text-slate-500 capitalize">{facility.provider_type.replace("_", " ")}</p>
                          {facility.address && (<p className="text-xs md:text-sm text-slate-600 mt-1">{facility.address}</p>)}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 md:gap-3 text-xs">
                        {facility.health_inspection_rating != null && (
                          <div className="flex items-center gap-1 text-slate-600"><span className="font-medium">Health:</span><span>{facility.health_inspection_rating.toFixed(0)} stars</span></div>
                        )}
                        {facility.staffing_rating != null && (
                          <div className="flex items-center gap-1 text-slate-600"><span className="font-medium">Staffing:</span><span>{facility.staffing_rating.toFixed(0)} stars</span></div>
                        )}
                        {facility.total_nurse_hours_per_resident_per_day != null && (
                          <div className="flex items-center gap-1 text-slate-600"><span className="font-medium">Care hours:</span><span>{facility.total_nurse_hours_per_resident_per_day.toFixed(1)}/day</span></div>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
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
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className={`inline-flex items-baseline gap-2 px-4 py-2 rounded-lg font-bold text-xl md:text-2xl ${
                        facility.sunsetwell_score >= 90
                          ? "bg-green-700 text-white"
                          : facility.sunsetwell_score >= 75
                          ? "bg-green-500 text-white"
                          : facility.sunsetwell_score >= 60
                          ? "bg-yellow-400 text-gray-900"
                          : facility.sunsetwell_score >= 40
                          ? "bg-orange-500 text-white"
                          : "bg-red-500 text-white"
                      }`}>
                        <span>{facility.sunsetwell_score.toFixed(0)}</span>
                        {facility.sunsetwell_percentile !== null && (
                          <span className="text-sm opacity-90">({facility.sunsetwell_percentile}%)</span>
                        )}
                      </div>
                      <div className="mt-2 text-xs md:text-sm text-slate-500">{getScoreLabel(facility.sunsetwell_score)}</div>
                      <Link href={`/facility/${facility.id}`} className="mt-2 inline-block text-xs md:text-sm text-sunset-orange hover:underline">
                        View SunsetWell profile →
                      </Link>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-lavender/40 bg-white/90 backdrop-blur-md p-4 md:p-6 shadow-md">
          <h3 className="text-base md:text-lg font-semibold text-slate-900">About SunsetWell Scores</h3>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            SunsetWell scores aggregate objective quality metrics from CMS data, including health
            inspection ratings, staffing levels, nurse hours per resident, staff turnover, and
            quality measures. Scores are normalized within peer groups and presented on a 0-100
            scale, with higher scores indicating superior quality. This data-driven approach helps
            families make informed decisions based on measurable outcomes rather than marketing
            claims.
          </p>
        </section>
      </div>
    </main>
  );
}
