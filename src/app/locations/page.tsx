import Image from "next/image";
import Link from "next/link";
import type { Metadata} from "next";
import { getAvailableLocations, generateLocationSlug } from "@/lib/locations/queries";

export const metadata: Metadata = {
  title: "Senior Care by Location | SunsetWell",
  description:
    "Find top-rated senior care facilities by city and state. Browse quality-ranked nursing homes, assisted living, and memory care options in your area.",
};

// Hardcoded list of available cities with SunsetWell scores
// These cities have verified v2 SunsetWell scores in the database
const AVAILABLE_CITIES = [
  { city: "Austin", state: "TX", slug: "austin-tx" },
  { city: "Fort Worth", state: "TX", slug: "fort-worth-tx" },
  { city: "Arlington", state: "TX", slug: "arlington-tx" },
  { city: "Miami", state: "FL", slug: "miami-fl" },
  { city: "Knoxville", state: "TN", slug: "knoxville-tn" },
  { city: "Memphis", state: "TN", slug: "memphis-tn" },
  { city: "Nashville", state: "TN", slug: "nashville-tn" },
  { city: "Chattanooga", state: "TN", slug: "chattanooga-tn" },
  { city: "Round Rock", state: "TX", slug: "round-rock-tx" },
  { city: "Georgetown", state: "TX", slug: "georgetown-tx" },
];

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function LocationsIndexPage() {
  // Load available locations from DB (only cities with v2 scores)
  const locations = await getAvailableLocations();

  // Group locations by state
  const locationsByState: Record<string, Array<{ city: string; state: string; slug: string }>> = {};

  locations.forEach((loc) => {
    const slug = generateLocationSlug(loc.city, loc.state);
    if (!locationsByState[loc.state]) {
      locationsByState[loc.state] = [];
    }
    locationsByState[loc.state].push({ ...loc, slug });
  });

  // Sort states alphabetically
  const sortedStates = Object.keys(locationsByState).sort();

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-4.jpg"
          alt="Senior care locations"
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
        <header className="space-y-3 md:space-y-4">
          <nav className="text-xs md:text-sm text-gray-600">
            <Link href="/" className="hover:text-sunset-orange">
              Home
            </Link>
            {" / "}
            <span className="text-gray-900 font-medium">Locations</span>
          </nav>

          <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-gray-900">
            Senior Care by Location
          </h1>

          <p className="text-base md:text-lg text-gray-600 max-w-3xl">
            Discover top-rated senior living facilities in cities across the United States. All
            facilities are ranked by SunsetWell quality scores based on objective CMS data.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white/85 p-4 md:p-6 shadow-sm">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-4 md:mb-6">
            Featured Cities
          </h2>

          <div className="grid gap-6 md:gap-8">
            {sortedStates.map((state) => {
              const cities = locationsByState[state] || [];
              // Sort cities alphabetically
              const sortedCities = [...cities].sort((a, b) => a.city.localeCompare(b.city));

              return (
                <div key={state} className="space-y-3">
                  <h3 className="text-lg md:text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2">
                    {state}
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                    {sortedCities.map((loc) => (
                      <Link
                        key={loc.slug}
                        href={`/locations/${loc.slug}`}
                        className="text-sm md:text-base text-slate-700 hover:text-sunset-orange hover:underline py-1"
                      >
                        {loc.city}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-slate-700">
              <strong>More cities coming soon!</strong> We&apos;re continuously expanding our
              location-specific pages. Can&apos;t find your city?{" "}
              <Link href="/navigator" className="text-sunset-orange hover:underline font-medium">
                Use our facility search tool
              </Link>{" "}
              to find facilities anywhere in the US.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-lavender/60 bg-lavender/10 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-slate-900">
            Why Location Matters
          </h3>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            Choosing a senior care facility close to family and familiar surroundings can
            significantly impact a resident&apos;s well-being. Our location-specific pages help you
            discover the highest-quality facilities in your area, ranked by objective quality
            metrics including health inspections, staffing ratios, and resident outcomes. Each
            location page shows data-driven insights to help you make informed decisions.
          </p>
        </section>
      </div>
    </main>
  );
}
