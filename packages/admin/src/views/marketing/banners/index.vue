<template>
  <section class="admin-page banners-view" aria-label="轮播图管理">
    <section class="banners-search">
      <el-form class="banners-search__form" :model="searchForm" inline>
        <el-form-item label="标题">
          <el-input v-model.trim="searchForm.title" placeholder="请输入标题" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="启用" value="enabled" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="banners-operations">
      <div class="banners-operations__left">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增</el-button>
        <el-button :icon="Edit" :disabled="selectedRows.length !== 1" @click="openEditDialog(selectedRows[0])">
          编辑
        </el-button>
      </div>
      <div class="banners-operations__right">
        <el-button :icon="Refresh" :loading="loading" @click="loadBanners">刷新</el-button>
      </div>
    </section>

    <section class="banners-table">
      <el-table
        v-loading="loading"
        :data="banners"
        height="100%"
        empty-text="暂无轮播图"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column label="图片" width="150" align="center">
          <template #default="{ row }">
            <ImagePreview :src="row.imageUrl" width="112px" height="64px" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="160" align="center" show-overflow-tooltip />
        <el-table-column prop="kicker" label="辅助文案" min-width="120" align="center" show-overflow-tooltip />
        <el-table-column label="跳转" min-width="180" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getLinkText(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="90" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="row.status === 'enabled' ? 'success' : 'info'">
              {{ row.status === 'enabled' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="170" align="center">
          <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="250" fixed="right" align="center">
          <template #default="{ row }">
            <div class="banners-actions">
              <el-button link type="primary" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
              <el-button
                link
                :type="row.status === 'enabled' ? 'warning' : 'success'"
                :icon="SwitchButton"
                @click="handleToggleStatus(row)"
              >
                {{ row.status === 'enabled' ? '停用' : '启用' }}
              </el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="banners-pagination">
      <span class="admin-pagination__total">共 {{ pagination.total }} 条</span>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="sizes, prev, pager, next, jumper"
        prev-text="上一页"
        next-text="下一页"
        @size-change="loadBanners"
        @current-change="loadBanners"
      />
    </section>

    <BannerFormDialog
      v-model:visible="bannerDialog.visible"
      :mode="bannerDialog.mode"
      :banner="editingBanner"
      :submitting="bannerDialog.submitting"
      @submit="submitBannerForm"
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
  createBanner,
  deleteBanner,
  fetchBanners,
  updateBanner,
  updateBannerStatus
} from '../../../api/banner'
import ImagePreview from '../../../components/ImagePreview/index.vue'
import BannerFormDialog from './childComps/BannerFormDialog.vue'

// 页面加载状态
const loading = ref(false)
// 轮播图列表
const banners = ref([])
// 表格勾选轮播图
const selectedRows = ref([])
// 当前编辑的轮播图
const editingBanner = ref(null)

// 搜索表单
const searchForm = reactive({
  title: '',
  status: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 轮播图弹窗状态
const bannerDialog = reactive({
  visible: false,
  mode: 'create',
  submitting: false
})

// 加载轮播图列表
async function loadBanners() {
  loading.value = true

  try {
    const result = await fetchBanners({
      page: pagination.page,
      pageSize: pagination.pageSize,
      title: searchForm.title || undefined,
      status: searchForm.status || undefined
    })

    banners.value = Array.isArray(result?.list) ? result.list : []
    pagination.total = Number(result?.pagination?.total) || 0
    pagination.page = Number(result?.pagination?.page) || pagination.page
    pagination.pageSize = Number(result?.pagination?.pageSize) || pagination.pageSize
  } finally {
    loading.value = false
  }
}

// 查询轮播图列表
function handleSearch() {
  pagination.page = 1
  loadBanners()
}

// 重置搜索条件
function handleResetSearch() {
  searchForm.title = ''
  searchForm.status = ''
  pagination.page = 1
  loadBanners()
}

// 记录表格勾选轮播图
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 打开新增弹窗
function openCreateDialog() {
  editingBanner.value = null
  bannerDialog.mode = 'create'
  bannerDialog.visible = true
}

// 打开编辑弹窗
function openEditDialog(row) {
  if (!row) {
    return
  }

  editingBanner.value = row
  bannerDialog.mode = 'edit'
  bannerDialog.visible = true
}

// 提交轮播图表单
async function submitBannerForm(form) {
  bannerDialog.submitting = true

  try {
    if (bannerDialog.mode === 'create') {
      await createBanner(form)
      ElMessage.success('轮播图已新增')
    } else {
      await updateBanner(editingBanner.value.id, form)
      ElMessage.success('轮播图已更新')
    }

    bannerDialog.visible = false
    selectedRows.value = []
    await loadBanners()
  } finally {
    bannerDialog.submitting = false
  }
}

// 启用或停用轮播图
async function handleToggleStatus(row) {
  const nextStatus = row.status === 'enabled' ? 'disabled' : 'enabled'
  const actionText = nextStatus === 'enabled' ? '启用' : '停用'

  try {
    await ElMessageBox.confirm(`确认${actionText}轮播图「${row.title}」吗？`, `${actionText}确认`, {
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (err) {
    return
  }

  await updateBannerStatus(row.id, nextStatus)
  ElMessage.success(`轮播图已${actionText}`)
  selectedRows.value = []
  await loadBanners()
}

// 删除轮播图
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除轮播图「${row.title}」吗？删除后小程序不再展示。`, '删除确认', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (err) {
    return
  }

  await deleteBanner(row.id)
  ElMessage.success('轮播图已删除')
  selectedRows.value = []
  await loadBanners()
}

// 获取跳转文案
function getLinkText(row) {
  const map = {
    none: '不跳转',
    page: `小程序页面：${row.linkUrl || '待补充'}`,
    url: `网页地址：${row.linkUrl || '待补充'}`
  }

  return map[row.linkType] || '待补充'
}

// 格式化时间
function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '待补充'
}

onMounted(() => {
  loadBanners()
})
</script>

<style scoped>
.banners-view {
  height: 100%;
  max-width: 100%;
  gap: 14px;
  overflow: hidden;
}

.banners-search,
.banners-operations,
.banners-table,
.banners-pagination {
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.banners-search {
  flex: 0 0 auto;
}

.banners-search__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
}

.banners-search__form :deep(.el-form-item) {
  margin: 0;
}

.banners-search__form :deep(.el-form-item__label) {
  color: var(--oc-text);
}

.banners-search__form :deep(.el-input),
.banners-search__form :deep(.el-select) {
  width: 180px;
}

.banners-operations {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.banners-operations__left,
.banners-operations__right,
.banners-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.banners-table {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.banners-pagination {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.banners-view :deep(.el-dialog) {
  border: 1px solid var(--oc-border);
  background: var(--oc-panel-solid);
}

@media (max-width: 980px) {
  .banners-view {
    overflow: auto;
  }

  .banners-table {
    min-height: 420px;
  }
}
</style>
