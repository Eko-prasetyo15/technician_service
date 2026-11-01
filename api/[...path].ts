import { Request, Response } from 'express';
import { createApp } from '../server.ts';

let appPromise: ReturnType<typeof createApp> | undefined;

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    appPromise ??= createApp();
    const app = await appPromise;
    app(req, res);
  } catch (error) {
    console.error('[Vercel API] Failed to initialize application:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Application initialization failed' });
    }
  }
}
