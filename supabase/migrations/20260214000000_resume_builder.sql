-- Resume Builder: Multi-resume system with templates, AI, and application tracking.

-- ============================================================
-- 1. RESUME TEMPLATES (seeded)
-- ============================================================
CREATE TABLE resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('recommended', 'classic', 'creative', 'minimal')),
  layout TEXT NOT NULL CHECK (layout IN ('single_column', 'two_column')),
  target_experience_levels TEXT[] DEFAULT '{}',
  max_pages INTEGER DEFAULT 2,
  preview_image_url TEXT,
  tokens JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. RESUMES (master + tailored versions)
-- ============================================================
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Resume',
  template_id UUID REFERENCES resume_templates(id) ON DELETE SET NULL,
  experience_level TEXT CHECK (experience_level IN (
    'intern', 'new_grad', 'bootcamp_grad', 'junior', 'mid', 'senior', 'staff_plus', 'tech_lead', 'eng_manager'
  )),
  target_role TEXT,
  is_master BOOLEAN DEFAULT false,
  parent_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  short_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resumes_user ON resumes(user_id);
CREATE INDEX idx_resumes_short_id ON resumes(short_id);

-- ============================================================
-- 3. RESUME CONTACT INFO
-- ============================================================
CREATE TABLE resume_contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT,
  city TEXT DEFAULT '',
  country TEXT DEFAULT '',
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  blog_url TEXT,
  UNIQUE(resume_id)
);

-- ============================================================
-- 4. RESUME SUMMARIES
-- ============================================================
CREATE TABLE resume_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  text TEXT DEFAULT '',
  is_visible BOOLEAN DEFAULT true,
  UNIQUE(resume_id)
);

-- ============================================================
-- 5. RESUME WORK EXPERIENCES
-- ============================================================
CREATE TABLE resume_work_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  location TEXT DEFAULT '',
  start_date DATE,
  end_date DATE,
  is_promotion BOOLEAN DEFAULT false,
  parent_experience_id UUID REFERENCES resume_work_experiences(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resume_work_exp_resume ON resume_work_experiences(resume_id);

-- ============================================================
-- 6. RESUME ACHIEVEMENTS (bullet points for work + projects)
-- ============================================================
CREATE TABLE resume_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('work', 'project')),
  text TEXT NOT NULL DEFAULT '',
  has_metric BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resume_achievements_parent ON resume_achievements(parent_id, parent_type);

-- ============================================================
-- 7. RESUME EDUCATION
-- ============================================================
CREATE TABLE resume_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  degree TEXT NOT NULL DEFAULT '',
  institution TEXT NOT NULL DEFAULT '',
  field_of_study TEXT,
  graduation_date DATE,
  gpa NUMERIC(3,2),
  relevant_coursework TEXT[],
  honors TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resume_education_resume ON resume_education(resume_id);

-- ============================================================
-- 8. RESUME SKILL CATEGORIES
-- ============================================================
CREATE TABLE resume_skill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_resume_skills_resume ON resume_skill_categories(resume_id);

-- ============================================================
-- 9. RESUME PROJECTS
-- ============================================================
CREATE TABLE resume_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  project_url TEXT,
  source_url TEXT,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resume_projects_resume ON resume_projects(resume_id);

-- ============================================================
-- 10. RESUME CERTIFICATIONS
-- ============================================================
CREATE TABLE resume_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  issuer TEXT DEFAULT '',
  date DATE,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_resume_certs_resume ON resume_certifications(resume_id);

-- ============================================================
-- 11. RESUME EXTRACURRICULARS
-- ============================================================
CREATE TABLE resume_extracurriculars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('patent', 'publication', 'talk', 'open_source', 'community', 'other')),
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  url TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_resume_extra_resume ON resume_extracurriculars(resume_id);

-- ============================================================
-- 12. RESUME SETTINGS
-- ============================================================
CREATE TABLE resume_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  accent_color TEXT DEFAULT '#000000',
  font_family TEXT DEFAULT 'inter' CHECK (font_family IN ('inter', 'source_sans', 'lato', 'georgia', 'garamond', 'source_code')),
  font_size_preset TEXT DEFAULT 'comfortable' CHECK (font_size_preset IN ('compact', 'comfortable', 'spacious')),
  date_format TEXT DEFAULT 'month_year' CHECK (date_format IN ('full', 'month_year', 'year_only')),
  section_order TEXT[] DEFAULT ARRAY['contact', 'summary', 'experience', 'skills', 'projects', 'education', 'certifications', 'extracurriculars'],
  hidden_sections TEXT[] DEFAULT '{}',
  page_limit INTEGER DEFAULT 2 CHECK (page_limit BETWEEN 1 AND 3),
  UNIQUE(resume_id)
);

