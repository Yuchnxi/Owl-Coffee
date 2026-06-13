<template>
  <el-dialog
    v-model="dialogVisible"
    :title="mode === 'create' ? '新增账号' : '编辑账号'"
    width="560px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
      <el-form-item label="登录账号" prop="account">
        <el-input
          v-model.trim="form.account"
          :disabled="mode === 'edit'"
          placeholder="英文、数字、下划线"
        />
      </el-form-item>
      <el-form-item label="姓名" prop="name">
        <el-input v-model.trim="form.name" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model.trim="form.phone" placeholder="待补充" />
      </el-form-item>
      <el-form-item label="角色" prop="roleId">
        <el-select v-model="form.roleId" placeholder="请选择角色">
          <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="mode === 'create'" label="初始密码" prop="password">
        <el-input v-model="form.password" type="password" show-password placeholder="不少于 6 位" />
      </el-form-item>
      <el-form-item v-if="mode === 'create'" label="状态" prop="status">
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

const ACCOUNT_PATTERN = /^[A-Za-z0-9_]{4,32}$/

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'create'
  },
  account: {
    type: Object,
    default: null
  },
  roles: {
    type: Array,
    default: () => []
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'submit'])

// 表单引用
const formRef = ref(null)

// 表单数据
const form = reactive({
  id: '',
  account: '',
  name: '',
  phone: '',
  roleId: '',
  password: '',
  status: 'enabled'
})

// 弹窗显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

// 表单校验规则
const rules = {
  account: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (!ACCOUNT_PATTERN.test(value || '')) {
          callback(new Error('只能使用 4-32 位英文、数字和下划线'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { max: 64, message: '姓名不能超过 64 个字符', trigger: 'blur' }
  ],
  phone: [
    { max: 32, message: '手机号不能超过 32 个字符', trigger: 'blur' }
  ],
  roleId: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于 6 位', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 同步传入账号到表单
function syncForm() {
  const account = props.account || {}

  form.id = account.id || ''
  form.account = account.account || ''
  form.name = account.name || ''
  form.phone = account.phone || ''
  form.roleId = account.roleId || props.roles[0]?.id || ''
  form.password = ''
  form.status = account.status || 'enabled'

  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 提交表单
async function handleSubmit() {
  await formRef.value?.validate()

  emit('submit', {
    id: form.id,
    account: form.account,
    name: form.name,
    phone: form.phone,
    roleId: form.roleId,
    password: form.password,
    status: form.status
  })
}

watch(() => props.visible, value => {
  if (value) {
    syncForm()
  }
})

watch(() => props.roles, () => {
  if (props.visible && !form.roleId) {
    form.roleId = props.roles[0]?.id || ''
  }
})
</script>
