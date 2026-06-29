import express from 'express';
import cors from 'cors';
import { processIssueRouter } from './routes/processIssue.js';
import { generateComplaintRouter } from './routes/generateComplaint.js';
import { validateImageRouter } from './routes/validateImage.js';

import { verifyAuthToken } from './middleware/auth.js';

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
// Allow any localhost port (5173, 5174, 4173, etc.) so it works regardless
// of which port Vite picks when the default is in use.
// Also allow Vercel domain in production implicitly or just allow all via cors if needed.
// For Vercel production we generally need to allow all or specific domains, but Vercel handles API requests from the same domain seamlessly.
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, SSR) and any localhost origin or Vercel domains
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      // In production, the frontend and API are on the same domain, so origin might be the Vercel domain.
      callback(null, true); // Allow all for now to avoid CORS errors in Vercel
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow Authorization header
}));

app.use(express.json({ limit: '5mb' }));

// ── Request logging ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    geminiConfigured: !!(geminiKey && geminiKey !== 'your_gemini_api_key_here'),
  });
});

// ── Secure API routes ──────────────────────────────────────────────────────────
app.use('/api/process-issue', verifyAuthToken);
app.use('/api/generate-complaint', verifyAuthToken);
app.use('/api/validate-image', verifyAuthToken);

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api', processIssueRouter);
app.use('/api', generateComplaintRouter);
app.use('/api', validateImageRouter);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