-- ============================================================
-- 13. JOB APPLICATIONS (tracker)
-- ============================================================
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  url TEXT,
  status TEXT DEFAULT 'saved' CHECK (status IN (
    'saved', 'applied', 'phone_screen', 'technical', 'onsite', 'offer', 'accepted', 'rejected', 'withdrawn'
  )),
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  applied_date DATE,
  response_date DATE,
  notes TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  location TEXT,
  remote_type TEXT CHECK (remote_type IN ('remote', 'hybrid', 'onsite')),
  contact_name TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_job_apps_user ON job_applications(user_id);
CREATE INDEX idx_job_apps_status ON job_applications(status);

-- ============================================================
-- 14. JOB DESCRIPTIONS (saved for matching)
-- ============================================================
CREATE TABLE job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company TEXT,
  raw_text TEXT NOT NULL,
  extracted_skills TEXT[],
  extracted_requirements TEXT[],
  extracted_qualifications TEXT[],
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_job_desc_user ON job_descriptions(user_id);

-- ============================================================
-- 15. CAREER COACH SESSIONS
-- ============================================================
CREATE TABLE career_coach_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL DEFAULT 'General',
  session_type TEXT DEFAULT 'general' CHECK (session_type IN (
    'general', 'experience_builder', 'project_builder', 'interview_prep', 'career_narrative'
  )),
  messages JSONB DEFAULT '[]',
  generated_content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_coach_sessions_user ON career_coach_sessions(user_id);

-- ============================================================
-- 16. COVER LETTERS
-- ============================================================
CREATE TABLE cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  content TEXT DEFAULT '',
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'passionate', 'bold', 'conversational')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cover_letters_user ON cover_letters(user_id);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE TRIGGER set_updated_at BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON resume_work_experiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON career_coach_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON cover_letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- resume_templates: public read
ALTER TABLE resume_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read templates" ON resume_templates FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage templates" ON resume_templates FOR ALL USING (auth.role() = 'authenticated');

-- resumes
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own resumes" ON resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can manage resumes" ON resumes FOR ALL USING (auth.role() = 'authenticated');

-- resume_contact_info
ALTER TABLE resume_contact_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read contact info" ON resume_contact_info FOR SELECT USING (true);
CREATE POLICY "Authenticated manage contact info" ON resume_contact_info FOR ALL USING (auth.role() = 'authenticated');

-- resume_summaries
ALTER TABLE resume_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read summaries" ON resume_summaries FOR SELECT USING (true);
CREATE POLICY "Authenticated manage summaries" ON resume_summaries FOR ALL USING (auth.role() = 'authenticated');

-- resume_work_experiences
ALTER TABLE resume_work_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read work experiences" ON resume_work_experiences FOR SELECT USING (true);
CREATE POLICY "Authenticated manage work experiences" ON resume_work_experiences FOR ALL USING (auth.role() = 'authenticated');

-- resume_achievements
ALTER TABLE resume_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read achievements" ON resume_achievements FOR SELECT USING (true);
CREATE POLICY "Authenticated manage achievements" ON resume_achievements FOR ALL USING (auth.role() = 'authenticated');

-- resume_education
ALTER TABLE resume_education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read education" ON resume_education FOR SELECT USING (true);
CREATE POLICY "Authenticated manage education" ON resume_education FOR ALL USING (auth.role() = 'authenticated');

-- resume_skill_categories
ALTER TABLE resume_skill_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read skills" ON resume_skill_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated manage skills" ON resume_skill_categories FOR ALL USING (auth.role() = 'authenticated');

-- resume_projects
ALTER TABLE resume_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read projects" ON resume_projects FOR SELECT USING (true);
CREATE POLICY "Authenticated manage projects" ON resume_projects FOR ALL USING (auth.role() = 'authenticated');

-- resume_certifications
ALTER TABLE resume_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read certifications" ON resume_certifications FOR SELECT USING (true);
CREATE POLICY "Authenticated manage certifications" ON resume_certifications FOR ALL USING (auth.role() = 'authenticated');

-- resume_extracurriculars
ALTER TABLE resume_extracurriculars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read extracurriculars" ON resume_extracurriculars FOR SELECT USING (true);
CREATE POLICY "Authenticated manage extracurriculars" ON resume_extracurriculars FOR ALL USING (auth.role() = 'authenticated');

-- resume_settings
ALTER TABLE resume_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON resume_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated manage settings" ON resume_settings FOR ALL USING (auth.role() = 'authenticated');

-- job_applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own applications" ON job_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated manage applications" ON job_applications FOR ALL USING (auth.role() = 'authenticated');

-- job_descriptions
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own JDs" ON job_descriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated manage JDs" ON job_descriptions FOR ALL USING (auth.role() = 'authenticated');

-- career_coach_sessions
ALTER TABLE career_coach_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own sessions" ON career_coach_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated manage sessions" ON career_coach_sessions FOR ALL USING (auth.role() = 'authenticated');

