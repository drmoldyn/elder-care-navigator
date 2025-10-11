#!/bin/bash
# Download CMS Home Health Quality and Patient Experience datasets
# Phase 2: Home Health Quality Metrics
#
# This script downloads publicly available CMS datasets for home health quality,
# patient experience (CAHPS), and utilization data.

set -e

# Create data directories
mkdir -p data/cms/raw
cd data/cms/raw

# Get current date for timestamping
DOWNLOAD_DATE=$(date +%Y%m%d)

echo "=================================="
echo "CMS Home Health Data Download"
echo "=================================="
echo "Download Date: $(date)"
echo ""

# Function to download and verify file
download_file() {
  local url=$1
  local filename=$2
  local description=$3

  echo "-----------------------------------"
  echo "Downloading: $description"
  echo "URL: $url"
  echo "Saving to: $filename"
  echo ""

  # Download with retry logic
  curl -L --retry 3 --retry-delay 5 -f "$url" -o "$filename.tmp"

  # Verify download
  if [ -f "$filename.tmp" ]; then
    local rows=$(wc -l < "$filename.tmp")
    local size=$(ls -lh "$filename.tmp" | awk '{print $5}')

    # Move to final location
    mv "$filename.tmp" "$filename"

    echo "Downloaded: $rows rows, $size"
    echo "Timestamp: $(date)" >> download_log.txt
    echo "$description: $filename ($rows rows, $size)" >> download_log.txt
    echo ""
  else
    echo "ERROR: Failed to download $description"
    exit 1
  fi
}

# Initialize download log
echo "Download Log - $(date)" > download_log.txt
echo "================================" >> download_log.txt

# 1. Home Health Care Agencies - Provider Information with Quality Ratings
# This is the main dataset with provider info and star ratings
echo "1/5: Home Health Agencies - Provider Information & Quality Ratings"
download_file \
  "https://data.cms.gov/provider-data/api/1/datastore/query/6jpm-sxkc/0/download?format=csv" \
  "homehealth-agencies-${DOWNLOAD_DATE}.csv" \
  "Home Health Agencies with Quality Ratings"

# 2. Home Health Care - National Data (Quality Measures)
# Contains national-level quality measure data
echo "2/5: Home Health - National Quality Measures"
download_file \
  "https://data.cms.gov/provider-data/api/1/datastore/query/97z8-de96/0/download?format=csv" \
  "homehealth-national-quality-${DOWNLOAD_DATE}.csv" \
  "Home Health National Quality Measures"

# 3. Home Health Care - State by State Data
# Contains state-level comparisons
echo "3/5: Home Health - State by State Quality Data"
download_file \
  "https://data.cms.gov/provider-data/api/1/datastore/query/tee5-ixt5/0/download?format=csv" \
  "homehealth-state-quality-${DOWNLOAD_DATE}.csv" \
  "Home Health State Quality Data"

# 4. Patient Survey (HHCAHPS) - Home Health CAHPS Survey Results
# Patient experience survey data (Q1 2024 - Q4 2024)
echo "4/5: Home Health CAHPS Patient Experience Survey"
download_file \
  "https://data.cms.gov/provider-data/api/1/datastore/query/ccn4-8vby/0/download?format=csv" \
  "homehealth-cahps-${DOWNLOAD_DATE}.csv" \
  "Home Health CAHPS Patient Survey"

# 5. Home Health Care - Service Area by Zip Code
# Service area information showing which zip codes each agency serves
echo "5/5: Home Health - Service Areas by Zip Code"
download_file \
  "https://data.cms.gov/provider-data/api/1/datastore/query/m5eg-upu5/0/download?format=csv" \
  "homehealth-service-areas-${DOWNLOAD_DATE}.csv" \
  "Home Health Service Areas"

# Optional: Download CMS utilization data if available
# Note: This may require CMS Data Portal account for detailed utilization files
echo ""
echo "Note: Additional utilization data may be available from:"
echo "  - CMS Program Statistics: https://data.cms.gov/summary-statistics-on-use-and-payments/medicare-service-type-reports/cms-program-statistics-medicare-home-health-agency"
echo "  - These files may require manual download or API key"
echo ""

# Create a latest symlink for each file type
ln -sf "homehealth-agencies-${DOWNLOAD_DATE}.csv" "homehealth-agencies-latest.csv"
ln -sf "homehealth-national-quality-${DOWNLOAD_DATE}.csv" "homehealth-national-quality-latest.csv"
ln -sf "homehealth-state-quality-${DOWNLOAD_DATE}.csv" "homehealth-state-quality-latest.csv"
ln -sf "homehealth-cahps-${DOWNLOAD_DATE}.csv" "homehealth-cahps-latest.csv"
ln -sf "homehealth-service-areas-${DOWNLOAD_DATE}.csv" "homehealth-service-areas-latest.csv"

echo "=================================="
echo "Download Complete!"
echo "=================================="
echo ""
echo "Files downloaded to: data/cms/raw/"
echo ""
echo "Downloaded files:"
ls -lh homehealth-*-${DOWNLOAD_DATE}.csv
echo ""
echo "Download log saved to: data/cms/raw/download_log.txt"
echo ""
echo "Next steps:"
echo "  1. Review download_log.txt for file details"
echo "  2. Process data: pnpm tsx scripts/process-homehealth-quality.ts"
echo "  3. Import to database: pnpm tsx scripts/import-homehealth-quality.ts"
echo ""
