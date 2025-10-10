#!/bin/bash
# Download CMS datasets for elder care resources
# This script downloads publicly available CMS datasets

set -e

# Create data directory
mkdir -p data/cms
cd data/cms

echo "🏥 Downloading CMS datasets..."
echo ""

# 1. Home Health Agencies
echo "📥 Downloading Home Health Agency data..."
curl -L "https://data.cms.gov/provider-data/api/1/datastore/query/6jpm-sxkc/0/download?format=csv" \
  -o home-health-agencies.csv
echo "✅ Home Health Agencies downloaded ($(wc -l < home-health-agencies.csv) rows)"
echo ""

# 2. Nursing Homes - Provider Information
echo "📥 Downloading Nursing Home Provider Information..."
curl -L "https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0/download?format=csv" \
  -o nursing-homes-providers.csv
echo "✅ Nursing Home Providers downloaded ($(wc -l < nursing-homes-providers.csv) rows)"
echo ""

# 3. Hospice Care - Locations
echo "📥 Downloading Hospice Care data..."
curl -L "https://data.cms.gov/provider-data/api/1/datastore/query/252m-zfp9/0/download?format=csv" \
  -o hospice-providers.csv
echo "✅ Hospice Providers downloaded ($(wc -l < hospice-providers.csv) rows)"
echo ""

# 4. Hospital General Information
echo "📥 Downloading Hospital General Information..."
curl -L "https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0/download?format=csv" \
  -o hospitals.csv
echo "✅ Hospitals downloaded ($(wc -l < hospitals.csv) rows)"
echo ""

echo "✨ All CMS datasets downloaded successfully!"
echo ""
echo "📂 Files saved in data/cms/:"
ls -lh

echo ""
echo "🔄 Next steps:"
echo "  1. Run migration: Apply 0003_add_geolocation_and_medical_systems.sql to your Supabase database"
echo "  2. Process datasets: pnpm tsx scripts/process-cms-data.ts"
echo "  3. Import resources: pnpm tsx scripts/import-resources-enhanced.ts data/cms/processed/*.csv"
