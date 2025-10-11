/**
 * Facility Identifier Lookup Library
 *
 * Helper functions for looking up resources using the facility_identifiers crosswalk table.
 * These functions enable linking facilities across different data sources using multiple
 * identifier types (CCN, NPI, state licenses, etc.).
 *
 * Part of Phase 4 of the Data Acquisition Plan.
 *
 * @module identifier-lookup
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Identifier types supported by the system
export type IdentifierType = 'CCN' | 'NPI' | 'STATE_LICENSE' | 'MEDICARE_ID' | 'MEDICAID_ID';

// Data source types
export type IdentifierSource = 'CMS' | 'STATE_LICENSING' | 'MANUAL' | 'IMPORT' | 'API';

// Resource type from database (minimal fields for lookups)
export interface Resource {
  id: string;
  title: string;
  provider_type: string | null;
  state: string | null;
  city: string | null;
  zip_code: string | null;
  facility_id: string | null;
  npi: string | null;
}

// Facility identifier record
export interface FacilityIdentifier {
  id: string;
  resource_id: string;
  identifier_type: IdentifierType;
  identifier_value: string;
  state: string | null;
  source: IdentifierSource;
  confidence_score: number;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Input for adding new identifiers
export interface AddIdentifierInput {
  resourceId: string;
  type: IdentifierType;
  value: string;
  source: IdentifierSource;
  state?: string | null;
  confidence?: number;
}

// Input for linking resources by multiple identifiers
export interface LinkIdentifier {
  type: IdentifierType;
  value: string;
  state?: string | null;
}

type IdentifierWithResource = {
  resource_id: string;
  resources: Resource;
};

/**
 * Initialize Supabase client for lookups
 * Uses service role for write operations, anon key for reads
 */
function getSupabaseClient(useServiceRole: boolean = false): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing Supabase credentials. Required: NEXT_PUBLIC_SUPABASE_URL and ${
        useServiceRole ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      }`
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Find a resource by CCN (CMS Certification Number)
 *
 * @param ccn - The CMS Certification Number to search for
 * @returns The matching resource or null if not found
 *
 * @example
 * const resource = await findResourceByCCN('123456');
 * if (resource) {
 *   console.log(`Found: ${resource.title}`);
 * }
 */
export async function findResourceByCCN(ccn: string): Promise<Resource | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from<IdentifierWithResource>('facility_identifiers')
    .select('resource_id, resources!inner(id, title, provider_type, state, city, zip_code, facility_id, npi)')
    .eq('identifier_type', 'CCN')
    .eq('identifier_value', ccn.trim())
    .single();

  if (error || !data) {
    return null;
  }

  return data.resources;
}

/**
 * Find a resource by NPI (National Provider Identifier)
 *
 * @param npi - The National Provider Identifier to search for
 * @returns The matching resource or null if not found
 *
 * @example
 * const resource = await findResourceByNPI('1234567890');
 * if (resource) {
 *   console.log(`Found: ${resource.title}`);
 * }
 */
export async function findResourceByNPI(npi: string): Promise<Resource | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from<IdentifierWithResource>('facility_identifiers')
    .select('resource_id, resources!inner(id, title, provider_type, state, city, zip_code, facility_id, npi)')
    .eq('identifier_type', 'NPI')
    .eq('identifier_value', npi.trim())
    .single();

  if (error || !data) {
    return null;
  }

  return data.resources;
}

/**
 * Find a resource by state license number
 *
 * @param state - The two-letter state code (e.g., 'CA', 'FL')
 * @param license - The state license number to search for
 * @returns The matching resource or null if not found
 *
 * @example
 * const resource = await findResourceByStateLicense('CA', 'ALF-123456');
 * if (resource) {
 *   console.log(`Found: ${resource.title}`);
 * }
 */
export async function findResourceByStateLicense(
  state: string,
  license: string
): Promise<Resource | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from<IdentifierWithResource>('facility_identifiers')
    .select('resource_id, resources!inner(id, title, provider_type, state, city, zip_code, facility_id, npi)')
    .eq('identifier_type', 'STATE_LICENSE')
    .eq('identifier_value', license.trim())
    .eq('state', state.toUpperCase())
    .single();

  if (error || !data) {
    return null;
  }

  return data.resources;
}

/**
 * Add a new identifier to a resource
 *
 * @param input - The identifier details to add
 * @returns The created identifier record
 * @throws Error if the identifier already exists or if validation fails
 *
 * @example
 * await addIdentifier({
 *   resourceId: 'abc-123',
 *   type: 'STATE_LICENSE',
 *   value: 'ALF-789',
 *   source: 'STATE_LICENSING',
 *   state: 'FL',
 *   confidence: 1.0
 * });
 */
export async function addIdentifier(input: AddIdentifierInput): Promise<FacilityIdentifier> {
  const supabase = getSupabaseClient(true); // Use service role for writes

  // Validate input
  if (!input.resourceId || !input.type || !input.value || !input.source) {
    throw new Error('Missing required fields: resourceId, type, value, source');
  }

  // Validate state for state-specific identifiers
  if (input.type === 'STATE_LICENSE' && !input.state) {
    throw new Error('State is required for STATE_LICENSE identifiers');
  }

  // Validate confidence score
  const confidence = input.confidence ?? 1.0;
  if (confidence < 0 || confidence > 1.0) {
    throw new Error('Confidence score must be between 0 and 1.0');
  }

  // Prepare the record
  const record = {
    resource_id: input.resourceId,
    identifier_type: input.type,
    identifier_value: input.value.trim(),
    state: input.state ? input.state.toUpperCase() : null,
    source: input.source,
    confidence_score: confidence,
  };

  const { data, error } = await supabase
    .from<FacilityIdentifier>('facility_identifiers')
    .insert(record)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to add identifier: ${error?.message ?? 'Unknown error'}`);
  }

  return data;
}

