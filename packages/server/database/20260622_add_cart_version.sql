SET @cart_version_column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'cart_version'
);
SET @sql := IF(
  @cart_version_column_exists = 0,
  'ALTER TABLE users ADD COLUMN cart_version INT NOT NULL DEFAULT 0 AFTER last_order_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
