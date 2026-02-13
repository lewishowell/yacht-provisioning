import type { VercelRequest, VercelResponse } from '@vercel/node';

let handler: ((req: VercelRequest, res: VercelResponse) => Promise<void>) | null = null;
let initError: Error | null = null;

try {
  const serverless = require('serverless-http');
  const { app } = require('../server/src/app');
  handler = serverless(app);
} catch (err) {
  initError = err as Error;
}

export default async function (req: VercelRequest, res: VercelResponse) {
  if (initError) {
    res.status(500).json({ error: 'Function init failed', message: initError.message });
    return;
  }
  return handler!(req, res);
}
