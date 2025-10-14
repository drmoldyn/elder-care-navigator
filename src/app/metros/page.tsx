import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import metros from "../../../data/top-50-metros.json" assert { type: "json" };

export const metadata: Metadata = {
  title: "Major Metro Area Nursing Home Rankings (2025) | SunsetWell",
  description: "Compare nursing homes across America's 50 largest metropolitan areas. Find top-rated facilities with quality scores, staffing data, and CMS ratings for major cities nationwide.",
  keywords: ["nursing homes by metro", "senior care rankings", "major cities nursing homes", "metropolitan area facilities"],
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function MetrosIndexPage() {
  const list = (metros as Array<{ name: string; city: string; state: string }>);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-4.jpg"
          alt="Senior care in major metropolitan areas"
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
          <span className="text-white font-semibold">Metro Areas</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-white mb-3 drop-shadow-lg">
            Nursing Homes in Major Metropolitan Areas
          </h1>
          <p className="text-lg text-white/90 max-w-3xl drop-shadow">
            Explore comprehensive nursing home rankings and quality data for America&apos;s 50 largest metropolitan areas. Compare facilities using SunsetWell scores, CMS ratings, and detailed quality metrics.
          </p>
        </header>

        {/* Quick Answer Block */}
        <div className="mb-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-md">
          <h2 className="text-sm font-semibold text-blue-800 uppercase mb-2">What You&apos;ll Find</h2>
          <p className="text-gray-800 leading-relaxed">
            Each metro area page provides rankings of the highest-quality nursing homes based on objective data from Medicare.gov. We analyze <strong>health inspections</strong>, <strong>staffing ratios</strong>, <strong>quality measures</strong>, and <strong>resident outcomes</strong> to help you find the best care in your city. All data is updated regularly from official CMS sources.
          </p>
        </div>

        {/* Educational Content */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Metropolitan Area Matters</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              When searching for nursing home care, location is critical. Urban and suburban areas often have more facility options, specialized services, and easier access for family visits. Metropolitan areas typically offer:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>More Options</strong>: Higher concentration of facilities allows for better comparison and choice</li>
              <li><strong>Specialized Care</strong>: Urban facilities often have specialized units for memory care, ventilator care, or post-stroke rehabilitation</li>
              <li><strong>Family Access</strong>: Easier for loved ones to visit regularly, which significantly impacts resident well-being</li>
              <li><strong>Medical Resources</strong>: Proximity to major hospitals and medical specialists</li>
              <li><strong>Competition Drives Quality</strong>: More facilities in an area typically leads to better overall quality as providers compete</li>
            </ul>
            <p>
              Our metro area rankings help you quickly identify the highest-quality facilities in your region. Each listing includes SunsetWell quality scores, CMS star ratings, staffing data, and recent inspection results—all the information you need to make an informed decision.
            </p>
          </div>
        </section>

        {/* Metro List */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Metropolitan Area</h2>

          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Note:</strong> These pages show facilities within each metro area, including surrounding suburbs and counties. Select your metro to view detailed rankings, quality scores, and facility information.
            </p>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.map((m) => (
              <li key={m.name} className="border border-gray-200 rounded-lg hover:border-sunset-orange/40 hover:shadow-md transition-all">
                <Link
                  className="flex items-center justify-between p-4 text-gray-900 hover:text-sunset-orange group"
                  href={`/metros/${slugify(m.name)}`}
                >
                  <div>
                    <div className="font-semibold group-hover:underline">{m.name}</div>
                    <div className="text-sm text-gray-600">{m.city}, {m.state}</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-sunset-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* How to Use Section */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use Metro Rankings</h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sunset-orange/10 text-sunset-orange flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="font-semibold text-gray-900">Select Your Metro Area</h3>
                <p className="text-sm mt-1">Choose the metropolitan area closest to where your loved one will live, or where family can easily visit.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sunset-orange/10 text-sunset-orange flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="font-semibold text-gray-900">Review Top-Ranked Facilities</h3>
                <p className="text-sm mt-1">See facilities ranked by SunsetWell quality scores, which combine health inspections, staffing, and quality measures.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sunset-orange/10 text-sunset-orange flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="font-semibold text-gray-900">Compare Multiple Facilities</h3>
                <p className="text-sm mt-1">Add facilities to your comparison list to see detailed side-by-side quality metrics, costs, and insurance acceptance.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sunset-orange/10 text-sunset-orange flex items-center justify-center font-bold">4</div>
              <div>
                <h3 className="font-semibold text-gray-900">Tour &amp; Verify</h3>
                <p className="text-sm mt-1">Always visit facilities in person, speak with staff and residents, and verify current inspection reports before making a final decision.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-8 bg-gradient-to-r from-sunset-orange to-sunset-orange/80 rounded-xl shadow-md p-6 text-white">
          <h2 className="text-2xl font-bold mb-3">Need Help Choosing?</h2>
          <p className="mb-4 text-white/90">
            Use our personalized navigator to find facilities that match your loved one&apos;s specific needs, insurance, and location preferences.
          </p>
          <Link
            href="/navigator"
            className="inline-block bg-white text-sunset-orange px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Facility Navigator →
          </Link>
        </section>

        {/* Disclaimer */}
        <div className="p-4 bg-white/95 backdrop-blur-md rounded-lg text-xs text-gray-700 shadow-md border border-white/20">
          <p>
            <strong>Data Source:</strong> All facility data is sourced from Medicare.gov and updated regularly. SunsetWell scores are calculated using objective quality metrics including health inspection results, staffing ratios, and quality measure performance. Always verify current inspection reports and tour facilities personally before making placement decisions.
          </p>
        </div>
      </div>
    </main>
  );
}

