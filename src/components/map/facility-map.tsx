"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { getMarkerColor, getSunsetWellScoreBadge } from "@/lib/utils/score-helpers";

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 11;
const HOME_SERVICE_ZOOM = 10;
const GEOCODE_CACHE_KEY = "sunsetwell:zip-geocode-cache";

const FACILITY_COLORS: Record<string, string> = {
  nursing_home: "#ef4444",
  assisted_living_facility: "#3b82f6",
  skilled_nursing_facility: "#ef4444",
  memory_care_facility: "#8b5cf6",
};

const HOME_SERVICE_COLORS: Record<string, string> = {
  home_health_agency: "#22c55e",
  home_health: "#22c55e",
  home_care_agency: "#10b981",
  hospice: "#0ea5e9",
};

export interface MapResource {
  id: string;
  title: string;
  latitude?: number | null;
  longitude?: number | null;
  provider_type?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  overall_rating?: number | null;
  sunsetwell_score?: number | null;
  distance?: number;
  service_area_match?: boolean;
  service_area_zip?: string | null;
}

interface LatLngBoundsLiteral {
  east: number;
  north: number;
  south: number;
  west: number;
}

export interface FacilityMapProps {
  resources: MapResource[];
  userZip?: string;
  onBoundsSearch?: (bounds: LatLngBoundsLiteral) => void;
  onVisibleChange?: (visible: number) => void;
}

interface GeocodeCache {
  [zip: string]: { lat: number; lng: number };
}

function readGeocodeCache(): GeocodeCache {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(GEOCODE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as GeocodeCache) : {};
  } catch (error) {
    console.warn("Failed to parse geocode cache", error);
    return {};
  }
}

function writeGeocodeCache(zip: string, coords: { lat: number; lng: number }) {
  if (typeof window === "undefined") return;
  try {
    const cache = readGeocodeCache();
    cache[zip] = coords;
    window.localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Failed to update geocode cache", error);
  }
}

async function geocodeZipWithGoogle(zip: string, apiKey?: string): Promise<{ lat: number; lng: number } | null> {
  if (!apiKey) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip)}&component=country:US&key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
  } catch (error) {
    console.warn("Failed to geocode ZIP", zip, error);
  }
  return null;
}

function createMarkerIcon(color: string, isHomeService: boolean): google.maps.Symbol {
  return {
    path: isHomeService ? google.maps.SymbolPath.CIRCLE : google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
    fillColor: color,
    fillOpacity: 0.92,
    strokeColor: "#1f2937",
    strokeWeight: 1,
    scale: isHomeService ? 7 : 6,
  };
}

function createInfoWindowContent(resource: MapResource, distanceText: string): HTMLElement {
  const container = document.createElement("div");
  container.style.padding = "8px";
  container.style.maxWidth = "320px";
  container.style.fontSize = "14px";
  container.style.lineHeight = "1.4";

  const title = document.createElement("h3");
  title.style.margin = "0 0 6px 0";
  title.style.fontWeight = "600";
  title.textContent = resource.title;
  container.appendChild(title);

  if (resource.address || resource.city || resource.state || resource.zip) {
    const address = document.createElement("p");
    address.style.margin = "4px 0";
    address.style.color = "#4b5563";
    const parts = [resource.address, resource.city, resource.state, resource.zip].filter(Boolean).join(", ");
    address.textContent = parts;
    container.appendChild(address);
  }

  if (distanceText) {
    const distance = document.createElement("p");
    distance.style.margin = "4px 0";
    distance.style.color = "#6b7280";
    distance.textContent = distanceText;
    container.appendChild(distance);
  }

  // SunsetWell Score - PROMINENT
  if (typeof resource.sunsetwell_score === "number") {
    const scoreContainer = document.createElement("div");
    scoreContainer.style.marginTop = "12px";
    scoreContainer.style.marginBottom = "8px";
    scoreContainer.style.padding = "8px";
    scoreContainer.style.borderRadius = "6px";
    scoreContainer.style.fontWeight = "bold";
    scoreContainer.style.fontSize = "16px";
    scoreContainer.style.textAlign = "center";

    // Parse Tailwind classes to inline styles for map InfoWindow
    if (resource.sunsetwell_score >= 90) {
      scoreContainer.style.background = "#15803d"; // green-700
      scoreContainer.style.color = "white";
    } else if (resource.sunsetwell_score >= 75) {
      scoreContainer.style.background = "#22c55e"; // green-500
      scoreContainer.style.color = "white";
    } else if (resource.sunsetwell_score >= 60) {
      scoreContainer.style.background = "#facc15"; // yellow-400
      scoreContainer.style.color = "#111827"; // gray-900
    } else if (resource.sunsetwell_score >= 40) {
      scoreContainer.style.background = "#f97316"; // orange-500
      scoreContainer.style.color = "white";
    } else {
      scoreContainer.style.background = "#ef4444"; // red-500
      scoreContainer.style.color = "white";
    }

    scoreContainer.textContent = `SunsetWell Score: ${getSunsetWellScoreBadge(resource.sunsetwell_score)}`;
    container.appendChild(scoreContainer);
  }

  if (typeof resource.overall_rating === "number") {
    const rating = document.createElement("p");
    rating.style.margin = "4px 0";
    rating.textContent = `⭐ CMS Rating: ${resource.overall_rating}/5`;
    container.appendChild(rating);
  }

  const link = document.createElement("a");
  link.href = `/facility/${resource.id}`;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "View Details →";
  link.style.display = "inline-block";
  link.style.marginTop = "10px";
  link.style.padding = "8px 16px";
  link.style.background = "#FF9B6A";
  link.style.color = "white";
  link.style.borderRadius = "8px";
  link.style.textDecoration = "none";

  container.appendChild(link);
  return container;
}

