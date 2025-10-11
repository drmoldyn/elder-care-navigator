#!/bin/bash
# Download New York Adult Care Facility (ACF) / Assisted Living Data
# Source: New York State Department of Health
# Portal: Health Data NY (health.data.ny.gov)

set -e

# Configuration
DATA_DIR="data/state/ny"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$DATA_DIR/download_${TIMESTAMP}.log"

# Create directories
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/raw"
mkdir -p "$DATA_DIR/archive"

echo "==================================================" | tee -a "$LOG_FILE"
echo "New York ACF/ALF Data Download - $(date)" | tee -a "$LOG_FILE"
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
# DOWNLOAD 1: Health Facility General Information
# ============================================================================
# Contains facility locations, names, addresses, capacity
# Portal: https://health.data.ny.gov/Health/Health-Facility-General-Information/vn5v-hh5r

echo "" | tee -a "$LOG_FILE"
echo "Downloading Health Facility General Information..." | tee -a "$LOG_FILE"

GENERAL_INFO_URL="https://health.data.ny.gov/api/views/vn5v-hh5r/rows.csv?accessType=DOWNLOAD"

if download_file "$GENERAL_INFO_URL" "$DATA_DIR/raw/facility-general-info_${TIMESTAMP}.csv" "NY Health Facility General Information"; then
  echo "✓ Download complete" | tee -a "$LOG_FILE"
else
  echo "⚠ Automated download failed. Manual download required:" | tee -a "$LOG_FILE"
  echo "1. Visit: https://health.data.ny.gov/Health/Health-Facility-General-Information/vn5v-hh5r" | tee -a "$LOG_FILE"
  echo "2. Click 'Export' > 'CSV'" | tee -a "$LOG_FILE"
  echo "3. Save to: $DATA_DIR/raw/facility-general-info_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"

# ============================================================================
# DOWNLOAD 2: Health Facility Certification Information
# ============================================================================
# Contains operating certificates, service certifications, bed counts
# Portal: https://health.data.ny.gov/Health/Health-Facility-Certification-Information/2g9y-7kqm

echo "" | tee -a "$LOG_FILE"
echo "Downloading Health Facility Certification Information..." | tee -a "$LOG_FILE"

CERT_INFO_URL="https://health.data.ny.gov/api/views/2g9y-7kqm/rows.csv?accessType=DOWNLOAD"

if download_file "$CERT_INFO_URL" "$DATA_DIR/raw/facility-certification-info_${TIMESTAMP}.csv" "NY Health Facility Certification Information"; then
  echo "✓ Download complete" | tee -a "$LOG_FILE"
else
  echo "⚠ Automated download failed. Manual download required:" | tee -a "$LOG_FILE"
  echo "1. Visit: https://health.data.ny.gov/Health/Health-Facility-Certification-Information/2g9y-7kqm" | tee -a "$LOG_FILE"
  echo "2. Click 'Export' > 'CSV'" | tee -a "$LOG_FILE"
  echo "3. Save to: $DATA_DIR/raw/facility-certification-info_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"

# ============================================================================
# IMPORTANT: Facility ID Crosswalk
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "IMPORTANT: Data Merging Information" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "The two datasets must be joined using Facility ID:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "facility-general-info.csv contains:" | tee -a "$LOG_FILE"
echo "- Facility ID (unique identifier)" | tee -a "$LOG_FILE"
echo "- Facility Name" | tee -a "$LOG_FILE"
echo "- Address, City, State, ZIP" | tee -a "$LOG_FILE"
echo "- County" | tee -a "$LOG_FILE"
echo "- Phone Number" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "facility-certification-info.csv contains:" | tee -a "$LOG_FILE"
echo "- Facility ID (links to general info)" | tee -a "$LOG_FILE"
echo "- Operating Certificate Number" | tee -a "$LOG_FILE"
echo "- Service Type / Certification" | tee -a "$LOG_FILE"
echo "- Bed Count / Capacity" | tee -a "$LOG_FILE"
echo "- Operator Name" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Join on: Facility ID field" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# INSPECTION DATA - NYS Health Profiles
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "INSPECTION DATA" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Adult Care Facility inspection results are available via:" | tee -a "$LOG_FILE"
echo "NYS Adult Care Facility Profiles: https://profiles.health.ny.gov/acf/" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "To access inspection data:" | tee -a "$LOG_FILE"
echo "1. Search for a specific facility" | tee -a "$LOG_FILE"
echo "2. Click the 'Inspections' tab on the facility profile" | tee -a "$LOG_FILE"
echo "3. View inspection dates, violations, and corrective actions" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