/**
 * Find a resource by trying multiple identifiers in priority order
 *
 * Attempts to match using the provided identifiers in order until a match is found.
 * This is useful when importing data that may have multiple identifier types.
 *
 * @param identifiers - Array of identifiers to try, in priority order
 * @returns The first matching resource found, or null if no matches
 *
 * @example
 * const resource = await linkResources([
 *   { type: 'CCN', value: '123456' },
 *   { type: 'NPI', value: '1234567890' },
 *   { type: 'STATE_LICENSE', value: 'ALF-789', state: 'FL' }
 * ]);
 */
export async function linkResources(identifiers: LinkIdentifier[]): Promise<Resource | null> {
  if (!identifiers || identifiers.length === 0) {
    return null;
  }

  // Try each identifier in order
  for (const identifier of identifiers) {
    let resource: Resource | null = null;

    switch (identifier.type) {
      case 'CCN':
        resource = await findResourceByCCN(identifier.value);
        break;

      case 'NPI':
        resource = await findResourceByNPI(identifier.value);
        break;

      case 'STATE_LICENSE':
        if (identifier.state) {
          resource = await findResourceByStateLicense(identifier.state, identifier.value);
        }
        break;

      case 'MEDICARE_ID':
      case 'MEDICAID_ID':
        // Generic lookup for other identifier types
        resource = await findResourceByIdentifier(identifier.type, identifier.value, identifier.state);
        break;
    }

    if (resource) {
      return resource;
    }
  }

  return null;
}

/**
 * Generic identifier lookup for any identifier type
 *
 * @param type - The identifier type to search for
 * @param value - The identifier value
 * @param state - Optional state for state-specific identifiers
 * @returns The matching resource or null if not found
 */
export async function findResourceByIdentifier(
  type: IdentifierType,
  value: string,
  state?: string | null
): Promise<Resource | null> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from<IdentifierWithResource>('facility_identifiers')
    .select('resource_id, resources!inner(id, title, provider_type, state, city, zip_code, facility_id, npi)')
    .eq('identifier_type', type)
    .eq('identifier_value', value.trim());

  if (state) {
    query = query.eq('state', state.toUpperCase());
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return data.resources;
}

/**
 * Get all identifiers for a given resource
 *
 * @param resourceId - The resource UUID to look up
 * @returns Array of all identifiers associated with the resource
 *
 * @example
 * const identifiers = await getResourceIdentifiers('abc-123');
 * console.log(`Found ${identifiers.length} identifiers`);
 */
export async function getResourceIdentifiers(resourceId: string): Promise<FacilityIdentifier[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from<FacilityIdentifier>('facility_identifiers')
    .select('*')
    .eq('resource_id', resourceId)
    .order('identifier_type');

  if (error) {
    throw new Error(`Failed to fetch identifiers: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Verify an identifier (marks it as manually verified)
 *
 * @param identifierId - The UUID of the identifier to verify
 * @returns The updated identifier record
 */
export async function verifyIdentifier(identifierId: string): Promise<FacilityIdentifier> {
  const supabase = getSupabaseClient(true); // Use service role for writes

  const { data, error } = await supabase
    .from<FacilityIdentifier>('facility_identifiers')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', identifierId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to verify identifier: ${error?.message ?? 'Unknown error'}`);
  }

  return data;
}

/**
 * Find potential duplicate resources based on shared identifiers
 *
 * @returns Array of identifier values that are associated with multiple resources
 */
export async function findDuplicateIdentifiers(): Promise<
  Array<{
    identifier_type: string;
    identifier_value: string;
    state: string | null;
    resource_count: number;
    resource_ids: string[];
  }>
> {
  const supabase = getSupabaseClient();

  type DuplicateRow = {
    identifier_type: string;
    identifier_value: string;
    state: string | null;
    resource_count: number;
    resource_ids: string[];
  };

  const { data, error } = await supabase
    .from<DuplicateRow>('view_facility_identifier_summary')
    .select('identifier_type, identifier_value, state, resource_count, resource_ids')
    .gt('resource_count', 1)
    .order('resource_count', { ascending: false });

  if (error) {
    throw new Error(`Failed to find duplicates: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Update the confidence score for an identifier
 *
 * @param identifierId - The UUID of the identifier to update
 * @param confidenceScore - New confidence score (0.0 to 1.0)
 * @returns The updated identifier record
 */
export async function updateConfidenceScore(
  identifierId: string,
  confidenceScore: number
): Promise<FacilityIdentifier> {
  if (confidenceScore < 0 || confidenceScore > 1.0) {
    throw new Error('Confidence score must be between 0 and 1.0');
  }

  const supabase = getSupabaseClient(true); // Use service role for writes

  const { data, error } = await supabase
    .from<FacilityIdentifier>('facility_identifiers')
    .update({ confidence_score: confidenceScore })
    .eq('id', identifierId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update confidence score: ${error?.message ?? 'Unknown error'}`);
  }

  return data;
}
