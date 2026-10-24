import { localApiOnly } from './local-api-guard.mjs';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use('/api', localApiOnly(() => PORT));
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64,
          },
        },
        'Analyze the mood and scene of this image. Then, ghostwrite a compelling opening paragraph to a story set in this world.',
      ],
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error('Analyze Image Error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Expressive AI voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Failed to generate audio' });
    }
    res.json({ audioBase64: base64Audio });
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    // Convert messages format if needed. The payload messages should be in the format that generateContent expects.
    // For simplicity, we can just use generateContent with the history, but it requires specific Content format.
    // Assuming messages is an array of strings or {role, parts} objects.
    
    // We'll expect messages to be an array of { role: 'user' | 'model', parts: [{ text: string }] }
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview', // Using pro-preview for complex story-writing tasks
      contents: messages,
      config: {
        systemInstruction: systemInstruction || 'You are an AI co-author helping the user write a story.',
      },
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: 'Failed to generate chat response' });
  }
});


async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
