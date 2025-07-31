import { Router, type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// Ensure the API key is set at startup
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
}

// Initialize the client
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

router.post('/generate-list', async (req: Request, res: Response) => {
    const { prompt: userPrompt } = req.body;

    // Validate input
    if (typeof userPrompt !== 'string' || !userPrompt.trim()) {
        return res.status(400).json({ message: 'A prompt is required.' });
    }

    try {
        // Strongly-worded prompt to avoid Markdown wrappers
        const metaPrompt = `
Respond with ONLY a raw JSON object (no Markdown, no backticks, no explanations) in this format:
{
  "listTitle": "A creative and relevant title for the list",
  "cardTitles": ["First task", "Second task", "Third task"]
}

User Request: "${userPrompt}"
`;

        // Call the latest Flash model
        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: metaPrompt,
        });

        // Get and sanitize the text
        let aiResponseText = (result.text ?? '').trim();
        if (aiResponseText.startsWith('```')) {
            aiResponseText = aiResponseText
                .replace(/^```(?:json)?\s*/, '')
                .replace(/```$/, '')
                .trim();
        }

        // Ensure we actually got something
        if (!aiResponseText) {
            console.error('Empty AI output after sanitization');
            return res.status(500).json({ message: 'AI returned no content.' });
        }

        // Parse JSON and validate structure
        let parsed: { listTitle: string; cardTitles: string[] };
        try {
            parsed = JSON.parse(aiResponseText);
        } catch (err) {
            console.error('Failed to parse AI JSON:', err, aiResponseText);
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

        // All good—send it back
        return res.json(parsed);

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return res.status(500).json({ message: 'Failed to generate list from AI.' });
    }
});

export default router;
