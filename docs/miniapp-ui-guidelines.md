# Owl Coffee 小程序 UI 开发约定

本文档用于记录 Owl Coffee 小程序首版 UI 实现约定，配合设计稿 `docs/design/miniapp-ui-draft-v2.png` 使用。

## 1. 技术选择

小程序采用微信原生小程序开发，UI 基础组件使用 Vant Weapp。

- 组件库：Vant Weapp
- 实现方式：微信原生小程序 + Vant Weapp + 自定义业务样式
- 包管理：pnpm
- 代码语言：JavaScript，不新增 TypeScript 文件

Vant Weapp 只作为基础组件库使用，不直接套用默认视觉风格。页面结构、间距、颜色和业务卡片样式需要按 Owl Coffee 设计稿自定义。

## 2. 视觉方向

小程序面向消费者，采用清爽燕麦白咖啡品牌风，不照搬后台暗色管理界面。

- 主背景：燕麦白 / 暖白
- 主强调色：低饱和咖啡橙
- 正文文字：深咖啡色
- 次级文字：暖灰棕
- 面板背景：白色或浅拿铁色
- 卡片圆角：不超过 8px

咖啡橙只用于主按钮、选中态、关键状态和少量标签，不做大面积背景铺色。

## 3. 页面范围

首版小程序底部 TabBar 固定为：

- 首页
- 点单
- 订单
- 我的

首页暂不展示门店信息，不展示门店地址、营业时间、联系电话和位置入口。缺失真实资料时统一展示“待补充”，不得编造真实商品、价格、门店和联系方式。

## 4. Vant Weapp 组件建议

| 场景 | 推荐组件 |
| --- | --- |
| 底部导航 | `van-tabbar`、`van-tabbar-item` |
| 搜索商品 | `van-search` |
| 分类切换 | `van-sidebar`、`van-sidebar-item` 或自定义分类栏 |
| 标签状态 | `van-tag` |
| 按钮 | `van-button` |
| 商品规格选择 | `van-tabs`、`van-button` 或自定义规格按钮 |
| 数量增减 | `van-stepper` |
| 弹层 | `van-popup` |
| 列表行 | `van-cell`、`van-cell-group` |
| 空状态 | `van-empty` |
| 图标 | `van-icon`，不足时补充 Iconfont |
| Toast 提示 | `van-toast` |
| Dialog 确认 | `van-dialog` |

可见的业务操作按钮默认必须使用 `van-button`，保持组件库行为和主题覆盖一致。只有微信原生开放能力按钮（如手机号授权）、不可替代的表单提交能力或高度定制视觉场景，才使用原生 `button` 或自定义 WXML/WXSS 按钮，并需在实现中保持使用原因清晰。

商品卡片、订单卡片、首页推荐区、当前订单区优先使用自定义 WXML/WXSS 实现，避免被组件默认样式限制。

## 5. 主题覆盖

需要覆盖 Vant Weapp 默认主题，使其贴合 Owl Coffee 视觉：

- 主色覆盖为咖啡橙
- 按钮圆角控制在 8px 内
- TabBar 选中态使用咖啡橙
- 搜索框、卡片和列表背景使用浅色系
- 弹窗、Toast 和 Dialog 保持简洁，不使用重色块

建议在小程序全局样式中维护主题变量或统一 class，避免每个页面重复写颜色。

## 6. 素材获取

品牌 Logo 使用项目已有素材：

- `packages/admin/src/assets/logo/owlcoffee_icon.png`
- `packages/admin/src/assets/logo/owlcoffee_logo_horizontal.png`

图标开发时不从设计稿图片中抠图。优先使用 `van-icon`，不足部分使用 Iconfont 单独补充。

商品图片、首页咖啡氛围图当前仍属于待补充素材。开发阶段可以使用临时占位图，但代码结构需要支持后续替换为后台上传素材。

## 7. 首版禁止事项

小程序首版不做以下能力：

- 外送
- 预约取餐
- 多门店
- 真实微信支付
- 会员等级
- 积分
- 余额
- 用户发起退款
- 首页门店信息展示
