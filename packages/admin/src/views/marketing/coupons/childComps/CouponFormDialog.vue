<template>
  <el-dialog
    v-model="dialogVisible"
    :title="mode === 'create' ? '新增优惠券' : '编辑优惠券'"
    width="680px"
    destroy-on-close
    @closed="resetForm"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="优惠券名称" prop="name">
        <el-input v-model.trim="form.name" placeholder="请输入优惠券名称" maxlength="128" show-word-limit />
      </el-form-item>

      <el-form-item label="优惠券类型" prop="couponType">
        <el-radio-group v-model="form.couponType" @change="handleTypeChange">
          <el-radio-button label="discountAmount">满减券</el-radio-button>
          <el-radio-button label="discountRate">折扣券</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="使用门槛" prop="thresholdAmount">
        <el-input-number v-model="form.thresholdAmount" :min="0" :precision="2" :step="1" controls-position="right" />
      </el-form-item>

      <el-form-item v-if="form.couponType === 'discountAmount'" label="满减金额" prop="discountAmount">
        <el-input-number v-model="form.discountAmount" :min="0.01" :precision="2" :step="1" controls-position="right" />
      </el-form-item>

      <el-form-item v-else label="折扣比例" prop="discountRate">
        <el-input-number v-model="form.discountRate" :min="0.1" :max="9.9" :precision="1" :step="0.1" controls-position="right" />
      </el-form-item>

      <el-form-item label="发放数量" prop="totalQuantity">
        <el-input-number v-model="form.totalQuantity" :min="1" :precision="0" :step="10" controls-position="right" />
      </el-form-item>

      <el-form-item label="每人限领" prop="limitPerUser">
        <el-input-number v-model="form.limitPerUser" :min="1" :precision="0" :step="1" controls-position="right" />
      </el-form-item>

      <el-form-item label="有效期" required>
        <div class="coupon-valid-range">
          <el-form-item prop="validStartAt">
            <el-date-picker
              v-model="form.validStartAt"
              type="datetime"
              placeholder="开始时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              format="YYYY-MM-DD HH:mm"
              @change="handleStartTimeChange"
            />
          </el-form-item>
          <span class="coupon-valid-range__separator">至</span>
          <el-form-item prop="validEndAt">
            <el-date-picker
              v-model="form.validEndAt"
              type="datetime"
              placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              format="YYYY-MM-DD HH:mm"
            />
          </el-form-item>
        </div>
      </el-form-item>

      <el-form-item label="状态" prop="couponStatus">
        <el-select v-model="form.couponStatus" placeholder="请选择状态">
          <el-option label="未开始" value="notStarted" />
          <el-option label="生效中" value="active" />
          <el-option label="已结束" value="ended" />
          <el-option label="已停用" value="disabled" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
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
  mode: {
    type: String,
    default: 'create'
  },
  coupon: {
    type: Object,
    default: null
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'submit'])

// 表单实例
const formRef = ref(null)

// 优惠券表单
const form = reactive(createDefaultForm())

// 弹窗显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

// 表单校验规则
const rules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  couponType: [{ required: true, message: '请选择优惠券类型', trigger: 'change' }],
  thresholdAmount: [{ required: true, validator: validateNonNegativeNumber, trigger: 'change' }],
  discountAmount: [{ required: true, validator: validateDiscountAmount, trigger: 'change' }],
  discountRate: [{ required: true, validator: validateDiscountRate, trigger: 'change' }],
  totalQuantity: [{ required: true, validator: validatePositiveInteger, trigger: 'change' }],
  limitPerUser: [{ required: true, validator: validatePositiveInteger, trigger: 'change' }],
  validStartAt: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  validEndAt: [{ required: true, validator: validateValidEndAt, trigger: 'change' }],
  couponStatus: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      fillForm(props.coupon)
    }
  }
)

