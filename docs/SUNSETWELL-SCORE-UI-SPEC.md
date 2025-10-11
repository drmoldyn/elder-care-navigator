# SunsetWell Score UI Integration Specification

## Overview
Integrate the SunsetWell Score prominently into the search results page, displaying it in both list and map views with comprehensive quality metrics.

## Changes Required

### 1. Data Layer (`src/app/api/match/route.ts`)

Update the SQL query to join with `facility_scores` table:

```sql
SELECT
  r.*,
  fs.score as sunsetwell_score,
  r.health_inspection_rating,
  r.staffing_rating,
  r.quality_measure_rating,
  ...
FROM resources r
LEFT JOIN facility_scores fs ON r.id = fs.facility_id AND fs.version = 'v2'
ORDER BY fs.calculated_at DESC
LIMIT 1
WHERE ...
```

### 2. Resource Interface (COMPLETED ✓)

Updated `/src/app/results/[sessionId]/page.tsx` to include:
- `sunsetwell_score?: number` (0-100 composite score)
- `health_inspection_rating?: number`
- `staffing_rating?: number`
- `quality_measure_rating?: number`

### 3. List View - Table Layout

Replace card-based layout with a responsive table:

#### Desktop Table Columns (left to right):
1. **Checkbox** - Comparison selection
2. **Distance** - Miles away (if applicable)
3. **Facility Name** - With address below
4. **Health Inspection** - ⭐ rating (1-5)
5. **Staffing** - ⭐ rating (1-5)
6. **Quality** - ⭐ rating (1-5)
7. **SunsetWell Score** - **BOLD, PROMINENT** (0-100) with color coding:
   - 90-100: Dark green background
   - 75-89: Light green background
   - 60-74: Yellow background
   - 40-59: Orange background
   - 0-39: Red background
8. **Actions** - Request Info / Call / Directions buttons

#### Mobile View:
- Keep card-based layout for mobile (< 768px)
- Show SunsetWell Score as a large badge at top-right of card
- Show distance and key ratings inline

### 4. Map View Enhancements

Update `/src/components/navigator/map-view.tsx`:

#### Marker Color Coding by SunsetWell Score:
- **90-100**: 🟢 Dark Green pin
- **75-89**: 🟡 Light Green pin
- **60-74**: 🟡 Yellow pin
- **40-59**: 🟠 Orange pin
- **0-39**: 🔴 Red pin
- **No score**: ⚪ Gray pin (default)

#### Info Window Content:
```html
<div>
  <h3><strong>{facility.title}</strong></h3>
  {distance && <p>📍 {distance.toFixed(1)} miles away</p>}

  <div style="margin-top: 12px; padding: 8px; background: {scoreColor}; border-radius: 6px;">
    <strong style="font-size: 18px;">SunsetWell Score: {sunsetwellScore}</strong>
  </div>

  <div style="margin-top: 8px;">
    <p>⭐ Health Inspection: {healthRating}/5</p>
    <p>⭐ Staffing: {staffingRating}/5</p>
    <p>⭐ Quality Measures: {qualityRating}/5</p>
  </div>

  <div style="margin-top: 8px;">
    <a href="/results/{sessionId}?facility={facilityId}">View Details</a>
  </div>
</div>
```

### 5. Helper Functions

Create utility functions in `/src/lib/utils/score-helpers.ts`:

```typescript
export function getSunsetWellScoreColor(score: number | undefined): string {
  if (!score) return 'bg-gray-100 text-gray-700';
  if (score >= 90) return 'bg-green-700 text-white';
  if (score >= 75) return 'bg-green-500 text-white';
  if (score >= 60) return 'bg-yellow-400 text-gray-900';
  if (score >= 40) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
}

export function getSunsetWellScoreBadge(score: number | undefined): string {
  if (!score) return '—';
  return score.toFixed(0);
}

export function getMarkerColor(score: number | undefined): string {
  if (!score) return '#9CA3AF'; // gray-400
  if (score >= 90) return '#15803d'; // green-700
  if (score >= 75) return '#22c55e'; // green-500
  if (score >= 60) return '#facc15'; // yellow-400
  if (score >= 40) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}
```

### 6. Implementation Order

1. ✅ Update Resource interface
2. Update API route to fetch SunsetWell Score
3. Create score helper utilities
4. Update list view to table layout
5. Update map markers with color coding
6. Test on desktop and mobile
7. Deploy to production

### 7. Styling Notes

- Use Tailwind classes for consistency
- SunsetWell Score column should have `font-bold text-lg`
- Table should be `sticky` header on scroll
- Ensure accessibility (proper ARIA labels)
- Responsive breakpoints: Mobile < 768px, Desktop >= 768px

### 8. Fallback Behavior

When `sunsetwell_score` is `null` or `undefined`:
- Display "—" in table
- Show gray marker on map
- Include tooltip: "Score not yet available"
- Don't penalize in sorting

### 9. Sorting Enhancement

Add sort options:
- **Default**: By distance (for facilities)
- **SunsetWell Score**: High to low
- **Health Inspection**: High to low
- **Name**: Alphabetical

### 10. Testing Checklist

- [ ] Score displays correctly for facilities with scores
- [ ] Fallback works for facilities without scores
- [ ] Color coding is correct across all score ranges
- [ ] Mobile layout remains usable
- [ ] Map markers have correct colors
- [ ] Info windows display all metrics
- [ ] Table is responsive and scrollable
- [ ] Sorting works correctly
- [ ] Comparison checkbox still functions
- [ ] Action buttons (Call, Request Info, Directions) work

## Visual Mockup

### Desktop Table View:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ☐ │ 2.3 mi │ Heritage Manor │ ⭐⭐⭐⭐ │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐ │ [92] │ [Actions] │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ │ 3.1 mi │ Sunrise Care   │ ⭐⭐⭐   │ ⭐⭐⭐⭐   │ ⭐⭐⭐   │ [76] │ [Actions] │
└─────────────────────────────────────────────────────────────────────────────┘
       ^         ^                  ^          ^           ^        ^
    Checkbox  Distance          Health     Staffing    Quality  SUNSETWELL
                                Insp.                           (BOLD/BIG)
```

Note: SunsetWell Score should be visually largest and most prominent element in the row.
