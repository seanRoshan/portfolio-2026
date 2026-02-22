-- Add global profile fields to site_settings
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  -- Landing page visibility toggles
  ADD COLUMN IF NOT EXISTS landing_show_email BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS landing_show_phone BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS landing_show_location BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS landing_show_linkedin BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS landing_show_github BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS landing_show_portfolio BOOLEAN NOT NULL DEFAULT true;
