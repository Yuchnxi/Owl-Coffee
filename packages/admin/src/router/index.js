import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import { getAuthStorage } from '../utils/storage'
import DashboardView from '../views/dashboard/index.vue'
import Error401View from '../views/error/401.vue'
import Error404View from '../views/error/404.vue'
import LoginView from '../views/login/index.vue'

const AdminUsersView = () => import('../views/settings/admin-users/index.vue')

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
          title: '仪表盘'
        }
      },
      {
        path: 'settings/admin-users',
        name: 'settingsAdminUsers',
        component: AdminUsersView,
        meta: {
          title: '账号管理'
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

router.beforeEach(to => {
  const { accessToken } = getAuthStorage()

  if (to.path === '/login' && accessToken) {
    return '/dashboard'
  }

  if (to.path !== '/login' && !accessToken) {
    return '/login'
  }

  return true
})

export default router
