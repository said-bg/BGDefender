ALTER TABLE courses
ADD COLUMN slugEn VARCHAR(220) NULL AFTER id,
ADD COLUMN slugFi VARCHAR(220) NULL AFTER slugEn;

UPDATE courses
SET slugEn = CASE
  WHEN TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(titleEn), '[^a-z0-9]+', '-')) = ''
    THEN CONCAT('course-', LOWER(LEFT(REPLACE(id, '-', ''), 8)))
  ELSE TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(titleEn), '[^a-z0-9]+', '-'))
END
WHERE slugEn IS NULL OR slugEn = '';

UPDATE courses
SET slugFi = CASE
  WHEN TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(titleFi), '[^a-z0-9]+', '-')) = ''
    THEN CONCAT('course-', LOWER(LEFT(REPLACE(id, '-', ''), 8)))
  ELSE TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(titleFi), '[^a-z0-9]+', '-'))
END
WHERE slugFi IS NULL OR slugFi = '';

ALTER TABLE courses
MODIFY COLUMN slugEn VARCHAR(220) NOT NULL,
MODIFY COLUMN slugFi VARCHAR(220) NOT NULL;

ALTER TABLE courses
ADD UNIQUE INDEX idx_courses_slug_en_unique (slugEn),
ADD UNIQUE INDEX idx_courses_slug_fi_unique (slugFi);
