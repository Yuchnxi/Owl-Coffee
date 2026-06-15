<template>
  <el-dialog v-model="dialogVisible" title="新增订单" width="1080px" destroy-on-close @open="handleOpen">
    <el-form ref="formRef" class="order-form" :model="form" :rules="rules" label-width="92px">
      <div class="order-form__layout">
        <section class="order-form__left">
          <div class="order-picker">
            <div class="order-picker__header">
              <span>商品选择</span>
              <el-button :icon="Refresh" :loading="productLoading" @click="loadProducts">刷新商品</el-button>
            </div>
            <div class="order-picker__body">
              <el-select
                v-model="selectedProductId"
                class="order-picker__product"
                placeholder="请选择上架商品"
                filterable
                clearable
                :loading="productLoading"
                popper-class="order-form-select-popper"
                @change="handleProductChange"
              >
                <el-option v-for="product in products" :key="product.id" :label="product.name" :value="product.id" />
              </el-select>
              <el-select
                v-model="selectedSkuId"
                class="order-picker__sku"
                placeholder="请选择可用 SKU"
                filterable
                popper-class="order-form-select-popper"
              >
                <el-option
                  v-for="sku in availableSkus"
                  :key="sku.id"
                  :label="formatSkuOption(sku)"
                  :value="sku.id"
                />
              </el-select>
              <el-input-number
                v-model="selectedQuantity"
                class="order-picker__quantity"
                :min="1"
                :step="1"
                controls-position="right"
              />
              <el-button
                class="order-picker__add"
                type="primary"
                :icon="Plus"
                :disabled="!selectedSkuId"
                @click="addOrderItem"
              >
                加入订单
              </el-button>
            </div>
          </div>

          <div class="order-list">
            <div class="order-list__header">商品列表</div>
            <el-table class="order-form__table" :data="form.items" border max-height="340" empty-text="请加入订单商品">
              <el-table-column label="商品" min-width="140" align="center">
                <template #default="{ row }">{{ row.productName || '待补充' }}</template>
              </el-table-column>
              <el-table-column label="规格" min-width="170" align="center">
                <template #default="{ row }">{{ formatSkuText(row) }}</template>
              </el-table-column>
              <el-table-column label="单价" min-width="90" align="center">
                <template #default="{ row }">￥{{ formatMoney(row.price) }}</template>
              </el-table-column>
              <el-table-column label="数量" width="96" align="center" class-name="order-quantity-cell">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.quantity"
                    class="order-form__quantity-input"
                    :min="1"
                    :max="row.stock"
                    :step="1"
                    :controls="false"
                  />
                </template>
              </el-table-column>
              <el-table-column label="库存" min-width="70" align="center">
                <template #default="{ row }">{{ row.stock }}</template>
              </el-table-column>
              <el-table-column label="小计" min-width="100" align="center">
                <template #default="{ row }">
                  <span class="order-form__money">￥{{ formatMoney(row.price * row.quantity) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="80" align="center">
                <template #default="{ $index }">
                  <el-button link type="danger" :icon="Delete" @click="removeOrderItem($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </section>

        <section class="order-form__right">
          <div class="order-side-form">
            <div class="order-side-form__header">订单信息</div>
            <el-form-item label="联系人">
              <el-input v-model.trim="form.userName" maxlength="64" placeholder="待补充" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model.trim="form.phone" maxlength="32" placeholder="待补充" />
            </el-form-item>
            <el-form-item label="优惠金额" prop="discountAmount">
              <el-input-number
                v-model="form.discountAmount"
                :min="0"
                :precision="2"
                :step="1"
                controls-position="right"
              />
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model.trim="form.remark"
                type="textarea"
                :rows="8"
                maxlength="500"
                show-word-limit
                placeholder="待补充"
              />
            </el-form-item>
          </div>
        </section>
      </div>
    </el-form>

    <template #footer>
      <div class="order-form__footer">
        <div class="order-form__pay">
          <span>实付金额</span>
          <strong>￥{{ formatMoney(payAmount) }}</strong>
        </div>
        <div class="order-form__footer-actions">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus, Refresh } from '@element-plus/icons-vue'
import { fetchProductDetail, fetchProducts } from '../../../api/product'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'submit'])

