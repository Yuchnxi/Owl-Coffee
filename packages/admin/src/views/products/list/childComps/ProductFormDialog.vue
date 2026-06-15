<template>
  <el-dialog
    v-model="dialogVisible"
    :title="mode === 'create' ? '新增商品' : '编辑商品'"
    width="820px"
    destroy-on-close
  >
    <el-form ref="formRef" class="product-form" :model="form" :rules="rules" label-width="92px">
      <div class="product-form__row product-form__row--two">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model.trim="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类">
            <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
          </el-select>
        </el-form-item>
      </div>

      <div class="product-form__row product-form__row--three">
        <el-form-item label="商品状态" prop="productStatus">
          <el-radio-group v-model="form.productStatus">
            <el-radio-button label="onSale">上架</el-radio-button>
            <el-radio-button label="offSale">下架</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="推荐">
          <el-switch v-model="form.isRecommended" active-text="推荐" inactive-text="普通" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :step="1" controls-position="right" />
        </el-form-item>
      </div>

      <div class="product-form__row">
        <el-form-item label="商品图片">
          <div class="product-image-field">
            <el-image
              v-if="form.imageUrl"
              class="product-image-preview"
              :src="resolveAssetUrl(form.imageUrl)"
              fit="cover"
              :preview-src-list="[resolveAssetUrl(form.imageUrl)]"
              preview-teleported
            />
            <div v-else class="product-image-empty">待补充</div>
            <el-upload :show-file-list="false" :http-request="handleUploadImage" accept="image/*">
              <el-button :loading="uploading" :icon="Upload">上传图片</el-button>
            </el-upload>
            <el-button v-if="form.imageUrl" :icon="Delete" @click="form.imageUrl = ''">移除</el-button>
          </div>
        </el-form-item>
      </div>

      <div class="product-form__row">
        <el-form-item label="商品描述">
          <el-input
            v-model.trim="form.description"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="待补充"
          />
        </el-form-item>
      </div>

      <div class="sku-section">
        <div class="sku-section__header">
          <span>SKU 明细</span>
          <div class="sku-section__actions">
            <el-button :icon="Delete" :disabled="selectedSkuRows.length === 0" @click="removeSelectedSkuRows">
              删除
            </el-button>
            <el-button type="primary" :icon="Plus" @click="addSkuRow">新增 SKU</el-button>
          </div>
        </div>
        <el-table
          ref="skuTableRef"
          :data="form.skus"
          border
          max-height="320"
          empty-text="请新增 SKU"
          @selection-change="handleSkuSelectionChange"
        >
          <el-table-column type="selection" width="48" align="center" />
          <el-table-column label="温度" min-width="120" align="center">
            <template #default="{ row }">
              <el-input v-model.trim="row.temperature" placeholder="待补充" />
            </template>
          </el-table-column>
          <el-table-column label="杯型" min-width="120" align="center">
            <template #default="{ row }">
              <el-input v-model.trim="row.cupSize" placeholder="待补充" />
            </template>
          </el-table-column>
          <el-table-column label="糖度" min-width="120" align="center">
            <template #default="{ row }">
              <el-input v-model.trim="row.sugarLevel" placeholder="待补充" />
            </template>
          </el-table-column>
          <el-table-column label="售价" min-width="130" align="center">
            <template #default="{ row }">
              <el-input-number v-model="row.price" :min="0" :precision="2" :step="1" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="库存" min-width="120" align="center">
            <template #default="{ row }">
              <el-input-number v-model="row.stock" :min="0" :step="1" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="预警" min-width="120" align="center">
            <template #default="{ row }">
              <el-input-number v-model="row.warningStock" :min="0" :step="1" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="状态" min-width="110" align="center">
            <template #default="{ row }">
              <el-select v-model="row.skuStatus">
                <el-option label="启用" value="enabled" />
                <el-option label="停用" value="disabled" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus, Upload } from '@element-plus/icons-vue'
import { uploadProductImage } from '../../../../api/product'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'create'
  },
  product: {
    type: Object,
    default: null
  },
  categories: {
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
// SKU 表格引用
const skuTableRef = ref(null)
// 图片上传状态
const uploading = ref(false)
// 已勾选 SKU 行
const selectedSkuRows = ref([])

// 商品表单数据
const form = reactive({
  id: '',
  name: '',
  categoryId: '',
  imageUrl: '',
  description: '',
  productStatus: 'offSale',
  sort: 0,
  isRecommended: false,
  skus: []
})

// 弹窗显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { max: 128, message: '商品名称不能超过 128 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  productStatus: [
    { required: true, message: '请选择商品状态', trigger: 'change' }
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
  ]
}

