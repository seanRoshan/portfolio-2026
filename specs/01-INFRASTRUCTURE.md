# 01 — Infrastructure & Database

## Supabase Project Setup

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # Public anon key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Private service role key (server-only, NEVER expose to client)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Supabase Client Setup

Create three Supabase client configurations:

**Browser Client** (`/lib/supabase/client.ts`):

- Uses `createBrowserClient` from `@supabase/ssr`
- Uses anon key
- For client components that need auth state

**Server Client** (`/lib/supabase/server.ts`):

- Uses `createServerClient` from `@supabase/ssr`
- Reads cookies from Next.js `cookies()` function
- For Server Components and Server Actions
- Respects RLS policies based on logged-in user

**Admin Client** (`/lib/supabase/admin.ts`):

- Uses `createClient` from `@supabase/supabase-js` with service role key
- Bypasses RLS — use ONLY in API routes for admin operations
- NEVER import this in client components

### Auth Middleware

Create Next.js middleware (`/middleware.ts`) that:

1. Refreshes the Supabase auth session on every request (prevents stale tokens)
2. Protects `/admin/*` routes — redirect to `/login` if not authenticated
3. Redirects `/login` to `/admin` if already authenticated
4. Passes through all public routes without checks

```typescript
// middleware.ts pattern
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // 1. Create supabase client with cookie handling
  // 2. Refresh session (IMPORTANT: call supabase.auth.getUser() to validate)
  // 3. Check if route is protected (/admin/*)
  // 4. Redirect if needed
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
}
```

## Database Schema

### Table: `site_settings`

Global site configuration (single row).

```sql
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_title TEXT NOT NULL DEFAULT 'Portfolio',
  site_description TEXT,
  og_image_url TEXT,
  favicon_url TEXT,
  google_analytics_id TEXT,
  social_links JSONB DEFAULT '{}',
  -- social_links example: {"github": "url", "linkedin": "url", "twitter": "url", "email": "you@email.com"}
  contact_email TEXT,
  contact_form_enabled BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `hero_section`

Hero content (single row).

```sql
CREATE TABLE hero_section (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  greeting TEXT DEFAULT 'Hi, I''m',
  name TEXT NOT NULL,
  rotating_titles TEXT[] DEFAULT ARRAY['Full-Stack Developer', 'System Architect', 'Builder'],
  description TEXT,
  cta_primary_text TEXT DEFAULT 'View My Work',
  cta_primary_link TEXT DEFAULT '#projects',
  cta_secondary_text TEXT DEFAULT 'Get In Touch',
  cta_secondary_link TEXT DEFAULT '#contact',
  avatar_url TEXT,
  resume_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `about_section`

```sql
CREATE TABLE about_section (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  heading TEXT DEFAULT 'About Me',
  bio TEXT NOT NULL,
  portrait_url TEXT,
  stats JSONB DEFAULT '[]',
  -- stats example: [{"label": "Years Experience", "value": "8+"}, {"label": "Projects", "value": "50+"}]
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `projects`

```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT NOT NULL,
  long_description TEXT,
  thumbnail_url TEXT,
  images TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  live_url TEXT,
  github_url TEXT,
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `skills`

```sql
CREATE TABLE skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'frontend', 'backend', 'devops', 'database', 'tools'
  icon_name TEXT,          -- Icon identifier (e.g., 'react', 'nodejs', 'docker')
  icon_url TEXT,           -- Optional custom icon URL (overrides icon_name)
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `experience`

```sql
CREATE TABLE experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,                  -- NULL = "Present"
  description TEXT,
  achievements TEXT[] DEFAULT '{}',
  company_logo_url TEXT,
  company_url TEXT,
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `blog_posts`

```sql
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,           -- HTML content from rich text editor
  cover_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  read_time_minutes INTEGER,
  meta_title TEXT,                 -- SEO: Override page title
  meta_description TEXT,           -- SEO: Override meta description
  og_image_url TEXT,               -- SEO: Override OG image
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast slug lookups and published posts
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);
```

### Table: `resume`

```sql
CREATE TABLE resume (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  website TEXT,
  linkedin TEXT,
  github TEXT,
  summary TEXT,
  education JSONB DEFAULT '[]',
  -- education: [{"school": "MIT", "degree": "BS Computer Science", "year": "2018", "details": "..."}]
  certifications JSONB DEFAULT '[]',
  -- certifications: [{"name": "AWS Solutions Architect", "issuer": "Amazon", "year": "2023"}]
  additional_sections JSONB DEFAULT '[]',
  -- additional_sections: [{"title": "Open Source", "items": ["Contributed to...", "Maintained..."]}]
  pdf_url TEXT,                    -- Pre-generated PDF stored in Supabase Storage
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resume uses experience and skills tables for work history and tech skills
```

### Table: `contact_submissions`

```sql
CREATE TABLE contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on ALL tables
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Public READ policies (anon can read published content)
CREATE POLICY "Public read" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read" ON hero_section FOR SELECT USING (true);
CREATE POLICY "Public read" ON about_section FOR SELECT USING (true);
CREATE POLICY "Public read" ON projects FOR SELECT USING (published = true);
CREATE POLICY "Public read" ON skills FOR SELECT USING (published = true);
CREATE POLICY "Public read" ON experience FOR SELECT USING (published = true);
CREATE POLICY "Public read" ON blog_posts FOR SELECT USING (published = true);
CREATE POLICY "Public read" ON resume FOR SELECT USING (true);

-- Public INSERT for contact form
CREATE POLICY "Public insert" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Admin full access (authenticated users)
-- Since this is a single-user portfolio, any authenticated user is admin
CREATE POLICY "Admin full access" ON site_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON hero_section FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON about_section FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON skills FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON experience FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON blog_posts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON resume FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin read" ON contact_submissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin update" ON contact_submissions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete" ON contact_submissions FOR DELETE USING (auth.role() = 'authenticated');
```

### Updated-at Trigger

```sql
-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON hero_section FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON about_section FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON experience FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON resume FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Supabase Storage Buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('projects', 'projects', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('blog', 'blog', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('resume', 'resume', true);

-- Public read access
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'projects', 'blog', 'resume'));

-- Admin upload/delete
CREATE POLICY "Admin upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update" ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete" ON storage.objects FOR DELETE USING (auth.role() = 'authenticated');
```

**Bucket usage:**

- `avatars/` — Profile photo for hero/about section
- `projects/` — Project thumbnails and screenshots
- `blog/` — Blog post images and media
- `resume/` — Generated PDF resume files

## Seed Script

Create `/scripts/seed.ts` that:

1. Reads the current hard-coded data from `/data/portfolio.ts`
2. Maps it to the database schema
3. Inserts it into Supabase using the service role client
4. Can be run with `npx tsx scripts/seed.ts`

This ensures zero data loss during migration.

## Vercel Deployment

### vercel.json

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

### Environment Variables in Vercel

Set all env vars from `.env.local` in Vercel Dashboard > Settings > Environment Variables.

### Revalidation Strategy

- Use Next.js `revalidateTag()` and `revalidatePath()` in admin Server Actions
- When admin updates content → revalidate the affected page/tag
- Public pages use `cache: 'force-cache'` with tags for instant loads + on-demand revalidation
- Blog posts: `revalidateTag('blog')` and `revalidatePath('/blog/[slug]')`
- Home page sections: `revalidateTag('hero')`, `revalidateTag('projects')`, etc.

### On-Demand Revalidation API Route

Create `/app/api/revalidate/route.ts` that accepts a secret + tag/path to revalidate. This allows the admin dashboard to bust cache after content updates without redeploying.
