import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getFacilityById } from "@/lib/facilities/queries";
import { generateLocationSlug } from "@/lib/locations/queries";
import { getSunsetWellScoreBadge, getSunsetWellScoreColor, getStarRating } from "@/lib/utils/score-helpers";
import { ensureAbsoluteUrl, formatPhoneNumber } from "@/lib/utils/url";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

interface FacilityPageProps {
  params: { id: string };
}

function buildDescription(
  name: string,
  city: string | null,
  state: string | null,
  score: number | null,
  overallRating: number | null,
  totalBeds: number | null
): string {
  const location = [city, state].filter(Boolean).join(", ");
  const parts: string[] = [];
  if (location) {
    parts.push(`${name} in ${location}`);
  } else {
    parts.push(name);
  }

  if (score !== null) {
    parts.push(`SunsetWell Score ${score.toFixed(0)}`);
  }

  if (overallRating) {
    parts.push(`CMS rating ${overallRating}/5`);
  }

  if (totalBeds) {
    parts.push(`${totalBeds} beds`);
  }

  parts.push("Compare inspections, staffing, and contact details.");

  return parts.join(" · ");
}

export async function generateMetadata({ params }: FacilityPageProps): Promise<Metadata> {
  const facility = await getFacilityById(params.id);

  if (!facility) {
    return {
      title: "Facility Not Found | SunsetWell",
      description: "We couldn't find this senior care facility in our database.",
    };
  }

  return {
    title: `${facility.title} | SunsetWell Senior Care Profile`,
    description: buildDescription(
      facility.title,
      facility.city,
      facility.state,
      facility.sunsetwellScore,
      facility.overallRating,
      facility.totalBeds
    ),
    openGraph: {
      title: `${facility.title} | SunsetWell Senior Care Profile`,
      description: buildDescription(
        facility.title,
        facility.city,
        facility.state,
        facility.sunsetwellScore,
        facility.overallRating,
        facility.totalBeds
      ),
    },
  };
}

