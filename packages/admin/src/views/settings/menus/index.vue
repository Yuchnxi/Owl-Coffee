<template>
  <section class="admin-page menu-management-view" aria-label="菜单管理">
    <section class="menu-management-search">
      <el-form class="menu-management-search__form" :model="searchForm" inline>
        <el-form-item label="菜单名称">
          <el-input v-model.trim="searchForm.keyword" placeholder="请输入菜单名称或路径" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="menu-management-operations">
      <div class="menu-management-operations__left">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增</el-button>
        <el-button :icon="Edit" :disabled="selectedRows.length !== 1" @click="openEditDialog(selectedRows[0])">
          编辑
        </el-button>
      </div>
      <div class="menu-management-operations__right">
        <el-button :icon="Refresh" :loading="loading" @click="loadMenus">刷新</el-button>
      </div>
    </section>

    <section class="menu-management-table">
      <el-table
        v-loading="loading"
        :data="filteredMenus"
        row-key="id"
        height="100%"
        empty-text="暂无菜单"
        default-expand-all
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column prop="name" label="菜单名称" min-width="150" />
        <el-table-column prop="id" label="菜单 ID" min-width="150" align="center" />
        <el-table-column prop="path" label="路径" min-width="190" align="center" />
        <el-table-column prop="icon" label="图标" min-width="130" align="center">
          <template #default="{ row }">{{ row.icon || '待补充' }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="90" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="row.status === 'enabled' ? 'success' : 'danger'">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="170" align="center">
          <template #default="{ row }">{{ row.updatedAt ? $dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="240" fixed="right" align="center">
          <template #default="{ row }">
            <div class="menu-management-actions">
              <el-button link type="primary" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
              <el-button
                link
                :type="row.status === 'enabled' ? 'danger' : 'success'"
                :icon="SwitchButton"
                @click="handleToggleStatus(row)"
              >
                {{ row.status === 'enabled' ? '禁用' : '启用' }}
              </el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <MenuFormDialog
      v-model:visible="menuDialog.visible"
      :mode="menuDialog.mode"
      :menu="editingMenu"
      :parent-options="parentOptions"
      :submitting="menuDialog.submitting"
      @submit="submitMenuForm"
    />
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
  SwitchButton
} from '@element-plus/icons-vue'
import {
  createMenu,
  deleteMenu,
  fetchMenus,
  updateMenu,
  updateMenuStatus
} from '../../../api/role'
import MenuFormDialog from './childComps/MenuFormDialog.vue'

// 页面加载状态
const loading = ref(false)
// 后台菜单树
const menus = ref([])
// 当前编辑菜单
const editingMenu = ref(null)
// 表格勾选菜单
const selectedRows = ref([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: ''
})

// 菜单弹窗状态
const menuDialog = reactive({
  visible: false,
  mode: 'create',
  submitting: false
})

// 父级菜单选项
const parentOptions = computed(() => {
  const disabledIds = getMenuDescendantIds(editingMenu.value?.id)

  if (editingMenu.value?.id) {
    disabledIds.add(editingMenu.value.id)
  }

  return flattenMenus(menus.value).filter(menu => menu.id !== 'dashboard' && !disabledIds.has(menu.id))
})

// 筛选后的菜单树
const filteredMenus = computed(() => filterMenus(menus.value))

// 加载菜单树
async function loadMenus() {
  loading.value = true

  try {
    const result = await fetchMenus()

    menus.value = Array.isArray(result?.list) ? result.list : []
  } finally {
    loading.value = false
  }
}

// 执行搜索
function handleSearch() {
  selectedRows.value = []
}

// 重置搜索条件
function handleResetSearch() {
  searchForm.keyword = ''
  searchForm.status = ''
  handleSearch()
}

// 打开新增菜单弹窗
function openCreateDialog() {
  editingMenu.value = {
    status: 'enabled',
    sort: 0
  }
  menuDialog.mode = 'create'
  menuDialog.visible = true
}