-- cover_letters
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own letters" ON cover_letters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated manage letters" ON cover_letters FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- SEED: 6 Resume Templates
-- ============================================================
INSERT INTO resume_templates (id, name, description, category, layout, target_experience_levels, max_pages, tokens) VALUES
(
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Pragmatic',
  'Single-column, classic layout. Universal safe choice for all software developers.',
  'recommended',
  'single_column',
  ARRAY['intern', 'new_grad', 'junior', 'mid', 'senior', 'staff_plus', 'tech_lead', 'eng_manager'],
  2,
  '{"fontFamily":{"heading":"Inter","body":"Inter"},"fontSize":{"name":"28px","sectionHeader":"14px","jobTitle":"12px","body":"10.5px","date":"10px"},"spacing":{"sectionGap":"20px","entryGap":"10px","lineHeight":"1.5","pageMargin":"1in"},"colors":{"primary":"#111827","secondary":"#6b7280","accent":"#111827","background":"#ffffff","divider":"#d1d5db"},"layout":{"headerStyle":"left_aligned","sectionDivider":"line"}}'
),
(
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Mono',
  'Code-editor aesthetic with monospace font. Perfect for engineers signaling technical identity.',
  'recommended',
  'single_column',
  ARRAY['junior', 'mid', 'senior', 'staff_plus'],
  2,
  '{"fontFamily":{"heading":"Source Code Pro","body":"Source Code Pro"},"fontSize":{"name":"24px","sectionHeader":"13px","jobTitle":"11px","body":"10px","date":"9.5px"},"spacing":{"sectionGap":"16px","entryGap":"8px","lineHeight":"1.3","pageMargin":"0.75in"},"colors":{"primary":"#1a1a1a","secondary":"#666666","accent":"#1a1a1a","background":"#ffffff","divider":"#cccccc"},"layout":{"headerStyle":"left_aligned","sectionDivider":"line"}}'
),
(
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Smarkdown',
  'Rendered-Markdown feel with blue accent. Great for technical and documentation-heavy roles.',
  'recommended',
  'single_column',
  ARRAY['junior', 'mid', 'senior', 'staff_plus', 'tech_lead'],
  2,
  '{"fontFamily":{"heading":"Inter","body":"Inter"},"fontSize":{"name":"26px","sectionHeader":"14px","jobTitle":"12px","body":"10.5px","date":"10px"},"spacing":{"sectionGap":"18px","entryGap":"10px","lineHeight":"1.5","pageMargin":"0.85in"},"colors":{"primary":"#111827","secondary":"#6b7280","accent":"#2563eb","background":"#ffffff","divider":"#e5e7eb"},"layout":{"headerStyle":"left_aligned","sectionDivider":"border"}}'
),
(
  'a1b2c3d4-0004-4000-8000-000000000004',
  'CareerCup',
  'Dense, traditional single-column layout. Familiar to US recruiters, optimized for Big Tech applications.',
  'classic',
  'single_column',
  ARRAY['mid', 'senior', 'staff_plus', 'tech_lead', 'eng_manager'],
  2,
  '{"fontFamily":{"heading":"Inter","body":"Inter"},"fontSize":{"name":"24px","sectionHeader":"13px","jobTitle":"11.5px","body":"10px","date":"10px"},"spacing":{"sectionGap":"14px","entryGap":"8px","lineHeight":"1.35","pageMargin":"0.6in"},"colors":{"primary":"#000000","secondary":"#444444","accent":"#000000","background":"#ffffff","divider":"#000000"},"layout":{"headerStyle":"centered","sectionDivider":"line"}}'
),
(
  'a1b2c3d4-0005-4000-8000-000000000005',
  'Parker',
  'Two-column layout with dark sidebar. Modern feel for design-adjacent roles and startups.',
  'creative',
  'two_column',
  ARRAY['mid', 'senior', 'staff_plus'],
  2,
  '{"fontFamily":{"heading":"Inter","body":"Inter"},"fontSize":{"name":"24px","sectionHeader":"13px","jobTitle":"11px","body":"10px","date":"9.5px"},"spacing":{"sectionGap":"16px","entryGap":"8px","lineHeight":"1.4","pageMargin":"0in"},"colors":{"primary":"#111827","secondary":"#9ca3af","accent":"#ffffff","background":"#ffffff","divider":"#374151"},"layout":{"columnRatio":"30/70","headerStyle":"full_width","sectionDivider":"space"}}'
),
(
  'a1b2c3d4-0006-4000-8000-000000000006',
  'Experienced',
  'Two-column professional layout with vertical divider. Best for senior professionals with extensive experience.',
  'classic',
  'two_column',
  ARRAY['senior', 'staff_plus', 'tech_lead', 'eng_manager'],
  2,
  '{"fontFamily":{"heading":"Inter","body":"Inter"},"fontSize":{"name":"26px","sectionHeader":"13px","jobTitle":"11px","body":"10px","date":"9.5px"},"spacing":{"sectionGap":"16px","entryGap":"8px","lineHeight":"1.4","pageMargin":"0.5in"},"colors":{"primary":"#111827","secondary":"#6b7280","accent":"#111827","background":"#ffffff","divider":"#d1d5db"},"layout":{"columnRatio":"25/75","headerStyle":"full_width","sectionDivider":"space"}}'
);
