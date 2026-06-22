# Owl Coffee 接口文档

> 文档类型：三端统一 API 规范  
> 适用项目：Owl Coffee 后台系统 / 小程序 / 官网  
> 当前版本：v1 MVP  
> 服务端技术：Node.js + Egg.js  
> 接口风格：RESTful  
> 关联文档：`docs/project-overview.md`、`docs/admin-prd.md`、`docs/miniapp-prd.md`、`docs/website-prd.md`  

---

## 1. 文档说明

本文档用于定义 Owl Coffee 首版接口规范，覆盖后台 9 个模块、小程序点单闭环和官网展示接口。

首版接口以后台优先，但必须支持以下完整演示闭环：

```txt
后台维护商品和 SKU
→ 小程序 / 官网展示上架商品
→ 小程序加入购物车并提交订单
→ 模拟支付成功后扣减库存并生成取餐码
→ 后台处理订单状态
→ 小程序查看订单状态
```

本文档中的真实商品、门店、小程序二维码、对象存储配置、微信支付配置等资料未确定时统一标记为“待补充”。

---

## 2. 通用约定

### 2.1 接口前缀

| 端 | 前缀 | 说明 |
|---|---|---|
| 后台 | `/api/admin` | 需要后台 JWT 鉴权，登录和验证码除外 |
| 小程序 | `/api/app` | 需要小程序 JWT 鉴权，公开商品接口和登录除外 |
| 官网 | `/api/public` | 公开展示接口，不需要登录 |

### 2.2 字段命名

接口字段统一使用 `camelCase`。

示例：

```json
{
  "orderStatus": "pendingPayment",
  "createdAt": "2026-06-03T10:00:00.000Z"
}
```

### 2.3 时间格式

时间字段统一使用 ISO 8601 字符串。

```txt
2026-06-03T10:00:00.000Z
```

### 2.4 软删除

删除类接口默认使用软删除。

| 字段 | 说明 |
|---|---|
| `deletedAt` | 未删除为 `null`，删除后为删除时间 |

---

## 3. 鉴权与 Token

后台和小程序均使用 JWT Bearer Token。

请求头：

```txt
Authorization: Bearer <accessToken>
```

Token 规则：

| Token | 有效期 | 说明 |
|---|---:|---|
| `accessToken` | 2 小时 | 用于访问业务接口 |
| `refreshToken` | 7 天 | 用于刷新 accessToken |

### 3.1 后台刷新 Token

```txt
POST /api/admin/auth/refresh
```

请求体：

```json
{
  "refreshToken": "待补充"
}
```

