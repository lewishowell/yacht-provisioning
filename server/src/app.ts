import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { inventoryRouter } from './routes/inventory.routes.js';
import { provisioningRouter } from './routes/provisioning.routes.js';
import { mealRouter } from './routes/meal.routes.js';
import { mealplanRouter } from './routes/mealplan.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/auth', authRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/provisioning-lists', provisioningRouter);
app.use('/api/meals', mealRouter);
app.use('/api/meal-plans', mealplanRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export { app };
