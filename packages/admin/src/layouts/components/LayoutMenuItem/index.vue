<template>
  <el-sub-menu v-if="hasChildren" :index="item.path">
    <template #title>
      <el-icon>
        <SvgIcon :name="menuIconName" />
      </el-icon>
      <span>{{ menuTitle }}</span>
    </template>

    <LayoutMenuItem v-for="child in item.children" :key="child.id || child.path" :item="child" />
  </el-sub-menu>

  <el-menu-item v-else :index="item.path">
    <el-icon>
      <SvgIcon :name="menuIconName" />
    </el-icon>
    <template #title>{{ menuTitle }}</template>
  </el-menu-item>
</template>

<script setup>
import { computed } from 'vue'
import SvgIcon from '../../../components/SvgIcon/index.vue'

defineOptions({
  name: 'LayoutMenuItem'
})

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const iconNameMap = {
  dashboard: 'DataBoard',
  products: 'Goods',
  orders: 'ShoppingCart',
  users: 'User',
  inventory: 'Box',
  marketing: 'Tickets',
  permissions: 'Lock',
  settings: 'Setting',
  adminUsers: 'UserFilled',
  menuManagement: 'Menu',
  rolePermissions: 'Lock'
}

// 菜单是否存在子级
const hasChildren = computed(() => Array.isArray(props.item.children) && props.item.children.length > 0)

// 菜单标题
const menuTitle = computed(() => props.item.meta?.title || props.item.name || '待补充')

// 菜单图标名称
const menuIconName = computed(() => iconNameMap[props.item.icon] || iconNameMap[props.item.id] || props.item.icon || 'Operation')
</script>
