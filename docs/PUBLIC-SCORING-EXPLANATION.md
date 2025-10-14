# What Does the SunsetWell Score Mean?

---

## Overview

The SunsetWell Score is a 0-100 rating that predicts a nursing home's likelihood of adverse health events for residents. We provide **two separate metrics**:

1. **SunsetWell Score (0-100)**: Absolute healthcare quality measure
2. **Percentile Rank (0-100)**: How this facility compares to peers in your state

---

## Understanding Your Two Scores

### 1. SunsetWell Score: Absolute Healthcare Quality

**What it measures:**
How good is this facility at preventing adverse health events?

**The score range:**
- **90-100**: Excellent - Top tier quality, minimal risk
- **75-89**: Very Good - Strong performance, low risk
- **60-74**: Good - Adequate quality, moderate risk
- **40-59**: Fair - Mixed performance, elevated risk
- **0-39**: Poor - Serious concerns, high risk

**Example:** A facility with a score of 78 has "Very Good" healthcare quality, meaning it shows strong performance at preventing adverse events.

**Key point:** This score is NOT peer-normalized. A score of 78 means the same thing whether the facility is in California or Wyoming - it's an absolute measure of healthcare quality.

---

### 2. Percentile Rank: How You Compare to Local Options

**What it measures:**
How does this facility compare to other nursing homes you might be considering in the same state?

**The percentile range:**
- **90-100**: Top 10% in your state - Exceptional
- **75-89**: Top quartile - Better than most
- **50-74**: Above average - Better than half
- **25-49**: Below average - Worse than half
- **0-24**: Bottom quartile - Needs improvement

**Example:** 85th percentile in California means this facility ranks better than 85% of California nursing homes (top 15%).

**Key point:** The same absolute score can have different percentile ranks in different states, reflecting local market competitiveness.

---

## Why Two Numbers Matter

**Consider these scenarios:**

**Scenario A: Competitive Market**
- SunsetWell Score: 78 (Very Good)
- Percentile: 60th (Above average in California)
- **Interpretation:** This is a good facility, but California has many excellent options. You might find better nearby.

**Scenario B: Less Competitive Market**
- SunsetWell Score: 78 (Very Good)
- Percentile: 95th (Top 5% in Wyoming)
- **Interpretation:** This is a good facility AND it's one of the best available in your area. Strong choice.

**Scenario C: Best of Limited Options**
- SunsetWell Score: 68 (Good)
- Percentile: 88th (Top 12% in rural area)
- **Interpretation:** This facility is "good" but not "very good" in absolute terms. However, it's still better than most facilities in your area. May be your best practical option.

---

## How We Calculate the Score

### Data Sources

We analyze quality metrics from:
- **CMS Medicare.gov**: Official federal nursing home data
- **Health Inspections**: Survey deficiencies and violations
- **Staffing Information**: Nurse hours per resident, turnover rates
- **Quality Measures**: Clinical outcomes reported to CMS
- **Safety Outcomes**: Substantiated complaints and facility-reported incidents

All data comes from publicly available federal sources.

### Our Approach

We analyze years of data from 14,752 nursing homes to identify which factors ACTUALLY predict adverse health events (substantiated complaints and facility-reported incidents).

We combine multiple public indicators into a single 0–100 score and periodically test the methodology against adverse outcome benchmarks. Our internal validation suggests the score provides useful signal beyond simple star ratings, though exact performance metrics are not disclosed.

**Why develop a new score?**
CMS uses a formula that starts with inspections and adds/subtracts stars. We take a different approach by combining 12+ quality signals including:
- Health inspection results (strongest predictor of safety issues)
- Staffing adequacy (nurse hours per resident)
- Staff stability (turnover rates correlate with care quality)
- Clinical quality measures (outcomes reported to CMS)

**Peer group normalization:** We compare facilities to similar nursing homes in the same state to account for regional differences in regulations, labor markets, and resident needs.

---

## How the SunsetWell Score Compares to CMS Stars

### CMS 5-Star Rating (Official Federal Rating)

**What it is:**
CMS (Centers for Medicare & Medicaid Services) rates all nursing homes 1-5 stars based on:
- Health inspections
- Staffing levels
- Quality measures

**How it's calculated:**
Simple formula starting with health inspection rating, then adding or subtracting stars based on staffing and quality.

**When to use it:**
Filter out unacceptable facilities (avoid 1-2 star facilities).

---

### SunsetWell Score (Predictive Analytics)

**What it is:**
A 0-100 score predicting the likelihood of adverse health events, based on multivariate analysis of which factors actually predict safety problems.

**How it's calculated:**
We combine multiple public indicators into a single 0–100 score and periodically re‑estimate weights to align the score with adverse outcome benchmarks. Facilities receive an absolute score (0–100) and a separate peer percentile. Exact formulas and parameters are proprietary.

