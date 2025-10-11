#!/bin/bash
# Download Florida Assisted Living Facility Data
# Source: Florida Agency for Health Care Administration (AHCA)
# Portal: Florida HealthFinder - quality.healthfinder.fl.gov

set -e

# Configuration
DATA_DIR="data/state/fl"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$DATA_DIR/download_${TIMESTAMP}.log"

# Create directories
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/raw"
mkdir -p "$DATA_DIR/archive"

echo "==================================================" | tee -a "$LOG_FILE"
echo "Florida ALF Data Download - $(date)" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"

# ============================================================================
# DOWNLOAD: Florida HealthFinder - Assisted Living Facilities
# ============================================================================

echo "" | tee -a "$LOG_FILE"
echo "Florida ALF data is available via HealthFinder portal" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

echo "⚠ MANUAL DOWNLOAD REQUIRED" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "To download Florida ALF data:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "STEP 1: Download Facility List" | tee -a "$LOG_FILE"
echo "---------------------------------------" | tee -a "$LOG_FILE"
echo "1. Visit: https://quality.healthfinder.fl.gov" | tee -a "$LOG_FILE"
echo "2. Select 'Search by Facility Type/Location'" | tee -a "$LOG_FILE"
echo "3. From 'Facility/Provider Type' dropdown, select:" | tee -a "$LOG_FILE"
echo "   - 'Assisted Living Facility (ALF)'" | tee -a "$LOG_FILE"
echo "4. Leave other fields blank to get all ALFs statewide" | tee -a "$LOG_FILE"
echo "5. Click 'Search'" | tee -a "$LOG_FILE"
echo "6. When prompted 'Dataset too large', click 'Download'" | tee -a "$LOG_FILE"
echo "7. Save the file to: $DATA_DIR/raw/alf-facilities_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

echo "STEP 2: Download Facility Details (Optional - for enrichment)" | tee -a "$LOG_FILE"
echo "---------------------------------------" | tee -a "$LOG_FILE"
echo "For detailed facility information including inspections:" | tee -a "$LOG_FILE"
echo "1. From search results, you can export facility details" | tee -a "$LOG_FILE"
echo "2. Or use facility license numbers to query individual profiles" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

echo "STEP 3: Download Inspection Reports (Advanced)" | tee -a "$LOG_FILE"
echo "---------------------------------------" | tee -a "$LOG_FILE"
echo "Inspection reports are available for each facility:" | tee -a "$LOG_FILE"
echo "1. Navigate to individual facility profile pages" | tee -a "$LOG_FILE"
echo "2. Inspection reports are listed with dates" | tee -a "$LOG_FILE"
echo "3. Forms used:" | tee -a "$LOG_FILE"
echo "   - Form 2567: Federal regulation deficiencies" | tee -a "$LOG_FILE"
echo "   - Form 3020-0001: State regulation deficiencies" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# API/BULK ACCESS INFORMATION
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "ALTERNATIVE: Request Bulk Data Access" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "For programmatic access or bulk downloads:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Contact: Florida AHCA" | tee -a "$LOG_FILE"
echo "Website: https://ahca.myflorida.com" | tee -a "$LOG_FILE"
echo "Phone: (850) 412-3700" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Request information about:" | tee -a "$LOG_FILE"
echo "- Bulk data files for licensed ALFs" | tee -a "$LOG_FILE"
echo "- Inspection history exports" | tee -a "$LOG_FILE"
echo "- API access to HealthFinder database" | tee -a "$LOG_FILE"
echo "- Public records request for facility data" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# WEB SCRAPING ALTERNATIVE
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "WEB SCRAPING OPTION" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "The HealthFinder portal can be scraped programmatically:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Approach 1: Facility List Scraper" | tee -a "$LOG_FILE"
echo "- Use browser automation (Puppeteer/Playwright)" | tee -a "$LOG_FILE"
echo "- Submit search form for ALFs" | tee -a "$LOG_FILE"
echo "- Trigger download of CSV results" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Approach 2: Individual Facility Scraper" | tee -a "$LOG_FILE"
echo "- Get list of facility IDs from bulk export" | tee -a "$LOG_FILE"
echo "- Iterate through facility detail pages" | tee -a "$LOG_FILE"
echo "- Extract inspection reports and violation details" | tee -a "$LOG_FILE"
echo "- Rate limit: ~1 request per second to be respectful" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# DATA FIELDS EXPECTED
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "EXPECTED DATA FIELDS" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Florida ALF data should include:" | tee -a "$LOG_FILE"
echo "- License Number (AHCA facility ID)" | tee -a "$LOG_FILE"
echo "- Facility Name" | tee -a "$LOG_FILE"
echo "- Administrator Name" | tee -a "$LOG_FILE"
echo "- Owner/Operator" | tee -a "$LOG_FILE"
echo "- Physical Address" | tee -a "$LOG_FILE"
echo "- Phone Number" | tee -a "$LOG_FILE"
echo "- License Status" | tee -a "$LOG_FILE"
echo "- Number of Beds" | tee -a "$LOG_FILE"
echo "- Bed Types" | tee -a "$LOG_FILE"
echo "- Specialty Licenses (Extended Congregate Care, Limited Mental Health)" | tee -a "$LOG_FILE"
echo "- Inspection Reports (with dates)" | tee -a "$LOG_FILE"
echo "- Deficiencies/Violations (if available)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# Summary
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "DOWNLOAD SUMMARY" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Expected file after manual download:" | tee -a "$LOG_FILE"
echo "- $DATA_DIR/raw/alf-facilities_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Next steps:" | tee -a "$LOG_FILE"
echo "1. Complete manual download per instructions above" | tee -a "$LOG_FILE"
echo "2. Run: node scripts/process-alf-fl.ts" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "For automated downloading in the future:" | tee -a "$LOG_FILE"
echo "- Consider implementing web scraper" | tee -a "$LOG_FILE"
echo "- Or request bulk data access from AHCA" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Log saved to: $LOG_FILE" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
