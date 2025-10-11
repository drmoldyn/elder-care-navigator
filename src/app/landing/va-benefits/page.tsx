/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrackedCTAButton } from "@/components/landing/tracked-cta-button";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "VA-Approved Senior Care Facilities | Veterans Benefits Accepted",
  description: "Find nursing homes and assisted living facilities that accept VA benefits. Search VA-contracted facilities, Aid & Attendance program eligibility, and veteran-specific services.",
  keywords: [
    "VA benefits senior care",
    "VA nursing homes",
    "veterans assisted living",
    "Aid and Attendance program",
    "VA-approved facilities",
    "veterans benefits eldercare"
  ],
  openGraph: {
    title: "VA-Approved Senior Care | Veterans Benefits Accepted",
    description: "Search facilities that accept VA benefits including Aid & Attendance. Honor your service with quality care.",
    type: "website",
  },
};

export default function VABenefitsLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-blue/20 via-white to-neutral-warm/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/hero-2.jpg"
            alt="Veteran receiving quality senior care"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-sky-blue/90 via-sunset-gold/80 to-lavender/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-sky-blue/20 text-sky-blue-dark border-sky-blue/30">
            Honoring Your Service
          </Badge>
          <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Senior Care Facilities That Accept VA Benefits
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90 sm:text-xl">
            Find nursing homes, assisted living, and memory care facilities that accept VA benefits including Aid & Attendance. Search by location, service type, and benefit eligibility.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <TrackedCTAButton
              href="/navigator?insurance=VA"
              landingPage="va-benefits"
              ctaPosition="hero"
              className="w-full sm:w-auto bg-sky-blue hover:bg-sky-blue/90"
            >
              Search VA-Approved Facilities →
            </TrackedCTAButton>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="#benefits-guide">
                Learn About VA Benefits
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
              <p className="font-serif text-3xl font-bold text-sky-blue">8,500+</p>
              <p className="mt-1 text-sm text-gray-600">VA-Participating Facilities</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-sunset-gold">$2,431</p>
              <p className="mt-1 text-sm text-gray-600">Max Monthly Aid & Attendance</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-lavender">Free</p>
              <p className="mt-1 text-sm text-gray-600">No Cost to Veterans</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-sunset-orange">24/7</p>
              <p className="mt-1 text-sm text-gray-600">Search Anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* VA Benefits Guide */}
      <section id="benefits-guide" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Understanding VA Senior Care Benefits
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-sky-blue/20 bg-gradient-to-br from-white to-sky-blue/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-blue/20">
                <span className="text-2xl">🏥</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                VA Nursing Home Care
              </h3>
              <p className="mb-4 text-gray-600">
                VA operates nursing homes and contracts with community facilities. Priority given to veterans with service-connected disabilities.
              </p>
              <p className="text-sm font-medium text-sky-blue">
                Eligibility: Service-connected disability, VA pension, or meets income limits
              </p>
            </Card>

            <Card className="border-sunset-gold/20 bg-gradient-to-br from-white to-sunset-gold/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sunset-gold/20">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Aid & Attendance
              </h3>
              <p className="mb-4 text-gray-600">
                Monthly benefit up to $2,431 for veterans who need assistance with daily activities. Can be used for assisted living or in-home care.
              </p>
              <p className="text-sm font-medium text-sunset-gold">
                Eligibility: Wartime veteran with medical need for assistance
              </p>
            </Card>

            <Card className="border-lavender/20 bg-gradient-to-br from-white to-lavender/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lavender/20">
                <span className="text-2xl">🏡</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Housebound Benefit
              </h3>
              <p className="mb-4 text-gray-600">
                Additional monthly benefit for veterans confined to their home. Can supplement assisted living costs or in-home care.
              </p>
              <p className="text-sm font-medium text-lavender">
                Eligibility: Substantially confined to home due to disability
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-neutral-warm/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Find VA-Approved Care in 3 Steps
          </h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sky-blue text-xl font-bold text-white">
                1
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Enter Your Location & Needs
                </h3>
                <p className="text-gray-600">
                  Tell us where you're looking, what type of care you need, and select "VA Benefits" as your insurance. We'll filter for facilities that participate in VA programs.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sunset-gold text-xl font-bold text-white">
                2
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Compare VA-Participating Facilities
                </h3>
                <p className="text-gray-600">
                  See Medicare ratings, services offered, and which specific VA benefits each facility accepts. View availability and veteran-specific programs.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-lavender text-xl font-bold text-white">
                3
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Contact Facilities Directly
                </h3>
                <p className="text-gray-600">
                  Call to ask about VA benefit specifics, veteran discounts, and admission process. Bring your DD-214 and benefit verification when touring.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <TrackedCTAButton
              href="/navigator?insurance=VA"
              landingPage="va-benefits"
              ctaPosition="mid-page"
              className="bg-sky-blue hover:bg-sky-blue/90"
            >
              Start Your Search →
            </TrackedCTAButton>
          </div>
        </div>
      </section>

      {/* Eligibility Checker */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Am I Eligible for VA Senior Care Benefits?
          </h2>
          <div className="space-y-4">
            <Card className="border-l-4 border-l-sky-blue bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">✓ Service Requirements</h3>
              <p className="text-sm text-gray-600">
                Active duty service during wartime period (even one day during war). Discharge other than dishonorable.
              </p>
            </Card>

            <Card className="border-l-4 border-l-sunset-gold bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">✓ Age or Disability</h3>
              <p className="text-sm text-gray-600">
                Age 65+ OR service-connected disability OR receiving VA pension benefits.
              </p>
            </Card>

            <Card className="border-l-4 border-l-lavender bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">✓ Medical Need (Aid & Attendance)</h3>
              <p className="text-sm text-gray-600">
                Need help with 2+ activities of daily living (bathing, dressing, eating, etc.) or have cognitive impairment requiring supervision.
              </p>
            </Card>

            <Card className="border-l-4 border-l-sunset-orange bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-900">✓ Income Limits (Aid & Attendance)</h3>
              <p className="text-sm text-gray-600">
                Net worth under $155,356 (2024). Medical expenses count toward eligibility. Married couples have higher limits.
              </p>
            </Card>
          </div>

          <div className="mt-8 rounded-lg border border-sky-blue/30 bg-sky-blue/10 p-6">
            <p className="font-semibold text-gray-900">💡 Not sure if you qualify?</p>
            <p className="mt-2 text-sm text-gray-600">
              Contact your local VA office or a VA-accredited attorney. Many facilities can also help verify your eligibility during the tour process.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-neutral-warm/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Common Questions About VA Benefits
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                How much does Aid & Attendance pay?
              </h3>
              <p className="text-gray-600">
                2024 maximum rates: $2,431/month for a veteran, $2,568/month for a surviving spouse, $2,878/month for a veteran with dependent spouse. Actual amount depends on your income and medical expenses.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Can I use VA benefits at any facility?
              </h3>
              <p className="text-gray-600">
                Aid & Attendance can be used at most assisted living facilities that meet VA care standards. VA nursing home benefit requires the facility to have a VA contract. Our search filters for facilities that accept your specific benefit type.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                How long does it take to get approved?
              </h3>
              <p className="text-gray-600">
                Aid & Attendance applications typically take 3-6 months. Some facilities will hold a room or accept pending applications. VA nursing home admissions can be faster if you have service-connected disabilities.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                What documents do I need?
              </h3>
              <p className="text-gray-600">
                DD-214 (discharge papers), marriage certificate (if applicable), medical evidence of need for assistance, financial records showing income and assets. Facilities and VA can help gather these during the application process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Helpful VA Resources
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-2 font-semibold text-gray-900">VA Benefits Hotline</h3>
              <p className="mb-3 text-sm text-gray-600">General questions about eligibility and benefits</p>
              <p className="font-mono text-sky-blue">1-800-827-1000</p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold text-gray-900">Health Benefits Hotline</h3>
              <p className="mb-3 text-sm text-gray-600">VA healthcare and nursing home questions</p>
              <p className="font-mono text-sky-blue">1-877-222-8387</p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold text-gray-900">Find Your Local VA</h3>
              <p className="mb-3 text-sm text-gray-600">Speak with a benefits counselor in person</p>
              <a href="https://www.va.gov/find-locations" target="_blank" rel="noopener noreferrer" className="text-sm text-sky-blue hover:underline">
                va.gov/find-locations →
              </a>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold text-gray-900">VA Aid & Attendance</h3>
              <p className="mb-3 text-sm text-gray-600">Official information and application forms</p>
              <a href="https://www.va.gov/pension/aid-attendance-housebound" target="_blank" rel="noopener noreferrer" className="text-sm text-sky-blue hover:underline">
                Learn More →
              </a>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-sky-blue/20 via-sunset-gold/10 to-lavender/10 p-8 text-center shadow-lg sm:p-12">
          <h2 className="mb-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Honor Your Service with Quality Care
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Search facilities that accept VA benefits. Free, private, and direct contact with providers.
          </p>
          <TrackedCTAButton
            href="/navigator?insurance=VA"
            landingPage="va-benefits"
            ctaPosition="footer"
            className="bg-sky-blue hover:bg-sky-blue/90"
          >
            Find VA-Approved Facilities →
          </TrackedCTAButton>
          <p className="mt-4 text-sm text-gray-500">
            8,500+ facilities accepting VA benefits nationwide
          </p>
        </div>
      </section>
    </div>
  );
}
