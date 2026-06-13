<template>
  <section class="error-page" aria-label="401 无访问权限">
    <div class="error-page__content">
      <div class="error-page__visual" aria-hidden="true">
        <div class="error-illustration">
          <img v-if="errorIllustration" :src="errorIllustration" alt="" />
          <div v-else class="error-illustration__placeholder">
            <el-icon><Lock /></el-icon>
            <span>401 插画待补充</span>
          </div>
        </div>
      </div>

      <div class="error-page__info">
        <p class="error-page__eyebrow">Owl Coffee 管理系统</p>
        <h1>401</h1>
        <h2>当前账号暂无访问权限</h2>
        <p>
          你可能正在访问未分配权限的后台区域。请返回仪表盘，或联系管理员补充对应权限。
        </p>

        <div class="error-page__actions">
          <el-button type="primary" :icon="House" @click="goDashboard">返回仪表盘</el-button>
          <el-button :icon="ArrowLeft" @click="goBack">返回上一页</el-button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ArrowLeft, House, Lock } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

// 路由实例
const router = useRouter()

// 401 错误页插画，后续替换为真实插画资源
const errorIllustration = ''

// 返回后台仪表盘
function goDashboard() {
  router.push('/dashboard')
}

// 返回上一个浏览位置
function goBack() {
  router.back()
}
</script>

<style scoped>
.error-page {
  display: grid;
  min-height: calc(100vh - 56px - 78px);
  place-items: center;
}

.error-page__content {
  display: grid;
  width: min(100%, 980px);
  grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1fr);
  align-items: center;
  gap: 42px;
}

.error-page__visual {
  display: grid;
  min-height: 360px;
  place-items: center;
}

.error-illustration {
  display: grid;
  width: min(360px, 100%);
  aspect-ratio: 1 / 0.86;
  place-items: center;
  border: 1px solid var(--oc-border);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(238, 146, 38, 0.1), rgba(7, 11, 16, 0.18)),
    repeating-linear-gradient(90deg, rgba(247, 230, 207, 0.05) 0 1px, transparent 1px 44px);
  box-shadow: inset 0 -52px 90px rgba(0, 0, 0, 0.32);
}

.error-illustration img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.error-illustration__placeholder {
  display: grid;
  width: 74%;
  height: 70%;
  place-items: center;
  border: 1px solid rgba(238, 146, 38, 0.38);
  border-radius: 8px;
  background: rgba(17, 25, 35, 0.88);
  color: var(--oc-primary);
  font-weight: 800;
}

.error-illustration__placeholder .el-icon {
  font-size: 58px;
}

.error-illustration__placeholder span {
  color: var(--oc-text-secondary);
  font-size: 14px;
}

.error-page__info {
  min-width: 0;
}

.error-page__eyebrow {
  margin: 0 0 14px;
  color: var(--oc-primary);
  font-size: 14px;
  font-weight: 800;
}

.error-page__info h1 {
  margin: 0;
  color: var(--oc-text);
  font-size: 86px;
  line-height: 1;
}

.error-page__info h2 {
  margin: 16px 0 12px;
  color: var(--oc-text);
  font-size: 26px;
}

.error-page__info p {
  max-width: 520px;
  margin: 0;
  color: var(--oc-text-secondary);
  font-size: 15px;
  line-height: 1.8;
}

.error-page__actions {
  display: flex;
  flex-wrap: wrap;
  margin-top: 28px;
  gap: 12px;
}

@media (max-width: 900px) {
  .error-page__content {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .error-page__visual {
    min-height: 300px;
  }
}
</style>
