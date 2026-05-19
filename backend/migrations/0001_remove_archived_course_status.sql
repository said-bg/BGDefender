-- Normalize any legacy archived courses before removing the archived enum value.
UPDATE courses
SET status = 'draft'
WHERE status = 'archived';

-- Remove archived from the allowed status enum values.
ALTER TABLE courses
MODIFY COLUMN status ENUM('draft', 'published') NOT NULL DEFAULT 'draft';
