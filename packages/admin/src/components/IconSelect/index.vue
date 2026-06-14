<template>
  <el-popover
    v-model:visible="popoverVisible"
    trigger="click"
    placement="bottom-start"
    width="420px"
    popper-class="icon-select-popper"
  >
    <template #reference>
      <el-input
        :model-value="modelValue"
        placeholder="请选择菜单图标"
        clearable
        readonly
        @clear="handleClear"
      >
        <template #prefix>
          <SvgIcon v-if="modelValue" :name="modelValue" :size="16" />
        </template>
        <template #suffix>
          <el-icon><ArrowDown /></el-icon>
        </template>
      </el-input>
    </template>

    <section class="icon-select">
      <el-input v-model.trim="keyword" placeholder="搜索图标名称" clearable>
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="icon-select__tabs">
        <button
          class="icon-select__tab"
          :class="{ 'is-active': iconType === 'element' }"
          type="button"
          @click="iconType = 'element'"
        >
          Element Plus
        </button>
        <button
          class="icon-select__tab"
          :class="{ 'is-active': iconType === 'svg' }"
          type="button"
          @click="iconType = 'svg'"
        >
          SVG
        </button>
      </div>

      <div class="icon-select__grid">
        <button
          v-for="icon in filteredIcons"
          :key="icon.name"
          class="icon-select__item"
          :class="{ 'is-active': icon.name === modelValue }"
          type="button"
          :title="icon.name"
          @click="selectIcon(icon.name)"
        >
          <SvgIcon :name="icon.name" :size="20" />
          <span>{{ icon.name }}</span>
        </button>
      </div>

      <p v-if="filteredIcons.length === 0" class="icon-select__empty">暂无匹配图标</p>
    </section>
  </el-popover>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ArrowDown, Search } from '@element-plus/icons-vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import SvgIcon from '../SvgIcon/index.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// 弹层显示状态
const popoverVisible = ref(false)
// 图标搜索关键字
const keyword = ref('')
// 当前图标类型
const iconType = ref('element')

// Element Plus 常用图标
const elementIcons = Object.keys(ElementPlusIcons)
  .filter(name => /^[A-Z]/.test(name))
  .sort()
  .map(name => ({
    name,
    type: 'element'
  }))

// 本地 SVG 图标模块
const svgModules = import.meta.glob('../../assets/icons/svg/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
})

// 本地 SVG 图标
const svgIcons = Object.keys(svgModules)
  .map(path => ({
    name: path.split('/').pop().replace('.svg', ''),
    type: 'svg'
  }))
  .sort((left, right) => left.name.localeCompare(right.name))

// 当前类型图标列表
const currentIcons = computed(() => (iconType.value === 'element' ? elementIcons : svgIcons))

// 筛选后的图标列表
const filteredIcons = computed(() => {
  const value = keyword.value.toLowerCase()

  if (!value) {
    return currentIcons.value
  }

  return currentIcons.value.filter(icon => icon.name.toLowerCase().includes(value))
})

// 选择图标
function selectIcon(name) {
  emit('update:modelValue', name)
  emit('change', name)
  popoverVisible.value = false
}

// 清空图标
function handleClear() {
  emit('update:modelValue', '')
  emit('change', '')
}
</script>

<style scoped>
.icon-select {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-select__tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.icon-select__tab {
  height: 34px;
  border: 1px solid var(--oc-border);
  border-radius: 6px;
  background: rgba(4, 8, 13, 0.34);
  color: var(--oc-text-secondary);
  cursor: pointer;
}

.icon-select__tab.is-active {
  border-color: var(--oc-primary);
  background: var(--oc-primary-soft);
  color: var(--oc-text);
}

.icon-select__grid {
  display: grid;
  max-height: 280px;
  overflow: auto;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.icon-select__item {
  display: flex;
  min-width: 0;
  height: 72px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(181, 139, 92, 0.16);
  border-radius: 8px;
  background: rgba(4, 8, 13, 0.26);
  color: var(--oc-text-secondary);
  cursor: pointer;
}

.icon-select__item:hover,
.icon-select__item.is-active {
  border-color: var(--oc-primary);
  background: var(--oc-primary-soft);
  color: var(--oc-text);
}

.icon-select__item span {
  max-width: 100%;
  overflow: hidden;
  padding: 0 6px;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-select__empty {
  margin: 8px 0;
  color: var(--oc-text-muted);
  text-align: center;
}
</style>
