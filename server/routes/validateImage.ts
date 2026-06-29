import { Router, type Request, type Response } from 'express';
import { callGemini, fetchImagePart, stripMarkdown } from '../utils/gemini.js';

export const validateImageRouter = Router();

validateImageRouter.post('/validate-image', async (req: Request, res: Response) => {
  const { imageURL } = req.body;

  if (typeof imageURL !== 'string' || imageURL.trim() === '') {
    res.status(400).json({ success: false, error: 'imageURL is required and must be a non-empty string' });
    return;
  }

  try {
    console.log(`[validate-image] Validating image: ${imageURL}`);

    // Fetch image
    const imagePart = await fetchImagePart(imageURL);
    if (!imagePart) {
      res.status(400).json({ success: false, error: 'Failed to fetch image from Cloudinary.' });
      return;
    }

    const prompt = `You are an image moderation and assessment AI for a civic issue reporting platform. 
Your task is to analyze the provided image and determine if it is a valid photograph of a real-world civic infrastructure or public maintenance issue.

VALID CIVIC ISSUES INCLUDE:
- Potholes, cracks, and broken roads.
- Overflowing garbage bins, scattered waste, or illegal dumping.
- Open, broken, or clogged drains, waterlogging, or sewer leakage.
- Water pipe leakage or water wastage in public spaces.
- Broken, non-functioning, or damaged streetlights.
- Broken public infrastructure (damaged park benches, broken fences, missing manhole covers, vandalized signs).
- Any other public safety or municipal maintenance issue.

INVALID IMAGES INCLUDE (THESE MUST BE REJECTED):
- Laptop, computer, mobile phone, or TV screens (including screenshots, software, website captures, or chats).
- Document scans, photos of documents, certificates, papers, or book pages.
- Selfies, portraits, or pictures focusing primarily on a person or group of people without any visible civic issue.
- Indoor household objects (appliances, beds, personal belongings, interior walls, clean indoor rooms).
- Abstract graphics, drawings, memes, or online download pictures.

Return ONLY a JSON response in this format (no markdown code fences, no extra text):
{
  "isValid": <true or false>,
  "reason": "<If invalid, write a clear, friendly 1-2 sentence explanation explaining why it was rejected and what a correct image should be. If valid, briefly describe what civic issue is observed in 1 sentence.>"
}`;

    const rawText = await callGemini(prompt, imagePart, true);
    const clean = stripMarkdown(rawText);
    const result = JSON.parse(clean) as { isValid: boolean; reason: string };

    console.log(`[validate-image] Result: isValid=${result.isValid}, reason=${result.reason}`);
    res.json({ success: true, isValid: result.isValid, reason: result.reason });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error(`[validate-image] Error validating image:`, message);
    res.status(500).json({ success: false, error: message });
  }
});
