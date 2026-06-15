<template>
  <el-dialog
    :model-value="visible"
    title="库存调整记录"
    width="920px"
    destroy-on-close
    @close="handleClose"
  >
    <div v-if="sku" class="inventory-log-summary">
      <span>{{ sku.productName || '待补充' }}</span>
      <strong>{{ sku.skuCode || '待补充' }}</strong>
      <em>{{ sku.specText || '待补充' }}</em>
    </div>

    <el-table v-loading="loading" :data="logs" max-height="460" border empty-text="暂无调整记录">
      <el-table-column label="变更类型" min-width="110" align="center">
        <template #default="{ row }">
          <el-tag effect="dark" :type="getChangeTypeTag(row.changeType)">
            {{ getChangeTypeLabel(row.changeType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="变更数量" min-width="100" align="center">
        <template #default="{ row }">
          <span :class="getChangeQuantityClass(row.changeQuantity)">
            {{ formatChangeQuantity(row.changeQuantity) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="beforeStock" label="调整前" min-width="90" align="center" />
      <el-table-column prop="afterStock" label="调整后" min-width="90" align="center" />
      <el-table-column label="关联订单" min-width="150" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ row.relatedOrderId || '待补充' }}</template>
      </el-table-column>
      <el-table-column label="原因" min-width="180" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ row.reason || '待补充' }}</template>
      </el-table-column>
      <el-table-column label="操作时间" min-width="170" align="center">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <template #footer>
      <el-button type="primary" @click="handleClose">知道了</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import dayjs from 'dayjs'

defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  sku: {
    type: Object,
    default: null
  },
  logs: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

// 关闭调整记录弹窗
function handleClose() {
  emit('update:visible', false)
}

// 获取变更类型文案
function getChangeTypeLabel(type) {
  const map = {
    in: '入库',
    out: '出库',
    check: '盘点',
    order_deduct: '订单扣减',
    order_refund: '退款回补'
  }

  return map[type] || '待补充'
}

// 获取变更类型标签样式
function getChangeTypeTag(type) {
  const map = {
    in: 'success',
    out: 'warning',
    check: 'primary',
    order_deduct: 'danger',
    order_refund: 'success'
  }

  return map[type] || 'info'
}

// 格式化变更数量
function formatChangeQuantity(value) {
  const quantity = Number(value) || 0

  return quantity > 0 ? `+${quantity}` : String(quantity)
}

// 获取变更数量样式
function getChangeQuantityClass(value) {
  const quantity = Number(value) || 0

  if (quantity > 0) {
    return 'inventory-log-quantity inventory-log-quantity--up'
  }

  if (quantity < 0) {
    return 'inventory-log-quantity inventory-log-quantity--down'
  }

  return 'inventory-log-quantity'
}

// 格式化日期时间
function formatDateTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '待补充'
}
</script>

<style scoped>
.inventory-log-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  margin-bottom: 14px;
  color: var(--oc-text-secondary);
}

.inventory-log-summary span {
  color: var(--oc-text);
  font-weight: 700;
}

.inventory-log-summary strong {
  color: var(--oc-primary);
}

.inventory-log-summary em {
  color: var(--oc-text-muted);
  font-style: normal;
}

.inventory-log-quantity {
  color: var(--oc-text);
  font-weight: 800;
}

.inventory-log-quantity--up {
  color: #69db7c;
}

.inventory-log-quantity--down {
  color: #ff8787;
}
</style>
