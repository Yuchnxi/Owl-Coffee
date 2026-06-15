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

// 默认侧边栏菜单
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
  },
  {
    id: 'products',
    name: '商品管理',
    path: '/products',
    icon: 'products',
    meta: {
      title: '商品管理'
    },
    children: [
      {
        id: 'product_list',
        name: '商品列表',
        path: '/products/list',
        icon: 'Goods',
        meta: {
          title: '商品列表'
        },
        children: []
      },
      {
        id: 'product_categories',
        name: '商品分类',
        path: '/products/categories',
        icon: 'FolderOpened',
        meta: {
          title: '商品分类'
        },
        children: []
      },
      {
        id: 'inventory',
        name: '库存管理',
        path: '/inventory',
        icon: 'Box',
        meta: {
          title: '库存管理'
        },
        children: []
      }
    ]
  },
  {
    id: 'users',
    name: '用户管理',
    path: '/users',
    icon: 'users',
    meta: {
      title: '用户管理'
    },
    children: []
  },
  {
    id: 'marketing',
    name: '营销管理',
    path: '/marketing',
    icon: 'marketing',
    meta: {
      title: '营销管理'
    },
    children: [
      {
        id: 'coupon_management',
        name: '优惠券管理',
        path: '/marketing/coupons',
        icon: 'Tickets',
        meta: {
          title: '优惠券管理'
        },
        children: []
      }
    ]
  },
  {
    id: 'settings',
    name: '系统设置',
    path: '/settings',
    icon: 'settings',
    meta: {
      title: '系统设置'
    },
    children: [
      {
        id: 'admin_users',
        name: '账号管理',
        path: '/settings/admin-users',
        icon: 'adminUsers',
        meta: {
          title: '账号管理'
        },
        children: []
      },
      {
        id: 'menu_management',
        name: '菜单管理',
        path: '/settings/menus',
        icon: 'menuManagement',
        meta: {
          title: '菜单管理'
        },
        children: []
      },
      {
        id: 'role_permissions',
        name: '角色权限',
        path: '/settings/role-permissions',
        icon: 'rolePermissions',
        meta: {
          title: '角色权限'
        },
        children: []
      }
    ]
  }
]

// 侧边栏菜单列表
const sidebarMenus = computed(() => {
  const menus = authStore.user?.menus

  return normalizeMenus(Array.isArray(menus) && menus.length > 0 ? menus : defaultMenus)
})

// 兼容旧菜单数据，补齐商品管理二级菜单
function normalizeMenus(menus) {
  return menus.map(menu => {
    if (menu.id === 'marketing') {
      return normalizeMarketingMenu(menu)
    }

    if (menu.id !== 'products') {
      return {
        ...menu,
        children: Array.isArray(menu.children) ? normalizeMenus(menu.children) : []
      }
    }

    const children = Array.isArray(menu.children) ? menu.children : []

    if (children.some(child => child.id === 'product_list')) {
      return {
        ...menu,
        children: normalizeMenus(children)
      }
    }

    return {
      ...menu,
      path: '/products',
      children: [
        {
          id: 'product_list',
          name: '商品列表',
          path: '/products/list',
          icon: 'Goods',
          meta: {
            title: '商品列表'
          },
          children: []
        },
        {
          id: 'product_categories',
          name: '商品分类',
          path: '/products/categories',
          icon: 'FolderOpened',
          meta: {
            title: '商品分类'
          },
          children: []
        },
        {
          id: 'inventory',
          name: '库存管理',
          path: '/inventory',
          icon: 'Box',
          meta: {
            title: '库存管理'
          },
          children: []
        }
      ]
    }
  })
}

// 兼容旧营销菜单数据，补齐优惠券管理二级菜单
function normalizeMarketingMenu(menu) {
  const children = Array.isArray(menu.children) ? menu.children : []

  if (children.some(child => child.id === 'coupon_management')) {
    return {
      ...menu,
      path: '/marketing',
      children: normalizeMenus(children)
    }
  }

  return {
    ...menu,
    path: '/marketing',
    children: [
      {
        id: 'coupon_management',
        name: '优惠券管理',
        path: '/marketing/coupons',
        icon: 'Tickets',
        meta: {
          title: '优惠券管理'
        },
        children: []
      }
    ]
  }
}

// 当前激活菜单
const activeMenu = computed(() => route.meta.activeMenu || route.path)

// 拉取当前用户菜单
onMounted(async () => {
  if (authStore.accessToken) {
    await authStore.loadCurrentUser()
  }
})
</script>
