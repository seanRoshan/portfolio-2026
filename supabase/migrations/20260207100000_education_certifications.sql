-- ============================================================
-- Standalone education & certifications tables + project linking
-- ============================================================

-- ── Education table ──────────────────────────────────────────
CREATE TABLE education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school TEXT NOT NULL,
  degree TEXT NOT NULL,
  field TEXT,
  year TEXT,
  details TEXT,
  logo_url TEXT,
  sort_order INT DEFAULT 0,
  published BOOLEAN DEFAULT true,
  show_on_resume BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published education"
  ON education FOR SELECT USING (published = true);

CREATE POLICY "Authenticated users have full access to education"
  ON education FOR ALL USING (auth.role() = 'authenticated');

-- ── Certifications table ─────────────────────────────────────
CREATE TABLE certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  year TEXT,
  url TEXT,
  badge_url TEXT,
  sort_order INT DEFAULT 0,
  published BOOLEAN DEFAULT true,
  show_on_resume BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published certifications"
  ON certifications FOR SELECT USING (published = true);

CREATE POLICY "Authenticated users have full access to certifications"
  ON certifications FOR ALL USING (auth.role() = 'authenticated');

-- ── Junction: projects ↔ education ───────────────────────────
CREATE TABLE project_education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  education_id UUID NOT NULL REFERENCES education(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, education_id)
);

CREATE INDEX idx_project_education_project ON project_education(project_id);
CREATE INDEX idx_project_education_education ON project_education(education_id);

ALTER TABLE project_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read project_education"
  ON project_education FOR SELECT USING (true);

CREATE POLICY "Authenticated users have full access to project_education"
  ON project_education FOR ALL USING (auth.role() = 'authenticated');

-- ── Junction: projects ↔ certifications ──────────────────────
CREATE TABLE project_certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  certification_id UUID NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, certification_id)
);

CREATE INDEX idx_project_certifications_project ON project_certifications(project_id);
CREATE INDEX idx_project_certifications_certification ON project_certifications(certification_id);

ALTER TABLE project_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read project_certifications"
  ON project_certifications FOR SELECT USING (true);

CREATE POLICY "Authenticated users have full access to project_certifications"
  ON project_certifications FOR ALL USING (auth.role() = 'authenticated');

-- ── Migrate existing JSONB data ──────────────────────────────
INSERT INTO education (school, degree, field, year, details, sort_order)
SELECT
  e->>'school',
  e->>'degree',
  NULLIF(e->>'field', ''),
  NULLIF(e->>'year', ''),
  NULLIF(e->>'details', ''),
  (ordinality - 1)::int
FROM resume, jsonb_array_elements(education) WITH ORDINALITY AS t(e, ordinality)
WHERE jsonb_array_length(education) > 0;

INSERT INTO certifications (name, issuer, year, url, sort_order)
SELECT
  c->>'name',
  c->>'issuer',
  NULLIF(c->>'year', ''),
  NULLIF(c->>'url', ''),
  (ordinality - 1)::int
FROM resume, jsonb_array_elements(certifications) WITH ORDINALITY AS t(c, ordinality)
WHERE jsonb_array_length(certifications) > 0;
