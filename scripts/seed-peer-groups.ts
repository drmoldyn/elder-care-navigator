#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

import { ProviderType } from "./scoring/config";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MIN_STATE_SIZE = Number(process.env.PEER_GROUP_MIN_STATE ?? 30);
const MIN_DIVISION_SIZE = Number(process.env.PEER_GROUP_MIN_DIVISION ?? 60);
const MIN_SEGMENT_SIZE = Number(process.env.PEER_GROUP_MIN_SEGMENT ?? 20);

const PROVIDER_DB_MAP: Record<ProviderType, string[]> = {
  nursing_home: ["nursing_home"],
  assisted_living: ["assisted_living", "assisted_living_facility"],
  home_health: ["home_health", "home_health_agency"],
  hospice: ["hospice"],
};

const FACILITY_LABELS: Record<ProviderType, string> = {
  nursing_home: "Nursing Homes",
  assisted_living: "Assisted Living",
  home_health: "Home Health",
  hospice: "Hospice",
};

const SIZE_BOUNDS: Record<ProviderType, number[] | undefined> = {
  nursing_home: [0, 60, 120, 180, Number.POSITIVE_INFINITY],
  assisted_living: [0, 50, 100, 150, Number.POSITIVE_INFINITY],
  home_health: undefined,
  hospice: undefined,
};

const STATE_TO_DIVISION: Record<string, { code: string; name: string }> = {
  AL: { code: "east_south_central", name: "East South Central" },
  AK: { code: "pacific", name: "Pacific" },
  AZ: { code: "mountain", name: "Mountain" },
  AR: { code: "west_south_central", name: "West South Central" },
  CA: { code: "pacific", name: "Pacific" },
  CO: { code: "mountain", name: "Mountain" },
  CT: { code: "new_england", name: "New England" },
  DC: { code: "south_atlantic", name: "South Atlantic" },
  DE: { code: "south_atlantic", name: "South Atlantic" },
  FL: { code: "south_atlantic", name: "South Atlantic" },
  GA: { code: "south_atlantic", name: "South Atlantic" },
  HI: { code: "pacific", name: "Pacific" },
  IA: { code: "west_north_central", name: "West North Central" },
  ID: { code: "mountain", name: "Mountain" },
  IL: { code: "east_north_central", name: "East North Central" },
  IN: { code: "east_north_central", name: "East North Central" },
  KS: { code: "west_north_central", name: "West North Central" },
  KY: { code: "east_south_central", name: "East South Central" },
  LA: { code: "west_south_central", name: "West South Central" },
  MA: { code: "new_england", name: "New England" },
  MD: { code: "south_atlantic", name: "South Atlantic" },
  ME: { code: "new_england", name: "New England" },
  MI: { code: "east_north_central", name: "East North Central" },
  MN: { code: "west_north_central", name: "West North Central" },
  MO: { code: "west_north_central", name: "West North Central" },
  MS: { code: "east_south_central", name: "East South Central" },
  MT: { code: "mountain", name: "Mountain" },
  NC: { code: "south_atlantic", name: "South Atlantic" },
  ND: { code: "west_north_central", name: "West North Central" },
  NE: { code: "west_north_central", name: "West North Central" },
  NH: { code: "new_england", name: "New England" },
  NJ: { code: "mid_atlantic", name: "Mid-Atlantic" },
  NM: { code: "mountain", name: "Mountain" },
  NV: { code: "mountain", name: "Mountain" },
  NY: { code: "mid_atlantic", name: "Mid-Atlantic" },
  OH: { code: "east_north_central", name: "East North Central" },
  OK: { code: "west_south_central", name: "West South Central" },
  OR: { code: "pacific", name: "Pacific" },
  PA: { code: "mid_atlantic", name: "Mid-Atlantic" },
  PR: { code: "caribbean", name: "Caribbean" },
  RI: { code: "new_england", name: "New England" },
  SC: { code: "south_atlantic", name: "South Atlantic" },
  SD: { code: "west_north_central", name: "West North Central" },
  TN: { code: "east_south_central", name: "East South Central" },
  TX: { code: "west_south_central", name: "West South Central" },
  UT: { code: "mountain", name: "Mountain" },
  VA: { code: "south_atlantic", name: "South Atlantic" },
  VT: { code: "new_england", name: "New England" },
  WA: { code: "pacific", name: "Pacific" },
  WI: { code: "east_north_central", name: "East North Central" },
  WV: { code: "south_atlantic", name: "South Atlantic" },
  WY: { code: "mountain", name: "Mountain" },
};

