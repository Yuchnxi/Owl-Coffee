<template>
  <el-dialog
    v-model="dialogVisible"
    :title="mode === 'create' ? '新增分类' : '编辑分类'"
    width="480px"
    destroy-on-close
  >
    <el-form ref="formRef" class="category-form" :model="form" :rules="rules" label-width="92px">
      <el-form-item label="分类名称" prop="name">
        <el-input v-model.trim="form.name" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="form.sort" :min="0" :step="1" controls-position="right" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio-button label="enabled">启用</el-radio-button>
          <el-radio-button label="disabled">禁用</el-radio-button>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'create'
  },
  category: {
    type: Object,
    default: null
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'submit'])

// 表单引用
const formRef = ref(null)

// 分类表单数据
const form = reactive({
  id: '',
  name: '',
  sort: 0,
  status: 'enabled'
})

// 弹窗显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

// 分类表单校验规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 64, message: '分类名称不能超过 64 个字符', trigger: 'blur' }
  ],
  sort: [
    {
      validator: (_, value, callback) => {
        if (!Number.isInteger(Number(value)) || Number(value) < 0) {
          callback(new Error('排序不能小于 0'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 同步传入分类到表单
function syncForm() {
  const category = props.category || {}

  form.id = category.id || ''
  form.name = category.name || ''
  form.sort = Number(category.sort) || 0
  form.status = category.status || 'enabled'

  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 提交分类表单
async function handleSubmit() {
  await formRef.value?.validate()

  emit('submit', {
    id: form.id,
    name: form.name,
    sort: form.sort,
    status: form.status
  })
}

watch(() => props.visible, value => {
  if (value) {
    syncForm()
  }
})
</script>

<style scoped>
.category-form {
  display: grid;
  grid-template-columns: 1fr;
}

.category-form :deep(.el-input),
.category-form :deep(.el-input-number),
.category-form :deep(.el-radio-group) {
  width: 100%;
}
</style>
