import { z } from "zod";

import {
  AUDIENCE_TYPES,
  COST_TYPES,
  LIVING_SITUATIONS,
  LOCATION_TYPES,
  NavigatorStep,
  RESOURCE_CATEGORIES,
  RESOURCE_CONDITIONS,
  SOURCE_AUTHORITIES,
  URGENCY_LEVELS,
} from "@/types/domain";

const enumSchema = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values);

export const resourceCategorySchema = enumSchema(
  RESOURCE_CATEGORIES as unknown as typeof RESOURCE_CATEGORIES &
    readonly [string, ...string[]]
);

export const resourceConditionSchema = enumSchema(
  RESOURCE_CONDITIONS as unknown as typeof RESOURCE_CONDITIONS &
    readonly [string, ...string[]]
);

export const urgencyLevelSchema = enumSchema(
  URGENCY_LEVELS as unknown as typeof URGENCY_LEVELS & readonly [string, ...string[]]
);

export const locationTypeSchema = enumSchema(
  LOCATION_TYPES as unknown as typeof LOCATION_TYPES & readonly [string, ...string[]]
);

export const audienceTypeSchema = enumSchema(
  AUDIENCE_TYPES as unknown as typeof AUDIENCE_TYPES & readonly [string, ...string[]]
);

export const livingSituationSchema = enumSchema(
  LIVING_SITUATIONS as unknown as typeof LIVING_SITUATIONS &
    readonly [string, ...string[]]
);

export const costTypeSchema = enumSchema(
  COST_TYPES as unknown as typeof COST_TYPES & readonly [string, ...string[]]
);

export const sourceAuthoritySchema = enumSchema(
  SOURCE_AUTHORITIES as unknown as typeof SOURCE_AUTHORITIES &
    readonly [string, ...string[]]
);

export const navigatorStepSchema = enumSchema(
  ["relationship", "conditions", "location", "living_situation", "urgency", "review"] as const
);

export const zipCodeSchema = z
  .string()
  .regex(/^[0-9]{5}(?:-[0-9]{4})?$/, "Enter a valid US ZIP code")
  .transform((value) => value.trim());

export const sessionContextSchema = z
  .object({
    relationship: z
      .enum(["adult_child", "spouse", "other_family", "friend"] as const)
      .optional(),
    conditions: z
      .array(resourceConditionSchema)
      .min(1, "Select at least one condition"),
    zipCode: zipCodeSchema.optional(),
    city: z.string().min(2).max(120).optional(),
    state: z
      .string()
      .length(2, "Use 2-letter state code")
      .transform((value) => value.toUpperCase())
      .optional(),
    searchRadiusMiles: z
      .number()
      .min(10)
      .max(500)
      .default(50)
      .optional(),
    livingSituation: livingSituationSchema.optional(),
    urgencyLevel: urgencyLevelSchema.optional(),
    urgencyFactors: z
      .array(
        z.enum(
          [
            "safety_concern",
            "medical_change",
            "caregiver_burnout",
            "planning",
            "financial",
          ] as const
        )
      )
      .min(1, "Select at least one urgency factor"),
    careGoals: z.array(z.string().min(2).max(120)).optional(),
    budget: costTypeSchema.optional(),
    email: z.string().email().optional(),
  });

export type SessionContextInput = z.infer<typeof sessionContextSchema>;

export const resourceRecordSchema = z.object({
  title: z.string().min(3),
  url: z.string().url(),
  description: z.string().min(12),
  best_for: z.string().optional(),
  category: z.string(),
  conditions: z.string(),
  urgency_level: urgencyLevelSchema,
  location_type: locationTypeSchema,
  states: z.string().optional(),
  requires_zip: z
    .enum(["TRUE", "FALSE"] as const)
    .transform((value) => value === "TRUE"),
  audience: z.string(),
  living_situation: z.string().optional(),
  cost: costTypeSchema,
  contact_phone: z.string().optional().or(z.literal("")),
  contact_email: z.string().email().optional().or(z.literal("")),
  hours_available: z.string().optional().or(z.literal("")),
  affiliate_url: z.string().url().optional().or(z.literal("")),
  affiliate_network: z.string().optional().or(z.literal("")),
  is_sponsored: z
    .enum(["TRUE", "FALSE"] as const)
    .transform((value) => value === "TRUE")
    .optional(),
  source_authority: sourceAuthoritySchema,
  last_verified: z.string().datetime().optional(),
});

export type ResourceRecordInput = z.infer<typeof resourceRecordSchema>;

export const matchStepSchema: z.ZodType<NavigatorStep> = navigatorStepSchema;

export const matchRequestSchema = z.object({
  session: sessionContextSchema,
  preview: z.boolean().default(false),
});

export const matchResponseSchema = z.object({
  sessionId: z.string().uuid(),
  resources: z.array(
    z.object({
      resourceId: z.string().uuid(),
      score: z.number().min(0),
      rank: z.enum(["top", "recommended", "nice_to_have"] as const),
      reasons: z.array(z.string().min(2)),
    })
  ),
  guidance: z.object({
    status: z.enum(["pending", "complete", "failed"] as const),
    jobId: z.string().uuid(),
  }),
});

export const guidancePollResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.enum(["pending", "complete", "failed"] as const),
  guidance: z.string().optional(),
  fallback: z.boolean().optional(),
});

export const rateLimitContextSchema = z.object({
  ip: z.string().optional(),
  sessionId: z.string().uuid().optional(),
  userAgent: z.string().optional(),
});

export type MatchResponsePayload = z.infer<typeof matchResponseSchema>;
