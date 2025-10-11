export type ProviderType =
  | "nursing_home"
  | "assisted_living"
  | "home_health"
  | "hospice";

export interface MetricDefinition {
  key: string;
  column: string;
  providerTypes: ProviderType[];
  higherIsBetter: boolean;
  description: string;
}

export const METRICS: MetricDefinition[] = [
  {
    key: "staffing_rating",
    column: "staffing_rating",
    providerTypes: ["nursing_home"],
    higherIsBetter: true,
    description: "CMS staffing star rating",
  },
  {
    key: "health_inspection_rating",
    column: "health_inspection_rating",
    providerTypes: ["nursing_home"],
    higherIsBetter: true,
    description: "CMS inspection star rating",
  },
  {
    key: "quality_measure_rating",
    column: "quality_measure_rating",
    providerTypes: ["nursing_home"],
    higherIsBetter: true,
    description: "CMS quality measure star rating",
  },
  {
    key: "total_nurse_hours_per_resident_per_day",
    column: "total_nurse_hours_per_resident_per_day",
    providerTypes: ["nursing_home"],
    higherIsBetter: true,
    description: "Total nurse hours per resident per day",
  },
  {
    key: "rn_hours_per_resident_per_day",
    column: "rn_hours_per_resident_per_day",
    providerTypes: ["nursing_home"],
    higherIsBetter: true,
    description: "Registered nurse hours per resident per day",
  },
  {
    key: "total_nurse_staff_turnover",
    column: "total_nurse_staff_turnover",
    providerTypes: ["nursing_home"],
    higherIsBetter: false,
    description: "Total nurse staff turnover percent",
  },
  {
    key: "rn_turnover",
    column: "rn_turnover",
    providerTypes: ["nursing_home"],
    higherIsBetter: false,
    description: "Registered nurse staff turnover percent",
  },
  {
    key: "number_of_facility_reported_incidents",
    column: "number_of_facility_reported_incidents",
    providerTypes: ["nursing_home"],
    higherIsBetter: false,
    description: "Facility reported incidents (past 3 years)",
  },
  {
    key: "number_of_substantiated_complaints",
    column: "number_of_substantiated_complaints",
    providerTypes: ["nursing_home"],
    higherIsBetter: false,
    description: "Substantiated complaints (past 3 years)",
  },
  {
    key: "licensed_capacity",
    column: "licensed_capacity",
    providerTypes: ["assisted_living"],
    higherIsBetter: true,
    description: "Licensed resident capacity",
  },
  {
    key: "medicaid_accepted",
    column: "medicaid_accepted",
    providerTypes: ["assisted_living"],
    higherIsBetter: true,
    description: "Medicaid accepted (boolean treated as numeric)",
  },
  {
    key: "home_health_quality_star",
    column: "home_health_quality_star",
    providerTypes: ["home_health"],
    higherIsBetter: true,
    description: "CMS home health quality star rating",
  },
  {
    key: "home_health_cahps_star",
    column: "home_health_cahps_star",
    providerTypes: ["home_health"],
    higherIsBetter: true,
    description: "CMS home health CAHPS star rating",
  },
  {
    key: "hospice_quality_star",
    column: "hospice_quality_star",
    providerTypes: ["hospice"],
    higherIsBetter: true,
    description: "Hospice quality star rating",
  },
  {
    key: "hospice_family_experience_star",
    column: "hospice_family_experience_star",
    providerTypes: ["hospice"],
    higherIsBetter: true,
    description: "Hospice family experience star rating",
  },
];

export const DEFAULT_WEIGHTS: Record<ProviderType, Record<string, number>> = {
  nursing_home: {
    health_inspection_rating: 0.53,
    staffing_rating: 0.14,
    total_nurse_hours_per_resident_per_day: 0.09,
    rn_hours_per_resident_per_day: 0.09,
    total_nurse_staff_turnover: 0.06,
    rn_turnover: 0.04,
    quality_measure_rating: 0.05,
    number_of_facility_reported_incidents: 0,
    number_of_substantiated_complaints: 0,
  },
  assisted_living: {
    licensed_capacity: 0.4,
    medicaid_accepted: 0.6,
  },
  home_health: {
    home_health_quality_star: 0.6,
    home_health_cahps_star: 0.4,
  },
  hospice: {
    hospice_quality_star: 0.6,
    hospice_family_experience_star: 0.4,
  },
};

export function getMetricsForProvider(providerType: ProviderType): MetricDefinition[] {
  return METRICS.filter((metric) => metric.providerTypes.includes(providerType));
}