响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "accessToken": "待补充",
    "refreshToken": "待补充",
    "expiresIn": 7200
  }
}
```

### 3.2 小程序刷新 Token

```txt
POST /api/app/auth/refresh
```

请求体和响应同后台刷新 Token。

---

## 4. 统一响应结构

接口统一响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `code` | number | 业务错误码，`0` 表示成功 |
| `message` | string | 响应说明 |
| `data` | any | 响应数据 |

错误响应示例：

```json
{
  "code": 50001,
  "message": "库存不足",
  "data": {
    "skuId": "sku_xxx",
    "availableStock": 2
  }
}
```

---

## 5. 分页、排序与筛选

### 5.1 分页请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---:|---|---|
| `page` | number | 否 | 1 | 当前页 |
| `pageSize` | number | 否 | 10 | 每页数量 |

### 5.2 分页响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### 5.3 排序参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `sortBy` | string | 排序字段 |
| `sortOrder` | string | `asc` / `desc` |

---

## 6. ID 与编号规则

资源 ID 使用带业务前缀的 `nanoid` 字符串。

| 资源 | ID 示例 |
|---|---|
| 商品 | `prod_xxx` |
| 分类 | `cat_xxx` |
| SKU | `sku_xxx` |
| 订单 | `order_xxx` |
| 用户 | `user_xxx` |
| 优惠券 | `coupon_xxx` |
| 角色 | `role_xxx` |
| 文件 | `file_xxx` |

订单额外提供展示编号：

| 字段 | 示例 | 说明 |
|---|---|---|
| `orderNo` | `OC202606030001` | 用于后台、小程序展示和查询 |

---

## 7. 错误码

### 7.1 通用错误码

| code | 说明 |
|---:|---|
| 0 | 成功 |
| 10000 | 通用失败 |
| 10001 | 参数错误 |
| 10002 | 数据不存在 |
| 10003 | 数据已存在 |

### 7.2 鉴权错误码

| code | 说明 |
|---:|---|
| 20001 | 未登录 |
| 20002 | Token 已过期 |
| 20003 | Refresh Token 无效 |
| 20004 | 无权限 |
| 20005 | 验证码错误 |

### 7.3 业务错误码

| code | 说明 |
|---:|---|
| 30001 | 商品已下架 |
| 30002 | SKU 不可售 |
| 30003 | 优惠券不可用 |
| 30004 | 用户已禁用 |

### 7.4 库存错误码

| code | 说明 |
|---:|---|
| 50001 | 库存不足 |
| 50002 | 库存调整失败 |

### 7.5 订单错误码

| code | 说明 |
|---:|---|
| 60001 | 订单状态不允许当前操作 |
| 60002 | 订单已取消 |
| 60003 | 订单已完成 |

### 7.6 支付错误码

| code | 说明 |
|---:|---|
| 70001 | 模拟支付失败 |
| 70002 | 订单已支付 |

---

## 8. 通用上传接口

首版文件上传使用对象存储，采用服务端中转模式。

对象存储服务商：腾讯云 COS。Bucket、访问域名、密钥：待补充。

```txt
POST /api/admin/uploads
```

说明：当前服务端上传实现为腾讯云 COS 服务端中转上传，文件对象 Key 生成规则为 `uploads/{bizType}/{yyyy}/{mm}/{dd}/{fileId}.{ext}`。COS Bucket、Region、访问域名和密钥通过服务端 `.env` 配置。

请求：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `file` | file | 是 | 上传文件 |
| `bizType` | string | 是 | `product` / `logo` / `store` / `website` |

响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "fileId": "file_xxx",
    "url": "https://cdn.example.com/uploads/product/2026/06/15/file_xxx.png",
    "name": "demo.png",
    "size": 102400,
    "mimeType": "image/png"
  }
}
```

---

## 9. 后台接口

## 9.1 后台鉴权

### 9.1.1 获取图形验证码

```txt
GET /api/admin/auth/captcha
```

响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "captchaId": "cap_xxx",
    "imageUrl": "/api/admin/auth/captcha/cap_xxx"
  }
}
```

### 9.1.2 登录

```txt
POST /api/admin/auth/login
```

请求体：

```json
{
  "account": "admin",
  "password": "待补充",
  "captchaId": "cap_xxx",
  "captchaCode": "7K38"
}
```

响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "accessToken": "待补充",
    "refreshToken": "待补充",
    "user": {
      "id": "admin_xxx",
      "name": "管理员",
      "roleId": "role_admin",
      "roleName": "管理员"
    }
  }
}
```

### 9.1.3 退出登录

```txt
POST /api/admin/auth/logout
```

### 9.1.4 当前用户

```txt
GET /api/admin/auth/me
```

响应字段：

| 字段 | 说明 |
|---|---|
| `id` | 管理员 ID |
| `name` | 管理员名称 |
| `roleId` | 角色 ID |
| `roleName` | 角色名称 |
| `menus` | 当前角色菜单权限 |

---

## 9.2 仪表盘

### 9.2.1 经营统计

```txt
GET /api/admin/dashboard/summary
```

响应字段：

| 字段 | 说明 |
|---|---|
| `todaySalesAmount` | 今日销售额 |
| `todayOrderCount` | 今日订单数 |
| `pendingOrderCount` | 待处理订单数 |
| `stockWarningCount` | 库存预警 SKU 数 |
| `newUserCount` | 今日新增会员数 |

### 9.2.2 销售趋势

```txt
GET /api/admin/dashboard/sales-trend?days=7
```

响应字段：

| 字段 | 说明 |
|---|---|
| `date` | 日期 |
| `amount` | 销售额 |
| `orderCount` | 订单数 |

### 9.2.3 订单状态分布

```txt
GET /api/admin/dashboard/order-status
```

