import { z } from "zod";

export const facilityClaimRequestSchema = z.object({
  facilityId: z.string().uuid({ message: "facilityId must be a valid UUID" }),
  requesterName: z.string().trim().min(1).max(120),
  requesterEmail: z.string().email(),
  requesterPhone: z.string().trim().min(7).max(40).optional(),
  message: z.string().trim().max(1000).optional(),
});

export type FacilityClaimRequestInput = z.infer<typeof facilityClaimRequestSchema>;

export const availabilityUpdateSchema = z.object({
  facilityId: z.string().uuid({ message: "facilityId must be a valid UUID" }),
  accountId: z.string().uuid().optional(),
  bedsAvailable: z.number().int().min(0).max(1000).nullable().optional(),
  waitlistWeeks: z.number().int().min(0).max(52).nullable().optional(),
  acceptsMedicaid: z.boolean().optional(),
  acceptsMedicare: z.boolean().optional(),
  acceptsPrivatePay: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type AvailabilityUpdateInput = z.infer<typeof availabilityUpdateSchema>;

export const leadPreferenceSchema = z.object({
  facilityId: z.string().uuid({ message: "facilityId must be a valid UUID" }),
  notifyEmail: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  notificationEmail: z.string().email().optional(),
  notificationPhone: z.string().trim().max(40).optional(),
});

export type LeadPreferenceInput = z.infer<typeof leadPreferenceSchema>;
