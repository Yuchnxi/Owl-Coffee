import {
  DataBoard,
  Goods,
  List,
  User,
  Box,
  Ticket,
  Lock,
  Setting
} from '@element-plus/icons-vue'

export const adminMenus = [
  {
    path: '/dashboard',
    title: '仪表盘',
    icon: DataBoard
  },
  {
    path: '/products',
    title: '商品管理',
    icon: Goods
  },
  {
    path: '/orders',
    title: '订单管理',
    icon: List
  },
  {
    path: '/users',
    title: '用户管理',
    icon: User
  },
  {
    path: '/inventory',
    title: '库存管理',
    icon: Box
  },
  {
    path: '/marketing',
    title: '营销管理',
    icon: Ticket
  },
  {
    path: '/permissions',
    title: '权限管理',
    icon: Lock
  },
  {
    path: '/settings',
    title: '系统设置',
    icon: Setting
  }
]
