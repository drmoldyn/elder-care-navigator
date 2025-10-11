export interface FacilityAccount {
  id: string;
  facilityId: string;
  contactName?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  role: "admin" | "editor" | "viewer" | string;
  status: "pending" | "active" | "suspended" | string;
  inviteToken?: string | null;
  lastSignedInAt?: string | null;
  notifyEmail: boolean;
  notifySms: boolean;
  notificationEmail?: string | null;
  notificationPhone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FacilityClaimRequest {
  id: string;
  facilityId: string;
  requesterName?: string | null;
  requesterEmail: string;
  requesterPhone?: string | null;
  message?: string | null;
  status: "pending" | "approved" | "rejected" | string;
  createdAt: string;
  reviewedAt?: string | null;
  reviewerId?: string | null;
}

export interface FacilityAvailabilityUpdate {
  id: string;
  facilityId: string;
  accountId?: string | null;
  bedsAvailable?: number | null;
  waitlistWeeks?: number | null;
  acceptsMedicaid?: boolean | null;
  acceptsMedicare?: boolean | null;
  acceptsPrivatePay?: boolean | null;
  notes?: string | null;
  createdAt: string;
}
