import { app } from '../server/src/app.js';

export default (req: any, res: any) => {
  // Strip the query param that Vercel's rewrite adds
  if (!res.headersSent) {
    app(req, res);
  }
};
