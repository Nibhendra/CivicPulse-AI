import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Issue, IssueCategory, IssueStatus, IssuePriority, VerificationStatus, TimelineEntry } from '@/types/issue';
import type { AIAnalysisResult } from '@/types/agent';

const ISSUES_COLLECTION = 'issues';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compute community score from vote counts. */
export function calculateCommunityScore(
  confirmations: number,
  resolvedReports: number,
  fakeReports: number,
  duplicateReports: number
): number {
  return (confirmations * 2) + (resolvedReports * 2) + (fakeReports * -3) + (duplicateReports * -1);
}

/** Derive verification status from vote counts. */
function deriveVerificationStatus(
  confirmations: number,
  fakeReports: number,
  resolvedReports: number
): VerificationStatus {
  if (resolvedReports >= 3) return 'resolved_by_community';
  if (fakeReports >= 3) return 'disputed';
  if (confirmations >= 3) return 'community_verified';
  return 'unverified';
}

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Creates a new issue in Firestore.
 */
export async function createIssue(data: Partial<Issue>): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in to report an issue');

  // Filter out empty/null image URLs before storing
  const imageURLs = (data.imageURLs || []).filter((u) => u && u.trim());

  const issueData = {
    ...data,
    imageURLs,
    reporterId: user.uid,
    reporterName: user.displayName || 'Anonymous Citizen',
    reporterPhotoURL: user.photoURL || null,

    // Defaults
    status: 'submitted' as IssueStatus,
    priority: data.priority || 'medium' as IssuePriority,
    category: data.category || 'other' as IssueCategory,
    subcategory: data.subcategory || '',
    ward: data.ward || '',

    // Engagement
    upvotes: 0,
    upvoterIds: [],
    commentCount: 0,

    // Phase 3: AI fields — all null until agent runs
    aiProcessed: false,
    aiProcessedAt: null,
    aiCategory: null,
    aiSeverity: null,
    aiDamageDescription: null,
    aiConfidence: null,
    isValidCivicIssue: true,
    severityScore: null,
    urgencyScore: null,
    priorityLevel: null,
    assignedDepartment: null,
    suggestedNextAction: null,
    publicRisk: null,
    isDuplicate: false,
    duplicateOf: null,
    duplicateScore: null,
    agentLog: [],

    // Phase 4: Community verification defaults
    confirmations: 0,
    confirmedBy: [],
    fakeReports: 0,
    fakeReportedBy: [],
    resolvedReports: 0,
    resolvedBy: [],
    duplicateReports: 0,
    duplicateReportedBy: [],
    communityScore: 0,
    verificationStatus: 'unverified' as VerificationStatus,

    // Phase 4: Authority tracking defaults
    authorityStatus: null,
    authorityNote: null,
    lastStatusUpdatedAt: null,
    lastStatusUpdatedBy: null,

    // Timeline
    timeline: [
      {
        id: crypto.randomUUID(),
        status: 'submitted',
        timestamp: new Date().toISOString(),
        note: 'Report created by user',
        updatedBy: user.uid,
      },
    ],

    // Timestamps
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    resolvedAt: null,
    formalComplaint: null,
    complaintGeneratedAt: null,
  };

  const docRef = await addDoc(collection(db, ISSUES_COLLECTION), issueData);
  return docRef.id;
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export function subscribeToRecentIssues(
  callback: (issues: Issue[]) => void,
  maxLimit: number = 50
) {
  const q = query(
    collection(db, ISSUES_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(maxLimit)
  );
  return onSnapshot(q, (snapshot) => {
    const issues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Issue[];
    callback(issues);
  }, (error) => {
    console.error('Error subscribing to recent issues:', error);
  });
}

export function subscribeToUserIssues(
  userId: string,
  callback: (issues: Issue[]) => void
) {
  const q = query(
    collection(db, ISSUES_COLLECTION),
    where('reporterId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const issues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Issue[];
    callback(issues);
  }, (error) => {
    console.error('Error subscribing to user issues:', error);
  });
}

export function subscribeToIssue(
  id: string,
  callback: (issue: Issue | null) => void
) {
  const docRef = doc(db, ISSUES_COLLECTION, id);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Issue);
    } else {
      callback(null);
    }
  });
}