function debounce<T extends (...args: never[]) => void>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const wrapped = function wrappedFn(this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  } as T & { cancel: () => void };

  wrapped.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return wrapped;
}

export function FacilityMap({ resources, userZip, onBoundsSearch, onVisibleChange }: FacilityMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(resources.length);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const loader = useMemo(() => {
    return new Loader({
      apiKey: apiKey ?? "",
      version: "weekly",
      libraries: ["marker", "geometry"],
    });
  }, [apiKey]);

  useEffect(() => {
    let isMounted = true;
    let boundsListener: google.maps.MapsEventListener | null = null;
    let debouncedUpdate: ReturnType<typeof debounce> | null = null;

    async function initializeMap() {
      if (!mapContainerRef.current) return;

      setLoading(true);

      const clusteredFacilities = resources.filter(
        (resource) => typeof resource.latitude === "number" && typeof resource.longitude === "number"
      );

      let mapCenter = DEFAULT_CENTER;
      if (clusteredFacilities.length > 0) {
        const centerLat = clusteredFacilities.reduce((sum, r) => sum + (r.latitude ?? 0), 0) / clusteredFacilities.length;
        const centerLng = clusteredFacilities.reduce((sum, r) => sum + (r.longitude ?? 0), 0) / clusteredFacilities.length;
        mapCenter = { lat: centerLat, lng: centerLng };
      } else if (userZip) {
        const cache = readGeocodeCache();
        if (cache[userZip]) {
          mapCenter = cache[userZip];
        } else {
          const coords = await geocodeZipWithGoogle(userZip, apiKey);
          if (coords) {
            mapCenter = coords;
            writeGeocodeCache(userZip, coords);
          }
        }
      }

      // Load the Google Maps API
      // Type assertion needed because @googlemaps/js-api-loader types are incomplete
      const { Map } = await (loader as unknown as { importLibrary: (name: string) => Promise<google.maps.MapsLibrary> }).importLibrary("maps");
      const { Marker } = await (loader as unknown as { importLibrary: (name: string) => Promise<google.maps.MarkerLibrary> }).importLibrary("marker");
      const { InfoWindow } = await (loader as unknown as { importLibrary: (name: string) => Promise<google.maps.MapsLibrary> }).importLibrary("maps");
      if (!isMounted || !mapContainerRef.current) return;

      const map = new Map(mapContainerRef.current, {
        center: mapCenter,
        zoom: clusteredFacilities.length === 0 && userZip ? HOME_SERVICE_ZOOM : DEFAULT_ZOOM,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapRef.current = map;

      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }

      const markers = clusteredFacilities.map((resource) => {
        const providerType = resource.provider_type ?? "";
        const isHomeService = resource.service_area_match === true;

        // Use SunsetWell Score for color if available, otherwise fall back to provider type colors
        const color = resource.sunsetwell_score !== undefined && resource.sunsetwell_score !== null
          ? getMarkerColor(resource.sunsetwell_score)
          : isHomeService
          ? HOME_SERVICE_COLORS[providerType] ?? "#22c55e"
          : FACILITY_COLORS[providerType] ?? "#3b82f6";

        const marker = new Marker({
          position: { lat: Number(resource.latitude), lng: Number(resource.longitude) },
          title: resource.title,
          icon: createMarkerIcon(color, isHomeService),
        });

        marker.addListener("click", () => {
          if (!infoWindowRef.current) {
            infoWindowRef.current = new InfoWindow();
          }

          const center = map.getCenter();
          let distanceText = "";
          if (resource.distance !== undefined) {
            distanceText = `${resource.distance.toFixed(1)} miles away`;
          } else if (center && google.maps.geometry?.spherical) {
            const markerPosition = marker.getPosition();
            if (markerPosition) {
              const distanceMeters = google.maps.geometry.spherical.computeDistanceBetween(center, markerPosition);
              distanceText = `${(distanceMeters / 1609.34).toFixed(1)} miles away`;
            }
          }

          const content = createInfoWindowContent(resource, distanceText);
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open({ map, anchor: marker });
        });

        return marker;
      });

      markersRef.current = markers;

      clustererRef.current = new MarkerClusterer({
        map,
        markers,
      });

      const updateVisible = () => {
        const bounds = map.getBounds();
        if (!bounds) return;
        const visible = markers.filter((marker) => bounds.contains(marker.getPosition()!)).length;
        setVisibleCount(visible);
        onVisibleChange?.(visible);
      };

      debouncedUpdate = debounce(updateVisible, 250);
      boundsListener = map.addListener("bounds_changed", debouncedUpdate);
      updateVisible();

      setLoading(false);
    }

    initializeMap();

    return () => {
      isMounted = false;
      if (boundsListener) {
        google.maps.event.removeListener(boundsListener);
      }
      debouncedUpdate?.cancel();
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
      infoWindowRef.current = null;
      mapRef.current = null;
    };
  }, [apiKey, loader, onVisibleChange, resources, userZip]);

  const handleSearchThisArea = () => {
    const map = mapRef.current;
    if (!map || !onBoundsSearch) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    onBoundsSearch(bounds.toJSON());
  };

  return (
    <div className="relative w-full">
      <div ref={mapContainerRef} className="h-[60vh] md:h-[600px] w-full rounded-xl border border-slate-200 shadow-sm" />
      <div className="absolute left-4 top-4 flex flex-col gap-2 rounded-xl bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-lg">
        <span>
          Showing {visibleCount.toLocaleString()} of {resources.length.toLocaleString()} facilities
        </span>
        {onBoundsSearch && (
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            onClick={handleSearchThisArea}
          >
            Search this area
          </button>
        )}
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
