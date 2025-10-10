export const RESOURCE_CATEGORIES = [
  "crisis",
  "legal",
  "financial",
  "education",
  "support",
  "products",
  "local",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const RESOURCE_CONDITIONS = [
  "dementia",
  "mobility",
  "chronic",
  "mental_health",
  "multiple",
] as const;

export type ResourceCondition = (typeof RESOURCE_CONDITIONS)[number];

export const URGENCY_LEVELS = ["immediate", "this_week", "ongoing"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const LOCATION_TYPES = [
  "national",
  "state_specific",
  "local",
] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

export const AUDIENCE_TYPES = [
  "family_caregiver",
  "professional",
  "patient",
] as const;

export type AudienceType = (typeof AUDIENCE_TYPES)[number];

export const LIVING_SITUATIONS = [
  "alone",
  "with_family",
  "facility",
  "long_distance",
] as const;

export type LivingSituation = (typeof LIVING_SITUATIONS)[number];

export const CARE_TYPES = [
  "facility",
  "home_services",
  "both",
] as const;

export type CareType = (typeof CARE_TYPES)[number];

export const COST_TYPES = [
  "free",
  "paid",
  "insurance",
  "sliding_scale",
] as const;

export type CostType = (typeof COST_TYPES)[number];

export const SOURCE_AUTHORITIES = [
  "nih",
  "alzheimers_assoc",
  "mayo_clinic",
  "government",
  "other",
] as const;

export type SourceAuthority = (typeof SOURCE_AUTHORITIES)[number];

export interface Resource {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  url: string;
  description: string;
  bestFor?: string;
  category: ResourceCategory[];
  conditions: ResourceCondition[];
  urgencyLevel: UrgencyLevel;
  locationType: LocationType;
  states?: string[] | null;
  requiresZip?: boolean;
  audience: AudienceType[];
  livingSituation?: LivingSituation[] | null;
  cost: CostType;
  contactPhone?: string | null;
  contactEmail?: string | null;
  hoursAvailable?: string | null;
  affiliateUrl?: string | null;
  affiliateNetwork?: string | null;
  isSponsored?: boolean;
  sourceAuthority: SourceAuthority;
  lastVerified?: string | null;
  clickCount?: number;
  upvotes?: number;
}

export interface NavigatorRelationshipOption {
  value: "adult_child" | "spouse" | "other_family" | "friend";
  label: string;
}

export interface NavigatorUrgencyFactor {
  value:
    | "safety_concern"
    | "medical_change"
    | "caregiver_burnout"
    | "planning"
    | "financial";
  label: string;
}

export interface SessionContext {
  relationship?: NavigatorRelationshipOption["value"];
  conditions: ResourceCondition[];
  zipCode?: string;
  city?: string;
  state?: string;
  searchRadiusMiles?: number; // Default: 50 miles
  livingSituation?: LivingSituation;
  urgencyLevel?: UrgencyLevel;
  urgencyFactors: NavigatorUrgencyFactor["value"][];
  careGoals?: string[];
  budget?: CostType;
  careType?: CareType;
  email?: string;
  emailSubscribed?: boolean;
}

export interface UserSession {
  id: string;
  createdAt: string;
  relationship?: SessionContext["relationship"];
  conditions: ResourceCondition[];
  zipCode?: string;
  city?: string;
  state?: string;
  careType?: CareType;
  livingSituation: LivingSituation;
  urgencyFactors: NavigatorUrgencyFactor["value"][];
  email?: string;
  emailSubscribed?: boolean;
  matchedResources: string[];
  aiGuidance?: string | null;
  completedAt?: string | null;
  resourcesClicked?: string[];
  pdfDownloaded?: boolean;
  leadsSubmitted?: number;
}

export interface MatchScore {
  resourceId: string;
  score: number;
  reasons: string[];
}

export interface MatchedResource {
  resource: Resource;
  score: MatchScore;
  priority: "top" | "recommended" | "nice_to_have";
}

export interface GuidanceJobMetadata {
  sessionId: string;
  status: "pending" | "complete" | "failed";
  lastCheckedAt: string;
  fallbackUsed?: boolean;
}

export const MATCH_STEPS = [
  "relationship",
  "conditions",
  "care_type",
  "location",
  "living_situation",
  "urgency",
  "review",
] as const;

export type NavigatorStep = (typeof MATCH_STEPS)[number];
