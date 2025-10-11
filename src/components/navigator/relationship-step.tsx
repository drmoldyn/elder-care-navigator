"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { NavigatorRelationshipOption } from "@/types/domain";

const RELATIONSHIP_OPTIONS: NavigatorRelationshipOption[] = [
  { value: "adult_child", label: "Adult child" },
  { value: "spouse", label: "Spouse/Partner" },
  { value: "other_family", label: "Other family member" },
  { value: "friend", label: "Friend or neighbor" },
];

interface RelationshipStepProps {
  value?: NavigatorRelationshipOption["value"];
  onChange: (value: NavigatorRelationshipOption["value"]) => void;
  onNext: () => void;
  onSkip?: () => void;
}

export function RelationshipStep({
  value,
  onChange,
  onNext,
  onSkip,
}: RelationshipStepProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>What is your relationship to the person you care for?</CardTitle>
        <p className="text-sm text-muted-foreground">
          This helps us recommend resources tailored to your situation.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {RELATIONSHIP_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex min-h-[48px] items-center justify-between rounded-lg border p-4 text-left transition-all hover:border-sunset-orange ${
                value === option.value
                  ? "border-sunset-orange bg-sunset-orange/5 ring-2 ring-sunset-orange/20"
                  : "border-border"
              }`}
            >
              <span className="font-medium">{option.label}</span>
              {value === option.value && (
                <svg
                  className="h-5 w-5 text-sunset-orange"
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
          {onSkip && (
            <Button variant="ghost" onClick={onSkip}>
              Skip this step
            </Button>
          )}
          <Button
            onClick={onNext}
            disabled={!value}
            className="ml-auto bg-gradient-to-r from-sunset-orange to-sunset-gold hover:from-sunset-gold hover:to-sunset-orange"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
