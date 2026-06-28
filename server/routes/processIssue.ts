import { Router, type Request, type Response } from 'express';
import { validateProcessIssueBody, type ProcessIssueBody } from '../utils/validation';
import { runCivicRescueAgent } from '../agent/civicRescueAgent';

export const processIssueRouter = Router();

// Simple in-memory set to prevent duplicate concurrent calls for the same issue
const inFlight = new Set<string>();

processIssueRouter.post('/process-issue', async (req: Request, res: Response) => {
  // Validate body
  const validationError = validateProcessIssueBody(req.body);
  if (validationError) {
    res.status(400).json({ success: false, error: validationError });
    return;
  }

  const body = req.body as ProcessIssueBody;

  // Rate-limit: one concurrent request per issue
  if (inFlight.has(body.issueId)) {
    res.status(429).json({
      success: false,
      error: 'Analysis already in progress for this issue. Please wait.',
    });
    return;
  }

  inFlight.add(body.issueId);
  try {
    console.log(`[process-issue] Processing: ${body.issueId} — "${body.title}"`);
    const analysis = await runCivicRescueAgent(body);
    console.log(`[process-issue] Done: ${body.issueId} — severity=${analysis.aiSeverity}`);
    res.json({ success: true, analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error(`[process-issue] Error for ${body.issueId}:`, message);
    res.status(500).json({ success: false, error: message });
  } finally {
    inFlight.delete(body.issueId);
  }
});
