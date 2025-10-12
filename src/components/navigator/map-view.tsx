"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MatchResponsePayload, MatchResponseResourceSummary } from "@/types/api";
import type { SessionContext } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MapResource } from "@/components/map/facility-map";
import { geocodeZip, ZipCoordinates } from "@/lib/location/geocode";
import { haversineDistanceMiles } from "@/lib/location/distance";

const FacilityMap = dynamic(
  () => import("@/components/map/facility-map").then((mod) => mod.FacilityMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[60vh] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-sunset-orange/50 border-t-transparent" />
      </div>
    ),
  }
);

const FACILITY_TYPES = new Set([
  "nursing_home",
  "assisted_living_facility",
  "skilled_nursing_facility",
  "memory_care_facility",
]);

const HOME_SERVICE_TYPES = new Set([
  "home_health_agency",
  "home_health",
  "home_care_agency",
  "hospice",
]);

type CareTypeOption = "facility" | "home_services" | "both";
type InsuranceOption = "medicare" | "medicaid" | "private" | "veterans_affairs";

interface NavigatorMapViewProps {
  defaultCareType?: CareTypeOption;
}

interface SearchState {
  zip: string;
  state: string;
  radius: number;
  careType: CareTypeOption;
  insurance: InsuranceOption[];
}

const MAX_MAP_MARKERS = 500;