// 打开编辑菜单弹窗
function openEditDialog(row) {
  if (!row) {
    return
  }

  editingMenu.value = { ...row }
  menuDialog.mode = 'edit'
  menuDialog.visible = true
}

// 记录表格勾选菜单
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 提交菜单表单
async function submitMenuForm(form) {
  menuDialog.submitting = true

  try {
    if (menuDialog.mode === 'create') {
      await createMenu(form)
      ElMessage.success('菜单已新增')
    } else {
      await updateMenu(form.id, form)
      ElMessage.success('菜单已更新')
    }

    menuDialog.visible = false
    await loadMenus()
  } finally {
    menuDialog.submitting = false
  }
}

// 切换菜单启用状态
async function handleToggleStatus(row) {
  const nextStatus = row.status === 'enabled' ? 'disabled' : 'enabled'
  const actionText = nextStatus === 'enabled' ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确认${actionText}菜单「${row.name}」吗？`, `${actionText}菜单`, {
      type: nextStatus === 'enabled' ? 'success' : 'warning',
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }

  await updateMenuStatus(row.id, nextStatus)
  ElMessage.success(`菜单已${actionText}`)
  await loadMenus()
}

// 删除菜单
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`删除后菜单「${row.name}」将不再出现在侧边栏，确认删除吗？`, '删除菜单', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }

  await deleteMenu(row.id)
  ElMessage.success('菜单已删除')
  await loadMenus()
}

// 获取菜单状态文案
function getStatusLabel(status) {
  return status === 'enabled' ? '启用' : '禁用'
}

// 展平菜单树
function flattenMenus(list) {
  const result = []

  for (const item of list) {
    result.push(item)

    if (Array.isArray(item.children) && item.children.length > 0) {
      result.push(...flattenMenus(item.children))
    }
  }

  return result
}

// 获取菜单子孙 ID 集合
function getMenuDescendantIds(menuId) {
  const result = new Set()

  if (!menuId) {
    return result
  }

  const target = flattenMenus(menus.value).find(menu => menu.id === menuId)

  if (!target) {
    return result
  }

  for (const child of flattenMenus(target.children || [])) {
    result.add(child.id)
  }

  return result
}

// 筛选菜单树
function filterMenus(list) {
  const keyword = searchForm.keyword.toLowerCase()

  return list.reduce((result, item) => {
    const children = filterMenus(item.children || [])
    const matchedKeyword = !keyword
      || item.name?.toLowerCase().includes(keyword)
      || item.path?.toLowerCase().includes(keyword)
      || item.id?.toLowerCase().includes(keyword)
    const matchedStatus = !searchForm.status || item.status === searchForm.status

    if ((matchedKeyword && matchedStatus) || children.length > 0) {
      result.push({
        ...item,
        children
      })
    }

    return result
  }, [])
}

onMounted(() => {
  loadMenus()
})
</script>

<style scoped>
.menu-management-view {
  height: 100%;
  max-width: 100%;
  gap: 14px;
  overflow: hidden;
}

.menu-management-search,
.menu-management-operations,
.menu-management-table {
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.menu-management-search {
  flex: 0 0 auto;
}

.menu-management-search__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
}

.menu-management-search__form :deep(.el-form-item) {
  margin: 0;
}

.menu-management-search__form :deep(.el-form-item__label) {
  color: var(--oc-text);
}

.menu-management-search__form :deep(.el-input),
.menu-management-search__form :deep(.el-select) {
  width: 190px;
}

.menu-management-operations {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.menu-management-operations__left,
.menu-management-operations__right,
.menu-management-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.menu-management-table {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.menu-management-view :deep(.el-dialog) {
  border: 1px solid var(--oc-border);
  background: var(--oc-panel-solid);
}

@media (max-width: 980px) {
  .menu-management-view {
    overflow: auto;
  }

  .menu-management-table {
    min-height: 420px;
  }

  .menu-management-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
