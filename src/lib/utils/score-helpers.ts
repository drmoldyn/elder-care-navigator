/**
 * Utility functions for SunsetWell Score display and formatting
 */

/**
 * Returns Tailwind CSS classes for color-coding SunsetWell Score badges
 */
export function getSunsetWellScoreColor(score: number | undefined): string {
  if (score == null) return 'bg-gray-100 text-gray-700';
  if (score >= 90) return 'bg-green-700 text-white';
  if (score >= 75) return 'bg-green-500 text-white';
  if (score >= 60) return 'bg-yellow-400 text-gray-900';
  if (score >= 40) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
}

/**
 * Returns formatted SunsetWell Score badge text
 */
export function getSunsetWellScoreBadge(score: number | undefined): string {
  if (score == null) return '—';
  return score.toFixed(0);
}

/**
 * Returns hex color for map markers based on SunsetWell Score
 */
export function getMarkerColor(score: number | undefined): string {
  if (score == null) return '#9CA3AF'; // gray-400
  if (score >= 90) return '#15803d'; // green-700
  if (score >= 75) return '#22c55e'; // green-500
  if (score >= 60) return '#facc15'; // yellow-400
  if (score >= 40) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

/**
 * Returns star emoji string for rating display (1-5 stars)
 */
export function getStarRating(rating: number | undefined): string {
  if (!rating) return '—';
  return '⭐'.repeat(Math.min(5, Math.max(1, Math.round(rating))));
}

/**
 * Returns label for SunsetWell Score
 */
export function getSunsetWellScoreLabel(score: number | undefined): string {
  if (!score) return '—';
  if (score >= 90) return 'Exceptional';
  if (score >= 75) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Below Average';
}

/**
 * Returns tooltip text explaining SunsetWell Score
 */
export function getSunsetWellScoreTooltip(score: number | undefined): string {
  if (!score) return 'Score not yet available';
  if (score >= 90) return 'Exceptional';
  if (score >= 75) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Below Average';
}
