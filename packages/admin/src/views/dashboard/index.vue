<template>
  <section v-loading="loading" class="dashboard-view" aria-label="仪表盘">
    <div class="dashboard-stat-grid">
      <article v-for="item in statCards" :key="item.key" class="dashboard-stat-card">
        <div>
          <p class="dashboard-stat-card__label">{{ item.label }}</p>
          <strong class="dashboard-stat-card__value">{{ item.value }}</strong>
          <p class="dashboard-stat-card__compare">较昨日 <span>待补充</span></p>
        </div>
        <span class="dashboard-stat-card__icon">
          <el-icon><component :is="item.icon" /></el-icon>
        </span>
        <span class="dashboard-stat-card__sparkline" :class="`is-${item.tone}`"></span>
      </article>
    </div>

    <div class="dashboard-main-grid">
      <section class="dashboard-panel dashboard-panel--trend">
        <header class="dashboard-panel__header">
          <h2>近 7 日销售趋势</h2>
          <span>销售额（元）</span>
        </header>
        <div ref="salesChartRef" class="dashboard-chart" aria-label="近 7 日销售趋势图"></div>
      </section>

      <section class="dashboard-panel">
        <header class="dashboard-panel__header">
          <h2>订单状态分布</h2>
        </header>
        <div class="dashboard-status-layout">
          <div ref="statusChartRef" class="dashboard-donut" aria-label="订单状态分布图"></div>
          <ul class="dashboard-status-list">
            <li v-for="item in orderStatusItems" :key="item.status">
              <span class="dashboard-status-list__dot" :style="{ background: item.color }"></span>
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}（{{ item.percent }}%）</strong>
            </li>
          </ul>
        </div>
        <p class="dashboard-total">总订单数：{{ orderStatusTotal }}</p>
      </section>

      <section class="dashboard-panel">
        <header class="dashboard-panel__header">
          <h2>快捷入口</h2>
        </header>
        <div class="dashboard-quick-grid">
          <button
            v-for="item in quickActions"
            :key="item.label"
            class="dashboard-quick-action"
            type="button"
            :disabled="item.disabled"
            @click="goToQuickAction(item.path)"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </button>
        </div>
      </section>
    </div>

    <div class="dashboard-bottom-grid">
      <section class="dashboard-panel">
        <header class="dashboard-panel__header">
          <h2>最近订单</h2>
          <button class="dashboard-link" type="button" @click="goToOrders">查看全部</button>
        </header>
        <el-table class="dashboard-table" :data="recentOrders" empty-text="暂无订单">
          <el-table-column prop="orderNo" label="订单编号" min-width="150" align="center" />
          <el-table-column label="用户" min-width="130">
            <template #default="{ row }">
              <div class="dashboard-user">
                <span class="dashboard-user__avatar">{{ getUserInitial(row.userName) }}</span>
                <span>{{ row.userName || '待补充' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="金额" min-width="100" align="center">
            <template #default="{ row }">￥{{ formatMoney(row.payAmount) }}</template>
          </el-table-column>
          <el-table-column label="状态" min-width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="getOrderStatusMeta(row.orderStatus).type" effect="dark">
                {{ getOrderStatusMeta(row.orderStatus).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="时间" min-width="120" align="center">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
      </section>

      <section class="dashboard-panel">
        <header class="dashboard-panel__header">
          <h2>库存预警</h2>
          <button class="dashboard-link" type="button" @click="goToInventory">查看全部</button>
        </header>
        <div v-if="stockWarnings.length" class="dashboard-stock-list">
          <article v-for="item in stockWarnings" :key="item.skuId" class="dashboard-stock-item">
            <span class="dashboard-stock-item__cover">{{ getProductInitial(item.productName) }}</span>
            <div class="dashboard-stock-item__main">
              <div class="dashboard-stock-item__title">
                <strong>{{ item.productName || '待补充商品' }}</strong>
                <el-tag :type="item.stockStatus === 'soldOut' ? 'danger' : 'warning'" effect="dark">
                  {{ item.stockStatus === 'soldOut' ? '已售罄' : '库存不足' }}
                </el-tag>
              </div>
              <p>{{ item.specText || '规格待补充' }}</p>
              <div class="dashboard-stock-meter">
                <span :style="{ width: getStockPercent(item) }"></span>
              </div>
              <div class="dashboard-stock-item__meta">
                <span>当前库存：{{ item.stock }}</span>
                <span>预警值：{{ item.warningStock }}</span>
              </div>
            </div>
          </article>
        </div>
        <el-empty v-else description="暂无库存预警" :image-size="92" />
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  BellFilled,
  Box,
  Coin,
  Goods,
  List,
  Promotion,
  Tickets,
  UserFilled
} from '@element-plus/icons-vue'
import {
  fetchDashboardSummary,
  fetchOrderStatus,
  fetchRecentOrders,
  fetchSalesTrend,
  fetchStockWarnings
} from '../../api/dashboard'

const ORDER_STATUS_META = {
  pendingPayment: { label: '待支付', color: '#ef7a3b', type: 'warning' },
  paid: { label: '待制作', color: '#f0ad38', type: 'warning' },
  making: { label: '制作中', color: '#4f90d9', type: 'primary' },
  readyForPickup: { label: '待取餐', color: '#55b879', type: 'success' },
  completed: { label: '已完成', color: '#55b879', type: 'success' },
  cancelled: { label: '已取消', color: '#77818f', type: 'info' },
  refunded: { label: '已退款', color: '#df6a62', type: 'danger' }
}

// 页面加载状态
const loading = ref(false)
// 经营统计数据
const summary = ref({
  todaySalesAmount: 0,
  todayOrderCount: 0,
  pendingOrderCount: 0,
  stockWarningCount: 0,
  newUserCount: 0
})
// 近 7 日销售趋势数据
const salesTrend = ref([])
// 订单状态分布数据
const orderStatusList = ref([])
// 最近订单数据
const recentOrders = ref([])
// 库存预警数据
const stockWarnings = ref([])
// 销售趋势图容器
const salesChartRef = ref(null)
// 订单状态图容器
const statusChartRef = ref(null)
// 路由实例
const router = useRouter()

let salesChart = null
let statusChart = null

// 顶部统计卡片
const statCards = computed(() => [
  {
    key: 'sales',
    label: '今日销售额',
    value: `￥${formatMoney(summary.value.todaySalesAmount)}`,
    icon: Coin,
    tone: 'orange'
  },
  {
    key: 'orders',
    label: '今日订单数',
    value: summary.value.todayOrderCount,
    icon: Tickets,
    tone: 'gold'
  },
  {
    key: 'pending',
    label: '待处理订单',
    value: summary.value.pendingOrderCount,
    icon: Box,
    tone: 'blue'
  },
  {
    key: 'users',
    label: '新增会员',
    value: summary.value.newUserCount,
    icon: UserFilled,
    tone: 'orange'
  }
])

// 订单状态总数
const orderStatusTotal = computed(() => orderStatusList.value.reduce((total, item) => total + item.count, 0))

// 订单状态展示列表
const orderStatusItems = computed(() => orderStatusList.value.map(item => {
  const meta = getOrderStatusMeta(item.orderStatus)
  const percent = orderStatusTotal.value ? ((item.count / orderStatusTotal.value) * 100).toFixed(1) : '0.0'

  return {
    status: item.orderStatus,
    label: meta.label,
    color: meta.color,
    count: item.count,
    percent
  }
}))

// 快捷入口配置
const quickActions = [
  { label: '新增商品', icon: Goods, path: '/products/list' },
  { label: '处理订单', icon: List, path: '/orders' },
  { label: '发布活动', icon: Promotion, path: '', disabled: true },
  { label: '库存预警', icon: BellFilled, path: '/inventory' }
]

// 加载仪表盘数据
async function loadDashboard() {
  loading.value = true

  try {
    const [summaryData, trendData, statusData, orderData, stockData] = await Promise.all([
      fetchDashboardSummary(),
      fetchSalesTrend(7),
      fetchOrderStatus(),
      fetchRecentOrders(5),
      fetchStockWarnings(5)
    ])

    summary.value = {
      todaySalesAmount: Number(summaryData?.todaySalesAmount) || 0,
      todayOrderCount: Number(summaryData?.todayOrderCount) || 0,
      pendingOrderCount: Number(summaryData?.pendingOrderCount) || 0,
      stockWarningCount: Number(summaryData?.stockWarningCount) || 0,
      newUserCount: Number(summaryData?.newUserCount) || 0
    }
    salesTrend.value = Array.isArray(trendData?.list) ? trendData.list : []
    orderStatusList.value = Array.isArray(statusData?.list) ? statusData.list.map(item => ({
      orderStatus: item.orderStatus,
      count: Number(item.count) || 0
    })) : []
    recentOrders.value = Array.isArray(orderData?.list) ? orderData.list : []
    stockWarnings.value = Array.isArray(stockData?.list) ? stockData.list : []

    await nextTick()
    renderCharts()
  } catch (error) {
    await nextTick()
    renderCharts()
  } finally {
    loading.value = false
  }
}

// 渲染仪表盘图表
function renderCharts() {
  renderSalesChart()
  renderStatusChart()
}

// 渲染销售趋势图
function renderSalesChart() {
  if (!salesChartRef.value) {
    return
  }

  salesChart = salesChart || echarts.init(salesChartRef.value)

  salesChart.setOption({
    grid: {
      top: 24,
      right: 18,
      bottom: 28,
      left: 50
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#111923',
      borderColor: 'rgba(238, 146, 38, 0.36)',
      textStyle: {
        color: '#f7e6cf'
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: salesTrend.value.map(item => item.date?.slice(5) || '待补充'),
      axisLine: {
        lineStyle: {
          color: 'rgba(181, 139, 92, 0.22)'
        }
      },
      axisLabel: {
        color: '#8d98a6'
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      splitNumber: 4,
      axisLabel: {
        color: '#8d98a6'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(181, 139, 92, 0.12)'
        }
      }
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: salesTrend.value.map(item => Number(item.amount) || 0),
        lineStyle: {
          width: 3,
          color: '#ee9226'
        },
        itemStyle: {
          color: '#ffb05b',
          borderColor: '#2b1708',
          borderWidth: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(238, 146, 38, 0.42)' },
            { offset: 1, color: 'rgba(238, 146, 38, 0.02)' }
          ])
        }
      }
    ]
  })
}

// 渲染订单状态环形图
function renderStatusChart() {
  if (!statusChartRef.value) {
    return
  }

  statusChart = statusChart || echarts.init(statusChartRef.value)

  statusChart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: '#111923',
      borderColor: 'rgba(238, 146, 38, 0.36)',
      textStyle: {
        color: '#f7e6cf'
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['54%', '78%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: {
          show: false
        },
        emphasis: {
          scale: true,
          scaleSize: 4
        },
        data: orderStatusItems.value.length
          ? orderStatusItems.value.map(item => ({
            name: item.label,
            value: item.count,
            itemStyle: {
              color: item.color
            }
          }))
          : [
            {
              name: '暂无订单',
              value: 1,
              itemStyle: {
                color: 'rgba(119, 129, 143, 0.36)'
              }
            }
          ]
      }
    ]
  })
}

