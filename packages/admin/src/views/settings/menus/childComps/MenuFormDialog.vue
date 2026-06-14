<template>
  <el-dialog
    :model-value="visible"
    :title="mode === 'create' ? '新增菜单' : '编辑菜单'"
    width="620px"
    destroy-on-close
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
      <el-form-item label="菜单 ID" prop="id">
        <el-input v-model.trim="form.id" :disabled="mode === 'edit'" placeholder="例如 menu_management" />
      </el-form-item>
      <el-form-item label="菜单名称" prop="name">
        <el-input v-model.trim="form.name" placeholder="请输入菜单名称" />
      </el-form-item>
      <el-form-item label="父级菜单">
        <el-select v-model="form.parentId" placeholder="顶级菜单" clearable>
          <el-option label="顶级菜单" value="" />
          <el-option
            v-for="item in parentOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
            :disabled="item.id === form.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="菜单路径" prop="path">
        <el-input v-model.trim="form.path" placeholder="例如 /settings/menus" />
      </el-form-item>
      <el-form-item label="图标">
        <el-input v-model.trim="form.icon" placeholder="例如 menuManagement" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="form.sort" :min="0" :step="10" controls-position="right" />
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio-button label="enabled">启用</el-radio-button>
          <el-radio-button label="disabled">禁用</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="扩展标题">
        <el-input v-model.trim="form.metaTitle" placeholder="默认使用菜单名称" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'create'
  },
  menu: {
    type: Object,
    default: null
  },
  parentOptions: {
    type: Array,
    default: () => []
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'submit'])

// 表单组件引用
const formRef = ref(null)

// 菜单表单数据
const form = reactive({
  id: '',
  name: '',
  parentId: '',
  path: '',
  icon: '',
  sort: 0,
  status: 'enabled',
  metaTitle: ''
})

// 菜单表单校验规则
const rules = {
  id: [
    { required: true, message: '请输入菜单 ID', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_-]*$/, message: '菜单 ID 只能使用小写字母、数字、下划线和中划线', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '请输入菜单路径', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
}

// 重置表单数据
function resetForm() {
  const menu = props.menu || {}

  form.id = menu.id || ''
  form.name = menu.name || ''
  form.parentId = menu.parentId || ''
  form.path = menu.path || ''
  form.icon = menu.icon || ''
  form.sort = Number(menu.sort) || 0
  form.status = menu.status || 'enabled'
  form.metaTitle = menu.meta?.title || menu.name || ''
}

// 关闭菜单弹窗
function handleClose() {
  emit('update:visible', false)
}

// 提交菜单表单
async function handleSubmit() {
  await formRef.value?.validate()

  emit('submit', {
    id: form.id,
    name: form.name,
    parentId: form.parentId || null,
    path: form.path,
    icon: form.icon,
    sort: Number(form.sort) || 0,
    status: form.status,
    meta: {
      title: form.metaTitle || form.name
    }
  })
}

watch(() => props.visible, visible => {
  if (visible) {
    resetForm()
  }
})
</script>
