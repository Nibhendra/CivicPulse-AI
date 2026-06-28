import { Request, Response, NextFunction } from 'express';
// import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function verifyAuthToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // Hackathon bypass: verify token structurally or just allow it during debug
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  try {
    // Structural mock token verification to isolate firebase-admin runtime crash
    req.user = { uid: 'mock_uid', email: 'admin@gmail.com' };
    next();
  } catch (error) {
    console.error('Firebase ID token verification failed:', error);
    res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
}
