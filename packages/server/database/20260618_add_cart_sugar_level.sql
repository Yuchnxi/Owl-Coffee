SET @cart_sugar_column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'cart_items'
    AND COLUMN_NAME = 'sugar_level'
);
SET @sql := IF(
  @cart_sugar_column_exists = 0,
  "ALTER TABLE cart_items ADD COLUMN sugar_level VARCHAR(32) NOT NULL DEFAULT '不另外加糖' AFTER sku_id",
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @old_cart_unique_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'cart_items'
    AND INDEX_NAME = 'uk_cart_items_user_sku'
);
SET @sql := IF(
  @old_cart_unique_exists > 0,
  'ALTER TABLE cart_items DROP INDEX uk_cart_items_user_sku',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @new_cart_unique_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'cart_items'
    AND INDEX_NAME = 'uk_cart_items_user_sku_sugar'
);
SET @sql := IF(
  @new_cart_unique_exists = 0,
  'ALTER TABLE cart_items ADD UNIQUE KEY uk_cart_items_user_sku_sugar (user_id, sku_id, sugar_level)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sku_sugar_column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'product_skus'
    AND COLUMN_NAME = 'sugar_level'
);
SET @sql := IF(
  @sku_sugar_column_exists > 0,
  "ALTER TABLE product_skus MODIFY COLUMN sugar_level VARCHAR(32) NOT NULL DEFAULT 'standard'",
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
