import { callGemini, fetchImagePart, stripMarkdown } from '../utils/gemini';

export type AISeverity = 'low' | 'medium' | 'high' | 'critical';
export type AIPriority = 'low' | 'medium' | 'high' | 'critical';

export interface GeminiAnalysis {
  aiCategory: string;
  aiSeverity: AISeverity;
  severityScore: number;
  urgencyScore: number;
  priorityLevel: AIPriority;
  aiConfidence: number;
  publicRisk: string;
  damageDescription: string;
  recommendedDepartment: string;
  suggestedNextAction: string;
  isValidCivicIssue: boolean;
  formalComplaint: string;
}

export interface AnalysisParams {
  imageURL: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  locality: string;
}

const VALID_CATEGORIES = [
  'pothole', 'drain', 'garbage', 'water_leak',
  'streetlight', 'broken_road', 'public_infra', 'other',
];
const VALID_SEVERITIES: AISeverity[] = ['low', 'medium', 'high', 'critical'];

const DEPARTMENT_MAP: Record<string, string> = {
  pothole: 'Roads & Infrastructure',
  broken_road: 'Roads & Infrastructure',
  drain: 'Water & Sewerage',
  water_leak: 'Water & Sewerage',
  garbage: 'Sanitation & Waste Management',
  streetlight: 'Electrical & Lighting',
  public_infra: 'Urban Development',
  other: 'General Administration',
};

/** Safe fallback when Gemini response is malformed or unusable. */
function buildFallback(params: AnalysisParams): GeminiAnalysis {
  const dept = DEPARTMENT_MAP[params.category] ?? 'General Administration';
  return {
    aiCategory: params.category,
    aiSeverity: 'medium',
    severityScore: 5,
    urgencyScore: 5,
    priorityLevel: 'medium',
    aiConfidence: 30,
    publicRisk: 'Potential inconvenience and safety hazard to the public.',
    damageDescription: params.description,
    recommendedDepartment: dept,
    suggestedNextAction: `Report to ${dept} for inspection and repair.`,
    isValidCivicIssue: true,
    formalComplaint: buildFallbackComplaint(params),
  };
}

/** Type-guard: validate all required fields in the parsed Gemini JSON. */
function isValidGeminiResponse(obj: unknown): obj is GeminiAnalysis {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;

  return (
    typeof o.aiCategory === 'string' &&
    typeof o.aiSeverity === 'string' &&
    VALID_SEVERITIES.includes(o.aiSeverity as AISeverity) &&
    typeof o.severityScore === 'number' &&
    o.severityScore >= 1 && o.severityScore <= 10 &&
    typeof o.urgencyScore === 'number' &&
    o.urgencyScore >= 1 && o.urgencyScore <= 10 &&
    typeof o.priorityLevel === 'string' &&
    VALID_SEVERITIES.includes(o.priorityLevel as AIPriority) &&
    typeof o.aiConfidence === 'number' &&
    o.aiConfidence >= 0 && o.aiConfidence <= 100 &&
    typeof o.publicRisk === 'string' &&
    typeof o.damageDescription === 'string' &&
    typeof o.recommendedDepartment === 'string' &&
    typeof o.suggestedNextAction === 'string' &&
    typeof o.isValidCivicIssue === 'boolean' &&
    typeof o.formalComplaint === 'string'
  );
}

/** Sanitize a valid-but-possibly-out-of-range GeminiAnalysis object. */
function sanitize(raw: GeminiAnalysis, params: AnalysisParams): GeminiAnalysis {
  return {
    ...raw,
    aiCategory: VALID_CATEGORIES.includes(raw.aiCategory)
      ? raw.aiCategory
      : params.category,
    severityScore: Math.max(1, Math.min(10, Math.round(raw.severityScore))),
    urgencyScore: Math.max(1, Math.min(10, Math.round(raw.urgencyScore))),
    aiConfidence: Math.max(0, Math.min(100, Math.round(raw.aiConfidence))),
    formalComplaint: raw.formalComplaint.trim() || buildFallbackComplaint(params),
  };
}

/**
 * Main Gemini analysis: fetches image, sends ONE combined prompt,
 * parses and validates response. Falls back gracefully on any failure.
 */
