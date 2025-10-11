import type { MatchScore, MatchedResource, SessionContext } from "@/types/domain";

export interface MatchRequestPayload {
  session: SessionContext;
  preview?: boolean;
}

export interface MatchResponseResource {
  resourceId: string;
  score: MatchScore;
  rank: MatchedResource["priority"];
}

export interface MatchResponseResourceSummary {
  id: string;
  title: string;
  providerType?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  overallRating?: number | null;
  sunsetwellScore?: number | null;
  distanceMiles?: number | null;
  serviceAreaMatch?: boolean;
  serviceAreaZip?: string | null;
}

export interface MatchResponsePayload {
  sessionId: string | null;
  resources: MatchResponseResource[];
  resourceSummaries?: MatchResponseResourceSummary[];
  guidance: {
    status: "pending" | "complete" | "failed";
    jobId: string;
  };
}

export interface GuidancePollResponse {
  sessionId: string;
  status: "pending" | "complete" | "failed";
  guidance?: string;
  fallback?: boolean;
}

export interface RateLimitContext {
  ip?: string;
  sessionId?: string;
  userAgent?: string;
}

export interface CsvImportSummary {
  inserted: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

export interface CsvImportContract {
  columns: string[];
  delimiter: "," | ";";
  encoding: "utf-8" | "utf-16";
  sampleFile: string;
}
