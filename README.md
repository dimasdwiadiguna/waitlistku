# Waitlistku

Preorder management tool for Indonesian small business owners (UMKM).

## Stack

- **Next.js 14** App Router + TypeScript
- **Supabase** (PostgreSQL DB + storage)
- **Tailwind CSS** (mobile-first, Plus Jakarta Sans)
- **bcryptjs** + **jose** (custom JWT auth via httpOnly cookie)
- **xlsx** (import/export spreadsheets)
- **react-hot-toast** (notifications)
- Deploy to **Vercel**

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run the contents of `supabase-schema.sql`
3. Copy your project URL, anon key, and service role key

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=a-long-random-secret-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy

## Features

- **Custom auth** — register/login with bcrypt + JWT cookie, no Supabase Auth
- **Session management** — create preorder sessions with slugs, open/close dates
- **Products** — CRUD, XLSX import, template download
- **Promos** — first N customers, before-deadline, coupon codes
- **Customer page** `/p/[slug]` — multi-item cart, countdown timer, coupon input, WA order submit
- **Orders tab** — approve, send WA confirmation, soft delete
- **Paywall** — 7 free slots, buy more at Rp 500/order or Rp 20.000/100-pack
- **Export** — download orders as XLSX (disabled if blurred rows exist)
- **Language toggle** — Indonesian / English, persisted in localStorage

## Paywall Logic

`visible_limit = 7 + SUM(slots_purchased WHERE payment_status='paid')`

Orders beyond `visible_limit` are returned as blurred placeholder objects. The export endpoint checks the same limit and returns 403 if exceeded.

## Payment Integration

Currently uses a mock "I've Already Paid" button that inserts a `paid` record directly.

To integrate real payments, replace `/api/payments/confirm/route.ts` with a Xendit invoice flow (see the `TODO` comment in that file).

## File Structure

```
/app
  layout.tsx
  page.tsx                      ← landing
  /login, /register             ← auth pages
  /dashboard                    ← session list
  /dashboard/[sessionId]        ← manage session (3 tabs)
  /p/[slug]                     ← public customer page
  /api/...                      ← all API routes
/lib
  supabase.ts, supabaseClient.ts
  auth.ts                       ← JWT + bcrypt helpers
  lang.ts                       ← id + en translations
  LanguageContext.tsx
  xlsx.ts                       ← import/export helpers
  format.ts                     ← formatRp, dates, slug, countdown
/components
  Navbar, SessionCard, ItemModal, PromoModal,
  PaymentModal, CountdownBanner
middleware.ts                   ← protects /dashboard routes
supabase-schema.sql             ← run in Supabase SQL editor
```
