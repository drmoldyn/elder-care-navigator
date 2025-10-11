"use client";

import { useComparison } from "@/contexts/comparison-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Disable static generation for this page since it uses context
export const dynamic = 'force-dynamic';

export default function ComparePage() {
  const { selectedFacilities, removeFacility, clearAll } = useComparison();
  const router = useRouter();

  if (selectedFacilities.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Background Hero Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/hero-6.jpg"
            alt="Senior care background"
            fill
            className="object-cover"
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-sunset-orange/20 via-sky-blue/30 to-lavender/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50" />

          {/* Decorative transparent columns on left and right */}
          <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-lavender/40 via-lavender/25 to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-sky-blue/40 via-sky-blue/25 to-transparent" />
        </div>
        <div className="text-center relative z-10">
          <h1 className="mb-4 font-serif text-4xl font-bold text-gray-900">
            Compare Senior Care Facilities
          </h1>
          <p className="mb-6 text-lg text-gray-600">
            No facilities selected. Select 2-4 facilities from the results page to compare them side by side.
          </p>
          <Button onClick={() => router.back()} className="bg-sunset-orange hover:bg-sunset-orange/90">
            Go Back to Results
          </Button>
        </div>
      </div>
    );
  }

  const getBestValue = (key: keyof typeof selectedFacilities[0], direction: "low" | "high") => {
    const values = selectedFacilities.map((f) => f[key]);
    if (direction === "low") {
      return Math.min(...values.filter((v) => typeof v === "number") as number[]);
    }
    return Math.max(...values.filter((v) => typeof v === "number") as number[]);
  };

  const bestDistance = selectedFacilities.some((f) => f.distance !== undefined)
    ? getBestValue("distance", "low")
    : null;
  const bestRating = selectedFacilities.some((f) => f.overall_rating !== undefined)
    ? getBestValue("overall_rating", "high")
    : null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Hero Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-6.jpg"
          alt="Senior care background"
          fill
          className="object-cover"
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-sunset-orange/20 via-sky-blue/30 to-lavender/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50" />

        {/* Decorative transparent columns on left and right */}
        <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-lavender/40 via-lavender/25 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-sky-blue/40 via-sky-blue/25 to-transparent" />
      </div>
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm px-4 py-6 shadow-sm relative z-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold md:text-4xl text-gray-900">
                Compare Senior Care Facilities
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Side-by-side comparison of {selectedFacilities.length} facilities
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table - Desktop */}
      <div className="hidden md:block px-6 py-8 relative z-10">
        <div className="mx-auto max-w-7xl overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left font-semibold">
                  Feature
                </th>
                {selectedFacilities.map((facility) => (
                  <th key={facility.id} className="border-l px-4 py-3">
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-serif text-lg font-semibold">
                        {facility.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFacility(facility.id)}
                        className="text-xs text-gray-500 hover:text-red-600"
                      >
                        Remove
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Distance */}
              <ComparisonRow label="Distance">
                {selectedFacilities.map((facility) => (
                  <td key={facility.id} className="border-l border-t px-4 py-3 text-center">
                    {facility.distance !== undefined ? (
                      <span
                        className={
                          facility.distance === bestDistance
                            ? "font-semibold text-green-600"
                            : ""
                        }
                      >
                        {facility.distance.toFixed(1)} miles
                        {facility.distance === bestDistance && " ⭐"}
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                ))}
              </ComparisonRow>

              {/* Rating */}
              <ComparisonRow label="Overall Rating">
                {selectedFacilities.map((facility) => (
                  <td key={facility.id} className="border-l border-t px-4 py-3 text-center">
                    {facility.overall_rating ? (
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={
                            facility.overall_rating === bestRating
                              ? "font-semibold text-green-600"
                              : ""
                          }
                        >
                          {"⭐".repeat(Math.round(facility.overall_rating))}
                          {facility.overall_rating === bestRating && " 🏆"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {facility.overall_rating}/5
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not rated</span>
                    )}
                  </td>
                ))}
              </ComparisonRow>

              {/* Beds Available */}
              <ComparisonRow label="Beds Available">
                {selectedFacilities.map((facility) => (
                  <td key={facility.id} className="border-l border-t px-4 py-3 text-center">
                    {facility.available_beds !== undefined &&
                    facility.available_beds > 0 ? (
                      <span className="font-semibold text-green-600">
                        ✓ {facility.available_beds} bed
                        {facility.available_beds !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-red-600">Waitlist</span>
                    )}
                  </td>
                ))}
              </ComparisonRow>

              {/* Cost */}
              <ComparisonRow label="Monthly Cost">
                {selectedFacilities.map((facility) => (
                  <td key={facility.id} className="border-l border-t px-4 py-3 text-center">
                    {facility.cost || <span className="text-gray-400">Contact</span>}
                  </td>
                ))}
              </ComparisonRow>

              {/* Address */}
              <ComparisonRow label="Address">
                {selectedFacilities.map((facility) => (
                  <td key={facility.id} className="border-l border-t px-4 py-3 text-center text-sm">
                    {facility.address ? (
                      <div>
                        <div>{facility.address}</div>
                        <div className="text-gray-600">
                          {facility.city}, {facility.state} {facility.zip}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                ))}
              </ComparisonRow>

              {/* Insurance */}
              <ComparisonRow label="Insurance Accepted">
                {selectedFacilities.map((facility) => (
                  <td key={facility.id} className="border-l border-t px-4 py-3">
                    <div className="flex flex-wrap justify-center gap-1">
                      {facility.insurance_accepted &&
                      facility.insurance_accepted.length > 0 ? (
                        facility.insurance_accepted.map((ins) => (
                          <Badge key={ins} variant="secondary" className="text-xs">
                            {ins}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">Contact facility</span>
                      )}
                    </div>
                  </td>
                ))}
              </ComparisonRow>

              {/* Categories */}
              <ComparisonRow label="Services">
                {selectedFacilities.map((facility) => (
                  <td key={facility.id} className="border-l border-t px-4 py-3">
                    <div className="flex flex-wrap justify-center gap-1">
                      {facility.category.slice(0, 3).map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </td>
                ))}
              </ComparisonRow>

              {/* Phone */}
              <ComparisonRow label="Contact">
                {selectedFacilities.map((facility) => (
                  <td key={facility.id} className="border-l border-t px-4 py-3 text-center">
                    {facility.contact_phone ? (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${facility.contact_phone}`}>
                          📞 {facility.contact_phone}
                        </a>
                      </Button>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                ))}
              </ComparisonRow>

              {/* Actions */}
              <ComparisonRow label="Actions">
                {selectedFacilities.map((facility) => (
                  <td key={facility.id} className="border-l border-t px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <Button size="sm" asChild>
                        <a
                          href={facility.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Details
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${facility.address}, ${facility.city}, ${facility.state} ${facility.zip}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Directions
                        </a>
                      </Button>
                    </div>
                  </td>
                ))}
              </ComparisonRow>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View - Accordion-Style Cards */}
      <div className="md:hidden px-4 py-6 space-y-4 pb-24 relative z-10">
        {selectedFacilities.map((facility) => (
          <div key={facility.id} className="bg-white rounded-xl shadow-md border border-gray-200">
            {/* Facility Header */}
            <div className="border-b border-gray-200 p-4 bg-gray-50 rounded-t-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-gray-900">
                    {facility.title}
                  </h3>
                  {facility.distance !== undefined && (
                    <span className="text-sm text-gray-600 mt-1 block">
                      {facility.distance.toFixed(1)} miles away
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFacility(facility.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
            </div>

            {/* Comparison Fields - Vertical Layout */}
            <div className="p-4 space-y-3">
              {/* Distance */}
              <div className="py-2 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Distance
                </div>
                <div className="text-base mt-1">
                  {facility.distance !== undefined ? (
                    <span
                      className={
                        facility.distance === bestDistance
                          ? "font-semibold text-green-600"
                          : ""
                      }
                    >
                      {facility.distance.toFixed(1)} miles
                      {facility.distance === bestDistance && " ⭐"}
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </div>
              </div>

              {/* Overall Rating */}
              <div className="py-2 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Overall Rating
                </div>
                <div className="text-base mt-1">
                  {facility.overall_rating ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          facility.overall_rating === bestRating
                            ? "font-semibold text-green-600"
                            : ""
                        }
                      >
                        {"⭐".repeat(Math.round(facility.overall_rating))}
                        {facility.overall_rating === bestRating && " 🏆"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {facility.overall_rating}/5
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not rated</span>
                  )}
                </div>
              </div>

              {/* Beds Available */}
              <div className="py-2 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Beds Available
                </div>
                <div className="text-base mt-1">
                  {facility.available_beds !== undefined &&
                  facility.available_beds > 0 ? (
                    <span className="font-semibold text-green-600">
                      ✓ {facility.available_beds} bed
                      {facility.available_beds !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-red-600">Waitlist</span>
                  )}
                </div>
              </div>

              {/* Monthly Cost */}
              <div className="py-2 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Monthly Cost
                </div>
                <div className="text-base mt-1">
                  {facility.cost || <span className="text-gray-400">Contact facility</span>}
                </div>
              </div>

              {/* Address */}
              <div className="py-2 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Address
                </div>
                <div className="text-base mt-1">
                  {facility.address ? (
                    <div>
                      <div>{facility.address}</div>
                      <div className="text-gray-600">
                        {facility.city}, {facility.state} {facility.zip}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </div>
              </div>

              {/* Insurance Accepted */}
              <div className="py-2 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Insurance Accepted
                </div>
                <div className="text-base mt-1">
                  <div className="flex flex-wrap gap-1">
                    {facility.insurance_accepted &&
                    facility.insurance_accepted.length > 0 ? (
                      facility.insurance_accepted.map((ins) => (
                        <Badge key={ins} variant="secondary" className="text-xs">
                          {ins}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">Contact facility</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="py-2 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Services
                </div>
                <div className="text-base mt-1">
                  <div className="flex flex-wrap gap-1">
                    {facility.category.slice(0, 3).map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {cat.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="py-2 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Contact
                </div>
                <div className="text-base mt-1">
                  {facility.contact_phone ? (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`tel:${facility.contact_phone}`}>
                        📞 {facility.contact_phone}
                      </a>
                    </Button>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="py-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Actions
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" asChild className="w-full">
                    <a
                      href={facility.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Details
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild className="w-full">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${facility.address}, ${facility.city}, ${facility.state} ${facility.zip}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get Directions
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky CTA Bar - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 p-4 shadow-lg z-50">
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-sunset-orange to-sunset-gold hover:from-sunset-gold hover:to-sunset-orange text-white font-semibold py-3 rounded-xl shadow-md transition-all"
        >
          Request Info for All ({selectedFacilities.length})
        </Button>
      </div>
    </div>
  );
}

// Helper component for table rows
function ComparisonRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td className="sticky left-0 z-10 border-t bg-gray-50 px-4 py-3 font-medium">
        {label}
      </td>
      {children}
    </tr>
  );
}
