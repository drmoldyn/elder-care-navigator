"use client";

import { useState } from "react";
import { RelationshipStep } from "@/components/navigator/relationship-step";
import {
  createInitialNavigatorState,
  getNextStep,
} from "@/lib/navigator/state";
import type { NavigatorRelationshipOption } from "@/types/domain";

export default function NavigatorPage() {
  const [state, setState] = useState(createInitialNavigatorState());

  const handleRelationshipChange = (
    value: NavigatorRelationshipOption["value"]
  ) => {
    setState((prev) => ({
      ...prev,
      session: { ...prev.session, relationship: value },
    }));
  };

  const handleNext = () => {
    setState((prev) => ({
      ...prev,
      step: getNextStep(prev.step),
      completedSteps: new Set([...prev.completedSteps, prev.step]),
    }));
  };

  const handleSkip = () => {
    handleNext();
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
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i === 0 ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Relationship */}
      {state.step === "relationship" && (
        <RelationshipStep
          value={state.session.relationship}
          onChange={handleRelationshipChange}
          onNext={handleNext}
          onSkip={handleSkip}
        />
      )}

      {/* TODO: Add remaining steps (conditions, location, living_situation, urgency, review) */}
      {state.step !== "relationship" && (
        <div className="rounded-lg border border-dashed border-primary/40 bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Step &quot;{state.step}&quot; is under construction
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Current session: {JSON.stringify(state.session, null, 2)}
          </p>
        </div>
      )}
    </div>
  );
}
