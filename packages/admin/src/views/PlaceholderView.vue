<template>
  <section class="admin-page">
    <div class="admin-page__heading">
      <div>
        <p class="admin-page__eyebrow">后台模块</p>
        <h2>{{ title }}</h2>
      </div>
      <el-button type="primary" :icon="Plus">新增</el-button>
    </div>

    <section class="admin-search-panel" aria-label="搜索区域">
      <div class="admin-section-title">搜索区域</div>
      <el-form class="admin-search-form" label-position="top">
        <el-form-item label="关键词">
          <el-input placeholder="待补充" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select placeholder="待补充" clearable>
            <el-option label="待补充" value="placeholder" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <div class="admin-search-actions">
          <el-button type="primary" :icon="Search">搜索</el-button>
          <el-button :icon="Refresh">重置</el-button>
        </div>
      </el-form>
    </section>

    <section class="admin-toolbar" aria-label="功能按钮区域">
      <div>
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
      </div>
      <div class="admin-toolbar__actions">
        <el-button :icon="Download">导出</el-button>
        <el-button type="primary" :icon="Plus">新增</el-button>
      </div>
    </section>

    <section class="admin-table-panel" aria-label="表格区域">
      <el-table :data="tableData" height="360">
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="status" label="状态" width="140">
          <template #default>
            <el-tag type="warning" effect="dark">待补充</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default>
            <el-button link type="primary">查看</el-button>
            <el-button link type="primary">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <footer class="admin-pagination" aria-label="分页区域">
      <el-pagination layout="total, prev, pager, next" :total="0" />
    </footer>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Download, Plus, Refresh, Search } from '@element-plus/icons-vue'

// 当前路由信息
const route = useRoute()

// 当前模块标题
const title = computed(() => route.meta.title || '后台模块')

// 当前模块说明
const description = computed(() => route.meta.description || '功能待补充。')

// 占位表格数据
const tableData = []
</script>
