<template>
  <el-aside class="admin-sidebar" :class="{ 'is-collapsed': appStore.sidebarCollapsed }" :width="asideWidth">
    <RouterLink class="admin-brand" to="/dashboard">
      <img class="admin-brand__icon" :src="logoIcon" alt="Owl Coffee" />
      <span class="admin-brand__text">Owl Coffee</span>
    </RouterLink>

    <el-menu
      class="admin-menu"
      :collapse="appStore.sidebarCollapsed"
      :default-active="activeMenu"
      :router="true"
      background-color="transparent"
      text-color="var(--oc-text-secondary)"
      active-text-color="var(--oc-text)"
    >
      <LayoutMenuItem v-for="item in sidebarMenus" :key="item.id || item.path" :item="item" />
    </el-menu>
  </el-aside>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import logoIcon from '../../../assets/logo/owlcoffee_icon_cropped.png'
import { useAppStore } from '../../../stores/app'
import { useAuthStore } from '../../../stores/auth'
import LayoutMenuItem from '../LayoutMenuItem/index.vue'

const appStore = useAppStore()
const authStore = useAuthStore()
const route = useRoute()

// 侧边栏宽度
const asideWidth = computed(() => (appStore.sidebarCollapsed ? '84px' : '260px'))

// 默认仪表盘菜单
const defaultMenus = [
  {
    id: 'dashboard',
    name: '仪表盘',
    path: '/dashboard',
    icon: 'dashboard',
    meta: {
      title: '仪表盘'
    },
    children: []
  }
]

// 侧边栏菜单列表
const sidebarMenus = computed(() => {
  const menus = authStore.user?.menus

  return Array.isArray(menus) && menus.length > 0 ? menus : defaultMenus
})

// 当前激活菜单
const activeMenu = computed(() => route.meta.activeMenu || route.path)

// 拉取当前用户菜单
onMounted(async () => {
  if (!authStore.user?.menus?.length && authStore.accessToken) {
    await authStore.loadCurrentUser()
  }
})
</script>
