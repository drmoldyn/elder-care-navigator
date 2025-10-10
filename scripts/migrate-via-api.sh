#!/bin/bash

# Apply geocoding migration via Supabase Management API
# This script adds the geocoding columns to the resources table

set -e

source .env.local

echo ""
echo "🔧 Applying Geocoding Migration via Supabase API"
echo "============================================================"
echo ""

# SQL to execute
SQL="ALTER TABLE resources
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS geocode_quality VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_resources_coordinates
ON resources(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_resources_geocoded
ON resources(geocoded_at) WHERE geocoded_at IS NULL;"

echo "📝 Executing SQL migration..."
echo ""

# Try to execute via Supabase PostgREST
curl -X POST "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/query" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  --data "{\"query\": \"${SQL}\"}" \
  2>&1

echo ""
echo ""
echo "⚠️  Note: Direct SQL execution may not be available via API"
echo ""
echo "If the above failed, please run the migration manually:"
echo ""
echo "1. Open: https://supabase.com/dashboard/project/cxadvvjhouprybyvryyd/sql/new"
echo ""
echo "2. Copy and paste this SQL:"
echo ""
echo "---"
cat scripts/add-geocoding-columns.sql
echo "---"
echo ""
echo "3. Click 'RUN'"
echo ""
