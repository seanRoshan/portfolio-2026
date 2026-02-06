-- ============================================================
-- Portfolio 2026 — Initial Database Schema
-- ============================================================

-- 1. TABLES
-- ============================================================

-- Global site configuration (single row)
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_title TEXT NOT NULL DEFAULT 'Portfolio',
  site_description TEXT,
  og_image_url TEXT,
  favicon_url TEXT,
  google_analytics_id TEXT,
  social_links JSONB DEFAULT '{}',
  contact_email TEXT,
  contact_form_enabled BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hero section (single row)
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

-- About section (single row)
CREATE TABLE about_section (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  heading TEXT DEFAULT 'About Me',
  subheading TEXT,
  bio TEXT NOT NULL,
  bio_secondary TEXT,
  portrait_url TEXT,
  stats JSONB DEFAULT '[]',
  tech_stack TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT NOT NULL,
  long_description TEXT,
  thumbnail_url TEXT,
  images TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  color TEXT,
  year TEXT,
  live_url TEXT,
  github_url TEXT,
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Skills
CREATE TABLE skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  icon_name TEXT,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  show_on_resume BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Experience / work history
CREATE TABLE experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  achievements TEXT[] DEFAULT '{}',
  company_logo_url TEXT,
  company_url TEXT,
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  show_on_resume BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Blog posts
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  read_time_minutes INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- Resume (single row)
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
  certifications JSONB DEFAULT '[]',
  additional_sections JSONB DEFAULT '[]',
  pdf_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contact form submissions
CREATE TABLE contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 2. ROW LEVEL SECURITY
-- ============================================================

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
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read hero_section" ON hero_section FOR SELECT USING (true);
CREATE POLICY "Public read about_section" ON about_section FOR SELECT USING (true);
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (published = true);
CREATE POLICY "Public read skills" ON skills FOR SELECT USING (published = true);
CREATE POLICY "Public read experience" ON experience FOR SELECT USING (published = true);
CREATE POLICY "Public read blog_posts" ON blog_posts FOR SELECT USING (published = true);
CREATE POLICY "Public read resume" ON resume FOR SELECT USING (true);

-- Public INSERT for contact form
CREATE POLICY "Public insert contact" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Admin full access (authenticated user = admin)
CREATE POLICY "Admin full access site_settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access hero_section" ON hero_section FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access about_section" ON about_section FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access projects" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access skills" ON skills FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access experience" ON experience FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access blog_posts" ON blog_posts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access resume" ON resume FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin read contact" ON contact_submissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin update contact" ON contact_submissions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete contact" ON contact_submissions FOR DELETE USING (auth.role() = 'authenticated');


-- 3. AUTO-UPDATE TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON hero_section FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON about_section FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON experience FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON resume FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 4. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('projects', 'projects', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('blog', 'blog', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('resume', 'resume', true);

-- Public read access to all buckets
CREATE POLICY "Public read storage" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'projects', 'blog', 'resume'));

-- Admin upload/update/delete
CREATE POLICY "Admin upload storage" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update storage" ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete storage" ON storage.objects FOR DELETE USING (auth.role() = 'authenticated');
