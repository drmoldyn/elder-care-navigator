"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NavigatorUrgencyFactor } from "@/types/domain";

const URGENCY_OPTIONS: NavigatorUrgencyFactor[] = [
  {
    value: "safety_concern",
    label: "Safety concerns (wandering, falls, fire risk)",
  },
  {
    value: "medical_change",
    label: "Recent medical changes or new diagnosis",
  },
  {
    value: "caregiver_burnout",
    label: "Caregiver stress or burnout",
  },
  {
    value: "planning",
    label: "Planning for future needs",
  },
  {
    value: "financial",
    label: "Financial or legal concerns",
  },
];

interface UrgencyStepProps {
  value: NavigatorUrgencyFactor["value"][];
  onChange: (value: NavigatorUrgencyFactor["value"][]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function UrgencyStep({ value, onChange, onNext, onBack }: UrgencyStepProps) {
  const toggleFactor = (factor: NavigatorUrgencyFactor["value"]) => {
    if (value.includes(factor)) {
      onChange(value.filter((f) => f !== factor));
    } else {
      onChange([...value, factor]);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>What brings you here today?</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select all factors that apply. This helps us prioritize the most
          relevant resources.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {URGENCY_OPTIONS.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => toggleFactor(option.value)}
                className={`flex items-start gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="h-3 w-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <p className="flex-1 font-medium">{option.label}</p>
              </button>
            );
          })}
        </div>

        {value.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Selected:</span>
            {value.map((factor) => {
              const option = URGENCY_OPTIONS.find((o) => o.value === factor);
              return (
                <Badge key={factor} variant="secondary">
                  {option?.label}
                </Badge>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} disabled={value.length === 0}>
            Continue to Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
