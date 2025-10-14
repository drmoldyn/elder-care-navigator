# Dual Rating Display: SunsetWell Score + CMS Stars

**Purpose**: Show both SunsetWell Score and CMS ratings with clear hierarchy and user education

**Design Philosophy**: Transparency builds trust. Show official data (CMS) + our predictive analysis (SunsetWell).

---

## ⚠️ STRATEGIC NOTE: Trade Secret Protection

**For PUBLIC-facing content, use:** `docs/PUBLIC-SCORING-EXPLANATION.md`

**Do NOT disclose publicly:**
- Exact metric weights (53%, 14%, 9%, etc.)
- Regression formulas or equations
- Z-score calculation methods
- Specific coefficient values

**Sections 5-6 below** contain technical details for INTERNAL use only. They should NOT appear in public documentation to:
1. Protect competitive advantage (trade secret)
2. Prevent score gaming by facilities
3. Maintain analytical edge over competitors

---

## Visual Hierarchy

### Primary: SunsetWell Score
- **Size**: Large, prominent
- **Color**: Traffic light system (🟢 🟡 🟠 🔴)
- **Context**: Percentile rank within peer group

### Secondary: CMS Stars
- **Size**: Smaller, supporting detail
- **Color**: Gray/neutral (not competing for attention)
- **Position**: Below or beside SunsetWell Score

---

## Component 1: Results List/Table View

### Desktop Table
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Facility Name          │ Distance │ Quality Score                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ Sunrise Senior Living  │ 0.8 mi   │ 🟢 SunsetWell Score: 78                  │
│ 123 Main St, San Jose  │          │    Very Good quality                     │
│ ☎ (408) 555-1234      │          │    85th percentile in CA (Top 15%)       │
│                        │          │    CMS: ★★★★☆ (4 stars)                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ Maple Gardens Care     │ 1.2 mi   │ 🟡 SunsetWell Score: 65                  │
│ 456 Oak Ave, San Jose  │          │    Good quality                          │
│                        │          │    52nd percentile in CA (Above average) │
│ ☎ (408) 555-5678      │          │    CMS: ★★★☆☆ (3 stars)                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Card View
```
┌─────────────────────────────────────┐
│ Sunrise Senior Living               │
│ 📍 0.8 miles • ☎ Call              │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🟢 SunsetWell Score: 78     │   │  ← PRIMARY (green badge)
│ │    Healthcare Quality:       │   │
│ │    Very Good                 │   │
│ │                              │   │
│ │    Compared to CA peers:     │   │
│ │    85th percentile (Top 15%) │   │
│ └─────────────────────────────┘   │
│                                     │
│ CMS Rating: ★★★★☆ (4 stars)        │  ← SECONDARY (gray text)
│ Health ★★★★ | Staffing ★★★★★       │
│                                     │
│ ℹ️ What does this score mean?       │  ← Link to explanation page
└─────────────────────────────────────┘
```

### Mobile List (Compact)
```
Sunrise Senior Living               0.8 mi
🟢 78 • 85th %ile CA • CMS ★★★★☆
   Very Good quality, Top 15% in state
───────────────────────────────────────────
Maple Gardens Care                  1.2 mi
🟡 65 • 52nd %ile CA • CMS ★★★☆☆
   Good quality, Above avg in state
```

---

## Component 2: Public Explanation Page

**URL:** `/about/scoring` or similar

**Content:** See `docs/PUBLIC-SCORING-EXPLANATION.md`

**Key sections:**
1. Understanding your two scores (Score vs. Percentile)
2. How we calculate the score (high-level, no formulas)
3. How SunsetWell compares to CMS
4. FAQ

**Strategic notes:**
- Does NOT disclose exact weights or formulas (trade secret protection)
- Does NOT show regression equations (prevents gaming)
- DOES explain data sources and high-level approach (transparency)
- Avoid comparative claims without published evidence

---

## Component 2a: Quick Tooltip (Before User Clicks Through)

### Title: "Quick Explanation"

---

### Section 2: Quick Inline Explanation

```
┌──────────────────────────────────────────────────────┐
│ 📊 Understanding SunsetWell Ratings                  │
└──────────────────────────────────────────────────────┘

Every facility shows TWO SunsetWell metrics:

1️⃣ SunsetWell Score (0-100)
   Absolute healthcare quality measure
   Predicts likelihood of adverse health events

   90-100: Excellent  | 75-89: Very Good | 60-74: Good
   40-59:  Fair       | 0-39:  Poor

2️⃣ Percentile Rank (0-100)
   How this facility compares to peers in your state

   85th percentile = Better than 85% of facilities in this state

Why both matter:
────────────────
• Score 78 (Very Good) means the same quality everywhere
• But 78 might be 60th percentile in CA vs 95th percentile in WY
• The percentile shows if you can find better options locally

---

CMS Stars (1-5 ⭐)
Official federal rating from Medicare.gov

Use together:
• Filter with CMS (avoid 1-2 star facilities)
• Compare with SunsetWell Score (which is safer?)

📖 [Learn more about our methodology](/about/scoring)
```

