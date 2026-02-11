-- Add employment_type to experience table
-- Values: 'direct' (W2/direct employee), 'contract' (via another company)
-- When contract, via_company stores the contracting company name (e.g. "LucidCo Inc.")
-- via_company_logo_url stores the logo of the contracting company
ALTER TABLE experience
ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS via_company TEXT,
ADD COLUMN IF NOT EXISTS via_company_logo_url TEXT;
