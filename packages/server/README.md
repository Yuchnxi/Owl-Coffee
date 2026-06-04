# Owl Coffee 服务端

服务端使用 Node.js + Egg.js，接口统一返回 `{ code, message, data }`。

## 本地启动

```bash
pnpm install
pnpm server:dev
```

健康检查：

```txt
GET /api/health
GET /api/health/database
```

后台鉴权：

```txt
GET /api/admin/auth/captcha
POST /api/admin/auth/login
POST /api/admin/auth/refresh
POST /api/admin/auth/logout
GET /api/admin/auth/me
```

商品分类：

```txt
GET /api/admin/categories
POST /api/admin/categories
PUT /api/admin/categories/{categoryId}
DELETE /api/admin/categories/{categoryId}
GET /api/app/categories
GET /api/public/categories
```

商品与 SKU：

```txt
GET /api/admin/products
POST /api/admin/products
GET /api/admin/products/{productId}
PUT /api/admin/products/{productId}
PUT /api/admin/products/{productId}/status
DELETE /api/admin/products/{productId}
GET /api/app/products
GET /api/app/products/{productId}
GET /api/app/skus/{skuId}/availability
GET /api/public/products
GET /api/public/products/recommended
```

小程序鉴权：

```txt
POST /api/app/auth/login
POST /api/app/auth/phone
GET /api/app/auth/me
```

小程序订单与模拟支付：

```txt
POST /api/app/orders
GET /api/app/orders
GET /api/app/orders/{orderId}
PUT /api/app/orders/{orderId}/cancel
PUT /api/app/orders/{orderId}/confirm-pickup
POST /api/app/payments/mock
```

小程序购物车：

```txt
GET /api/app/cart
POST /api/app/cart/sync
POST /api/app/cart/items
PUT /api/app/cart/items/{cartItemId}
DELETE /api/app/cart/items/{cartItemId}
DELETE /api/app/cart
```

库存管理：

```txt
GET /api/admin/inventory/skus
POST /api/admin/inventory/adjustments
GET /api/admin/inventory/adjustments
```

订单管理：

```txt
GET /api/admin/orders
POST /api/admin/orders
GET /api/admin/orders/{orderId}
PUT /api/admin/orders/{orderId}/status
PUT /api/admin/orders/{orderId}/cancel
PUT /api/admin/orders/{orderId}/refund
DELETE /api/admin/orders/{orderId}
```

## 环境变量

复制 `.env.example` 为 `.env` 后填写本地配置。真实数据库密码、JWT Secret、小程序密钥等敏感信息不要提交。

当前初始化阶段只保留 MySQL 配置占位，后续数据库初始化时再接入连接插件和迁移脚本。

## 数据库初始化

确认已创建本地 MySQL 数据库 `owl_coffee` 后执行：

```bash
mysql --default-character-set=utf8mb4 -u root -p -e "SOURCE E:/Owl-Coffee/packages/server/database/init.sql"
```

如果在项目根目录执行，也可以直接使用脚本里的 `CREATE DATABASE IF NOT EXISTS` 和 `USE owl_coffee`，重复执行不会清空已有业务数据。

Windows PowerShell 不建议使用 `< packages/server/database/init.sql` 这种输入重定向，可能导致中文种子数据转码异常。

初始化后默认后台开发账号：

```txt
账号：admin
密码：admin123
```