---

### Section 3: CMS Stars (Complementary Official Data)

```
┌──────────────────────────────────────────────────────┐
│ ⭐ CMS Stars: Official Federal Rating                │
└──────────────────────────────────────────────────────┘

What it measures:
─────────────────
Does this facility meet federal quality standards?

CMS (Centers for Medicare & Medicaid Services) inspects all
nursing homes and rates them 1-5 stars in three areas:

1. Health Inspections (deficiencies found during surveys)
2. Staffing (nursing hours per resident per day)
3. Quality Measures (15 clinical outcomes like pressure ulcers)

How it works:
─────────────
The overall star rating uses a simple formula:
• Start with health inspection rating
• Add 1 star if staffing is excellent (5★)
• Subtract 1 star if staffing is poor (1★)
• Add 1 star if quality measures are excellent (5★)
• Subtract 1 star if quality measures are poor (1★)

Example:
────────
★★★★☆ (4 stars overall)
• Health Inspections: ★★★★
• Staffing: ★★★★★
• Quality Measures: ★★★

Value to you:
─────────────
✓ Official regulatory data (legally binding)
✓ Universally recognized (same on Medicare.gov)
✓ Easy to understand (1-5 scale)
✓ Shows compliance with federal standards

When to use it:
───────────────
✓ First filter (eliminate 1-2 star facilities immediately)
✓ Checking official compliance status
✓ Verifying basic quality thresholds
✓ Looking up component ratings (which area needs work?)
```

---

### Section 4: How to Use Both Ratings

```
┌──────────────────────────────────────────────────────┐
│ 🎯 Decision Framework: Filter + Compare              │
└──────────────────────────────────────────────────────┘

Step 1: Filter with CMS Stars
──────────────────────────────
Use CMS ratings to eliminate unacceptable facilities:

🚫 1-2 stars = Avoid (serious compliance issues)
⚠️  3 stars = Acceptable (meets minimum standards)
✓  4-5 stars = Good (exceeds standards)

Step 2: Compare with SunsetWell Score
──────────────────────────────────────
Among facilities that pass Step 1, use our score to rank:

Example search results in San Jose, CA:
┌────────────────────────────────────────────────────┐
│ Facility A: CMS ★★★★☆ | SunsetWell 78 (85th %ile) │ ← BEST
│ Facility B: CMS ★★★★★ | SunsetWell 71 (70th %ile) │
│ Facility C: CMS ★★★★☆ | SunsetWell 65 (50th %ile) │
│ Facility D: CMS ★★★☆☆ | SunsetWell 54 (30th %ile) │
└────────────────────────────────────────────────────┘

Insight: Facility A (4 CMS stars) is actually better than
Facility B (5 CMS stars) when you account for peer comparison
and predicted safety outcomes.

Why? Because CMS ratings are nationwide and don't account for:
• How competitive the market is
• Regional differences in staffing/regulations
• The actual LIKELIHOOD of safety problems

Step 3: Investigate Discrepancies
──────────────────────────────────
If CMS and SunsetWell disagree, dig deeper:

High CMS, Lower SunsetWell:
• CMS ★★★★★ but SunsetWell 62 (60th %ile)
• Possible reason: Great on paper, but in a very competitive
  market (like San Francisco) or high staff turnover

Lower CMS, Higher SunsetWell:
• CMS ★★★☆☆ but SunsetWell 75 (90th %ile)
• Possible reason: Facility is exceptional for its peer group
  (like rural areas with limited options)

→ Check individual CMS component ratings on detail page
→ Call facility to ask about specific concerns
```

---

### Section 5: Transparency & Methodology