**When to use it:**
Compare facilities that pass your CMS threshold to identify which is truly safer.

---

### Using Both Ratings Together

**Step 1: Filter with CMS Stars**
- Eliminate facilities with 1-2 stars (serious compliance issues)
- Consider only 3-5 star facilities

**Step 2: Compare with SunsetWell Score**
- Among acceptable facilities, use our score to rank by predicted safety
- Use the percentile to understand local market context

**Example:**
```
Search results in San Jose, CA:

Facility A: CMS ★★★★☆ | SunsetWell 78 (85th percentile) ← BEST CHOICE
Facility B: CMS ★★★★★ | SunsetWell 71 (70th percentile)
Facility C: CMS ★★★★☆ | SunsetWell 65 (50th percentile)
Facility D: CMS ★★★☆☆ | SunsetWell 54 (30th percentile)
```

**Insight:** Facility A (4 CMS stars, score 78) is predicted to be safer than Facility B (5 CMS stars, score 71) based on our multivariate analysis.

**Why the difference?** Our score incorporates factors like staff turnover rates, recent inspection details, and clinical outcomes that may not be fully reflected in the CMS star formula. Use both ratings together: CMS stars as a baseline filter, SunsetWell Score for comparing facilities that meet your minimum standards.

---

## Reliability & Uncertainty

Every SunsetWell Score includes:
- Reliability label: High / Moderate / Low — reflects the amount and recency of data available (e.g., staffing details and quality‑measure denominators).
- Uncertainty band: An informational range around the score showing expected variation due to data limitations. Use it to weigh close calls when scores are very similar.

Percentile ranks are computed within peer groups and incorporate modest reliability‑aware shrinkage for ranking only.

---

## Coverage & Updates

**Current coverage:**
- 14,380 nursing homes scored (97.5% of US nursing homes)
- 39,463 assisted living facilities scored (88.4% of US ALFs)

**Updates:**
Scores are recalculated quarterly when CMS releases new data.

**Version:**
Current score version: v2 (launched October 2025)

---

## Transparency & Limitations

### What We Measure
✓ Risk of substantiated complaints
✓ Risk of facility-reported incidents
✓ Factors within facility control (staffing, management practices)

### What We Don't Measure
✗ Resident satisfaction or quality of life
✗ Specific medical conditions or treatments
✗ Cultural fit or personal preferences
✗ Cost or insurance acceptance

### Important Notes

**Not a guarantee:** No score can perfectly predict future outcomes. Healthcare quality depends on many factors, some of which can't be measured from available data.

**Visit in person:** Use our score as a starting point, but always visit facilities in person, talk to staff, and trust your instincts.

**Individual needs vary:** A high-scoring facility might not be the right fit for your specific situation. Consider your loved one's medical needs, location preferences, and family priorities.

---

## Frequently Asked Questions

**Q: Is the SunsetWell Score official?**
A: No. CMS 5-star ratings are the only official federal ratings. Our score is analytical research based on publicly available CMS data.

**Q: Why is your score different from CMS?**
A: CMS uses a formula that starts with health inspections and adds/subtracts stars based on staffing and quality measures. We combine 12+ quality indicators and test which combinations align with adverse outcome benchmarks. Our methodology aims to provide additional signal for families comparing facilities with similar CMS ratings.

**Q: Can facilities game your score?**
A: We don't disclose our exact analytical methods or weightings to mitigate this risk. However, the underlying principle is that facilities that improve actual quality (better inspections, lower turnover, adequate staffing) will score higher.

**Q: What if a facility doesn't have a SunsetWell Score?**
A: About 2.5% of nursing homes lack sufficient data for scoring. You can still see their CMS ratings and individual metrics.

**Q: How often do scores change?**
A: We recalculate scores quarterly when CMS releases new data. Significant changes typically reflect real improvements or deteriorations in facility quality.

**Q: Which rating should I trust more?**
A: Both are valuable. Use CMS stars to set your minimum threshold, then use SunsetWell Score to compare among acceptable facilities. Think of it like buying a car: CMS is the safety rating (must pass), SunsetWell is the Consumer Reports ranking (which one is best).

---

## Contact & Feedback

Questions about our methodology? Contact us at [support@sunsetwell.com]

Found an error in facility data? CMS data issues should be reported to Medicare.gov. Scoring calculation concerns can be sent to [data@sunsetwell.com]

---

**Last Updated:** October 2025
**Score Version:** v2
**Data Source:** CMS Medicare.gov Provider Data

---

## Legal Disclaimer

SunsetWell Scores are analytical tools based on publicly available data and should not be considered medical advice. Always consult with healthcare professionals and visit facilities in person before making placement decisions. Past performance does not guarantee future results.

CMS 5-Star Ratings are the official federal quality ratings for nursing homes. For official quality information, visit Medicare.gov.
