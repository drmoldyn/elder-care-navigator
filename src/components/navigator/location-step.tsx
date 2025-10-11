"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

interface LocationStepProps {
  city?: string;
  state?: string;
  zipCode?: string;
  searchRadiusMiles?: number;
  onChange: (field: "city" | "state" | "zipCode" | "searchRadiusMiles", value: string | number) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export function LocationStep({
  city,
  state,
  zipCode,
  searchRadiusMiles = 50,
  onChange,
  onNext,
  onBack,
  onSkip,
}: LocationStepProps) {
  const isValid = state || zipCode;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Where does your loved one live?</CardTitle>
        <p className="text-sm text-muted-foreground">
          This helps us find local resources, support groups, and services in
          their area.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="city"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              City (optional)
            </label>
            <Input
              id="city"
              type="text"
              placeholder="e.g., Portland"
              value={city || ""}
              onChange={(e) => onChange("city", e.target.value)}
              className="h-12"
            />
          </div>

          <div>
            <label
              htmlFor="state"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              State
            </label>
            <select
              id="state"
              value={state || ""}
              onChange={(e) => onChange("state", e.target.value)}
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunset-orange/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a state</option>
              {US_STATES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="zipCode"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              ZIP Code (optional)
            </label>
            <Input
              id="zipCode"
              type="text"
              placeholder="e.g., 97201"
              value={zipCode || ""}
              onChange={(e) => onChange("zipCode", e.target.value)}
              pattern="[0-9]{5}"
              maxLength={5}
              className="h-12"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              For more precise local resource matching
            </p>
          </div>

          {zipCode && (
            <div>
              <label
                htmlFor="searchRadius"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Search radius: {searchRadiusMiles} miles
              </label>
              <input
                id="searchRadius"
                type="range"
                min="10"
                max="500"
                step="10"
                value={searchRadiusMiles}
                onChange={(e) => onChange("searchRadiusMiles", parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10 mi</span>
                <span>250 mi</span>
                <span>500 mi</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {searchRadiusMiles <= 30 && "Nearby facilities only"}
                {searchRadiusMiles > 30 && searchRadiusMiles <= 100 && "Within your metro area"}
                {searchRadiusMiles > 100 && searchRadiusMiles <= 250 && "Regional search - good for rural areas"}
                {searchRadiusMiles > 250 && "Wide search - covers multiple states"}
              </p>
            </div>
          )}
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
              disabled={!isValid}
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
