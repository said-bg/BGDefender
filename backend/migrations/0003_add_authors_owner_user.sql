ALTER TABLE authors
ADD COLUMN ownerUserId INT NULL AFTER photo,
ADD INDEX idx_authors_owner_user (ownerUserId);

