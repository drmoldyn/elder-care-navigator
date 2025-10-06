import type {
  Resource,
  SessionContext,
  MatchScore,
  MatchedResource,
} from "@/types/domain";

/**
 * Scoring weights for matching algorithm
 * Total weight = 100 points distributed across factors
 */
const WEIGHTS = {
  CONDITION_EXACT_MATCH: 30,
  CONDITION_PARTIAL_MATCH: 15,
  URGENCY_MATCH: 25,
  LOCATION_EXACT: 20,
  LOCATION_NATIONAL: 10,
  AUDIENCE_MATCH: 10,
  LIVING_SITUATION_MATCH: 10,
  COST_MATCH: 5,
} as const;

/**
 * Score a single resource against a session context
 */
export function scoreResource(
  resource: Resource,
  session: SessionContext
): MatchScore {
  let score = 0;
  const reasons: string[] = [];

  // 1. Condition matching (30 points max)
  const conditionOverlap = session.conditions.filter((c) =>
    resource.conditions.includes(c)
  );
  if (conditionOverlap.length === session.conditions.length) {
    score += WEIGHTS.CONDITION_EXACT_MATCH;
    reasons.push(
      `Addresses all relevant conditions: ${conditionOverlap.join(", ")}`
    );
  } else if (conditionOverlap.length > 0) {
    score += WEIGHTS.CONDITION_PARTIAL_MATCH;
    reasons.push(`Relevant for ${conditionOverlap.join(", ")}`);
  }

  // 2. Urgency matching (25 points max)
  if (session.urgencyLevel && resource.urgencyLevel === session.urgencyLevel) {
    score += WEIGHTS.URGENCY_MATCH;
    reasons.push(`Matches your ${session.urgencyLevel} urgency`);
  }

  // 3. Location matching (20 points max for exact, 10 for national)
  if (resource.locationType === "national") {
    score += WEIGHTS.LOCATION_NATIONAL;
    reasons.push("Available nationwide");
  } else if (
    resource.locationType === "state_specific" &&
    session.state &&
    resource.states?.includes(session.state)
  ) {
    score += WEIGHTS.LOCATION_EXACT;
    reasons.push(`Available in ${session.state}`);
  } else if (
    resource.locationType === "local" &&
    session.zipCode &&
    resource.requiresZip
  ) {
    // TODO: Add ZIP proximity calculation when we implement geocoding
    score += WEIGHTS.LOCATION_EXACT;
    reasons.push("Available in your area");
  }

  // 4. Audience matching (10 points)
  if (resource.audience.includes("family_caregiver")) {
    score += WEIGHTS.AUDIENCE_MATCH;
    reasons.push("Designed for family caregivers");
  }

  // 5. Living situation matching (10 points)
  if (
    session.livingSituation &&
    resource.livingSituation?.includes(session.livingSituation)
  ) {
    score += WEIGHTS.LIVING_SITUATION_MATCH;
    reasons.push(`Suited for ${session.livingSituation.replace("_", " ")}`);
  }

  // 6. Cost/budget matching (5 points)
  if (session.budget) {
    if (
      resource.cost === "free" ||
      resource.cost === session.budget ||
      resource.cost === "sliding_scale"
    ) {
      score += WEIGHTS.COST_MATCH;
      reasons.push(`${resource.cost === "free" ? "Free resource" : "Matches budget"}`);
    }
  } else if (resource.cost === "free") {
    // Always boost free resources if no budget specified
    score += WEIGHTS.COST_MATCH;
    reasons.push("Free resource");
  }

  return {
    resourceId: resource.id,
    score: Math.min(score, 100), // Cap at 100
    reasons,
  };
}

/**
 * Rank matched resources into priority tiers
 */
export function rankResources(
  resources: Resource[],
  session: SessionContext
): MatchedResource[] {
  const scored = resources
    .map((resource) => ({
      resource,
      score: scoreResource(resource, session),
    }))
    .sort((a, b) => b.score.score - a.score.score);

  return scored.map((item) => {
    let priority: MatchedResource["priority"];
    if (item.score.score >= 70) {
      priority = "top";
    } else if (item.score.score >= 40) {
      priority = "recommended";
    } else {
      priority = "nice_to_have";
    }

    return {
      resource: item.resource,
      score: item.score,
      priority,
    };
  });
}

/**
 * Filter resources that don't meet minimum threshold
 */
export function filterByMinimumScore(
  matches: MatchedResource[],
  minScore = 20
): MatchedResource[] {
  return matches.filter((m) => m.score.score >= minScore);
}
