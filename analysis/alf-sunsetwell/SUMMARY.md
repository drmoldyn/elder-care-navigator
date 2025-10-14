# ALF Scoring Snapshot (CA + FL + TX + CO + NY + MN)

## Key Files
- `data/alf_ca_fl_tx_co_ny_mn_20251014.csv`: unified facility metrics (CA, FL, TX, CO, NY, MN).
- `data/umap_embedding.csv`: UMAP embedding (n_neighbors=25, min_dist=0.3) across the six-state cohort.
- `data/service_imputations.csv`: k-NN service estimates + confidence for facilities missing analytics (mostly CA/TX/CO/NY/MN).
- `data/alf_scores_v1.csv`: weighted composite percentiles by state.
- `data/weight_sensitivity.csv`: delta analysis for alternate weightings.

## Observations
- Percentile distributions stay centered (median ~0.5) for CA, FL, TX; Colorado skews higher (0.77 mean percentile), New York remains very high (~0.95) because only licensing metrics are available, and Minnesota trends low (~0.35 mean percentile) given capacity-heavy scoring without enforcement inputs.
- TX, CO, NY, and MN feeds provide licensing + capacity but no regulatory/service metrics; imputation confidence remains low (~0.1) outside Florida.
- Weight sensitivity still shows <0.03 average percentile shift under tested adjustments.

## Pending
- HHSC (TX), CDPHE (CO), NY DOH, and MDH (MN) feeds lack enforcement metrics; need public records requests for complaints/deficiencies once open-data states are exhausted.
- Supabase upload awaits `supabase_py` (or alternate ingestion path).
- Final scoring spec + QA doc for stakeholder review.
