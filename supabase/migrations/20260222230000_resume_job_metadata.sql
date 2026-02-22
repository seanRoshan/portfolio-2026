-- Add structured job metadata to resumes
ALTER TABLE resumes ADD COLUMN company_name TEXT;
ALTER TABLE resumes ADD COLUMN job_location TEXT;
ALTER TABLE resumes ADD COLUMN work_mode TEXT CHECK (work_mode IN ('remote', 'hybrid', 'onsite'));
