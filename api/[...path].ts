import serverless from 'serverless-http';

export default async function handler(req: any, res: any) {
  res.status(200).json({ step: 'serverless imported' });
}
