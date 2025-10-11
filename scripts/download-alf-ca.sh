#!/bin/bash
# Download California Assisted Living Facility (RCFE) Data
# Source: California Department of Social Services - Community Care Licensing Division
# Data: Residential Care Facilities for the Elderly (RCFE)

set -e

# Configuration
DATA_DIR="data/state/ca"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$DATA_DIR/download_${TIMESTAMP}.log"

# Create directories
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/raw"
mkdir -p "$DATA_DIR/archive"

echo "==================================================" | tee -a "$LOG_FILE"
echo "California ALF Data Download - $(date)" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"

# Function to download and log
download_file() {
  local url=$1
  local output=$2
  local description=$3

  echo "" | tee -a "$LOG_FILE"
  echo "Downloading: $description" | tee -a "$LOG_FILE"
  echo "URL: $url" | tee -a "$LOG_FILE"
  echo "Output: $output" | tee -a "$LOG_FILE"

  if curl -L -f -o "$output" "$url" 2>&1 | tee -a "$LOG_FILE"; then
    echo "✓ Successfully downloaded: $description" | tee -a "$LOG_FILE"
    ls -lh "$output" | tee -a "$LOG_FILE"
    return 0
  else
    echo "✗ Failed to download: $description" | tee -a "$LOG_FILE"
    return 1
  fi
}

# ============================================================================
# DOWNLOAD 1: Community Care Licensing - RCFE Facilities
# ============================================================================
# Data Portal: https://data.ca.gov/dataset/community-care-licensing-residential-elder-care-facility-locations
# Note: This URL may need to be updated - check data.ca.gov for current endpoint

echo "" | tee -a "$LOG_FILE"
echo "Attempting to download RCFE facility listings..." | tee -a "$LOG_FILE"

# California Open Data Portal - RCFE Dataset
# Note: The actual download URL needs to be obtained from the data portal
# Visit: https://data.ca.gov/dataset/community-care-licensing-residential-elder-care-facility-locations
# Click "Download" to get the current CSV URL

# Placeholder URL - MUST BE UPDATED with actual endpoint
RCFE_URL="https://data.ca.gov/dataset/community-care-licensing-residential-elder-care-facility-locations/resource/RESOURCE_ID/download/rcfe-facilities.csv"

# For now, provide manual download instructions
echo "⚠ MANUAL DOWNLOAD REQUIRED" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "To download CA RCFE data:" | tee -a "$LOG_FILE"
echo "1. Visit: https://data.ca.gov/dataset/community-care-licensing-residential-elder-care-facility-locations" | tee -a "$LOG_FILE"
echo "2. Click the 'Download' button for the CSV file" | tee -a "$LOG_FILE"
echo "3. Save the file to: $DATA_DIR/raw/rcfe-facilities_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# DOWNLOAD 2: Licensed and Certified Healthcare Facilities
# ============================================================================
# Alternative source with broader facility data
# Portal: https://data.chhs.ca.gov/dataset/licensed-and-certified-healthcare-facilities

echo "Attempting to download licensed healthcare facilities data..." | tee -a "$LOG_FILE"

HEALTHCARE_URL="https://data.chhs.ca.gov/dataset/licensed-and-certified-healthcare-facilities/resource/RESOURCE_ID/download/healthcare-facilities.csv"

echo "⚠ MANUAL DOWNLOAD REQUIRED" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "To download CA licensed healthcare facilities data:" | tee -a "$LOG_FILE"
echo "1. Visit: https://data.chhs.ca.gov/dataset/licensed-and-certified-healthcare-facilities" | tee -a "$LOG_FILE"
echo "2. Click the 'Download' button for the CSV file" | tee -a "$LOG_FILE"
echo "3. Save the file to: $DATA_DIR/raw/healthcare-facilities_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# DOWNLOAD 3: ALW (Assisted Living Waiver) Facilities
# ============================================================================
# Portal: https://data.ca.gov/dataset/alw-assisted-living-facilities

echo "Attempting to download ALW facility data..." | tee -a "$LOG_FILE"

ALW_URL="https://data.ca.gov/dataset/alw-assisted-living-facilities/resource/RESOURCE_ID/download/alw-facilities.csv"

echo "⚠ MANUAL DOWNLOAD REQUIRED" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "To download CA ALW facilities data:" | tee -a "$LOG_FILE"
echo "1. Visit: https://data.ca.gov/dataset/alw-assisted-living-facilities" | tee -a "$LOG_FILE"
echo "2. Click the 'Download' button for the CSV file" | tee -a "$LOG_FILE"
echo "3. Save the file to: $DATA_DIR/raw/alw-facilities_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# WEB SCRAPING ALTERNATIVE (for inspection data)
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "INSPECTION DATA - WEB SCRAPING REQUIRED" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "California inspection reports are available via the facility search:" | tee -a "$LOG_FILE"
echo "URL: https://www.ccld.dss.ca.gov/carefacilitysearch/" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Inspection reports can be viewed starting April 16, 2015" | tee -a "$LOG_FILE"
echo "Complaint investigation reports available from January 11, 2016" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "To obtain inspection data:" | tee -a "$LOG_FILE"
echo "- Option 1: Request bulk data from CDSS Community Care Licensing Division" | tee -a "$LOG_FILE"
echo "- Option 2: Implement web scraper for facility search portal" | tee -a "$LOG_FILE"
echo "- Option 3: Use facility identifiers to query inspection API (if available)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# Summary
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "DOWNLOAD SUMMARY" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Expected files after manual download:" | tee -a "$LOG_FILE"
echo "1. $DATA_DIR/raw/rcfe-facilities_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
echo "2. $DATA_DIR/raw/healthcare-facilities_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
echo "3. $DATA_DIR/raw/alw-facilities_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Next steps:" | tee -a "$LOG_FILE"
echo "1. Complete manual downloads per instructions above" | tee -a "$LOG_FILE"
echo "2. Run: node scripts/process-alf-ca.ts" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Log saved to: $LOG_FILE" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
