<template>
  <el-image
    v-if="previewSrc"
    class="image-preview"
    :class="{ 'is-clickable': previewList.length > 0 }"
    :src="previewSrc"
    :fit="fit"
    :style="previewStyle"
    :preview-src-list="previewList"
    preview-teleported
  >
    <template #error>
      <div class="image-preview__empty">
        <el-icon><PictureFilled /></el-icon>
      </div>
    </template>
  </el-image>
  <span v-else class="image-preview__placeholder" :style="previewStyle">{{ emptyText }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { PictureFilled } from '@element-plus/icons-vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const props = defineProps({
  src: {
    type: [String, Array],
    default: ''
  },
  width: {
    type: [Number, String],
    default: 88
  },
  height: {
    type: [Number, String],
    default: 66
  },
  fit: {
    type: String,
    default: 'cover'
  },
  emptyText: {
    type: String,
    default: '待补充'
  }
})

// 预览图片列表
const previewList = computed(() => normalizeSrcList(props.src).map(resolveAssetUrl).filter(Boolean))

// 当前缩略图地址
const previewSrc = computed(() => previewList.value[0] || '')

// 预览容器尺寸
const previewStyle = computed(() => ({
  width: formatSize(props.width),
  height: formatSize(props.height)
}))

// 统一整理图片地址列表
function normalizeSrcList(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string' && value) {
    return value.split(',').map(item => item.trim()).filter(Boolean)
  }

  return []
}

// 拼接上传资源访问地址
function resolveAssetUrl(url) {
  if (!url || /^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }

  return `${API_BASE_URL}${url}`
}

// 格式化尺寸
function formatSize(value) {
  if (typeof value === 'number') {
    return `${value}px`
  }

  return value || 'auto'
}
</script>

<style scoped>
.image-preview,
.image-preview__placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--oc-border);
  border-radius: 6px;
  background: rgba(4, 8, 13, 0.34);
  color: var(--oc-text-muted);
  font-size: 12px;
  vertical-align: middle;
}

.image-preview.is-clickable {
  cursor: zoom-in;
}

.image-preview :deep(.el-image__inner) {
  transition: transform 0.18s ease;
}

.image-preview:hover :deep(.el-image__inner) {
  transform: scale(1.04);
}

.image-preview__empty {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: var(--oc-text-muted);
  font-size: 24px;
}
</style>
