"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GuidancePollResponse } from "@/types/api";

export default function ResultsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<GuidancePollResponse | null>(null);

  useEffect(() => {
    pollGuidance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const pollGuidance = async () => {
    try {
      const response = await fetch(`/api/guidance/${sessionId}`);
      if (!response.ok) throw new Error("Failed to load guidance");

      const data: GuidancePollResponse = await response.json();
      setGuidance(data);
      setLoading(false);

      // Keep polling if still pending
      if (data.status === "pending") {
        setTimeout(pollGuidance, 2000);
      }
    } catch {
      setError("Failed to load your personalized plan");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <h2 className="text-2xl font-bold">Finding Your Resources...</h2>
          <p className="mt-2 text-muted-foreground">
            We&apos;re matching you with the best support options
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16">
        <Card className="w-full max-w-2xl border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Something Went Wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.href = "/navigator"} className="mt-4">
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-16">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Your Personalized Care Plan
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here are the resources and next steps tailored to your situation
        </p>
      </div>

      {/* AI Guidance */}
      {guidance && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Personalized Guidance
              {guidance.fallback && (
                <Badge variant="outline" className="ml-auto">
                  General Advice
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {guidance.guidance?.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resources Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Resource display coming soon. Your session ID: {sessionId}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => window.location.href = "/navigator"}>
          Start New Search
        </Button>
        <Button onClick={() => window.print()}>
          Print This Plan
        </Button>
      </div>
    </div>
  );
}
