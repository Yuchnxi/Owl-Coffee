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
      <span class="admin-badge">MVP 框架</span>
      <el-avatar class="admin-avatar" :size="34">管</el-avatar>
    </div>
  </el-header>
</template>

<script setup>
import { Expand, Fold } from '@element-plus/icons-vue'
import { useAppStore } from '../../../stores/app'

// 全局布局状态
const appStore = useAppStore()
</script>
