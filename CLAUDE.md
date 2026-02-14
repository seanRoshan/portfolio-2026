# Portfolio 2026 - Development Guide

## Project Overview
Next.js 16 portfolio application with admin dashboard, blog, and resume builder.

## Tech Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui (new-york style), Radix UI
- **Database:** Supabase (PostgreSQL 17, Auth, Storage)
- **Forms:** react-hook-form + zod validation
- **Animations:** GSAP, Motion (Framer), Lenis smooth scroll
- **PDF:** Puppeteer (resume builder), @react-pdf/renderer (legacy resume)
- **Rich Text:** Tiptap
- **DnD:** @dnd-kit
- **Icons:** Lucide React, react-icons
- **AI:** Anthropic Claude API (resume builder features)

## Project Structure
```
src/
├── app/
│   ├── (public)/          # Public routes (home, blog, resume)
│   ├── admin/             # Admin dashboard routes
│   │   ├── resume-builder/  # Resume builder (multi-resume editor)
│   │   └── ...              # Other admin sections
│   ├── api/               # API routes
│   ├── login/             # Auth
│   └── r/[shortId]/       # Public shareable resume URLs
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── resume-builder/    # Resume builder components
│   ├── sections/          # Landing page sections
│   ├── admin/             # Admin shared components
│   └── ...
├── lib/
│   ├── supabase/          # Supabase clients (server, client, admin)
│   ├── resume-builder/    # Resume builder logic
│   │   ├── templates/     # HTML/CSS resume templates
│   │   ├── validation/    # Content rules engine
│   │   ├── ai/            # Claude AI integration
│   │   └── pdf/           # Puppeteer PDF pipeline
│   ├── schemas/           # Zod validation schemas
│   └── queries.ts         # Data fetching functions
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

## Development Conventions
- Use Server Components by default, `'use client'` only when needed
- Server Actions for mutations (revalidateTag/revalidatePath)
- Zod schemas for all form validation
- shadcn/ui components for UI (import from @/components/ui)
- Tailwind CSS utility classes (no inline styles)
- Use `cn()` utility for conditional classes
- Toast notifications via Sonner
- OKLch color space for CSS variables

## Database
- Supabase local dev: `npx supabase start`
- Migrations in `supabase/migrations/`
- RLS: public read, authenticated write
- Admin client bypasses RLS for server operations

## Resume Builder
- Multi-resume system: master + tailored versions
- 6 templates: Pragmatic, Mono, Smarkdown, CareerCup, Parker, Experienced
- AI features: bullet rewriter, cliche detector, summary generator, scorer, JD matcher
- PDF via Puppeteer (server-side HTML → PDF)
- Content validation engine (rules from RESUME-BUILDER-GUIDE.md)
- Application tracker with Kanban board
- JD analyzer with AI matching
- Career coach AI assistant

## Commands
- `npm run dev` - Start dev server
- `npx supabase start` - Start local Supabase
- `npx supabase db reset` - Reset database with migrations
- `npx playwright test` - Run E2E tests

## Important Rules
- Never deploy without explicit user approval
- Test locally only
- Feature branches for each feature
- Code review before merge
- Follow RESUME-BUILDER-GUIDE.md spec exactly
- AI features degrade gracefully without API key
