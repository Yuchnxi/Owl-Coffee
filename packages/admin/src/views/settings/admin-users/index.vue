<template>
  <section class="admin-page admin-users-view" aria-label="账号管理">
    <section class="admin-users-search">
      <el-form class="admin-users-search__form" :model="searchForm" inline>
        <el-form-item label="登录账号">
          <el-input v-model.trim="searchForm.account" placeholder="请输入登录账号" clearable />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model.trim="searchForm.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model.trim="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.roleId" placeholder="全部角色" clearable>
            <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
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

    <section class="admin-users-operations">
      <div class="admin-users-operations__left">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增</el-button>
        <el-button :icon="Edit" :disabled="selectedRows.length !== 1" @click="openEditDialog(selectedRows[0])">
          编辑
        </el-button>
        <el-button :icon="Delete" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          删除
        </el-button>
      </div>
      <div class="admin-users-operations__right">
        <el-button :icon="Refresh" :loading="loading" @click="loadAdminUsers">刷新</el-button>
      </div>
    </section>

    <section class="admin-users-table">
      <el-table
        v-loading="loading"
        :data="adminUsers"
        height="100%"
        empty-text="暂无账号"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column prop="account" label="登录账号" min-width="140" align="center" />
        <el-table-column prop="name" label="姓名" min-width="120" align="center" />
        <el-table-column label="手机号" min-width="130" align="center">
          <template #default="{ row }">{{ row.phone || '待补充' }}</template>
        </el-table-column>
        <el-table-column label="角色" min-width="110" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="row.roleCode === 'admin' ? 'warning' : 'info'">
              {{ row.roleName || '待补充' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="row.status === 'enabled' ? 'success' : 'danger'">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近登录" min-width="170" align="center">
          <template #default="{ row }">{{ row.lastLoginAt ? $dayjs(row.lastLoginAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="170" align="center">
          <template #default="{ row }">{{ row.createdAt ? $dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="260" fixed="right" align="center">
          <template #default="{ row }">
            <div class="admin-users-actions">
              <el-button link type="primary" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
              <el-button
                link
                :type="row.status === 'enabled' ? 'danger' : 'success'"
                :icon="SwitchButton"
                @click="handleToggleStatus(row)"
              >
                {{ row.status === 'enabled' ? '禁用' : '启用' }}
              </el-button>
              <el-dropdown trigger="click" @command="command => handleMoreCommand(command, row)">
                <el-button link>更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">查看详情</el-dropdown-item>
                    <el-dropdown-item command="password">重置密码</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="admin-users-pagination">
      <span class="admin-pagination__total">共 {{ pagination.total }} 条</span>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="sizes, prev, pager, next, jumper"
        prev-text="上一页"
        next-text="下一页"
        @size-change="loadAdminUsers"
        @current-change="loadAdminUsers"
      />
    </section>

    <AccountFormDialog
      v-model:visible="accountDialog.visible"
      :mode="accountDialog.mode"
      :account="editingAccount"
      :roles="roles"
      :submitting="accountDialog.submitting"
      @submit="submitAccountForm"
    />

    <el-dialog v-model="detailDialog.visible" title="账号详情" width="560px" destroy-on-close>
      <el-descriptions v-if="currentAccount" :column="1" border>
        <el-descriptions-item label="登录账号">{{ currentAccount.account }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ currentAccount.name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentAccount.phone || '待补充' }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ currentAccount.roleName || '待补充' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusLabel(currentAccount.status) }}</el-descriptions-item>
        <el-descriptions-item label="最近登录">
          {{ currentAccount.lastLoginAt ? $dayjs(currentAccount.lastLoginAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ currentAccount.createdAt ? $dayjs(currentAccount.createdAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ currentAccount.updatedAt ? $dayjs(currentAccount.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="detailDialog.visible = false">知道了</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordDialog.visible" title="重置密码" width="480px" destroy-on-close>
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="92px">
        <el-form-item label="登录账号">
          <el-input :model-value="currentAccount?.account || ''" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="passwordForm.password" type="password" show-password placeholder="不少于 6 位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="passwordDialog.submitting" @click="submitPasswordForm">确认重置</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  Delete,
  Edit,
  Key,
  Plus,
  Refresh,
  Search,
  SwitchButton,
} from '@element-plus/icons-vue'
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUserDetail,
  fetchAdminUserRoles,
  fetchAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
  updateAdminUserStatus
} from '../../../api/adminUser'
import AccountFormDialog from './childComps/AccountFormDialog.vue'

// 页面加载状态
const loading = ref(false)
// 后台账号列表
const adminUsers = ref([])
// 可选角色列表
const roles = ref([])
// 当前选中的账号
const currentAccount = ref(null)
// 正在编辑的账号
const editingAccount = ref(null)
// 密码表单引用
const passwordFormRef = ref(null)
// 表格勾选账号
const selectedRows = ref([])

// 搜索表单
const searchForm = reactive({
  account: '',
  name: '',
  phone: '',
  roleId: '',
  status: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 账号弹窗状态
const accountDialog = reactive({
  visible: false,
  mode: 'create',
  submitting: false
})

// 详情弹窗状态
const detailDialog = reactive({
  visible: false
})

// 密码弹窗状态
const passwordDialog = reactive({
  visible: false,
  submitting: false
})

// 密码表单数据
const passwordForm = reactive({
  password: ''
})

// 密码表单校验规则
const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于 6 位', trigger: 'blur' }
  ]
}

// 加载账号列表
async function loadAdminUsers() {
  loading.value = true

  try {
    const result = await fetchAdminUsers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      account: searchForm.account || undefined,
      name: searchForm.name || undefined,
      phone: searchForm.phone || undefined,
      roleId: searchForm.roleId || undefined,
      status: searchForm.status || undefined
    })

    adminUsers.value = Array.isArray(result?.list) ? result.list : []
    pagination.total = Number(result?.pagination?.total) || 0
  } finally {
    loading.value = false
  }
}

// 加载可选角色
async function loadRoles() {
  const result = await fetchAdminUserRoles()

  roles.value = Array.isArray(result?.list) ? result.list : []
}

// 执行搜索
function handleSearch() {
  pagination.page = 1
  loadAdminUsers()
}

// 重置搜索条件
function handleResetSearch() {
  searchForm.account = ''
  searchForm.name = ''
  searchForm.phone = ''
  searchForm.roleId = ''
  searchForm.status = ''
  handleSearch()
}

// 打开新增账号弹窗
function openCreateDialog() {
  editingAccount.value = {
    roleId: roles.value[0]?.id || '',
    status: 'enabled'
  }
  accountDialog.mode = 'create'
  accountDialog.visible = true
}

// 打开编辑账号弹窗
function openEditDialog(row) {
  if (!row) {
    return
  }

  editingAccount.value = { ...row }
  accountDialog.mode = 'edit'
  accountDialog.visible = true
}

// 打开账号详情弹窗
async function openDetailDialog(row) {
  currentAccount.value = await fetchAdminUserDetail(row.id)
  detailDialog.visible = true
}

// 打开重置密码弹窗
function openPasswordDialog(row) {
  currentAccount.value = row
  passwordForm.password = ''
  passwordDialog.visible = true
}

// 提交账号表单
async function submitAccountForm(form) {
  accountDialog.submitting = true

  try {
    if (accountDialog.mode === 'create') {
      await createAdminUser({
        account: form.account,
        name: form.name,
        phone: form.phone || null,
        roleId: form.roleId,
        password: form.password,
        status: form.status
      })
      ElMessage.success('账号已新增')
    } else {
      await updateAdminUser(form.id, {
        account: form.account,
        name: form.name,
        phone: form.phone || null,
        roleId: form.roleId
      })
      ElMessage.success('账号已更新')
    }

    accountDialog.visible = false
    await loadAdminUsers()
  } finally {
    accountDialog.submitting = false
  }
}

// 记录表格勾选账号
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 处理更多菜单命令
function handleMoreCommand(command, row) {
  if (command === 'detail') {
    openDetailDialog(row)
    return
  }

  if (command === 'password') {
    openPasswordDialog(row)
  }
}

// 提交重置密码表单
async function submitPasswordForm() {
  await passwordFormRef.value?.validate()
  passwordDialog.submitting = true

  try {
    await resetAdminUserPassword(currentAccount.value.id, passwordForm.password)
    ElMessage.success('密码已重置')
    passwordDialog.visible = false
  } finally {
    passwordDialog.submitting = false
  }
}

// 切换账号启用状态
async function handleToggleStatus(row) {
  const nextStatus = row.status === 'enabled' ? 'disabled' : 'enabled'
  const actionText = nextStatus === 'enabled' ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确认${actionText}账号「${row.account}」吗？`, `${actionText}账号`, {
      type: nextStatus === 'enabled' ? 'success' : 'warning',
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }

  await updateAdminUserStatus(row.id, nextStatus)
  ElMessage.success(`账号已${actionText}`)
  await loadAdminUsers()
}

// 删除账号
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`删除后账号「${row.account}」将无法登录，确认删除吗？`, '删除账号', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }

  await deleteAdminUser(row.id)
  ElMessage.success('账号已删除')

  if (adminUsers.value.length === 1 && pagination.page > 1) {
    pagination.page -= 1
  }

  await loadAdminUsers()
}

// 批量删除账号
async function handleBatchDelete() {
  if (!selectedRows.value.length) {
    return
  }

  try {
    await ElMessageBox.confirm(`确认删除已选中的 ${selectedRows.value.length} 个账号吗？`, '批量删除账号', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }

  for (const row of selectedRows.value) {
    await deleteAdminUser(row.id)
  }

  ElMessage.success('已删除选中账号')
  selectedRows.value = []
  await loadAdminUsers()
}

// 获取账号状态文案
function getStatusLabel(status) {
  return status === 'enabled' ? '启用' : '禁用'
}

onMounted(async () => {
  await loadRoles()
  await loadAdminUsers()
})
</script>

<style scoped>
.admin-users-view {
  height: 100%;
  max-width: 100%;
  gap: 14px;
  overflow: hidden;
}

.admin-users-search,
.admin-users-operations,
.admin-users-table,
.admin-users-pagination {
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.admin-users-search {
  flex: 0 0 auto;
}

.admin-users-search__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
}

.admin-users-search__form :deep(.el-form-item) {
  margin: 0;
}

.admin-users-search__form :deep(.el-form-item__label) {
  color: var(--oc-text);
}

.admin-users-search__form :deep(.el-input),
.admin-users-search__form :deep(.el-select) {
  width: 168px;
}

.admin-users-operations {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.admin-users-operations__left,
.admin-users-operations__right,
.admin-users-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.admin-users-table {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.admin-users-pagination {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.admin-pagination__total {
  color: var(--oc-text-secondary);
  font-size: 13px;
}

.admin-users-view :deep(.el-dialog) {
  border: 1px solid var(--oc-border);
  background: var(--oc-panel-solid);
}

.admin-users-view :deep(.el-descriptions__label) {
  width: 112px;
}

@media (max-width: 980px) {
  .admin-users-view {
    overflow: auto;
  }

  .admin-users-table {
    min-height: 420px;
  }

  .admin-users-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
