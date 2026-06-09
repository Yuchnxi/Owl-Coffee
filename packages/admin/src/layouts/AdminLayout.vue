<template>
  <div class="admin-shell">
    <aside class="admin-sidebar" :class="{ 'is-collapsed': appStore.sidebarCollapsed }">
      <RouterLink class="admin-brand" to="/dashboard">
        <span class="admin-brand__mark">OC</span>
        <span class="admin-brand__text">Owl Coffee</span>
      </RouterLink>

      <nav class="admin-menu" aria-label="后台菜单">
        <RouterLink
          v-for="item in adminMenus"
          :key="item.path"
          class="admin-menu__item"
          :to="item.path"
          :title="item.title"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <div class="admin-topbar__left">
          <el-button
            class="icon-button"
            text
            :icon="appStore.sidebarCollapsed ? Expand : Fold"
            aria-label="切换侧边栏"
            @click="appStore.toggleSidebar"
          />
          <div>
            <p class="admin-topbar__eyebrow">Owl Coffee 管理系统</p>
            <h1>{{ pageTitle }}</h1>
          </div>
        </div>

        <div class="admin-topbar__right">
          <span class="admin-badge">MVP 框架</span>
          <el-avatar class="admin-avatar" :size="34">管</el-avatar>
        </div>
      </header>

      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Expand, Fold } from '@element-plus/icons-vue'
import { useAppStore } from '../stores/app'
import { adminMenus } from '../config/menus'

// 当前路由信息
const route = useRoute()

// 全局布局状态
const appStore = useAppStore()

// 当前页面标题
const pageTitle = computed(() => route.meta.title || '后台管理')
</script>
