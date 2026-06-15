<template>
  <el-dialog v-model="dialogVisible" title="商品详情" width="760px" destroy-on-close>
    <template v-if="product">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="商品名称">{{ product.name }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ product.categoryName || '待补充' }}</el-descriptions-item>
        <el-descriptions-item label="商品状态">
          {{ getProductStatusLabel(product.productStatus) }}
        </el-descriptions-item>
        <el-descriptions-item label="是否推荐">
          {{ product.isRecommended ? '推荐' : '普通' }}
        </el-descriptions-item>
        <el-descriptions-item label="排序">{{ product.sort }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ product.updatedAt ? dayjs(product.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '待补充' }}
        </el-descriptions-item>
        <el-descriptions-item label="商品图片" :span="2">
          <el-image
            v-if="product.imageUrl"
            class="detail-cover"
            :src="resolveAssetUrl(product.imageUrl)"
            fit="cover"
            :preview-src-list="[resolveAssetUrl(product.imageUrl)]"
            preview-teleported
          />
          <span v-else>待补充</span>
        </el-descriptions-item>
        <el-descriptions-item label="商品描述" :span="2">
          {{ product.description || '待补充' }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="detail-skus-title">SKU 明细</div>
      <el-table :data="product.skus || []" max-height="260" empty-text="暂无 SKU">
        <el-table-column prop="skuCode" label="SKU 编码" min-width="150" align="center" />
        <el-table-column prop="temperature" label="温度" min-width="90" align="center" />
        <el-table-column prop="cupSize" label="杯型" min-width="90" align="center" />
        <el-table-column prop="sugarLevel" label="糖度" min-width="90" align="center" />
        <el-table-column label="售价" min-width="90" align="center">
          <template #default="{ row }">¥{{ formatMoney(row.price) }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" min-width="80" align="center" />
        <el-table-column prop="warningStock" label="预警" min-width="80" align="center" />
        <el-table-column label="状态" min-width="90" align="center">
          <template #default="{ row }">{{ row.skuStatus === 'enabled' ? '启用' : '停用' }}</template>
        </el-table-column>
      </el-table>
    </template>

    <template #footer>
      <el-button type="primary" @click="dialogVisible = false">知道了</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  product: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible'])

// 弹窗显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

// 格式化金额
function formatMoney(value) {
  return Number(value || 0).toFixed(2)
}

// 获取商品状态文案
function getProductStatusLabel(status) {
  return status === 'onSale' ? '上架' : '下架'
}

// 拼接上传资源访问地址
function resolveAssetUrl(url) {
  if (!url || /^https?:\/\//.test(url)) {
    return url
  }

  return `${API_BASE_URL}${url}`
}
</script>

<style scoped>
.detail-cover {
  width: 120px;
  height: 90px;
  border-radius: 6px;
}

.detail-skus-title {
  margin: 18px 0 10px;
  color: var(--oc-text);
  font-size: 15px;
  font-weight: 800;
}
</style>
