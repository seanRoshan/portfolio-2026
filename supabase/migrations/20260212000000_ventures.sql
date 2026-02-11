-- ============================================================
-- Ventures table — businesses & apps founded/co-founded
-- ============================================================

CREATE TABLE ventures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  url TEXT,
  icon_url TEXT,
  description TEXT,
  sort_order INT DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ventures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published ventures"
  ON ventures FOR SELECT USING (published = true);

CREATE POLICY "Authenticated users have full access to ventures"
  ON ventures FOR ALL USING (auth.role() = 'authenticated');
