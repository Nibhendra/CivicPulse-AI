import express from 'express';
import cors from 'cors';
import { processIssueRouter } from './routes/processIssue';
import { generateComplaintRouter } from './routes/generateComplaint';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Validate API key at startup
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your_gemini_api_key_here') {
  console.warn('\n❌ GEMINI_API_KEY is missing or a placeholder. Add your real key to server/.env\n');
}

// ── Middleware ─────────────────────────────────────────────────────────────────
// Allow any localhost port (5173, 5174, 4173, etc.) so it works regardless
// of which port Vite picks when the default is in use.
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman) and any localhost origin
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '5mb' }));

// ── Request logging ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
  });
});

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api', processIssueRouter);
app.use('/api', generateComplaintRouter);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const key = process.env.GEMINI_API_KEY;
  const configured = !!(key && key !== 'your_gemini_api_key_here');

  console.log(`\n🚀 CivicPulse AI Server running on http://localhost:${PORT}`);
  console.log(`   Gemini model : ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'} (fallback: ${process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite'})`);
  console.log(`   API key      : ${configured ? '✅ configured' : '❌ NOT SET — add GEMINI_API_KEY to server/.env'}`);
  console.log(`   Health check : http://localhost:${PORT}/api/health\n`);
});
