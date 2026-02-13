export default async function handler(req: any, res: any) {
  const steps: string[] = [];
  try {
    steps.push('start');
    const serverless = require('serverless-http');
    steps.push('serverless loaded');
    const { app } = require('../server/src/app');
    steps.push('app loaded');
    const wrapped = serverless(app);
    steps.push('wrapped');
    return wrapped(req, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message, steps });
  }
}
