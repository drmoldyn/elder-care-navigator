import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrackedCTAButton } from "@/components/landing/tracked-cta-button";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Memory Care Facilities Near You | Specialized Dementia & Alzheimer&apos;s Care",
  description: "Find Medicare-certified memory care facilities with specialized dementia and Alzheimer&apos;s programs. Compare ratings, services, and availability near you.",
  keywords: [
    "memory care facilities",
    "dementia care near me",
    "Alzheimer&apos;s care facilities",
    "memory care units",
    "specialized dementia care",
    "memory care near me"
  ],
  openGraph: {
    title: "Memory Care Facilities | Specialized Dementia & Alzheimer&apos;s Care",
    description: "Find Medicare-certified memory care facilities near you. Compare ratings, specialized programs, and availability.",
    type: "website",
  },
};

export default function MemoryCareLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender/20 via-white to-neutral-warm/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/hero-1.jpg"
            alt="Memory care facility with compassionate caregiver"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-lavender/90 via-sky-blue/80 to-sunset-orange/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-lavender/20 text-lavender-dark border-lavender/30">
            Specialized Memory Care
          </Badge>
          <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find the Right Memory Care Facility for Your Loved One
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90 sm:text-xl">
            Search 12,000+ Medicare-certified memory care facilities with specialized dementia and Alzheimer&apos;s programs. Compare safety features, staff training, and family reviews.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <TrackedCTAButton
              href="/navigator?condition=memory_care"
              landingPage="memory-care"
              ctaPosition="hero"
              className="w-full sm:w-auto bg-lavender hover:bg-lavender/90"
            >
              Find Memory Care Facilities →
            </TrackedCTAButton>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="#how-it-works">
                How It Works
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
              <p className="font-serif text-3xl font-bold text-lavender">12,000+</p>
              <p className="mt-1 text-sm text-gray-600">Memory Care Facilities</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-sky-blue">100%</p>
              <p className="mt-1 text-sm text-gray-600">Medicare Certified</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-sunset-orange">Free</p>
              <p className="mt-1 text-sm text-gray-600">No Cost to Families</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-sunset-gold">Updated</p>
              <p className="mt-1 text-sm text-gray-600">Daily Data Refresh</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Memory Care Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Why Choose Specialized Memory Care?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-lavender/20 bg-gradient-to-br from-white to-lavender/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lavender/20">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Specialized Training
              </h3>
              <p className="text-gray-600">
                Staff trained in dementia care, behavioral management, and communication techniques specific to memory loss conditions.
              </p>
            </Card>

            <Card className="border-sky-blue/20 bg-gradient-to-br from-white to-sky-blue/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-blue/20">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Secure Environment
              </h3>
              <p className="text-gray-600">
                Secured units with wandering prevention, monitored exits, and safe outdoor spaces designed for residents with cognitive impairment.
              </p>
            </Card>

            <Card className="border-sunset-orange/20 bg-gradient-to-br from-white to-sunset-orange/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sunset-orange/20">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Therapeutic Programs
              </h3>
              <p className="text-gray-600">
                Memory-enhancing activities, music therapy, reminiscence programs, and structured routines that support cognitive function.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-neutral-warm/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            How SunsetWell Works
          </h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-lavender text-xl font-bold text-white">
                1
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Tell Us Your Needs
                </h3>
                <p className="text-gray-600">
                  Answer a few questions about your loved one&apos;s condition, location preferences, and insurance coverage. Takes less than 2 minutes.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sky-blue text-xl font-bold text-white">
                2
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Get Matched Results
                </h3>
                <p className="text-gray-600">
                  Instantly see memory care facilities that match your criteria. Compare Medicare ratings, services, availability, and family reviews.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sunset-orange text-xl font-bold text-white">
                3
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Connect Directly
                </h3>
                <p className="text-gray-600">
                  Call facilities directly or request information. No middlemen, no lead forms. Your search stays private and free.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <TrackedCTAButton
              href="/navigator?condition=memory_care"
              landingPage="memory-care"
              ctaPosition="mid-page"
              className="bg-lavender hover:bg-lavender/90"
            >
              Start Your Search Now →
            </TrackedCTAButton>
          </div>
        </div>
      </section>

      {/* What to Look For */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            What to Look for in Memory Care
          </h2>
          <div className="space-y-4">
            <Card className="border-l-4 border-l-lavender bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">✓ Staff-to-Resident Ratio</h3>
              <p className="text-sm text-gray-600">
                Look for at least 1 staff member per 5-6 residents during day shifts, higher at night.
              </p>
            </Card>

            <Card className="border-l-4 border-l-sky-blue bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">✓ Dementia-Specific Training</h3>
              <p className="text-sm text-gray-600">
                Ask about certification requirements and ongoing education for staff working with memory care residents.
              </p>
            </Card>

            <Card className="border-l-4 border-l-sunset-orange bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">✓ Safety & Security Features</h3>
              <p className="text-sm text-gray-600">
                Secure entrances/exits, monitoring systems, safe wandering paths, and emergency response protocols.
              </p>
            </Card>

            <Card className="border-l-4 border-l-sunset-gold bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">✓ Personalized Care Plans</h3>
              <p className="text-sm text-gray-600">
                Individualized care based on stage of dementia, personal history, and family input.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-neutral-warm/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Common Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Does Medicare cover memory care?
              </h3>
              <p className="text-gray-600">
                Medicare typically covers skilled nursing care in memory care units when medically necessary, but not custodial care. Medicare Part A may cover short-term stays. Medicaid often covers long-term memory care for those who qualify. Our search shows which facilities accept Medicare and Medicaid.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                When is the right time for memory care?
              </h3>
              <p className="text-gray-600">
                Consider memory care when safety becomes a concern (wandering, getting lost), daily care needs exceed what family can provide, or behavioral symptoms require specialized management. Many families transition from assisted living when cognitive decline progresses.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                How much does memory care cost?
              </h3>
              <p className="text-gray-600">
                Memory care typically costs $4,000-$8,000 per month, varying by location and level of care. This is usually higher than standard assisted living due to specialized staffing and security. We show facilities that accept VA benefits, Medicaid, and private pay.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Can I visit before choosing?
              </h3>
              <p className="text-gray-600">
                Absolutely. We encourage touring multiple facilities, meeting staff, observing activities, and asking questions. Most facilities offer tours during mealtimes or activity periods so you can see daily life. Call directly from our results to schedule visits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-lavender/20 via-sky-blue/10 to-sunset-orange/10 p-8 text-center shadow-lg sm:p-12">
          <h2 className="mb-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Find Memory Care Facilities Today
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Free search. No lead forms. Direct contact with Medicare-certified facilities.
          </p>
          <TrackedCTAButton
            href="/navigator?condition=memory_care"
            landingPage="memory-care"
            ctaPosition="footer"
            className="bg-lavender hover:bg-lavender/90"
          >
            Start Your Free Search →
          </TrackedCTAButton>
          <p className="mt-4 text-sm text-gray-500">
            Search 12,000+ specialized memory care facilities nationwide
          </p>
        </div>
      </section>
    </div>
  );
}