### 9.2.4 最近订单

```txt
GET /api/admin/dashboard/recent-orders
```

### 9.2.5 库存预警

```txt
GET /api/admin/dashboard/stock-warnings
```

---

## 9.3 商品分类

### 9.3.1 分类列表

```txt
GET /api/admin/categories
```

查询参数：

| 参数 | 说明 |
|---|---|
| `name` | 分类名称 |
| `status` | `enabled` / `disabled` |

### 9.3.2 新增分类

```txt
POST /api/admin/categories
```

请求体：

```json
{
  "name": "咖啡",
  "sort": 1,
  "status": "enabled"
}
```

### 9.3.3 编辑分类

```txt
PUT /api/admin/categories/{categoryId}
```

### 9.3.4 删除分类

```txt
DELETE /api/admin/categories/{categoryId}
```

说明：软删除，写入 `deletedAt`。

---

## 9.4 商品与 SKU

### 9.4.1 商品列表

```txt
GET /api/admin/products
```

查询参数：

| 参数 | 说明 |
|---|---|
| `name` | 商品名称 |
| `categoryId` | 分类 ID |
| `productStatus` | `onSale` / `offSale` |
| `stockStatus` | `normal` / `lowStock` / `soldOut` |
| `page` | 页码 |
| `pageSize` | 每页数量 |

响应列表字段：

| 字段 | 说明 |
|---|---|
| `id` | 商品 ID，`prod_xxx` |
| `name` | 商品名称 |
| `categoryId` | 分类 ID |
| `categoryName` | 分类名称 |
| `imageUrl` | 商品图片 |
| `description` | 商品描述 |
| `minPrice` | SKU 起售价 |
| `skuCount` | SKU 数量 |
| `totalStock` | SKU 总库存 |
| `productStatus` | `onSale` / `offSale` |
| `stockStatus` | `normal` / `lowStock` / `soldOut` |

### 9.4.2 商品详情

```txt
GET /api/admin/products/{productId}
```

响应包含 `skus`。

SKU 字段：

| 字段 | 说明 |
|---|---|
| `id` | SKU ID，`sku_xxx` |
| `skuCode` | SKU 编码 |
| `temperature` | 温度 |
| `cupSize` | 杯型 |
| `price` | 销售价 |
| `stock` | 当前库存 |
| `warningStock` | 预警值 |
| `skuStatus` | `enabled` / `disabled` |

### 9.4.3 新增商品

```txt
POST /api/admin/products
```

请求体：

```json
{
  "name": "待补充",
  "categoryId": "cat_xxx",
  "imageUrl": "待补充",
  "description": "待补充",
  "productStatus": "onSale",
  "skus": [
    {
      "temperature": "hot",
      "cupSize": "large",
      "price": 28,
      "stock": 100,
      "warningStock": 10,
      "skuStatus": "enabled"
    }
  ]
}
```

### 9.4.4 编辑商品

```txt
PUT /api/admin/products/{productId}
```

### 9.4.5 上下架商品

```txt
PUT /api/admin/products/{productId}/status
```

请求体：

```json
{
  "productStatus": "offSale"
}
```

### 9.4.6 删除商品

```txt
DELETE /api/admin/products/{productId}
```

说明：软删除。有历史订单的商品建议只允许下架，具体规则待数据库设计确认。

---

## 9.5 订单管理

### 9.5.1 订单列表

```txt
GET /api/admin/orders
```

查询参数：

| 参数 | 说明 |
|---|---|
| `orderNo` | 订单展示编号 |
| `userKeyword` | 用户名或手机号 |
| `orderStatus` | 订单状态 |
| `paymentStatus` | 支付状态 |
| `orderSource` | `app` / `admin` |
| `startTime` | 下单开始时间 |
| `endTime` | 下单结束时间 |
| `page` | 页码 |
| `pageSize` | 每页数量 |

列表字段：