```
┌──────────────────────────────────────────────────────┐
│ 🔬 Our Methodology (Technical Details)               │
└──────────────────────────────────────────────────────┘

Data Sources:
─────────────
• CMS Medicare.gov (14,752 nursing homes)
• CMS 5-Star Ratings (inspection, staffing, quality measures)
• Safety Outcome Data (complaints, incidents, 3-year history)

Method Overview:
────────────────
We combine publicly available indicators (inspections, staffing, staffing stability, clinical measures) into a single 0–100 score. Weighting is empirical and versioned to align with adverse outcome benchmarks like hospitalization and ED visit rates. Exact formulas and parameters are proprietary.

Calculation:
────────────
For each facility:
1. Map raw metrics to absolute 0–100 sub‑scores (e.g., stars → 0–100; nurse hours 2.0→0 to 6.0→100; turnover/deficiencies/fines inverted).
2. Apply empirical weights to sub‑scores: score_abs = Σ(weight × subscore) / Σ(weight).
3. Output SunsetWell Score = score_abs (absolute 0–100; not peer‑normalized).
4. Compute Percentile = rank of SunsetWell Score within its peer group (state/division + size/ownership), with modest reliability-aware shrinkage for ranking only.

Peer Groups:
────────────
Facilities compared within: State + Provider Type

Examples:
• "California nursing_home" (3,184 facilities)
• "Texas assisted_living" (2,891 facilities)

Why peer groups?
• Fair comparison (San Francisco vs SF, not SF vs rural Wyoming)
• Accounts for regional regulations, labor markets, resident acuity

Updates:
────────
• Scores recalculated quarterly (when CMS releases new data)
• Version v2 (launched October 2025)

Coverage:
─────────
• 14,380 nursing homes scored (97.5% of all US nursing homes)
• 39,463 assisted living scored (88.4% of all US ALFs)

Validation:
───────────
✓ Separate absolute score and peer percentile
✓ Internal validation vs adverse outcomes
✓ Periodic monitoring and versioning

More details:
─────────────
High-level methodology is published publicly. Proprietary details (e.g., exact weights and optimization) are not disclosed.
```

---

### Section 6: FAQ

```
Q: Which rating should I trust more?
────────────────────────────────────
A: Both! Use CMS stars to filter, SunsetWell Score to compare.

Think of it like buying a car:
• CMS = Safety rating (must pass threshold)
• SunsetWell = Consumer Reports ranking (which one is best?)


Q: Why do the ratings sometimes disagree?
──────────────────────────────────────────
A: CMS uses a simple formula (add/subtract stars). We use
predictive analytics and peer comparison.

Example: A facility can be "3 stars" nationwide but "top 10%"
in a tough market like California.


Q: Is SunsetWell Score official?
─────────────────────────────────
A: No. CMS stars are the ONLY official federal rating.

Our score is analytical - like a credit report analysis
(not the credit score itself). It adds context CMS doesn't
provide.


Q: How often are scores updated?
────────────────────────────────
A: Both update quarterly when CMS releases new data.


Q: What if a facility doesn't have a SunsetWell Score?
───────────────────────────────────────────────────────
A: ~2.5% of nursing homes lack sufficient data for scoring.

You can still see their CMS ratings and individual metrics.


Q: Can I see the full methodology?
──────────────────────────────────
A: Yes! We believe in full transparency:
• Methodology: [Link to scoring-model.md]
• Regression analysis: [Link to regression-results.json]
• Metric weights: [Link to facility_metric_weights table]


Q: Who built this?
──────────────────
A: SunsetWell's scoring system was developed using publicly
available CMS data and peer-reviewed statistical methods.

All data comes from official federal sources (Medicare.gov).
```

---

## Component 3: Inline Tooltips

### Tooltip: SunsetWell Score Badge
```
[Hover over 🟢 78]

╔════════════════════════════════════════════╗
║ SunsetWell Score: 78                       ║
║                                            ║
║ Two metrics:                               ║
║                                            ║
║ 1️⃣ Healthcare Quality: Very Good (78/100) ║
║    Absolute measure of how good this       ║
║    facility is at preventing adverse       ║
║    health events (NOT peer-normalized)     ║
║                                            ║
║ 2️⃣ Peer Ranking: 85th percentile in CA    ║
║    Better than 85% of California nursing   ║
║    homes (Top 15% in state)                ║
║                                            ║
║ Based on empirical analysis of 14,752      ║
║ nursing homes predicting complaints and    ║
║ facility-reported incidents.               ║
║                                            ║
║ → Learn more about methodology             ║
╚════════════════════════════════════════════╝
```

### Tooltip: CMS Stars
```
[Hover over ★★★★☆]

╔══════════════════════════════════════╗
║ CMS Rating: 4 stars                  ║
║                                      ║
║ Official federal rating from         ║
║ Medicare.gov based on:               ║
║                                      ║
║ • Health Inspections: ★★★★           ║
║ • Staffing: ★★★★★                    ║
║ • Quality Measures: ★★★              ║
║                                      ║
║ → View on Medicare.gov               ║
╚══════════════════════════════════════╝
```

---

## Component 4: Facility Detail Page

