<template>
  <main class="login-page">
    <section class="login-hero" aria-label="Owl Coffee 品牌区">
      <div class="login-hero__brand">
        <img class="login-brand-logo" :src="logoHorizontal" alt="Owl Coffee Logo" />
        <h1>Owl Coffee 管理系统</h1>
        <p class="login-hero__slogan">一杯好咖啡，从用心管理开始</p>
      </div>
    </section>

    <section class="login-panel" aria-label="登录表单">
      <div class="login-panel__header">
        <h2>欢迎回来</h2>
        <p>登录 Owl Coffee 管理系统</p>
      </div>

      <el-form class="login-form" label-position="top" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model.trim="form.account"
            size="large"
            placeholder="请输入账号"
            :prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="form.password"
            size="large"
            placeholder="请输入密码"
            type="password"
            show-password
            :prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <div class="captcha-row">
            <el-input
              v-model.trim="form.captchaCode"
              size="large"
              placeholder="请输入验证码"
              :prefix-icon="Key"
              @keyup.enter="handleLogin"
            />
            <button class="captcha-code" type="button" aria-label="验证码" @click="loadCaptcha">
              <img v-if="captchaImageUrl" :src="captchaImageUrl" alt="登录验证码" />
              <span v-else>待补充</span>
            </button>
          </div>
        </el-form-item>

        <div class="login-options">
          <el-checkbox v-model="rememberAccount">记住账号</el-checkbox>
          <button class="login-link" type="button">联系管理员</button>
        </div>

        <el-button class="login-submit" size="large" type="primary" :loading="loginLoading" @click="handleLogin">
          登 录
        </el-button>
      </el-form>
    </section>

    <footer class="login-footer">
      © {{ currentYear }} Owl Coffee. 保留所有权利。
    </footer>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Key, Lock, User } from '@element-plus/icons-vue'
import { fetchCaptcha } from '../../api/auth'
import logoHorizontal from '../../assets/logo/owlcoffee_logo_horizontal.png'
import { useAuthStore } from '../../stores/auth'

// 路由实例
const router = useRouter()

// 登录状态
const authStore = useAuthStore()

// 登录表单数据
const form = reactive({
  account: '',
  password: '',
  captchaId: '',
  captchaCode: ''
})

// 是否记住账号
const rememberAccount = ref(true)

// 登录按钮加载状态
const loginLoading = ref(false)

// 验证码图片地址
const captchaImageUrl = ref('')

// 当前年份
const currentYear = new Date().getFullYear()

// 加载登录验证码
async function loadCaptcha() {
  try {
    const data = await fetchCaptcha()

    form.captchaId = data.captchaId || ''
    captchaImageUrl.value = data.imageUrl && data.imageUrl !== '待补充' ? data.imageUrl : ''
  } catch (err) {
    captchaImageUrl.value = ''
  }
}

// 提交登录表单
async function handleLogin() {
  if (loginLoading.value) {
    return
  }

  if (!form.account || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }

  loginLoading.value = true

  try {
    await authStore.login({
      account: form.account,
      password: form.password,
      captchaId: form.captchaId,
      captchaCode: form.captchaCode
    })
    ElMessage.success('登录成功')
    router.replace('/dashboard')
  } catch (err) {
    await loadCaptcha()
  } finally {
    loginLoading.value = false
  }
}

loadCaptcha()
</script>

<style scoped>
.login-page {
  grid-template-columns: minmax(560px, 1fr) minmax(560px, 680px);
  align-items: center;
  padding: 72px 92px 68px;
  background:
    linear-gradient(90deg, rgba(10, 6, 3, 0.28) 0%, rgba(7, 11, 16, 0.54) 48%, rgba(7, 11, 16, 0.88) 100%),
    linear-gradient(180deg, rgba(7, 11, 16, 0.12), rgba(7, 11, 16, 0.3)),
    url("../../assets/admin_login_bg.png") center / cover no-repeat;
}

.login-page::before {
  display: none;
  content: none;
}

.login-brand-logo {
  display: block;
  width: 210px;
  height: auto;
  margin: 0 auto 16px;
  object-fit: contain;
  filter: drop-shadow(0 18px 36px rgba(238, 146, 38, 0.18));
}

.login-hero {
  align-self: start;
  justify-content: flex-start;
  padding-top: 0;
  padding-right: 0;
}

.login-hero__brand {
  width: 560px;
  transform: translate(-22px, -60px);
}

.login-hero h1 {
  margin-top: 22px;
  font-size: 32px;
}

.login-hero__slogan {
  position: relative;
  display: inline-flex;
  align-items: center;
  color: #f2d6b3;
  gap: 12px;
}

.login-hero__slogan::before,
.login-hero__slogan::after {
  width: 42px;
  height: 1px;
  background: rgba(238, 146, 38, 0.72);
  content: "";
}

.login-panel {
  justify-self: center;
  width: min(100%, 575px);
  min-height: 600px;
  padding: 76px 70px 68px;
}

.login-panel__header h2 {
  font-size: 34px;
}

.login-form .el-form-item {
  margin-bottom: 30px;
}

.login-submit {
  min-height: 58px;
}

.captcha-code img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 1280px) {
  .login-page {
    grid-template-columns: minmax(420px, 1fr) minmax(500px, 560px);
    padding: 56px 64px 58px;
  }

  .login-hero__brand {
    width: 460px;
    transform: translateY(-48px);
  }

  .login-panel {
    min-height: 520px;
    padding: 56px 54px 52px;
  }
}

@media (max-width: 1100px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-hero {
    align-self: center;
    padding-top: 0;
  }

  .login-hero__brand {
    width: min(520px, 100%);
    transform: none;
  }
}

@media (max-width: 760px) {
  .login-brand-logo {
    width: min(210px, 68vw);
  }

  .login-panel {
    min-height: auto;
  }
}
</style>
