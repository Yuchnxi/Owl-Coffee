CREATE TABLE IF NOT EXISTS banners (
  id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(128) NOT NULL,
  kicker VARCHAR(64) NULL,
  image_url VARCHAR(512) NOT NULL,
  link_type VARCHAR(32) NOT NULL DEFAULT 'none',
  link_url VARCHAR(255) NULL,
  sort INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  created_by VARCHAR(32) NULL,
  updated_by VARCHAR(32) NULL,
  KEY idx_banners_status_sort (status, sort),
  KEY idx_banners_deleted_at (deleted_at)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO menus (id, parent_id, name, path, icon, sort, status, meta, created_at, updated_at, deleted_at)
VALUES
  ('banner_management', 'marketing', '轮播图管理', '/marketing/banners', 'Picture', 20, 'enabled', JSON_OBJECT('title', '轮播图管理'), NOW(3), NOW(3), NULL)
ON DUPLICATE KEY UPDATE
  parent_id = VALUES(parent_id),
  name = VALUES(name),
  path = VALUES(path),
  icon = VALUES(icon),
  sort = VALUES(sort),
  status = VALUES(status),
  meta = VALUES(meta),
  updated_at = NOW(3),
  deleted_at = NULL;

INSERT INTO role_menus (role_id, menu_id, created_at)
VALUES
  ('role_admin', 'banner_management', NOW(3))
ON DUPLICATE KEY UPDATE
  created_at = created_at;
