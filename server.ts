import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { askShopCopilot, parseReceiptText } from './src/server/gemini';

export function createExpressApp() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // API Routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      cloud: 'Firebase Firestore & RTDB',
      timestamp: new Date().toISOString() 
    });
  });

  app.post('/api/ai/copilot', async (req, res) => {
    try {
      const { prompt, contextData } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      const answer = await askShopCopilot(prompt, contextData || {});
      res.json({ answer });
    } catch (error: any) {
      console.error('Copilot API Error:', error);
      res.status(500).json({ error: error.message || 'AI service error' });
    }
  });

  app.post('/api/ai/parse-receipt', async (req, res) => {
    try {
      const { receiptContent } = req.body;
      if (!receiptContent) {
        return res.status(400).json({ error: 'Receipt content is required' });
      }
      const result = await parseReceiptText(receiptContent);
      res.json(result);
    } catch (error: any) {
      console.error('Parse Receipt API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to parse receipt' });
    }
  });

  return app;
}

async function startServer() {
  const app = createExpressApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Vite development middleware or production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}
