import { Router, type Request, type Response } from 'express';
import axios from 'axios';

const router = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

router.post('/generate-subtasks', async (req: Request, res: Response) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Card title is required.' });
    }
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ message: 'AI API key is not configured.' });
    }

    try {
        const prompt = `Generate a concise checklist of 2 to 4 sub-tasks for the following Kanban card title: "${title}". Format the response as a simple, unnumbered list with each task on a new line, like "- Task 1\n- Task 2".`;

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
        };

        const response = await axios.post(API_URL, requestBody, {
            headers: { 'Content-Type': 'application/json' },
        });

        // Extract the generated text from the Gemini API response
        const generatedText = response.data.candidates[0].content.parts[0].text;
        res.json({ subtasks: generatedText });

    } catch (error: any) {
        console.error('Error calling Gemini API:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to generate sub-tasks from AI.' });
    }
});

export default router;