| 字段 | 说明 |
|---|---|
| `id` | 订单 ID，`order_xxx` |
| `orderNo` | 展示订单号 |
| `userName` | 用户名 |
| `phone` | 手机号，后台可脱敏展示 |
| `totalAmount` | 商品金额 |
| `discountAmount` | 优惠金额 |
| `payAmount` | 实付金额 |
| `orderStatus` | 订单状态 |
| `paymentStatus` | 支付状态 |
| `paymentMethod` | `mock` |
| `orderSource` | `app` / `admin` |
| `createdAt` | 下单时间 |

### 9.5.2 订单详情

```txt
GET /api/admin/orders/{orderId}
```

响应包含：

- 基础信息
- 商品明细 `items`
- 优惠信息
- 取餐码 `pickupCode`
- 用户备注
- 状态时间

### 9.5.3 后台补单

```txt
POST /api/admin/orders
```

请求体：

```json
{
  "userName": "待补充",
  "phone": "待补充",
  "orderSource": "admin",
  "items": [
    {
      "skuId": "sku_xxx",
      "sugarLevel": "不另外加糖",
      "quantity": 1
    }
  ],
  "discountAmount": 0,
  "remark": "待补充"
}
```

### 9.5.4 更新订单状态

```txt
PUT /api/admin/orders/{orderId}/status
```

请求体：

```json
{
  "orderStatus": "making"
}
```

说明：后台状态更新接口仅用于制作流程流转，允许 `making`、`readyForPickup`、`completed`。取消和退款必须使用独立接口。

### 9.5.5 取消订单

```txt
PUT /api/admin/orders/{orderId}/cancel
```

说明：仅允许取消未支付的待付款订单。

### 9.5.6 退款标记

```txt
PUT /api/admin/orders/{orderId}/refund
```

说明：首版不接真实微信支付，仅允许已支付且未完成的订单退款；退款后订单支付状态更新为 `refunded`，并回补 SKU 库存。

### 9.5.7 删除订单

```txt
DELETE /api/admin/orders/{orderId}
```

说明：软删除。

---

## 9.6 用户管理

### 9.6.1 用户列表

```txt
GET /api/admin/users
```

查询参数：

| 参数 | 说明 |
|---|---|
| `nickname` | 用户昵称 |
| `phone` | 手机号 |
| `userStatus` | `normal` / `disabled` |
| `startTime` | 注册开始时间 |
| `endTime` | 注册结束时间 |

列表字段：

| 字段 | 说明 |
|---|---|
| `id` | 用户 ID，`user_xxx` |
| `avatarUrl` | 头像 |
| `nickname` | 昵称 |
| `phone` | 手机号 |
| `orderCount` | 订单数 |
| `totalConsumeAmount` | 累计消费金额 |
| `userStatus` | 用户状态 |
| `createdAt` | 注册时间 |

### 9.6.2 用户详情

```txt
GET /api/admin/users/{userId}
```

### 9.6.3 启用 / 禁用用户

```txt
PUT /api/admin/users/{userId}/status
```

请求体：

```json
{
  "userStatus": "disabled"
}
```

---

## 9.7 库存管理

### 9.7.1 SKU 库存列表

```txt
GET /api/admin/inventory/skus
```

查询参数：

| 参数 | 说明 |
|---|---|
| `productName` | 商品名称 |
| `skuKeyword` | SKU 编码或规格 |
| `stockStatus` | `normal` / `lowStock` / `soldOut` |
| `productStatus` | `onSale` / `offSale` |

列表字段：

| 字段 | 说明 |
|---|---|
| `skuId` | SKU ID |
| `skuCode` | SKU 编码 |
| `productName` | 商品名称 |
| `specText` | 规格组合文本 |
| `stock` | 当前库存 |
| `warningStock` | 预警值 |
| `stockStatus` | 库存状态 |
| `updatedAt` | 更新时间 |

### 9.7.2 调整库存

```txt
POST /api/admin/inventory/adjustments
```

请求体：

```json
{
  "skuId": "sku_xxx",
  "adjustType": "in",
  "quantity": 10,
  "reason": "待补充"
}
```

`adjustType`：

| 值 | 说明 |
|---|---|
| `in` | 入库 |
| `out` | 出库 |
| `check` | 盘点 |

### 9.7.3 库存调整记录

```txt
GET /api/admin/inventory/adjustments
```

---

## 9.8 营销管理

### 9.8.1 优惠券列表

