# AGENTS.md - Owl Coffee AI 协作与开发规则

本文件供 Codex、Claude Code 等 AI 助手读取，用于了解 Owl Coffee 项目结构、开发规范和协作约定。

## 1. AI 协作总则

1. 用户输入优先级高于项目默认建议，所有回复、文档、注释和提交信息均使用中文。
2. 全项目遵循 KISS 原则，非必要不要过度设计。
3. 开发前先阅读 `docs/` 下的权威文档，不要凭空猜测业务规则。
4. 缺失真实资料时统一标记为“待补充”，不要编造商品、门店、联系方式、小程序二维码、支付配置等真实商用信息。
5. 修改代码或文档时只处理当前任务相关内容，不做无关重构。
6. 遇到已有用户改动时不要回退，先理解并在其基础上继续工作。

## 2. 项目概况

Owl Coffee 是一个真实商用咖啡项目，首版目标是完成“后台维护商品与库存 -> 小程序点单 -> 模拟支付 -> 后台处理订单 -> 官网展示品牌与菜单”的可演示闭环。

首版范围：

- 单店经营
- 到店自提
- 模拟支付
- 后台优先
- 官网只做品牌展示，不做在线交易
- 小程序作为用户点单入口

## 3. 权威文档索引

开发时优先参考以下文档：

| 文档 | 用途 |
| --- | --- |
| `docs/project-overview.md` | 项目总说明、范围、技术路线和里程碑 |
| `docs/ui-design-system.md` | 后台 UI 设计规范和开发强制规则 |
| `docs/admin-prd.md` | 后台系统需求 |
| `docs/miniapp-prd.md` | 微信小程序需求 |
| `docs/website-prd.md` | 官网需求 |
| `docs/api-spec.md` | 三端统一接口规范 |
| `docs/database-design.md` | MySQL 数据库设计 |
| `docs/asset-inventory.md` | 素材清单和缺口优先级 |

如果文档之间存在冲突，按以下顺序处理：

1. 用户当前明确要求
2. `AGENTS.md`
3. `project-overview.md`
4. 对应端 PRD
5. `api-spec.md` / `database-design.md`
6. `ui-design-system.md` / `asset-inventory.md`

## 4. 技术栈与目录规划

后续代码采用 Monorepo 结构，统一放入 `packages/`。

| 子项目 | 路径 | 技术栈 |
| --- | --- | --- |
| 后台系统 | `packages/admin` | Vue 3 + Vite + Element Plus + Pinia + JavaScript |
| 官网 | `packages/website` | Vue 3 + Vite + Tailwind CSS + JavaScript |
| 小程序 | `packages/miniapp` | 微信原生小程序 |
| 服务端 | `packages/server` | Node.js + Egg.js + MySQL |
| 项目文档 | `docs` | Markdown |

现有目录用途：

| 目录 | 用途 |
| --- | --- |
| `admin` | 当前已有后台相关素材目录，不作为代码目录 |
| `logo` | 品牌 Logo 素材 |
| `mockups` | 页面 mockup 和 HTML 参考 |
| `docs` | 项目文档 |

包管理工具统一使用 `pnpm`。

## 5. 语言与命名规范

1. 文档、注释、提交信息、PR 描述使用中文。
2. 变量名、函数名、类名、组件名等代码标识使用英文。
3. JavaScript 变量和函数使用小驼峰，例如 `orderList`、`fetchOrders`。
4. Vue 组件文件名使用大驼峰，例如 `OrderDetailDialog.vue`。
5. 数据库表名和字段名使用 `snake_case`。
6. API 请求和响应字段使用 `camelCase`。
7. 全项目统一使用 JavaScript，不新增 TypeScript 文件。

## 6. 编码规范

## 6.1 通用规则

1. 缩进使用 2 个空格。
2. 字符串默认使用单引号。
3. 代码应保持简单清晰，不为首版 MVP 引入不必要抽象。
4. 公共逻辑可以抽取工具函数；只使用一次且不复杂的逻辑不要强行封装。
5. 不强制接入 ESLint / Prettier；提交前需要手动检查格式、命名和文档一致性。

## 6.2 注释规则

注释采用严格口径：

1. Vue `<script setup>` 中的响应式变量和主要函数需要加单行中文注释。
2. Egg.js controller / service 中每个方法需要加单行中文注释。
3. 注释说明“是什么 / 做什么”，不要复述实现细节。

示例：

```js
// 当前登录用户信息
const profile = ref(null)

// 提交登录表单，验证通过后进入仪表盘
async function handleLogin() {
  // ...
}
```

## 6.3 Vue 目录建议

后台和官网的 Vue 代码建议使用以下结构：

```text
src/
├── api/
├── assets/
├── components/
├── composables/
├── router/
├── stores/
├── utils/
└── views/
```

功能页目录建议：

```text
src/views/
└── FunctionName/
    ├── index.vue
    └── childComps/
        └── DetailDialog.vue
```

## 7. 后台开发规则

1. 后台系统名称统一为 `Owl Coffee 管理系统`。
2. 后台技术栈为 Vue 3 + Element Plus + JavaScript。
3. 后台 UI 必须遵循 `docs/ui-design-system.md`。
4. 后台使用暗色咖啡馆管理系统风格，主强调色使用咖啡橙。
5. 不使用 `PageContainer`。
6. 新增、编辑、详情优先使用弹窗。
7. 列表页统一结构为：搜索区域 -> 功能按钮区域 -> 表格区域 -> 分页区域。
8. Element Plus 组件需要覆盖为后台暗色主题，避免默认亮色样式穿透。
9. 后台首版角色只有管理员和店员。
10. 后台首版模块以 `docs/admin-prd.md` 为准。