// 创建默认表单
function createDefaultForm() {
  return {
    name: '',
    couponType: 'discountAmount',
    thresholdAmount: 0,
    discountAmount: 1,
    discountRate: 9,
    totalQuantity: 100,
    limitPerUser: 1,
    validStartAt: '',
    validEndAt: '',
    couponStatus: 'notStarted'
  }
}

// 回填表单
function fillForm(coupon) {
  const nextForm = createDefaultForm()

  if (coupon) {
    nextForm.name = coupon.name || ''
    nextForm.couponType = coupon.couponType || 'discountAmount'
    nextForm.thresholdAmount = Number(coupon.thresholdAmount) || 0
    nextForm.discountAmount = coupon.discountAmount === null ? 1 : Number(coupon.discountAmount)
    nextForm.discountRate = coupon.discountRate === null ? 9 : Number(coupon.discountRate)
    nextForm.totalQuantity = Number(coupon.totalQuantity) || 1
    nextForm.limitPerUser = Number(coupon.limitPerUser) || 1
    nextForm.validStartAt = coupon.validStartAt || ''
    nextForm.validEndAt = coupon.validEndAt || ''
    nextForm.couponStatus = coupon.couponStatus || 'notStarted'
  }

  Object.assign(form, nextForm)
}

// 重置表单
function resetForm() {
  formRef.value?.clearValidate()
  Object.assign(form, createDefaultForm())
}

// 切换优惠券类型
function handleTypeChange() {
  formRef.value?.clearValidate(['discountAmount', 'discountRate'])
}

// 开始时间变化后复核结束时间
function handleStartTimeChange() {
  if (form.validEndAt) {
    formRef.value?.validateField('validEndAt')
  }
}

// 提交优惠券表单
async function submitForm() {
  await formRef.value?.validate()

  emit('submit', {
    name: form.name,
    couponType: form.couponType,
    thresholdAmount: Number(form.thresholdAmount),
    discountAmount: form.couponType === 'discountAmount' ? Number(form.discountAmount) : null,
    discountRate: form.couponType === 'discountRate' ? Number(form.discountRate) : null,
    totalQuantity: Number(form.totalQuantity),
    limitPerUser: Number(form.limitPerUser),
    validStartAt: form.validStartAt,
    validEndAt: form.validEndAt,
    couponStatus: form.couponStatus
  })
}

// 校验非负数
function validateNonNegativeNumber(rule, value, callback) {
  if (!Number.isFinite(Number(value)) || Number(value) < 0) {
    callback(new Error('数值不能小于 0'))
    return
  }

  callback()
}

// 校验满减金额
function validateDiscountAmount(rule, value, callback) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
    callback(new Error('满减金额必须大于 0'))
    return
  }

  callback()
}

// 校验折扣比例
function validateDiscountRate(rule, value, callback) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0 || Number(value) >= 10) {
    callback(new Error('折扣比例必须大于 0 且小于 10'))
    return
  }

  callback()
}

// 校验正整数
function validatePositiveInteger(rule, value, callback) {
  if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
    callback(new Error('请输入大于 0 的整数'))
    return
  }

  callback()
}

// 校验有效期结束时间
function validateValidEndAt(rule, value, callback) {
  if (!value) {
    callback(new Error('请选择结束时间'))
    return
  }

  if (form.validStartAt && new Date(form.validStartAt).getTime() >= new Date(value).getTime()) {
    callback(new Error('结束时间必须晚于开始时间'))
    return
  }

  callback()
}
</script>

<style scoped>
.coupon-valid-range {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr);
  width: 100%;
  align-items: flex-start;
  gap: 12px;
}

.coupon-valid-range :deep(.el-form-item) {
  margin-bottom: 0;
}

.coupon-valid-range :deep(.el-date-editor) {
  width: 100%;
}

.coupon-valid-range__separator {
  color: var(--oc-text);
  font-weight: 700;
  line-height: 42px;
  text-align: center;
}

@media (max-width: 720px) {
  .coupon-valid-range {
    grid-template-columns: 1fr;
  }

  .coupon-valid-range__separator {
    line-height: 20px;
  }
}
</style>
