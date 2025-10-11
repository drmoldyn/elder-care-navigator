/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrackedCTAButton } from "@/components/landing/tracked-cta-button";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Urgent Senior Care Placement | Same-Day & Emergency Admissions",
  description: "Find nursing homes and assisted living with immediate availability. Hospital discharge, emergency placement, and same-day admissions near you.",
  keywords: [
    "urgent senior care placement",
    "emergency nursing home admission",
    "same day assisted living",
    "hospital discharge placement",
    "immediate care facility",
    "senior care emergency"
  ],
  openGraph: {
    title: "Urgent Senior Care Placement | Immediate Availability",
    description: "Search facilities with immediate openings. Hospital discharge specialists and emergency placement options.",
    type: "website",
  },
};

export default function UrgentPlacementLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sunset-orange/20 via-white to-neutral-warm/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/hero-3.jpg"
            alt="Urgent senior care placement assistance"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-sunset-orange/90 via-sunset-gold/80 to-sky-blue/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-sunset-orange/20 text-sunset-orange-dark border-sunset-orange/30">
            ⚡ Immediate Assistance Available
          </Badge>
          <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Urgent Senior Care Placement Assistance
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90 sm:text-xl">
            Search facilities with immediate openings for hospital discharge, emergency placement, or sudden care needs. See real-time availability and contact facilities directly.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <TrackedCTAButton
              href="/navigator?urgent=true"
              landingPage="urgent-placement"
              ctaPosition="hero"
              className="w-full sm:w-auto bg-sunset-orange hover:bg-sunset-orange/90"
            >
              Find Available Beds Now →
            </TrackedCTAButton>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="#situations">
                Common Urgent Situations
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-white/80">
            🕐 Available 24/7 • No appointment needed • Direct contact with facilities
          </p>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="border-b border-gray-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            <div>
              <p className="font-serif text-3xl font-bold text-sunset-orange">18,000+</p>
              <p className="mt-1 text-sm text-gray-600">Facilities with Availability</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-sunset-gold">Same Day</p>
              <p className="mt-1 text-sm text-gray-600">Admission Possible</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-sky-blue">24/7</p>
              <p className="mt-1 text-sm text-gray-600">Search Anytime</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-lavender">Free</p>
              <p className="mt-1 text-sm text-gray-600">No Placement Fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* Common Urgent Situations */}
      <section id="situations" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            We Help in These Urgent Situations
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-sunset-orange/20 bg-gradient-to-br from-white to-sunset-orange/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sunset-orange/20">
                <span className="text-2xl">🏥</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Hospital Discharge
              </h3>
              <p className="text-gray-600">
                Hospital says discharge is tomorrow but you don't have placement lined up. Search facilities that accept hospital discharges and have beds available.
              </p>
            </Card>

            <Card className="border-sunset-gold/20 bg-gradient-to-br from-white to-sunset-gold/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sunset-gold/20">
                <span className="text-2xl">🚨</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Safety Emergency
              </h3>
              <p className="text-gray-600">
                Loved one can no longer safely live alone due to wandering, falls, or self-neglect. Immediate supervised care needed.
              </p>
            </Card>

            <Card className="border-sky-blue/20 bg-gradient-to-br from-white to-sky-blue/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-blue/20">
                <span className="text-2xl">💔</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Caregiver Breakdown
              </h3>
              <p className="text-gray-600">
                Primary family caregiver is ill, injured, or exhausted. Need immediate respite or permanent placement to prevent caregiver burnout.
              </p>
            </Card>

            <Card className="border-lavender/20 bg-gradient-to-br from-white to-lavender/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lavender/20">
                <span className="text-2xl">🏡</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Facility Closure
              </h3>
              <p className="text-gray-600">
                Current facility is closing or asked you to find new placement quickly. Need to relocate within days or weeks.
              </p>
            </Card>

            <Card className="border-sunset-orange/20 bg-gradient-to-br from-white to-sunset-orange/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sunset-orange/20">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Rapid Decline
              </h3>
              <p className="text-gray-600">
                Sudden worsening of dementia, mobility, or medical condition. Care needs exceeded what current setting can provide.
              </p>
            </Card>

            <Card className="border-sunset-gold/20 bg-gradient-to-br from-white to-sunset-gold/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sunset-gold/20">
                <span className="text-2xl">✈️</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Relocation Needed
              </h3>
              <p className="text-gray-600">
                Moving loved one closer to family on short notice. Need to find placement in new city quickly while coordinating logistics.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How Urgent Placement Works */}
      <section className="bg-neutral-warm/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Fast-Track Your Search
          </h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sunset-orange text-xl font-bold text-white">
                1
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Search with Urgency Filters
                </h3>
                <p className="text-gray-600">
                  Tell us your situation, location, and insurance. Filter for facilities showing current bed availability and accepting immediate admissions.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sunset-gold text-xl font-bold text-white">
                2
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Call Multiple Facilities
                </h3>
                <p className="text-gray-600">
                  Don't wait—call 3-5 facilities immediately. Ask about bed availability TODAY, admission process timeline, and documents needed. Many can admit within 24-48 hours.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sky-blue text-xl font-bold text-white">
                3
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Expedited Tours & Admission
                </h3>
                <p className="text-gray-600">
                  Request same-day or next-day tours. Bring medical records, insurance cards, and medication list. Some facilities can complete admission paperwork during the tour.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-lg border-2 border-sunset-orange/30 bg-sunset-orange/10 p-6">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
              <span className="text-xl">⏱️</span>
              Timeline for Urgent Placement
            </h3>
            <ul className="ml-6 mt-3 space-y-2 text-sm text-gray-600">
              <li><strong>Emergency (same day):</strong> Possible for hospital discharges with medical necessity. Facility must have bed + staffing available.</li>
              <li><strong>Urgent (1-3 days):</strong> Most common for safety concerns. Time for basic assessment, paperwork, and care plan setup.</li>
              <li><strong>Fast-track (4-7 days):</strong> Allows time to compare options, tour 2-3 facilities, arrange financing or benefits.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Documents Needed */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Documents to Gather Now
          </h2>
          <p className="mb-8 text-center text-gray-600">
            Having these ready speeds up the admission process significantly
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-l-4 border-l-sunset-orange bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">📋 Medical Records</h3>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600">
                <li>Recent hospital discharge summary</li>
                <li>Current medication list (with dosages)</li>
                <li>Physician orders for care needs</li>
                <li>Recent labs or test results</li>
              </ul>
            </Card>

            <Card className="border-l-4 border-l-sunset-gold bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">💳 Insurance & Financial</h3>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600">
                <li>Insurance cards (Medicare, Medicaid, private)</li>
                <li>Social Security card or number</li>
                <li>Bank statements (if applying for Medicaid)</li>
                <li>VA benefits documentation (if applicable)</li>
              </ul>
            </Card>

            <Card className="border-l-4 border-l-sky-blue bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">📝 Legal Documents</h3>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600">
                <li>Power of Attorney (medical and financial)</li>
                <li>Advance directives or living will</li>
                <li>Guardian or conservator papers (if applicable)</li>
                <li>DNR orders (if applicable)</li>
              </ul>
            </Card>

            <Card className="border-l-4 border-l-lavender bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">👤 Personal Information</h3>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600">
                <li>Photo ID or driver's license</li>
                <li>Emergency contact information</li>
                <li>Preferred pharmacy information</li>
                <li>Dietary restrictions or preferences</li>
              </ul>
            </Card>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            💡 Don't have everything? That's OK—facilities can often start with partial documents and gather the rest later.
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-neutral-warm/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Urgent Placement Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Can someone really be admitted the same day?
              </h3>
              <p className="text-gray-600">
                Yes, especially from hospital discharge. Facilities can expedite if they have a bed, appropriate staffing, and necessary medical information. Most common for skilled nursing admissions with Medicare coverage.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                What if I can't afford to pay immediately?
              </h3>
              <p className="text-gray-600">
                Many facilities accept "pending Medicaid" applications, meaning they'll admit while you apply for benefits. Some offer short-term payment plans. Ask about financial assistance programs and charity care policies.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Should I take the first available bed?
              </h3>
              <p className="text-gray-600">
                If it's a true emergency and you've vetted basic safety/quality, yes. Check Medicare ratings and ask key questions by phone before committing. You can often transfer to a preferred facility later if needed.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                What questions should I ask on the phone?
              </h3>
              <p className="text-gray-600">
                (1) Do you have a bed available now? (2) What level of care do you provide? (3) Do you accept [my insurance]? (4) Can you admit from hospital/home? (5) What documents do you need today? (6) Can I tour this afternoon?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border-2 border-sunset-orange/30 bg-gradient-to-br from-sunset-orange/10 via-sunset-gold/5 to-white p-8">
            <h2 className="mb-4 text-center font-serif text-2xl font-bold text-gray-900">
              Need Help Navigating an Urgent Situation?
            </h2>
            <p className="mb-6 text-center text-gray-600">
              While SunsetWell is a free search tool, these resources can provide immediate guidance:
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-lg">📞</span>
                <div>
                  <p className="font-semibold text-gray-900">Hospital Social Worker</p>
                  <p className="text-gray-600">If discharging from hospital, ask to speak with discharge planner or social worker—they can expedite placement.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🏥</span>
                <div>
                  <p className="font-semibold text-gray-900">Area Agency on Aging</p>
                  <p className="text-gray-600">Local experts can help navigate options: 1-800-677-1116 (Eldercare Locator)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">⚖️</span>
                <div>
                  <p className="font-semibold text-gray-900">Elder Law Attorney</p>
                  <p className="text-gray-600">Can help with Medicaid applications, asset protection during crisis placement.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-sunset-orange/20 via-sunset-gold/10 to-sky-blue/10 p-8 text-center shadow-lg sm:p-12">
          <h2 className="mb-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Find Immediate Care Options Now
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Search facilities with availability. Call directly. No delays, no middlemen, no cost.
          </p>
          <TrackedCTAButton
            href="/navigator?urgent=true"
            landingPage="urgent-placement"
            ctaPosition="footer"
            className="bg-sunset-orange hover:bg-sunset-orange/90"
          >
            Search Available Beds →
          </TrackedCTAButton>
          <p className="mt-4 text-sm text-gray-500">
            18,000+ facilities • Real-time availability • 24/7 access
          </p>
        </div>
      </section>
    </div>
  );
}