```txt
GET /api/admin/coupons
```

查询参数：

| 参数 | 说明 |
|---|---|
| `name` | 优惠券名称 |
| `couponType` | `discountAmount` / `discountRate` |
| `couponStatus` | `notStarted` / `active` / `ended` / `disabled` |
| `startTime` | 有效期开始 |
| `endTime` | 有效期结束 |

### 9.8.2 新增优惠券

```txt
POST /api/admin/coupons
```

请求体：

```json
{
  "name": "待补充",
  "couponType": "discountAmount",
  "thresholdAmount": 30,
  "discountAmount": 5,
  "discountRate": null,
  "totalQuantity": 100,
  "limitPerUser": 1,
  "validStartAt": "2026-06-03T00:00:00.000Z",
  "validEndAt": "2026-06-30T23:59:59.000Z",
  "couponStatus": "active"
}
```

### 9.8.3 编辑优惠券

```txt
PUT /api/admin/coupons/{couponId}
```

### 9.8.4 停用优惠券

```txt
PUT /api/admin/coupons/{couponId}/disable
```

### 9.8.5 删除优惠券

```txt
DELETE /api/admin/coupons/{couponId}
```

说明：软删除。

---

## 9.9 系统设置 - 角色权限

说明：角色权限作为后台“系统设置”的二级菜单展示。

### 9.9.1 角色列表

```txt
GET /api/admin/roles
```

### 9.9.2 角色详情

```txt
GET /api/admin/roles/{roleId}
```

### 9.9.3 更新角色菜单权限

```txt
PUT /api/admin/roles/{roleId}/menus
```

请求体：

```json
{
  "menuIds": ["dashboard", "products", "product_list", "product_categories", "orders", "settings", "menu_management", "role_permissions"]
}
```

说明：首版不做按钮级权限接口。

### 9.9.4 菜单树

```txt
GET /api/admin/menus
```

### 9.9.5 菜单管理

说明：菜单管理只用于维护后台侧边栏菜单，首版不做按钮级权限。

```txt
POST /api/admin/menus
```

```txt
PUT /api/admin/menus/{menuId}
```

```txt
PUT /api/admin/menus/{menuId}/status
```

```txt
DELETE /api/admin/menus/{menuId}
```

### 9.9.6 登录日志
```txt
GET /api/admin/logs/login
```

查询参数：
| 参数 | 说明 |
|---|---|
| `account` | 登录账号 |
| `loginResult` | `success` / `fail` |
| `startTime` | 开始时间 |
| `endTime` | 结束时间 |

### 9.9.7 操作日志
```txt
GET /api/admin/logs/operation
```

查询参数：
| 参数 | 说明 |
|---|---|
| `module` | 模块 |
| `action` | 操作 |
| `adminUserId` | 操作人 |
| `startTime` | 开始时间 |
| `endTime` | 结束时间 |

---

## 9.10 系统设置

说明：后台侧边栏中，“账号管理”“菜单管理”和“角色权限”作为“系统设置”的二级菜单展示。

### 9.10.1 门店设置

```txt
GET /api/admin/settings/store
```

```txt
PUT /api/admin/settings/store
```

请求体：

```json
{
  "storeName": "待补充",
  "address": "待补充",
  "businessHours": "待补充",
  "phone": "待补充",
  "pickupNotice": "待补充"
}
```

### 9.10.2 管理员账号设置

```txt
GET /api/admin/settings/account
```

```txt
PUT /api/admin/settings/account
```

请求体：

```json
{
  "adminName": "管理员",
  "phone": "待补充",
  "newPassword": "待补充",
  "confirmPassword": "待补充"
}
```

### 9.10.3 账号管理

说明：管理员和店员账号管理，只管理后台账号，不管理小程序用户。

#### 9.10.3.1 账号列表

```txt
GET /api/admin/admin-users
```

查询参数：
| 参数 | 说明 |
|---|---|
| `page` | 页码 |
| `pageSize` | 每页数量 |
| `account` | 登录账号 |
| `name` | 姓名 |
| `phone` | 手机号 |
| `roleId` | 角色 ID |
| `status` | `enabled` / `disabled` |

#### 9.10.3.2 新增账号

