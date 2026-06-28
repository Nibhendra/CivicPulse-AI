import { Router, type Request, type Response } from 'express';
import { validateGenerateComplaintBody, type GenerateComplaintBody } from '../utils/validation';
import { ensureFormalComplaint } from '../agent/generateComplaint';
import { assignDepartment } from '../agent/assignDepartment';

export const generateComplaintRouter = Router();

generateComplaintRouter.post('/generate-complaint', async (req: Request, res: Response) => {
  const validationError = validateGenerateComplaintBody(req.body);
  if (validationError) {
    res.status(400).json({ success: false, error: validationError });
    return;
  }

  const body = req.body as GenerateComplaintBody;

  try {
    const department = assignDepartment(body.category);
    const complaint = ensureFormalComplaint(null, {
      title: body.title,
      description: body.description,
      category: body.category,
      address: body.address,
      locality: body.locality,
      latitude: 0,
      longitude: 0,
      department,
    });

    res.json({ success: true, complaint });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error('[generate-complaint] Error:', message);
    res.status(500).json({ success: false, error: message });
  }
});
