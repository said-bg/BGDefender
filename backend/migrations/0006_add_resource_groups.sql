CREATE TABLE resource_groups (
  id VARCHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  createdByUserId INT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_resource_groups_created_by_user (createdByUserId),
  CONSTRAINT fk_resource_groups_created_by_user
    FOREIGN KEY (createdByUserId) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE TABLE resource_group_members (
  id VARCHAR(36) NOT NULL,
  groupId VARCHAR(36) NOT NULL,
  userId INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_resource_group_member_group_user (groupId, userId),
  INDEX idx_resource_group_members_group (groupId),
  INDEX idx_resource_group_members_user (userId),
  CONSTRAINT fk_resource_group_members_group
    FOREIGN KEY (groupId) REFERENCES resource_groups(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_resource_group_members_user
    FOREIGN KEY (userId) REFERENCES users(id)
    ON DELETE CASCADE
);

ALTER TABLE resources
  MODIFY COLUMN assignedUserId INT NULL,
  ADD COLUMN assignedGroupId VARCHAR(36) NULL AFTER assignedUserId,
  ADD INDEX idx_resources_assigned_group (assignedGroupId),
  ADD CONSTRAINT fk_resources_assigned_group
    FOREIGN KEY (assignedGroupId) REFERENCES resource_groups(id)
    ON DELETE RESTRICT;