// 表单引用
const formRef = ref(null)
// 商品加载状态
const productLoading = ref(false)
// 上架商品列表
const products = ref([])
// 当前商品可用 SKU
const availableSkus = ref([])
// 已选商品 ID
const selectedProductId = ref('')
// 已选 SKU ID
const selectedSkuId = ref('')
// 已选数量
const selectedQuantity = ref(1)

// 补单表单
const form = reactive({
  userName: '',
  phone: '',
  items: [],
  discountAmount: 0,
  remark: ''
})

// 弹窗显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

// 商品金额合计
const totalAmount = computed(() => form.items.reduce((sum, item) => {
  return sum + Number(item.price || 0) * Number(item.quantity || 0)
}, 0))

// 实付金额
const payAmount = computed(() => Math.max(totalAmount.value - Number(form.discountAmount || 0), 0))

// 表单校验规则
const rules = {
  discountAmount: [
    {
      validator: (_, value, callback) => {
        if (Number(value) < 0) {
          callback(new Error('优惠金额不能小于 0'))
          return
        }

        if (Number(value) > totalAmount.value) {
          callback(new Error('优惠金额不能超过商品金额'))
          return
        }

        callback()
      },
      trigger: 'change'
    }
  ]
}

// 打开弹窗时初始化数据
async function handleOpen() {
  resetForm()
  await loadProducts()
}

// 重置表单
function resetForm() {
  form.userName = ''
  form.phone = ''
  form.items = []
  form.discountAmount = 0
  form.remark = ''
  selectedProductId.value = ''
  selectedSkuId.value = ''
  selectedQuantity.value = 1
  availableSkus.value = []

  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 加载上架商品
async function loadProducts() {
  productLoading.value = true

  try {
    const result = await fetchProducts({
      page: 1,
      pageSize: 100,
      productStatus: 'onSale'
    })

    products.value = Array.isArray(result?.list) ? result.list : []
  } finally {
    productLoading.value = false
  }
}

// 选择商品后加载可用 SKU
async function handleProductChange(productId) {
  selectedSkuId.value = ''
  availableSkus.value = []

  if (!productId) {
    return
  }

  const product = await fetchProductDetail(productId)
  availableSkus.value = Array.isArray(product?.skus)
    ? product.skus
        .filter(sku => sku.skuStatus === 'enabled' && Number(sku.stock) > 0)
        .map(sku => ({
          ...sku,
          productId: product.id,
          productName: product.name
        }))
    : []
}

// 加入订单商品
function addOrderItem() {
  const sku = availableSkus.value.find(item => item.id === selectedSkuId.value)

  if (!sku) {
    ElMessage.warning('请选择可用 SKU')
    return
  }

  const existedItem = form.items.find(item => item.skuId === sku.id)

  if (existedItem) {
    existedItem.quantity = Math.min(existedItem.quantity + selectedQuantity.value, existedItem.stock)
  } else {
    form.items.push({
      skuId: sku.id,
      productId: sku.productId,
      productName: sku.productName,
      temperature: sku.temperature,
      cupSize: sku.cupSize,
      sugarLevel: sku.sugarLevel,
      price: Number(sku.price) || 0,
      stock: Number(sku.stock) || 0,
      quantity: Math.min(Number(selectedQuantity.value) || 1, Number(sku.stock) || 1)
    })
  }

  selectedSkuId.value = ''
  selectedQuantity.value = 1
}

// 删除订单商品
function removeOrderItem(index) {
  form.items.splice(index, 1)
}

// 提交补单表单
async function handleSubmit() {
  if (form.items.length === 0) {
    ElMessage.warning('订单商品不能为空')
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)

  if (!valid) {
    return
  }

  emit('submit', {
    userName: form.userName,
    phone: form.phone,
    items: form.items,
    discountAmount: form.discountAmount,
    remark: form.remark
  })
}

// 格式化 SKU 选项
function formatSkuOption(sku) {
  return `${formatSkuText(sku)} / ￥${formatMoney(sku.price)} / 库存 ${sku.stock}`
}

// 格式化 SKU 规格
function formatSkuText(item) {
  return [item.temperature, item.cupSize, item.sugarLevel].filter(Boolean).join(' / ') || '待补充'
}

// 格式化金额
function formatMoney(value) {
  return Number(value || 0).toFixed(2)
}
</script>

<style scoped>
.order-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.order-form__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 16px;
  min-height: 520px;
}

