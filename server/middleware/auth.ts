import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface DecodedIdToken {
  aud: string;
  auth_time: number;
  email?: string;
  email_verified?: boolean;
  exp: number;
  firebase: {
    identities: {
      [key: string]: any;
    };
    sign_in_provider: string;
    [key: string]: any;
  };
  iat: number;
  iss: string;
  sub: string;
  uid: string;
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

// In-memory cache for public keys to avoid fetching them on every request
let cachedKeys: Record<string, string> = {};
let cacheExpiry = 0;

async function getGooglePublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now < cacheExpiry && Object.keys(cachedKeys).length > 0) {
    return cachedKeys;
  }

  try {
    const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const cacheControl = res.headers.get('cache-control');
    let maxAge = 3600; // default 1 hour
    if (cacheControl) {
      const match = cacheControl.match(/max-age=(\d+)/);
      if (match) maxAge = parseInt(match[1], 10);
    }
    
    cachedKeys = (await res.json()) as Record<string, string>;
    cacheExpiry = now + (maxAge * 1000);
    return cachedKeys;
  } catch (err) {
    console.error('Failed to fetch Google public keys:', err);
    return cachedKeys;
  }
}

export async function verifyFirebaseIdToken(token: string, projectId: string): Promise<DecodedIdToken> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  
  let header: { kid?: string; alg?: string };
  let payload: DecodedIdToken;
  try {
    header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  } catch (err) {
    throw new Error('Failed to parse JWT JSON');
  }

  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }
  if (!header.kid) {
    throw new Error('Missing kid header');
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error(`Invalid issuer: ${payload.iss}`);
  }
  if (payload.aud !== projectId) {
    throw new Error(`Invalid audience: ${payload.aud}`);
  }
  if (payload.sub !== payload.uid) {
    throw new Error('sub claims does not match uid');
  }
  if (payload.exp < now) {
    throw new Error('Token has expired');
  }
  if (payload.iat > now + 300) { // 5 min skew
    throw new Error('Token is not active yet');
  }

  const keys = await getGooglePublicKeys();
  const cert = keys[header.kid];
  if (!cert) {
    throw new Error(`Public key not found for kid: ${header.kid}`);
  }

  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(`${headerB64}.${payloadB64}`);
  
  const isValid = verify.verify(cert, signatureB64, 'base64url');
  if (!isValid) {
    throw new Error('Invalid token signature');
  }

  return payload;
}

export async function verifyAuthToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.substring(7);
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    console.error('❌ Cannot verify token: Firebase Project ID is not configured on the server.');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  try {
    const decodedToken = await verifyFirebaseIdToken(token, projectId);
    req.user = decodedToken;
    next();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Firebase ID token verification failed:', msg);
    res.status(401).json({ error: `Unauthorized: Token verification failed (${msg})` });
  }
}
