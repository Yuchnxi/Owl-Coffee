<template>
  <section class="admin-page products-view" aria-label="商品管理">
    <section class="products-search">
      <el-form class="products-search__form" :model="searchForm" inline>
        <el-form-item label="商品名称">
          <el-input v-model.trim="searchForm.name" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="全部分类" clearable>
            <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品状态">
          <el-select v-model="searchForm.productStatus" placeholder="全部状态" clearable>
            <el-option label="上架" value="onSale" />
            <el-option label="下架" value="offSale" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存状态">
          <el-select v-model="searchForm.stockStatus" placeholder="全部库存" clearable>
            <el-option label="正常" value="normal" />
            <el-option label="库存不足" value="lowStock" />
            <el-option label="售罄" value="soldOut" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="products-operations">
      <div class="products-operations__left">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增</el-button>
        <el-button :icon="Edit" :disabled="selectedRows.length !== 1" @click="openEditDialog(selectedRows[0])">
          编辑
        </el-button>
      </div>
      <div class="products-operations__right">
        <el-button :icon="Refresh" :loading="loading" @click="loadProducts">刷新</el-button>
      </div>
    </section>

    <section class="products-table">
      <el-table
        v-loading="loading"
        :data="products"
        height="100%"
        empty-text="暂无商品"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column label="商品图片" width="96" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrl"
              class="product-cover"
              :src="resolveAssetUrl(row.imageUrl)"
              fit="cover"
              :preview-src-list="[resolveAssetUrl(row.imageUrl)]"
              preview-teleported
            />
            <span v-else class="product-cover product-cover--empty">待补充</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="150" align="center" show-overflow-tooltip />
        <el-table-column label="分类" min-width="110" align="center">
          <template #default="{ row }">{{ row.categoryName || '待补充' }}</template>
        </el-table-column>
        <el-table-column label="起售价" min-width="100" align="center">
          <template #default="{ row }">
            <span class="product-price">¥{{ formatMoney(row.minPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="skuCount" label="SKU 数" min-width="90" align="center" />
        <el-table-column prop="totalStock" label="总库存" min-width="90" align="center" />
        <el-table-column label="商品状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="row.productStatus === 'onSale' ? 'success' : 'info'">
              {{ getProductStatusLabel(row.productStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="库存状态" min-width="110" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="getStockStatusType(row.stockStatus)">
              {{ getStockStatusLabel(row.stockStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="推荐" min-width="80" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="row.isRecommended ? 'warning' : 'info'">
              {{ row.isRecommended ? '推荐' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" min-width="80" align="center" />
        <el-table-column label="更新时间" min-width="170" align="center">
          <template #default="{ row }">
            {{ row.updatedAt ? $dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="300" fixed="right" align="center">
          <template #default="{ row }">
            <div class="products-actions">
              <el-button link type="primary" :icon="View" @click="openDetailDialog(row)">详情</el-button>
              <el-button link type="primary" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
              <el-button
                link
                :type="row.productStatus === 'onSale' ? 'warning' : 'success'"
                :icon="SwitchButton"
                @click="handleToggleStatus(row)"
              >
                {{ row.productStatus === 'onSale' ? '下架' : '上架' }}
              </el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="products-pagination">
      <span class="admin-pagination__total">共 {{ pagination.total }} 条</span>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="sizes, prev, pager, next, jumper"
        prev-text="上一页"
        next-text="下一页"
        @size-change="loadProducts"
        @current-change="loadProducts"
      />
    </section>

    <ProductFormDialog
      v-model:visible="productDialog.visible"
      :mode="productDialog.mode"
      :product="editingProduct"
      :categories="enabledCategories"
      :submitting="productDialog.submitting"
      @submit="submitProductForm"
    />

    <ProductDetailDialog v-model:visible="detailDialog.visible" :product="currentProduct" />
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Delete,
  Edit,
  Plus,
  Refresh,
  Search,
  SwitchButton,
  View
} from '@element-plus/icons-vue'
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProductDetail,
  fetchProducts,
  updateProduct,
  updateProductStatus
} from '../../../api/product'
import ProductFormDialog from './childComps/ProductFormDialog.vue'
import ProductDetailDialog from './childComps/ProductDetailDialog.vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// 页面加载状态
const loading = ref(false)
// 商品列表
const products = ref([])
// 商品分类列表
const categories = ref([])
// 表格勾选商品
const selectedRows = ref([])
// 正在编辑的商品
const editingProduct = ref(null)
// 当前查看的商品
const currentProduct = ref(null)

// 搜索表单
const searchForm = reactive({
  name: '',
  categoryId: '',
  productStatus: '',
  stockStatus: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 商品弹窗状态
const productDialog = reactive({
  visible: false,
  mode: 'create',
  submitting: false
})

// 详情弹窗状态
const detailDialog = reactive({
  visible: false
})

// 启用分类列表
const enabledCategories = computed(() => categories.value.filter(category => category.status === 'enabled'))

// 加载商品列表
async function loadProducts() {
  loading.value = true

  try {
    const result = await fetchProducts({
      page: pagination.page,
      pageSize: pagination.pageSize,
      name: searchForm.name || undefined,
      categoryId: searchForm.categoryId || undefined,
      productStatus: searchForm.productStatus || undefined,
      stockStatus: searchForm.stockStatus || undefined
    })

    products.value = Array.isArray(result?.list) ? result.list : []
    pagination.total = Number(result?.pagination?.total) || 0
  } finally {
    loading.value = false
  }
}

// 加载商品分类
async function loadCategories() {
  const result = await fetchCategories()

  categories.value = Array.isArray(result?.list) ? result.list : []
}

// 执行搜索
function handleSearch() {
  pagination.page = 1
  loadProducts()
}

// 重置搜索条件
function handleResetSearch() {
  searchForm.name = ''
  searchForm.categoryId = ''
  searchForm.productStatus = ''
  searchForm.stockStatus = ''
  handleSearch()
}

// 记录表格勾选商品
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 打开新增商品弹窗
function openCreateDialog() {
  editingProduct.value = {
    categoryId: enabledCategories.value[0]?.id || '',
    productStatus: 'offSale',
    sort: 0,
    isRecommended: false,
    skus: []
  }
  productDialog.mode = 'create'
  productDialog.visible = true
}

// 打开编辑商品弹窗
async function openEditDialog(row) {
  if (!row) {
    return
  }

  editingProduct.value = await fetchProductDetail(row.id)
  productDialog.mode = 'edit'
  productDialog.visible = true
}

// 打开商品详情弹窗
async function openDetailDialog(row) {
  currentProduct.value = await fetchProductDetail(row.id)
  detailDialog.visible = true
}

// 提交商品表单
async function submitProductForm(form) {
  productDialog.submitting = true

  try {
    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      imageUrl: form.imageUrl || '',
      description: form.description || '',
      productStatus: form.productStatus,
      sort: Number(form.sort) || 0,
      isRecommended: Boolean(form.isRecommended),
      skus: form.skus.map(sku => ({
        temperature: sku.temperature,
        cupSize: sku.cupSize,
        sugarLevel: sku.sugarLevel,
        price: Number(sku.price),
        stock: Number(sku.stock),
        warningStock: Number(sku.warningStock),
        skuStatus: sku.skuStatus
      }))
    }

    if (productDialog.mode === 'create') {
      await createProduct(payload)
      ElMessage.success('商品已新增')
    } else {
      await updateProduct(form.id, payload)
      ElMessage.success('商品已更新')
    }

    productDialog.visible = false
    await loadProducts()
  } finally {
    productDialog.submitting = false
  }
}

// 切换商品上下架状态
async function handleToggleStatus(row) {
  const nextStatus = row.productStatus === 'onSale' ? 'offSale' : 'onSale'
  const actionText = nextStatus === 'onSale' ? '上架' : '下架'

  try {
    await ElMessageBox.confirm(`确认${actionText}商品「${row.name}」吗？`, `${actionText}商品`, {
      type: nextStatus === 'onSale' ? 'success' : 'warning',
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }

  await updateProductStatus(row.id, nextStatus)
  ElMessage.success(`商品已${actionText}`)
  await loadProducts()
}

// 删除商品
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`删除后商品「${row.name}」将不再展示，确认删除吗？`, '删除商品', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }

  await deleteProduct(row.id)
  ElMessage.success('商品已删除')

  if (products.value.length === 1 && pagination.page > 1) {
    pagination.page -= 1
  }

  await loadProducts()
}

// 格式化金额
function formatMoney(value) {
  return Number(value || 0).toFixed(2)
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

// 拼接上传资源访问地址
function resolveAssetUrl(url) {
  if (!url || /^https?:\/\//.test(url)) {
    return url
  }

  return `${API_BASE_URL}${url}`
}

onMounted(async () => {
  await loadCategories()
  await loadProducts()
})
</script>

<style scoped>
.products-view {
  height: 100%;
  max-width: 100%;
  gap: 14px;
  overflow: hidden;
}

.products-search,
.products-operations,
.products-table,
.products-pagination {
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.products-search {
  flex: 0 0 auto;
}

.products-search__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
}

.products-search__form :deep(.el-form-item) {
  margin: 0;
}

.products-search__form :deep(.el-form-item__label) {
  color: var(--oc-text);
}

.products-search__form :deep(.el-input),
.products-search__form :deep(.el-select) {
  width: 168px;
}

.products-operations {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.products-operations__left,
.products-operations__right,
.products-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.products-table {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.products-pagination {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.product-cover {
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--oc-border);
  border-radius: 6px;
  background: rgba(4, 8, 13, 0.34);
  color: var(--oc-text-muted);
  font-size: 12px;
}

.product-cover--empty {
  line-height: 52px;
}

.product-price {
  color: var(--oc-primary);
  font-weight: 800;
}

.products-view :deep(.el-dialog) {
  border: 1px solid var(--oc-border);
  background: var(--oc-panel-solid);
}

@media (max-width: 980px) {
  .products-view {
    overflow: auto;
  }

  .products-table {
    min-height: 420px;
  }

  .products-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
