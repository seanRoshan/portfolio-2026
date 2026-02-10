-- ============================================================
-- Enhanced Projects — Junction Tables & New Columns
-- ============================================================

-- 1. JUNCTION TABLES
-- ============================================================

-- Link projects to experience entries (like LinkedIn)
CREATE TABLE project_experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experience(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, experience_id)
);

-- Link projects to skills (normalized tech stack)
CREATE TABLE project_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, skill_id)
);

-- Indexes for join performance
CREATE INDEX idx_project_experiences_project ON project_experiences(project_id);
CREATE INDEX idx_project_experiences_experience ON project_experiences(experience_id);
CREATE INDEX idx_project_skills_project ON project_skills(project_id);
CREATE INDEX idx_project_skills_skill ON project_skills(skill_id);


-- 2. NEW COLUMNS ON PROJECTS
-- ============================================================

ALTER TABLE projects ADD COLUMN architecture_url TEXT;
ALTER TABLE projects ADD COLUMN project_role TEXT;
ALTER TABLE projects ADD COLUMN status TEXT CHECK (status IN ('completed', 'in_progress', 'open_source')) DEFAULT 'completed';
ALTER TABLE projects ADD COLUMN highlights JSONB DEFAULT '[]';
ALTER TABLE projects ADD COLUMN image_captions JSONB DEFAULT '{}';


-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE project_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read project_experiences" ON project_experiences FOR SELECT USING (true);
CREATE POLICY "Public read project_skills" ON project_skills FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admin full access project_experiences" ON project_experiences FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access project_skills" ON project_skills FOR ALL USING (auth.role() = 'authenticated');
