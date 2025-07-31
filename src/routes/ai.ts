import { Router, type Request, type Response } from 'express';
import axios from 'axios';

const router = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Using a current and efficient model
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

router.post('/generate-list', async (req: Request, res: Response) => {
    const { prompt: userPrompt } = req.body;

    if (!userPrompt) {
        return res.status(400).json({ message: 'A prompt is required.' });
    }
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ message: 'AI API key is not configured on the server.' });
    }

    try {
        const metaPrompt = `
            Based on the following user request, generate a relevant list title and an array of 3 to 5 task card titles.
            User Request: "${userPrompt}"

            Respond with ONLY a valid JSON object in the following format, with no other text or markdown formatting:
            {
              "listTitle": "A creative and relevant title for the list",
              "cardTitles": ["First task", "Second task", "Third task"]
            }
        `;

        const requestBody = {
            contents: [{ parts: [{ text: metaPrompt }] }],
        };

        const response = await axios.post(API_URL, requestBody, {
            headers: { 'Content-Type': 'application/json' },
        });

        const aiResponseText = response.data.candidates[0].content.parts[0].text;

        // Attempt to parse the JSON from the AI's response
        const parsedResponse = JSON.parse(aiResponseText);
        res.json(parsedResponse);

    } catch (error: any) {
        console.error('Error in /generate-list route:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to generate list from AI.' });
    }
});

export default router;