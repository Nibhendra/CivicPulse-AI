export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  trustScore: number;
  issuesReported: number;
  issuesResolved: number;
  upvotesReceived: number;
  createdAt: Date;
  lastActive: Date;
  locality: string;
}
