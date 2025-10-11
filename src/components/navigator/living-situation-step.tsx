"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LivingSituation } from "@/types/domain";

const LIVING_SITUATION_OPTIONS: Array<{
  value: LivingSituation;
  label: string;
  description: string;
}> = [
  {
    value: "alone",
    label: "Living alone",
    description: "Independent living without regular in-home support",
  },
  {
    value: "with_family",
    label: "Living with family",
    description: "Staying with family members or relatives",
  },
  {
    value: "facility",
    label: "In a care facility",
    description: "Assisted living, memory care, or nursing home",
  },
  {
    value: "long_distance",
    label: "Long-distance (100+ miles away)",
    description: "Managing care from afar without daily in-person support",
  },
];

interface LivingSituationStepProps {
  value?: LivingSituation;
  onChange: (value: LivingSituation) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export function LivingSituationStep({
  value,
  onChange,
  onNext,
  onBack,
  onSkip,
}: LivingSituationStepProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>What is their current living situation?</CardTitle>
        <p className="text-sm text-muted-foreground">
          Understanding the living arrangement helps us recommend appropriate
          support services.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {LIVING_SITUATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex min-h-[48px] items-start justify-between gap-4 rounded-lg border p-4 text-left transition-all hover:border-sunset-orange ${
                value === option.value
                  ? "border-sunset-orange bg-sunset-orange/5 ring-2 ring-sunset-orange/20"
                  : "border-border"
              }`}
            >
              <div className="flex-1">
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
              {value === option.value && (
                <svg
                  className="h-5 w-5 shrink-0 text-sunset-orange"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="hidden items-center justify-between pt-4 md:flex">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <div className="flex gap-2">
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>
                Skip
              </Button>
            )}
            <Button
              onClick={onNext}
              disabled={!value}
              className="bg-gradient-to-r from-sunset-orange to-sunset-gold hover:from-sunset-gold hover:to-sunset-orange"
            >
              Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
