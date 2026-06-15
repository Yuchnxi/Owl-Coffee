<template>
  <el-dialog v-model="dialogVisible" title="订单详情" width="860px" destroy-on-close>
    <div v-if="order" class="order-detail">
      <el-descriptions title="基础信息" :column="2" border>
        <el-descriptions-item label="订单编号">{{ order.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="订单来源">{{ getOrderSourceLabel(order.orderSource) }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ order.userName || '待补充' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ order.phone || '待补充' }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">{{ getOrderStatusLabel(order.orderStatus) }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">{{ getPaymentStatusLabel(order.paymentStatus) }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ order.paymentMethod || '待补充' }}</el-descriptions-item>
        <el-descriptions-item label="取餐码">{{ order.pickupCode || '待补充' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ order.remark || '待补充' }}</el-descriptions-item>
      </el-descriptions>

      <section class="order-detail__section">
        <h3>商品明细</h3>
        <el-table :data="order.items || []" border empty-text="暂无商品明细">
          <el-table-column label="商品" min-width="170" align="center">
            <template #default="{ row }">{{ row.productName || '待补充' }}</template>
          </el-table-column>
          <el-table-column label="规格" min-width="180" align="center">
            <template #default="{ row }">{{ formatSkuText(row) }}</template>
          </el-table-column>
          <el-table-column label="单价" min-width="100" align="center">
            <template #default="{ row }">￥{{ formatMoney(row.unitPrice) }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" min-width="80" align="center" />
          <el-table-column label="小计" min-width="110" align="center">
            <template #default="{ row }">
              <span class="order-detail__money">￥{{ formatMoney(row.subtotalAmount) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section class="order-detail__section">
        <el-descriptions title="金额与时间" :column="2" border>
          <el-descriptions-item label="商品金额">￥{{ formatMoney(order.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="优惠金额">￥{{ formatMoney(order.discountAmount) }}</el-descriptions-item>
          <el-descriptions-item label="实付金额">￥{{ formatMoney(order.payAmount) }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatDateTime(order.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ formatDateTime(order.paidAt) }}</el-descriptions-item>
          <el-descriptions-item label="制作时间">{{ formatDateTime(order.makingAt) }}</el-descriptions-item>
          <el-descriptions-item label="出餐时间">{{ formatDateTime(order.readyAt) }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ formatDateTime(order.completedAt) }}</el-descriptions-item>
          <el-descriptions-item label="取消时间">{{ formatDateTime(order.cancelledAt) }}</el-descriptions-item>
          <el-descriptions-item label="退款时间">{{ formatDateTime(order.refundedAt) }}</el-descriptions-item>
        </el-descriptions>
      </section>
    </div>

    <template #footer>
      <el-button type="primary" @click="dialogVisible = false">知道了</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  order: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible'])

// 弹窗显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

// 格式化金额
function formatMoney(value) {
  return Number(value || 0).toFixed(2)
}

// 格式化日期时间
function formatDateTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '待补充'
}

// 格式化 SKU 规格
function formatSkuText(item) {
  return [item.temperature, item.cupSize, item.sugarLevel].filter(Boolean).join(' / ') || '待补充'
}

// 获取订单状态文案
function getOrderStatusLabel(status) {
  const map = {
    pendingPayment: '待付款',
    paid: '已付款',
    making: '制作中',
    readyForPickup: '待取餐',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  }

  return map[status] || '待补充'
}

// 获取支付状态文案
function getPaymentStatusLabel(status) {
  const map = {
    unpaid: '未支付',
    paid: '已支付',
    refunded: '已退款'
  }

  return map[status] || '待补充'
}

// 获取订单来源文案
function getOrderSourceLabel(source) {
  const map = {
    app: '小程序',
    admin: '后台补单'
  }

  return map[source] || '待补充'
}
</script>

<style scoped>
.order-detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.order-detail__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-detail__section h3 {
  margin: 0;
  color: var(--oc-text);
  font-size: 15px;
  font-weight: 700;
}

.order-detail__money {
  color: var(--oc-primary);
  font-weight: 700;
}
</style>