/** Subscribe to ALL issues for the Authority Dashboard. */
export function subscribeToAllIssues(
  callback: (issues: Issue[]) => void,
  maxLimit: number = 200
) {
  const q = query(
    collection(db, ISSUES_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(maxLimit)
  );
  return onSnapshot(q, (snapshot) => {
    const issues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Issue[];
    callback(issues);
  }, (error) => {
    console.error('Error subscribing to all issues:', error);
  });
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getIssueById(id: string): Promise<Issue | null> {
  const docRef = doc(db, ISSUES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Issue;
  }
  return null;
}

/** Fetch all issues for duplicate detection in the server agent. */
export async function getAllIssuesForAgent(): Promise<Issue[]> {
  const q = query(
    collection(db, ISSUES_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(500)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Issue[];
}

// ── Engagement ────────────────────────────────────────────────────────────────

export async function toggleUpvote(issueId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in to upvote');

  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const issueSnap = await getDoc(issueRef);
  if (!issueSnap.exists()) throw new Error('Issue not found');

  const upvoterIds: string[] = issueSnap.data().upvoterIds || [];
  const hasUpvoted = upvoterIds.includes(user.uid);

  await updateDoc(issueRef, hasUpvoted
    ? { upvoterIds: arrayRemove(user.uid), upvotes: increment(-1) }
    : { upvoterIds: arrayUnion(user.uid), upvotes: increment(1) }
  );
}

// ── Phase 3: AI Results ───────────────────────────────────────────────────────

/**
 * Persist AI analysis results from the Civic Rescue Agent into Firestore.
 */
export async function updateIssueAIResults(
  issueId: string,
  analysis: AIAnalysisResult
): Promise<void> {
  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const timelineEntry: TimelineEntry = {
    id: crypto.randomUUID(),
    status: 'under_review',
    timestamp: new Date().toISOString(),
    note: 'AI Civic Rescue Agent analysis completed',
    updatedBy: 'system',
  };

  await updateDoc(issueRef, {
    aiCategory: analysis.aiCategory,
    aiSeverity: analysis.aiSeverity,
    aiDamageDescription: analysis.damageDescription,
    aiConfidence: analysis.aiConfidence,
    severityScore: analysis.severityScore,
    urgencyScore: analysis.urgencyScore,
    priorityLevel: analysis.priorityLevel,
    assignedDepartment: analysis.recommendedDepartment,
    suggestedNextAction: analysis.suggestedNextAction,
    publicRisk: analysis.publicRisk,
    isDuplicate: analysis.isDuplicate,
    duplicateOf: analysis.duplicateOf ?? null,
    duplicateScore: analysis.duplicateScore,
    formalComplaint: analysis.formalComplaint,
    complaintGeneratedAt: serverTimestamp(),
    agentLog: analysis.agentLog,
    aiProcessed: true,
    aiProcessedAt: serverTimestamp(),
    status: 'under_review',
    timeline: arrayUnion(timelineEntry),
    updatedAt: serverTimestamp(),
  });
}

// ── Phase 4: Community Verification ──────────────────────────────────────────

/** Internal helper: re-read issue and recompute + save community score + verificationStatus. */
async function recomputeCommunityScore(issueId: string): Promise<void> {
  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const snap = await getDoc(issueRef);
  if (!snap.exists()) return;

  const d = snap.data();
  const confirmations: number = d.confirmations ?? 0;
  const fakeReports: number = d.fakeReports ?? 0;
  const resolvedReports: number = d.resolvedReports ?? 0;
  const duplicateReports: number = d.duplicateReports ?? 0;

  const communityScore = calculateCommunityScore(confirmations, resolvedReports, fakeReports, duplicateReports);
  const verificationStatus = deriveVerificationStatus(confirmations, fakeReports, resolvedReports);

  await updateDoc(issueRef, { communityScore, verificationStatus, updatedAt: serverTimestamp() });
}

/**
 * Confirm an issue (adds +2 to community score).
 * Reporter cannot confirm their own issue.
 */
export async function confirmIssue(issueId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in');

  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const snap = await getDoc(issueRef);
  if (!snap.exists()) throw new Error('Issue not found');

  const d = snap.data();
  if (d.reporterId === user.uid) throw new Error('You cannot confirm your own issue');
  if ((d.confirmedBy || []).includes(user.uid)) throw new Error('You have already confirmed this issue');

  await updateDoc(issueRef, {
    confirmedBy: arrayUnion(user.uid),
    confirmations: increment(1),
    updatedAt: serverTimestamp(),
  });
  await recomputeCommunityScore(issueId);
}

/**
 * Remove confirmation (toggle off).
 */
export async function unconfirmIssue(issueId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in');

  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  await updateDoc(issueRef, {
    confirmedBy: arrayRemove(user.uid),
    confirmations: increment(-1),
    updatedAt: serverTimestamp(),
  });
  await recomputeCommunityScore(issueId);
}

/**
 * Mark issue as fake (-3 community score).
 */
export async function markIssueFake(issueId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in');

  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const snap = await getDoc(issueRef);
  if (!snap.exists()) throw new Error('Issue not found');

  const d = snap.data();
  if ((d.fakeReportedBy || []).includes(user.uid)) throw new Error('You have already reported this issue as fake');

  await updateDoc(issueRef, {
    fakeReportedBy: arrayUnion(user.uid),
    fakeReports: increment(1),
    updatedAt: serverTimestamp(),
  });
  await recomputeCommunityScore(issueId);
}

/**
 * Remove fake report (toggle off).
 */
export async function unmarkIssueFake(issueId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in');

  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  await updateDoc(issueRef, {
    fakeReportedBy: arrayRemove(user.uid),
    fakeReports: increment(-1),
    updatedAt: serverTimestamp(),
  });
  await recomputeCommunityScore(issueId);
}

/**
 * Mark issue as resolved by community (+2 community score).
 */
export async function markIssueResolvedByCommunity(issueId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in');

  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const snap = await getDoc(issueRef);
  if (!snap.exists()) throw new Error('Issue not found');

  const d = snap.data();
  if ((d.resolvedBy || []).includes(user.uid)) throw new Error('You have already marked this as resolved');

  const timelineEntry: TimelineEntry = {
    id: crypto.randomUUID(),
    status: 'resolved',
    timestamp: new Date().toISOString(),
    note: 'Marked as resolved by a community member',
    updatedBy: user.uid,
  };

  await updateDoc(issueRef, {
    resolvedBy: arrayUnion(user.uid),
    resolvedReports: increment(1),
    timeline: arrayUnion(timelineEntry),
    updatedAt: serverTimestamp(),
  });
  await recomputeCommunityScore(issueId);
}

/**
 * Remove resolved-by-community mark (toggle off).
 */
export async function unmarkIssueResolvedByCommunity(issueId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in');

  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  await updateDoc(issueRef, {
    resolvedBy: arrayRemove(user.uid),
    resolvedReports: increment(-1),
    updatedAt: serverTimestamp(),
  });
  await recomputeCommunityScore(issueId);
}

/**
 * Mark issue as a duplicate (-1 community score).
 */
export async function markIssueDuplicate(issueId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in');

  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const snap = await getDoc(issueRef);
  if (!snap.exists()) throw new Error('Issue not found');

  const d = snap.data();
  if ((d.duplicateReportedBy || []).includes(user.uid)) throw new Error('You have already marked this as duplicate');

  await updateDoc(issueRef, {
    duplicateReportedBy: arrayUnion(user.uid),
    duplicateReports: increment(1),
    updatedAt: serverTimestamp(),
  });
  await recomputeCommunityScore(issueId);
}

/**
 * Remove duplicate mark (toggle off).
 */
export async function unmarkIssueDuplicate(issueId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in');

  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  await updateDoc(issueRef, {
    duplicateReportedBy: arrayRemove(user.uid),
    duplicateReports: increment(-1),
    updatedAt: serverTimestamp(),
  });
  await recomputeCommunityScore(issueId);
}

// ── Phase 4: Authority Status Update ─────────────────────────────────────────

/**
 * Update issue status from the Authority Dashboard.
 * Any authenticated user can do this for demo purposes.
 */
export async function updateIssueStatus(
  issueId: string,
  status: IssueStatus,
  note: string,
  updatedByName: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in');

  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const timelineEntry: TimelineEntry = {
    id: crypto.randomUUID(),
    status,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${status.replace(/_/g, ' ')}`,
    updatedBy: updatedByName || user.email || user.uid,
  };

  const updatePayload: Record<string, unknown> = {
    status,
    authorityStatus: status,
    authorityNote: note || null,
    lastStatusUpdatedAt: serverTimestamp(),
    lastStatusUpdatedBy: updatedByName || user.email || user.uid,
    timeline: arrayUnion(timelineEntry),
    updatedAt: serverTimestamp(),
  };

  if (status === 'resolved') {
    updatePayload.resolvedAt = serverTimestamp();
  }

  await updateDoc(issueRef, updatePayload);
}

/**
 * Add a standalone timeline entry (e.g. authority note without status change).
 */
export async function addTimelineEntry(
  issueId: string,
  entry: Omit<TimelineEntry, 'id'>
): Promise<void> {
  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const fullEntry: TimelineEntry = { id: crypto.randomUUID(), ...entry };
  await updateDoc(issueRef, {
    timeline: arrayUnion(fullEntry),
    updatedAt: serverTimestamp(),
  });
}
