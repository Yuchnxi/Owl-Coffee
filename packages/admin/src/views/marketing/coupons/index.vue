<template>
  <section class="admin-page coupons-view" aria-label="优惠券管理">
    <section class="coupons-search">
      <el-form class="coupons-search__form" :model="searchForm" inline>
        <el-form-item label="优惠券名称">
          <el-input v-model.trim="searchForm.name" placeholder="请输入优惠券名称" clearable />
        </el-form-item>
        <el-form-item label="优惠券类型">
          <el-select v-model="searchForm.couponType" placeholder="全部类型" clearable>
            <el-option label="满减券" value="discountAmount" />
            <el-option label="折扣券" value="discountRate" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.couponStatus" placeholder="全部状态" clearable>
            <el-option label="未开始" value="notStarted" />
            <el-option label="生效中" value="active" />
            <el-option label="已结束" value="ended" />
            <el-option label="已停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="searchForm.validRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="coupons-operations">
      <div class="coupons-operations__left">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增</el-button>
        <el-button :icon="Edit" :disabled="selectedRows.length !== 1" @click="openEditDialog(selectedRows[0])">
          编辑
        </el-button>
      </div>
      <div class="coupons-operations__right">
        <el-button :icon="Refresh" :loading="loading" @click="loadCoupons">刷新</el-button>
      </div>
    </section>

    <section class="coupons-table">
      <el-table
        v-loading="loading"
        :data="coupons"
        height="100%"
        empty-text="暂无优惠券"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column prop="name" label="优惠券名称" min-width="160" align="center" show-overflow-tooltip />
        <el-table-column label="类型" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="row.couponType === 'discountAmount' ? 'warning' : 'success'">
              {{ getCouponTypeLabel(row.couponType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用门槛" min-width="110" align="center">
          <template #default="{ row }">
            <span class="coupons-money">￥{{ formatAmount(row.thresholdAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="优惠内容" min-width="120" align="center">
          <template #default="{ row }">
            <span class="coupons-discount">{{ getDiscountText(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalQuantity" label="发放数量" min-width="100" align="center" />
        <el-table-column prop="usedQuantity" label="已使用" min-width="90" align="center" />
        <el-table-column prop="remainingQuantity" label="剩余数量" min-width="100" align="center" />
        <el-table-column prop="limitPerUser" label="每人限领" min-width="100" align="center" />
        <el-table-column label="有效期" min-width="350" align="center">
          <template #default="{ row }">
            {{ formatTime(row.validStartAt) }} 至 {{ formatTime(row.validEndAt) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="getStatusType(row.couponStatus)">
              {{ getStatusLabel(row.couponStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="170" align="center">
          <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="250" fixed="right" align="center">
          <template #default="{ row }">
            <div class="coupons-actions">
              <el-button link type="primary" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
              <el-button
                link
                type="warning"
                :icon="SwitchButton"
                :disabled="row.couponStatus === 'disabled'"
                @click="handleDisable(row)"
              >
                停用
              </el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="coupons-pagination">
      <span class="admin-pagination__total">共 {{ pagination.total }} 条</span>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="sizes, prev, pager, next, jumper"
        prev-text="上一页"
        next-text="下一页"
        @size-change="loadCoupons"
        @current-change="loadCoupons"
      />
    </section>

    <CouponFormDialog
      v-model:visible="couponDialog.visible"
      :mode="couponDialog.mode"
      :coupon="editingCoupon"
      :submitting="couponDialog.submitting"
      @submit="submitCouponForm"
    />
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import {
  Delete,
  Edit,
  Plus,
  Refresh,
  Search,
  SwitchButton
} from '@element-plus/icons-vue'
import {
  createCoupon,
  deleteCoupon,
  disableCoupon,
  fetchCoupons,
  updateCoupon
} from '../../../api/coupon'
import CouponFormDialog from './childComps/CouponFormDialog.vue'

// 页面加载状态
const loading = ref(false)
// 优惠券列表
const coupons = ref([])
// 表格勾选优惠券
const selectedRows = ref([])
// 当前编辑的优惠券
const editingCoupon = ref(null)

// 搜索表单
const searchForm = reactive({
  name: '',
  couponType: '',
  couponStatus: '',
  validRange: []
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 优惠券弹窗状态
const couponDialog = reactive({
  visible: false,
  mode: 'create',
  submitting: false
})

// 加载优惠券列表
async function loadCoupons() {
  loading.value = true

  try {
    const result = await fetchCoupons({
      page: pagination.page,
      pageSize: pagination.pageSize,
      name: searchForm.name || undefined,
      couponType: searchForm.couponType || undefined,
      couponStatus: searchForm.couponStatus || undefined,
      startTime: searchForm.validRange?.[0] || undefined,
      endTime: searchForm.validRange?.[1] || undefined
    })

    coupons.value = Array.isArray(result?.list) ? result.list : []
    pagination.total = Number(result?.pagination?.total) || 0
    pagination.page = Number(result?.pagination?.page) || pagination.page
    pagination.pageSize = Number(result?.pagination?.pageSize) || pagination.pageSize
  } finally {
    loading.value = false
  }
}

// 查询优惠券列表
function handleSearch() {
  pagination.page = 1
  loadCoupons()
}

// 重置搜索条件
function handleResetSearch() {
  searchForm.name = ''
  searchForm.couponType = ''
  searchForm.couponStatus = ''
  searchForm.validRange = []
  pagination.page = 1
  loadCoupons()
}

// 记录表格勾选优惠券
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 打开新增弹窗
function openCreateDialog() {
  editingCoupon.value = null
  couponDialog.mode = 'create'
  couponDialog.visible = true
}

// 打开编辑弹窗
function openEditDialog(row) {
  if (!row) {
    return
  }

  editingCoupon.value = row
  couponDialog.mode = 'edit'
  couponDialog.visible = true
}

// 提交优惠券表单
async function submitCouponForm(form) {
  couponDialog.submitting = true

  try {
    if (couponDialog.mode === 'create') {
      await createCoupon(form)
      ElMessage.success('优惠券已新增')
    } else {
      await updateCoupon(editingCoupon.value.id, form)
      ElMessage.success('优惠券已更新')
    }

    couponDialog.visible = false
    selectedRows.value = []
    await loadCoupons()
  } finally {
    couponDialog.submitting = false
  }
}

// 停用优惠券
async function handleDisable(row) {
  try {
    await ElMessageBox.confirm(`确认停用优惠券「${row.name}」吗？`, '停用确认', {
      confirmButtonText: '确认停用',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (err) {
    return
  }

  await disableCoupon(row.id)
  ElMessage.success('优惠券已停用')
  selectedRows.value = []
  await loadCoupons()
}

// 删除优惠券
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除优惠券「${row.name}」吗？删除后列表不再展示。`, '删除确认', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (err) {
    return
  }

  await deleteCoupon(row.id)
  ElMessage.success('优惠券已删除')
  selectedRows.value = []
  await loadCoupons()
}

// 获取优惠券类型文案
function getCouponTypeLabel(type) {
  const map = {
    discountAmount: '满减券',
    discountRate: '折扣券'
  }

  return map[type] || '待补充'
}

// 获取优惠内容文案
function getDiscountText(row) {
  if (row.couponType === 'discountRate') {
    return `${formatAmount(row.discountRate)} 折`
  }

  return `减 ￥${formatAmount(row.discountAmount)}`
}

// 获取状态文案
function getStatusLabel(status) {
  const map = {
    notStarted: '未开始',
    active: '生效中',
    ended: '已结束',
    disabled: '已停用'
  }

  return map[status] || '待补充'
}

// 获取状态标签类型
function getStatusType(status) {
  const map = {
    notStarted: 'info',
    active: 'success',
    ended: 'warning',
    disabled: 'danger'
  }

  return map[status] || 'info'
}

// 格式化金额
function formatAmount(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '0.00'
  }

  return number.toFixed(2)
}

// 格式化时间
function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '待补充'
}

onMounted(() => {
  loadCoupons()
})
</script>

<style scoped>
.coupons-view {
  height: 100%;
  max-width: 100%;
  gap: 14px;
  overflow: hidden;
}

.coupons-search,
.coupons-operations,
.coupons-table,
.coupons-pagination {
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.coupons-search {
  flex: 0 0 auto;
}

.coupons-search__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
}

.coupons-search__form :deep(.el-form-item) {
  margin: 0;
}

.coupons-search__form :deep(.el-form-item__label) {
  color: var(--oc-text);
}

.coupons-search__form :deep(.el-input),
.coupons-search__form :deep(.el-select) {
  width: 168px;
}

.coupons-search__form :deep(.el-date-editor) {
  width: 360px;
}

.coupons-operations {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.coupons-operations__left,
.coupons-operations__right,
.coupons-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.coupons-table {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.coupons-pagination {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.coupons-money,
.coupons-discount {
  color: var(--oc-primary);
  font-weight: 800;
}

.coupons-view :deep(.el-dialog) {
  border: 1px solid var(--oc-border);
  background: var(--oc-panel-solid);
}

@media (max-width: 980px) {
  .coupons-view {
    overflow: auto;
  }

  .coupons-table {
    min-height: 420px;
  }

  .coupons-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
