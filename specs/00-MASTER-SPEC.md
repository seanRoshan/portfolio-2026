# Portfolio Website v2 — Master Specification

## Overview

We are upgrading an existing Next.js 16.1 portfolio website from hard-coded static data to a fully dynamic, CMS-driven application with an admin dashboard, blog system, and online resume — all deployable on a single platform.

## Architecture Decision: Vercel + Supabase

After evaluating options, we are using:

| Concern | Solution | Why |
|---------|----------|-----|
| **Hosting** | Vercel Pro | Edge network, DDoS protection, custom domain, analytics, Next.js-native |
| **Database** | Supabase (PostgreSQL) | Free tier: 500MB DB, 1GB storage, 50K MAU auth. Row Level Security built-in |
| **Authentication** | Supabase Auth | Built into Supabase, supports email/password + OAuth, no extra service needed |
| **File Storage** | Supabase Storage | Images, resume PDFs, blog media. 1GB free. CDN-backed. Signed URLs for private files |
| **Custom Domain** | Vercel | SSL auto-provisioned, HTTPS enforced |
| **Security** | Vercel (WAF/DDoS) + Supabase (RLS + Auth) | Multi-layer protection |

### Why NOT Vercel Postgres + Vercel Blob + Auth.js?
- 3 separate services vs 1 (Supabase bundles auth + DB + storage)
- Supabase free tier is more generous (500MB DB vs 256MB Vercel Postgres)
- Supabase has built-in Row Level Security — admin-only writes are enforced at DB level
- Supabase Storage has built-in image transformations (resize, crop) — no extra CDN needed
- Single dashboard to manage everything
- If we ever need realtime features (live blog views, etc.), Supabase has it built in

## Spec Files (Read in Order)

1. **`01-INFRASTRUCTURE.md`** — Supabase setup, database schema, storage buckets, auth config, environment variables, Vercel deployment
2. **`02-ADMIN-DASHBOARD.md`** — Auth flow, admin UI, content management for all website sections
3. **`03-BLOG-SYSTEM.md`** — Blog creation with rich text editor, media handling, YouTube embeds, SEO per post
4. **`04-RESUME-PAGE.md`** — Online resume page, admin editing, PDF download generation
5. **`05-SKILLS-REDESIGN.md`** — Skills section redesign (no percentages, icon-based, career-advisor approved)
6. **`06-SEO-OPTIMIZATION.md`** — Comprehensive SEO strategy, metadata, structured data, sitemap, performance

## Global Technical Constraints

- **Next.js 16.1** with App Router, Server Components, Cache Components, Turbopack
- **React 19.2** with View Transitions, useEffectEvent
- **TypeScript 5.9** — strict mode
- **Tailwind CSS v4** — CSS-first config (NO tailwind.config.js)
- **Motion 12** — import from `"motion/react"`, NOT `"framer-motion"`
- **GSAP 3.14** — all plugins FREE (SplitText, ScrollTrigger, Flip, etc.)
- **@gsap/react** — use `useGSAP()` hook, NOT raw useEffect
- **Lenis 1.3** — import from `"lenis"`, NOT `"@studio-freight/lenis"`. Use `autoRaf: true`
- **shadcn/ui CLI 3.0** — latest components
- **Supabase JS v2** — `@supabase/supabase-js` and `@supabase/ssr` for Next.js integration

## Project Structure (Target)

```
/app
  /(public)/                    # Public-facing routes (portfolio)
    /page.tsx                   # Home page (hero, about, projects, skills, contact)
    /blog/page.tsx              # Blog listing
    /blog/[slug]/page.tsx       # Individual blog post
    /resume/page.tsx            # Online resume (public view)
  /(admin)/                     # Admin routes (protected)
    /admin/page.tsx             # Admin dashboard home
    /admin/hero/page.tsx        # Edit hero section
    /admin/about/page.tsx       # Edit about section
    /admin/projects/page.tsx    # Manage projects (CRUD)
    /admin/skills/page.tsx      # Manage skills
    /admin/experience/page.tsx  # Manage experience timeline
    /admin/blog/page.tsx        # Blog management (list)
    /admin/blog/new/page.tsx    # Create new blog post
    /admin/blog/[id]/page.tsx   # Edit blog post
    /admin/resume/page.tsx      # Edit resume content
    /admin/contact/page.tsx     # Edit contact info & social links
    /admin/settings/page.tsx    # Site-wide settings (SEO defaults, analytics)
  /login/page.tsx               # Admin login page
  /api/                         # API routes
    /auth/callback/route.ts     # Supabase auth callback
    /revalidate/route.ts        # On-demand revalidation endpoint
    /resume/download/route.ts   # PDF generation endpoint
/components
  /ui/                          # shadcn/ui components
  /sections/                    # Page sections (Hero, About, Projects, etc.)
  /animations/                  # Reusable animation wrappers
  /admin/                       # Admin dashboard components
  /blog/                        # Blog-specific components (editor, renderer)
/lib
  /supabase/
    /client.ts                  # Browser Supabase client
    /server.ts                  # Server Supabase client (for Server Components)
    /admin.ts                   # Service role client (for API routes only)
    /middleware.ts               # Auth middleware helper
  /utils.ts                     # General utilities
  /seo.ts                       # SEO helper functions
/hooks
  /useScrollProgress.ts
  /useMousePosition.ts
  /useMagneticEffect.ts
/data                           # REMOVE — replaced by database
/styles
  /globals.css                  # Tailwind v4 CSS-first config
/public
  /fonts/                       # Self-hosted variable fonts
```

## Migration Strategy

Since the app currently uses hard-coded data from `/data/portfolio.ts`, the migration is:

1. Set up Supabase project and create database schema
2. Create a seed script that imports current hard-coded data into Supabase
3. Replace all hard-coded data imports with Supabase queries in Server Components
4. Add admin dashboard with auth
5. Add blog system
6. Add resume page
7. Redesign skills section
8. SEO optimization pass

**IMPORTANT**: The public-facing website must continue to work during migration. Use Server Components to fetch from Supabase, falling back to cache. The site should be just as fast (or faster) than the static version thanks to Next.js caching.
