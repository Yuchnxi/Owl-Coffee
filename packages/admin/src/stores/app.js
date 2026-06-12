import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 侧边栏是否收起
  const sidebarCollapsed = ref(false)

  // 切换侧边栏收起状态
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    sidebarCollapsed,
    toggleSidebar
  }
})
