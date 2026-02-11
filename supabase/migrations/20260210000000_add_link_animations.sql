-- Add configurable link hover animations for header and footer
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS link_animations JSONB DEFAULT '{"header": "underline-slide", "footer": "underline-slide"}';
