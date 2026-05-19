-- Allow creators to manage only the courses they own.
ALTER TABLE courses
ADD COLUMN ownerUserId INT NULL AFTER coverImage,
ADD INDEX idx_courses_owner_user (ownerUserId);