```txt
POST /api/admin/admin-users
```

请求体：

```json
{
  "account": "staff01",
  "name": "店员",
  "phone": "待补充",
  "roleId": "role_staff",
  "password": "待补充",
  "status": "enabled"
}
```

#### 9.10.3.3 账号详情

```txt
GET /api/admin/admin-users/{adminUserId}
```

#### 9.10.3.4 编辑账号

```txt
PUT /api/admin/admin-users/{adminUserId}
```

请求体：

```json
{
  "account": "staff01",
  "name": "店员",
  "phone": "待补充",
  "roleId": "role_staff"
}
```

#### 9.10.3.5 启停账号

```txt
PUT /api/admin/admin-users/{adminUserId}/status
```

请求体：

```json
{
  "status": "disabled"
}
```

说明：不允许禁用当前登录账号；不允许禁用最后一个启用状态的管理员账号。

#### 9.10.3.6 重置密码

```txt
PUT /api/admin/admin-users/{adminUserId}/password
```

请求体：

```json
{
  "password": "待补充"
}
```

#### 9.10.3.7 删除账号

```txt
DELETE /api/admin/admin-users/{adminUserId}
```

说明：软删除；不允许删除当前登录账号；不允许删除最后一个启用状态的管理员账号。

#### 9.10.3.8 可选角色

```txt
GET /api/admin/admin-users/roles
```

---

## 10. 小程序接口

## 10.1 小程序授权

### 10.1.1 微信登录

```txt
POST /api/app/auth/login
```

请求体：

```json
{
  "code": "wx.login code"
}
```

响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "accessToken": "待补充",
    "refreshToken": "待补充",
    "user": {
      "id": "user_xxx",
      "openidBound": true,
      "phoneBound": false
    }
  }
}
```

### 10.1.2 手机号授权

```txt
POST /api/app/auth/phone
```

请求体：

```json
{
  "phoneCode": "微信手机号授权 code"
}
```

响应字段：

| 字段 | 说明 |
|---|---|
| `phone` | 授权手机号 |
| `phoneBound` | 是否已绑定手机号 |

### 10.1.3 当前用户

```txt
GET /api/app/auth/me
```

---

## 10.2 小程序商品

### 10.2.1 商品分类

```txt
GET /api/app/categories
```

说明：只返回启用分类。

### 10.2.2 商品列表

```txt
GET /api/app/products
```

查询参数：

| 参数 | 说明 |
|---|---|
| `categoryId` | 分类 ID |
| `keyword` | 商品关键词 |

列表字段：

| 字段 | 说明 |
|---|---|
| `id` | 商品 ID |
| `name` | 商品名称 |
| `imageUrl` | 商品图片 |
| `description` | 商品描述 |
| `minPrice` | 起售价 |
| `saleStatus` | `available` / `soldOut` |

### 10.2.3 商品详情

```txt
GET /api/app/products/{productId}
```

响应包含商品基础信息和 `skus`。

### 10.2.4 SKU 可售状态

```txt
GET /api/app/skus/{skuId}/availability
```

响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "skuId": "sku_xxx",
    "available": true,
    "stock": 10,
    "price": 28
  }
}
```

---

## 10.3 小程序购物车

### 10.3.1 查询购物车

```txt
GET /api/app/cart
```

### 10.3.2 同步购物车

```txt
POST /api/app/cart/sync
```

请求体：

```json
{
  "cartVersion": 3,
  "items": [
    {
      "skuId": "sku_xxx",
      "quantity": 1
    }
  ]
}
```

规则：

- 查询购物车会返回 `cartVersion`。
- 同步时必须携带最近一次服务端返回的 `cartVersion`。
- 版本过期时返回 `409` 和错误码 `30006`，`data` 为最新购物车。

### 10.3.3 加入购物车

```txt
POST /api/app/cart/items
```

请求体：

```json
{
  "skuId": "sku_xxx",
  "sugarLevel": "3分糖",
  "quantity": 1
}
```

### 10.3.4 更新数量

```txt
PUT /api/app/cart/items/{cartItemId}
```

请求体：

```json
{
  "quantity": 2
}
```

### 10.3.5 删除购物车项