// 调整图表尺寸
function resizeCharts() {
  salesChart?.resize()
  statusChart?.resize()
}

// 获取订单状态展示配置
function getOrderStatusMeta(status) {
  return ORDER_STATUS_META[status] || { label: '待补充', color: '#77818f', type: 'info' }
}

// 格式化金额
function formatMoney(value) {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 格式化时间
function formatDateTime(value) {
  if (!value) {
    return '待补充'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '待补充'
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 获取用户头像占位文字
function getUserInitial(name) {
  return String(name || '待').slice(0, 1)
}

// 获取商品图片占位文字
function getProductInitial(name) {
  return String(name || '咖').slice(0, 1)
}

// 获取库存进度比例
function getStockPercent(item) {
  const stock = Number(item.stock) || 0
  const warningStock = Number(item.warningStock) || 0

  if (warningStock <= 0) {
    return stock > 0 ? '100%' : '0%'
  }

  return `${Math.min(Math.max((stock / warningStock) * 100, 0), 100)}%`
}

// 跳转订单管理页
function goToOrders() {
  router.push('/orders')
}

// 跳转库存管理页
function goToInventory() {
  router.push('/inventory')
}

// 跳转快捷入口目标页
function goToQuickAction(path) {
  if (!path) {
    return
  }

  router.push(path)
}

onMounted(() => {
  loadDashboard()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  salesChart?.dispose()
  statusChart?.dispose()
})
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 14px;
}

.dashboard-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.dashboard-stat-card,
.dashboard-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(181, 139, 92, 0.18);
  border-radius: var(--oc-radius);
  background:
    linear-gradient(145deg, rgba(24, 35, 48, 0.92), rgba(10, 16, 24, 0.88)),
    var(--oc-panel);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
}

.dashboard-stat-card {
  min-height: 140px;
  padding: 22px;
}

.dashboard-stat-card::before,
.dashboard-panel::before {
  position: absolute;
  inset: 0;
  content: "";
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.dashboard-stat-card__label {
  margin: 0 0 10px;
  color: var(--oc-text-muted);
  font-size: 14px;
  font-weight: 700;
}

.dashboard-stat-card__value {
  display: block;
  color: #ffd9ab;
  font-size: 34px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.1;
}

.dashboard-stat-card__compare {
  margin: 18px 0 0;
  color: var(--oc-text-muted);
  font-size: 13px;
  font-weight: 700;
}

.dashboard-stat-card__compare span {
  margin-left: 8px;
  color: #b9c0c9;
}

.dashboard-stat-card__icon {
  position: absolute;
  top: 22px;
  right: 22px;
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 50%;
  background: rgba(238, 146, 38, 0.16);
  color: var(--oc-primary);
  font-size: 23px;
}

.dashboard-stat-card__sparkline {
  position: absolute;
  right: 18px;
  bottom: 18px;
  width: 120px;
  height: 34px;
  opacity: 0.8;
  clip-path: polygon(0 80%, 18% 62%, 34% 66%, 50% 44%, 66% 50%, 82% 24%, 100% 18%, 100% 100%, 0 100%);
}

.dashboard-stat-card__sparkline.is-orange,
.dashboard-stat-card__sparkline.is-gold {
  background: linear-gradient(180deg, rgba(238, 146, 38, 0.54), rgba(238, 146, 38, 0));
}

.dashboard-stat-card__sparkline.is-blue {
  background: linear-gradient(180deg, rgba(79, 144, 217, 0.54), rgba(79, 144, 217, 0));
}

.dashboard-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(320px, 1fr) minmax(310px, 1.1fr);
  gap: 14px;
}

.dashboard-bottom-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, 1fr);
  gap: 14px;
}

