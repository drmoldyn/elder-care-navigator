"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ResourceCondition } from "@/types/domain";

const CONDITION_OPTIONS: Array<{
  value: ResourceCondition;
  label: string;
  description: string;
}> = [
  {
    value: "dementia",
    label: "Dementia/Alzheimer's",
    description: "Memory loss, confusion, difficulty with daily tasks",
  },
  {
    value: "mobility",
    label: "Mobility Issues",
    description: "Difficulty walking, fall risk, wheelchair use",
  },
  {
    value: "chronic",
    label: "Chronic Illness",
    description: "Diabetes, heart disease, COPD, etc.",
  },
  {
    value: "mental_health",
    label: "Mental Health",
    description: "Depression, anxiety, behavioral changes",
  },
  {
    value: "multiple",
    label: "Multiple Conditions",
    description: "Combination of several health concerns",
  },
];

interface ConditionsStepProps {
  value: ResourceCondition[];
  onChange: (value: ResourceCondition[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export function ConditionsStep({
  value,
  onChange,
  onNext,
  onBack,
  onSkip,
}: ConditionsStepProps) {
  const toggleCondition = (condition: ResourceCondition) => {
    if (value.includes(condition)) {
      onChange(value.filter((c) => c !== condition));
    } else {
      onChange([...value, condition]);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          What health conditions are you managing together?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select all that apply. This helps us match relevant medical and
          support resources.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {CONDITION_OPTIONS.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => toggleCondition(option.value)}
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
                <div className="flex-1">
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {value.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Selected:</span>
            {value.map((condition) => {
              const option = CONDITION_OPTIONS.find(
                (o) => o.value === condition
              );
              return (
                <Badge key={condition} variant="secondary">
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
          <div className="flex gap-2">
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>
                I&apos;m not sure
              </Button>
            )}
            <Button onClick={onNext} disabled={value.length === 0}>
              Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
