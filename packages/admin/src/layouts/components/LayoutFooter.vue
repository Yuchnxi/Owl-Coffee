<template>
  <el-footer class="admin-footer">
    <span>© {{ currentYear }} Owl Coffee 管理系统</span>
  </el-footer>
</template>

<script setup>
// 当前年份
const currentYear = new Date().getFullYear()
</script>