export async function analyzeIssueImage(params: AnalysisParams): Promise<{ analysis: GeminiAnalysis; usedImage: boolean; agentLog: string[] }> {
  const log: string[] = [];

  // Step 1: Try to fetch image
  log.push('Fetching image from Cloudinary…');
  const imagePart = params.imageURL ? await fetchImagePart(params.imageURL) : null;
  const usedImage = imagePart !== null;
  log.push(usedImage ? '✓ Image loaded successfully' : '⚠ Image unavailable — using text-only analysis');

  // Step 2: Build prompt
  const prompt = buildPrompt(params, usedImage);
  log.push('Sending issue to Gemini for analysis…');

  // Step 3: Call Gemini
  let rawText: string;
  try {
    rawText = await callGemini(prompt, imagePart, true);
    log.push('✓ Gemini responded');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.push(`✗ Gemini call failed: ${msg}`);
    log.push('Using safe fallback analysis');
    return { analysis: buildFallback(params), usedImage: false, agentLog: log };
  }

  // Step 4: Parse JSON
  log.push('Parsing AI response…');
  let parsed: unknown;
  try {
    const clean = stripMarkdown(rawText);
    parsed = JSON.parse(clean);
  } catch {
    log.push('⚠ Gemini returned malformed JSON — using fallback');
    return { analysis: buildFallback(params), usedImage, agentLog: log };
  }

  // Step 5: Validate
  if (!isValidGeminiResponse(parsed)) {
    log.push('⚠ Gemini response failed type validation — using fallback');
    return { analysis: buildFallback(params), usedImage, agentLog: log };
  }

  const analysis = sanitize(parsed, params);
  log.push(`✓ Analysis complete — Severity: ${analysis.aiSeverity}, Confidence: ${analysis.aiConfidence}%`);

  return { analysis, usedImage, agentLog: log };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPrompt(p: AnalysisParams, hasImage: boolean): string {
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  return `You are a civic infrastructure assessment AI for Indian municipalities. Your task is to analyze the following civic issue report${hasImage ? ' (image attached)' : ' (no image — use text only)'} and return a structured JSON analysis.

ISSUE DETAILS:
- Title: ${p.title}
- Description: ${p.description}
- Reported Category: ${p.category}
- Location: ${p.address}, ${p.locality}
- GPS Coordinates: ${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}

INSTRUCTIONS:
${hasImage ? '- Analyze the provided image carefully for visible damage, safety hazards, and infrastructure condition.\n' : ''}- Based on the${hasImage ? ' image and' : ''} description, determine the severity, urgency, and appropriate department.
- Write a formal complaint letter in English suitable for submission to an Indian municipal corporation.
- The formal complaint must be a complete letter addressed to the relevant department head, referencing the specific location, describing the issue clearly, and requesting prompt action.

Return ONLY a valid JSON object with NO markdown, NO code blocks, NO extra text. Use exactly this schema:

{
  "aiCategory": "<one of: pothole | drain | garbage | water_leak | streetlight | broken_road | public_infra | other>",
  "aiSeverity": "<one of: low | medium | high | critical>",
  "severityScore": <integer 1-10>,
  "urgencyScore": <integer 1-10>,
  "priorityLevel": "<one of: low | medium | high | critical>",
  "aiConfidence": <integer 0-100 representing confidence percentage>,
  "publicRisk": "<1-2 sentences describing public safety risk>",
  "damageDescription": "<2-3 sentences describing the physical damage observed>",
  "recommendedDepartment": "<department name>",
  "suggestedNextAction": "<clear action for the municipality to take>",
  "isValidCivicIssue": <true or false>,
  "formalComplaint": "<complete formal complaint letter>"
}

SEVERITY & URGENCY SCORING (1-10):
- For visible hazards (open drains, deep potholes, garbage piles, water leakage, broken streetlights): consider public safety risk, traffic/pedestrian hazards, waterlogging, and health/hygiene risks.
- If a hazard is clearly visible in the image, severity should typically be medium/high and urgency score should be 6-8 or higher.
- Confidence (aiConfidence) should be high (70-95) for clearly visible issues. Only return low confidence if the image is extremely blurry or the issue is ambiguous.

SEVERITY GUIDE:
- low: Minor cosmetic issue, no immediate danger
- medium: Inconvenience or minor safety risk
- high: Significant infrastructure damage or safety hazard
- critical: Immediate danger to life, property, or essential services

DEPARTMENT GUIDE:
- Roads & Infrastructure (potholes, broken roads)
- Water & Sewerage (drain, water leak)
- Sanitation & Waste Management (garbage, waste)
- Electrical & Lighting (streetlight)
- Urban Development (public infrastructure)
- General Administration (other)

Today's date: ${today}`;
}

function buildFallbackComplaint(p: AnalysisParams): string {
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const dept = DEPARTMENT_MAP[p.category] ?? 'General Administration';
  return `To,
The Head,
${dept} Department,
Municipal Corporation

Subject: Complaint Regarding ${p.title} at ${p.address}

Respected Sir/Madam,

I am writing to bring to your attention a civic issue that requires immediate attention at ${p.address}, ${p.locality}.

Issue Description:
${p.description}

This issue has been causing inconvenience and poses a potential safety risk to the public. I kindly request your department to inspect the site at the earliest and take necessary corrective action.

Location Details:
Address: ${p.address}
Locality: ${p.locality}
GPS: ${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}

I hope for prompt action on this matter.

Yours faithfully,
A Concerned Citizen

Date: ${today}`;
}
