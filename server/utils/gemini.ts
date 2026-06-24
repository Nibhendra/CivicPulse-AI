import { GoogleGenerativeAI, type Part } from '@google/generative-ai';

// Validate API key at startup
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your_gemini_api_key_here') {
  console.error('❌ GEMINI_API_KEY is missing or is a placeholder. Set it in server/.env');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite';

/**
 * Call Gemini with a text prompt and optional inline image.
 * Automatically tries the fallback model if the primary fails.
 * Requests JSON response when jsonMode is true.
 */
export async function callGemini(
  prompt: string,
  imagePart: Part | null = null,
  jsonMode = true
): Promise<string> {
  try {
    return await invokeModel(PRIMARY_MODEL, prompt, imagePart, jsonMode);
  } catch (primaryErr) {
    const msg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.warn(`⚠️  Primary model (${PRIMARY_MODEL}) failed: ${msg}. Trying fallback…`);
    try {
      return await invokeModel(FALLBACK_MODEL, prompt, imagePart, jsonMode);
    } catch (fallbackErr) {
      const fMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      throw new Error(
        `Both Gemini models failed.\n  Primary (${PRIMARY_MODEL}): ${msg}\n  Fallback (${FALLBACK_MODEL}): ${fMsg}`
      );
    }
  }
}

async function invokeModel(
  modelName: string,
  prompt: string,
  imagePart: Part | null,
  jsonMode: boolean
): Promise<string> {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to server/.env');
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: jsonMode
      ? { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 4096 }
      : { temperature: 0.7, maxOutputTokens: 4096 },
  });

  const parts: Part[] = [];
  if (imagePart) parts.push(imagePart);
  parts.push({ text: prompt });

  const result = await model.generateContent(parts);
  const text = result.response.text();

  if (!text || text.trim().length === 0) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
}

/**
 * Fetch a remote image and convert it to a Gemini inline image Part.
 * Returns null if the fetch fails — callers should fall back to text-only mode.
 */
export async function fetchImagePart(url: string): Promise<Part | null> {
  try {
    // Only allow Cloudinary URLs for security
    const parsed = new URL(url);
    if (!parsed.hostname.includes('cloudinary.com') && !parsed.hostname.includes('res.cloudinary.com')) {
      console.warn('⚠️  Image URL is not from Cloudinary — skipping image fetch for security.');
      return null;
    }

    const response = await fetch(url, {
      signal: AbortSignal.timeout(12_000), // 12 second timeout
      headers: { 'User-Agent': 'CivicPulseAI/1.0' },
    });

    if (!response.ok) {
      console.warn(`⚠️  Image fetch failed: HTTP ${response.status} for ${url}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const mimeType = contentType.split(';')[0].trim() as 'image/jpeg' | 'image/png' | 'image/webp';
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Guard: skip very small images (likely broken)
    if (base64.length < 500) {
      console.warn('⚠️  Fetched image is too small — likely broken. Skipping.');
      return null;
    }

    return { inlineData: { mimeType, data: base64 } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️  Could not fetch image (falling back to text-only): ${msg}`);
    return null;
  }
}

/**
 * Strip markdown code fences if Gemini returns ```json ... ``` despite JSON mode.
 */
export function stripMarkdown(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenceMatch ? fenceMatch[1].trim() : text.trim();
}
