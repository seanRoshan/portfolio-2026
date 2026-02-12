-- Allow selecting which achievement bullets appear on the resume.
-- NULL = show all achievements (backward-compatible default).
-- Empty array = show none. Populated array = show only those.
ALTER TABLE experience ADD COLUMN resume_achievements TEXT[] DEFAULT NULL;
