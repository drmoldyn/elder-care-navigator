"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CareType } from "@/types/domain";

interface CareTypeOption {
  value: CareType;
  title: string;
  description: string;
  emoji: string;
}

const CARE_TYPE_OPTIONS: CareTypeOption[] = [
  {
    value: "facility",
    title: "Care facility",
    description: "Compare nursing homes, assisted living, and memory care communities near your loved one.",
    emoji: "🏥",
  },
  {
    value: "home_services",
    title: "Home services",
    description: "Find home health agencies, hospice, and in-home support that come to the person's residence.",
    emoji: "🏡",
  },
  {
    value: "both",
    title: "Show me both",
    description: "See nearby facilities and in-home providers side-by-side so you can compare all options.",
    emoji: "🔄",
  },
];

interface CareTypeStepProps {
  value?: CareType;
  onChange: (value: CareType) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CareTypeStep({ value, onChange, onNext, onBack }: CareTypeStepProps) {
  const selected = useMemo(() => CARE_TYPE_OPTIONS.find((option) => option.value === value), [value]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>What type of care are you considering?</CardTitle>
        <p className="text-sm text-muted-foreground">
          We’ll tailor your matches based on whether you need a facility, in-home care, or both.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {CARE_TYPE_OPTIONS.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`flex items-start gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary/70 ${
                  isActive ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <span className="text-2xl" aria-hidden="true">{option.emoji}</span>
                <div className="space-y-1">
                  <p className="font-medium">{option.title}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                {isActive && (
                  <svg
                    className="ml-auto h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 text-sm text-primary">
            You chose: <span className="font-medium">{selected.title}</span>. You can change this later in the review step.
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} disabled={!value}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
