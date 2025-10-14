# Assisted Living Data Roadmap (USA)

## 1. States with Readily Accessible Datasets
| State | Source | Content | Access Notes |
|-------|--------|---------|--------------|
| California | data.chhs.ca.gov (Community Care Licensing RCFE roster) | Licensing, capacity, contact info | CSV via API; enforcement data requires separate request. |
| Florida | healthfinder.fl.gov (HealthFinder portal) | Licensing, complaints, deficiencies, service metrics | HTML SPA; export embedded JSON (already automated). |
| Texas | apps.hhs.texas.gov/providers/directories/al.xlsx | Licensing, capacity | XLS download; no inspection metrics in public feed. |
| Washington | data.wa.gov (Residential Care Services) | Licensing, survey/inspection results | CSV/JSON via Socrata API. |
| Colorado | data.colorado.gov (CDPHE) | Licensing, status dates, geocodes | ✅ Ingested via GeoJSON (2025-10-13); enforcement still requires CDPHE records request. |
| New York | health.data.ny.gov | Licensing roster, certification (bed counts) | ✅ Ingested (general + certification datasets merged); enforcement still requires additional sources. |
| Minnesota | alreportcard.dhs.mn.gov | Assisted Living Report Card (licensing + capacity + status) | ✅ Scraper (`process-alf-mn.ts`) live; enforcement by request to MDH. |
| Indiana | data.in.gov (ISDH) | Licensing directory, inspection summaries | CSV; some metrics require FOIA. |
| Arizona | azdhs.gov (HSAG) | Licensing with addresses | PDF/CSV mix; needs parsing. |

## 2. States Requiring Public Records or Scraping
| State | Portal | Notes |
|-------|--------|-------|
| Alabama | ADPH (request via email) | Licensing roster available on request; no public API. |
| Arkansas | ADH (FOIA) | Complaints/deficiencies via FOIA. |
| Georgia | DHS Healthcare Facility Regulation | Interactive search only; scraping or request. |
| Illinois | IDPH | Facility search portal; complaints via FOIA. |
| Kansas | KDADS | Rosters by request; inspection PDFs. |
| Louisiana | LDH | Interactive only; must request CSV. |
| Maryland | OHCQ | Licensing PDF lists; data request for structured export. |
| Michigan | LARA | Online roster (Excel) + FOIA for enforcement. |
| Missouri | DHSS | CSV for licensing; inspection via request. |
| Ohio | Department of Aging | Interactive search; requires request for bulk data. |
| Pennsylvania | DHS | Licensing PDF lists; complaints need request. |
| Tennessee | THCA | Public lookup; no bulk download. |
| Virginia | VDH | Rosters available; inspection data by request. |
| …and similarly for remaining states with only interactive portals.

## 3. Suggested Rollout Phases
1. **Phase 1 (Complete)** – CA, FL, TX (licensing baseline).
2. **Phase 2 (In progress)** – Add Washington, Colorado, New York, Minnesota (open datasets with both licensing and some quality metrics). ✅ Colorado, New York, and Minnesota complete; Washington next.
3. **Phase 3** – Prioritize states with API-accessible licensing but limited enforcement data (Indiana, Arizona, Michigan).
4. **Phase 4** – Tackle FOIA-only states in batches; automate request templates and ingestion scripts.
5. **Phase 5** – Revisit quality coverage; fill gaps via imputation until enforcement feeds are delivered.

## 4. Action Items
- Build a state intake tracker (licensing feed, inspection feed, status).
- Draft FOIA/public-information request templates targeting enforcement metrics.
- Extend `scripts/process-alf-*.ts` pattern for each new state as data arrives.
- Update UMAP/scoring notebooks after each batch to monitor generalization effects.
