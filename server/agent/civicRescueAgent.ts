import { analyzeIssueImage } from './analyzeIssueImage';
import { detectDuplicate } from './detectDuplicate';
import { assignDepartment } from './assignDepartment';
import { calculateUrgency } from './calculateUrgency';
import { ensureFormalComplaint } from './generateComplaint';
import type { ProcessIssueBody } from '../utils/validation';

export interface AgentResult {
  aiCategory: string;
  aiSeverity: 'low' | 'medium' | 'high' | 'critical';
  severityScore: number;
  urgencyScore: number;
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  aiConfidence: number;
  publicRisk: string;
  damageDescription: string;
  recommendedDepartment: string;
  suggestedNextAction: string;
  isDuplicate: boolean;
  duplicateOf: string | null;
  duplicateScore: number;
  formalComplaint: string;
  agentLog: string[];
}

/**
 * Civic Rescue Agent — full pipeline:
 *   1. Analyze image + text with Gemini (single call)
 *   2. Assign department (rule-based)
 *   3. Recalculate urgency (deterministic)
 *   4. Detect duplicates (rule-based, no extra Gemini calls)
 *   5. Ensure formal complaint exists
 */
export async function runCivicRescueAgent(body: ProcessIssueBody): Promise<AgentResult> {
  const log: string[] = [];
  log.push(`🚀 Civic Rescue Agent started for issue: ${body.issueId}`);

  // ── Step 1: Image + text analysis (one Gemini call) ──────────────────────
  log.push('Step 1: Analyzing image and civic issue details…');
  const { analysis, usedImage, agentLog: analysisLog } = await analyzeIssueImage({
    imageURL: body.imageURL,
    title: body.title,
    description: body.description,
    category: body.category,
    latitude: body.latitude ?? 0,
    longitude: body.longitude ?? 0,
    address: body.address,
    locality: body.locality,
  });
  log.push(...analysisLog);

  if (!analysis.isValidCivicIssue) {
    log.push('⚠ AI flagged this as possibly not a valid civic issue — proceeding anyway');
  }

  // ── Step 2: Department assignment (rule-based override) ──────────────────
  log.push('Step 2: Assigning responsible department…');
  const department = assignDepartment(analysis.aiCategory);
  const finalDepartment = department || analysis.recommendedDepartment;
  log.push(`✓ Department: ${finalDepartment}`);

  // ── Step 3: Urgency recalculation ─────────────────────────────────────────
  log.push('Step 3: Calculating urgency and priority…');
  const urgencyResult = calculateUrgency(
    analysis.severityScore,
    analysis.urgencyScore,
    false // duplicate not known yet
  );
  log.push(`✓ Priority: ${urgencyResult.priorityLevel} (score: ${urgencyResult.urgencyScore}/10)`);

  // ── Step 4: Duplicate detection (rule-based) ──────────────────────────────
  log.push('Step 4: Checking for duplicate reports nearby…');
  const duplicateResult = detectDuplicate(
    analysis.aiCategory,
    body.latitude,
    body.longitude,
    body.nearbyIssues ?? []
  );
  if (duplicateResult.isDuplicate) {
    log.push(`⚠ Possible duplicate detected (score: ${duplicateResult.duplicateScore}/100, matches: ${duplicateResult.duplicateOf})`);
  } else {
    log.push(`✓ No duplicates found in ${body.nearbyIssues?.length ?? 0} nearby reports`);
  }

  // Recalculate urgency now that we know duplicate status
  const finalUrgency = calculateUrgency(
    analysis.severityScore,
    analysis.urgencyScore,
    duplicateResult.isDuplicate
  );

  // ── Step 5: Formal complaint ──────────────────────────────────────────────
  log.push('Step 5: Preparing formal complaint…');
  const complaint = ensureFormalComplaint(analysis.formalComplaint, {
    title: body.title,
    description: body.description,
    category: analysis.aiCategory,
    address: body.address,
    locality: body.locality,
    latitude: body.latitude ?? 0,
    longitude: body.longitude ?? 0,
    department: finalDepartment,
  });
  log.push('✓ Formal complaint ready');

  log.push(`🎯 Agent pipeline complete — ${usedImage ? 'image + text' : 'text-only'} analysis`);

  return {
    aiCategory: analysis.aiCategory,
    aiSeverity: analysis.aiSeverity,
    severityScore: analysis.severityScore,
    urgencyScore: finalUrgency.urgencyScore,
    priorityLevel: finalUrgency.priorityLevel,
    aiConfidence: analysis.aiConfidence,
    publicRisk: analysis.publicRisk,
    damageDescription: analysis.damageDescription,
    recommendedDepartment: finalDepartment,
    suggestedNextAction: analysis.suggestedNextAction,
    isDuplicate: duplicateResult.isDuplicate,
    duplicateOf: duplicateResult.duplicateOf,
    duplicateScore: duplicateResult.duplicateScore,
    formalComplaint: complaint,
    agentLog: log,
  };
}
