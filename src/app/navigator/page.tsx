"use client";

import { useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { RelationshipStep } from "@/components/navigator/relationship-step";
import { ConditionsStep } from "@/components/navigator/conditions-step";
import { CareTypeStep } from "@/components/navigator/care-type-step";
import { LocationStep } from "@/components/navigator/location-step";
import { LivingSituationStep } from "@/components/navigator/living-situation-step";
import { UrgencyStep } from "@/components/navigator/urgency-step";
import { ReviewStep } from "@/components/navigator/review-step";
import {
  createInitialNavigatorState,
  getNextStep,
  getPreviousStep,
  NAVIGATOR_STEPS,
} from "@/lib/navigator/state";
import { NavigatorMapView } from "@/components/navigator/map-view";
import type {
  NavigatorRelationshipOption,
  ResourceCondition,
  LivingSituation,
  NavigatorUrgencyFactor,
} from "@/types/domain";
import type { MatchResponsePayload } from "@/types/api";
import { geocodeZip } from "@/lib/location/geocode";

// Disable static generation for this page since it uses searchParams
export const dynamic = 'force-dynamic';

function NavigatorContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState(createInitialNavigatorState());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const isMapView = searchParams.get("view") === "map";

  const currentStepIndex = NAVIGATOR_STEPS.indexOf(state.step);

  const handleLocationChange = async (
    field: "city" | "state" | "zipCode" | "searchRadiusMiles",
    value: string | number
  ) => {
    let zipForGeocode: string | null = null;

    setState((prev) => {
      const nextSession = { ...prev.session };

      if (field === "searchRadiusMiles") {
        nextSession.searchRadiusMiles =
          typeof value === "number" ? value : Number(value) || prev.session.searchRadiusMiles;
      } else if (field === "zipCode" && typeof value === "string") {
        zipForGeocode = value.trim();
        nextSession.zipCode = zipForGeocode;
        delete nextSession.latitude;
        delete nextSession.longitude;
      } else if (field === "state" && typeof value === "string") {
        nextSession.state = value;
      } else if (field === "city" && typeof value === "string") {
        nextSession.city = value;
      }

      return {
        ...prev,
        session: nextSession,
      };
    });

    if (field === "zipCode") {
      const zip = typeof zipForGeocode === "string" ? zipForGeocode : typeof value === "string" ? value.trim() : "";

      if (zip.length === 5 && /^[0-9]{5}$/.test(zip) && googleApiKey) {
        const coords = await geocodeZip(zip);
        setState((prev) => ({
          ...prev,
          session: {
            ...prev.session,
            zipCode: zip,
            latitude: coords?.lat ?? undefined,
            longitude: coords?.lng ?? undefined,
          },
        }));
      } else {
        setState((prev) => ({
          ...prev,
          session: {
            ...prev.session,
            zipCode: zip,
            latitude: undefined,
            longitude: undefined,
          },
        }));
      }
    }
  };

  const setView = (view: "list" | "map") => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "map") {
      params.set("view", "map");
    } else {
      params.delete("view");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const viewToggle = (
    <div className="flex justify-center pb-6">
      <div className="inline-flex rounded-full border border-slate-200 bg-white/90 p-1 shadow">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            isMapView
              ? "text-slate-500 hover:text-slate-700"
              : "bg-sunset-orange text-white shadow"
          }`}
        >
          📋 List view
        </button>
        <button
          type="button"
          onClick={() => setView("map")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            isMapView
              ? "bg-sky-blue text-white shadow"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          🗺️ Map view
        </button>
      </div>
    </div>
  );

  const handleNext = () => {
    setState((prev) => ({
      ...prev,
      step: getNextStep(prev.step),
      completedSteps: new Set([...prev.completedSteps, prev.step]),
    }));
  };

  const handleBack = () => {
    setState((prev) => ({
      ...prev,
      step: getPreviousStep(prev.step),
    }));
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleEdit = (step: string) => {
    setState((prev) => ({
      ...prev,
      step: step as typeof state.step,
    }));
  };

  const handleSubmit = async (email?: string, emailSubscribed?: boolean) => {
    setIsSubmitting(true);
    const sessionPayload = {
      ...state.session,
      email,
      emailSubscribed,
    };
    setState((prev) => ({
      ...prev,
      session: sessionPayload,
    }));

    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: sessionPayload,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to match resources");
      }

      const data: MatchResponsePayload = await response.json();

      if (!data.sessionId) {
        throw new Error("Search session was not created");
      }

      router.push(`/results/${data.sessionId}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isMapView) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Hero Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/hero-5.jpg"
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
        <div className="relative z-10">
          {viewToggle}
          <NavigatorMapView />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Hero Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-5.jpg"
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
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-8 px-6 py-16 pb-32 md:pb-16">
        {viewToggle}
        <div className="w-full space-y-2 text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900">
            Personalized Senior Care Search
          </h1>
          <p className="text-gray-600">
            Answer a few questions to get matched with trusted support
          </p>
        </div>

      {/* Desktop Progress Bar */}
      <div className="hidden w-full max-w-2xl items-center gap-2 md:flex">
        {NAVIGATOR_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i <= currentStepIndex ? "bg-sunset-orange" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Mobile Step Indicator */}
      <div className="block w-full md:hidden">
        <div className="mb-3 flex items-center justify-center gap-2">
          {NAVIGATOR_STEPS.map((step, index) => (
            <div
              key={step}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                index === currentStepIndex
                  ? "bg-sunset-orange scale-125"
                  : index < currentStepIndex
                  ? "bg-sunset-orange"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Step {currentStepIndex + 1} of {NAVIGATOR_STEPS.length}
        </div>
      </div>

      {/* Step 1: Relationship */}
      {state.step === "relationship" && (
        <RelationshipStep
          value={state.session.relationship}
          onChange={(value: NavigatorRelationshipOption["value"]) =>
            setState((prev) => ({
              ...prev,
              session: { ...prev.session, relationship: value },
            }))
          }
          onNext={handleNext}
          onSkip={handleSkip}
        />
      )}

      {/* Step 2: Conditions */}
      {state.step === "conditions" && (
        <ConditionsStep
          value={state.session.conditions}
          onChange={(value: ResourceCondition[]) =>
            setState((prev) => ({
              ...prev,
              session: { ...prev.session, conditions: value },
            }))
          }
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      )}

      {/* Step 3: Care Type */}
      {state.step === "care_type" && (
        <CareTypeStep
          value={state.session.careType}
          onChange={(value) =>
            setState((prev) => ({
              ...prev,
              session: { ...prev.session, careType: value },
            }))
          }
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {/* Step 4: Location */}
      {state.step === "location" && (
        <LocationStep
          city={state.session.city}
          state={state.session.state}
          zipCode={state.session.zipCode}
          searchRadiusMiles={state.session.searchRadiusMiles}
          onChange={handleLocationChange}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      )}

      {/* Step 5: Living Situation */}
      {state.step === "living_situation" && (
        <LivingSituationStep
          value={state.session.livingSituation}
          onChange={(value: LivingSituation) =>
            setState((prev) => ({
              ...prev,
              session: { ...prev.session, livingSituation: value },
            }))
          }
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      )}

      {/* Step 6: Urgency */}
      {state.step === "urgency" && (
        <UrgencyStep
          value={state.session.urgencyFactors}
          onChange={(value: NavigatorUrgencyFactor["value"][]) =>
            setState((prev) => ({
              ...prev,
              session: { ...prev.session, urgencyFactors: value },
            }))
          }
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {/* Step 7: Review */}
      {state.step === "review" && (
        <ReviewStep
          session={state.session}
          onEdit={handleEdit}
          onSubmit={handleSubmit}
          onBack={handleBack}
          onEmailSubscribedChange={(value) =>
            setState((prev) => ({
              ...prev,
              session: { ...prev.session, emailSubscribed: value },
            }))
          }
          isSubmitting={isSubmitting}
        />
      )}

        {/* Sticky Mobile Navigation - Only shown on mobile */}
        {state.step !== "review" && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg md:hidden">
            <div className="mx-auto flex max-w-4xl gap-3">
              {currentStepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="flex-1 rounded-xl bg-gray-200 py-3.5 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={
                  (state.step === "relationship" && !state.session.relationship) ||
                  (state.step === "conditions" && state.session.conditions.length === 0) ||
                  (state.step === "care_type" && !state.session.careType)
                }
                className="flex-1 rounded-xl bg-gradient-to-r from-sunset-orange to-sunset-gold py-3.5 font-semibold text-white transition-all hover:from-sunset-gold hover:to-sunset-orange disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500"
              >
                Continue →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NavigatorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <NavigatorContent />
    </Suspense>
  );
}
