"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { SessionContext } from "@/types/domain";

interface ReviewStepProps {
  session: SessionContext;
  onEdit: (step: string) => void;
  onSubmit: (email?: string, emailSubscribed?: boolean) => void;
  onBack: () => void;
  onEmailSubscribedChange: (value: boolean) => void;
  isSubmitting?: boolean;
}

export function ReviewStep({
  session,
  onEdit,
  onSubmit,
  onBack,
  onEmailSubscribedChange,
  isSubmitting = false,
}: ReviewStepProps) {
  const [email, setEmail] = useState(session.email || "");
  const [emailSubscribed, setEmailSubscribed] = useState(session.emailSubscribed ?? false);

  useEffect(() => {
    setEmail(session.email || "");
  }, [session.email]);

  useEffect(() => {
    setEmailSubscribed(session.emailSubscribed ?? false);
  }, [session.emailSubscribed]);

  const careTypeLabelMap: Record<string, string> = {
    facility: "Care facility",
    home_services: "Home services",
    both: "Both facility and home services",
  };

  const handleSubmit = () => {
    const subscribed = email ? emailSubscribed : false;
    onSubmit(email || undefined, subscribed);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Review Your Information</CardTitle>
        <p className="text-sm text-muted-foreground">
          Double-check your details before we find the best resources for you.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Relationship */}
        {session.relationship && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Relationship</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit("relationship")}
              >
                Edit
              </Button>
            </div>
            <p className="text-sm capitalize">
              {session.relationship.replace("_", " ")}
            </p>
          </div>
        )}

        {/* Conditions */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">Health Conditions</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit("conditions")}
            >
              Edit
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.conditions.map((condition) => (
              <Badge key={condition} variant="secondary">
                {condition.replace("_", " ")}
              </Badge>
            ))}
          </div>
        </div>

        {/* Care Type */}
        {session.careType && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Care Preferences</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit("care_type")}
              >
                Edit
              </Button>
            </div>
            <p className="text-sm">
              {careTypeLabelMap[session.careType] ?? session.careType.replace("_", " ")}
            </p>
          </div>
        )}

        {/* Location */}
        {(session.city || session.state || session.zipCode) && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Location</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit("location")}
              >
                Edit
              </Button>
            </div>
            <p className="text-sm">
              {[session.city, session.state, session.zipCode]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}

        {/* Living Situation */}
        {session.livingSituation && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Living Situation</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit("living_situation")}
              >
                Edit
              </Button>
            </div>
            <p className="text-sm capitalize">
              {session.livingSituation.replace("_", " ")}
            </p>
          </div>
        )}

        {/* Urgency Factors */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">Current Priorities</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit("urgency")}
            >
              Edit
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.urgencyFactors.map((factor) => (
              <Badge key={factor} variant="secondary">
                {factor.replace("_", " ")}
              </Badge>
            ))}
          </div>
        </div>

        {/* Optional Email */}
        <div className="space-y-3 rounded-lg border border-dashed border-sunset-orange/40 bg-sunset-orange/5 p-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Email (optional)
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => {
                const nextEmail = e.target.value;
                setEmail(nextEmail);
                if (!nextEmail) {
                  setEmailSubscribed(false);
                  onEmailSubscribedChange(false);
                }
              }}
              className="h-12"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Get your personalized care plan and resource list via email
            </p>
          </div>

          {email && (
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={emailSubscribed}
                onChange={(e) => {
                  setEmailSubscribed(e.target.checked);
                  onEmailSubscribedChange(e.target.checked);
                }}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-sunset-orange focus:ring-sunset-orange"
              />
              <span className="text-muted-foreground">
                Send me updates about new resources and support options
              </span>
            </label>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
            className="bg-gradient-to-r from-sunset-orange to-sunset-gold hover:from-sunset-gold hover:to-sunset-orange"
          >
            {isSubmitting ? "Finding Resources..." : "Get My Resources"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
