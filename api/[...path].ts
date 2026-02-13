export default async function handler(req: any, res: any) {
  try {
    const serverless = require('serverless-http');
    const { app } = require('../server/src/app');
    const wrapped = serverless(app);
    return wrapped(req, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
