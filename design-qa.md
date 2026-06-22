# 确认订单页面设计 QA

- source visual truth path: `E:\Owl-Coffee\docs\design\miniapp-confirm-order-v2.png`
- implementation screenshot path: 待补充
- viewport: 微信小程序移动端
- state: 购物车包含商品的确认订单页
- full-view comparison evidence: 已打开并检查源效果图；当前环境无法通过微信开发者工具窗口截图接口取得实现截图。
- focused region comparison evidence: 因实现截图不可用，无法对自提卡片、商品卡片、金额卡片及底部结算栏进行同屏局部对比。

## Findings

- [P1] 缺少重构后实现截图
  - Location: 微信开发者工具确认订单页
  - Evidence: 源效果图可读取，但实现页面无法在当前环境中捕获。
  - Impact: 无法完成字体、间距、颜色、图片和文案五个表面的最终视觉验收。
  - Fix: 在微信开发者工具中重新编译并提供同视口截图，随后完成视觉对比与细节修正。

## Implementation Checklist

- [x] 重构到店自提信息卡片
- [x] 重构商品信息卡片与静态数量展示
- [x] 增加优惠提示和订单备注编辑层
- [x] 增加商品金额、优惠金额和应付金额明细
- [x] 重构底部合计与提交订单区域
- [x] 保留提交、模拟支付和跳转订单页流程
- [ ] 补充实现截图并完成同屏视觉验收

## Patches made since the previous QA pass

- 按 `miniapp-confirm-order-v2.png` 完成首次页面重构。

final result: blocked
