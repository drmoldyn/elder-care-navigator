#!/bin/bash
# Download CMS Nursing Home Quality & Inspection Data
# This script downloads the latest datasets from data.medicare.gov

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== CMS Quality & Inspection Data Download ===${NC}\n"

# Create directory structure
DATA_DIR="data/cms/raw"
mkdir -p "$DATA_DIR"

# Get current date for filenames
DOWNLOAD_DATE=$(date +%Y%m%d)

# Log file
LOG_FILE="$DATA_DIR/download-log-${DOWNLOAD_DATE}.txt"
echo "Download started at $(date)" > "$LOG_FILE"

# Function to download and verify
download_dataset() {
  local DATASET_ID=$1
  local DATASET_NAME=$2
  local OUTPUT_FILE=$3

  echo -e "${YELLOW}Downloading ${DATASET_NAME}...${NC}"

  # Construct download URL using Socrata API (medicare.gov)
  URL="https://data.medicare.gov/api/views/${DATASET_ID}/rows.csv?accessType=DOWNLOAD"

  # Download with curl (primary)
  if curl -f -L -o "$OUTPUT_FILE" "$URL"; then
    # Get file size
    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    LINE_COUNT=$(wc -l < "$OUTPUT_FILE")

    echo -e "${GREEN}✓ Downloaded ${DATASET_NAME}${NC}"
    echo "  File: $OUTPUT_FILE"
    echo "  Size: $FILE_SIZE"
    echo "  Lines: $LINE_COUNT"

    # Log success
    echo "SUCCESS: $DATASET_NAME - $FILE_SIZE - $LINE_COUNT lines - $(date)" >> "$LOG_FILE"

    return 0
  else
    echo -e "${YELLOW}Primary source failed. Trying data.cms.gov provider-data API...${NC}"
    # Fallback: data.cms.gov provider-data API
    ALT_URL="https://data.cms.gov/provider-data/api/1/datastore/query/${DATASET_ID}/0/download?format=csv"
    if curl -f -L -o "$OUTPUT_FILE" "$ALT_URL"; then
      FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
      LINE_COUNT=$(wc -l < "$OUTPUT_FILE")
      echo -e "${GREEN}✓ Downloaded ${DATASET_NAME} (via data.cms.gov)${NC}"
      echo "  File: $OUTPUT_FILE"
      echo "  Size: $FILE_SIZE"
      echo "  Lines: $LINE_COUNT"
      echo "SUCCESS: $DATASET_NAME (fallback) - $FILE_SIZE - $LINE_COUNT lines - $(date)" >> "$LOG_FILE"
      return 0
    else
      echo -e "${RED}✗ Failed to download ${DATASET_NAME}${NC}"
      echo "ERROR: $DATASET_NAME - Failed - $(date)" >> "$LOG_FILE"
      return 1
    fi
  fi
}

echo -e "${BLUE}Starting downloads...${NC}\n"

# Download Health Deficiencies
# Dataset ID: r5ix-sfxw
# Contains: All health deficiencies currently listed on Care Compare
download_dataset \
  "r5ix-sfxw" \
  "Health Deficiencies" \
  "$DATA_DIR/health-deficiencies-${DOWNLOAD_DATE}.csv"

echo ""

# Download Penalties
# Dataset ID: g6vv-u9sr
# Contains: Civil money penalties and denial of payment for new admissions
download_dataset \
  "g6vv-u9sr" \
  "Penalties" \
  "$DATA_DIR/penalties-${DOWNLOAD_DATE}.csv"

echo ""

# Download MDS Quality Measures
# Dataset ID: djen-97ju
# Contains: Quality measures from Minimum Data Set assessments
download_dataset \
  "djen-97ju" \
  "MDS Quality Measures" \
  "$DATA_DIR/mds-quality-measures-${DOWNLOAD_DATE}.csv"

echo ""

# Download Claims-based Quality Measures (if available)
# Dataset ID: ijdk-6vr8
# Contains: Quality measures derived from Medicare claims data
echo -e "${YELLOW}Downloading Claims-based Quality Measures...${NC}"
if download_dataset \
  "ijdk-6vr8" \
  "Claims-based Quality Measures" \
  "$DATA_DIR/claims-quality-measures-${DOWNLOAD_DATE}.csv" 2>/dev/null; then
  echo ""
else
  echo -e "${YELLOW}  Note: Claims-based measures dataset may not be available separately${NC}"
  echo ""
fi

# Create symlinks to latest files for easier reference
echo -e "${BLUE}Creating symlinks to latest files...${NC}"

create_symlink() {
  local SOURCE=$1
  local TARGET=$2

  if [ -f "$SOURCE" ]; then
    ln -sf "$(basename "$SOURCE")" "$TARGET"
    echo -e "${GREEN}✓ Created symlink: $TARGET${NC}"
  fi
}

create_symlink \
  "$DATA_DIR/health-deficiencies-${DOWNLOAD_DATE}.csv" \
  "$DATA_DIR/health-deficiencies-latest.csv"

create_symlink \
  "$DATA_DIR/penalties-${DOWNLOAD_DATE}.csv" \
  "$DATA_DIR/penalties-latest.csv"

create_symlink \
  "$DATA_DIR/mds-quality-measures-${DOWNLOAD_DATE}.csv" \
  "$DATA_DIR/mds-quality-measures-latest.csv"

if [ -f "$DATA_DIR/claims-quality-measures-${DOWNLOAD_DATE}.csv" ]; then
  create_symlink \
    "$DATA_DIR/claims-quality-measures-${DOWNLOAD_DATE}.csv" \
    "$DATA_DIR/claims-quality-measures-latest.csv"
fi

echo ""
echo -e "${GREEN}=== Download Complete ===${NC}"
echo -e "Downloaded files are in: ${BLUE}$DATA_DIR${NC}"
echo -e "Download log: ${BLUE}$LOG_FILE${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Run: pnpm tsx scripts/process-quality-data.ts"
echo "  2. Run: pnpm tsx scripts/import-quality-data.ts"
echo ""

# Final log entry
echo "Download completed at $(date)" >> "$LOG_FILE"
