import serverless from 'serverless-http';
import { app } from '../server/src/app.js';

export default async function handler(req: any, res: any) {
  res.status(200).json({ step: 'app imported' });
}
