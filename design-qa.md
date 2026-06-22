# 订单页面设计 QA

- source visual truth path: `E:\Owl-Coffee\docs\design\miniapp-ui-draft-v2.png`
- implementation screenshot path: 待补充
- viewport: 微信小程序移动端
- state: 订单列表全部状态
- full-view comparison evidence: 已打开源设计稿；微信开发者工具窗口截图接口返回“不支持此接口”，无法取得实现截图并进行同屏对比。
- focused region comparison evidence: 因实现截图不可用，无法对筛选栏、订单卡片和操作区做局部同屏对比。

## Findings

- [P1] 缺少实现页面截图
  - Location: 微信开发者工具订单页
  - Evidence: 源设计稿可读取，但当前环境无法捕获开发者工具窗口。
  - Impact: 无法完成字体、间距、颜色、图片和文案五个表面的视觉验收。
  - Fix: 在微信开发者工具中打开订单页并取得同视口截图后重新进行视觉对比。

## Implementation Checklist

- [x] 完成订单状态筛选
- [x] 完成订单商品明细展示
- [x] 完成取餐码、模拟支付和再来一单操作
- [x] 完成加载态和空状态
- [ ] 补充微信开发者工具实现截图并完成同屏设计验收

## Patches made since the previous QA pass

- 首次 QA，无上一轮补丁。

final result: blocked
