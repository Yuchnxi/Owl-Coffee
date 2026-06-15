<template>
  <el-dialog
    :model-value="visible"
    title="调整库存"
    width="560px"
    destroy-on-close
    @close="handleClose"
  >
    <div v-if="sku" class="inventory-adjust-summary">
      <div>
        <span>商品</span>
        <strong>{{ sku.productName || '待补充' }}</strong>
      </div>
      <div>
        <span>SKU</span>
        <strong>{{ sku.skuCode || '待补充' }}</strong>
      </div>
      <div>
        <span>规格</span>
        <strong>{{ sku.specText || '待补充' }}</strong>
      </div>
      <div>
        <span>当前库存</span>
        <strong class="inventory-adjust-summary__stock">{{ sku.stock }}</strong>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
      <el-form-item label="调整类型" prop="adjustType">
        <el-radio-group v-model="form.adjustType">
          <el-radio-button label="in">入库</el-radio-button>
          <el-radio-button label="out">出库</el-radio-button>
          <el-radio-button label="check">盘点</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="quantityLabel" prop="quantity">
        <el-input-number v-model="form.quantity" :min="0" :step="1" controls-position="right" />
      </el-form-item>
      <el-form-item label="调整原因" prop="reason">
        <el-input
          v-model.trim="form.reason"
          type="textarea"
          :rows="3"
          maxlength="255"
          show-word-limit
          placeholder="请输入库存调整原因"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确认调整</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  sku: {
    type: Object,
    default: null
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'submit'])

// 表单组件引用
const formRef = ref(null)

// 库存调整表单
const form = reactive({
  adjustType: 'in',
  quantity: 1,
  reason: ''
})

// 数量字段标签
const quantityLabel = computed(() => (form.adjustType === 'check' ? '盘点库存' : '调整数量'))

// 校验调整数量
function validateQuantity(rule, value, callback) {
  const quantity = Number(value)

  if (!Number.isInteger(quantity) || quantity < 0) {
    callback(new Error('库存数量不能小于 0'))
    return
  }

  if (form.adjustType !== 'check' && quantity === 0) {
    callback(new Error('入库或出库数量必须大于 0'))
    return
  }

  callback()
}

// 库存调整表单校验规则
const rules = {
  adjustType: [
    { required: true, message: '请选择调整类型', trigger: 'change' }
  ],
  quantity: [
    { validator: validateQuantity, trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请输入调整原因', trigger: 'blur' },
    { max: 255, message: '调整原因不能超过 255 个字符', trigger: 'blur' }
  ]
}

// 重置调整表单
function resetForm() {
  form.adjustType = 'in'
  form.quantity = 1
  form.reason = ''
}

// 关闭调整弹窗
function handleClose() {
  emit('update:visible', false)
}

// 提交库存调整
async function handleSubmit() {
  await formRef.value?.validate()

  emit('submit', {
    skuId: props.sku?.skuId || '',
    adjustType: form.adjustType,
    quantity: Number(form.quantity),
    reason: form.reason
  })
}

watch(() => props.visible, visible => {
  if (visible) {
    resetForm()
  }
})
</script>

<style scoped>
.inventory-adjust-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  padding: 14px;
  border: 1px solid var(--oc-border);
  border-radius: 6px;
  background: rgba(4, 8, 13, 0.28);
}

.inventory-adjust-summary div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.inventory-adjust-summary span {
  color: var(--oc-text-muted);
  font-size: 12px;
}

.inventory-adjust-summary strong {
  overflow: hidden;
  color: var(--oc-text);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inventory-adjust-summary__stock {
  color: var(--oc-primary) !important;
}

:deep(.el-input-number) {
  width: 180px;
}

:deep(.el-textarea__inner) {
  resize: none;
}
</style>
