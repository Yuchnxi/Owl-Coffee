<template>
  <section class="admin-page orders-view" aria-label="订单管理">
    <section class="orders-search">
      <el-form class="orders-search__form" :model="searchForm" inline>
        <el-form-item label="订单编号">
          <el-input v-model.trim="searchForm.orderNo" placeholder="请输入订单编号" clearable />
        </el-form-item>
        <el-form-item label="用户信息">
          <el-input v-model.trim="searchForm.userKeyword" placeholder="姓名或手机号" clearable />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.orderStatus" placeholder="全部状态" clearable>
            <el-option v-for="item in orderStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="searchForm.paymentStatus" placeholder="全部支付" clearable>
            <el-option v-for="item in paymentStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单来源">
          <el-select v-model="searchForm.orderSource" placeholder="全部来源" clearable>
            <el-option label="小程序" value="app" />
            <el-option label="后台补单" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="至"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="orders-operations">
      <div class="orders-operations__left">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增</el-button>
      </div>
      <div class="orders-operations__right">
        <el-button :icon="Refresh" :loading="loading" @click="loadOrders">刷新</el-button>
      </div>
    </section>

    <section class="orders-table">
      <el-table v-loading="loading" :data="orders" height="100%" empty-text="暂无订单">
        <el-table-column prop="orderNo" label="订单编号" min-width="170" align="center" show-overflow-tooltip />
        <el-table-column label="用户" min-width="120" align="center">
          <template #default="{ row }">{{ row.userName || '待补充' }}</template>
        </el-table-column>
        <el-table-column label="手机号" min-width="130" align="center">
          <template #default="{ row }">{{ row.phone || '待补充' }}</template>
        </el-table-column>
        <el-table-column label="商品金额" min-width="110" align="center">
          <template #default="{ row }">
            <span class="order-money">￥{{ formatMoney(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="优惠" min-width="100" align="center">
          <template #default="{ row }">￥{{ formatMoney(row.discountAmount) }}</template>
        </el-table-column>
        <el-table-column label="实付" min-width="110" align="center">
          <template #default="{ row }">
            <span class="order-money">￥{{ formatMoney(row.payAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" min-width="110" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="getOrderStatusType(row.orderStatus)">
              {{ getOrderStatusLabel(row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" min-width="110" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="getPaymentStatusType(row.paymentStatus)">
              {{ getPaymentStatusLabel(row.paymentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" min-width="100" align="center">
          <template #default="{ row }">{{ getOrderSourceLabel(row.orderSource) }}</template>
        </el-table-column>
        <el-table-column label="下单时间" min-width="170" align="center">
          <template #default="{ row }">
            {{ row.createdAt ? $dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="orders-actions">
              <el-button link type="primary" :icon="View" @click="openDetailDialog(row)">详情</el-button>
              <el-button
                v-if="getNextOrderStatus(row)"
                link
                type="success"
                :icon="SwitchButton"
                @click="handleUpdateStatus(row)"
              >
                {{ getNextOrderStatus(row).action }}
              </el-button>
              <el-button
                v-if="canCancelOrder(row)"
                link
                type="warning"
                :icon="Close"
                @click="handleCancel(row)"
              >
                取消
              </el-button>
              <el-dropdown trigger="click" @command="command => handleMoreCommand(command, row)">
                <el-button link>
                  更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="refund" :disabled="!canRefundOrder(row)">退款</el-dropdown-item>
                    <el-dropdown-item command="delete">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="orders-pagination">
      <span class="admin-pagination__total">共 {{ pagination.total }} 条</span>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="sizes, prev, pager, next, jumper"
        prev-text="上一页"
        next-text="下一页"
        @size-change="loadOrders"
        @current-change="loadOrders"
      />
    </section>

    <OrderFormDialog
      v-model:visible="orderDialog.visible"
      :submitting="orderDialog.submitting"
      @submit="submitOrderForm"
    />

    <OrderDetailDialog v-model:visible="detailDialog.visible" :order="currentOrder" />
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  Close,
  Plus,
  Refresh,
  Search,
  SwitchButton,
  View
} from '@element-plus/icons-vue'
import {
  cancelOrder,
  createOrder,
  deleteOrder,
  fetchOrderDetail,
  fetchOrders,
  refundOrder,
  updateOrderStatus
} from '../../api/order'
import OrderDetailDialog from './childComps/OrderDetailDialog.vue'
import OrderFormDialog from './childComps/OrderFormDialog.vue'

// 页面加载状态
const loading = ref(false)
// 订单列表
const orders = ref([])
// 当前查看的订单
const currentOrder = ref(null)

// 搜索表单
const searchForm = reactive({
  orderNo: '',
  userKeyword: '',
  orderStatus: '',
  paymentStatus: '',
  orderSource: '',
  dateRange: []
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 补单弹窗状态
const orderDialog = reactive({
  visible: false,
  submitting: false
})

// 详情弹窗状态
const detailDialog = reactive({
  visible: false
})

// 订单状态选项
const orderStatusOptions = [
  { label: '待付款', value: 'pendingPayment' },
  { label: '已付款', value: 'paid' },
  { label: '制作中', value: 'making' },
  { label: '待取餐', value: 'readyForPickup' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
  { label: '已退款', value: 'refunded' }
]

// 支付状态选项
const paymentStatusOptions = [
  { label: '未支付', value: 'unpaid' },
  { label: '已支付', value: 'paid' },
  { label: '已退款', value: 'refunded' }
]

// 加载订单列表
async function loadOrders() {
  loading.value = true

  try {
    const result = await fetchOrders({
      page: pagination.page,
      pageSize: pagination.pageSize,
      orderNo: searchForm.orderNo || undefined,
      userKeyword: searchForm.userKeyword || undefined,
      orderStatus: searchForm.orderStatus || undefined,
      paymentStatus: searchForm.paymentStatus || undefined,
      orderSource: searchForm.orderSource || undefined,
      startTime: searchForm.dateRange?.[0] || undefined,
      endTime: searchForm.dateRange?.[1] || undefined
    })

    orders.value = Array.isArray(result?.list) ? result.list : []
    pagination.total = Number(result?.pagination?.total) || 0
  } finally {
    loading.value = false
  }
}

// 执行搜索
function handleSearch() {
  pagination.page = 1
  loadOrders()
}

// 重置搜索条件
function handleResetSearch() {
  searchForm.orderNo = ''
  searchForm.userKeyword = ''
  searchForm.orderStatus = ''
  searchForm.paymentStatus = ''
  searchForm.orderSource = ''
  searchForm.dateRange = []
  handleSearch()
}

// 打开补单弹窗
function openCreateDialog() {
  orderDialog.visible = true
}

// 打开订单详情弹窗
async function openDetailDialog(row) {
  currentOrder.value = await fetchOrderDetail(row.id)
  detailDialog.visible = true
}

// 提交后台补单
async function submitOrderForm(form) {
  orderDialog.submitting = true

  try {
    await createOrder({
      userName: form.userName || '',
      phone: form.phone || '',
      orderSource: 'admin',
      items: form.items.map(item => ({
        skuId: item.skuId,
        quantity: Number(item.quantity)
      })),
      discountAmount: Number(form.discountAmount) || 0,
      remark: form.remark || ''
    })
    ElMessage.success('订单已新增')
    orderDialog.visible = false
    await loadOrders()
  } finally {
    orderDialog.submitting = false
  }
}

// 更新订单制作状态
async function handleUpdateStatus(row) {
  const nextStatus = getNextOrderStatus(row)

  if (!nextStatus) {
    return
  }

  try {
    await ElMessageBox.confirm(`确认将订单「${row.orderNo}」更新为${nextStatus.label}吗？`, '更新订单状态', {
      type: 'warning',
      confirmButtonText: '确认更新',
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }

  await updateOrderStatus(row.id, nextStatus.value)
  ElMessage.success('订单状态已更新')
  await loadOrders()
}

// 取消订单
async function handleCancel(row) {
  try {
    await ElMessageBox.confirm(`确认取消订单「${row.orderNo}」吗？`, '取消订单', {
      type: 'warning',
      confirmButtonText: '确认取消',
      cancelButtonText: '返回'
    })
  } catch (err) {
    return
  }

  await cancelOrder(row.id)
  ElMessage.success('订单已取消')
  await loadOrders()
}

// 标记订单退款
async function handleRefund(row) {
  try {
    await ElMessageBox.confirm(`确认将订单「${row.orderNo}」标记为退款吗？库存将同步回补。`, '订单退款', {
      type: 'warning',
      confirmButtonText: '确认退款',
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }

  await refundOrder(row.id)
  ElMessage.success('订单已退款')
  await loadOrders()
}

// 删除订单
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`删除后订单「${row.orderNo}」将不再显示，确认删除吗？`, '删除订单', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }

  await deleteOrder(row.id)
  ElMessage.success('订单已删除')

  if (orders.value.length === 1 && pagination.page > 1) {
    pagination.page -= 1
  }

  await loadOrders()
}

// 处理更多操作
function handleMoreCommand(command, row) {
  if (command === 'refund') {
    handleRefund(row)
    return
  }

  if (command === 'delete') {
    handleDelete(row)
  }
}

// 获取下一步制作状态
function getNextOrderStatus(order) {
  const map = {
    paid: { value: 'making', label: '制作中', action: '制作' },
    making: { value: 'readyForPickup', label: '待取餐', action: '出餐' },
    readyForPickup: { value: 'completed', label: '已完成', action: '完成' }
  }

  if (order.paymentStatus !== 'paid') {
    return null
  }

  return map[order.orderStatus] || null
}

// 判断订单是否可取消
function canCancelOrder(order) {
  return order.orderStatus === 'pendingPayment' && order.paymentStatus === 'unpaid'
}

// 判断订单是否可退款
function canRefundOrder(order) {
  return ['paid', 'making', 'readyForPickup'].includes(order.orderStatus) && order.paymentStatus === 'paid'
}

// 格式化金额
function formatMoney(value) {
  return Number(value || 0).toFixed(2)
}

// 获取订单状态文案
function getOrderStatusLabel(status) {
  const map = Object.fromEntries(orderStatusOptions.map(item => [item.value, item.label]))
  return map[status] || '待补充'
}

// 获取订单状态标签类型
function getOrderStatusType(status) {
  const map = {
    pendingPayment: 'warning',
    paid: 'success',
    making: 'primary',
    readyForPickup: 'warning',
    completed: 'success',
    cancelled: 'info',
    refunded: 'danger'
  }

  return map[status] || 'info'
}

// 获取支付状态文案
function getPaymentStatusLabel(status) {
  const map = Object.fromEntries(paymentStatusOptions.map(item => [item.value, item.label]))
  return map[status] || '待补充'
}

// 获取支付状态标签类型
function getPaymentStatusType(status) {
  const map = {
    unpaid: 'warning',
    paid: 'success',
    refunded: 'danger'
  }

  return map[status] || 'info'
}

// 获取订单来源文案
function getOrderSourceLabel(source) {
  const map = {
    app: '小程序',
    admin: '后台补单'
  }

  return map[source] || '待补充'
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.orders-view {
  height: 100%;
  max-width: 100%;
  gap: 14px;
  overflow: hidden;
}

.orders-search,
.orders-operations,
.orders-table,
.orders-pagination {
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.orders-search {
  flex: 0 0 auto;
}

.orders-search__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
}

.orders-search__form :deep(.el-form-item) {
  margin: 0;
}

.orders-search__form :deep(.el-form-item__label) {
  color: var(--oc-text);
}

.orders-search__form :deep(.el-input),
.orders-search__form :deep(.el-select) {
  width: 168px;
}

.orders-search__form :deep(.el-date-editor) {
  width: 360px;
}

.orders-operations {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.orders-operations__left,
.orders-operations__right,
.orders-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.orders-table {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.orders-pagination {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.order-money {
  color: var(--oc-primary);
  font-weight: 700;
}
</style>