.dashboard-panel {
  min-height: 210px;
  padding: 18px;
}

.dashboard-panel--trend {
  min-height: 260px;
}

.dashboard-panel__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.dashboard-panel__header h2 {
  margin: 0;
  color: #f5d4a8;
  font-size: 17px;
  font-weight: 800;
}

.dashboard-panel__header span,
.dashboard-total {
  margin: 0;
  color: var(--oc-text-muted);
  font-size: 12px;
}

.dashboard-chart {
  position: relative;
  z-index: 1;
  height: 205px;
}

.dashboard-status-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 138px 1fr;
  align-items: center;
  gap: 14px;
}

.dashboard-donut {
  width: 138px;
  height: 138px;
}

.dashboard-status-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  gap: 12px;
  list-style: none;
}

.dashboard-status-list li {
  display: grid;
  grid-template-columns: 10px minmax(56px, 1fr) auto;
  align-items: center;
  color: var(--oc-text-secondary);
  font-size: 13px;
  gap: 9px;
}

.dashboard-status-list strong {
  color: #d6c2a8;
  font-weight: 700;
}

.dashboard-status-list__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dashboard-total {
  position: relative;
  z-index: 1;
  margin-top: 12px;
}

.dashboard-quick-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dashboard-quick-action {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 66px;
  border: 1px solid rgba(181, 139, 92, 0.18);
  border-radius: var(--oc-radius);
  background: rgba(255, 255, 255, 0.03);
  color: var(--oc-text-secondary);
  cursor: pointer;
  font-weight: 800;
  gap: 10px;
}

