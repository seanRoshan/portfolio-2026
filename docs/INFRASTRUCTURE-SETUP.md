# Infrastructure Setup Guide

This document covers the full setup process for the portfolio backend infrastructure.
Follow these steps in order to replicate the setup on a new machine or project.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 24.x | `nvm install 24` |
| Supabase CLI | 2.75.0+ | `brew install supabase/tap/supabase` |
| Vercel CLI | 50.x | `npm i -g vercel` |
| GitHub CLI | 2.x | `brew install gh` |

---

## Step 1: Create Supabase Account & Project (Manual)

1. Go to [https://supabase.com](https://supabase.com) and create an account (or sign in)
2. Click **"New Project"**
3. Configure:
   - **Organization**: Select or create one
   - **Project Name**: `portfolio-2026`
   - **Database Password**: Generate a strong password and **save it somewhere safe**
   - **Region**: Choose closest to your users (e.g., `us-east-1` for US East)
   - **Pricing Plan**: Free tier is fine to start
4. Wait for project to finish provisioning (~2 minutes)

## Step 2: Get Supabase Credentials

After project is created, go to **Project Settings > API** and note:
- **Project URL**: `https://xxxx.supabase.co`
- **Anon (public) key**: `eyJ...` (safe for browser)
- **Service role key**: `eyJ...` (secret, server-only)

## Step 3: Link Supabase CLI to Project

```bash
# Login to Supabase CLI (opens browser for auth)
supabase login

# Link project (from the portfolio/ directory)
cd portfolio
supabase link --project-ref <your-project-ref>
```

The `project-ref` is the random string in your Supabase URL: `https://<project-ref>.supabase.co`

## Step 4: Set Up Environment Variables

```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local with your actual values:
# NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
# SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
# NEXT_PUBLIC_SITE_URL=http://localhost:3000  (change to production URL after deploy)
# REVALIDATION_SECRET=<generate-a-random-string>
```

## Step 5: Push Database Migrations

```bash
# Push all migration files to your Supabase project
supabase db push
```

This creates all tables, RLS policies, triggers, and storage buckets.

## Step 6: Create Admin User (Manual)

1. Go to Supabase Dashboard > **Authentication > Users**
2. Click **"Add User"** > **"Create new user"**
3. Enter your email and a strong password
4. Toggle OFF **"Auto Confirm"** if it asks (or go to Auth > Providers > Email and disable "Confirm email")
5. This is the ONLY admin user — no public sign-up exists

**Current admin**: `sean.roshan.91@gmail.com` (created 2026-02-06)

## Step 7: Seed the Database

```bash
# Install tsx if not already available
npx tsx scripts/seed.ts
```

This migrates all hard-coded portfolio data from `src/data/portfolio.ts` into Supabase.

## Step 8: Vercel Deployment

```bash
# Link to Vercel (if not already linked)
vercel link

# Set environment variables in Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_SITE_URL
vercel env add REVALIDATION_SECRET

# Deploy
vercel --prod
```

## Step 9: Configure Supabase Auth Redirect

After deploying to Vercel with a production URL:

1. Go to Supabase Dashboard > **Authentication > URL Configuration**
2. Set **Site URL** to your production URL (e.g., `https://yourdomain.com`)
3. Add redirect URLs:
   - `https://yourdomain.com/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (for local dev)

---

## CLI Commands Reference

```bash
# Supabase
supabase login                    # Authenticate CLI
supabase link --project-ref xxx   # Link to remote project
supabase db push                  # Push migrations to remote
supabase db reset                 # Reset local DB (if using local dev)
supabase migration new <name>     # Create new migration file

# Vercel
vercel                            # Deploy to preview
vercel --prod                     # Deploy to production
vercel env ls                     # List environment variables
vercel env add <name>             # Add environment variable
```

---

## Security Practices

### Secrets Management
- **`.env.local`** is gitignored (`.env*` pattern) — never committed to repo
- **`.env.local.example`** is committed as a template with placeholder values only
- **Supabase anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is safe for browser — RLS enforces access
- **Supabase service role key** (`SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS — used ONLY in:
  - `/src/lib/supabase/admin.ts` (server-side only)
  - `/scripts/seed.ts` (one-time migration script)
  - NEVER imported in client components
- **Revalidation secret** (`REVALIDATION_SECRET`) protects the cache-busting API route
- **Keys are fetched via CLI** (`supabase projects api-keys`) — never copied from browser

### Three Supabase Clients
| Client | File | Key Used | RLS | Use Case |
|--------|------|----------|-----|----------|
| Browser | `lib/supabase/client.ts` | Anon | Enforced | Client components (auth state) |
| Server | `lib/supabase/server.ts` | Anon + cookies | Enforced | Server Components, Server Actions |
| Admin | `lib/supabase/admin.ts` | Service role | Bypassed | API routes, scripts only |

### Row Level Security (RLS)
- ALL tables have RLS enabled
- Public users can only READ published content
- Only authenticated users (admin) can INSERT/UPDATE/DELETE
- Contact form allows public INSERT only
- Storage buckets: public read, admin-only write

### Vercel Environment Variables
Set via CLI (`vercel env add`) or Vercel Dashboard — never in code:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL        # all environments
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY   # all environments
vercel env add SUPABASE_SERVICE_ROLE_KEY       # production + preview only
vercel env add NEXT_PUBLIC_SITE_URL            # per environment
vercel env add REVALIDATION_SECRET             # production + preview only
```

---

## Troubleshooting

**"Permission denied" on admin routes**: Make sure you created the admin user in Supabase Dashboard and that RLS policies are applied.

**"Invalid API key"**: Double-check `.env.local` values match Supabase Dashboard > Settings > API.

**Seed script fails**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not the anon key). The service role key bypasses RLS.
