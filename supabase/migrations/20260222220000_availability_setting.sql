-- Add availability status text and visibility toggle
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS availability_text TEXT DEFAULT 'Open to opportunities',
  ADD COLUMN IF NOT EXISTS landing_show_availability BOOLEAN NOT NULL DEFAULT false;
