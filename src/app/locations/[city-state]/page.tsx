import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLocationData,
  parseLocationSlug,
} from "@/lib/locations/queries";
import type { Metadata } from "next";

interface LocationPageProps {
  params: Promise<{ "city-state": string }>;
}

// Force dynamic rendering - do not cache
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for full env var access
export const revalidate = 0;

// Removed generateStaticParams() entirely - we want true SSR with database queries

export async function generateMetadata({
  params,
}: LocationPageProps): Promise<Metadata> {
  const { "city-state": slug } = await params;
  const parsed = parseLocationSlug(slug);

  if (!parsed) {
    return {
      title: "Location Not Found",
    };
  }

  const { city, state } = parsed;

  return {
    title: `Top Senior Care Facilities in ${city}, ${state} | SunsetWell`,
    description: `Discover the highest-rated senior care facilities in ${city}, ${state} based on SunsetWell quality scores. Compare nursing homes, assisted living facilities, and memory care options.`,
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { "city-state": slug } = await params;
  const parsed = parseLocationSlug(slug);

  if (!parsed) {
    notFound();
  }

  const { city, state } = parsed;
  const locationData = await getLocationData(city, state);

  if (!locationData) {
    notFound();
  }

  const { totalFacilities, avgScore, topFacilities, providerTypeBreakdown } = locationData;

  function getScoreLabel(score: number): string {
    if (score >= 90) return "Exceptional";
    if (score >= 75) return "Excellent";
    if (score >= 60) return "Very Good";
    if (score >= 40) return "Good";
    return "Fair";
  }

  function getScoreColor(score: number): string {
    if (score >= 90) return "text-emerald-700";
    if (score >= 75) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-slate-600";
    return "text-slate-500";
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50" />

        {/* Decorative transparent columns on left and right */}
        <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-lavender/40 via-lavender/25 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-sky-blue/40 via-sky-blue/25 to-transparent" />
      </div>

      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col gap-6 md:gap-8 px-4 md:px-6 py-10 md:py-14 relative z-10">
        {/* Header */}
        <header className="space-y-3 md:space-y-4">
          <nav className="text-xs md:text-sm text-gray-600">
            <Link href="/" className="hover:text-sunset-orange">
              Home
            </Link>
            {" / "}
            <Link href="/locations" className="hover:text-sunset-orange">
              Locations
            </Link>
            {" / "}
            <span className="text-gray-900 font-medium">
              {city}, {state}
            </span>
          </nav>

          <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-gray-900">
            Top Senior Care in {city}, {state}
          </h1>

          <p className="text-base md:text-lg text-gray-600 max-w-3xl">
            Explore {totalFacilities} quality-rated senior living facilities in {city}. All
            facilities are ranked by SunsetWell scores—an objective quality metric combining
            health inspections, staffing levels, and resident outcomes.
          </p>
        </header>

        {/* Statistics Cards */}
        <section className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 md:p-5 shadow-sm">
            <p className="text-xs md:text-sm text-slate-500">Facilities</p>
            <p className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900">
              {totalFacilities}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 md:p-5 shadow-sm">
            <p className="text-xs md:text-sm text-slate-500">Avg. Score</p>
            <p className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900">
              {avgScore.toFixed(0)}
            </p>
          </div>

          {Object.entries(providerTypeBreakdown)
            .slice(0, 2)
            .map(([type, count]) => (
              <div
                key={type}
                className="rounded-xl border border-slate-200 bg-white/80 p-4 md:p-5 shadow-sm"
              >
                <p className="text-xs md:text-sm text-slate-500 capitalize">
                  {type.replace("_", " ")}
                </p>
                <p className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900">
                  {count}
                </p>
              </div>
            ))}
        </section>

        {/* Top Facilities Table */}
        <section className="rounded-2xl border border-slate-200 bg-white/85 p-4 md:p-6 shadow-sm">
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
              Highest-Rated Facilities
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Facilities ranked by SunsetWell quality score (0-100 scale)
            </p>
          </div>

          <div className="space-y-3 md:space-y-4">
            {topFacilities.map((facility, index) => (
              <div
                key={facility.id}
                className="rounded-lg border border-slate-200 bg-white/90 p-4 md:p-5 hover:border-sunset-orange/40 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-sunset-orange/10 text-sunset-orange font-semibold text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-semibold text-slate-900 truncate">
                          {facility.title}
                        </h3>
                        <p className="text-xs md:text-sm text-slate-500 capitalize">
                          {facility.provider_type.replace("_", " ")}
                        </p>
                        {facility.address && (
                          <p className="text-xs md:text-sm text-slate-600 mt-1">
                            {facility.address}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quality metrics */}
                    <div className="mt-3 flex flex-wrap gap-2 md:gap-3 text-xs">
                      {facility.health_inspection_rating !== null &&
                        facility.health_inspection_rating !== undefined && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="font-medium">Health:</span>
                            <span>
                              {facility.health_inspection_rating.toFixed(0)} stars
                            </span>
                          </div>
                        )}
                      {facility.staffing_rating !== null &&
                        facility.staffing_rating !== undefined && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="font-medium">Staffing:</span>
                            <span>{facility.staffing_rating.toFixed(0)} stars</span>
                          </div>
                        )}
                      {facility.total_nurse_hours_per_resident_per_day !== null &&
                        facility.total_nurse_hours_per_resident_per_day !== undefined && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="font-medium">Care hours:</span>
                            <span>
                              {facility.total_nurse_hours_per_resident_per_day.toFixed(1)}/day
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div
                      className={`text-2xl md:text-3xl font-bold ${getScoreColor(facility.sunsetwell_score)}`}
                    >
                      {facility.sunsetwell_score.toFixed(0)}
                    </div>
                    <div className="text-xs md:text-sm text-slate-500">
                      {getScoreLabel(facility.sunsetwell_score)}
                    </div>
                    <Link
                      href={`/results/compare?facilities=${facility.id}`}
                      className="mt-2 inline-block text-xs md:text-sm text-sunset-orange hover:underline"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* About SunsetWell Scores */}
        <section className="rounded-2xl border border-dashed border-lavender/60 bg-lavender/10 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-slate-900">
            About SunsetWell Scores
          </h3>
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
