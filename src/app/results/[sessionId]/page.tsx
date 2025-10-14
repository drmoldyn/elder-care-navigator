"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
import { getStarRating } from "@/lib/utils/score-helpers";
import { geocodeZip } from "@/lib/location/geocode";
import { haversineDistanceMiles } from "@/lib/location/distance";

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
  health_inspection_rating?: number;
  staffing_rating?: number;
  quality_measure_rating?: number;
  sunsetwell_score?: number; // 0-100 composite score
  sunsetwell_percentile?: number; // Peer-adjusted percentile ranking
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
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleGuidanceRetry = () => {
    setGuidanceRequestVersion((prev) => prev + 1);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && sessionId) {
      window.localStorage.setItem("sunsetwell:lastSessionId", sessionId);
    }
  }, [sessionId, googleApiKey]);

  // Track results page view conversion
  useEffect(() => {
    if (!loading && resources.length > 0) {
      trackViewResultsSession({
        sessionId,
        facilityCount: resources.length,
        zipCode: sessionDetails?.zip_code,
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

        const sessionRecord = sessionData.session ?? null;
        setSessionDetails(sessionRecord);

        let userCoords: { lat: number; lng: number } | null = null;
        if (
          sessionRecord &&
          typeof sessionRecord.latitude === "number" &&
          typeof sessionRecord.longitude === "number"
        ) {
          userCoords = {
            lat: sessionRecord.latitude,
            lng: sessionRecord.longitude,
          };
        } else if (sessionRecord?.zip_code && googleApiKey) {
          const coords = await geocodeZip(sessionRecord.zip_code);
          if (coords) {
            userCoords = coords;
          }
        }

        const augmentedResources = resourceData.map((resource) => {
          let distance =
            typeof resource.distance === "number" ? resource.distance : undefined;
          if (
            !distance &&
            userCoords &&
            typeof resource.latitude === "number" &&
            typeof resource.longitude === "number"
          ) {
            distance = haversineDistanceMiles(
              userCoords.lat,
              userCoords.lng,
              resource.latitude,
              resource.longitude
            );
          }

          return {
            ...resource,
            distance,
          };
        });

        const radiusMiles =
          typeof sessionRecord?.search_radius_miles === "number"
            ? sessionRecord.search_radius_miles
            : typeof sessionRecord?.searchRadiusMiles === "number"
            ? sessionRecord.searchRadiusMiles
            : undefined;

        const filteredResources = userCoords && typeof radiusMiles === "number"
          ? augmentedResources.filter((resource) => {
              if (typeof resource.distance === "number") {
                return resource.distance <= radiusMiles + 0.001;
              }
              return true;
            })
          : augmentedResources;

        const sortedResources = [...filteredResources].sort((a, b) => {
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
  }, [sessionId, googleApiKey]);

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
      <div className="flex min-h-screen w-full flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
        {/* Background Hero Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/hero-4.jpg"
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
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-sunset-orange border-t-transparent"></div>
          <h2 className="font-serif text-2xl font-bold text-gray-900">Finding Your Resources...</h2>
          <p className="mt-2 text-gray-600">
            We&apos;re matching you with the best support options
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
        {/* Background Hero Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/hero-4.jpg"
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
        <Card className="w-full max-w-2xl border-red-300 shadow-lg relative z-10">
          <CardHeader>
            <CardTitle className="text-red-600">
              Something Went Wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => window.location.href = "/navigator"} className="mt-4 bg-sunset-orange hover:bg-sunset-orange/90">
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

    // Generate website URL or Google Maps fallback
    const getWebsiteUrl = () => {
      if (resource.url && resource.url.trim() && resource.url !== '#') {
        return resource.url;
      }
      // Fallback to Google Maps search
      const query = encodeURIComponent(`${resource.title} ${resource.address || ''} ${resource.city || ''} ${resource.state || ''}`);
      return `https://www.google.com/maps/search/?api=1&query=${query}`;
    };
    const websiteUrl = getWebsiteUrl();

    return (
      <div key={resource.id} className="hover:bg-gray-50 transition-colors">
        {/* Mobile-optimized layout - CARDS */}
        <div className="md:hidden p-4">
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

              {/* SunsetWell Score Badge - Mobile */}
              {resource.sunsetwell_score !== undefined && (
                <div className="mb-2">
                  <div className={`inline-block px-3 py-2 rounded-lg ${
                    resource.sunsetwell_score >= 90
                      ? "bg-green-700 text-white"
                      : resource.sunsetwell_score >= 75
                      ? "bg-green-500 text-white"
                      : resource.sunsetwell_score >= 60
                      ? "bg-yellow-400 text-gray-900"
                      : resource.sunsetwell_score >= 40
                      ? "bg-orange-500 text-white"
                      : "bg-red-500 text-white"
                  }`}>
                    <div className="text-sm font-bold">
                      SunsetWell Score: {resource.sunsetwell_score.toFixed(0)}
                    </div>
                    <div className="text-xs opacity-90 mt-0.5">
                      {resource.sunsetwell_score >= 90
                        ? "Excellent quality"
                        : resource.sunsetwell_score >= 75
                        ? "Very Good quality"
                        : resource.sunsetwell_score >= 60
                        ? "Good quality"
                        : resource.sunsetwell_score >= 40
                        ? "Fair quality"
                        : "Needs improvement"}
                    </div>
                    {resource.sunsetwell_percentile !== undefined && sessionDetails?.state && (
                      <div className="text-xs opacity-90 mt-1">
                        {resource.sunsetwell_percentile >= 90
                          ? `Top 10% in ${sessionDetails.state}`
                          : resource.sunsetwell_percentile >= 75
                          ? `Top 25% in ${sessionDetails.state}`
                          : resource.sunsetwell_percentile >= 50
                          ? `Above avg in ${sessionDetails.state}`
                          : `${resource.sunsetwell_percentile}th %ile in ${sessionDetails.state}`}
                      </div>
                    )}
                  </div>
                  <a
                    href="/about/scoring"
                    className="inline-block mt-1 text-xs text-indigo-600 hover:text-indigo-800 underline"
                  >
                    What does this score mean?
                  </a>
                </div>
              )}

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
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl text-center flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors min-h-[48px]"
            >
              <span>🔗</span>
              <span>Visit Website</span>
            </a>
          </div>
        </div>

        {/* Desktop layout - TABLE ROW */}
        <div className="hidden md:grid md:grid-cols-[40px_80px_2fr_1fr_1fr_1fr_140px_180px] gap-4 items-center p-4 text-sm">
          {/* Checkbox */}
          <div className="flex items-center justify-center">
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

          {/* Distance */}
          <div className="text-gray-700 font-medium text-center">
            {!isHomeService && resource.distance !== undefined ? (
              <>{resource.distance.toFixed(1)} mi</>
            ) : isHomeService ? (
              <span className="text-emerald-700 text-xs">🏠 Home</span>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>

          {/* Facility Name + Address */}
          <div>
            <h3 className="font-semibold text-gray-900">{resource.title}</h3>
            {resource.address && (
              <p className="text-xs text-gray-600 mt-0.5">
                {resource.address}, {resource.city}, {resource.state}
              </p>
            )}
            {resource.insurance_accepted && resource.insurance_accepted.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {resource.insurance_accepted.slice(0, 2).map((insurance) => (
                  <Badge
                    key={insurance}
                    className="bg-sky-blue/10 text-sky-blue border border-sky-blue/20 text-[10px] px-1.5 py-0"
                  >
                    {insurance}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Health Inspection Rating */}
          <div className="text-center">
            {resource.health_inspection_rating ? (
              <div>
                <div className="text-lg">{getStarRating(resource.health_inspection_rating)}</div>
                <div className="text-xs text-gray-500">{resource.health_inspection_rating}/5</div>
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>

          {/* Staffing Rating */}
          <div className="text-center">
            {resource.staffing_rating ? (
              <div>
                <div className="text-lg">{getStarRating(resource.staffing_rating)}</div>
                <div className="text-xs text-gray-500">{resource.staffing_rating}/5</div>
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>

          {/* Quality Measures Rating */}
          <div className="text-center">
            {resource.quality_measure_rating ? (
              <div>
                <div className="text-lg">{getStarRating(resource.quality_measure_rating)}</div>
                <div className="text-xs text-gray-500">{resource.quality_measure_rating}/5</div>
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>

          {/* SunsetWell Score - PROMINENT */}
          <div className="flex flex-col items-center justify-center gap-0.5">
            {resource.sunsetwell_score !== undefined ? (
              <>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-base ${
                  resource.sunsetwell_score >= 90
                    ? "bg-green-700 text-white"
                    : resource.sunsetwell_score >= 75
                    ? "bg-green-500 text-white"
                    : resource.sunsetwell_score >= 60
                    ? "bg-yellow-400 text-gray-900"
                    : resource.sunsetwell_score >= 40
                    ? "bg-orange-500 text-white"
                    : "bg-red-500 text-white"
                }`}>
                  <span>{resource.sunsetwell_score.toFixed(0)}</span>
                </div>
                <div className="text-[10px] font-medium text-gray-700 text-center leading-tight">
                  {resource.sunsetwell_score >= 90
                    ? "Excellent"
                    : resource.sunsetwell_score >= 75
                    ? "Very Good"
                    : resource.sunsetwell_score >= 60
                    ? "Good"
                    : resource.sunsetwell_score >= 40
                    ? "Fair"
                    : "Needs work"}
                </div>
                {resource.sunsetwell_percentile !== undefined && sessionDetails?.state && (
                  <div className="text-[9px] text-gray-600 text-center leading-tight">
                    {resource.sunsetwell_percentile >= 90
                      ? `Top 10% (${sessionDetails.state})`
                      : resource.sunsetwell_percentile >= 75
                      ? `Top 25% (${sessionDetails.state})`
                      : resource.sunsetwell_percentile >= 50
                      ? `Above avg (${sessionDetails.state})`
                      : `${resource.sunsetwell_percentile}th %ile`}
                  </div>
                )}
                <a
                  href="/about/scoring"
                  className="text-[9px] text-indigo-600 hover:text-indigo-800 underline mt-0.5"
                >
                  What&apos;s this?
                </a>
              </>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <button
                onClick={() => setRequestInfoModal({
                  isOpen: true,
                  facilityName: resource.title,
                  facilityId: resource.id,
                })}
                className="flex-1 bg-sky-blue text-white text-xs font-semibold py-2 px-2 rounded hover:bg-sky-blue/90 transition-colors"
              >
                Get Info
              </button>
              {resource.contact_phone && (
                <a
                  href={`tel:${resource.contact_phone}`}
                  onClick={() => trackPhoneClick({
                    facilityId: resource.id,
                    facilityName: resource.title,
                    phoneNumber: resource.contact_phone!,
                  })}
                  className="flex-1 bg-sunset-orange text-white text-xs font-semibold py-2 px-2 rounded hover:bg-sunset-orange/90 transition-colors text-center"
                >
                  📞 Call
                </a>
              )}
            </div>
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 text-white text-xs font-semibold py-2 px-2 rounded hover:bg-indigo-700 transition-colors text-center"
            >
              🔗 Website
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-lavender/5 via-white to-sky-blue/5">
      {/* Header */}
      <div className="border-b bg-white/90 backdrop-blur-sm px-4 md:px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-xl md:text-2xl font-bold text-gray-900">
            {resultsHeading}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {totalCount.toLocaleString()} match{totalCount === 1 ? "" : "es"}
            {anyDistance && facilityCount > 0 && (
              <span className="ml-2 text-sunset-orange font-medium">• Sorted by distance</span>
            )}
            {homeServiceCount > 0 && (
              <span className="ml-2 text-sunset-orange font-medium">
                • {homeServiceCount.toLocaleString()} home service{homeServiceCount === 1 ? "" : "s"}
                {userZip ? ` serving ZIP ${userZip}` : " serving your area"}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Guidance Section */}
      {(guidanceLoading || guidance || guidanceError) && (
        <div className="border-b border-sunset-orange/20 bg-gradient-to-r from-sunset-orange/10 to-sunset-gold/10">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-sunset-orange">
                  Personalized recommendations
                </p>
                {guidanceLoading && !guidanceError && (
                  <p className="mt-1 text-sm text-gray-700">
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-sunset-orange border-t-transparent align-middle"></span>
                    We&apos;re preparing a care plan tailored to your answers…
                  </p>
                )}
                {guidanceError && (
                  <p className="mt-1 text-sm text-red-700">
                    {guidanceError}
                  </p>
                )}
                {!guidanceLoading && !guidanceError && guidance && guidance.status === "pending" && (
                  <p className="mt-1 text-sm text-gray-700">
                    Nearly there—your personalized care plan is being generated.
                  </p>
                )}
                {!guidanceLoading && !guidanceError && guidance && guidance.status === "complete" && (
                  <p className="mt-1 text-sm text-gray-700">
                    Your personalized care plan is ready.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {guidance && guidance.status === "complete" && guidance.guidance && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sunset-orange hover:text-sunset-orange/80"
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
              <div className="mt-4 rounded-xl border border-sunset-orange/20 bg-white p-4 text-sm leading-relaxed text-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">Care plan overview</p>
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
        <aside className="hidden lg:block w-80 overflow-y-auto border-r bg-white/60 backdrop-blur-sm p-6">
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Insurance Accepted</h3>
              <div className="space-y-2">
                {["Medicare", "Medicaid", "Private Insurance", "VA Benefits"].map((insurance) => (
                  <label key={insurance} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-sunset-orange focus:ring-sunset-orange/50" />
                    <span>{insurance}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Star Rating</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <label key={stars} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-sunset-orange focus:ring-sunset-orange/50" />
                    <span>{"⭐".repeat(stars)} & up</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Availability</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-sunset-orange focus:ring-sunset-orange/50" />
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
          {/* Table Header - Desktop Only */}
          <div className="hidden md:grid md:grid-cols-[40px_80px_2fr_1fr_1fr_1fr_140px_180px] gap-4 items-center p-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <div className="text-center text-xs font-semibold text-gray-600">☑</div>
            <div className="text-center text-xs font-semibold text-gray-600">Distance</div>
            <div className="text-xs font-semibold text-gray-600">Facility Name</div>
            <div className="text-center text-xs font-semibold text-gray-600">Health<br/>Inspection</div>
            <div className="text-center text-xs font-semibold text-gray-600">Staffing</div>
            <div className="text-center text-xs font-semibold text-gray-600">Quality<br/>Measures</div>
            <div className="text-center text-xs font-semibold text-gray-900">SunsetWell<br/>Score</div>
            <div className="text-center text-xs font-semibold text-gray-600">Actions</div>
          </div>

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
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=nursing+homes+near+me&zoom=11`}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-white">
                <div className="text-center px-4">
                  <p className="text-sm text-slate-600">Map unavailable</p>
                  <p className="mt-1 text-xs text-slate-500">Google Maps API key is not configured for this environment.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Partner Marketplace */}
      <section className="border-t border-gray-200 bg-gradient-to-br from-lavender/10 via-white to-sky-blue/10 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-gray-900">
              Additional support for your family
            </h2>
            <p className="text-sm text-gray-600">
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
