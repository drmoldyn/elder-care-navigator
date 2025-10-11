#!/bin/bash
# Download CMS Hospice Quality and CAHPS datasets
# This script downloads publicly available CMS hospice quality reporting data
#
# Data Sources:
#   1. Hospice General Information (provider details + quality star ratings)
#   2. National CAHPS Hospice Survey (family experience measures)
#   3. Hospice Quality Measures (individual measure scores)
#
# All data from: data.cms.gov Provider Data Catalog
# Refresh schedule: Quarterly (February, May, August, November)

set -e

# Configuration
REFRESH_DATE=${REFRESH_DATE:-"Aug2025"}  # Current refresh cycle
DATA_DIR="data/cms/raw"
LOG_FILE="$DATA_DIR/download-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
  echo -e "${2:-$NC}$1${NC}" | tee -a "$LOG_FILE"
}

# Create data directory
mkdir -p "$DATA_DIR"

log "========================================" "$BLUE"
log "CMS Hospice Quality Data Download" "$BLUE"
log "========================================" "$BLUE"
log "Started at: $(date)" "$BLUE"
log "Refresh period: $REFRESH_DATE" "$BLUE"
log "Data directory: $DATA_DIR" "$BLUE"
log "" "$NC"

# Function to download and verify a file
download_file() {
  local url=$1
  local output_file=$2
  local description=$3

  log "Downloading: $description..." "$YELLOW"
  log "  URL: $url" "$NC"
  log "  Output: $output_file" "$NC"

  if curl -f -L "$url" -o "$output_file" 2>> "$LOG_FILE"; then
    local row_count=$(tail -n +2 "$output_file" | wc -l | tr -d ' ')
    local file_size=$(ls -lh "$output_file" | awk '{print $5}')
    log "  SUCCESS: Downloaded $row_count rows ($file_size)" "$GREEN"
    echo "$(date +%Y-%m-%d\ %H:%M:%S),$description,$output_file,$row_count,$file_size" >> "$DATA_DIR/download-manifest.csv"
    return 0
  else
    log "  FAILED: Could not download file" "$RED"
    return 1
  fi
}

# Initialize manifest file
echo "timestamp,description,filename,rows,size" > "$DATA_DIR/download-manifest.csv"

# ============================================================================
# 1. HOSPICE GENERAL INFORMATION (Provider Details + Star Ratings)
# ============================================================================
# Dataset ID: 252m-zfp9
# Contains: CCN, provider name, address, quality star rating, CAHPS star rating
# This is the main file with provider info and overall ratings

log "" "$NC"
log "1. Hospice General Information (Provider Data + Star Ratings)" "$BLUE"
log "   Dataset: 252m-zfp9" "$NC"

HOSPICE_GENERAL_URL="https://data.cms.gov/provider-data/api/1/datastore/query/252m-zfp9/0/download?format=csv"
HOSPICE_GENERAL_FILE="$DATA_DIR/hospice-general-${REFRESH_DATE}.csv"

download_file "$HOSPICE_GENERAL_URL" "$HOSPICE_GENERAL_FILE" "Hospice General Information"

# ============================================================================
# 2. NATIONAL CAHPS HOSPICE SURVEY DATA
# ============================================================================
# Dataset ID: 7cv8-v37d
# Contains: CCN, CAHPS measure names, scores, survey counts
# Family/caregiver experience measures (8 rolling quarters)

log "" "$NC"
log "2. National CAHPS Hospice Survey Data" "$BLUE"
log "   Dataset: 7cv8-v37d" "$NC"

CAHPS_URL="https://data.cms.gov/provider-data/api/1/datastore/query/7cv8-v37d/0/download?format=csv"
CAHPS_FILE="$DATA_DIR/hospice-cahps-${REFRESH_DATE}.csv"

download_file "$CAHPS_URL" "$CAHPS_FILE" "CAHPS Hospice Survey"