const PROVIDER_TYPES: ProviderType[] = [
  "nursing_home",
  "assisted_living",
  "home_health",
  "hospice",
];

type OwnershipCategory = "for_profit" | "non_profit_or_gov" | "other";

interface FacilityResource {
  id: string;
  provider_type: string | null;
  states: string[] | null;
  total_beds: number | null;
  number_of_certified_beds: number | null;
  licensed_capacity: number | null;
  ownership_type: string | null;
}

interface FacilityDerived {
  id: string;
  providerType: ProviderType;
  state: string | null;
  bedCapacity: number | null;
  ownershipRaw: string | null;
  ownershipCategory: OwnershipCategory;
}

interface BaseGroup {
  label: string;
  facilityType: ProviderType;
  states: string[];
  facilities: FacilityDerived[];
  scope: "state" | "division" | "national";
}

interface SizeSegment {
  label: string;
  facilities: FacilityDerived[];
  criteria: Record<string, unknown>;
}

interface PeerGroupInsert {
  name: string;
  description: string;
  facility_type: ProviderType;
  criteria: Record<string, unknown>;
}

function ownershipCategory(value: string | null): OwnershipCategory {
  if (!value) return "other";
  const normalized = value.toLowerCase();
  if (normalized.includes("for profit")) return "for_profit";
  if (normalized.includes("non profit") || normalized.includes("non-profit") || normalized.includes("government")) {
    return "non_profit_or_gov";
  }
  return "other";
}

function extractState(states: string[] | null): string | null {
  if (!states || states.length === 0) return null;
  const candidate = states[0]?.trim().toUpperCase();
  return candidate && candidate.length === 2 ? candidate : null;
}

function determineCapacity(providerType: ProviderType, row: FacilityResource): number | null {
  const toNumber = (value: number | null): number | null => {
    if (value === null || Number.isNaN(value)) return null;
    return value;
  };

  switch (providerType) {
    case "nursing_home":
      return toNumber(row.total_beds) ?? toNumber(row.number_of_certified_beds);
    case "assisted_living":
      return toNumber(row.licensed_capacity) ?? toNumber(row.total_beds);
    default:
      return null;
  }
}

