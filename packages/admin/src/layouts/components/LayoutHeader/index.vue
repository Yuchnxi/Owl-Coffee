<template>
  <el-header class="admin-topbar">
    <div class="admin-topbar__left">
      <el-button
        class="icon-button"
        text
        :icon="appStore.sidebarCollapsed ? Expand : Fold"
        aria-label="切换侧边栏"
        @click="appStore.toggleSidebar"
      />
    </div>

    <div class="admin-topbar__right">
      <el-dropdown
        trigger="click"
        popper-class="admin-user-dropdown"
        @command="handleUserCommand"
      >
        <button class="admin-user-menu" type="button">
          <span class="admin-user-menu__avatar">
            <img v-if="adminAvatar" :src="adminAvatar" :alt="`${adminName}头像`" />
            <span v-else>{{ adminInitial }}</span>
          </span>
          <span class="admin-user-menu__name">{{ adminName }}</span>
          <el-icon class="admin-user-menu__arrow"><ArrowDown /></el-icon>
        </button>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :icon="User" command="profile">个人中心</el-dropdown-item>
            <el-dropdown-item :icon="SwitchButton" command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, Expand, Fold, SwitchButton, User } from '@element-plus/icons-vue'
import { useAppStore } from '../../../stores/app'
import { useAuthStore } from '../../../stores/auth'

// 路由实例
const router = useRouter()

// 全局布局状态
const appStore = useAppStore()

// 当前登录状态
const authStore = useAuthStore()

// 当前管理员信息
const adminUser = computed(() => authStore.user || {})

// 当前管理员名称
const adminName = computed(() => adminUser.value.name || adminUser.value.account || '管理员')

// 当前管理员头像
const adminAvatar = computed(() => adminUser.value.avatarUrl || adminUser.value.avatar || '')

// 默认头像文字
const adminInitial = computed(() => adminName.value.slice(0, 1) || '管')

// 处理管理员下拉菜单命令
async function handleUserCommand(command) {
  if (command === 'profile') {
    ElMessage.info('个人中心待补充')
    return
  }

  if (command === 'logout') {
    try {
      await authStore.logout()
    } catch (err) {
      // 退出接口失败时仍按本地退出处理
    } finally {
      ElMessage.success('已退出登录')
      router.replace('/login')
    }
  }
}
</script>
