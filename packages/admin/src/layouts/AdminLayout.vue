<template>
  <el-container class="admin-layout">
    <el-container class="admin-layout__body">
      <LayoutAside />

      <el-container class="admin-layout__content">
        <LayoutHeader />
        <LayoutMain />
      </el-container>
    </el-container>

    <LayoutFooter />
  </el-container>
</template>

<script setup>
import LayoutAside from './components/LayoutAside/index.vue'
import LayoutFooter from './components/LayoutFooter/index.vue'
import LayoutHeader from './components/LayoutHeader/index.vue'
import LayoutMain from './components/LayoutMain/index.vue'
</script>
