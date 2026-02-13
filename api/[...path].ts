import serverless from 'serverless-http';

let handler: any;

try {
  const { app } = require('../server/src/app');
  handler = serverless(app);
} catch (err: any) {
  handler = (_req: any, res: any) => {
    res.status(500).json({ error: err.message, stack: err.stack });
  };
}

export default handler;
