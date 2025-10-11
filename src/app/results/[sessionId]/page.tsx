"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileTabs } from "@/components/results/mobile-tabs";
import { MobileFilterModal } from "@/components/results/mobile-filter-modal";
import { RequestInfoModal } from "@/components/request-info-modal";
import { ComparisonProvider, useComparison } from "@/contexts/comparison-context";
import { ComparisonBar } from "@/components/comparison/comparison-bar";
import { trackPhoneClick, trackViewResultsSession } from "@/lib/analytics/events";
import { PartnerGrid } from "@/components/partners/partner-grid";
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
  latitude?: number | null;
  longitude?: number | null;
  provider_type?: string;
  service_area_match?: boolean;
  service_area_zip?: string;
}

const FACILITY_PROVIDER_TYPES = new Set([
  "nursing_home",
  "assisted_living_facility",
  "skilled_nursing_facility",
  "memory_care_facility",
]);

const HOME_SERVICE_PROVIDER_TYPES = new Set([
  "home_health_agency",
  "home_health",
  "home_care_agency",
  "hospice",
]);

function ResultsPageContent() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { addFacility, removeFacility, isSelected, selectedFacilities, maxSelection } = useComparison();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<GuidancePollResponse | null>(null);
  const [guidanceLoading, setGuidanceLoading] = useState(true);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [guidanceExpanded, setGuidanceExpanded] = useState(true);
  const [guidanceRequestVersion, setGuidanceRequestVersion] = useState(0);
  const [resources, setResources] = useState<Resource[]>([]);
  const [sessionDetails, setSessionDetails] = useState<{ care_type?: string; zip_code?: string; state?: string } | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("list");
  const [filterCount] = useState(0); // Will be dynamic when filters are implemented
  const [requestInfoModal, setRequestInfoModal] = useState<{
    isOpen: boolean;
    facilityName: string;
    facilityId: string;
  }>({ isOpen: false, facilityName: "", facilityId: "" });
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const viewParam = searchParams.get("view");
  const activeView: "list" | "map" = viewParam === "map" ? "map" : "list";

  const handleGuidanceRetry = () => {
    setGuidanceRequestVersion((prev) => prev + 1);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && sessionId) {
      window.localStorage.setItem("sunsetwell:lastSessionId", sessionId);
    }
  }, [sessionId]);

  // Track results page view conversion
  useEffect(() => {
    if (!loading && resources.length > 0) {
      trackViewResultsSession({
        sessionId,
        facilityCount: resources.length,
        zipCode: sessionDetails?.zip_code,
        conditions: sessionDetails?.needs,
      });
    }
  }, [loading, resources.length, sessionId, sessionDetails]);

  useEffect(() => {
    if (mobileTab === "filters") {
      return;
    }
    if (mobileTab !== activeView) {
      setMobileTab(activeView);
    }
  }, [activeView, mobileTab]);

  const setViewParam = (nextView: "list" | "map") => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextView === "list") {
      nextParams.delete("view");
    } else {
      nextParams.set("view", "map");
    }

    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const handleMobileTabChange = (tab: MobileTab) => {
    if (tab === "filters") {
      setMobileTab(tab);
      return;
    }
    setViewParam(tab);
  };
  useEffect(() => {
    let isActive = true;

    const fetchResources = async () => {
      setLoading(true);
      setError(null);
      setResources([]);

      try {
        const sessionRes = await fetch(`/api/sessions/${sessionId}`);
        if (!sessionRes.ok) throw new Error("Failed to load session");

        const sessionData = await sessionRes.json();
        const resourceData: Resource[] = sessionData.resources || [];

        if (!isActive) {
          return;
        }

        setSessionDetails(sessionData.session ?? null);

        const sortedResources = [...resourceData].sort((a: Resource, b: Resource) => {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          if (a.distance !== undefined) return -1;
          if (b.distance !== undefined) return 1;
          return 0;
        });

        setResources(sortedResources);
      } catch {
        if (!isActive) {
          return;
        }
        setError("Failed to load your personalized plan");
      } finally {
        if (!isActive) {
          return;
        }
        setLoading(false);
      }
    };

    fetchResources();

    return () => {
      isActive = false;
    };
  }, [sessionId]);

  useEffect(() => {
    let isCancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;
    let firstAttempt = true;

    const fetchGuidance = async () => {
      try {
        if (firstAttempt) {
          setGuidanceLoading(true);
          firstAttempt = false;
        }

        const response = await fetch(`/api/guidance/${sessionId}`);
        if (!response.ok) {
          throw new Error("Failed to load guidance");
        }

        const data: GuidancePollResponse = await response.json();
        if (isCancelled) {
          return;
        }

        setGuidance(data);
        setGuidanceError(null);
        setGuidanceLoading(false);

        if (data.status === "pending") {
          retryTimeout = setTimeout(fetchGuidance, 2000);
        }
      } catch {
        if (isCancelled) {
          return;
        }
        setGuidanceError("We couldn't load your personalized plan right now.");
        setGuidanceLoading(false);
      }
    };

    if (sessionId) {
      setGuidance(null);
      setGuidanceError(null);
      setGuidanceExpanded(true);
      firstAttempt = true;
      fetchGuidance();
    }

    return () => {
      isCancelled = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [sessionId, guidanceRequestVersion]);

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

  const facilityResources = resources.filter((resource) =>
    resource.provider_type ? FACILITY_PROVIDER_TYPES.has(resource.provider_type) : true
  );

  const homeServiceResources = resources
    .filter((resource) => resource.provider_type && HOME_SERVICE_PROVIDER_TYPES.has(resource.provider_type))
    .sort((a, b) => a.title.localeCompare(b.title));

  const facilityCount = facilityResources.length;
  const homeServiceCount = homeServiceResources.length;
  const totalCount = facilityCount + homeServiceCount;
  const resultsHeading = homeServiceCount > 0
    ? facilityCount > 0
      ? "Care Options Near You"
      : "Home Services Available in Your Area"
    : "Care Facilities Near You";
  const anyDistance = facilityResources.some((resource) => typeof resource.distance === "number");
  const userZip = sessionDetails?.zip_code;

  const renderResourceCard = (resource: Resource, isHomeService: boolean) => {
    const isSelectedResource = isSelected(resource.id);

    return (
      <div key={resource.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
        {/* Mobile-optimized layout */}
        <div className="md:hidden">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{resource.title}</h3>

              {/* Distance and Rating - Prominent on Mobile */}
              <div className="flex items-center gap-3 mb-2">
                {!isHomeService && resource.distance !== undefined && (
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                    <span className="text-base">📍</span>
                    <span>{resource.distance.toFixed(1)} mi</span>
                  </div>
                )}
                {isHomeService && (
                  <div className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
                    <span className="text-base">🏠</span>
                    <span>{userZip ? `ZIP ${userZip}` : "Your area"}</span>
                  </div>
                )}
                {resource.overall_rating && (
                  <div className="flex items-center gap-1 text-sm font-semibold text-sunset-orange">
                    <span>⭐</span>
                    <span>{resource.overall_rating}/5</span>
                  </div>
                )}
              </div>

              {resource.address && (
                <p className="text-sm text-gray-600">
                  {resource.address}, {resource.city}, {resource.state}
                </p>
              )}
            </div>

            {/* Quick Compare Checkbox - Top Right, 6x6 (24px) */}
            <input
              type="checkbox"
              checked={isSelectedResource}
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
              className="w-6 h-6 rounded border-gray-300 text-sunset-orange focus:ring-sunset-orange/50 cursor-pointer flex-shrink-0"
              title="Add to comparison"
            />
          </div>

          {/* Insurance Badges with Sky-Blue Styling */}
          <div className="flex flex-wrap gap-2 mb-3">
            {resource.insurance_accepted && resource.insurance_accepted.slice(0, 3).map((insurance) => (
              <Badge
                key={insurance}
                className="bg-sky-blue/10 text-sky-blue border border-sky-blue/20 text-xs"
              >
                {insurance}
              </Badge>
            ))}
            {resource.available_beds !== undefined && resource.available_beds > 0 && (
              <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
                ✓ {resource.available_beds} bed{resource.available_beds !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Mobile CTAs - Full Width, 48px height minimum */}
          <div className="grid grid-cols-2 gap-2">
            {resource.contact_phone && (
              <a
                href={`tel:${resource.contact_phone}`}
                onClick={() => trackPhoneClick({
                  facilityId: resource.id,
                  facilityName: resource.title,
                  phoneNumber: resource.contact_phone!,
                })}
                className="bg-sunset-orange text-white font-semibold py-3 rounded-xl text-center flex items-center justify-center gap-2 hover:bg-sunset-orange/90 transition-colors min-h-[48px]"
              >
                <span>📞</span>
                <span>Call</span>
              </a>
            )}
            <button
              onClick={() => setRequestInfoModal({
                isOpen: true,
                facilityName: resource.title,
                facilityId: resource.id,
              })}
              className={`bg-sky-blue text-white font-semibold py-3 rounded-xl hover:bg-sky-blue/90 transition-colors min-h-[48px] ${!resource.contact_phone ? 'col-span-2' : ''}`}
            >
              Get Info
            </button>
          </div>
        </div>

        {/* Desktop layout - unchanged */}
        <div className="hidden md:flex items-start justify-between gap-4">
          <div className="flex items-start pt-1">
            <input
              type="checkbox"
              checked={isSelectedResource}
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

                {!isHomeService && resource.distance !== undefined && (
                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                    <span className="text-base">📍</span>
                    {resource.distance.toFixed(1)} miles away
                  </div>
                )}

                {isHomeService && (
                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    <span className="text-base">🏠</span>
                    {userZip ? `Serves ZIP ${userZip}` : "Serves your area"}
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
                ✓ {resource.available_beds} bed{resource.available_beds !== 1 ? "s" : ""} available
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
                  <a
                    href={`tel:${resource.contact_phone}`}
                    onClick={() => trackPhoneClick({
                      facilityId: resource.id,
                      facilityName: resource.title,
                      phoneNumber: resource.contact_phone!,
                    })}
                  >
                    📞 Call Now
                  </a>
                </Button>
              )}
              {resource.address && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    const address = `${resource.address}, ${resource.city}, ${resource.state} ${resource.zip}`;
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
                  }}
                >
                  📍 Directions
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-white px-4 md:px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-xl md:text-2xl font-bold">
            {resultsHeading}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {totalCount.toLocaleString()} match{totalCount === 1 ? "" : "es"}
            {anyDistance && facilityCount > 0 && (
              <span className="ml-2 text-indigo-600 font-medium">• Sorted by distance</span>
            )}
            {homeServiceCount > 0 && (
              <span className="ml-2 text-indigo-600 font-medium">
                • {homeServiceCount.toLocaleString()} home service{homeServiceCount === 1 ? "" : "s"}
                {userZip ? ` serving ZIP ${userZip}` : " serving your area"}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Guidance Section */}
      {(guidanceLoading || guidance || guidanceError) && (
        <div className="border-b border-indigo-100 bg-indigo-50/70">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-800">
                  Personalized recommendations
                </p>
                {guidanceLoading && !guidanceError && (
                  <p className="mt-1 text-sm text-indigo-700">
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent align-middle"></span>
                    We&apos;re preparing a care plan tailored to your answers…
                  </p>
                )}
                {guidanceError && (
                  <p className="mt-1 text-sm text-red-700">
                    {guidanceError}
                  </p>
                )}
                {!guidanceLoading && !guidanceError && guidance && guidance.status === "pending" && (
                  <p className="mt-1 text-sm text-indigo-700">
                    Nearly there—your personalized care plan is being generated.
                  </p>
                )}
                {!guidanceLoading && !guidanceError && guidance && guidance.status === "complete" && (
                  <p className="mt-1 text-sm text-indigo-700">
                    Your personalized care plan is ready.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {guidance && guidance.status === "complete" && guidance.guidance && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-700 hover:text-indigo-900"
                    onClick={() => setGuidanceExpanded((prev) => !prev)}
                  >
                    {guidanceExpanded ? "Hide" : "Show"} plan
                  </Button>
                )}
                {guidanceError && (
                  <Button size="sm" variant="outline" onClick={handleGuidanceRetry}>
                    Try again
                  </Button>
                )}
              </div>
            </div>

            {!guidanceLoading && !guidanceError && guidance && guidance.status === "complete" && guidance.guidance && guidanceExpanded && (
              <div className="mt-4 rounded-lg border border-indigo-200 bg-white p-4 text-sm leading-relaxed text-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-indigo-900">Care plan overview</p>
                  {guidance.fallback && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Using fallback guidance
                    </span>
                  )}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-slate-700">
                  {guidance.guidance}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Tabs (only on mobile) */}
      <MobileTabs
        activeTab={mobileTab}
        onTabChange={handleMobileTabChange}
        filterCount={filterCount}
      />

      {/* Sticky Filter Bar - Mobile Only */}
      {mobileTab === "list" && (
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <span className="font-semibold text-gray-900">
            {totalCount} {totalCount === 1 ? "Facility" : "Facilities"}
          </span>
          <button
            onClick={() => handleMobileTabChange("filters")}
            className="bg-sky-blue text-white px-4 py-2 rounded-lg font-medium min-h-[40px] hover:bg-sky-blue/90 transition-colors"
          >
            Filters {filterCount > 0 && `(${filterCount})`}
          </button>
        </div>
      )}

      {/* Mobile Filter Modal */}
      <MobileFilterModal
        isOpen={mobileTab === "filters"}
        onClose={() => setMobileTab(activeView)}
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
            {totalCount === 0 && !loading && (
              <div className="p-8 text-center">
                <p className="text-gray-600">
                  No matches found. Try adjusting your filters.
                </p>
                <Button onClick={() => window.location.href = "/navigator"} className="mt-4">
                  Start New Search
                </Button>
              </div>
            )}

            {facilityResources.map((resource) => renderResourceCard(resource, false))}

            {homeServiceCount > 0 && (
              <div className="px-4 py-6 bg-slate-50 text-sm text-gray-700">
                <h2 className="text-base font-semibold text-gray-900">
                  Home Services Serving {userZip ? `ZIP ${userZip}` : "Your Area"}
                </h2>
                <p className="mt-1">
                  Licensed agencies that come to you. Request information or call to get started.
                </p>
              </div>
            )}

            {homeServiceResources.map((resource) => renderResourceCard(resource, true))}
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

      {/* Partner Marketplace */}
      <section className="border-t border-slate-200 bg-slate-50/60 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-slate-900">
              Additional support for your family
            </h2>
            <p className="text-sm text-slate-600">
              Connect with trusted partners for legal guidance, financial planning, home safety upgrades, and more.
            </p>
          </div>
          <PartnerGrid />
        </div>
      </section>

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
