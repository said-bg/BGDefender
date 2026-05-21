ALTER TABLE courses
ADD COLUMN createdByUserId INT NULL AFTER ownerUserId,
ADD COLUMN lastEditedByUserId INT NULL AFTER createdByUserId,
ADD COLUMN publishedByUserId INT NULL AFTER lastEditedByUserId,
ADD COLUMN publishedAt DATETIME NULL AFTER publishedByUserId,
ADD INDEX idx_courses_created_by_user (createdByUserId),
ADD INDEX idx_courses_last_edited_by_user (lastEditedByUserId),
ADD INDEX idx_courses_published_by_user (publishedByUserId),
ADD INDEX idx_courses_published_at (publishedAt);

UPDATE courses
SET
  createdByUserId = COALESCE(createdByUserId, ownerUserId),
  lastEditedByUserId = COALESCE(lastEditedByUserId, ownerUserId),
  publishedByUserId = CASE
    WHEN status = 'published' THEN COALESCE(publishedByUserId, ownerUserId)
    ELSE publishedByUserId
  END,
  publishedAt = CASE
    WHEN status = 'published' THEN COALESCE(publishedAt, updatedAt)
    ELSE publishedAt
  END;
