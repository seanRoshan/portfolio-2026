-- Add is_public flag for resume sharing visibility
ALTER TABLE resumes ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Allow anonymous users to read resumes that are explicitly made public
CREATE POLICY "Public read shared resumes"
  ON resumes FOR SELECT
  USING (is_public = true AND short_id IS NOT NULL);