export function NavigatorMapView({ defaultCareType = "facility" }: NavigatorMapViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const initialSearchState = useMemo<SearchState>(() => {
    const insuranceParam = searchParams.get("insurance") ?? "";
    const insuranceValues = insuranceParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean) as InsuranceOption[];

    return {
      zip: searchParams.get("zip") ?? "",
      state: searchParams.get("state") ?? "",
      radius: Number(searchParams.get("radius") ?? 50) || 50,
      careType: (searchParams.get("careType") as CareTypeOption | null) ?? defaultCareType,
      insurance: insuranceValues,
    };
  }, [defaultCareType, searchParams]);

  const [searchState, setSearchState] = useState<SearchState>(initialSearchState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resourceSummaries, setResourceSummaries] = useState<MatchResponseResourceSummary[]>([]);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<ZipCoordinates | null>(null);

  // Sync local state if query string changes externally (e.g., browser navigation)
  useEffect(() => {
    setSearchState(initialSearchState);
  }, [initialSearchState]);

  const applyQueryParams = useCallback(
    (state: SearchState) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", "map");

      if (state.zip.trim()) {
        params.set("zip", state.zip.trim());
      } else {
        params.delete("zip");
      }

      if (state.state.trim()) {
        params.set("state", state.state.trim().toUpperCase());
      } else {
        params.delete("state");
      }

      if (state.careType) {
        params.set("careType", state.careType);
      } else {
        params.delete("careType");
      }

      if (state.radius) {
        params.set("radius", String(state.radius));
      } else {
        params.delete("radius");
      }

      if (state.insurance.length > 0) {
        params.set("insurance", state.insurance.join(","));
      } else {
        params.delete("insurance");
      }

      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const buildSessionPayload = useCallback(
    (state: SearchState, coords?: ZipCoordinates | null): SessionContext | null => {
      const hasLocation = Boolean(state.zip.trim() || state.state.trim());
      if (!hasLocation) {
        return null;
      }

      const payload: SessionContext = {
        conditions: ["multiple"],
        urgencyFactors: ["planning"],
        zipCode: state.zip.trim() || undefined,
        state: state.state.trim() || undefined,
        searchRadiusMiles: state.zip.trim() ? state.radius : undefined,
        careType: state.careType,
        insuranceTypes: state.insurance.length > 0 ? state.insurance : undefined,
      };

      if (coords) {
        payload.latitude = coords.lat;
        payload.longitude = coords.lng;
      }

      return payload;
    },
    []
  );

  const resolveUserLocation = useCallback(
    async (state: SearchState): Promise<ZipCoordinates | null> => {
      const zip = state.zip.trim();
      if (!zip) {
        setUserLocation(null);
        return null;
      }

      if (!googleApiKey) {
        return null;
      }

      const coords = await geocodeZip(zip, googleApiKey);
      if (coords) {
        setUserLocation(coords);
        return coords;
      }

      setUserLocation(null);
      return null;
    },
    [googleApiKey]
  );

  const fetchMatches = useCallback(
    async (state: SearchState) => {
      const coords = await resolveUserLocation(state);
      const sessionPayload = buildSessionPayload(state, coords);
      if (!sessionPayload) {
        setError("Enter a ZIP code or state to search on the map.");
        setResourceSummaries([]);
        setLastSessionId(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session: sessionPayload,
            preview: false,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to load facilities for map view");
        }

        const data: MatchResponsePayload = await response.json();

        const processedSummaries = (data.resourceSummaries ?? []).map((summary) => {
          let distance =
            typeof summary.distanceMiles === "number"
              ? summary.distanceMiles
              : null;

          if (
            distance === null &&
            coords &&
            typeof summary.latitude === "number" &&
            typeof summary.longitude === "number"
          ) {
            distance = haversineDistanceMiles(
              coords.lat,
              coords.lng,
              summary.latitude,
              summary.longitude
            );
          }

          return {
            ...summary,
            distanceMiles: distance,
          };
        });

        const filteredSummaries = coords
          ? processedSummaries.filter((summary) => {
              if (
                typeof summary.distanceMiles === "number" &&
                state.radius
              ) {
                return summary.distanceMiles <= state.radius + 0.001;
              }
              return true;
            })
          : processedSummaries;

        setResourceSummaries(filteredSummaries);
        setLastFetchedAt(new Date());
        setLastSessionId(data.sessionId ?? null);
      } catch (err) {
        console.error("Map search error", err);
        setError(err instanceof Error ? err.message : "Unable to load facilities");
        setResourceSummaries([]);
        setLastSessionId(null);
      } finally {
        setIsLoading(false);
      }
    },
    [buildSessionPayload, resolveUserLocation]
  );

  // Trigger search on initial load / when query params change
  useEffect(() => {
    const hasInitialLocation = Boolean(
      initialSearchState.zip.trim() || initialSearchState.state.trim()
    );

    if (hasInitialLocation) {
      fetchMatches(initialSearchState);
    }
  }, [fetchMatches, initialSearchState]);

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      applyQueryParams(searchState);
      fetchMatches(searchState);
    },
    [applyQueryParams, fetchMatches, searchState]
  );

  const handleInsuranceToggle = (value: InsuranceOption) => {
    setSearchState((prev) => {
      const exists = prev.insurance.includes(value);
      return {
        ...prev,
        insurance: exists
          ? prev.insurance.filter((item) => item !== value)
          : [...prev.insurance, value],
      };
    });
  };

  const mapResources = useMemo<MapResource[]>(() => {
    return resourceSummaries
      .filter((summary) => summary.latitude !== null && summary.longitude !== null)
      .slice(0, MAX_MAP_MARKERS)
      .map((summary) => ({
        id: summary.id,
        title: summary.title,
        latitude: summary.latitude ?? undefined,
        longitude: summary.longitude ?? undefined,
        provider_type: summary.providerType ?? undefined,
        address: summary.address ?? undefined,
        city: summary.city ?? undefined,
        state: summary.state ?? undefined,
        zip: summary.zip ?? undefined,
        overall_rating: summary.overallRating ?? undefined,
        sunsetwell_score: summary.sunsetwellScore ?? undefined,
        distance: summary.distanceMiles ?? undefined,
        service_area_match: summary.serviceAreaMatch ?? false,
        service_area_zip: summary.serviceAreaZip ?? undefined,
      }));
  }, [resourceSummaries]);

  const facilityCount = useMemo(
    () =>
      mapResources.filter((resource) =>
        resource.provider_type ? FACILITY_TYPES.has(resource.provider_type) : false
      ).length,
    [mapResources]
  );

  const homeServiceCount = useMemo(
    () =>
      mapResources.filter((resource) =>
        resource.provider_type ? HOME_SERVICE_TYPES.has(resource.provider_type) : false
      ).length,
    [mapResources]
  );

  const topVisibleResources = useMemo(() => {
    return mapResources.slice(0, 8);
  }, [mapResources]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <Card className="border-sunset-orange/20 bg-white/80 shadow-lg backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">
            Search on the map
          </CardTitle>
          <p className="text-sm text-slate-600">
            Enter a location and we&apos;ll show facilities nearby. Toggle insurance and care type filters to refine the map.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="map-zip" className="text-sm font-medium text-slate-700">
                ZIP code
              </label>
              <Input
                id="map-zip"
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                placeholder="e.g., 10001"
                value={searchState.zip}
                onChange={(event) =>
                  setSearchState((prev) => ({ ...prev, zip: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="map-state" className="text-sm font-medium text-slate-700">
                State
              </label>
              <Input
                id="map-state"
                placeholder="e.g., NY"
                value={searchState.state}
                onChange={(event) =>
                  setSearchState((prev) => ({ ...prev, state: event.target.value.toUpperCase() }))
                }
              />
              <p className="text-xs text-slate-500">
                Use a state if you don&apos;t have a specific ZIP code yet
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="map-care-type" className="text-sm font-medium text-slate-700">
                Care type
              </label>
              <select
                id="map-care-type"
                value={searchState.careType}
                onChange={(event) =>
                  setSearchState((prev) => ({
                    ...prev,
                    careType: event.target.value as CareTypeOption,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunset-orange/40"
              >
                <option value="facility">Care facilities</option>
                <option value="home_services">Home services</option>
                <option value="both">Show both</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="map-radius" className="text-sm font-medium text-slate-700">
                Radius ({searchState.radius} miles)
              </label>
              <input
                id="map-radius"
                type="range"
                min={10}
                max={250}
                step={10}
                value={searchState.radius}
                onChange={(event) =>
                  setSearchState((prev) => ({
                    ...prev,
                    radius: Number(event.target.value) || 50,
                  }))
                }
                className="w-full"
                disabled={!searchState.zip}
              />
              <p className="text-xs text-slate-500">
                Radius applies when a ZIP code is provided
              </p>
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <p className="text-sm font-medium text-slate-700">Insurance accepted</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {(
                  [
                    { value: "medicare", label: "Medicare" },
                    { value: "medicaid", label: "Medicaid" },
                    { value: "private", label: "Private insurance" },
                    { value: "veterans_affairs", label: "VA benefits" },
                  ] as const
                ).map(({ value, label }) => {
                  const selected = searchState.insurance.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleInsuranceToggle(value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        selected
                          ? "border-sunset-orange bg-sunset-orange/10 text-sunset-orange"
                          : "border-slate-300 text-slate-600 hover:border-sunset-orange/60"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500">
                {lastFetchedAt ? `Updated ${lastFetchedAt.toLocaleTimeString()}` : "Map updates when you run a search"}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Searching…" : "Update map"}
                </Button>
                {lastSessionId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/results/${lastSessionId}`)}
                  >
                    View full results
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {mapResources.length > 0 ? (
            <FacilityMap
              resources={mapResources}
              userZip={searchState.zip || undefined}
              userLocation={userLocation}
              onVisibleChange={(count) => setVisibleCount(count)}
            />
          ) : (
            <div className="flex h-[60vh] w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70">
              <div className="text-center text-slate-600">
                {isLoading ? "Loading facilities…" : "Set a location and click Update map to see nearby facilities."}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="border-sky-blue/30 bg-white/80 shadow-md backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Map overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Total markers</span>
                <Badge variant="secondary">{mapResources.length.toLocaleString()}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Visible in current view</span>
                <Badge variant="outline">
                  {(visibleCount ?? mapResources.length).toLocaleString()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Care facilities</span>
                <Badge className="bg-sunset-orange/90 text-white">
                  {facilityCount.toLocaleString()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Home services</span>
                <Badge className="bg-emerald-500/90 text-white">
                  {homeServiceCount.toLocaleString()}
                </Badge>
              </div>
              {mapResources.length >= MAX_MAP_MARKERS && (
                <p className="text-xs text-slate-500">
                  Showing first {MAX_MAP_MARKERS.toLocaleString()} markers. Zoom or refine filters to see more specific matches.
                </p>
              )}
            </CardContent>
          </Card>

          {topVisibleResources.length > 0 && (
            <Card className="border-lavender/40 bg-white/80 shadow-md backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Nearby highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-700">
                {topVisibleResources.map((resource) => (
                  <div key={resource.id} className="rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm">
                    <p className="font-semibold text-slate-900">{resource.title}</p>
                    <p className="text-xs text-slate-500">
                      {[resource.city, resource.state, resource.zip].filter(Boolean).join(", ")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {resource.distance !== undefined && (
                        <Badge variant="outline" className="border-sunset-orange/40 text-sunset-orange">
                          {resource.distance.toFixed(1)} miles
                        </Badge>
                      )}
                      {resource.provider_type && (
                        <Badge variant="outline" className="border-slate-300 text-slate-600">
                          {FACILITY_TYPES.has(resource.provider_type)
                            ? "Facility"
                            : HOME_SERVICE_TYPES.has(resource.provider_type)
                            ? "Home service"
                            : resource.provider_type.replace(/_/g, " ")}
                        </Badge>
                      )}
                      {resource.overall_rating !== undefined && resource.overall_rating !== null && (
                        <span>⭐ {resource.overall_rating.toFixed(1)} / 5</span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2 text-xs">
                      <a
                        href={`/facility/${resource.id}`}
                        className="text-sunset-orange hover:text-sunset-orange/80"
                      >
                        View details
                      </a>
                      <span className="text-slate-300">|</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${resource.title} ${resource.city ?? ""} ${resource.state ?? ""}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-blue hover:text-sky-blue/80"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