.order-form__left,
.order-form__right,
.order-side-form,
.order-list,
.order-picker {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.order-form__left,
.order-form__right {
  gap: 12px;
}

.order-picker,
.order-list,
.order-side-form {
  padding: 12px;
  border: 1px solid var(--oc-border);
  border-radius: 6px;
  background: rgba(4, 8, 13, 0.22);
}

.order-picker__header,
.order-list__header,
.order-side-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--oc-text);
  font-weight: 700;
}

.order-picker__body {
  display: grid;
  grid-template-columns: 180px 260px 120px 110px;
  gap: 12px;
  align-items: center;
  margin-top: 12px;
}

.order-list {
  flex: 1 1 auto;
  gap: 12px;
}

.order-side-form {
  gap: 16px;
  height: 100%;
}

.order-side-form :deep(.el-form-item) {
  margin: 0;
}

.order-side-form :deep(.el-input-number) {
  width: 100%;
}

.order-form__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.order-form__footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-form__pay {
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
  color: var(--oc-text);
}

.order-picker__product {
  width: 100%;
}

.order-picker__sku {
  width: 100%;
}

.order-picker__quantity {
  width: 120px;
}

.order-picker__add {
  width: 110px;
}

.order-form__table {
  width: 100%;
}

.order-form__quantity-input {
  width: 72px;
}

.order-form__table :deep(.order-quantity-cell .cell) {
  padding: 0 6px;
  overflow: visible;
  text-overflow: clip;
}

.order-form__quantity-input :deep(.el-input__wrapper) {
  padding: 0 8px;
}

.order-form__quantity-input :deep(.el-input__inner) {
  text-align: center;
}

.order-form__money,
.order-form__pay {
  color: var(--oc-primary);
  font-weight: 700;
}

.order-form__pay span {
  color: var(--oc-text-muted);
  font-weight: 500;
}

.order-form__pay strong {
  color: var(--oc-primary);
  font-size: 18px;
}

:global(.order-form-select-popper.el-popper) {
  border-color: var(--oc-border) !important;
  background: #0d151c !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.38) !important;
}

:global(.order-form-select-popper .el-popper__arrow::before) {
  border-color: var(--oc-border) !important;
  background: #0d151c !important;
}

:global(.order-form-select-popper .el-select-dropdown) {
  background: #0d151c !important;
}

:global(.order-form-select-popper .el-select-dropdown__item) {
  color: var(--oc-text-muted);
}

:global(.order-form-select-popper .el-select-dropdown__item.is-hovering),
:global(.order-form-select-popper .el-select-dropdown__item:hover) {
  background: rgba(238, 146, 38, 0.14) !important;
  color: var(--oc-text) !important;
}

:global(.order-form-select-popper .el-select-dropdown__item.is-selected) {
  background: rgba(238, 146, 38, 0.2) !important;
  color: var(--oc-primary) !important;
  font-weight: 700;
}

:global(.order-form-select-popper .el-select-dropdown__empty) {
  color: var(--oc-text-muted);
}
</style>
