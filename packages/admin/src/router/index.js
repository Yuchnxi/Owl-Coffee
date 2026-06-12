import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import { getAuthStorage } from '../utils/storage'
import DashboardView from '../views/dashboard/index.vue'
import LoginView from '../views/login/index.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
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
