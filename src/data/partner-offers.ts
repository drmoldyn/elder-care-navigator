export type PartnerCategory =
  | "legal"
  | "financial"
  | "home_modification"
  | "alert_devices"
  | "care_management"
  | "relocation";

export interface PartnerOffer {
  id: string;
  name: string;
  category: PartnerCategory;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  commissionType: "cpa" | "cpl" | "revshare" | "flat";
  commissionNotes?: string;
}

export const partnerOffers: PartnerOffer[] = [
  {
    id: "elder-law-pros",
    name: "Elder Law Pros",
    category: "legal",
    description: "Medicaid spend-down planning, trusts, and power of attorney documents for families navigating long-term care decisions.",
    ctaLabel: "Refer to elder law attorney",
    ctaUrl: "https://example.com/partner/elder-law-pros",
    commissionType: "cpl",
    commissionNotes: "$150 per qualified consult",
  },
  {
    id: "veteran-benefits-advisors",
    name: "Veteran Benefits Advisors",
    category: "financial",
    description: "Specialists in VA Aid & Attendance applications with 4-week average approval timelines.",
    ctaLabel: "Connect veteran with advisor",
    ctaUrl: "https://example.com/partner/va-advisors",
    commissionType: "cpl",
    commissionNotes: "$125 per submitted claim",
  },
  {
    id: "safe-home-upgrades",
    name: "Safe Home Upgrades",
    category: "home_modification",
    description: "Nationwide installers for stair lifts, grab bars, and bathroom conversions tailored for aging in place.",
    ctaLabel: "Schedule home assessment",
    ctaUrl: "https://example.com/partner/safe-home",
    commissionType: "revshare",
    commissionNotes: "10% of project value",
  },
  {
    id: "lifeline-alert",
    name: "LifeLine Alert",
    category: "alert_devices",
    description: "24/7 monitoring devices with automatic fall detection and caregiver mobile app.",
    ctaLabel: "Offer medical alert device",
    ctaUrl: "https://example.com/partner/lifeline",
    commissionType: "cpa",
    commissionNotes: "$90 per device activation",
  },
  {
    id: "care-companion-services",
    name: "Care Companion Services",
    category: "care_management",
    description: "Certified care managers providing in-home assessments, ongoing oversight, and placement support in 30+ states.",
    ctaLabel: "Refer to care manager",
    ctaUrl: "https://example.com/partner/care-companion",
    commissionType: "cpl",
    commissionNotes: "$85 per qualified introduction",
  },
  {
    id: "senior-relocation-co",
    name: "Senior Relocation Co.",
    category: "relocation",
    description: "End-to-end downsizing, packing, and move management tailored for senior transitions.",
    ctaLabel: "Book relocation consult",
    ctaUrl: "https://example.com/partner/relocation",
    commissionType: "flat",
    commissionNotes: "$200 per booked move",
  },
];