```txt
DELETE /api/app/cart/items/{cartItemId}
```

### 10.3.6 清空购物车

```txt
DELETE /api/app/cart
```

---

## 10.4 小程序优惠券

### 10.4.1 我的优惠券

```txt
GET /api/app/coupons
```

查询参数：

| 参数 | 说明 |
|---|---|
| `status` | `available` / `used` / `expired` |

### 10.4.2 结算可用优惠券

```txt
GET /api/app/coupons/available
```

查询参数：

| 参数 | 说明 |
|---|---|
| `amount` | 订单商品金额 |

---

## 10.5 小程序订单

### 10.5.1 创建订单

```txt
POST /api/app/orders
```

请求体：

```json
{
  "items": [
    {
      "skuId": "sku_xxx",
      "sugarLevel": "不另外加糖",
      "quantity": 1
    }
  ],
  "couponUserId": "coupon_user_xxx",
  "remark": "待补充"
}
```

规则：

- 创建订单状态为 `pendingPayment`。
- 创建待付款订单不扣减库存。
- 提交时校验商品和 SKU 是否可售。

### 10.5.2 订单列表

```txt
GET /api/app/orders
```

查询参数：

| 参数 | 说明 |
|---|---|
| `statusGroup` | `all` / `pendingPayment` / `making` / `readyForPickup` / `completed` / `cancelled` |

### 10.5.3 订单详情

```txt
GET /api/app/orders/{orderId}
```

### 10.5.4 取消订单

```txt
PUT /api/app/orders/{orderId}/cancel
```

规则：仅 `pendingPayment` 状态允许用户取消。

### 10.5.5 确认取餐

```txt
PUT /api/app/orders/{orderId}/confirm-pickup
```

规则：仅 `readyForPickup` 状态允许确认取餐，成功后订单变为 `completed`。

---

## 10.6 小程序模拟支付

### 10.6.1 模拟支付

```txt
POST /api/app/payments/mock
```

请求体：

```json
{
  "orderId": "order_xxx",
  "result": "success"
}
```

`result`：

| 值 | 说明 |
|---|---|
| `success` | 模拟支付成功 |
| `fail` | 模拟支付失败 |

