<template>
  <component
    :is="elementIcon"
    v-if="elementIcon"
    class="svg-icon"
    :style="iconStyle"
    aria-hidden="true"
  />
  <span
    v-else-if="svgContent"
    class="svg-icon svg-icon--custom"
    :style="iconStyle"
    aria-hidden="true"
    v-html="svgContent"
  />
  <span
    v-else
    class="svg-icon svg-icon--empty"
    :style="iconStyle"
    aria-hidden="true"
  />
</template>

<script setup>
import { computed } from 'vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'

const props = defineProps({
  name: {
    type: String,
    default: ''
  },
  size: {
    type: [Number, String],
    default: 16
  },
  color: {
    type: String,
    default: ''
  }
})

// 本地 SVG 图标模块
const svgModules = import.meta.glob('../../assets/icons/svg/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
})

// 本地 SVG 图标映射
const svgIconMap = Object.entries(svgModules).reduce((result, [path, content]) => {
  const name = path.split('/').pop().replace('.svg', '')

  result[name] = content
  return result
}, {})

// 兼容首字母大小写的图标名称
const normalizedName = computed(() => props.name || '')

// Element Plus 图标组件
const elementIcon = computed(() => ElementPlusIcons[normalizedName.value] || null)

// 本地 SVG 内容
const svgContent = computed(() => svgIconMap[normalizedName.value] || '')

// 图标样式
const iconStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size

  return {
    width: size,
    height: size,
    color: props.color || 'currentColor'
  }
})
</script>

<style scoped>
.svg-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  line-height: 1;
  vertical-align: -0.15em;
}

.svg-icon--custom :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.svg-icon--empty {
  border: 1px dashed currentColor;
  border-radius: 4px;
  opacity: 0.38;
}
</style>
