<template>
  <el-dialog
    v-model="dialogVisible"
    :title="mode === 'create' ? '新增轮播图' : '编辑轮播图'"
    width="680px"
    destroy-on-close
    @closed="resetForm"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
      <el-form-item label="标题" prop="title">
        <el-input v-model.trim="form.title" placeholder="请输入轮播图标题" maxlength="128" show-word-limit />
      </el-form-item>

      <el-form-item label="辅助文案" prop="kicker">
        <el-input v-model.trim="form.kicker" placeholder="例如 Owl Coffee，可留空" maxlength="64" show-word-limit />
      </el-form-item>

      <el-form-item label="轮播图片" prop="imageUrl">
        <ImageUpload v-model="form.imageUrl" biz-type="banner" :limit="1" size="180px" />
      </el-form-item>

      <el-form-item label="跳转类型" prop="linkType">
        <el-radio-group v-model="form.linkType">
          <el-radio-button label="none">不跳转</el-radio-button>
          <el-radio-button label="page">小程序页面</el-radio-button>
          <el-radio-button label="url">网页地址</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.linkType !== 'none'" label="跳转地址" prop="linkUrl">
        <el-input
          v-model.trim="form.linkUrl"
          :placeholder="form.linkType === 'page' ? '例如 /pages/menu/index' : '请输入网页地址'"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="form.sort" :min="0" :precision="0" :step="1" controls-position="right" />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" placeholder="请选择状态">
          <el-option label="启用" value="enabled" />
          <el-option label="停用" value="disabled" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import ImageUpload from '../../../../components/ImageUpload/index.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'create'
  },
  banner: {
    type: Object,
    default: null
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'submit'])

// 表单实例
const formRef = ref(null)

// 轮播图表单
const form = reactive(createDefaultForm())

// 弹窗显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

// 表单校验规则
const rules = {
  title: [{ required: true, message: '请输入轮播图标题', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请上传轮播图片', trigger: 'change' }],
  linkType: [{ required: true, message: '请选择跳转类型', trigger: 'change' }],
  linkUrl: [{ validator: validateLinkUrl, trigger: 'blur' }],
  sort: [{ required: true, validator: validateSort, trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      fillForm(props.banner)
    }
  }
)

// 创建默认表单
function createDefaultForm() {
  return {
    title: '',
    kicker: 'Owl Coffee',
    imageUrl: '',
    linkType: 'none',
    linkUrl: '',
    sort: 0,
    status: 'enabled'
  }
}

// 回填表单
function fillForm(banner) {
  const nextForm = createDefaultForm()

  if (banner) {
    nextForm.title = banner.title || ''
    nextForm.kicker = banner.kicker || ''
    nextForm.imageUrl = banner.imageUrl || ''
    nextForm.linkType = banner.linkType || 'none'
    nextForm.linkUrl = banner.linkUrl || ''
    nextForm.sort = Number(banner.sort) || 0
    nextForm.status = banner.status || 'enabled'
  }

  Object.assign(form, nextForm)
}

// 重置表单
function resetForm() {
  formRef.value?.clearValidate()
  Object.assign(form, createDefaultForm())
}

// 提交轮播图表单
async function submitForm() {
  await formRef.value?.validate()

  emit('submit', {
    title: form.title,
    kicker: form.kicker,
    imageUrl: form.imageUrl,
    linkType: form.linkType,
    linkUrl: form.linkType === 'none' ? '' : form.linkUrl,
    sort: Number(form.sort),
    status: form.status
  })
}

// 校验跳转地址
function validateLinkUrl(rule, value, callback) {
  if (form.linkType !== 'none' && !value) {
    callback(new Error('请输入跳转地址'))
    return
  }

  callback()
}

// 校验排序
function validateSort(rule, value, callback) {
  if (!Number.isInteger(Number(value)) || Number(value) < 0) {
    callback(new Error('排序必须为不小于 0 的整数'))
    return
  }

  callback()
}
</script>
