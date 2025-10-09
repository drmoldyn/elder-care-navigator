"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RelationshipStep } from "@/components/navigator/relationship-step";
import { ConditionsStep } from "@/components/navigator/conditions-step";
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
import type {
  NavigatorRelationshipOption,
  ResourceCondition,
  LivingSituation,
  NavigatorUrgencyFactor,
} from "@/types/domain";

export default function NavigatorPage() {
  const router = useRouter();
  const [state, setState] = useState(createInitialNavigatorState());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = NAVIGATOR_STEPS.indexOf(state.step);

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

  const handleSubmit = async (email?: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: {
            ...state.session,
            email,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to match resources");
      }

      const data = await response.json();
      router.push(`/results/${data.sessionId}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="w-full space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Find Personalized Care Resources
        </h1>
        <p className="text-muted-foreground">
          Answer a few questions to get matched with trusted support
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex w-full max-w-2xl items-center gap-2">
        {NAVIGATOR_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i <= currentStepIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
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

      {/* Step 3: Location */}
      {state.step === "location" && (
        <LocationStep
          city={state.session.city}
          state={state.session.state}
          zipCode={state.session.zipCode}
          onChange={(field, value) =>
            setState((prev) => ({
              ...prev,
              session: { ...prev.session, [field]: value },
            }))
          }
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      )}

      {/* Step 4: Living Situation */}
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

      {/* Step 5: Urgency */}
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

      {/* Step 6: Review */}
      {state.step === "review" && (
        <ReviewStep
          session={state.session}
          onEdit={handleEdit}
          onSubmit={handleSubmit}
          onBack={handleBack}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
