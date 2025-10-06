import type { Resource, SessionContext } from "@/types/domain";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Fallback guidance when Claude API is unavailable or rate-limited
 */
export const FALLBACK_GUIDANCE = `
## Your Personalized Care Plan

Based on your situation, here are immediate next steps:

### This Week
1. Review the matched resources below and bookmark the most relevant ones
2. Contact the 24/7 helplines if you need urgent support
3. Start gathering medical records and care history to share with providers

### This Month
1. Schedule consultations with recommended legal/financial advisors
2. Research local support groups and caregiver communities
3. Create a shared care calendar with family members

### Ongoing
- Check in weekly with your loved one (video calls work well)
- Monitor for changes in symptoms or behavior
- Build relationships with local neighbors who can do wellness checks

*This is general guidance. For personalized support, consider reaching out to the resources matched to your specific situation.*
`.trim();

interface GuidanceParams {
  session: SessionContext;
  matchedResources: Resource[];
}

/**
 * Generate personalized AI guidance using Claude Sonnet
 */
export async function generateGuidance({
  session,
  matchedResources,
}: GuidanceParams): Promise<{
  guidance: string;
  fallback: boolean;
}> {
  // If no API key, return fallback immediately
  if (!CLAUDE_API_KEY || CLAUDE_API_KEY === "TODO_ADD_LATER") {
    console.warn("Claude API key not configured, using fallback guidance");
    return { guidance: FALLBACK_GUIDANCE, fallback: true };
  }

  try {
    const prompt = buildGuidancePrompt(session, matchedResources);

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        `Claude API error: ${response.status} ${response.statusText}`
      );
      return { guidance: FALLBACK_GUIDANCE, fallback: true };
    }

    const data = await response.json();
    const guidance = data.content?.[0]?.text || FALLBACK_GUIDANCE;

    return { guidance, fallback: false };
  } catch (error) {
    console.error("Failed to generate AI guidance:", error);
    return { guidance: FALLBACK_GUIDANCE, fallback: true };
  }
}

/**
 * Build the prompt for Claude with context from session + matched resources
 */
function buildGuidancePrompt(
  session: SessionContext,
  resources: Resource[]
): string {
  const topResources = resources.slice(0, 5);

  return `You are a compassionate care coordinator helping a family caregiver supporting a loved one with dementia from a distance.

**Caregiver's Situation:**
- Relationship: ${session.relationship || "family member"}
- Conditions: ${session.conditions.join(", ")}
- Location: ${session.city && session.state ? `${session.city}, ${session.state}` : session.state || "not specified"}
- Living situation: ${session.livingSituation?.replace("_", " ") || "not specified"}
- Urgency factors: ${session.urgencyFactors.join(", ")}

**Top Matched Resources:**
${topResources.map((r, i) => `${i + 1}. ${r.title} - ${r.bestFor || r.description.slice(0, 100)}`).join("\n")}

**Task:**
Write a warm, actionable care plan (300-500 words) that:
1. Acknowledges their specific situation with empathy
2. Provides 3-5 concrete next steps organized by timeframe (this week, this month, ongoing)
3. References 2-3 of the matched resources naturally (by name, not URL)
4. Addresses their urgency factors directly
5. Ends with encouragement

Use a supportive, clear tone. Avoid medical advice. Focus on coordination, planning, and emotional support.`;
}