export default async function FacilityPage({ params }: FacilityPageProps) {
  const facility = await getFacilityById(params.id);
  if (!facility) {
    notFound();
  }

  const websiteUrl = ensureAbsoluteUrl(facility.website);
  const phoneDisplay = formatPhoneNumber(facility.phone);
  const addressLine = [facility.address, facility.city, facility.state, facility.zipCode]
    .filter(Boolean)
    .join(", ");

  const insuranceCoverages = [
    facility.acceptsMedicare ? "Medicare" : null,
    facility.acceptsMedicaid ? "Medicaid" : null,
    facility.acceptsPrivatePay ? "Private Pay" : null,
  ].filter(Boolean) as string[];

  const scoreValue = facility.sunsetwellScore;
  const percentileValue = facility.sunsetwellPercentile;

  const locationSlug = facility.city && facility.state
    ? generateLocationSlug(facility.city, facility.state)
    : null;

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "NursingHome",
    name: facility.title,
    url: `https://sunsetwell.com/facility/${facility.id}`,
    address: facility.address
      ? {
          "@type": "PostalAddress",
          streetAddress: facility.address,
          addressLocality: facility.city,
          addressRegion: facility.state,
          postalCode: facility.zipCode,
          addressCountry: "US",
        }
      : undefined,
    telephone: facility.phone ?? undefined,
    areaServed: facility.state ?? undefined,
    aggregateRating:
      facility.overallRating != null
        ? {
            "@type": "AggregateRating",
            ratingValue: facility.overallRating,
            bestRating: "5",
            worstRating: "1",
            reviewCount: 1,
          }
        : undefined,
    medicalSpecialty: ["SkilledNursing"],
    bed: facility.totalBeds ?? undefined,
    sameAs: websiteUrl ?? undefined,
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-2.jpg"
          alt="Senior care facility hero"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-sunset-orange/20 via-sky-blue/25 to-lavender/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/15 to-black/40" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 md:px-6 md:py-16">
        <nav className="text-xs md:text-sm text-gray-200/80">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          {" / "}
          <Link href="/locations" className="hover:text-white">
            Locations
          </Link>
          {locationSlug ? (
            <>
              {" / "}
              <Link
                href={`/locations/${locationSlug}`}
                className="hover:text-white"
              >
                {facility.city}, {facility.state}
              </Link>
            </>
          ) : null}
          {" / "}
          <span className="text-white/90">{facility.title}</span>
        </nav>

        <header className="rounded-3xl border border-white/20 bg-white/90 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <span className="inline-flex items-center justify-center rounded-full bg-sunset-orange/10 px-3 py-1 text-xs font-semibold tracking-wide text-sunset-orange uppercase">
                SunsetWell Facility Profile
              </span>
              <h1 className="mt-3 font-serif text-3xl font-bold text-gray-900 md:text-4xl">
                {facility.title}
              </h1>
              {addressLine && (
                <p className="mt-2 text-sm text-gray-600">{addressLine}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                {facility.providerType && (
                  <span className="rounded-full border border-slate-200 bg-slate-100/60 px-3 py-1 capitalize">
                    {facility.providerType.replace(/_/g, " ")}
                  </span>
                )}
                {facility.county && (
                  <span className="rounded-full border border-slate-200 bg-slate-100/60 px-3 py-1">
                    {facility.county} County
                  </span>
                )}
                {facility.totalBeds != null && (
                  <span className="rounded-full border border-slate-200 bg-slate-100/60 px-3 py-1">
                    {facility.totalBeds} beds
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center md:min-w-[220px]">
              <p className="text-xs uppercase tracking-wide text-slate-500">SunsetWell Score®</p>
              {scoreValue !== null ? (
                <>
                  <div className={`inline-flex items-baseline gap-2 px-4 py-2 rounded-lg font-bold text-2xl ${
                    scoreValue >= 90
                      ? "bg-green-700 text-white"
                      : scoreValue >= 75
                      ? "bg-green-500 text-white"
                      : scoreValue >= 60
                      ? "bg-yellow-400 text-gray-900"
                      : scoreValue >= 40
                      ? "bg-orange-500 text-white"
                      : "bg-red-500 text-white"
                  }`}>
                    <span>{scoreValue.toFixed(0)}</span>
                    {percentileValue !== null && (
                      <span className="text-base opacity-90">({percentileValue}%)</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    {scoreValue >= 90 ? "Exceptional" : scoreValue >= 75 ? "Excellent" : scoreValue >= 60 ? "Good" : scoreValue >= 40 ? "Average" : "Below Average"}
                  </p>
                </>
              ) : (
                <span className="text-gray-400">Score not available</span>
              )}
              <p className="text-xs text-slate-500">
                {facility.scoreUpdatedAt
                  ? `Updated ${new Date(facility.scoreUpdatedAt).toLocaleDateString()}`
                  : "Score based on CMS data"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-sunset-orange px-4 py-2 font-semibold text-white transition hover:bg-sunset-orange/90"
              >
                Visit Facility Website →
              </a>
            )}
            {phoneDisplay && (
              <a
                href={`tel:${facility.phone}`}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:border-sunset-orange hover:text-sunset-orange"
              >
                Call {phoneDisplay}
              </a>
            )}
            <Link
              href={`/navigator?facilityId=${facility.id}`}
              className="inline-flex items-center justify-center rounded-full border border-sky-blue/40 bg-sky-blue/10 px-4 py-2 font-semibold text-sky-blue transition hover:bg-sky-blue/20"
            >
              Check Availability →
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">CMS Quality Snapshot</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt className="font-medium">Overall rating</dt>
                <dd>{getStarRating(facility.overallRating ?? undefined)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium">Health inspections</dt>
                <dd>{getStarRating(facility.healthInspectionRating ?? undefined)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium">Staffing levels</dt>
                <dd>{getStarRating(facility.staffingRating ?? undefined)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium">Quality measures</dt>
                <dd>{getStarRating(facility.qualityMeasureRating ?? undefined)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium">Nurse hours / resident</dt>
                <dd>
                  {facility.nurseHoursPerResidentPerDay != null
                    ? `${facility.nurseHoursPerResidentPerDay.toFixed(1)} hrs`
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium">RN hours / resident</dt>
                <dd>
                  {facility.rnHoursPerResidentPerDay != null
                    ? `${facility.rnHoursPerResidentPerDay.toFixed(1)} hrs`
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Contact & Services</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div>
                <dt className="font-medium text-slate-700">Address</dt>
                <dd className="mt-1 text-slate-600">{addressLine || "Address not listed"}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700">Phone</dt>
                <dd className="mt-1 text-slate-600">{phoneDisplay || "Not provided"}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700">Website</dt>
                <dd className="mt-1">
                  {websiteUrl ? (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sunset-orange hover:underline"
                    >
                      {websiteUrl.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <span className="text-slate-600">Not listed</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700">Accepted coverage</dt>
                <dd className="mt-1 text-slate-600">
                  {insuranceCoverages.length > 0 ? insuranceCoverages.join(", ") : "Verify with facility"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700">Ownership</dt>
                <dd className="mt-1 text-slate-600">
                  {facility.ownershipType ? facility.ownershipType : "Not provided"}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Inspection Highlights</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Complaints</p>
              <p className="mt-2 text-lg font-bold text-emerald-800">
                {facility.substantiatedComplaints != null ? facility.substantiatedComplaints : "—"}
              </p>
              <p className="text-xs text-emerald-700/80">Substantiated complaints (12 months)</p>
            </div>
            <div className="rounded-xl border border-sky-blue/30 bg-sky-blue/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-blue">Incidents</p>
              <p className="mt-2 text-lg font-bold text-sky-blue">
                {facility.facilityReportedIncidents != null ? facility.facilityReportedIncidents : "—"}
              </p>
              <p className="text-xs text-sky-blue/80">Facility reported incidents (12 months)</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Fines</p>
              <p className="mt-2 text-lg font-bold text-amber-800">
                {facility.fines != null ? facility.fines : "—"}
              </p>
              <p className="text-xs text-amber-700/80">Federal fines (12 months)</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Always confirm current inspection status with your state regulatory agency. SunsetWell compiles public CMS and state
            data but encourages families to tour facilities and speak directly with administrators.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Next Steps</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Contact the facility to verify current availability, pricing, and admission criteria.</li>
            <li>Schedule an in-person or virtual tour and request the latest state inspection report.</li>
            <li>Compare this facility against others in your area using the SunsetWell navigator.</li>
          </ul>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link
              href="/navigator"
              className="inline-flex items-center justify-center rounded-full bg-sky-blue px-4 py-2 font-semibold text-white transition hover:bg-sky-blue/90"
            >
              Find Similar Facilities
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:border-sunset-orange hover:text-sunset-orange"
            >
              Review Your Shortlist →
            </Link>
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
    </main>
  );
}
