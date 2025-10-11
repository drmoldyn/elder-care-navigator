#!/bin/bash
# Download Texas Assisted Living Facility Data
# Source: Texas Health and Human Services Commission (HHSC)
# Portal: TULIP (Texas Unified Licensure Information Portal)

set -e

# Configuration
DATA_DIR="data/state/tx"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$DATA_DIR/download_${TIMESTAMP}.log"

# Create directories
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/raw"
mkdir -p "$DATA_DIR/archive"

echo "==================================================" | tee -a "$LOG_FILE"
echo "Texas ALF Data Download - $(date)" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"

# ============================================================================
# DOWNLOAD: TULIP Portal - Assisted Living Facilities
# ============================================================================

echo "" | tee -a "$LOG_FILE"
echo "Texas ALF data is available via TULIP portal" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

echo "⚠ MANUAL DOWNLOAD / DATA REQUEST REQUIRED" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "To obtain Texas ALF data:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

echo "OPTION 1: TULIP Portal Search (Individual Facility Lookup)" | tee -a "$LOG_FILE"
echo "---------------------------------------" | tee -a "$LOG_FILE"
echo "1. Visit: https://apps.hhs.texas.gov/LTCSearch/" | tee -a "$LOG_FILE"
echo "2. Select search criteria:" | tee -a "$LOG_FILE"
echo "   - Facility Type: 'Assisted Living Facility'" | tee -a "$LOG_FILE"
echo "   - Leave location blank for statewide results" | tee -a "$LOG_FILE"
echo "3. Click 'Search'" | tee -a "$LOG_FILE"
echo "4. Review facility profiles (includes inspections, violations, enforcement)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "NOTE: TULIP is primarily a search interface, not bulk download" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

echo "OPTION 2: Public Information Request (Recommended for Bulk Data)" | tee -a "$LOG_FILE"
echo "---------------------------------------" | tee -a "$LOG_FILE"
echo "Submit a Public Information Request to HHSC:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Contact Information:" | tee -a "$LOG_FILE"
echo "Texas Health and Human Services Commission" | tee -a "$LOG_FILE"
echo "Regulatory Services Division" | tee -a "$LOG_FILE"
echo "Website: https://www.hhs.texas.gov" | tee -a "$LOG_FILE"
echo "Phone: (512) 438-3011" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "What to request:" | tee -a "$LOG_FILE"
echo "- Complete list of licensed Assisted Living Facilities (ALFs)" | tee -a "$LOG_FILE"
echo "- Facility details: name, address, license number, capacity, status" | tee -a "$LOG_FILE"
echo "- Inspection history for past 3 years" | tee -a "$LOG_FILE"
echo "- Violation and enforcement action records" | tee -a "$LOG_FILE"
echo "- Preferred format: CSV or Excel" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Public Information Request Portal:" | tee -a "$LOG_FILE"
echo "https://www.hhs.texas.gov/about-hhs/leadership/public-information" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

