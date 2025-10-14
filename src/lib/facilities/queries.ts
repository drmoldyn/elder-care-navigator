import { supabaseServer } from "@/lib/supabase/server";

interface FacilityScoreRow {
  overall_score: number;
  overall_percentile: number | null;
  calculation_date?: string | null;
}

interface FacilityRow {
  id: string;
  facility_id?: string | null;
  title: string;
  provider_type?: string | null;
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  states?: string[] | null;
  zip_code?: string | null;
  county?: string | null;
  contact_phone?: string | null;
  url?: string | null;
  total_beds?: number | null;
  ownership_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accepts_medicare?: boolean | null;
  accepts_medicaid?: boolean | null;
  accepts_private_pay?: boolean | null;
  overall_rating?: number | null;
  health_inspection_rating?: number | null;
  staffing_rating?: number | null;
  quality_measure_rating?: number | null;
  total_nurse_hours_per_resident_per_day?: number | null;
  rn_staffing_hours_per_resident_per_day?: number | null;
  number_of_substantiated_complaints?: number | null;
  number_of_facility_reported_incidents?: number | null;
  number_of_fines?: number | null;
  sunsetwell_scores?: FacilityScoreRow[] | null;
}

export interface FacilitySummary {
  id: string;
  facilityId: string | null;
  title: string;
  providerType: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  website: string | null;
  sunsetwellScore: number | null;
  sunsetwellPercentile: number | null;
}

export interface FacilityDetail extends FacilitySummary {
  county: string | null;
  totalBeds: number | null;
  ownershipType: string | null;
  acceptsMedicare: boolean | null;
  acceptsMedicaid: boolean | null;
  acceptsPrivatePay: boolean | null;
  overallRating: number | null;
  healthInspectionRating: number | null;
  staffingRating: number | null;
  qualityMeasureRating: number | null;
  nurseHoursPerResidentPerDay: number | null;
  rnHoursPerResidentPerDay: number | null;
  substantiatedComplaints: number | null;
  facilityReportedIncidents: number | null;
  fines: number | null;
  latitude: number | null;
  longitude: number | null;
  scoreUpdatedAt: string | null;
}

function mapFacilityRow(row: FacilityRow): FacilitySummary {
  const states = Array.isArray(row.states) ? row.states : [];
  const scores = row.sunsetwell_scores;
  const score = Array.isArray(scores) && scores.length > 0
    ? scores[0].overall_score ?? null
    : null;
  const percentile = Array.isArray(scores) && scores.length > 0
    ? scores[0].overall_percentile ?? null
    : null;

  return {
    id: row.id,
    facilityId: row.facility_id ?? null,
    title: row.title,
    providerType: row.provider_type ?? null,
    address: row.street_address ?? null,
    city: row.city ?? null,
    state: states.length > 0 ? states[0] ?? null : null,
    zipCode: row.zip_code ?? null,
    phone: row.contact_phone ?? null,
    website: row.url ?? null,
    sunsetwellScore: score,
    sunsetwellPercentile: percentile,
  };
}

function mapFacilityDetailRow(row: FacilityRow): FacilityDetail {
  const summary = mapFacilityRow(row);
  const scoreUpdatedAt = Array.isArray(row.sunsetwell_scores) && row.sunsetwell_scores.length > 0
    ? row.sunsetwell_scores[0].calculation_date ?? null
    : null;

  return {
    ...summary,
    county: row.county ?? null,
    totalBeds: row.total_beds ?? null,
    ownershipType: row.ownership_type ?? null,
    acceptsMedicare: row.accepts_medicare ?? null,
    acceptsMedicaid: row.accepts_medicaid ?? null,
    acceptsPrivatePay: row.accepts_private_pay ?? null,
    overallRating: row.overall_rating ?? null,
    healthInspectionRating: row.health_inspection_rating ?? null,
    staffingRating: row.staffing_rating ?? null,
    qualityMeasureRating: row.quality_measure_rating ?? null,
    nurseHoursPerResidentPerDay: row.total_nurse_hours_per_resident_per_day ?? null,
    rnHoursPerResidentPerDay: row.rn_staffing_hours_per_resident_per_day ?? null,
    substantiatedComplaints: row.number_of_substantiated_complaints ?? null,
    facilityReportedIncidents: row.number_of_facility_reported_incidents ?? null,
    fines: row.number_of_fines ?? null,
    latitude: typeof row.latitude === "number" ? row.latitude : null,
    longitude: typeof row.longitude === "number" ? row.longitude : null,
    scoreUpdatedAt,
  };
}

export async function getFacilitiesByFacilityIds(
  facilityIds: string[]
): Promise<FacilitySummary[]> {
  if (facilityIds.length === 0) {
    return [];
  }

  const uniqueIds = Array.from(new Set(facilityIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return [];
  }

  const { data, error } = await supabaseServer
    .from("resources")
    .select(
      `
        id,
        facility_id,
        title,
        provider_type,
        street_address,
        city,
        states,
        zip_code,
        contact_phone,
        website,
        sunsetwell_scores!inner(overall_score, overall_percentile, calculation_date)
      `
    )
    .order("calculation_date", { ascending: false, referencedTable: "sunsetwell_scores" })
    .limit(1, { referencedTable: "sunsetwell_scores" })
    .in("facility_id", uniqueIds);

  if (error) {
    console.error("[getFacilitiesByFacilityIds] Failed to load facilities", error);
    return [];
  }

  return (data as FacilityRow[]).map(mapFacilityRow);
}

export async function getFacilityById(id: string): Promise<FacilityDetail | null> {
  if (!id) {
    return null;
  }

  const { data, error } = await supabaseServer
    .from("resources")
    .select(
      `
        id,
        facility_id,
        title,
        provider_type,
        description,
        street_address,
        city,
        states,
        zip_code,
        county,
        contact_phone,
        website,
        total_beds,
        ownership_type,
        accepts_medicare,
        accepts_medicaid,
        accepts_private_pay,
        overall_rating,
        health_inspection_rating,
        staffing_rating,
        quality_measure_rating,
        total_nurse_hours_per_resident_per_day,
        rn_staffing_hours_per_resident_per_day,
        number_of_substantiated_complaints,
        number_of_facility_reported_incidents,
        number_of_fines,
        latitude,
        longitude,
        sunsetwell_scores!inner(overall_score, overall_percentile, calculation_date)
      `
    )
    .eq("id", id)
    .order("calculation_date", { ascending: false, referencedTable: "sunsetwell_scores" })
    .limit(1, { referencedTable: "sunsetwell_scores" })
    .maybeSingle();

  if (error) {
    console.error(`[getFacilityById] Failed to load facility ${id}`, error);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapFacilityDetailRow(data as FacilityRow);
}
