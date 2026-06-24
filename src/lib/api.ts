import { API_BASE_URL } from '@/constants/config';
import type {
  ProcessIssueRequest,
  ProcessIssueResponse,
  GenerateComplaintRequest,
  GenerateComplaintResponse,
} from '@/types/agent';

const SERVER_NOT_RUNNING_MSG =
  'AI server is not running. Open a new terminal and run: npm run server';

async function apiFetch<T>(endpoint: string, body: unknown): Promise<T> {
  let response: Response;

  // Catch ECONNREFUSED / network-level failures (server not running)
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (_networkErr) {
    // fetch() throws a TypeError when the connection is refused
    throw new Error(SERVER_NOT_RUNNING_MSG);
  }

  // If the response is not JSON (e.g. Vite proxy returns HTML 502/504)
  // it means the server wasn't reachable via the proxy either
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error(SERVER_NOT_RUNNING_MSG);
    }
    throw new Error('Server returned an unexpected non-JSON response');
  }

  const data = await response.json() as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      (typeof data.error === 'string' ? data.error : null) ||
        `Server error ${response.status}`
    );
  }

  return data as T;
}

/** Call the Express server to run the Civic Rescue Agent on an issue. */
export async function processIssue(
  data: ProcessIssueRequest
): Promise<ProcessIssueResponse> {
  return apiFetch<ProcessIssueResponse>('/api/process-issue', data);
}

/** Call the Express server to generate a standalone formal complaint. */
export async function generateComplaint(
  data: GenerateComplaintRequest
): Promise<GenerateComplaintResponse> {
  return apiFetch<GenerateComplaintResponse>('/api/generate-complaint', data);
}

/** Check if the Express server is reachable. Returns false instead of throwing. */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 s timeout
    });
    return resp.ok;
  } catch {
    return false;
  }
}