echo "OPTION 3: Regulatory Services Annual Report" | tee -a "$LOG_FILE"
echo "---------------------------------------" | tee -a "$LOG_FILE"
echo "HHSC publishes annual regulatory services reports with summary data:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Latest report (2024):" | tee -a "$LOG_FILE"
echo "https://www.hhs.texas.gov/sites/default/files/documents/ltc-regulatory-services-annual-report-2024.pdf" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Contains aggregate statistics:" | tee -a "$LOG_FILE"
echo "- Total ALF facilities licensed" | tee -a "$LOG_FILE"
echo "- Inspection activity" | tee -a "$LOG_FILE"
echo "- Enforcement actions and penalties" | tee -a "$LOG_FILE"
echo "- Violation trends" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "NOTE: Summary data only, not individual facility records" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# WEB SCRAPING ALTERNATIVE
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "WEB SCRAPING OPTION (Advanced)" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "The TULIP portal could be scraped programmatically:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Approach:" | tee -a "$LOG_FILE"
echo "1. Use browser automation (Puppeteer/Playwright)" | tee -a "$LOG_FILE"
echo "2. Submit search for all ALFs by county/zip (iterate through TX counties)" | tee -a "$LOG_FILE"
echo "3. Extract facility IDs from search results" | tee -a "$LOG_FILE"
echo "4. Visit each facility detail page" | tee -a "$LOG_FILE"
echo "5. Extract:" | tee -a "$LOG_FILE"
echo "   - Facility profile information" | tee -a "$LOG_FILE"
echo "   - Inspection reports and dates" | tee -a "$LOG_FILE"
echo "   - Violation details" | tee -a "$LOG_FILE"
echo "   - Enforcement actions" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Challenges:" | tee -a "$LOG_FILE"
echo "- TULIP may use session-based authentication" | tee -a "$LOG_FILE"
echo "- Rate limiting required (recommend 1-2 requests/second)" | tee -a "$LOG_FILE"
echo "- May violate terms of service - check before implementing" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Recommendation: Pursue public information request instead" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# DATA FIELDS EXPECTED
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "EXPECTED DATA FIELDS" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Texas ALF data should include:" | tee -a "$LOG_FILE"
echo "- Facility License Number" | tee -a "$LOG_FILE"
echo "- Facility Name" | tee -a "$LOG_FILE"
echo "- DBA (Doing Business As) name" | tee -a "$LOG_FILE"
echo "- Physical Address" | tee -a "$LOG_FILE"
echo "- County" | tee -a "$LOG_FILE"
echo "- Phone Number" | tee -a "$LOG_FILE"
echo "- License Status (Active, Inactive, Expired)" | tee -a "$LOG_FILE"
echo "- License Type" | tee -a "$LOG_FILE"
echo "- Licensed Capacity" | tee -a "$LOG_FILE"
echo "- Administrator Name" | tee -a "$LOG_FILE"
echo "- Inspection Dates" | tee -a "$LOG_FILE"
echo "- Violations (Type C - most serious, Type B, Type A)" | tee -a "$LOG_FILE"
echo "- Enforcement Actions" | tee -a "$LOG_FILE"
echo "- Administrative Penalties" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Note: Texas ALFs are licensed under Texas Administrative Code, Title 26, Chapter 553" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# REGULATORY CONTEXT
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "TEXAS ALF REGULATORY CONTEXT" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Texas ALF licensing information:" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Licensing Authority: HHSC Regulatory Services" | tee -a "$LOG_FILE"
echo "Regulations: Texas Administrative Code, Title 26, Chapter 553" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "FY 2023 Enforcement Statistics (from annual report):" | tee -a "$LOG_FILE"
echo "- 79 administrative penalties assessed to ALFs" | tee -a "$LOG_FILE"
echo "- Total penalties: \$171,522" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Inspection Types:" | tee -a "$LOG_FILE"
echo "- Initial surveys (new facilities)" | tee -a "$LOG_FILE"
echo "- Monitoring surveys (routine inspections)" | tee -a "$LOG_FILE"
echo "- Complaint investigations" | tee -a "$LOG_FILE"
echo "- Follow-up surveys" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# ============================================================================
# Summary
# ============================================================================

echo "==================================================" | tee -a "$LOG_FILE"
echo "DOWNLOAD SUMMARY" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "⚠ Texas ALF data requires manual data request" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "RECOMMENDED NEXT STEPS:" | tee -a "$LOG_FILE"
echo "1. Submit Public Information Request to HHSC" | tee -a "$LOG_FILE"
echo "2. Request bulk facility list with inspection/violation data" | tee -a "$LOG_FILE"
echo "3. Save received data to: $DATA_DIR/raw/alf-facilities_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
echo "4. Save inspection data to: $DATA_DIR/raw/alf-inspections_${TIMESTAMP}.csv" | tee -a "$LOG_FILE"
echo "5. Run: node scripts/process-alf-tx.ts" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "ALTERNATIVE (Manual):" | tee -a "$LOG_FILE"
echo "- Use TULIP portal for individual facility lookups" | tee -a "$LOG_FILE"
echo "- Consider web scraping if public data request is denied/delayed" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Expected time to receive data: 10-30 business days" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Log saved to: $LOG_FILE" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
