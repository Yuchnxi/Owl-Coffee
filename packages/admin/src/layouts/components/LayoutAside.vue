<template>
  <el-aside class="admin-sidebar" :class="{ 'is-collapsed': appStore.sidebarCollapsed }" :width="asideWidth">
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
  </el-aside>
</template>

<script setup>
import { computed } from 'vue'
import { adminMenus } from '../../config/menus'
import { useAppStore } from '../../stores/app'

// 全局布局状态
const appStore = useAppStore()

// 侧边栏宽度
const asideWidth = computed(() => (appStore.sidebarCollapsed ? '84px' : '260px'))
</script>
