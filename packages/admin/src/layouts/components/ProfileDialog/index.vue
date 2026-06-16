<template>
  <el-dialog v-model="dialogVisible" title="个人中心" width="620px" destroy-on-close @open="loadProfile">
    <el-form ref="formRef" class="profile-form" :model="form" :rules="rules" label-width="92px">
      <div class="profile-form__header">
        <ImageUpload v-model="form.avatarUrl" biz-type="avatar" :limit="1" :size="88" :show-tip="false" />
        <div class="profile-form__identity">
          <strong>{{ form.adminName || '管理员' }}</strong>
          <span>{{ form.account || '待补充' }}</span>
          <el-tag effect="dark" type="warning">{{ form.roleName || '待补充' }}</el-tag>
        </div>
      </div>

      <el-form-item label="登录账号">
        <el-input v-model="form.account" disabled />
      </el-form-item>
      <el-form-item label="姓名" prop="adminName">
        <el-input v-model.trim="form.adminName" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model.trim="form.phone" placeholder="待补充" />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" show-password placeholder="不修改可留空" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitProfile">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAccountSetting, updateAccountSetting } from '../../../api/setting'
import ImageUpload from '../../../components/ImageUpload/index.vue'
import { useAuthStore } from '../../../stores/auth'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

// 当前登录状态
const authStore = useAuthStore()

// 表单引用
const formRef = ref(null)

// 提交状态
const submitting = ref(false)

// 个人中心表单
const form = reactive({
  account: '',
  adminName: '',
  phone: '',
  avatarUrl: '',
  roleName: '',
  newPassword: '',
  confirmPassword: ''
})

// 弹窗显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

// 表单校验规则
const rules = {
  adminName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { max: 64, message: '姓名不能超过 64 个字符', trigger: 'blur' }
  ],
  phone: [
    { max: 32, message: '手机号不能超过 32 个字符', trigger: 'blur' }
  ],
  newPassword: [
    {
      validator: (_, value, callback) => {
        if (value && value.length < 6) {
          callback(new Error('新密码不能少于 6 位'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    {
      validator: (_, value, callback) => {
        if (form.newPassword && value !== form.newPassword) {
          callback(new Error('两次输入的新密码不一致'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

// 加载个人资料
async function loadProfile() {
  const data = await fetchAccountSetting()

  form.account = data.account || ''
  form.adminName = data.adminName || ''
  form.phone = data.phone || ''
  form.avatarUrl = data.avatarUrl || ''
  form.roleName = data.roleName || ''
  form.newPassword = ''
  form.confirmPassword = ''
  formRef.value?.clearValidate()
}

// 提交个人资料
async function submitProfile() {
  await formRef.value?.validate()
  submitting.value = true

  try {
    await updateAccountSetting({
      adminName: form.adminName,
      phone: form.phone || null,
      avatarUrl: form.avatarUrl || null,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword
    })
    await authStore.loadCurrentUser()
    ElMessage.success('个人资料已更新')
    dialogVisible.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.profile-form__header {
  display: flex;
  align-items: center;
  margin-bottom: 22px;
  padding: 14px;
  border: 1px solid rgba(181, 139, 92, 0.16);
  border-radius: 8px;
  background: rgba(4, 8, 13, 0.28);
  gap: 16px;
}

.profile-form__identity {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.profile-form__identity strong {
  color: var(--oc-text);
  font-size: 18px;
}

.profile-form__identity span {
  color: var(--oc-text-secondary);
  font-size: 13px;
}

.profile-form :deep(.el-input),
.profile-form :deep(.el-select) {
  width: 100%;
}
</style>
