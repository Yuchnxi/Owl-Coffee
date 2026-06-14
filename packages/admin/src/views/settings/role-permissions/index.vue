<template>
  <section class="admin-page role-permissions-view" aria-label="角色权限">
    <section class="role-permissions-roles">
      <div class="role-permissions-toolbar">
        <span class="role-permissions-title">角色列表</span>
        <el-button :icon="Refresh" :loading="rolesLoading" @click="loadRoles">刷新</el-button>
      </div>

      <el-table
        v-loading="rolesLoading"
        :data="roles"
        height="100%"
        empty-text="暂无角色"
        highlight-current-row
        @current-change="handleRoleChange"
      >
        <el-table-column prop="name" label="角色" min-width="100" align="center" />
        <el-table-column prop="code" label="编码" min-width="100" align="center" />
        <el-table-column label="菜单数" width="90" align="center">
          <template #default="{ row }">{{ row.menuCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="row.status === 'enabled' ? 'success' : 'danger'">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="role-permissions-panel">
      <div class="role-permissions-toolbar">
        <div class="role-permissions-heading">
          <span class="role-permissions-title">菜单权限</span>
          <span class="role-permissions-subtitle">{{ currentRole ? currentRole.name : '请选择角色' }}</span>
        </div>
        <div class="role-permissions-actions">
          <el-button :icon="Refresh" :loading="detailLoading" :disabled="!currentRole" @click="loadRoleDetail(currentRole.id)">
            重载
          </el-button>
          <el-button type="primary" :icon="Check" :loading="submitting" :disabled="!currentRole" @click="submitPermissions">
            保存
          </el-button>
        </div>
      </div>

      <div v-loading="detailLoading || menusLoading" class="role-permissions-tree-wrap">
        <el-tree
          ref="treeRef"
          class="role-permissions-tree"
          :data="menus"
          node-key="id"
          show-checkbox
          default-expand-all
          :props="treeProps"
          empty-text="暂无可分配菜单"
        >
          <template #default="{ data }">
            <div class="role-permissions-node">
              <span class="role-permissions-node__name">{{ data.name }}</span>
              <span class="role-permissions-node__path">{{ data.path }}</span>
            </div>
          </template>
        </el-tree>
      </div>
    </section>
  </section>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Refresh } from '@element-plus/icons-vue'
import {
  fetchMenus,
  fetchRoleDetail,
  fetchRoles,
  updateRoleMenus
} from '../../../api/role'

// 角色列表加载状态
const rolesLoading = ref(false)
// 角色详情加载状态
const detailLoading = ref(false)
// 菜单树加载状态
const menusLoading = ref(false)
// 保存提交状态
const submitting = ref(false)
// 角色列表
const roles = ref([])
// 菜单树
const menus = ref([])
// 当前角色
const currentRole = ref(null)
// 当前角色详情
const currentRoleDetail = ref(null)
// 菜单树引用
const treeRef = ref(null)

// 菜单树字段配置
const treeProps = {
  label: 'name',
  children: 'children'
}

// 加载角色列表
async function loadRoles() {
  rolesLoading.value = true

  try {
    const result = await fetchRoles()

    roles.value = Array.isArray(result?.list) ? result.list : []

    if (!currentRole.value && roles.value.length > 0) {
      await handleRoleChange(roles.value[0])
    }
  } finally {
    rolesLoading.value = false
  }
}

// 加载菜单树
async function loadMenus() {
  menusLoading.value = true

  try {
    const result = await fetchMenus()

    menus.value = Array.isArray(result?.list) ? result.list : []
  } finally {
    menusLoading.value = false
  }
}

// 切换当前角色
async function handleRoleChange(role) {
  if (!role) {
    return
  }

  currentRole.value = role
  await loadRoleDetail(role.id)
}

// 加载角色详情
async function loadRoleDetail(roleId) {
  if (!roleId) {
    return
  }

  detailLoading.value = true

  try {
    currentRoleDetail.value = await fetchRoleDetail(roleId)
    await nextTick()
    treeRef.value?.setCheckedKeys(currentRoleDetail.value?.menuIds || [])
  } finally {
    detailLoading.value = false
  }
}

// 保存角色菜单权限
async function submitPermissions() {
  if (!currentRole.value) {
    return
  }

  const checkedKeys = treeRef.value?.getCheckedKeys() || []
  const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys() || []
  const menuIds = Array.from(new Set([...checkedKeys, ...halfCheckedKeys]))

  submitting.value = true

  try {
    currentRoleDetail.value = await updateRoleMenus(currentRole.value.id, menuIds)
    treeRef.value?.setCheckedKeys(currentRoleDetail.value?.menuIds || [])
    ElMessage.success('角色权限已保存')
    await loadRoles()
  } finally {
    submitting.value = false
  }
}

// 获取角色状态文案
function getStatusLabel(status) {
  return status === 'enabled' ? '启用' : '禁用'
}

onMounted(async () => {
  await loadMenus()
  await loadRoles()
})
</script>

<style scoped>
.role-permissions-view {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(0, 1.4fr);
  height: 100%;
  max-width: 100%;
  gap: 16px;
  overflow: hidden;
}

.role-permissions-roles,
.role-permissions-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  border: 1px solid var(--oc-border);
  border-radius: var(--oc-radius);
  background: rgba(17, 25, 34, 0.58);
  padding: 14px;
}

.role-permissions-toolbar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.role-permissions-heading {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.role-permissions-title {
  color: var(--oc-text);
  font-size: 15px;
  font-weight: 700;
}

.role-permissions-subtitle {
  color: var(--oc-text-secondary);
  font-size: 13px;
}

.role-permissions-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-permissions-tree-wrap {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  border: 1px solid rgba(181, 139, 92, 0.14);
  border-radius: var(--oc-radius);
  background: rgba(4, 8, 13, 0.18);
  padding: 10px;
}

.role-permissions-tree {
  min-width: 420px;
  background: transparent;
  color: var(--oc-text);
}

.role-permissions-tree :deep(.el-tree-node__content) {
  min-height: 40px;
  border-radius: 6px;
}

.role-permissions-tree :deep(.el-tree-node__content:hover) {
  background: var(--oc-primary-soft);
}

.role-permissions-node {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.role-permissions-node__name {
  color: var(--oc-text);
  font-weight: 600;
}

.role-permissions-node__path {
  color: var(--oc-text-muted);
  font-size: 12px;
}

@media (max-width: 1100px) {
  .role-permissions-view {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .role-permissions-roles,
  .role-permissions-panel {
    min-height: 420px;
  }
}
</style>
