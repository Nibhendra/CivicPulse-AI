export type IssueCategory =
  | 'pothole'
  | 'drain'
  | 'garbage'
  | 'water_leak'
  | 'streetlight'
  | 'broken_road'
  | 'public_infra'
  | 'other';

export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';

export type IssueStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'reopened'
  | 'closed'
  | 'rejected';

export type VerificationStatus =
  | 'unverified'
  | 'community_verified'
  | 'disputed'
  | 'resolved_by_community';

export interface TimelineEntry {
  id: string;
  status: IssueStatus | string; // allow free-form for authority notes
  timestamp: Date | string;
  note: string;
  updatedBy: string;
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  content: string;
  createdAt: Date;
}

export interface Issue {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterPhotoURL: string | null;

  // Content
  title: string;
  description: string;
  imageURLs: string[];

  // Classification
  category: IssueCategory;
  subcategory: string;
  priority: IssuePriority;
  status: IssueStatus;

  // Location
  latitude: number;
  longitude: number;
  address: string;
  locality: string;
  ward: string;

  // Engagement
  upvotes: number;
  upvoterIds: string[];
  commentCount: number;

  // Timeline
  timeline: TimelineEntry[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;

  // Complaint generation (Phase 1/2)
  formalComplaint: string | null;
  complaintGeneratedAt: Date | null;

  // ── Phase 3: AI Analysis fields ───────────────────────────────────────────
  aiProcessed: boolean;
  aiProcessedAt: Date | null;

  // From Gemini
  aiCategory: string | null;
  aiSeverity: 'low' | 'medium' | 'high' | 'critical' | null;
  aiDamageDescription: string | null;
  aiConfidence: number | null;
  isValidCivicIssue: boolean;

  // Scoring
  severityScore: number | null;
  urgencyScore: number | null;
  priorityLevel: IssuePriority | null;

  // Department & action
  assignedDepartment: string | null;
  suggestedNextAction: string | null;
  publicRisk: string | null;

  // Duplicate detection
  isDuplicate: boolean;
  duplicateOf: string | null;
  duplicateScore: number | null;

  // Agent trace
  agentLog: string[];

  // ── Phase 4: Community Verification ──────────────────────────────────────
  confirmations: number;
  confirmedBy: string[];
  fakeReports: number;
  fakeReportedBy: string[];
  resolvedReports: number;
  resolvedBy: string[];
  duplicateReports: number;
  duplicateReportedBy: string[];
  communityScore: number;
  verificationStatus: VerificationStatus;

  // ── Phase 4: Authority Tracking ──────────────────────────────────────────
  authorityStatus: string | null;
  authorityNote: string | null;
  lastStatusUpdatedAt: Date | null;
  lastStatusUpdatedBy: string | null;
}
