-- Add new customization columns to resume_settings
ALTER TABLE resume_settings
  ADD COLUMN IF NOT EXISTS page_margin text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS name_font_size integer,
  ADD COLUMN IF NOT EXISTS section_title_uppercase boolean,
  ADD COLUMN IF NOT EXISTS right_panel_color text;
