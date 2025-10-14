# ALF SunsetWell Score (CA + FL + TX Prototype)

> _Update 2025-10-14:_ Data coverage and scoring exports now include CO, NY, and MN as well. The weighting logic below still reflects the CA/FL/TX pilot but the pipeline runs across all six states with imputation for the newer feeds.

## Goal
Produce a percentile-based composite for CA, FL, and TX assisted living facilities using available regulatory and service richness signals, anticipating future expansion to TX and beyond.

## Components
1. **Regulatory Risk (40%)**  
   - Inputs: complaint_count, sanction_count, fine_amount, deficiencies_total, deficiency_class1-4.  
   - Method: convert counts to percentile ranks within state; combine via weighted z-score (higher values -> poorer performance).  
   - Missing strategy: CA lacks these metrics; assign state-level priors via FL distribution and mark low-confidence flag.

2. **Capacity & Scale (20%)**  
   - Input: licensed_capacity.  
   - Rationale: extremely small facilities behave differently; use percentile to contextualize service richness comparisons.

3. **Service Richness (25%)**  
   - Inputs: activities_count, nurse_availability_count, special_programs_count (FL observed; CA/TX imputed).  
   - Approach: normalize counts by state; for CA/TX, impute via k-NN in UMAP embedding and down-weight by uncertainty and down-weight by uncertainty.

4. **Licensure Stability (15%)**  
   - Inputs: license_status (active vs in review), license_issue_date (tenure).  
   - Compute tenure in years; penalize non-active statuses.

## Workflow
1. Build feature matrix (`analysis/alf-sunsetwell/data/umap_features.csv`).
2. Derive state-level percentiles and z-scores for each component.
3. Apply component weights; rescale composite to 0–100 percentile within each state, then across combined cohort.
4. Emit confidence flag per facility depending on imputation intensity (e.g., CA regulatory metrics missing => confidence < 0.5).

## Deliverables
- `03_scoring_draft.ipynb` notebook implementing prototype.  
- JSON config file describing weights and imputation rules.  
- Validation report comparing score distribution by state.
