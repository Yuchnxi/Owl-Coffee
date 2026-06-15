import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import { useAuthStore } from '../stores/auth'
import { getAuthStorage } from '../utils/storage'
import DashboardView from '../views/dashboard/index.vue'
import Error401View from '../views/error/401.vue'
import Error404View from '../views/error/404.vue'
import LoginView from '../views/login/index.vue'

const ProductListView = () => import('../views/products/list/index.vue')
const ProductCategoriesView = () => import('../views/products/categories/index.vue')
const InventoryView = () => import('../views/products/inventory/index.vue')
const OrdersView = () => import('../views/orders/index.vue')
const UsersView = () => import('../views/users/index.vue')
const CouponManagementView = () => import('../views/marketing/coupons/index.vue')
const AdminUsersView = () => import('../views/settings/admin-users/index.vue')
const MenusView = () => import('../views/settings/menus/index.vue')
const RolePermissionsView = () => import('../views/settings/role-permissions/index.vue')

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: '登录'
    }
  },
  {
    path: '/',
    component: AdminLayout,
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: {
          title: '仪表盘',
          menuId: 'dashboard'
        }
      },
      {
        path: 'products',
        name: 'products',
        redirect: '/products/list',
        meta: {
          title: '商品管理',
          menuId: 'products'
        }
      },
      {
        path: 'products/list',
        name: 'productList',
        component: ProductListView,
        meta: {
          title: '商品列表',
          menuId: 'product_list',
          activeMenu: '/products/list'
        }
      },
      {
        path: 'products/categories',
        name: 'productCategories',
        component: ProductCategoriesView,
        meta: {
          title: '商品分类',
          menuId: 'product_categories',
          activeMenu: '/products/categories'
        }
      },
      {
        path: 'inventory',
        name: 'inventory',
        component: InventoryView,
        meta: {
          title: '库存管理',
          menuId: 'inventory',
          activeMenu: '/inventory'
        }
      },
      {
        path: 'orders',
        name: 'orders',
        component: OrdersView,
        meta: {
          title: '订单管理',
          menuId: 'orders'
        }
      },
      {
        path: 'users',
        name: 'users',
        component: UsersView,
        meta: {
          title: '用户管理',
          menuId: 'users'
        }
      },
      {
        path: 'marketing',
        name: 'marketing',
        redirect: '/marketing/coupons',
        meta: {
          title: '营销管理',
          menuId: 'marketing'
        }
      },
      {
        path: 'marketing/coupons',
        name: 'couponManagement',
        component: CouponManagementView,
        meta: {
          title: '优惠券管理',
          menuId: 'coupon_management',
          activeMenu: '/marketing/coupons'
        }
      },
      {
        path: 'settings/admin-users',
        name: 'settingsAdminUsers',
        component: AdminUsersView,
        meta: {
          title: '账号管理',
          menuId: 'admin_users'
        }
      },
      {
        path: 'settings/menus',
        name: 'settingsMenus',
        component: MenusView,
        meta: {
          title: '菜单管理',
          menuId: 'menu_management'
        }
      },
      {
        path: 'settings/role-permissions',
        name: 'settingsRolePermissions',
        component: RolePermissionsView,
        meta: {
          title: '角色权限',
          menuId: 'role_permissions'
        }
      },
      {
        path: '401',
        name: 'error401',
        component: Error401View,
        meta: {
          title: '无访问权限'
        }
      },
      {
        path: '404',
        name: 'error404',
        component: Error404View,
        meta: {
          title: '页面不存在'
        }
      },
      {
        path: ':pathMatch(.*)*',
        redirect: '/404'
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async to => {
  const { accessToken } = getAuthStorage()

  if (to.path === '/login' && accessToken) {
    return '/dashboard'
  }

  if (to.path !== '/login' && !accessToken) {
    return '/login'
  }

  if (to.meta.menuId && !isPublicMenu(to.meta.menuId)) {
    const authStore = useAuthStore()

    if (!authStore.user?.menus && authStore.accessToken) {
      await authStore.loadCurrentUser()
    }

    if (!hasMenuPermission(authStore.user?.menus || [], to.meta.menuId)) {
      return '/401'
    }
  }

  return true
})

// 判断是否为固定开放菜单
function isPublicMenu(menuId) {
  return menuId === 'dashboard'
}

// 判断当前菜单树是否包含目标菜单
function hasMenuPermission(menus, menuId) {
  if (isLegacyProductChildMenu(menus, menuId)) {
    return true
  }

  if (isLegacyMarketingChildMenu(menus, menuId)) {
    return true
  }

  for (const menu of menus) {
    if (menu.id === menuId) {
      return true
    }

    if (Array.isArray(menu.children) && hasMenuPermission(menu.children, menuId)) {
      return true
    }
  }

  return false
}

// 兼容旧商品菜单权限，父级 products 可访问商品二级页面
function isLegacyProductChildMenu(menus, menuId) {
  const productChildMenus = ['product_list', 'product_categories', 'inventory']

  if (!productChildMenus.includes(menuId)) {
    return false
  }

  return menus.some(menu => {
    if (menu.id === 'products') {
      return true
    }

    return Array.isArray(menu.children) && isLegacyProductChildMenu(menu.children, menuId)
  })
}

// 兼容旧营销菜单权限，父级 marketing 可访问优惠券管理
function isLegacyMarketingChildMenu(menus, menuId) {
  if (menuId !== 'coupon_management') {
    return false
  }

  return menus.some(menu => {
    if (menu.id === 'marketing') {
      return true
    }

    return Array.isArray(menu.children) && isLegacyMarketingChildMenu(menu.children, menuId)
  })
}

export default router