.dashboard-quick-action:hover {
  border-color: rgba(238, 146, 38, 0.4);
  background: rgba(238, 146, 38, 0.12);
  color: var(--oc-text);
}

.dashboard-quick-action:disabled {
  border-color: rgba(181, 139, 92, 0.18);
  background: rgba(255, 255, 255, 0.03);
  color: var(--oc-text-secondary);
  cursor: not-allowed;
}

.dashboard-quick-action .el-icon {
  color: var(--oc-primary);
  font-size: 23px;
}

.dashboard-link {
  border: 0;
  background: transparent;
  color: var(--oc-primary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
}

.dashboard-link:hover {
  color: #ffd59a;
}

.dashboard-table {
  position: relative;
  z-index: 1;
}

.dashboard-user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dashboard-user__avatar,
.dashboard-stock-item__cover {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid rgba(238, 146, 38, 0.28);
  background: linear-gradient(135deg, rgba(238, 146, 38, 0.92), rgba(86, 121, 82, 0.72));
  color: #21150a;
  font-weight: 900;
}

.dashboard-user__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.dashboard-stock-list {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
}

.dashboard-stock-item {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 12px 0;
  border-bottom: 1px solid rgba(181, 139, 92, 0.12);
  gap: 14px;
}

.dashboard-stock-item:last-child {
  border-bottom: 0;
}

.dashboard-stock-item__cover {
  width: 42px;
  height: 42px;
  border-radius: 10px;
}

.dashboard-stock-item__main {
  flex: 1;
  min-width: 0;
}

.dashboard-stock-item__title,
.dashboard-stock-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  gap: 10px;
}

.dashboard-stock-item__title strong {
  overflow: hidden;
  color: var(--oc-text);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-stock-item p {
  margin: 4px 0 9px;
  color: var(--oc-text-muted);
  font-size: 12px;
}

.dashboard-stock-meter {
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(119, 129, 143, 0.24);
}

.dashboard-stock-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--oc-primary);
}

.dashboard-stock-item__meta {
  margin-top: 7px;
  color: var(--oc-text-muted);
  font-size: 12px;
}

:deep(.el-loading-mask) {
  background-color: rgba(7, 11, 16, 0.58);
}

:deep(.el-empty__description p) {
  color: var(--oc-text-muted);
}

@media (max-width: 1280px) {
  .dashboard-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-main-grid,
  .dashboard-bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .dashboard-stat-grid,
  .dashboard-quick-grid,
  .dashboard-status-layout {
    grid-template-columns: 1fr;
  }

  .dashboard-stat-card__value {
    font-size: 28px;
  }

  .dashboard-donut {
    justify-self: center;
  }

  .dashboard-panel__header,
  .dashboard-stock-item__title,
  .dashboard-stock-item__meta {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
