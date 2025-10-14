import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Senior Care Guides & Resources | SunsetWell",
  description: "Expert guides on choosing nursing homes, understanding Medicare coverage, and navigating senior care decisions. Free resources for families and caregivers.",
  keywords: [
    "nursing home guides",
    "senior care resources",
    "eldercare advice",
    "nursing home selection",
    "Medicare guide",
    "caregiver resources"
  ],
};

const guides = [
  {
    slug: "how-to-choose-nursing-home",
    title: "How to Choose a Nursing Home",
    description: "Complete guide to selecting a quality nursing home, including Medicare ratings, questions to ask, and red flags to avoid.",
    readTime: "15 min read",
    category: "Facility Selection",
    published: true,
    featured: true,
  },
  {
    slug: "medicare-vs-medicaid-coverage",
    title: "Medicare vs Medicaid: What's Covered for Nursing Homes",
    description: "Understanding what Medicare and Medicaid cover for nursing home care, eligibility requirements, and how to apply.",
    readTime: "12 min read",
    category: "Insurance & Costs",
    published: false,
    featured: false,
  },
  {
    slug: "nursing-home-costs-by-state",
    title: "Nursing Home Costs by State: 2025 Price Guide",
    description: "Average nursing home costs across all 50 states, what's included in daily rates, and financial assistance options.",
    readTime: "10 min read",
    category: "Insurance & Costs",
    published: false,
    featured: false,
  },
  {
    slug: "hospital-discharge-planning",
    title: "Hospital Discharge to Nursing Home: What You Need to Know",
    description: "Navigate the urgent transition from hospital to nursing home with our step-by-step discharge planning guide.",
    readTime: "8 min read",
    category: "Urgent Care",
    published: false,
    featured: false,
  },
  {
    slug: "reading-inspection-reports",
    title: "How to Read Nursing Home Inspection Reports",
    description: "Understand deficiency codes, severity levels, and what inspection reports really tell you about care quality.",
    readTime: "12 min read",
    category: "Quality Assessment",
    published: false,
    featured: false,
  },
  {
    slug: "nursing-home-tour-checklist",
    title: "Nursing Home Tour Questions: Printable Checklist",
    description: "50 essential questions to ask during facility tours, organized by category with downloadable PDF checklist.",
    readTime: "6 min read",
    category: "Facility Selection",
    published: false,
    featured: false,
  },
];

export default function GuidesIndexPage() {
  const publishedGuides = guides.filter(g => g.published);
  const upcomingGuides = guides.filter(g => !g.published);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-lavender via-sky-blue/20 to-sunset-orange/10 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <nav className="text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-sunset-orange">Home</Link>
            {" / "}
            <span className="text-gray-900 font-semibold">Guides</span>
          </nav>

          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Senior Care Guides & Resources
          </h1>

          <p className="text-xl text-gray-700 max-w-3xl">
            Expert guidance for families navigating nursing home selection, Medicare coverage, and senior care decisions. All guides are free, written by care experts, and updated regularly.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Published Guides */}
        {publishedGuides.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Guides</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {publishedGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="group bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg hover:border-sunset-orange/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-sunset-orange">
                      {guide.category}
                    </span>
                    <span className="text-xs text-gray-500">{guide.readTime}</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-sunset-orange">
                    {guide.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {guide.description}
                  </p>

                  <div className="flex items-center text-sunset-orange font-semibold text-sm">
                    Read Guide
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Coming Soon */}
        {upcomingGuides.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Coming Soon</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {upcomingGuides.map((guide) => (
                <div
                  key={guide.slug}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 opacity-70"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-2">
                    {guide.category}
                  </span>

                  <h3 className="font-bold text-gray-900 mb-2 text-base">
                    {guide.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3">
                    {guide.description}
                  </p>

                  <span className="text-xs text-gray-500 font-semibold">
                    📅 Publishing soon
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Topic</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="text-2xl mb-2">🏥</div>
              <h3 className="font-bold text-gray-900 mb-1">Facility Selection</h3>
              <p className="text-sm text-gray-600">Choosing the right nursing home or assisted living facility</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-bold text-gray-900 mb-1">Insurance & Costs</h3>
              <p className="text-sm text-gray-600">Understanding Medicare, Medicaid, and paying for care</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-bold text-gray-900 mb-1">Urgent Care</h3>
              <p className="text-sm text-gray-600">Hospital discharges and quick placement decisions</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-bold text-gray-900 mb-1">Quality Assessment</h3>
              <p className="text-sm text-gray-600">Evaluating facility quality, ratings, and inspection reports</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-sunset-orange to-sunset-orange/80 rounded-xl shadow-md p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Find Quality Care?</h2>
          <p className="mb-6 text-white/90">
            Use our free search tool to find and compare nursing homes near you. Filter by insurance, Medicare ratings, and specialized services.
          </p>
          <Link
            href="/navigator"
            className="inline-block bg-white text-sunset-orange px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            Start Facility Search →
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg text-sm text-gray-700">
          <p>
            <strong>Note:</strong> These guides provide general information and should not be considered medical or legal advice. Always consult with healthcare professionals and legal advisors for your specific situation. Facility data is sourced from Medicare.gov and updated regularly.
          </p>
        </div>
      </div>
    </main>
  );
}