echo "Quarterly Survey Reports:" | tee -a "$LOG_FILE"
echo "---------------------------------------" | tee -a "$LOG_FILE"
echo "NYS DOH publishes quarterly inspection summary reports:" | tee -a "$LOG_FILE"
echo "https://www.health.ny.gov/facilities/adult_care/reports.htm" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "These reports include:" | tee -a "$LOG_FILE"
echo "- Number of homes inspected per quarter" | tee -a "$LOG_FILE"
echo "- Number of homes cited for violations" | tee -a "$LOG_FILE"
echo "- Breakdown by county" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "NOTE: Summary data only, not individual facility details" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

echo "Individual Inspection Data Access:" | tee -a "$LOG_FILE"
echo "---------------------------------------" | tee -a "$LOG_FILE"
echo "For detailed inspection records:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Option 1: NYS Health Profiles" | tee -a "$LOG_FILE"
echo "- Use Facility IDs from downloaded data" | tee -a "$LOG_FILE"
echo "- Query https://profiles.health.ny.gov/acf/ for each facility" | tee -a "$LOG_FILE"
echo "- Extract inspection data from facility profiles" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Option 2: FOIL Request (Freedom of Information Law)" | tee -a "$LOG_FILE"
echo "- Submit request to NYS DOH" | tee -a "$LOG_FILE"
echo "- Request: Bulk inspection and violation data for ACFs" | tee -a "$LOG_FILE"
echo "- Contact: https://www.health.ny.gov/regulations/foil/" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# WEB SCRAPING ALTERNATIVE
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "WEB SCRAPING OPTION" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "To obtain inspection data programmatically:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Approach:" | tee -a "$LOG_FILE"
echo "1. Use downloaded facility list to get Facility IDs" | tee -a "$LOG_FILE"
echo "2. For each facility, construct profile URL:" | tee -a "$LOG_FILE"
echo "   https://profiles.health.ny.gov/acf/view/{FACILITY_ID}" | tee -a "$LOG_FILE"
echo "3. Use browser automation (Puppeteer/Playwright) to:" | tee -a "$LOG_FILE"
echo "   - Navigate to facility profile" | tee -a "$LOG_FILE"
echo "   - Click 'Inspections' tab" | tee -a "$LOG_FILE"
echo "   - Extract inspection dates and violation details" | tee -a "$LOG_FILE"
echo "4. Rate limit: 1-2 requests per second" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Estimated time for ~500 facilities: 4-8 hours" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# DATA FIELDS EXPECTED
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "EXPECTED DATA FIELDS" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "New York ACF data includes:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "From General Information dataset:" | tee -a "$LOG_FILE"
echo "- Facility ID" | tee -a "$LOG_FILE"
echo "- Facility Name" | tee -a "$LOG_FILE"
echo "- Description of Services" | tee -a "$LOG_FILE"
echo "- Street Address, City, State, ZIP" | tee -a "$LOG_FILE"
echo "- County" | tee -a "$LOG_FILE"
echo "- Phone Number" | tee -a "$LOG_FILE"
echo "- Facility Type Code" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "From Certification Information dataset:" | tee -a "$LOG_FILE"
echo "- Operating Certificate Number" | tee -a "$LOG_FILE"
echo "- Operator Name" | tee -a "$LOG_FILE"
echo "- Operator Phone" | tee -a "$LOG_FILE"
echo "- Service Type Description" | tee -a "$LOG_FILE"
echo "- Bed Count / Capacity" | tee -a "$LOG_FILE"
echo "- Certification Date" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# NEW YORK ACF TYPES
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "NEW YORK ACF FACILITY TYPES" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "New York regulates several types of adult care facilities:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "1. Adult Homes" | tee -a "$LOG_FILE"
echo "   - For adults needing supervision but not 24-hour skilled nursing" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "2. Residences for Adults" | tee -a "$LOG_FILE"
echo "   - For adults able to function independently with minimal supervision" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "3. Enriched Housing Programs" | tee -a "$LOG_FILE"
echo "   - Enhanced supportive services in community-based settings" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Filter downloaded data by facility type to identify" | tee -a "$LOG_FILE"
echo "facilities most similar to assisted living in other states" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Note: NY uses 'Adult Care Facility' (ACF) terminology" | tee -a "$LOG_FILE"
echo "rather than 'Assisted Living Facility' (ALF)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# Summary
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "DOWNLOAD SUMMARY" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Expected files after download:" | tee -a "$LOG_FILE"
echo "1. $DATA_DIR/raw/facility-general-info_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
echo "2. $DATA_DIR/raw/facility-certification-info_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Next steps:" | tee -a "$LOG_FILE"
echo "1. Verify both CSV files downloaded successfully" | tee -a "$LOG_FILE"
echo "2. Run: node scripts/process-alf-ny.ts" | tee -a "$LOG_FILE"
echo "   (Will merge the two datasets on Facility ID)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "For inspection data:" | tee -a "$LOG_FILE"
echo "- Consider implementing web scraper for NYS Health Profiles" | tee -a "$LOG_FILE"
echo "- Or submit FOIL request for bulk inspection data" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Facility count: ~534 adult care facilities (as of 2023)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Log saved to: $LOG_FILE" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
