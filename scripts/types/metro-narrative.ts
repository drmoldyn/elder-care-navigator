/**
 * Enhanced metro data structure with rich narrative content for SEO
 */

export interface MetroNarrative {
  // Extended market overview
  marketOverview: {
    qualityLandscape: string; // 2-3 paragraphs about overall quality
    supplyDemand: string; // Info about bed availability, waitlists
    regionalTrends: string; // Unique characteristics of this market
    medicaidAccess: string; // Medicaid acceptance patterns
  };

  // Cost analysis
  costAnalysis: {
    averageDailyRate: number | null;
    priceRangeByTier: {
      exceptional: string; // "$650-850/day"
      excellent: string;
      aboveAverage: string;
      mixed: string;
      lower: string;
    };
    monthlyEstimate: string; // "$10,500-25,500/month"
    stateComparison: string; // "15% above state average"
    fundingOptions: string[]; // Array of funding option descriptions
  };

  // Decision framework
  decisionFramework: {
    qualityPriority: {
      recommendation: string;
      facilities: string[]; // Top 3 facility names
      reasoning: string;
    };
    medicaidNeeded: {
      recommendation: string;
      facilities: string[];
      reasoning: string;
      waitlistInfo: string;
    };
    urgentPlacement: {
      recommendation: string;
      facilities: string[];
      alternatives: string;
    };
    budgetConstrained: {
      recommendation: string;
      facilities: string[];
      costSavingTips: string[];
    };
  };

  // FAQs
  faqs: Array<{
    question: string;
    answer: string;
    category: 'waitlist' | 'cost' | 'quality' | 'medicaid' | 'placement' | 'other';
  }>;

  // Local resources
  localResources: {
    stateOmbudsman: {
      name: string;
      phone: string;
      website: string;
    };
    areaAgencyOnAging: {
      name: string;
      phone: string;
      website: string;
    };
    stateHealthDept: {
      name: string;
      website: string;
    };
    elderLawReferral: {
      name: string;
      website: string;
    };
    vaOffice?: {
      name: string;
      phone: string;
      address: string;
    };
  };

  // Key statistics for quick reference
  keyStats: {
    topTierCount: number; // Facilities scoring 75+
    medicaidFacilityCount: number;
    averageWaitlistWeeks: number | null;
    hasUrgentOptions: boolean;
    qualityGap: number; // Difference between highest and lowest score
  };
}

export interface EnhancedMetroData {
  // Original data
  metro: string;
  city: string;
  state: string;
  count: number;
  averageScore: string;
  highPerformerShare: number;
  narrative: string;
  table: Array<{
    rank: number;
    facilityId: string;
    title: string;
    score: number;
    percentile: number;
    health: number | null;
    staffing: number | null;
    quality: number | null;
    rnHours: number | null;
    totalNurseHours: number | null;
  }>;

  // Enhanced narrative content
  enhancedNarrative?: MetroNarrative;
}