成功响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "orderId": "order_xxx",
    "orderNo": "OC202606030001",
    "orderStatus": "paid",
    "paymentStatus": "paid",
    "pickupCode": "A102"
  }
}
```

规则：

- 模拟支付成功时扣减 SKU 库存。
- 库存不足时支付失败并返回 `50001`。
- 模拟支付成功后生成 `pickupCode`。
- 取餐码按支付日期每日从 `001` 开始顺序递增，三位不足补零，超过 `999` 后自然增加位数。
- 模拟支付失败时订单保持 `pendingPayment`。

---

## 11. 官网公开接口

## 11.1 公开商品分类

```txt
GET /api/public/categories
```

说明：只返回启用分类。

## 11.2 公开商品列表

```txt
GET /api/public/products
```

查询参数：

| 参数 | 说明 |
|---|---|
| `categoryId` | 分类 ID |
| `keyword` | 商品关键词 |

说明：只返回后台上架商品。

## 11.3 推荐商品

```txt
GET /api/public/products/recommended
```

说明：推荐规则待补充，首版可由后台商品排序或标记决定。

## 11.4 门店公开信息

```txt
GET /api/public/store
```

响应字段：

| 字段 | 说明 |
|---|---|
| `storeName` | 门店名称，待补充 |
| `address` | 门店地址，待补充 |
| `businessHours` | 营业时间，待补充 |
| `phone` | 联系电话，待补充 |
| `pickupNotice` | 取餐说明，待补充 |
| `mapInfo` | 地图信息，待补充 |

## 11.5 小程序二维码信息

```txt
GET /api/public/miniapp-qrcode
```

响应字段：

| 字段 | 说明 |
|---|---|
| `qrcodeUrl` | 小程序二维码图片，待补充 |
| `title` | 弹窗标题 |
| `description` | 扫码说明 |

---

## 12. 核心业务流程接口串联

### 12.1 后台维护商品

```txt
POST /api/admin/categories
POST /api/admin/products
PUT /api/admin/products/{productId}/status
```

### 12.2 小程序点单

```txt
POST /api/app/auth/login
POST /api/app/auth/phone
GET /api/app/products
GET /api/app/products/{productId}
POST /api/app/cart/items
POST /api/app/orders
POST /api/app/payments/mock
```

### 12.3 后台处理订单

```txt
GET /api/admin/orders
GET /api/admin/orders/{orderId}
PUT /api/admin/orders/{orderId}/status
```

### 12.4 官网展示

```txt
GET /api/public/products
GET /api/public/products/recommended
GET /api/public/store
GET /api/public/miniapp-qrcode
```

---

## 13. 状态枚举

### 13.1 商品状态

| 值 | 说明 |
|---|---|
| `onSale` | 上架 |
| `offSale` | 下架 |

### 13.2 SKU 状态

| 值 | 说明 |
|---|---|
| `enabled` | 启用 |
| `disabled` | 停用 |

### 13.3 库存状态

| 值 | 说明 |
|---|---|
| `normal` | 正常 |
| `lowStock` | 库存不足 |
| `soldOut` | 售罄 |

### 13.4 订单状态

| 值 | 说明 |
|---|---|
| `pendingPayment` | 待付款 |
| `paid` | 已付款 |
| `making` | 制作中 |
| `readyForPickup` | 待取餐 |
| `completed` | 已完成 |
| `cancelled` | 已取消 |
| `refunded` | 已退款 |

### 13.5 支付状态

| 值 | 说明 |
|---|---|
| `unpaid` | 未支付 |
| `paid` | 已支付 |
| `refunded` | 已退款 |

### 13.6 优惠券类型

| 值 | 说明 |
|---|---|
| `discountAmount` | 满减券 |
| `discountRate` | 折扣券 |

### 13.7 优惠券状态

| 值 | 说明 |
|---|---|
| `notStarted` | 未开始 |
| `active` | 进行中 |
| `ended` | 已结束 |
| `disabled` | 已停用 |

---

## 14. 待补充资料

### 14.1 配置资料

- 对象存储服务商：腾讯云 COS
- 对象存储 Bucket：待补充
- 对象存储访问域名：待补充
- 对象存储密钥配置：待补充
- 小程序 appId：待补充
- 小程序 appSecret：待补充

### 14.2 业务资料

- 真实商品分类：待补充
- 真实商品名称：待补充
- 真实商品图片：待补充
- 真实 SKU 规格值：待补充
- 真实门店信息：待补充
- 小程序二维码：待补充

### 14.3 后续扩展

- 真实微信支付接口：待补充
- 支付回调接口：待补充
- 退款接口：待补充
- 短信接口：待补充
- 地图接口：待补充

---

## 15. 验收标准

1. 文档明确服务端为 Node.js + Egg.js。
2. 文档明确接口风格为 RESTful。
3. 文档明确接口前缀为 `/api/admin`、`/api/app`、`/api/public`。
4. 文档明确统一响应结构为 `{ code, message, data }`。
5. 文档明确字段命名为 `camelCase`。
6. 文档明确资源 ID 使用带前缀 `nanoid`。
7. 文档明确后台和小程序使用 JWT Bearer Token。
8. 文档明确分页响应为 `list + pagination`。
9. 文档覆盖后台 9 模块接口。
10. 文档覆盖小程序点单闭环接口。
11. 文档覆盖官网公开展示接口。
12. 文档明确库存支付成功扣减。
13. 文档明确模拟支付支持成功和失败。
14. 文档明确支付成功后生成取餐码。
15. 文档明确删除为软删除。
16. 文档明确对象存储上传采用服务端中转。
17. 文档明确缺失真实资料标记为待补充。

---

## 16. 开发注意事项

1. 首版接口以跑通三端闭环为优先，不引入过度复杂规则。
2. 后台接口需要优先支持商品、SKU、库存和订单处理。
3. 小程序接口需要优先支持授权、购物车、下单、模拟支付和订单查询。
4. 官网公开接口只提供展示数据，不提供交易能力。
5. 数据库设计文档尚未完成，字段以 PRD 和本文档为准，后续可在数据库文档中细化。