async function fetchFacilities(providerType: ProviderType): Promise<FacilityDerived[]> {
  const dbValues = PROVIDER_DB_MAP[providerType];
  const pageSize = 1000;
  let from = 0;
  const results: FacilityDerived[] = [];

  while (true) {
    const { data, error } = await supabase
      .from<FacilityResource>("resources")
      .select(
        "id, provider_type, states, total_beds, number_of_certified_beds, licensed_capacity, ownership_type"
      )
      .in("provider_type", dbValues)
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    const batch = data ?? [];
    batch.forEach((row) => {
      results.push({
        id: row.id,
        providerType,
        state: extractState(row.states),
        bedCapacity: determineCapacity(providerType, row),
        ownershipRaw: row.ownership_type,
        ownershipCategory: ownershipCategory(row.ownership_type),
      });
    });

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return results;
}

function buildBaseGroups(providerType: ProviderType, facilities: FacilityDerived[]): BaseGroup[] {
  const baseGroups: BaseGroup[] = [];
  const stateBuckets = new Map<string, FacilityDerived[]>();
  const divisionBuckets = new Map<string, FacilityDerived[]>();
  const nationalBucket: FacilityDerived[] = [];

  facilities.forEach((facility) => {
    const state = facility.state;
    if (!state) {
      nationalBucket.push(facility);
      return;
    }
    if (!stateBuckets.has(state)) stateBuckets.set(state, []);
    stateBuckets.get(state)!.push(facility);
  });

  const remainder: FacilityDerived[] = [];

  stateBuckets.forEach((bucket, state) => {
    if (bucket.length >= MIN_STATE_SIZE) {
      baseGroups.push({
        label: state,
        facilityType: providerType,
        states: [state],
        facilities: bucket,
        scope: "state",
      });
    } else {
      remainder.push(...bucket);
    }
  });

  remainder.forEach((facility) => {
    const state = facility.state;
    if (!state) {
      nationalBucket.push(facility);
      return;
    }
    const division = STATE_TO_DIVISION[state];
    if (!division) {
      nationalBucket.push(facility);
      return;
    }
    if (!divisionBuckets.has(division.code)) divisionBuckets.set(division.code, []);
    divisionBuckets.get(division.code)!.push(facility);
  });

  divisionBuckets.forEach((bucket, code) => {
    if (bucket.length >= MIN_DIVISION_SIZE) {
      const states = Array.from(new Set(bucket.map((f) => f.state).filter(Boolean))) as string[];
      const divisionInfo = STATE_TO_DIVISION[states[0] ?? ""] ?? { code, name: code };
      baseGroups.push({
        label: divisionInfo.name,
        facilityType: providerType,
        states,
        facilities: bucket,
        scope: "division",
      });
    } else {
      nationalBucket.push(...bucket);
    }
  });

  if (nationalBucket.length > 0) {
    const states = Array.from(new Set(nationalBucket.map((f) => f.state).filter(Boolean))) as string[];
    baseGroups.push({
      label: states.length ? `Multi-State (${states.length})` : "National",
      facilityType: providerType,
      states,
      facilities: nationalBucket,
      scope: "national",
    });
  }

  return baseGroups;
}

function computeSizeSegments(group: BaseGroup): SizeSegment[] {
  const bounds = SIZE_BOUNDS[group.facilityType];
  if (!bounds || bounds.length < 2) {
    return [
      {
        label: "All sizes",
        facilities: group.facilities,
        criteria: {},
      },
    ];
  }

  const withCapacity = group.facilities.filter((facility) => facility.bedCapacity !== null);
  const withoutCapacity = group.facilities.filter((facility) => facility.bedCapacity === null);

  const segments: SizeSegment[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const min = bounds[i];
    const max = bounds[i + 1];
    const bucketFacilities = withCapacity.filter((facility) => {
      const capacity = facility.bedCapacity ?? 0;
      const meetsMin = capacity >= min;
      const meetsMax = max === Number.POSITIVE_INFINITY ? true : capacity < max;
      return meetsMin && meetsMax;
    });

    if (bucketFacilities.length > 0) {
      const label = max === Number.POSITIVE_INFINITY ? `${min}+ beds` : `${min}-${max - 1} beds`;
      segments.push({
        label,
        facilities: bucketFacilities,
        criteria: {
          bed_count_min: min,
          bed_count_max: max === Number.POSITIVE_INFINITY ? null : max,
        },
      });
    }
  }

  const segmentsMeetThreshold =
    segments.length > 0 && segments.every((segment) => segment.facilities.length >= MIN_SEGMENT_SIZE);

  if (!segmentsMeetThreshold) {
    return [
      {
        label: "All sizes",
        facilities: group.facilities,
        criteria: {},
      },
    ];
  }

  if (withoutCapacity.length >= MIN_SEGMENT_SIZE) {
    segments.push({
      label: "Capacity Unknown",
      facilities: withoutCapacity,
      criteria: { allow_unknown_bed_count: true },
    });
  } else if (withoutCapacity.length > 0) {
    const fallbackSegment = segments[segments.length - 1];
    fallbackSegment.facilities.push(...withoutCapacity);
    fallbackSegment.criteria.allow_unknown_bed_count = true;
  }

  return segments;
}

function splitByOwnership(segment: SizeSegment): SizeSegment[] {
  const forProfit = segment.facilities.filter((facility) => facility.ownershipCategory === "for_profit");
  const nonProfit = segment.facilities.filter((facility) => facility.ownershipCategory !== "for_profit");

  if (forProfit.length >= MIN_SEGMENT_SIZE && nonProfit.length >= MIN_SEGMENT_SIZE) {
    return [
      {
        label: `${segment.label} · For-Profit`,
        facilities: forProfit,
        criteria: {
          ...segment.criteria,
          ownership_types: uniqueOwnershipValues(forProfit),
          ownership_categories: ["for_profit"],
        },
      },
      {
        label: `${segment.label} · Non-Profit/Government`,
        facilities: nonProfit,
        criteria: {
          ...segment.criteria,
          ownership_types: uniqueOwnershipValues(nonProfit),
          ownership_categories: ["non_profit_or_gov"],
        },
      },
    ];
  }

  return [
    {
      label: segment.label,
      facilities: segment.facilities,
      criteria: {
        ...segment.criteria,
        ownership_types: uniqueOwnershipValues(segment.facilities),
      },
    },
  ];
}

function uniqueOwnershipValues(facilities: FacilityDerived[]): string[] {
  const set = new Set<string>();
  facilities.forEach((facility) => {
    const raw = facility.ownershipRaw?.toLowerCase();
    if (raw) set.add(raw);
  });
  return Array.from(set);
}

function sanitizeCriteria(criteria: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  Object.entries(criteria).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value) && value.length === 0) return;
    result[key] = value;
  });
  return result;
}

