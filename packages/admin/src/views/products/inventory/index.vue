<template>
  <section class="admin-page inventory-view" aria-label="库存管理">
    <section class="inventory-search">
      <el-form class="inventory-search__form" :model="searchForm" inline>
        <el-form-item label="商品名称">
          <el-input v-model.trim="searchForm.productName" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item label="SKU / 规格">
          <el-input v-model.trim="searchForm.skuKeyword" placeholder="请输入 SKU 或规格" clearable />
        </el-form-item>
        <el-form-item label="库存状态">
          <el-select v-model="searchForm.stockStatus" placeholder="全部库存" clearable>
            <el-option label="正常" value="normal" />
            <el-option label="库存不足" value="lowStock" />
            <el-option label="售罄" value="soldOut" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品状态">
          <el-select v-model="searchForm.productStatus" placeholder="全部状态" clearable>
            <el-option label="上架" value="onSale" />
            <el-option label="下架" value="offSale" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadInventorySkus">查询</el-button>
          <el-button :icon="Refresh" @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="inventory-operations">
      <div class="inventory-operations__left">
        <el-button type="primary" :icon="Box" :disabled="selectedRows.length !== 1" @click="openAdjustDialog(selectedRows[0])">
          调整库存
        </el-button>
        <el-button :icon="Tickets" :disabled="selectedRows.length !== 1" @click="openLogDialog(selectedRows[0])">
          调整记录
        </el-button>
      </div>
      <div class="inventory-operations__right">
        <el-button :icon="Refresh" :loading="loading" @click="loadInventorySkus">刷新</el-button>
      </div>
    </section>

    <section class="inventory-table">
      <el-table
        v-loading="loading"
        :data="inventorySkus"
        height="100%"
        empty-text="暂无库存"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column prop="productName" label="商品名称" min-width="150" align="center" show-overflow-tooltip />
        <el-table-column prop="skuCode" label="SKU 编码" min-width="150" align="center" show-overflow-tooltip />
        <el-table-column prop="specText" label="规格" min-width="170" align="center" show-overflow-tooltip />
        <el-table-column label="商品状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="row.productStatus === 'onSale' ? 'success' : 'info'">
              {{ getProductStatusLabel(row.productStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="SKU 状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="row.skuStatus === 'enabled' ? 'success' : 'info'">
              {{ row.skuStatus === 'enabled' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前库存" min-width="100" align="center">
          <template #default="{ row }">
            <span class="inventory-stock">{{ row.stock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="warningStock" label="预警库存" min-width="100" align="center" />
        <el-table-column label="库存状态" min-width="110" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="getStockStatusType(row.stockStatus)">
              {{ getStockStatusLabel(row.stockStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="170" align="center">
          <template #default="{ row }">
            {{ row.updatedAt ? $dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="inventory-actions">
              <el-button link type="primary" :icon="Box" @click="openAdjustDialog(row)">调整</el-button>
              <el-button link type="primary" :icon="Tickets" @click="openLogDialog(row)">记录</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="inventory-pagination">
      <span class="admin-pagination__total">共 {{ inventorySkus.length }} 条</span>
    </section>

    <InventoryAdjustDialog
      v-model:visible="adjustDialog.visible"
      :sku="currentSku"
      :submitting="adjustDialog.submitting"
      @submit="submitAdjustment"
    />

    <InventoryLogDialog
      v-model:visible="logDialog.visible"
      :sku="currentSku"
      :logs="inventoryLogs"
      :loading="logDialog.loading"
    />
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Box, Refresh, Search, Tickets } from '@element-plus/icons-vue'
import {
  adjustInventory,
  fetchInventoryAdjustments,
  fetchInventorySkus
} from '../../../api/inventory'
import InventoryAdjustDialog from './childComps/InventoryAdjustDialog.vue'
import InventoryLogDialog from './childComps/InventoryLogDialog.vue'

// 页面加载状态
const loading = ref(false)
// SKU 库存列表
const inventorySkus = ref([])
// 表格勾选库存行
const selectedRows = ref([])
// 当前操作的 SKU
const currentSku = ref(null)
// 库存调整记录
const inventoryLogs = ref([])

// 搜索表单
const searchForm = reactive({
  productName: '',
  skuKeyword: '',
  stockStatus: '',
  productStatus: ''
})

// 库存调整弹窗状态
const adjustDialog = reactive({
  visible: false,
  submitting: false
})

// 库存记录弹窗状态
const logDialog = reactive({
  visible: false,
  loading: false
})

// 加载 SKU 库存列表
async function loadInventorySkus() {
  loading.value = true

  try {
    const result = await fetchInventorySkus({
      productName: searchForm.productName || undefined,
      skuKeyword: searchForm.skuKeyword || undefined,
      stockStatus: searchForm.stockStatus || undefined,
      productStatus: searchForm.productStatus || undefined
    })

    inventorySkus.value = Array.isArray(result?.list) ? result.list : []
  } finally {
    loading.value = false
  }
}

// 重置搜索条件
function handleResetSearch() {
  searchForm.productName = ''
  searchForm.skuKeyword = ''
  searchForm.stockStatus = ''
  searchForm.productStatus = ''
  loadInventorySkus()
}

// 记录表格勾选库存行
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 打开库存调整弹窗
function openAdjustDialog(row) {
  if (!row) {
    return
  }

  currentSku.value = row
  adjustDialog.visible = true
}

// 打开库存记录弹窗
async function openLogDialog(row) {
  if (!row) {
    return
  }

  currentSku.value = row
  logDialog.visible = true
  logDialog.loading = true
  inventoryLogs.value = []

  try {
    const result = await fetchInventoryAdjustments({
      skuId: row.skuId
    })

    inventoryLogs.value = Array.isArray(result?.list) ? result.list : []
  } finally {
    logDialog.loading = false
  }
}

// 提交库存调整
async function submitAdjustment(form) {
  adjustDialog.submitting = true

  try {
    await adjustInventory(form)
    ElMessage.success('库存已调整')
    adjustDialog.visible = false
    await loadInventorySkus()
  } finally {
    adjustDialog.submitting = false
  }
}

// 获取商品状态文案
function getProductStatusLabel(status) {
  return status === 'onSale' ? '上架' : '下架'
}

// 获取库存状态文案
function getStockStatusLabel(status) {
  const map = {
    normal: '正常',
    lowStock: '库存不足',
    soldOut: '售罄'
  }

  return map[status] || '待补充'
}

// 获取库存状态标签类型
function getStockStatusType(status) {
  const map = {
    normal: 'success',
    lowStock: 'warning',
    soldOut: 'danger'
  }

  return map[status] || 'info'
}

onMounted(() => {
  loadInventorySkus()
})
</script>

<style scoped>
.inventory-view {
  height: 100%;
  max-width: 100%;
  gap: 14px;
  overflow: hidden;
}

.inventory-search,
.inventory-operations,
.inventory-table,
.inventory-pagination {
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.inventory-search {
  flex: 0 0 auto;
}

.inventory-search__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
}

.inventory-search__form :deep(.el-form-item) {
  margin: 0;
}

.inventory-search__form :deep(.el-form-item__label) {
  color: var(--oc-text);
}

.inventory-search__form :deep(.el-input),
.inventory-search__form :deep(.el-select) {
  width: 168px;
}

.inventory-operations {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.inventory-operations__left,
.inventory-operations__right,
.inventory-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.inventory-table {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.inventory-pagination {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.inventory-stock {
  color: var(--oc-primary);
  font-weight: 800;
}

.inventory-view :deep(.el-dialog) {
  border: 1px solid var(--oc-border);
  background: var(--oc-panel-solid);
}

@media (max-width: 980px) {
  .inventory-view {
    overflow: auto;
  }

  .inventory-table {
    min-height: 420px;
  }

  .inventory-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
