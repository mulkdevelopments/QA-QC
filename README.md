# Alubond Connect

Manage document links, generate shareable pages, and send links via Outlook.

## Stack

- **Postgres** (Docker locally; Vercel Postgres / Neon in production)
- **Express + Prisma** API
- **React** admin UI + public share pages
- Admin password stored with **bcrypt** (never plaintext)

## Local setup

```bash
cp .env.example .env
# Fill DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD in .env
npm install
npm run db:up
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:5173 and sign in with the admin credentials from your `.env`.

### Share flow

1. Sign in
2. Select documents
3. Click **Share link** — creates a public URL like `/s/abc123…`
4. Anyone with that link can view/open the documents (no login)

## Vercel deploy

1. Connect this repo to Vercel
2. Add a Postgres database (Vercel Storage / Neon) and set:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `APP_URL` (your production URL)
   - `NODE_ENV=production`
3. After first deploy, run migrations + seed against the production DB:

```bash
DATABASE_URL="…" npx prisma migrate deploy
DATABASE_URL="…" npm run db:seed
```

Never commit `.env` or real credentials.