function buildPeerGroupsForProvider(providerType: ProviderType, facilities: FacilityDerived[]): PeerGroupInsert[] {
  if (facilities.length === 0) return [];

  const baseGroups = buildBaseGroups(providerType, facilities);
  const peerGroups: PeerGroupInsert[] = [];

  baseGroups.forEach((baseGroup) => {
    const sizeSegments = computeSizeSegments(baseGroup);
    sizeSegments.forEach((sizeSegment) => {
      const ownershipSegments = splitByOwnership(sizeSegment);
      ownershipSegments.forEach((segment) => {
        if (segment.facilities.length < MIN_SEGMENT_SIZE) return;

        const criteria: Record<string, unknown> = {
          states: baseGroup.states,
          ...sanitizeCriteria(segment.criteria),
        };

        if (!criteria.states || (Array.isArray(criteria.states) && criteria.states.length === 0)) {
          delete criteria.states;
        }

        const name = [FACILITY_LABELS[providerType], baseGroup.label, segment.label]
          .filter(Boolean)
          .join(" · ");

        const description = `${segment.facilities.length} facilities · ${segment.label}`;

        peerGroups.push({
          name,
          description,
          facility_type: providerType,
          criteria,
        });
      });
    });
  });

  return peerGroups;
}

async function upsertPeerGroups(providerType: ProviderType, peerGroups: PeerGroupInsert[]) {
  if (peerGroups.length === 0) {
    console.log(`⚠️  No peer groups generated for ${providerType}.`);
    return;
  }

  const deleteResult = await supabase.from("peer_groups").delete().eq("facility_type", providerType);
  if (deleteResult.error) throw deleteResult.error;

  const batchSize = 500;
  for (let i = 0; i < peerGroups.length; i += batchSize) {
    const batch = peerGroups.slice(i, i + batchSize);
    const { error } = await supabase.from("peer_groups").upsert(batch);
    if (error) throw error;
  }

  console.log(`✅ Inserted ${peerGroups.length} peer groups for ${providerType}.`);
}

async function seedPeerGroups() {
  try {
    for (const providerType of PROVIDER_TYPES) {
      console.log(`\n🔍 Building peer groups for ${FACILITY_LABELS[providerType]}...`);
      const facilities = await fetchFacilities(providerType);
      const stateCount = new Set(facilities.map((facility) => facility.state).filter(Boolean)).size;
      console.log(`   • Retrieved ${facilities.length} facilities spanning ${stateCount} states.`);

      const peerGroups = buildPeerGroupsForProvider(providerType, facilities);
      await upsertPeerGroups(providerType, peerGroups);
    }

    console.log(`\n🏁 Peer group seeding complete.`);
  } catch (error) {
    const raw = error as { message?: string } | undefined;
    const message = typeof raw?.message === "string"
      ? raw.message
      : error instanceof Error
      ? error.message
      : "";

    if (message.includes("Could not find the table 'public.peer_groups'")) {
      console.error(`\n❌ peer_groups table not found. Apply supabase/migrations/0014_sunsetwell_scoring.sql before running this script.`);
      process.exit(1);
    }

    console.error(`\n❌ Failed to seed peer groups:`, error);
    process.exit(1);
  }
}

seedPeerGroups();
