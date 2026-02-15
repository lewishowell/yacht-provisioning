# YachtProv

Provisioning and meal planning app for yacht crew and chefs. Track inventory, plan meals for trips, create provisioning lists, and sync purchases to inventory automatically.

**Live:** https://yacht-prov.vercel.app

## Tech Stack

- **Frontend:** React 19, React Router 7, TanStack Query, Tailwind CSS 4, Vite 7
- **Backend:** Express 4, Passport (Google OAuth), JWT auth
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **Deployment:** Vercel (serverless functions + static hosting)

## Project Structure

```
yacht-provisioning/
  client/          # React SPA
  server/          # Express API
  api/             # Vercel serverless entry point
  vercel.json      # Vercel config
```

## Local Development

### Prerequisites

- Node.js 18+
- A PostgreSQL database (Neon free tier works)

### Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example server/.env
   ```
   Edit `server/.env` with your database URL, Google OAuth credentials, and JWT secret.

3. Run database migrations:
   ```bash
   cd server && npx prisma migrate dev
   ```

4. Start the dev servers:
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - API: http://localhost:3001

## Deployment (Vercel)

1. Connect repo to Vercel
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` - Neon pooled connection string
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `JWT_SECRET` (min 32 chars)
   - `CLIENT_URL` - Vercel app URL (no trailing slash)
   - `SERVER_URL` - Same as CLIENT_URL
   - `NODE_ENV` - `production`
3. Add Vercel callback URL to Google Cloud Console:
   - Authorized redirect URI: `https://<app>.vercel.app/api/auth/google/callback`
   - Authorized JavaScript origin: `https://<app>.vercel.app`

## Features

- Google OAuth login
- Inventory management with categories, quantities, expiry tracking
- Low stock alerts and dashboard stats
- Provisioning lists with item tracking
- Purchase sync — marking items purchased auto-updates inventory
- CSV export for provisioning lists
- Meal library — save reusable meals with ingredient lists
- Meal planning — assign meals to breakfast, lunch, and dinner slots across trip dates
- Shopping list generation — create a provisioning list from a meal plan, auto-checking inventory for shortfalls
