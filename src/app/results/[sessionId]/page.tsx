"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileTabs } from "@/components/results/mobile-tabs";
import { MobileFilterModal } from "@/components/results/mobile-filter-modal";
import { RequestInfoModal } from "@/components/request-info-modal";
import { ComparisonProvider, useComparison } from "@/contexts/comparison-context";
import { ComparisonBar } from "@/components/comparison/comparison-bar";
import type { GuidancePollResponse } from "@/types/api";

type MobileTab = "list" | "map" | "filters";

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string[];
  conditions: string[];
  cost: string;
  contact_phone?: string;
  contact_email?: string;
  location_type: string;
  states?: string[];
  source_authority: string;
  best_for?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  insurance_accepted?: string[];
  available_beds?: number;
  overall_rating?: number;
  distance?: number; // Distance in miles from user's location
}

function ResultsPageContent() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { addFacility, removeFacility, isSelected, selectedFacilities, maxSelection } = useComparison();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<GuidancePollResponse | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [mobileTab, setMobileTab] = useState<MobileTab>("list");
  const [filterCount] = useState(0); // Will be dynamic when filters are implemented
  const [requestInfoModal, setRequestInfoModal] = useState<{
    isOpen: boolean;
    facilityName: string;
    facilityId: string;
  }>({ isOpen: false, facilityName: "", facilityId: "" });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const loadData = async () => {
    try {
      // Fetch session and matched resources
      const sessionRes = await fetch(`/api/sessions/${sessionId}`);
      if (!sessionRes.ok) throw new Error("Failed to load session");

      const sessionData = await sessionRes.json();
      const resourceData = sessionData.resources || [];

      // Sort by distance if available, otherwise keep original order
      const sortedResources = resourceData.sort((a: Resource, b: Resource) => {
        // If both have distances, sort by distance (closest first)
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        // If only one has distance, prioritize it
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        // Otherwise maintain original order
        return 0;
      });

      setResources(sortedResources);

      // Also poll guidance
      pollGuidance();
    } catch {
      setError("Failed to load your personalized plan");
      setLoading(false);
    }
  };

  const pollGuidance = async () => {
    try {
      const response = await fetch(`/api/guidance/${sessionId}`);
      if (!response.ok) throw new Error("Failed to load guidance");

      const data: GuidancePollResponse = await response.json();
      setGuidance(data);
      setLoading(false);

      // Keep polling if still pending
      if (data.status === "pending") {
        setTimeout(pollGuidance, 2000);
      }
    } catch {
      // Don't set error here, just stop polling
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <h2 className="text-2xl font-bold">Finding Your Resources...</h2>
          <p className="mt-2 text-muted-foreground">
            We&apos;re matching you with the best support options
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16">
        <Card className="w-full max-w-2xl border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Something Went Wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.href = "/navigator"} className="mt-4">
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-white px-4 md:px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-xl md:text-2xl font-bold">
            Care Facilities Near You
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {resources.length.toLocaleString()} facilities found
            {resources.some(r => r.distance !== undefined) && (
              <span className="ml-2 text-indigo-600 font-medium">• Sorted by distance</span>
            )}
          </p>
        </div>
      </div>

      {/* Mobile Tabs (only on mobile) */}
      <MobileTabs
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        filterCount={filterCount}
      />

      {/* Mobile Filter Modal */}
      <MobileFilterModal
        isOpen={mobileTab === "filters"}
        onClose={() => setMobileTab("list")}
        resultCount={resources.length}
      />

      {/* Main Content: 3-column layout on desktop, tab-based on mobile */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Filters (desktop only) */}
        <aside className="hidden lg:block w-80 overflow-y-auto border-r bg-gray-50 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 font-semibold">Insurance Accepted</h3>
              <div className="space-y-2">
                {["Medicare", "Medicaid", "Private Insurance", "VA Benefits"].map((insurance) => (
                  <label key={insurance} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span>{insurance}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Star Rating</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <label key={stars} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span>{"⭐".repeat(stars)} & up</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Availability</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span>Beds available now</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Distance</h3>
              <input
                type="range"
                min="5"
                max="100"
                defaultValue="50"
                className="w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-600">
                <span>5 miles</span>
                <span>100 miles</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Middle: Facility List (show on desktop or when list tab active on mobile) */}
        <div className={`flex-1 overflow-y-auto bg-white ${mobileTab !== "list" ? "hidden lg:block" : ""}`}>
          <div className="divide-y">
            {resources.length === 0 && !loading && (
              <div className="p-8 text-center">
                <p className="text-gray-600">
                  No facilities found. Try adjusting your filters.
                </p>
                <Button onClick={() => window.location.href = "/navigator"} className="mt-4">
                  Start New Search
                </Button>
              </div>
            )}

            {resources.map((resource) => (
              <div key={resource.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Comparison Checkbox */}
                  <div className="flex items-start pt-1">
                    <input
                      type="checkbox"
                      checked={isSelected(resource.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedFacilities.length >= maxSelection) {
                            alert(`You can only compare up to ${maxSelection} facilities at once`);
                            return;
                          }
                          addFacility(resource);
                        } else {
                          removeFacility(resource.id);
                        }
                      }}
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title="Add to comparison"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{resource.title}</h3>

                        {/* Distance Badge - Prominent placement right under title */}
                        {resource.distance !== undefined && (
                          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                            <span className="text-base">📍</span>
                            {resource.distance.toFixed(1)} miles away
                          </div>
                        )}

                        {resource.address && (
                          <p className="mt-2 text-sm text-gray-600">
                            {resource.address}, {resource.city}, {resource.state} {resource.zip}
                          </p>
                        )}
                      </div>
                      {resource.overall_rating && (
                        <div className="text-right">
                          <div className="font-semibold text-indigo-600">
                            {"⭐".repeat(Math.round(resource.overall_rating))}
                          </div>
                          <div className="text-xs text-gray-500">
                            {resource.overall_rating}/5
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {resource.category.slice(0, 2).map((cat) => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat.replace(/_/g, " ")}
                        </Badge>
                      ))}
                      {resource.insurance_accepted && resource.insurance_accepted.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {resource.insurance_accepted[0]}
                        </Badge>
                      )}
                    </div>

                    {resource.available_beds !== undefined && resource.available_beds > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                        ✓ {resource.available_beds} bed{resource.available_beds !== 1 ? 's' : ''} available
                      </div>
                    )}

                    <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => setRequestInfoModal({
                          isOpen: true,
                          facilityName: resource.title,
                          facilityId: resource.id,
                        })}
                      >
                        📧 Request Info
                      </Button>
                      {resource.contact_phone && (
                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none" asChild>
                          <a href={`tel:${resource.contact_phone}`}>
                            📞 Call Now
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none"
                        onClick={() => {
                          const address = `${resource.address}, ${resource.city}, ${resource.state} ${resource.zip}`;
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
                        }}
                      >
                        📍 Directions
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Map (desktop always, mobile only when map tab active) */}
        <div className={`w-full lg:w-[500px] bg-gray-100 ${mobileTab !== "map" ? "hidden lg:block" : "block"}`}>
          <div className="sticky top-0 h-screen">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=nursing+homes+near+me&zoom=11`}
            />
          </div>
        </div>
      </div>

      {/* Request Info Modal */}
      <RequestInfoModal
        isOpen={requestInfoModal.isOpen}
        onClose={() => setRequestInfoModal({ isOpen: false, facilityName: "", facilityId: "" })}
        facilityName={requestInfoModal.facilityName}
        facilityId={requestInfoModal.facilityId}
      />

      {/* Comparison Bar - Sticky at bottom */}
      <ComparisonBar />
    </div>
  );
}

// Wrap with ComparisonProvider
export default function ResultsPage() {
  return (
    <ComparisonProvider>
      <ResultsPageContent />
    </ComparisonProvider>
  );
}
