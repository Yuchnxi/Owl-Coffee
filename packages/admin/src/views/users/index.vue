<template>
  <section class="admin-page users-view" aria-label="用户管理">
    <section class="users-search">
      <el-form class="users-search__form" :model="searchForm" inline>
        <el-form-item label="用户昵称">
          <el-input v-model.trim="searchForm.nickname" placeholder="请输入用户昵称" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model.trim="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.userStatus" placeholder="全部状态" clearable>
            <el-option label="正常" value="normal" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
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

    <section class="users-operations">
      <div class="users-operations__left"></div>
      <div class="users-operations__right">
        <el-button :icon="Refresh" :loading="loading" @click="loadUsers">刷新</el-button>
      </div>
    </section>

    <section class="users-table">
      <el-table v-loading="loading" :data="users" height="100%" empty-text="暂无用户">
        <el-table-column label="头像" width="86" align="center">
          <template #default="{ row }">
            <el-avatar :size="36" :src="row.avatarUrl || ''">
              {{ getAvatarText(row) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="昵称" min-width="140" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ row.nickname || '待补充' }}</template>
        </el-table-column>
        <el-table-column label="手机号" min-width="130" align="center">
          <template #default="{ row }">{{ row.phone || '待补充' }}</template>
        </el-table-column>
        <el-table-column prop="orderCount" label="订单数" min-width="100" align="center" />
        <el-table-column label="累计消费" min-width="120" align="center">
          <template #default="{ row }">
            <span class="users-money">￥{{ formatMoney(row.totalConsumeAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="row.userStatus === 'normal' ? 'success' : 'danger'">
              {{ getUserStatusLabel(row.userStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="170" align="center">
          <template #default="{ row }">
            {{ row.createdAt ? $dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="users-actions">
              <el-button link type="primary" :icon="View" @click="openDetailDialog(row)">详情</el-button>
              <el-button
                link
                :type="row.userStatus === 'normal' ? 'danger' : 'success'"
                :icon="SwitchButton"
                @click="handleToggleStatus(row)"
              >
                {{ row.userStatus === 'normal' ? '禁用' : '启用' }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="users-pagination">
      <span class="admin-pagination__total">共 {{ pagination.total }} 条</span>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="sizes, prev, pager, next, jumper"
        prev-text="上一页"
        next-text="下一页"
        @size-change="loadUsers"
        @current-change="loadUsers"
      />
    </section>

    <el-dialog v-model="detailDialog.visible" title="用户详情" width="620px" destroy-on-close>
      <div v-if="currentUser" class="user-detail">
        <div class="user-detail__header">
          <el-avatar :size="56" :src="currentUser.avatarUrl || ''">
            {{ getAvatarText(currentUser) }}
          </el-avatar>
          <div class="user-detail__title">
            <strong>{{ currentUser.nickname || '待补充' }}</strong>
            <span>{{ currentUser.phone || '待补充' }}</span>
          </div>
          <el-tag effect="dark" :type="currentUser.userStatus === 'normal' ? 'success' : 'danger'">
            {{ getUserStatusLabel(currentUser.userStatus) }}
          </el-tag>
        </div>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户 ID">{{ currentUser.id }}</el-descriptions-item>
          <el-descriptions-item label="微信 OpenID">{{ currentUser.openidBound ? '已绑定' : '未绑定' }}</el-descriptions-item>
          <el-descriptions-item label="微信 UnionID">{{ currentUser.unionidBound ? '已绑定' : '未绑定' }}</el-descriptions-item>
          <el-descriptions-item label="手机号授权">{{ currentUser.phoneBound ? '已授权' : '未授权' }}</el-descriptions-item>
          <el-descriptions-item label="订单数">{{ currentUser.orderCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="累计消费">￥{{ formatMoney(currentUser.totalConsumeAmount) }}</el-descriptions-item>
          <el-descriptions-item label="最近下单">
            {{ currentUser.lastOrderAt ? $dayjs(currentUser.lastOrderAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ currentUser.createdAt ? $dayjs(currentUser.createdAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ currentUser.updatedAt ? $dayjs(currentUser.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button type="primary" @click="detailDialog.visible = false">知道了</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, SwitchButton, View } from '@element-plus/icons-vue'
import {
  fetchUserDetail,
  fetchUsers,
  updateUserStatus
} from '../../api/user'

// 页面加载状态
const loading = ref(false)
// 小程序用户列表
const users = ref([])
// 当前查看的用户
const currentUser = ref(null)

// 搜索表单
const searchForm = reactive({
  nickname: '',
  phone: '',
  userStatus: '',
  dateRange: []
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 详情弹窗状态
const detailDialog = reactive({
  visible: false
})

// 加载小程序用户列表
async function loadUsers() {
  loading.value = true

  try {
    const [startTime, endTime] = searchForm.dateRange || []
    const result = await fetchUsers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      nickname: searchForm.nickname || undefined,
      phone: searchForm.phone || undefined,
      userStatus: searchForm.userStatus || undefined,
      startTime,
      endTime
    })

    users.value = Array.isArray(result?.list) ? result.list : []
    pagination.total = Number(result?.pagination?.total) || 0
  } finally {
    loading.value = false
  }
}

// 执行搜索
function handleSearch() {
  pagination.page = 1
  loadUsers()
}

// 重置搜索条件
function handleResetSearch() {
  searchForm.nickname = ''
  searchForm.phone = ''
  searchForm.userStatus = ''
  searchForm.dateRange = []
  handleSearch()
}

// 打开用户详情弹窗
async function openDetailDialog(row) {
  currentUser.value = await fetchUserDetail(row.id)
  detailDialog.visible = true
}

// 切换用户启用状态
async function handleToggleStatus(row) {
  const nextStatus = row.userStatus === 'normal' ? 'disabled' : 'normal'
  const actionText = nextStatus === 'normal' ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确认${actionText}用户「${row.nickname || row.phone || row.id}」吗？`, `${actionText}用户`, {
      type: nextStatus === 'normal' ? 'success' : 'warning',
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }

  await updateUserStatus(row.id, nextStatus)
  ElMessage.success(`用户已${actionText}`)
  await loadUsers()
}

// 获取用户状态文案
function getUserStatusLabel(status) {
  return status === 'normal' ? '正常' : '禁用'
}

// 格式化金额
function formatMoney(value) {
  return (Number(value) || 0).toFixed(2)
}

// 获取头像占位文字
function getAvatarText(user) {
  return (user.nickname || user.phone || '待').slice(0, 1)
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-view {
  height: 100%;
  max-width: 100%;
  gap: 14px;
  overflow: hidden;
}

.users-search,
.users-operations,
.users-table,
.users-pagination {
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.users-search {
  flex: 0 0 auto;
}

.users-search__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
}

.users-search__form :deep(.el-form-item) {
  margin: 0;
}

.users-search__form :deep(.el-form-item__label) {
  color: var(--oc-text);
}

.users-search__form :deep(.el-input),
.users-search__form :deep(.el-select) {
  width: 168px;
}

.users-search__form :deep(.el-date-editor) {
  width: 360px;
}

.users-operations {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.users-operations__left,
.users-operations__right,
.users-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.users-table {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.users-pagination {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
}

.users-money {
  color: var(--oc-primary);
  font-weight: 800;
}

.users-view :deep(.el-avatar) {
  border: 1px solid rgba(238, 146, 38, 0.34);
  background: linear-gradient(135deg, rgba(238, 146, 38, 0.95), rgba(120, 72, 31, 0.9));
  color: #21150a;
  font-weight: 800;
}

.users-view :deep(.el-dialog) {
  border: 1px solid var(--oc-border);
  background: var(--oc-panel-solid);
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.user-detail__header {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 2px 0 4px;
  gap: 14px;
}

.user-detail__title {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.user-detail__title strong {
  overflow: hidden;
  color: var(--oc-text);
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-detail__title span {
  color: var(--oc-text-secondary);
  font-size: 13px;
}

.users-view :deep(.el-descriptions__label) {
  width: 118px;
}

@media (max-width: 980px) {
  .users-view {
    overflow: auto;
  }

  .users-search__form :deep(.el-date-editor) {
    width: 100%;
    max-width: 360px;
  }

  .users-table {
    min-height: 420px;
  }

  .users-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
