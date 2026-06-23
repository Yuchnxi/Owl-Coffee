SET @user_gender_column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'gender'
);
SET @sql := IF(
  @user_gender_column_exists = 0,
  "ALTER TABLE users ADD COLUMN gender VARCHAR(16) NOT NULL DEFAULT 'secret' AFTER avatar_url",
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @user_gender_index_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'idx_users_gender'
);
SET @sql := IF(
  @user_gender_index_exists = 0,
  'ALTER TABLE users ADD KEY idx_users_gender (gender)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
