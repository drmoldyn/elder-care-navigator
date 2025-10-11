import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrackedCTAButton } from "@/components/landing/tracked-cta-button";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Medicaid-Certified Nursing Homes & Assisted Living | Find Facilities Accepting Medicaid",
  description: "Search nursing homes and assisted living facilities that accept Medicaid. Find Medicaid-certified providers, understand eligibility, and compare quality ratings.",
  keywords: [
    "Medicaid nursing homes",
    "Medicaid assisted living",
    "Medicaid certified facilities",
    "Medicaid eldercare",
    "Medicaid long-term care",
    "facilities accepting Medicaid"
  ],
  openGraph: {
    title: "Medicaid Nursing Homes & Assisted Living | Find Certified Facilities",
    description: "Search 50,000+ Medicaid-certified facilities. Compare quality ratings and find care you can afford.",
    type: "website",
  },
};

export default function MedicaidFacilitiesLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sunset-gold/20 via-white to-neutral-warm/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/hero-4.jpg"
            alt="Quality senior care accepting Medicaid"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-sunset-gold/90 via-lavender/80 to-sky-blue/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-sunset-gold/20 text-sunset-gold-dark border-sunset-gold/30">
            Medicaid-Certified Care
          </Badge>
          <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find Quality Care That Accepts Medicaid
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90 sm:text-xl">
            Search 50,000+ Medicare-rated facilities that accept Medicaid for long-term care. Compare quality scores, understand eligibility, and find affordable senior care near you.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <TrackedCTAButton
              href="/navigator?insurance=Medicaid"
              landingPage="medicaid-facilities"
              ctaPosition="hero"
              className="w-full sm:w-auto bg-sunset-gold hover:bg-sunset-gold/90"
            >
              Search Medicaid Facilities →
            </TrackedCTAButton>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="#eligibility">
                Check Eligibility
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="border-b border-gray-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            <div>
              <p className="font-serif text-3xl font-bold text-sunset-gold">50,000+</p>
              <p className="mt-1 text-sm text-gray-600">Medicaid-Certified Facilities</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-lavender">100%</p>
              <p className="mt-1 text-sm text-gray-600">Medicare Rated</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-sky-blue">Free</p>
              <p className="mt-1 text-sm text-gray-600">No Cost to Search</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-sunset-orange">Daily</p>
              <p className="mt-1 text-sm text-gray-600">Data Updated</p>
            </div>
          </div>
        </div>
      </section>

      {/* Understanding Medicaid Coverage */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Understanding Medicaid Long-Term Care
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-sunset-gold/20 bg-gradient-to-br from-white to-sunset-gold/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sunset-gold/20">
                <span className="text-2xl">🏥</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                What Medicaid Covers
              </h3>
              <p className="text-gray-600">
                Medicaid covers nursing home care (skilled nursing facilities) and some assisted living through state waiver programs. Coverage varies by state.
              </p>
            </Card>

            <Card className="border-lavender/20 bg-gradient-to-br from-white to-lavender/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lavender/20">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Eligibility Requirements
              </h3>
              <p className="text-gray-600">
                Income under state limits, assets under $2,000 (individual) or $3,000 (couple), and medical necessity for nursing home level of care.
              </p>
            </Card>

            <Card className="border-sky-blue/20 bg-gradient-to-br from-white to-sky-blue/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-blue/20">
                <span className="text-2xl">⏱️</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Application Timeline
              </h3>
              <p className="text-gray-600">
                Medicaid applications typically take 45-90 days. Many facilities accept &quot;pending Medicaid&quot; while your application is processed.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Eligibility Guide */}
      <section id="eligibility" className="bg-neutral-warm/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Do I Qualify for Medicaid Long-Term Care?
          </h2>
          <div className="space-y-4">
            <Card className="border-l-4 border-l-sunset-gold bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">✓ Income Limits</h3>
              <p className="text-sm text-gray-600">
                Most states: $2,829/month (2024) for an individual. &quot;Income cap&quot; states have strict limits; others use &quot;medically needy&quot; pathways allowing higher income with medical expenses.
              </p>
            </Card>

            <Card className="border-l-4 border-l-lavender bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">✓ Asset Limits</h3>
              <p className="text-sm text-gray-600">
                $2,000 for individual, $3,000 for couples (2024). Excludes primary home, one vehicle, personal belongings, and pre-paid funeral. Married couples have &quot;spousal impoverishment&quot; protections.
              </p>
            </Card>

            <Card className="border-l-4 border-l-sky-blue bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">✓ Medical Need</h3>
              <p className="text-sm text-gray-600">
                Must require &quot;nursing home level of care&quot; - help with 2+ activities of daily living (bathing, dressing, eating, etc.) or cognitive impairment requiring supervision.
              </p>
            </Card>

            <Card className="border-l-4 border-l-sunset-orange bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">✓ Citizenship & Residency</h3>
              <p className="text-sm text-gray-600">
                U.S. citizen or qualified immigrant, resident of the state where applying. No minimum residency period required.
              </p>
            </Card>
          </div>

          <div className="mt-8 rounded-lg border border-sunset-gold/30 bg-sunset-gold/10 p-6">
            <p className="font-semibold text-gray-900">💡 Over the asset limit?</p>
            <p className="mt-2 text-sm text-gray-600">
              A &quot;Medicaid spend-down&quot; strategy may help. Consult an elder law attorney about legal ways to qualify, including Medicaid-compliant annuities, funeral trusts, or home modifications.
            </p>
          </div>
        </div>
      </section>

      {/* How to Find Medicaid Facilities */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Find Quality Medicaid Facilities
          </h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sunset-gold text-xl font-bold text-white">
                1
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Filter by Medicaid Acceptance
                </h3>
                <p className="text-gray-600">
                  Enter your location and select &quot;Medicaid&quot; as insurance. We&apos;ll show facilities certified to accept Medicaid in your state.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-lavender text-xl font-bold text-white">
                2
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Compare Quality Ratings
                </h3>
                <p className="text-gray-600">
                  Check Medicare&apos;s 5-star ratings for quality, staffing, and health inspections. Don&apos;t assume lower-cost means lower-quality—many excellent facilities accept Medicaid.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sky-blue text-xl font-bold text-white">
                3
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Ask About Medicaid Beds
                </h3>
                <p className="text-gray-600">
                  When you call, ask: &quot;Do you have Medicaid beds available?&quot; and &quot;Do you accept pending Medicaid applications?&quot; Some facilities have limited Medicaid beds or waitlists.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <TrackedCTAButton
              href="/navigator?insurance=Medicaid"
              landingPage="medicaid-facilities"
              ctaPosition="mid-page"
              className="bg-sunset-gold hover:bg-sunset-gold/90"
            >
              Start Your Search →
            </TrackedCTAButton>
          </div>
        </div>
      </section>

      {/* State Differences */}
      <section className="bg-neutral-warm/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Important State Differences
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Medicaid Waiver Programs
              </h3>
              <p className="text-gray-600">
                Some states offer Home and Community-Based Services (HCBS) waivers that cover assisted living and in-home care as alternatives to nursing homes. Ask facilities if they participate in your state&apos;s waiver program.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Estate Recovery
              </h3>
              <p className="text-gray-600">
                After death, states may seek reimbursement from your estate for Medicaid costs. Primary home is protected if spouse or disabled child lives there. Rules vary by state.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Look-Back Period
              </h3>
              <p className="text-gray-600">
                Medicaid reviews asset transfers for 5 years before application. Gifting money or property during this period can delay eligibility. Plan ahead or consult an elder law attorney.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Help */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            How to Apply for Medicaid
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-3 font-semibold text-gray-900">1. Gather Documents</h3>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600">
                <li>Social Security card</li>
                <li>Birth certificate or proof of citizenship</li>
                <li>Bank statements (3-5 years)</li>
                <li>Property deeds</li>
                <li>Insurance policies</li>
                <li>Medical records showing need for care</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="mb-3 font-semibold text-gray-900">2. Submit Application</h3>
              <p className="mb-3 text-sm text-gray-600">Apply through:</p>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600">
                <li>State Medicaid office</li>
                <li>Healthcare.gov (if your state participates)</li>
                <li>Hospital discharge planner</li>
                <li>Facility admissions coordinator</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="mb-3 font-semibold text-gray-900">3. Medical Assessment</h3>
              <p className="text-sm text-gray-600">
                State will assess if you meet &quot;nursing home level of care&quot; criteria. Doctor must verify you need help with daily activities or have cognitive impairment.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-3 font-semibold text-gray-900">4. Financial Review</h3>
              <p className="text-sm text-gray-600">
                State reviews income and assets. May request additional documents. Process takes 45-90 days. You&apos;ll receive written approval or denial with appeal rights.
              </p>
            </Card>
          </div>

          <div className="mt-8 rounded-lg border-2 border-sunset-gold/30 bg-sunset-gold/10 p-6">
            <h3 className="mb-2 font-semibold text-gray-900">Need Help Applying?</h3>
            <p className="text-sm text-gray-600">
              Contact your state Medicaid office or call the Eldercare Locator at <span className="font-mono text-sunset-gold">1-800-677-1116</span> to find free assistance programs in your area. Elder law attorneys can also help navigate complex situations.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-neutral-warm/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Common Medicaid Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                What if I&apos;m married and my spouse still lives at home?
              </h3>
              <p className="text-gray-600">
                &quot;Spousal impoverishment&quot; rules protect the at-home spouse. They can keep the home, one car, and significant income/assets (varies by state). The nursing home spouse qualifies for Medicaid based on their portion only.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Does Medicaid cover private rooms?
              </h3>
              <p className="text-gray-600">
                Usually no—Medicaid covers semi-private rooms (2 beds). Private rooms cost extra unless medically necessary (isolation, infection control). Some facilities offer private rooms with additional private pay.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Can I choose any facility that accepts Medicaid?
              </h3>
              <p className="text-gray-600">
                Yes, as long as they have a Medicaid bed available and can meet your care needs. You have the right to choose your facility, but availability may be limited in high-demand areas.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                What happens to my Social Security and pension?
              </h3>
              <p className="text-gray-600">
                Most of your income goes to the nursing home as your &quot;patient pay&quot; amount. You keep a small monthly allowance (typically $30-$75) for personal needs like haircuts, clothing, snacks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Helpful Medicaid Resources
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-2 font-semibold text-gray-900">State Medicaid Office</h3>
              <p className="mb-3 text-sm text-gray-600">Find your state&apos;s Medicaid contact and application portal</p>
              <a href="https://www.medicaid.gov/about-us/contact-us/index.html" target="_blank" rel="noopener noreferrer" className="text-sm text-sunset-gold hover:underline">
                Medicaid.gov Contact Info →
              </a>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold text-gray-900">Eldercare Locator</h3>
              <p className="mb-3 text-sm text-gray-600">Free help finding local Medicaid assistance programs</p>
              <p className="font-mono text-sunset-gold">1-800-677-1116</p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold text-gray-900">SHIP (State Health Insurance)</h3>
              <p className="mb-3 text-sm text-gray-600">Free Medicare/Medicaid counseling in every state</p>
              <a href="https://www.shiphelp.org" target="_blank" rel="noopener noreferrer" className="text-sm text-sunset-gold hover:underline">
                Find Your SHIP Counselor →
              </a>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold text-gray-900">National Academy of Elder Law</h3>
              <p className="mb-3 text-sm text-gray-600">Find certified elder law attorneys for complex cases</p>
              <a href="https://www.naela.org" target="_blank" rel="noopener noreferrer" className="text-sm text-sunset-gold hover:underline">
                Attorney Search →
              </a>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-sunset-gold/20 via-lavender/10 to-sky-blue/10 p-8 text-center shadow-lg sm:p-12">
          <h2 className="mb-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Find Quality Care Within Your Budget
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Search Medicaid-certified facilities. Compare Medicare quality ratings. Free, private, direct contact.
          </p>
          <TrackedCTAButton
            href="/navigator?insurance=Medicaid"
            landingPage="medicaid-facilities"
            ctaPosition="footer"
            className="bg-sunset-gold hover:bg-sunset-gold/90"
          >
            Search Medicaid Facilities →
          </TrackedCTAButton>
          <p className="mt-4 text-sm text-gray-500">
            50,000+ Medicaid-certified facilities nationwide
          </p>
        </div>
      </section>
    </div>
  );
}
