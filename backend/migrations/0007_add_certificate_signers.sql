CREATE TABLE certificate_signers (
  id VARCHAR(36) NOT NULL,
  fullName VARCHAR(160) NOT NULL,
  role ENUM('director', 'program_director') NOT NULL,
  title VARCHAR(120) NOT NULL,
  signatureData LONGTEXT NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_certificate_signers_role (role),
  INDEX idx_certificate_signers_role_active (role, isActive)
);

ALTER TABLE courses
  ADD COLUMN programDirectorId VARCHAR(36) NULL AFTER coverImage,
  ADD INDEX idx_courses_program_director (programDirectorId),
  ADD CONSTRAINT fk_courses_program_director
    FOREIGN KEY (programDirectorId) REFERENCES certificate_signers(id)
    ON DELETE SET NULL;
