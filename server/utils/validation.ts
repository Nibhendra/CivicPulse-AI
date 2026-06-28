export interface ProcessIssueBody {
  issueId: string;
  imageURL: string;
  title: string;
  description: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  locality: string;
  nearbyIssues?: NearbyIssue[];
}

export interface NearbyIssue {
  id: string;
  category: string;
  status: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
}

export interface GenerateComplaintBody {
  issueId: string;
  title: string;
  description: string;
  category: string;
  address: string;
  locality: string;
  reporterName: string;
}

/**
 * Validates the process-issue request body.
 * Returns a string error message if invalid, or null if valid.
 */
export function validateProcessIssueBody(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'Request body must be a JSON object';
  }

  const b = body as Record<string, unknown>;

  if (typeof b.issueId !== 'string' || b.issueId.trim() === '') {
    return 'issueId is required and must be a non-empty string';
  }
  if (typeof b.imageURL !== 'string') {
    return 'imageURL must be a string';
  }
  if (typeof b.title !== 'string' || b.title.trim() === '') {
    return 'title is required and must be a non-empty string';
  }
  if (typeof b.description !== 'string' || b.description.trim() === '') {
    return 'description is required and must be a non-empty string';
  }
  if (typeof b.category !== 'string' || b.category.trim() === '') {
    return 'category is required and must be a non-empty string';
  }
  if (b.latitude !== null && typeof b.latitude !== 'number') {
    return 'latitude must be a number or null';
  }
  if (b.longitude !== null && typeof b.longitude !== 'number') {
    return 'longitude must be a number or null';
  }
  if (typeof b.address !== 'string') {
    return 'address must be a string';
  }
  if (typeof b.locality !== 'string') {
    return 'locality must be a string';
  }
  if (b.nearbyIssues !== undefined && !Array.isArray(b.nearbyIssues)) {
    return 'nearbyIssues must be an array if provided';
  }

  return null; // valid
}

export function validateGenerateComplaintBody(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'Request body must be a JSON object';
  }
  const b = body as Record<string, unknown>;
  if (typeof b.issueId !== 'string' || b.issueId.trim() === '') {
    return 'issueId is required';
  }
  if (typeof b.title !== 'string' || b.title.trim() === '') {
    return 'title is required';
  }
  return null;
}
