<template>
  <section class="admin-page product-categories-view" aria-label="商品分类">
    <section class="category-search">
      <el-form class="category-search__form" :model="searchForm" inline>
        <el-form-item label="分类名称">
          <el-input v-model.trim="searchForm.name" placeholder="请输入分类名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadCategories">查询</el-button>
          <el-button :icon="Refresh" @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="category-operations">
      <div class="category-operations__left">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增</el-button>
        <el-button :icon="Edit" :disabled="selectedRows.length !== 1" @click="openEditDialog(selectedRows[0])">
          编辑
        </el-button>
      </div>
      <div class="category-operations__right">
        <el-button :icon="Refresh" :loading="loading" @click="loadCategories">刷新</el-button>
      </div>
    </section>

    <section class="category-table">
      <el-table
        v-loading="loading"
        :data="categories"
        height="100%"
        empty-text="暂无分类"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column prop="name" label="分类名称" min-width="160" align="center" />
        <el-table-column prop="sort" label="排序" min-width="90" align="center" />
        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="row.status === 'enabled' ? 'success' : 'info'">
              {{ row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="170" align="center">
          <template #default="{ row }">
            {{ row.createdAt ? $dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="170" align="center">
          <template #default="{ row }">
            {{ row.updatedAt ? $dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="category-actions">
              <el-button link type="primary" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="category-pagination">
      <span class="admin-pagination__total">共 {{ categories.length }} 条</span>
    </section>

    <CategoryFormDialog
      v-model:visible="categoryDialog.visible"
      :mode="categoryDialog.mode"
      :category="editingCategory"
      :submitting="categoryDialog.submitting"
      @submit="submitCategoryForm"
    />
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory
} from '../../../api/product'
import CategoryFormDialog from './childComps/CategoryFormDialog.vue'

// 页面加载状态
const loading = ref(false)
// 商品分类列表
const categories = ref([])
// 表格勾选分类
const selectedRows = ref([])
// 正在编辑的分类
const editingCategory = ref(null)

// 搜索表单
const searchForm = reactive({
  name: '',
  status: ''
})

// 分类弹窗状态
const categoryDialog = reactive({
  visible: false,
  mode: 'create',
  submitting: false
})

// 加载商品分类
async function loadCategories() {
  loading.value = true

  try {
    const result = await fetchCategories({
      name: searchForm.name || undefined,
      status: searchForm.status || undefined
    })

    categories.value = Array.isArray(result?.list) ? result.list : []
  } finally {
    loading.value = false
  }
}

// 重置搜索条件
function handleResetSearch() {
  searchForm.name = ''
  searchForm.status = ''
  loadCategories()
}

// 记录表格勾选分类
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 打开新增分类弹窗
function openCreateDialog() {
  editingCategory.value = {
    sort: 0,
    status: 'enabled'
  }
  categoryDialog.mode = 'create'
  categoryDialog.visible = true
}

// 打开编辑分类弹窗
function openEditDialog(row) {
  if (!row) {
    return
  }

  editingCategory.value = { ...row }
  categoryDialog.mode = 'edit'
  categoryDialog.visible = true
}

// 提交分类表单
async function submitCategoryForm(form) {
  categoryDialog.submitting = true

  try {
    const payload = {
      name: form.name,
      sort: Number(form.sort) || 0,
      status: form.status
    }

    if (categoryDialog.mode === 'create') {
      await createCategory(payload)
      ElMessage.success('分类已新增')
    } else {
      await updateCategory(form.id, payload)
      ElMessage.success('分类已更新')
    }

    categoryDialog.visible = false
    await loadCategories()
  } finally {
    categoryDialog.submitting = false
  }
}

// 删除商品分类
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`删除后分类「${row.name}」将不可用，确认删除吗？`, '删除分类', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }

  await deleteCategory(row.id)
  ElMessage.success('分类已删除')
  await loadCategories()
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.product-categories-view {
  height: 100%;
  max-width: 100%;
  gap: 14px;
  overflow: hidden;
}

.category-search,
.category-operations,
.category-table,
.category-pagination {
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.category-search {
  flex: 0 0 auto;
}

.category-search__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
}

.category-search__form :deep(.el-form-item) {
  margin: 0;
}

.category-search__form :deep(.el-form-item__label) {
  color: var(--oc-text);
}

.category-search__form :deep(.el-input),
.category-search__form :deep(.el-select) {
  width: 168px;
}

.category-operations {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.category-operations__left,
.category-operations__right,
.category-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.category-table {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.category-pagination {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-start;
}

.product-categories-view :deep(.el-dialog) {
  border: 1px solid var(--oc-border);
  background: var(--oc-panel-solid);
}

@media (max-width: 980px) {
  .product-categories-view {
    overflow: auto;
  }

  .category-table {
    min-height: 420px;
  }
}
</style>