## 8. 官网开发规则

1. 官网技术栈为 Vue 3 + Vite + Tailwind CSS + JavaScript。
2. 官网面向消费者，采用温暖浅色咖啡品牌风。
3. 官网不直接套用后台暗色管理界面。
4. 官网首版固定为：首页、品牌介绍、咖啡菜单、门店信息、联系我们。
5. 官网不做在线交易、购物车、账号系统和商品详情页。
6. 官网菜单只展示后台上架商品。
7. 小程序入口使用二维码弹窗，真实二维码缺失时标记为“待补充”。
8. 图片需要设置 `alt`，页面需要基础 SEO 信息。

## 9. 小程序开发规则

1. 小程序使用微信原生小程序开发。
2. 小程序采用温暖浅色咖啡品牌风，不照搬后台暗色 UI。
3. TabBar 固定为：首页、菜单、购物车、我的。
4. 用户可未登录浏览商品，提交订单前必须完成微信授权和手机号授权。
5. 商品 SKU 规格固定为温度、杯型、糖度。
6. 购物车支持本地保存，登录后同步服务端。
7. 首版使用模拟支付，不接真实微信支付。
8. 支付成功后生成取餐码。
9. 首版不做外送、预约取餐、会员等级、积分、余额和用户发起退款。

## 10. 服务端开发规则

1. 服务端技术栈为 Node.js + Egg.js + MySQL。
2. 接口风格遵循 RESTful。
3. 接口规范以 `docs/api-spec.md` 为准。
4. 数据库设计以 `docs/database-design.md` 为准。
5. 统一响应结构为 `{ code, message, data }`。
6. 后台接口前缀为 `/api/admin`。
7. 小程序接口前缀为 `/api/app`。
8. 官网公开接口前缀为 `/api/public`。
9. 后台和小程序鉴权使用 JWT Bearer Token。
10. 数据删除使用软删除，字段为 `deleted_at`。
11. 创建待付款订单不扣库存，模拟支付成功时扣减 SKU 库存。
12. 模拟支付失败时订单保持待付款状态。
13. 资源 ID 使用带业务前缀的 `nanoid` 字符串。
14. 订单展示编号使用 `order_no`，接口字段为 `orderNo`。

## 11. GitHub 与分支规则

## 11.1 分支策略

```text
main          # 稳定分支，只接受 PR 合并
develop       # 开发集成分支
feature/*     # 功能分支，从 develop 切出
fix/*         # 修复分支，从 develop 或 main 切出
docs/*        # 文档分支
```

## 11.2 Commit 规范

提交信息使用中文 Conventional Commits。

格式：

```text
<类型>(<范围>): <中文描述>
```

类型：

```text
feat | fix | docs | style | refactor | test | chore
```

范围：

```text
admin | website | miniapp | server | docs | assets | deps
```

示例：

```text
feat(admin): 新增商品管理页面
fix(server): 修复订单状态更新逻辑
docs: 更新数据库设计文档
```

## 11.3 PR 规则

PR 使用轻量规则，至少包含：

1. 标题
2. 变更说明
3. 测试结果或自查结果
4. 关联文档或关联需求

不要求复杂 PR 模板，但不得提交无法说明用途的变更。

## 12. 环境变量与敏感信息

1. 数据库密码、JWT Secret、小程序 appSecret、对象存储密钥、支付密钥等敏感信息不得提交到 GitHub。
2. 各子项目可以使用 `.env` 保存本地配置。
3. 可提交 `.env.example` 作为配置模板。
4. 真实微信支付、短信、OSS、地图等配置当前均为待补充或后续扩展。

## 13. 素材与占位规则

1. 素材清单以 `docs/asset-inventory.md` 为准。
2. 现有 Logo、后台 mockup 和登录背景可用于开发参考。
3. 商品、门店、二维码、联系方式等真实素材缺失时，页面中使用“待补充”或明确占位内容。
4. 不要编造真实商品名称、真实价格、真实门店地址和真实联系方式。
5. 官网和小程序可以临时使用占位图片，但代码结构应支持后续替换为后台上传素材。
6. 用途不明确的图片不要删除或重命名，先标记为待确认。

## 14. 开发前检查清单

开始开发前先确认：

1. 是否阅读了对应端 PRD。
2. 是否确认当前任务属于首版 MVP 范围。
3. 是否遵循对应端技术栈。
4. 是否没有新增 TypeScript。
5. 是否遵循接口字段 `camelCase`、数据库字段 `snake_case`。
6. 是否没有编造真实业务资料。
7. 后台页面是否符合 `docs/ui-design-system.md`。
8. 官网和小程序是否没有照搬后台暗色 UI。
9. 涉及接口时是否与 `docs/api-spec.md` 一致。
10. 涉及表结构时是否与 `docs/database-design.md` 一致。

## 15. 禁止事项

1. 禁止将 StarWeave、票务、Nuxt、uni-app、Redis 防超卖等无关规则迁移到 Owl Coffee。
2. 禁止新增 TypeScript 文件。
3. 禁止在官网首版加入在线交易、购物车、登录系统和商品详情页。
4. 禁止在小程序首版加入外送、预约取餐、会员等级、积分、余额和真实微信支付。
5. 禁止在后台首版加入多门店、加盟、多层组织权限和按钮级权限配置。
6. 禁止提交真实密钥、密码、appSecret 和支付配置。
7. 禁止无关重构和无说明的大范围改动。

