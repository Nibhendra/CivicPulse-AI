import app from './app';

const PORT = parseInt(process.env.PORT || '3001', 10);

// Validate API key at startup
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your_gemini_api_key_here') {
  console.warn('\n❌ GEMINI_API_KEY is missing or a placeholder. Add your real key to server/.env\n');
}

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const key = process.env.GEMINI_API_KEY;
  const configured = !!(key && key !== 'your_gemini_api_key_here');

  console.log(`\n🚀 CivicPulse AI Server running on http://localhost:${PORT}`);
  console.log(`   Gemini model : ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'} (fallback: ${process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite'})`);
  console.log(`   API key      : ${configured ? '✅ configured' : '❌ NOT SET — add GEMINI_API_KEY to server/.env'}`);
  console.log(`   Health check : http://localhost:${PORT}/api/health\n`);
});