# ============================================================================
# 3. HOSPICE QUALITY MEASURES (Individual Measure Scores)
# ============================================================================
# Dataset ID: yc9t-dgbk
# Contains: Individual quality measure scores by provider
# Includes HIS/HOPE measures like pain management, symptom control, etc.

log "" "$NC"
log "3. Hospice Quality Measures (Individual Scores)" "$BLUE"
log "   Dataset: yc9t-dgbk" "$NC"

QUALITY_MEASURES_URL="https://data.cms.gov/provider-data/api/1/datastore/query/yc9t-dgbk/0/download?format=csv"
QUALITY_MEASURES_FILE="$DATA_DIR/hospice-quality-measures-${REFRESH_DATE}.csv"

download_file "$QUALITY_MEASURES_URL" "$QUALITY_MEASURES_FILE" "Hospice Quality Measures"

# ============================================================================
# 4. HOSPICE NATIONAL DATA (Aggregated Statistics) - OPTIONAL
# ============================================================================
# Dataset ID: 3xeb-u9wp
# Contains: National averages and benchmarks for comparison
# This is useful for context but not required for provider-level data

log "" "$NC"
log "4. Hospice National Data (Optional - for benchmarking)" "$BLUE"
log "   Dataset: 3xeb-u9wp" "$NC"

NATIONAL_DATA_URL="https://data.cms.gov/provider-data/api/1/datastore/query/3xeb-u9wp/0/download?format=csv"
NATIONAL_DATA_FILE="$DATA_DIR/hospice-national-${REFRESH_DATE}.csv"

download_file "$NATIONAL_DATA_URL" "$NATIONAL_DATA_FILE" "Hospice National Benchmarks" || true

# ============================================================================
# 5. HOSPICE SERVICE AREA (ZIP Code Coverage) - OPTIONAL
# ============================================================================
# Dataset ID: 95rg-2usp
# Contains: ZIP codes served by each hospice (many-to-many relationship)
# Useful for service area mapping

log "" "$NC"
log "5. Hospice Service Area ZIP Codes (Optional)" "$BLUE"
log "   Dataset: 95rg-2usp" "$NC"

SERVICE_AREA_URL="https://data.cms.gov/provider-data/api/1/datastore/query/95rg-2usp/0/download?format=csv"
SERVICE_AREA_FILE="$DATA_DIR/hospice-service-area-${REFRESH_DATE}.csv"

download_file "$SERVICE_AREA_URL" "$SERVICE_AREA_FILE" "Hospice Service Area ZIP Codes" || true

# ============================================================================
# SUMMARY
# ============================================================================

log "" "$NC"
log "========================================" "$BLUE"
log "Download Summary" "$BLUE"
log "========================================" "$BLUE"
log "" "$NC"

# Count successful downloads
SUCCESS_COUNT=$(grep -c "SUCCESS" "$LOG_FILE" || echo "0")
log "Successfully downloaded: $SUCCESS_COUNT datasets" "$GREEN"

log "" "$NC"
log "Downloaded files in $DATA_DIR:" "$NC"
ls -lh "$DATA_DIR"/*.csv 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'

log "" "$NC"
log "Download manifest: $DATA_DIR/download-manifest.csv" "$NC"
log "Full log: $LOG_FILE" "$NC"

log "" "$NC"
log "========================================" "$BLUE"
log "Next Steps" "$BLUE"
log "========================================" "$BLUE"
log "" "$NC"
log "1. Review downloaded files for data quality" "$NC"
log "   cat $DATA_DIR/download-manifest.csv" "$NC"
log "" "$NC"
log "2. Process the data into standardized format:" "$NC"
log "   pnpm tsx scripts/process-hospice-quality.ts" "$NC"
log "" "$NC"
log "3. Import processed data into Supabase:" "$NC"
log "   pnpm tsx scripts/import-hospice-quality.ts" "$NC"
log "" "$NC"

log "Completed at: $(date)" "$BLUE"
log "========================================" "$BLUE"
