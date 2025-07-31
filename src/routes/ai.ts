import { Router, type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// Ensure we have a real string for TS
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
}

// Initialize client with a guaranteed string key
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

router.post('/generate-list', async (req: Request, res: Response) => {
    const { prompt: userPrompt } = req.body;

    if (typeof userPrompt !== 'string' || userPrompt.trim() === '') {
        return res.status(400).json({ message: 'A prompt is required.' });
    }

    try {
        const metaPrompt = `
      Based on the following user request, generate a relevant list title and an array of 3 to 5 task card titles.
      User Request: "${userPrompt}"

      Respond with ONLY a valid JSON object in the following format:
      {
        "listTitle": "A creative and relevant title for the list",
        "cardTitles": ["First task", "Second task", "Third task"]
      }
    `;

        // Call the new models API directly
        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: metaPrompt,
        });

        const aiResponseText = result.text;
        if (!aiResponseText) {
            console.error('Empty AI output');
            return res.status(500).json({ message: 'AI returned no content.' });
        }

        // Parse and validate
        let parsed: { listTitle: string; cardTitles: string[] };
        try {
            parsed = JSON.parse(aiResponseText);
        } catch (e) {
            console.error('Failed to parse AI JSON:', e);
            return res.status(500).json({ message: 'Invalid JSON from AI.' });
        }

        if (
            typeof parsed.listTitle !== 'string' ||
            !Array.isArray(parsed.cardTitles) ||
            !parsed.cardTitles.every((t) => typeof t === 'string')
        ) {
            console.error('AI returned malformed JSON:', parsed);
            return res.status(500).json({ message: 'Unexpected JSON structure from AI.' });
        }

        return res.json(parsed);

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return res.status(500).json({ message: 'Failed to generate list from AI.' });
    }
});

export default router;
