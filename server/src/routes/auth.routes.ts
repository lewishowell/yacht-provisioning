import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { seedNewUser } from '../services/seed-user.service.js';

export const authRouter = Router();

// Configure Passport Google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${env.SERVER_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const existing = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        const user = await prisma.user.upsert({
          where: { googleId: profile.id },
          update: {
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value ?? null,
          },
          create: {
            googleId: profile.id,
            email: profile.emails?.[0]?.value ?? '',
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value ?? null,
          },
        });

        if (!existing) {
          await seedNewUser(user.id);
        }

        done(null, user);
      } catch (err) {
        console.error('Google strategy error:', err);
        done(err as Error);
      }
    },
  ),
);

// Initiate Google OAuth
authRouter.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }),
);

// Google OAuth callback - manual handler to capture errors
authRouter.get('/google/callback', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', { session: false }, (err: Error | null, user: { id: string } | false) => {
    if (err) {
      console.error('OAuth callback error:', err);
      return res.redirect(`${env.CLIENT_URL}/login?error=auth_failed`);
    }
    if (!user) {
      console.error('OAuth callback: no user returned');
      return res.redirect(`${env.CLIENT_URL}/login?error=no_user`);
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log('OAuth success for user:', user.id);
    res.redirect(env.CLIENT_URL + '/api/auth/session?token=' + token);
  })(req, res, next);
});

// Set session cookie (called via Vite proxy so cookie is on client origin)
authRouter.get('/session', (req, res) => {
  const token = req.query.token as string;
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.redirect(env.CLIENT_URL);
});

// Get current user
authRouter.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// Mark onboarding as seen
authRouter.post('/onboarding-seen', authMiddleware, async (req, res) => {
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { hasSeenOnboarding: true },
  });
  res.json({ ok: true });
});

// Clear seed data (removes all user's inventory items and provisioning lists)
authRouter.post('/clear-seed-data', authMiddleware, async (req, res) => {
  const userId = req.user!.id;
  await prisma.provisioningListItem.deleteMany({
    where: { list: { userId } },
  });
  await prisma.provisioningList.deleteMany({
    where: { userId },
  });
  await prisma.inventoryItem.deleteMany({
    where: { userId },
  });
  res.json({ ok: true });
});

// Logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});
