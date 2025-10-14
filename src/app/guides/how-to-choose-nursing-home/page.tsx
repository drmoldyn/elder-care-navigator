import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Choose a Nursing Home: Complete 2025 Guide | SunsetWell",
  description: "Learn how to choose a quality nursing home with our comprehensive guide. Includes checklist, questions to ask, Medicare star ratings explained, and red flags to avoid.",
  keywords: [
    "how to choose a nursing home",
    "choosing nursing home",
    "nursing home selection guide",
    "nursing home checklist",
    "questions to ask nursing home",
    "nursing home quality ratings"
  ],
  openGraph: {
    title: "How to Choose a Nursing Home: Complete 2025 Guide",
    description: "Expert guidance on selecting a quality nursing home for your loved one. Free checklist included.",
    type: "article",
    publishedTime: "2025-10-14T00:00:00Z",
  },
};

export default function HowToChooseNursingHomePage() {
  // FAQ Schema for Google rich results
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What should I look for when choosing a nursing home?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Focus on five key areas: quality of care (Medicare star ratings, inspection reports), staffing levels (registered nurse hours per resident day), safety and cleanliness, resident quality of life (activities, food, social engagement), and costs and insurance acceptance. Always tour facilities in person and speak with staff and residents."
        }
      },
      {
        "@type": "Question",
        "name": "How do I read Medicare nursing home star ratings?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Medicare's 5-star rating system evaluates three areas: health inspections (on-site surveys), staffing (RN and total nurse hours), and quality measures (clinical outcomes like pressure ulcers, falls). Five stars is the highest rating. Focus especially on health inspection ratings as they reflect actual care quality observed during surveys."
        }
      },
      {
        "@type": "Question",
        "name": "What questions should I ask during a nursing home tour?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ask about staffing ratios (how many residents per nurse), staff turnover rates, how they handle medical emergencies, what activities are offered daily, how they accommodate dietary needs and preferences, their policy on family visits, how they communicate with families about resident status, what services are included in the base rate, and whether they accept your insurance or Medicaid."
        }
      },
      {
        "@type": "Question",
        "name": "What are red flags to avoid in a nursing home?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Major red flags include strong unpleasant odors, residents left unattended or calling for help, staff who are rude or dismissive, pressure to sign contracts immediately, multiple recent citations for serious health violations, high staff turnover, locked medication carts left open, poor food quality or presentation, lack of activities or engagement, and resistance to answering questions or providing documents."
        }
      },
      {
        "@type": "Question",
        "name": "How long should I take to choose a nursing home?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ideally, take 2-4 weeks to research, tour multiple facilities, and make a decision. However, if you're coming from a hospital discharge, you may have only 3-7 days. In urgent situations, focus on checking Medicare ratings online, touring your top 2-3 choices, and verifying they accept your insurance. You can always transfer later if needed."
        }
      }
    ]
  };

  // Article schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "How to Choose a Nursing Home: Complete 2025 Guide",
    "description": "Comprehensive guide to selecting a quality nursing home for your loved one, including Medicare ratings, questions to ask, and red flags to avoid.",
    "datePublished": "2025-10-14T00:00:00Z",
    "dateModified": "2025-10-14T00:00:00Z",
    "author": {
      "@type": "Organization",
      "name": "SunsetWell"
    },
    "publisher": {
      "@type": "Organization",
      "name": "SunsetWell",
      "logo": {
        "@type": "ImageObject",
        "url": "https://sunsetwell.com/logo.png"
      }
    }
  };

  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-lavender via-sky-blue/20 to-sunset-orange/10 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <nav className="text-sm text-gray-600 mb-6">
              <Link href="/" className="hover:text-sunset-orange">Home</Link>
              {" / "}
              <Link href="/guides" className="hover:text-sunset-orange">Guides</Link>
              {" / "}
              <span className="text-gray-900 font-semibold">How to Choose a Nursing Home</span>
            </nav>

            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How to Choose a Nursing Home: Complete 2025 Guide
            </h1>

            <p className="text-xl text-gray-700 mb-6">
              Making the right choice for your loved one's long-term care requires careful evaluation. This comprehensive guide walks you through every step of selecting a quality nursing home, from understanding Medicare ratings to asking the right questions during tours.
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>📅 Updated: October 2025</span>
              <span>⏱️ 15 min read</span>
              <span>✍️ By SunsetWell</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <article className="mx-auto max-w-4xl px-6 py-12">

          {/* Quick Answer Box */}
          <div className="mb-12 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Quick Answer</h2>
            <p className="text-gray-800 leading-relaxed">
              To choose a nursing home: <strong>(1)</strong> Check Medicare star ratings and inspection reports online, <strong>(2)</strong> Visit at least 3 facilities in person, <strong>(3)</strong> Verify they accept your insurance/Medicaid, <strong>(4)</strong> Talk to staff and residents, <strong>(5)</strong> Trust your instincts about cleanliness, safety, and culture. Use our <Link href="/navigator" className="text-blue-700 underline font-semibold">free search tool</Link> to compare facilities near you.
            </p>
          </div>

          {/* Table of Contents */}
          <div className="mb-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Table of Contents</h2>
            <ol className="space-y-2 list-decimal list-inside text-gray-700">
              <li><a href="#understanding-options" className="hover:text-sunset-orange">Understanding Your Options</a></li>
              <li><a href="#medicare-ratings" className="hover:text-sunset-orange">How to Read Medicare Star Ratings</a></li>
              <li><a href="#what-to-look-for" className="hover:text-sunset-orange">What to Look For in a Nursing Home</a></li>
              <li><a href="#touring-facilities" className="hover:text-sunset-orange">How to Tour Facilities Effectively</a></li>
              <li><a href="#questions-to-ask" className="hover:text-sunset-orange">Essential Questions to Ask</a></li>
              <li><a href="#red-flags" className="hover:text-sunset-orange">Red Flags to Avoid</a></li>
              <li><a href="#making-decision" className="hover:text-sunset-orange">Making Your Final Decision</a></li>
              <li><a href="#urgent-placement" className="hover:text-sunset-orange">What If You Need to Decide Quickly?</a></li>
            </ol>
          </div>

          {/* Section 1 */}
          <section id="understanding-options" className="mb-12 scroll-mt-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Understanding Your Options</h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              Before diving into nursing home selection, it's important to understand whether a nursing home is the right level of care for your loved one. Many families explore nursing homes when they're actually looking for assisted living or memory care.
            </p>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Types of Senior Care Facilities</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Nursing Homes (Skilled Nursing Facilities)</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    <strong>Best for:</strong> 24/7 medical care, post-surgery rehabilitation, advanced dementia, chronic illness requiring nursing supervision.
                    Medicare typically covers first 100 days for post-hospital care. Medicaid covers long-term stays for those who qualify.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Assisted Living Facilities</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    <strong>Best for:</strong> Help with daily activities (bathing, dressing, medication management) but don't need constant medical care.
                    Typically not covered by Medicare/Medicaid. Average cost: $4,500/month.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Memory Care Units</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    <strong>Best for:</strong> Alzheimer's or dementia requiring specialized, secured environment.
                    Can be standalone or within nursing homes/assisted living. Focus on safety, routine, and specialized activities.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Home Health Care</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    <strong>Best for:</strong> Seniors who want to stay home but need part-time nursing or therapy.
                    Medicare covers home health if medically necessary. Services include nursing visits, physical therapy, and personal care aides.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed">
              This guide focuses on <strong>nursing homes</strong> (also called skilled nursing facilities or SNFs). If your loved one needs 24-hour medical supervision, help with most daily activities, or is being discharged from a hospital, a nursing home is likely the appropriate choice.
            </p>
          </section>

          {/* Section 2 */}
          <section id="medicare-ratings" className="mb-12 scroll-mt-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How to Read Medicare Star Ratings</h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              Medicare's 5-star rating system is your first and most important tool for evaluating nursing homes. Every Medicare/Medicaid-certified nursing home in the U.S. is rated on three key measures:
            </p>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-start gap-3 mb-2">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">1</span>
                    <div>
                      <h3 className="font-bold text-gray-900">Health Inspections (Most Important)</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Based on annual on-site surveys by state inspectors. They check resident care, safety, cleanliness, staff competence, and compliance with regulations.
                      </p>
                    </div>
                  </div>
                  <div className="ml-11 p-3 bg-amber-50 border-l-2 border-amber-400 text-sm">
                    <strong>Why it matters:</strong> This rating reflects what inspectors actually saw during unannounced visits. Low ratings (1-2 stars) indicate serious deficiencies like inadequate care, safety violations, or poor sanitation.
                  </div>
                </div>

                <div>
                  <div className="flex items-start gap-3 mb-2">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">2</span>
                    <div>
                      <h3 className="font-bold text-gray-900">Staffing Levels</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Measures the number of nursing staff hours per resident per day. Higher staffing = better care. Looks at both total nursing hours and specifically Registered Nurse (RN) hours.
                      </p>
                    </div>
                  </div>
                  <div className="ml-11 p-3 bg-amber-50 border-l-2 border-amber-400 text-sm">
                    <strong>What to look for:</strong> At least 4.1 total nursing hours per resident per day, with at least 0.75 RN hours. Facilities with 5-star staffing ratings typically exceed these minimums.
                  </div>
                </div>

                <div>
                  <div className="flex items-start gap-3 mb-2">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">3</span>
                    <div>
                      <h3 className="font-bold text-gray-900">Quality Measures</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Clinical outcomes like how often residents experience pressure ulcers, falls, infections, or unnecessary use of antipsychotic medications.
                      </p>
                    </div>
                  </div>
                  <div className="ml-11 p-3 bg-amber-50 border-l-2 border-amber-400 text-sm">
                    <strong>Why it matters:</strong> These measures show actual resident health outcomes. Facilities with low rates of pressure ulcers and infections demonstrate better day-to-day care quality.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-sunset-orange/10 to-lavender/10 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">How to Interpret Star Ratings</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>⭐⭐⭐⭐⭐ <strong>5 stars (Excellent):</strong> Well above average in all categories. Your top choices.</li>
                <li>⭐⭐⭐⭐ <strong>4 stars (Above Average):</strong> Good quality care with few concerns.</li>
                <li>⭐⭐⭐ <strong>3 stars (Average):</strong> Meets minimum standards but may have some issues.</li>
                <li>⭐⭐ <strong>2 stars (Below Average):</strong> Multiple deficiencies or concerns. Tour carefully.</li>
                <li>⭐ <strong>1 star (Poor):</strong> Serious quality concerns. Avoid unless dramatically improved since last inspection.</li>
              </ul>
            </div>

            <p className="text-gray-700 leading-relaxed">
              <strong>Pro tip:</strong> Don't just look at the overall star rating. Click through to see the <em>health inspection</em> rating specifically. A facility might have 3 stars overall but only 1-2 stars for health inspections—that's a red flag. Use <Link href="/navigator" className="text-sunset-orange underline font-semibold">our search tool</Link> to filter facilities by star ratings and compare quality metrics side-by-side.
            </p>
          </section>

          {/* Section 3 */}
          <section id="what-to-look-for" className="mb-12 scroll-mt-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What to Look For in a Nursing Home</h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              Beyond star ratings, there are five critical areas to evaluate when choosing a nursing home. Prioritize these during your research and tours:
            </p>

            <div className="space-y-6">
              {/* Quality of Care */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🏥</span> Quality of Care
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Medicare ratings:</strong> 4-5 stars for health inspections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Inspection reports:</strong> No recent serious violations (abuse, neglect, safety hazards)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Medical director:</strong> On-site regularly, not just "on call"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Specialized care:</strong> If needed (wound care, dialysis, ventilator, dementia care)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Partnerships:</strong> Relationships with nearby hospitals for emergencies</span>
                  </li>
                </ul>
              </div>

              {/* Staffing */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">👥</span> Staffing Levels & Stability
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Staffing ratio:</strong> At least 1 nurse per 6-8 residents during day shift</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>RN presence:</strong> Registered Nurse on duty 24/7, not just LPNs or CNAs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Staff turnover:</strong> Low turnover (ask during tour—high turnover disrupts care continuity)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Staff demeanor:</strong> Observe interactions—are they patient, compassionate, engaged?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Language match:</strong> Staff who speak your loved one's primary language</span>
                  </li>
                </ul>
              </div>

              {/* Safety & Cleanliness */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">✨</span> Safety & Cleanliness
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Odor-free:</strong> Should not smell of urine, feces, or strong cleaning chemicals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Well-lit:</strong> Bright common areas and hallways (reduces falls)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Fall prevention:</strong> Grab bars, non-slip floors, call buttons within reach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Infection control:</strong> Hand sanitizer stations, staff following hygiene protocols</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Security:</strong> Secured exits (for dementia units), visitor sign-in, monitored entrances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Resident rooms:</strong> Clean linens, personal belongings respected, no clutter</span>
                  </li>
                </ul>
              </div>

              {/* Quality of Life */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🌟</span> Resident Quality of Life
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Activities:</strong> Daily calendar of meaningful activities (not just bingo and TV)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Meals:</strong> Good food quality, choices offered, dietary needs accommodated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Outdoor access:</strong> Safe outdoor space for residents to enjoy fresh air</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Social engagement:</strong> Residents interacting with each other, not isolated in rooms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Personalization:</strong> Residents can bring furniture, photos, decorations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Resident council:</strong> Residents have a voice in facility decisions</span>
                  </li>
                </ul>
              </div>

              {/* Location & Practical */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">📍</span> Location & Practical Considerations
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Distance:</strong> Close enough for regular family visits (research shows frequent visits improve outcomes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Insurance/Medicaid:</strong> Accepts your payment method and has available beds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Costs:</strong> Clear pricing, no hidden fees, understand what's included vs extra charges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Availability:</strong> Bed available when needed (or short waitlist)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span><strong>Visiting hours:</strong> Flexible hours, no unnecessary restrictions</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <div className="my-12 bg-gradient-to-r from-sunset-orange to-sunset-orange/80 rounded-xl shadow-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-3">Ready to Start Your Search?</h3>
            <p className="mb-6 text-white/90 text-lg">
              Use our free navigator to find nursing homes near you that match your needs, insurance, and preferences. Compare Medicare ratings, staffing data, and quality measures for facilities in your area.
            </p>
            <Link
              href="/navigator"
              className="inline-block bg-white text-sunset-orange px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-md"
            >
              Start Free Facility Search →
            </Link>
          </div>

          {/* Section 4 - Questions */}
          <section id="questions-to-ask" className="mb-12 scroll-mt-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Essential Questions to Ask During Tours</h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              Touring facilities in person is non-negotiable. No amount of online research can replace seeing the environment, meeting staff, and observing resident care firsthand. Here are the must-ask questions organized by category:
            </p>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3">Staffing Questions</h3>
                <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                  <li>What is your current staffing ratio (residents per nurse)?</li>
                  <li>Is an RN on duty 24/7, or just during certain shifts?</li>
                  <li>What is your staff turnover rate?</li>
                  <li>How do you handle staff shortages or call-outs?</li>
                  <li>Do staff receive ongoing training? (Dementia care, fall prevention, etc.)</li>
                  <li>Can I meet the nurse who would be assigned to my loved one?</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3">Medical Care Questions</h3>
                <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                  <li>How often does a doctor visit residents?</li>
                  <li>Can my loved one keep their current doctor?</li>
                  <li>How do you handle medical emergencies? (On-site response time? Hospital transfers?)</li>
                  <li>What specialized services do you offer? (Physical therapy, wound care, etc.)</li>
                  <li>How do you manage medications and pharmacy services?</li>
                  <li>Do you have isolation rooms for infection control?</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3">Daily Life Questions</h3>
                <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                  <li>What does a typical day look like for residents?</li>
                  <li>What activities are offered daily? Who leads them?</li>
                  <li>Can I see this week's meal menu? Can residents make food requests?</li>
                  <li>How do you accommodate dietary restrictions or cultural food preferences?</li>
                  <li>Is there outdoor space residents can access?</li>
                  <li>Can residents bring personal furniture or decorations?</li>
                  <li>How do you help residents maintain connections with family and community?</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3">Communication & Family Involvement</h3>
                <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                  <li>How often will you update me about my loved one's condition?</li>
                  <li>How do you communicate changes in health status? (Phone? Portal? In-person?)</li>
                  <li>Can family participate in care planning meetings?</li>
                  <li>Are there any restrictions on visiting hours?</li>
                  <li>Is there a family council or support group?</li>
                  <li>How do you handle complaints or concerns?</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3">Financial & Administrative Questions</h3>
                <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                  <li>What is the daily/monthly rate? What's included?</li>
                  <li>What services cost extra? (Laundry, salon, special therapies)</li>
                  <li>Do you accept Medicare/Medicaid? Are beds available?</li>
                  <li>What happens if my loved one runs out of money?</li>
                  <li>What is your discharge policy? (Under what circumstances would a resident be asked to leave?)</li>
                  <li>Can I review the contract before signing? Is there a trial period?</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <p className="text-sm text-gray-800">
                <strong>Pro tip:</strong> Visit at different times of day, including during a meal. Observe how staff interact with residents when they don't know they're being watched. The best facilities won't rush your questions and will offer to introduce you to current residents and families.
              </p>
            </div>
          </section>

          {/* Section 5 - Red Flags */}
          <section id="red-flags" className="mb-12 scroll-mt-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Red Flags to Avoid</h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              Trust your instincts. If something feels "off" during a tour, it probably is. Here are serious warning signs that should make you cross a facility off your list:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  <span>🚨</span> Immediate Disqualifiers
                </h3>
                <ul className="space-y-1 text-sm text-red-900">
                  <li>• Strong odors (urine, feces, body odor)</li>
                  <li>• Residents calling for help with no response</li>
                  <li>• Staff yelling at or being rough with residents</li>
                  <li>• Multiple serious health inspection violations</li>
                  <li>• Pressure to sign contract same day</li>
                  <li>• Unwillingness to answer questions or show documents</li>
                  <li>• Locked medication carts left unattended</li>
                  <li>• Residents restrained without clear medical need</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <span>⚠️</span> Serious Concerns
                </h3>
                <ul className="space-y-1 text-sm text-amber-900">
                  <li>• Most residents in beds or wheelchairs with no activity</li>
                  <li>• Staff too busy to speak with you or seem frazzled</li>
                  <li>• High staff turnover (>30% annually)</li>
                  <li>• Can't provide recent inspection reports immediately</li>
                  <li>• Vague answers about staffing ratios or nurse availability</li>
                  <li>• Poor food quality or presentation</li>
                  <li>• No posted activity schedule</li>
                  <li>• Residents look unkempt (unbathed, unchanged clothing)</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-3">What to Do If You See Red Flags</h3>
              <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                <li><strong>Document what you observed</strong> - Take notes, photos if allowed</li>
                <li><strong>Check recent inspection reports</strong> - See if concerns were previously cited</li>
                <li><strong>Contact the state ombudsman</strong> - They can investigate complaints</li>
                <li><strong>Look for alternatives</strong> - Don't settle for a facility that raises concerns</li>
                <li><strong>Report safety issues immediately</strong> - Call state health department if you witness abuse or neglect</li>
              </ol>
            </div>
          </section>

          {/* Section 6 - Making Decision */}
          <section id="making-decision" className="mb-12 scroll-mt-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Making Your Final Decision</h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              After researching and touring facilities, you'll need to narrow down your choices and make a final decision. Here's how to approach this difficult choice:
            </p>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Decision-Making Framework</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">1</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Compare Top 3 Choices Side-by-Side</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Use our <Link href="/compare" className="text-sunset-orange underline font-semibold">free comparison tool</Link> to see Medicare ratings, costs, and quality measures in one view. Focus on health inspection ratings and staffing levels as your primary criteria.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">2</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Trust Your Gut About Culture Fit</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Beyond ratings, consider: Did staff seem genuinely caring? Were residents engaged and comfortable? Could you see your loved one thriving there? Culture fit matters for quality of life.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">3</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Involve Your Loved One (If Possible)</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      If your loved one is cognitively able, let them participate in the decision. Their comfort and buy-in will help with the transition. Visit together if possible.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">4</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Verify Availability & Insurance Before Committing</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Confirm they have an available bed, accept your insurance, and can accommodate any special needs. Get this in writing before signing contracts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">5</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Review Contract Carefully</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Never sign on the spot. Take the contract home, read every page, understand costs, services included, and discharge policies. Consider having an elder law attorney review it.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
              <h3 className="font-semibold text-green-900 mb-2">Remember: You Can Always Transfer</h3>
              <p className="text-sm text-green-900">
                If a facility doesn't work out, you're not stuck forever. Residents have the right to transfer to another nursing home. While not ideal, knowing you have this option can ease the pressure of making a "perfect" decision. Focus on finding a safe, quality facility now, and adjust later if needed.
              </p>
            </div>
          </section>

          {/* Section 7 - Urgent Placement */}
          <section id="urgent-placement" className="mb-12 scroll-mt-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What If You Need to Decide Quickly?</h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              Hospital discharges often force families to choose a nursing home in just 3-7 days. While not ideal, you can still make a good decision quickly by focusing on essentials:
            </p>

            <div className="bg-amber-50 border border-amber-300 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-amber-900 mb-3">🚨 Emergency Nursing Home Selection (72-Hour Timeline)</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Day 1: Research Online (2-3 hours)</h4>
                  <ul className="text-sm text-amber-900 space-y-1 ml-4">
                    <li>• Use our <Link href="/navigator" className="text-amber-900 underline font-bold">urgent search tool</Link> to filter by insurance and location</li>
                    <li>• Check Medicare ratings - focus on health inspections (must be 3+ stars minimum)</li>
                    <li>• Call top 5 facilities to verify bed availability</li>
                    <li>• Narrow to top 3 based on ratings, availability, and location</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Day 2: Tour Facilities (half day)</h4>
                  <ul className="text-sm text-amber-900 space-y-1 ml-4">
                    <li>• Schedule tours at all 3 facilities (morning or mealtime)</li>
                    <li>• Ask critical questions: staffing ratios, RN availability, specialized care</li>
                    <li>• Observe: cleanliness, staff demeanor, resident engagement</li>
                    <li>• Trust your gut - if it feels wrong, cross it off</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Day 3: Decide & Paperwork (2-3 hours)</h4>
                  <ul className="text-sm text-amber-900 space-y-1 ml-4">
                    <li>• Choose your top facility based on safety, quality, and gut feeling</li>
                    <li>• Review contract (focus on costs, services, discharge policy)</li>
                    <li>• Complete admission paperwork</li>
                    <li>• Remember: you can transfer later if needed</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Your Rights During Hospital Discharge</h3>
              <ul className="text-sm text-blue-900 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span>You <strong>cannot be forced</strong> to choose a specific facility. You have the right to select from available options.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span>The hospital <strong>must provide a list</strong> of Medicare-certified facilities that can meet medical needs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span>You can <strong>appeal discharge</strong> if you feel it's too soon (contact hospital patient advocate).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span>Medicare covers <strong>up to 100 days</strong> of skilled nursing care after a 3-day hospital stay (conditions apply).</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Final CTA */}
          <div className="my-12 bg-gradient-to-br from-lavender via-sky-blue/20 to-sunset-orange/10 rounded-xl shadow-lg p-8 border border-lavender/30">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Finding Quality Care Today</h3>
            <p className="mb-6 text-gray-700 text-lg leading-relaxed">
              You now have the knowledge to confidently choose a nursing home that provides safe, compassionate care. Use our free tools to search 75,000+ facilities, compare Medicare ratings, and find the right fit for your family.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/navigator"
                className="inline-block bg-sunset-orange text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-sunset-orange/90 transition-colors shadow-md"
              >
                Search Facilities Near You →
              </Link>
              <Link
                href="/compare"
                className="inline-block bg-white text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-md border-2 border-gray-200"
              >
                Compare Facilities
              </Link>
            </div>
          </div>

          {/* Related Guides (Placeholder for future content) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 opacity-60">
                <h3 className="font-semibold text-gray-900 mb-2">Medicare vs Medicaid Coverage</h3>
                <p className="text-sm text-gray-600">Understanding what each program covers for nursing home care.</p>
                <span className="text-xs text-gray-500 mt-2 block">Coming soon</span>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 opacity-60">
                <h3 className="font-semibold text-gray-900 mb-2">Nursing Home Costs by State</h3>
                <p className="text-sm text-gray-600">Average costs and what's included in daily rates across the U.S.</p>
                <span className="text-xs text-gray-500 mt-2 block">Coming soon</span>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 opacity-60">
                <h3 className="font-semibold text-gray-900 mb-2">Hospital Discharge Planning</h3>
                <p className="text-sm text-gray-600">What to do when the hospital says it's time for nursing home care.</p>
                <span className="text-xs text-gray-500 mt-2 block">Coming soon</span>
              </div>
            </div>
          </section>

        </article>

        {/* Footer CTA */}
        <div className="bg-gray-900 text-white py-12">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-2xl font-bold mb-3">Have Questions About Choosing a Nursing Home?</h2>
            <p className="text-gray-300 mb-6">
              We're here to help families navigate senior care decisions. Explore our tools and resources to find quality care with confidence.
            </p>
            <Link
              href="/"
              className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Back to Homepage
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
