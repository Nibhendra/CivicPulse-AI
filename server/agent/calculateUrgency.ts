export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface UrgencyResult {
  priorityLevel: PriorityLevel;
  urgencyScore: number;
}

/**
 * Recalculate/confirm urgency based on severity score, urgency score, and duplicate status.
 * Used to validate/correct Gemini's priority assessment with deterministic rules.
 */
export function calculateUrgency(
  severityScore: number,
  urgencyScore: number,
  isDuplicate: boolean
): UrgencyResult {
  // Composite score: 60% severity + 40% urgency
  let composite = severityScore * 0.6 + urgencyScore * 0.4;

  // Boost urgency if it's a duplicate (means problem is persisting/widening)
  if (isDuplicate) composite = Math.min(10, composite + 1.5);

  let priorityLevel: PriorityLevel;
  if (composite >= 8.5) priorityLevel = 'critical';
  else if (composite >= 6.5) priorityLevel = 'high';
  else if (composite >= 4.0) priorityLevel = 'medium';
  else priorityLevel = 'low';

  return {
    priorityLevel,
    urgencyScore: Math.round(Math.min(10, composite)),
  };
}
