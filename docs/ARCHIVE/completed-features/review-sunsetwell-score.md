# SunsetWell Score Integration Review

## TL;DR
A few key plumbing details are still missing before the UI work can deliver the promised SunsetWell Score experience. Most issues stem from data-access assumptions that don’t line up with the current migrations (e.g., which identifier to join on, how to pick the latest score) and a few UI helpers that mis-handle truthful `0` scores. Addressing the points below will ensure the score renders everywhere reliably and that future automation (nightly refresh, peer groups) can plug in cleanly.

---

## Findings & Recommendations

1. **Join path mismatch (`resources.id` vs `facility_scores.facility_id`)**  
   The spec’s SQL snippet joins on `r.id = fs.facility_id` (`docs/SUNSETWELL-SCORE-UI-SPEC.md:15-22`), but the migration defines `facility_scores.facility_id` as a text FK to `resources.facility_id` (`supabase/migrations/0014_facility_scores.sql:13-36`).  
   **Fix:** either store `resources.id` in `facility_scores`, or update the join everywhere (SQL helper + Supabase select) to use the public identifier `resources.facility_id`. Without that, every score lookup will come back `NULL`.

2. **Field name typo (`quality_measures_rating`)**  
   The spec and README reference `r.quality_measures_rating` (`docs/SUNSETWELL-SCORE-UI-SPEC.md:16-18`), while the data import and schema use the singular `quality_measure_rating`.  
   **Fix:** normalize on the actual column name to avoid rendering `null` across the UI.

3. **No constraint on “latest” score row**  
   The helper currently pulls `facility_scores!left(score)` without filtering by `version` or `calculation_date` (`src/lib/matching/sql-matcher.ts:76-83`). If multiple rows accumulate, the client receives an array and silently drops the score.  
   **Fix:** either add a filtered join (`...select("facility_scores!inner(score)", { head: true, filter: { version: 'v2' } })`) or create a Supabase view that exposes the latest `v2` row. Also apply the same logic to the SQL join described in the spec.

4. **API response still emits constant score stub**  
   The match endpoint returns `score: { score: 100 }` regardless of facility data (`src/app/api/match/route.ts:116-129`). That means downstream consumers never surface the real SunsetWell Score even after the data is wired up.  
   **Fix:** replace the stub with the actual `summary.sunsetwellScore` value (and propagate a confidence band if needed).

5. **Provider-type alias handling**  
   The matching SQL already selects `facility_scores!left(score)` but doesn’t normalize provider-type aliases, so the new peer-group logic will mismatch (`src/lib/matching/sql-matcher.ts:26-33`). Align the aliases here with the ones you introduced in the normalization script (`scripts/normalize-facility-metrics.ts:25-36`) to keep peer groups and UI filters consistent.

6. **Score helpers treat `0` as “missing”**  
   `getSunsetWellScoreColor`, `getSunsetWellScoreBadge`, and `getMarkerColor` all return the fallback path when `score === 0` because of the `if (!score)` guard (`src/lib/utils/score-helpers.ts:9-32`). Legitimately poor-performing facilities (score 0–39) should render in red, not “—”.  
   **Fix:** switch to explicit `score == null` checks.

7. **Spec doesn’t capture storage/view requirements**  
   To avoid leaking implementation details everywhere, consider adding a materialized view (e.g., `facility_scores_latest`) that bakes in `version = 'v2'` and the most recent `calculation_date`. Then both the API and UI can join to a single, predictable source.

8. **UI polish suggestions**
   - Surface the component breakdown (inspection/ staff capacity / stability) either inline or via a tooltip so users understand *why* a score is high/low.  
   - Give users a filter shortcut for “SunsetWell Score ≥ 75” to make the new data actionable, and add an explicit “No score yet” row state instead of silently blending with others.  
   - In the map popup, swap the hard-coded link to `/facility/${resource.id}` for the actual facility detail route (once built) or the existing results detail panel so we don’t ship a dead link (`src/components/map/facility-map.tsx:106-133`).

9. **Score pipeline prerequisites**  
   Remember that the scripts currently emit warnings (“table not found”) because the 0014 migrations haven’t been applied. Once the schema exists, schedule the run order the README documents (`seed-metric-weights → seed-peer-groups → normalize → calculate-benchmarks`) so the UI has live data to work with.

---

## Closing Thoughts

The README and roadmap updates do a solid job of elevating the SunsetWell Score story. The biggest blockers now are the data join + helper issues outlined above. Once those are addressed, wiring the score into the table and map should be straightforward, and we’ll be in a good position to extend the model to other provider types.
