import type { NearbyIssue } from '../utils/validation.js';

export interface DuplicateResult {
  isDuplicate: boolean;
  duplicateOf: string | null;
  duplicateScore: number;
}

const DUPLICATE_RADIUS_METERS = 250;
const DUPLICATE_WINDOW_DAYS = 14;

/**
 * Rule-based duplicate detection — no Gemini calls.
 * Checks nearbyIssues for same category + recent submission + within radius.
 */
export function detectDuplicate(
  category: string,
  latitude: number | null,
  longitude: number | null,
  nearbyIssues: NearbyIssue[] = []
): DuplicateResult {
  if (latitude === null || longitude === null || nearbyIssues.length === 0) {
    return { isDuplicate: false, duplicateOf: null, duplicateScore: 0 };
  }

  const now = Date.now();
  const windowMs = DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  let bestScore = 0;
  let bestId: string | null = null;

  for (const issue of nearbyIssues) {
    // Skip resolved/closed issues
    if (issue.status === 'resolved' || issue.status === 'closed') continue;

    // Skip if nearby issue has no coordinates
    if (issue.latitude === null || issue.longitude === null) continue;

    // Check time window
    const createdTime = new Date(issue.createdAt).getTime();
    if (isNaN(createdTime) || now - createdTime > windowMs) continue;

    // Calculate distance in metres
    const dist = haversineMeters(latitude, longitude, issue.latitude, issue.longitude);
    if (dist > DUPLICATE_RADIUS_METERS) continue;

    // Score: category match (40pts) + proximity (40pts) + recency (20pts)
    let score = 0;
    if (issue.category === category) score += 40;
    score += Math.round(40 * (1 - dist / DUPLICATE_RADIUS_METERS));
    const ageDays = (now - createdTime) / (1000 * 60 * 60 * 24);
    score += Math.round(20 * (1 - ageDays / DUPLICATE_WINDOW_DAYS));

    if (score > bestScore) {
      bestScore = score;
      bestId = issue.id;
    }
  }

  const isDuplicate = bestScore >= 60; // threshold: 60/100
  return {
    isDuplicate,
    duplicateOf: isDuplicate ? bestId : null,
    duplicateScore: bestScore,
  };
}

/** Haversine formula — returns distance in metres. */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000; // Earth's radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
