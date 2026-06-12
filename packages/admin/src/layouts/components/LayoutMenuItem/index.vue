<template>
  <el-sub-menu v-if="hasChildren" :index="item.path">
    <template #title>
      <el-icon>
        <component :is="menuIcon" />
      </el-icon>
      <span>{{ menuTitle }}</span>
    </template>

    <LayoutMenuItem v-for="child in item.children" :key="child.id || child.path" :item="child" />
  </el-sub-menu>

  <el-menu-item v-else :index="item.path">
    <el-icon>
      <component :is="menuIcon" />
    </el-icon>
    <template #title>{{ menuTitle }}</template>
  </el-menu-item>
</template>

<script setup>
import {
  Box,
  DataBoard,
  Goods,
  Lock,
  Management,
  Operation,
  Setting,
  ShoppingCart,
  Tickets,
  User
} from '@element-plus/icons-vue'
import { computed } from 'vue'

defineOptions({
  name: 'LayoutMenuItem'
})

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const iconMap = {
  dashboard: DataBoard,
  products: Goods,
  orders: ShoppingCart,
  users: User,
  inventory: Box,
  marketing: Tickets,
  permissions: Lock,
  settings: Setting
}

// 菜单是否存在子级
const hasChildren = computed(() => Array.isArray(props.item.children) && props.item.children.length > 0)

// 菜单标题
const menuTitle = computed(() => props.item.meta?.title || props.item.name || '待补充')

// 菜单图标
const menuIcon = computed(() => iconMap[props.item.icon] || iconMap[props.item.id] || Management || Operation)
</script>