### Full Rating Breakdown
```
┌──────────────────────────────────────────────────────┐
│ Quality & Safety Ratings                             │
└──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🎯 SunsetWell Score                                         │
│                                                             │
│    ████████████████████████░░░░░░░░░  78/100                │
│                                                             │
│    • Predicted Safety: Above Average                        │
│    • Peer Ranking: Top 15% in California (85th percentile) │
│    • Market Context: Competitive (3,184 CA nursing homes)   │
│                                                             │
│    Component Breakdown:                                     │
│    ├─ Inspection & Safety     ██████████░ 82/100 (53% wt)  │
│    ├─ Staffing Capacity        ████████░░ 76/100 (32% wt)  │
│    └─ Staff Stability          ████████░░ 74/100 (15% wt)  │
│                                                             │
│    ℹ️ Based on regression analysis predicting:             │
│       • Substantiated complaints                            │
│       • Facility-reported incidents                         │
│                                                             │
│    [📊 View Full Methodology]                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ⭐ Official CMS Rating: ★★★★☆ (4 stars)                     │
│                                                             │
│    Health Inspections:    ★★★★☆  (4 stars)                 │
│    • Survey Date: March 2025                                │
│    • Deficiencies: 3 (below state average)                  │
│    • No immediate jeopardy citations                        │
│                                                             │
│    Staffing:              ★★★★★  (5 stars)                 │
│    • Total Nurse Hours: 4.2 hours/resident/day              │
│    • RN Hours: 0.8 hours/resident/day                       │
│    • Turnover: 12% (well below state average of 47%)        │
│                                                             │
│    Quality Measures:      ★★★☆☆  (3 stars)                 │
│    • 15 measures from MDS data & Medicare claims            │
│    • Strongest: Low falls with injury                       │
│    • Needs improvement: Antipsychotic medication use        │
│                                                             │
│    [🔗 View Full CMS Report on Medicare.gov]                │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Coding System

### SunsetWell Score Colors
```
🟢 Green:  75-100  (Top quartile, excellent)
🟡 Yellow: 60-74   (Above average, good)
🟠 Orange: 40-59   (Below average, fair)
🔴 Red:    0-39    (Bottom quartile, poor)
```

### Percentile Context
```
Top 10%     → "Exceptional in [state]"
Top 25%     → "Top quartile in [state]"
50-75%      → "Above average in [state]"
25-50%      → "Below average in [state]"
Bottom 25%  → "Bottom quartile in [state]"
Bottom 10%  → "Needs improvement in [state]"
```

---

## Copy Guidelines

### Voice & Tone
- **Transparent**: "Here's exactly how we calculate this"
- **Helpful**: "Use CMS to filter, SunsetWell to compare"
- **Empathetic**: Acknowledge this is hard/stressful
- **Confident**: We stand behind our methodology
- **Humble**: CMS is official, we're analytical

### What to Emphasize
✓ Predictive power (safety outcomes, not just compliance)
✓ Peer comparison (apples-to-apples within state)
✓ Transparency (full methodology available)
✓ Complementary to CMS (not competing)

### What to Avoid
✗ Claiming to be "official" or "regulatory"
✗ Saying we're "better" than CMS (different, complementary)
✗ Technical jargon without explanation
✗ Hiding CMS ratings or methodology

---

## Implementation Priority

### Phase 1 (MVP) - REQUIRED
1. ✅ Show both scores in table/list view
2. ✅ Color-code SunsetWell Score
3. ✅ Add basic tooltip explaining difference
4. ✅ Link to full methodology page

### Phase 2 - IMPORTANT
1. ⏳ Full methodology explainer page
2. ⏳ Interactive FAQ
3. ⏳ Component breakdown on detail page

### Phase 3 - NICE TO HAVE
1. ⏳ Video explanation
2. ⏳ Interactive score calculator
3. ⏳ Peer group comparison charts

---

## Success Metrics

### User Understanding (Survey after 2 weeks)
- [ ] 80%+ users understand what SunsetWell Score measures
- [ ] 70%+ users can explain difference between our score and CMS
- [ ] 90%+ users find dual ratings helpful (not confusing)

### Engagement
- [ ] 60%+ users click methodology link
- [ ] 40%+ users expand component breakdowns
- [ ] <5% bounce rate on methodology page

### Trust
- [ ] Net Promoter Score >50
- [ ] <10% users report ratings as "confusing"
- [ ] 80%+ users say ratings help with decision-making

---

## Legal/Compliance Notes

### Disclaimers Required
```
⚠️ Important: SunsetWell Scores are analytical tools based on
publicly available CMS data. They are not official regulatory
ratings. For official quality information, visit Medicare.gov.

CMS 5-Star Ratings are the only official federal quality ratings
for nursing homes.
```

### Attribution
```
Data Sources:
• CMS Medicare.gov Provider Data
• CMS 5-Star Quality Rating System
• Public domain safety outcome data

All data is publicly available from federal sources.
```

---

## Next Steps

1. [ ] Design mockups with actual data
2. [ ] User test with 5-10 families
3. [ ] Write final copy for methodology page
4. [ ] Implement phase 1 (table view + tooltips)
5. [ ] A/B test single score vs dual rating
6. [ ] Measure user comprehension & trust