// 同步传入商品到表单
function syncForm() {
  const product = props.product || {}

  form.id = product.id || ''
  form.name = product.name || ''
  form.categoryId = product.categoryId || props.categories[0]?.id || ''
  form.imageUrl = product.imageUrl || ''
  form.description = product.description || ''
  form.productStatus = product.productStatus || 'offSale'
  form.sort = Number(product.sort) || 0
  form.isRecommended = Boolean(product.isRecommended)
  form.skus = Array.isArray(product.skus) && product.skus.length > 0
    ? product.skus.map(sku => ({
        temperature: sku.temperature || '',
        cupSize: sku.cupSize || '',
        sugarLevel: sku.sugarLevel || '',
        price: Number(sku.price) || 0,
        stock: Number(sku.stock) || 0,
        warningStock: Number(sku.warningStock) || 0,
        skuStatus: sku.skuStatus || 'enabled'
      }))
    : [createEmptySku()]

  nextTick(() => {
    formRef.value?.clearValidate()
    skuTableRef.value?.clearSelection()
    selectedSkuRows.value = []
  })
}

// 创建空 SKU 行
function createEmptySku() {
  return {
    temperature: '',
    cupSize: '',
    sugarLevel: '',
    price: 0,
    stock: 0,
    warningStock: 0,
    skuStatus: 'enabled'
  }
}

// 新增 SKU 行
function addSkuRow() {
  form.skus.push(createEmptySku())
}

// 记录已勾选 SKU 行
function handleSkuSelectionChange(rows) {
  selectedSkuRows.value = rows
}

// 删除已勾选 SKU 行
function removeSelectedSkuRows() {
  if (selectedSkuRows.value.length === 0) {
    return
  }

  if (selectedSkuRows.value.length >= form.skus.length) {
    ElMessage.warning('至少需要保留一个 SKU')
    return
  }

  form.skus = form.skus.filter(sku => !selectedSkuRows.value.includes(sku))
  selectedSkuRows.value = []
  nextTick(() => {
    skuTableRef.value?.clearSelection()
  })
}

// 上传商品图片
async function handleUploadImage(options) {
  uploading.value = true

  try {
    const result = await uploadProductImage(options.file)

    form.imageUrl = result.url
    ElMessage.success('图片已上传')
    options.onSuccess?.(result)
  } catch (err) {
    options.onError?.(err)
  } finally {
    uploading.value = false
  }
}

// 校验 SKU 明细
function validateSkus() {
  if (form.skus.length === 0) {
    ElMessage.warning('至少需要一个 SKU')
    return false
  }

  for (let index = 0; index < form.skus.length; index += 1) {
    const sku = form.skus[index]
    const rowText = `第 ${index + 1} 行 SKU`

    if (!sku.temperature || !sku.cupSize || !sku.sugarLevel) {
      ElMessage.warning(`${rowText} 的温度、杯型和糖度不能为空`)
      return false
    }

    if (!Number.isFinite(Number(sku.price)) || Number(sku.price) < 0) {
      ElMessage.warning(`${rowText} 的售价不能小于 0`)
      return false
    }

    if (!Number.isInteger(Number(sku.stock)) || Number(sku.stock) < 0) {
      ElMessage.warning(`${rowText} 的库存不能小于 0`)
      return false
    }

    if (!Number.isInteger(Number(sku.warningStock)) || Number(sku.warningStock) < 0) {
      ElMessage.warning(`${rowText} 的预警库存不能小于 0`)
      return false
    }
  }

  return true
}

// 提交商品表单
async function handleSubmit() {
  await formRef.value?.validate()

  if (!validateSkus()) {
    return
  }

  emit('submit', {
    id: form.id,
    name: form.name,
    categoryId: form.categoryId,
    imageUrl: form.imageUrl,
    description: form.description,
    productStatus: form.productStatus,
    sort: form.sort,
    isRecommended: form.isRecommended,
    skus: form.skus
  })
}

// 拼接上传资源访问地址
function resolveAssetUrl(url) {
  if (!url || /^https?:\/\//.test(url)) {
    return url
  }

  return `${API_BASE_URL}${url}`
}

watch(() => props.visible, value => {
  if (value) {
    syncForm()
  }
})

watch(() => props.categories, () => {
  if (props.visible && !form.categoryId) {
    form.categoryId = props.categories[0]?.id || ''
  }
})
</script>

<style scoped>
.product-form__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.product-form__row--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.product-form__row--three {
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 0.8fr);
}

.product-form__row :deep(.el-form-item) {
  margin-bottom: 18px;
}

.product-form :deep(.el-select),
.product-form :deep(.el-input),
.product-form :deep(.el-input-number),
.product-form :deep(.el-textarea) {
  width: 100%;
}

.product-image-field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.product-image-preview,
.product-image-empty {
  display: inline-flex;
  width: 88px;
  height: 66px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--oc-border);
  border-radius: 6px;
  background: rgba(4, 8, 13, 0.34);
  color: var(--oc-text-muted);
  font-size: 12px;
}

.sku-section {
  margin-top: 18px;
}

.sku-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: var(--oc-text);
  font-weight: 800;
}

.sku-section__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sku-section :deep(.el-input-number) {
  width: 100%;
}

.sku-section :deep(.el-input),
.sku-section :deep(.el-select) {
  width: 100%;
}

.sku-section :deep(.el-table__cell) {
  background: var(--oc-panel-solid);
}

@media (max-width: 760px) {
  .product-form__row--two,
  .product-form__row--three {
    grid-template-columns: 1fr;
  }
}
</style>
