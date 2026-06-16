<template>
  <div class="image-upload">
    <div class="image-upload__list" v-if="fileList.length > 0">
      <div v-for="file in fileList" :key="file.uid || file.url" class="image-upload__item">
        <ImagePreview :src="file.url" :width="size" :height="size" />
        <button
          v-if="!disabled"
          class="image-upload__remove"
          type="button"
          aria-label="移除图片"
          @click="removeFile(file)"
        >
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>

    <el-upload
      v-if="!disabled && fileList.length < limit"
      class="image-upload__trigger"
      :show-file-list="false"
      :http-request="uploadFile"
      :accept="accept"
      :disabled="uploading"
      :multiple="multiple"
      :limit="limit"
      :on-exceed="handleExceed"
      :before-upload="beforeUpload"
    >
      <div class="image-upload__button" :style="buttonStyle">
        <el-icon v-if="!uploading"><Plus /></el-icon>
        <el-icon v-else class="is-loading"><Loading /></el-icon>
        <span>{{ uploading ? '上传中' : placeholder }}</span>
      </div>
    </el-upload>

    <div v-if="showTip && !disabled" class="image-upload__tip">
      支持 {{ fileType.join(' / ') }}，单张不超过 {{ fileSize }}MB
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, Loading, Plus } from '@element-plus/icons-vue'
import { request } from '../../utils/request'
import ImagePreview from '../ImagePreview/index.vue'

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: ''
  },
  action: {
    type: String,
    default: '/api/admin/uploads'
  },
  bizType: {
    type: String,
    default: 'common'
  },
  limit: {
    type: Number,
    default: 1
  },
  multiple: {
    type: Boolean,
    default: false
  },
  fileSize: {
    type: Number,
    default: 5
  },
  fileType: {
    type: Array,
    default: () => ['png', 'jpg', 'jpeg', 'webp']
  },
  size: {
    type: [Number, String],
    default: 88
  },
  placeholder: {
    type: String,
    default: '上传图片'
  },
  showTip: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'remove'])

// 上传中的状态
const uploading = ref(false)

// 当前图片列表
const fileList = ref([])

// 文件选择类型
const accept = computed(() => props.fileType.map(type => `.${type}`).join(','))

// 上传按钮尺寸
const buttonStyle = computed(() => ({
  width: formatSize(props.size),
  height: formatSize(props.size)
}))

// 同步外部绑定值
watch(
  () => props.modelValue,
  value => {
    fileList.value = normalizeValue(value).slice(0, props.limit).map((url, index) => ({
      uid: `${url}-${index}`,
      name: getFileName(url),
      url
    }))
  },
  {
    immediate: true,
    deep: true
  }
)

// 上传前校验图片格式和大小
function beforeUpload(file) {
  const extension = getFileExtension(file.name)
  const validType = props.fileType.includes(extension)
  const validSize = file.size / 1024 / 1024 <= props.fileSize

  if (!validType) {
    ElMessage.warning(`请上传 ${props.fileType.join(' / ')} 格式图片`)
    return false
  }

  if (!validSize) {
    ElMessage.warning(`图片大小不能超过 ${props.fileSize}MB`)
    return false
  }

  return true
}

// 执行图片上传
async function uploadFile(options) {
  uploading.value = true

  try {
    const formData = new FormData()

    formData.append('bizType', props.bizType)
    formData.append('file', options.file)

    const result = await request({
      url: props.action,
      method: 'post',
      data: formData
    })
    const nextFile = {
      uid: options.file.uid || result.fileId || result.url,
      name: result.originalName || options.file.name,
      url: result.url
    }

    fileList.value = props.multiple
      ? fileList.value.concat(nextFile).slice(0, props.limit)
      : [nextFile]

    emitValue()
    emit('success', result)
    options.onSuccess?.(result)
    ElMessage.success('图片已上传')
  } catch (err) {
    options.onError?.(err)
  } finally {
    uploading.value = false
  }
}

// 移除图片
function removeFile(file) {
  fileList.value = fileList.value.filter(item => item.url !== file.url)
  emitValue()
  emit('remove', file)
}

// 超出数量提醒
function handleExceed() {
  ElMessage.warning(`最多上传 ${props.limit} 张图片`)
}

// 回传绑定值
function emitValue() {
  const urls = fileList.value.map(file => file.url).filter(Boolean)

  emit('update:modelValue', props.multiple ? urls : (urls[0] || ''))
}

// 标准化绑定值
function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }

  if (typeof value === 'string' && value) {
    return value.split(',').map(item => item.trim()).filter(Boolean)
  }

  return []
}

// 获取文件后缀
function getFileExtension(filename = '') {
  return filename.includes('.') ? filename.split('.').pop().toLowerCase() : ''
}

// 获取文件名
function getFileName(url = '') {
  return url.split('/').pop() || url
}

// 格式化尺寸
function formatSize(value) {
  if (typeof value === 'number') {
    return `${value}px`
  }

  return value || '88px'
}
</script>

<style scoped>
.image-upload {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.image-upload__list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.image-upload__item {
  position: relative;
  line-height: 0;
}

.image-upload__remove {
  position: absolute;
  top: -7px;
  right: -7px;
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: rgba(11, 14, 18, 0.92);
  color: var(--oc-text);
  cursor: pointer;
}

.image-upload__trigger {
  line-height: 1;
}

.image-upload__button {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px dashed rgba(199, 126, 71, 0.56);
  border-radius: 6px;
  background: rgba(4, 8, 13, 0.34);
  color: var(--oc-text-secondary);
  font-size: 12px;
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
}

.image-upload__button:hover {
  border-color: var(--oc-accent);
  background: rgba(199, 126, 71, 0.1);
  color: var(--oc-text);
}

.image-upload__tip {
  width: 100%;
  color: var(--oc-text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.is-loading {
  animation: image-upload-rotate 1s linear infinite;
}

@keyframes image-upload-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
