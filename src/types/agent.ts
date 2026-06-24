export type AISeverity = 'low' | 'medium' | 'high' | 'critical';
export type AIPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NearbyIssue {
  id: string;
  category: string;
  status: string;
  createdAt: string;
  latitude: number;
  longitude: number;
}

export interface ProcessIssueRequest {
  issueId: string;
  imageURL: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  locality: string;
  nearbyIssues?: NearbyIssue[];
}

export interface AIAnalysisResult {
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
  isDuplicate: boolean;
  duplicateOf: string | null;
  duplicateScore: number;
  formalComplaint: string;
  agentLog: string[];
}

export interface ProcessIssueResponse {
  success: boolean;
  analysis: AIAnalysisResult;
  error?: string;
}

export interface GenerateComplaintRequest {
  issueId: string;
  title: string;
  description: string;
  category: string;
  address: string;
  locality: string;
  reporterName: string;
}

export interface GenerateComplaintResponse {
  success: boolean;
  complaint: string;
  error?: string;
}
