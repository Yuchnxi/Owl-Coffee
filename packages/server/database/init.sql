CREATE DATABASE IF NOT EXISTS owl_coffee
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE owl_coffee;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  code VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  created_by VARCHAR(32) NULL,
  updated_by VARCHAR(32) NULL,
  UNIQUE KEY uk_roles_code (code),
  KEY idx_roles_status (status)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(32) PRIMARY KEY,
  account VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(64) NOT NULL,
  phone VARCHAR(32) NULL,
  avatar_url VARCHAR(512) NULL,
  role_id VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  created_by VARCHAR(32) NULL,
  updated_by VARCHAR(32) NULL,
  UNIQUE KEY uk_admin_users_account (account),
  KEY idx_admin_users_role_id (role_id),
  KEY idx_admin_users_status (status)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS menus (
  id VARCHAR(32) PRIMARY KEY,
  parent_id VARCHAR(32) NULL,
  name VARCHAR(64) NOT NULL,
  path VARCHAR(255) NOT NULL,
  icon VARCHAR(64) NULL,
  sort INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL,
  meta JSON NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  KEY idx_menus_parent_id (parent_id),
  KEY idx_menus_status_sort (status, sort)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS role_menus (
  role_id VARCHAR(32) NOT NULL,
  menu_id VARCHAR(32) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (role_id, menu_id),
  KEY idx_role_menus_role_id (role_id),
  KEY idx_role_menus_menu_id (menu_id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id VARCHAR(32) PRIMARY KEY,
  subject_id VARCHAR(32) NOT NULL,
  subject_type VARCHAR(32) NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  KEY idx_auth_refresh_tokens_subject (subject_id, subject_type),
  KEY idx_auth_refresh_tokens_expires_at (expires_at)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(32) PRIMARY KEY,
  openid VARCHAR(128) NOT NULL,
  unionid VARCHAR(128) NULL,
  nickname VARCHAR(64) NULL,
  avatar_url VARCHAR(512) NULL,
  phone VARCHAR(32) NULL,
  phone_bound TINYINT(1) NOT NULL DEFAULT 0,
  user_status VARCHAR(32) NOT NULL,
  order_count INT NOT NULL DEFAULT 0,
  total_consume_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  last_order_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  created_by VARCHAR(32) NULL,
  updated_by VARCHAR(32) NULL,
  UNIQUE KEY uk_users_openid (openid),
  KEY idx_users_phone (phone),
  KEY idx_users_status (user_status)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  created_by VARCHAR(32) NULL,
  updated_by VARCHAR(32) NULL,
  KEY idx_categories_status_sort (status, sort)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(32) PRIMARY KEY,
  category_id VARCHAR(32) NOT NULL,
  name VARCHAR(128) NOT NULL,
  image_url VARCHAR(512) NULL,
  description TEXT NULL,
  product_status VARCHAR(32) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  is_recommended TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  created_by VARCHAR(32) NULL,
  updated_by VARCHAR(32) NULL,
  KEY idx_products_category_id (category_id),
  KEY idx_products_status_sort (product_status, sort),
  KEY idx_products_recommended (is_recommended)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS product_skus (
  id VARCHAR(32) PRIMARY KEY,
  product_id VARCHAR(32) NOT NULL,
  sku_code VARCHAR(64) NOT NULL,
  temperature VARCHAR(32) NOT NULL,
  cup_size VARCHAR(32) NOT NULL,
  sugar_level VARCHAR(32) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  warning_stock INT NOT NULL DEFAULT 0,
  sku_status VARCHAR(32) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  created_by VARCHAR(32) NULL,
  updated_by VARCHAR(32) NULL,
  UNIQUE KEY uk_product_skus_code (sku_code),
  KEY idx_product_skus_product_id (product_id),
  KEY idx_product_skus_status_stock (sku_status, stock)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS inventory_logs (
  id VARCHAR(32) PRIMARY KEY,
  sku_id VARCHAR(32) NOT NULL,
  change_type VARCHAR(32) NOT NULL,
  change_quantity INT NOT NULL,
  before_stock INT NOT NULL,
  after_stock INT NOT NULL,
  related_order_id VARCHAR(32) NULL,
  reason VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL,
  created_by VARCHAR(32) NULL,
  KEY idx_inventory_logs_sku_time (sku_id, created_at),
  KEY idx_inventory_logs_related_order_id (related_order_id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id VARCHAR(32) PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  sku_id VARCHAR(32) NOT NULL,
  quantity INT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_cart_items_user_sku (user_id, sku_id),
  KEY idx_cart_items_user_id (user_id),
  KEY idx_cart_items_sku_id (sku_id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(32) PRIMARY KEY,
  order_no VARCHAR(32) NOT NULL,
  user_id VARCHAR(32) NULL,
  user_name VARCHAR(64) NULL,
  phone VARCHAR(32) NULL,
  order_source VARCHAR(32) NOT NULL,
  order_status VARCHAR(32) NOT NULL,
  payment_status VARCHAR(32) NOT NULL,
  payment_method VARCHAR(32) NOT NULL DEFAULT 'mock',
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pay_amount DECIMAL(10,2) NOT NULL,
  user_coupon_id VARCHAR(32) NULL,
  pickup_code VARCHAR(32) NULL,
  remark VARCHAR(500) NULL,
  paid_at DATETIME(3) NULL,
  making_at DATETIME(3) NULL,
  ready_at DATETIME(3) NULL,
  completed_at DATETIME(3) NULL,
  cancelled_at DATETIME(3) NULL,
  refunded_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  created_by VARCHAR(32) NULL,
  updated_by VARCHAR(32) NULL,
  UNIQUE KEY uk_orders_order_no (order_no),
  KEY idx_orders_user_id (user_id),
  KEY idx_orders_status_time (order_status, created_at),
  KEY idx_orders_payment_status (payment_status),
  KEY idx_orders_pickup_code (pickup_code)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(32) PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL,
  product_id VARCHAR(32) NOT NULL,
  sku_id VARCHAR(32) NOT NULL,
  product_name VARCHAR(128) NOT NULL,
  image_url VARCHAR(512) NULL,
  temperature VARCHAR(32) NOT NULL,
  cup_size VARCHAR(32) NOT NULL,
  sugar_level VARCHAR(32) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal_amount DECIMAL(10,2) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  KEY idx_order_items_order_id (order_id),
  KEY idx_order_items_sku_id (sku_id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS payment_records (
  id VARCHAR(32) PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL,
  payment_no VARCHAR(64) NOT NULL,
  payment_method VARCHAR(32) NOT NULL,
  payment_status VARCHAR(32) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  raw_response JSON NULL,
  paid_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_payment_records_payment_no (payment_no),
  KEY idx_payment_records_order_id (order_id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  coupon_type VARCHAR(32) NOT NULL,
  threshold_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) NULL,
  discount_rate DECIMAL(5,2) NULL,
  total_quantity INT NOT NULL,
  used_quantity INT NOT NULL DEFAULT 0,
  limit_per_user INT NOT NULL DEFAULT 1,
  valid_start_at DATETIME(3) NOT NULL,
  valid_end_at DATETIME(3) NOT NULL,
  coupon_status VARCHAR(32) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  created_by VARCHAR(32) NULL,
  updated_by VARCHAR(32) NULL,
  KEY idx_coupons_status_time (coupon_status, valid_start_at, valid_end_at)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_coupons (
  id VARCHAR(32) PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  coupon_id VARCHAR(32) NOT NULL,
  coupon_status VARCHAR(32) NOT NULL,
  received_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  order_id VARCHAR(32) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  KEY idx_user_coupons_user_status (user_id, coupon_status),
  KEY idx_user_coupons_coupon_id (coupon_id),
  KEY idx_user_coupons_order_id (order_id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS store_settings (
  id VARCHAR(32) PRIMARY KEY,
  store_name VARCHAR(128) NOT NULL,
  address VARCHAR(255) NOT NULL,
  business_hours VARCHAR(128) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  pickup_notice VARCHAR(500) NULL,
  map_info JSON NULL,
  miniapp_qrcode_url VARCHAR(512) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  updated_by VARCHAR(32) NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS files (
  id VARCHAR(32) PRIMARY KEY,
  biz_type VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(512) NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  storage_provider VARCHAR(64) NULL,
  object_key VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL,
  created_by VARCHAR(32) NULL,
  KEY idx_files_biz_type (biz_type)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS admin_login_logs (
  id VARCHAR(32) PRIMARY KEY,
  admin_user_id VARCHAR(32) NULL,
  account VARCHAR(64) NOT NULL,
  login_result VARCHAR(32) NOT NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(512) NULL,
  message VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL,
  KEY idx_admin_login_logs_admin_user_id (admin_user_id),
  KEY idx_admin_login_logs_account_time (account, created_at)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS admin_operation_logs (
  id VARCHAR(32) PRIMARY KEY,
  admin_user_id VARCHAR(32) NULL,
  module VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  target_id VARCHAR(32) NULL,
  summary VARCHAR(255) NULL,
  ip VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  KEY idx_admin_operation_logs_admin_user_id (admin_user_id),
  KEY idx_admin_operation_logs_module_time (module, created_at),
  KEY idx_admin_operation_logs_target_id (target_id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO roles (id, name, code, description, status, created_at, updated_at, deleted_at, created_by, updated_by)
VALUES
  ('role_admin', '管理员', 'admin', '后台管理员', 'enabled', NOW(3), NOW(3), NULL, NULL, NULL),
  ('role_staff', '店员', 'staff', '门店店员', 'enabled', NOW(3), NOW(3), NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  status = VALUES(status),
  updated_at = NOW(3);

INSERT INTO menus (id, parent_id, name, path, icon, sort, status, meta, created_at, updated_at, deleted_at)
VALUES
  ('dashboard', NULL, '仪表盘', '/dashboard', 'dashboard', 10, 'enabled', JSON_OBJECT('title', '仪表盘'), NOW(3), NOW(3), NULL),
  ('products', NULL, '商品管理', '/products', 'products', 20, 'enabled', JSON_OBJECT('title', '商品管理'), NOW(3), NOW(3), NULL),
  ('orders', NULL, '订单管理', '/orders', 'orders', 30, 'enabled', JSON_OBJECT('title', '订单管理'), NOW(3), NOW(3), NULL),
  ('users', NULL, '用户管理', '/users', 'users', 40, 'enabled', JSON_OBJECT('title', '用户管理'), NOW(3), NOW(3), NULL),
  ('inventory', NULL, '库存管理', '/inventory', 'inventory', 50, 'enabled', JSON_OBJECT('title', '库存管理'), NOW(3), NOW(3), NULL),
  ('marketing', NULL, '营销管理', '/marketing', 'marketing', 60, 'enabled', JSON_OBJECT('title', '营销管理'), NOW(3), NOW(3), NULL),
  ('permissions', NULL, '权限管理', '/permissions', 'permissions', 70, 'enabled', JSON_OBJECT('title', '权限管理'), NOW(3), NOW(3), NULL),
  ('settings', NULL, '系统设置', '/settings', 'settings', 80, 'enabled', JSON_OBJECT('title', '系统设置'), NOW(3), NOW(3), NULL)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  path = VALUES(path),
  icon = VALUES(icon),
  sort = VALUES(sort),
  status = VALUES(status),
  meta = VALUES(meta),
  updated_at = NOW(3);

INSERT INTO role_menus (role_id, menu_id, created_at)
VALUES
  ('role_admin', 'dashboard', NOW(3)),
  ('role_admin', 'products', NOW(3)),
  ('role_admin', 'orders', NOW(3)),
  ('role_admin', 'users', NOW(3)),
  ('role_admin', 'inventory', NOW(3)),
  ('role_admin', 'marketing', NOW(3)),
  ('role_admin', 'permissions', NOW(3)),
  ('role_admin', 'settings', NOW(3)),
  ('role_staff', 'dashboard', NOW(3)),
  ('role_staff', 'products', NOW(3)),
  ('role_staff', 'orders', NOW(3)),
  ('role_staff', 'inventory', NOW(3))
ON DUPLICATE KEY UPDATE
  created_at = created_at;

INSERT INTO admin_users (id, account, password_hash, name, phone, avatar_url, role_id, status, last_login_at, created_at, updated_at, deleted_at, created_by, updated_by)
VALUES
  ('admin_default', 'admin', '待部署初始化', '管理员', NULL, NULL, 'role_admin', 'disabled', NULL, NOW(3), NOW(3), NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role_id = VALUES(role_id),
  updated_at = NOW(3);

INSERT INTO store_settings (id, store_name, address, business_hours, phone, pickup_notice, map_info, miniapp_qrcode_url, created_at, updated_at, updated_by)
VALUES
  ('store_default', '待补充', '待补充', '待补充', '待补充', '待补充', JSON_OBJECT('status', '待补充'), NULL, NOW(3), NOW(3), NULL)
ON DUPLICATE KEY UPDATE
  store_name = VALUES(store_name),
  address = VALUES(address),
  business_hours = VALUES(business_hours),
  phone = VALUES(phone),
  pickup_notice = VALUES(pickup_notice),
  map_info = VALUES(map_info),
  updated_at = NOW(3);

ALTER TABLE admin_users COMMENT = '后台管理员和店员账号表';
ALTER TABLE roles COMMENT = '后台角色表';
ALTER TABLE menus COMMENT = '后台菜单表';
ALTER TABLE role_menus COMMENT = '角色菜单权限关系表';
ALTER TABLE auth_refresh_tokens COMMENT = '后台和小程序刷新令牌表';
ALTER TABLE users COMMENT = '小程序用户表';
ALTER TABLE cart_items COMMENT = '小程序购物车明细表';
ALTER TABLE categories COMMENT = '商品分类表';
ALTER TABLE products COMMENT = '商品主表';
ALTER TABLE product_skus COMMENT = '商品 SKU 与库存表';
ALTER TABLE inventory_logs COMMENT = '库存变更流水表';
ALTER TABLE orders COMMENT = '订单主表';
ALTER TABLE order_items COMMENT = '订单商品明细快照表';
ALTER TABLE payment_records COMMENT = '支付记录表';
ALTER TABLE coupons COMMENT = '优惠券模板表';
ALTER TABLE user_coupons COMMENT = '用户优惠券表';
ALTER TABLE store_settings COMMENT = '单店基础配置表';
ALTER TABLE files COMMENT = '上传文件记录表';
ALTER TABLE admin_login_logs COMMENT = '后台登录日志表';
ALTER TABLE admin_operation_logs COMMENT = '后台操作日志表';
