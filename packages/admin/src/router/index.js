import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import LoginView from '../views/LoginView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'

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
        component: PlaceholderView,
        meta: {
          title: '仪表盘',
          description: '经营数据、待处理订单和库存预警的后台首页。'
        }
      },
      {
        path: 'products',
        name: 'products',
        component: PlaceholderView,
        meta: {
          title: '商品管理',
          description: '商品、分类、SKU 和上下架维护入口。'
        }
      },
      {
        path: 'orders',
        name: 'orders',
        component: PlaceholderView,
        meta: {
          title: '订单管理',
          description: '订单列表、订单详情和制作状态处理入口。'
        }
      },
      {
        path: 'users',
        name: 'users',
        component: PlaceholderView,
        meta: {
          title: '用户管理',
          description: '小程序用户基础信息查看入口。'
        }
      },
      {
        path: 'inventory',
        name: 'inventory',
        component: PlaceholderView,
        meta: {
          title: '库存管理',
          description: 'SKU 库存、库存预警和调整记录入口。'
        }
      },
      {
        path: 'marketing',
        name: 'marketing',
        component: PlaceholderView,
        meta: {
          title: '营销管理',
          description: '优惠券等基础营销配置入口。'
        }
      },
      {
        path: 'permissions',
        name: 'permissions',
        component: PlaceholderView,
        meta: {
          title: '权限管理',
          description: '管理员、店员和菜单权限配置入口。'
        }
      },
      {
        path: 'settings',
        name: 'settings',
        component: PlaceholderView,
        meta: {
          title: '系统设置',
          description: '门店信息和后台账号基础设置入口。'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
