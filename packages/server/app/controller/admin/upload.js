'use strict'

const path = require('path')
const COS = require('cos-nodejs-sdk-v5')
const Controller = require('egg').Controller

const BIZ_TYPE_LIST = ['product', 'logo', 'store', 'website', 'avatar', 'banner']
const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

class AdminUploadController extends Controller {
  // 上传后台文件到腾讯云 COS
  async create() {
    const { ctx } = this
    const stream = await ctx.getFileStream()
    const bizType = (stream.fields || {}).bizType
    const uploadError = this.validateUpload(stream, bizType)
    const cosError = this.validateCosConfig()

    if (uploadError || cosError) {
      await this.drainStream(stream)
      ctx.status = uploadError ? 400 : 500
      ctx.fail(uploadError ? 10001 : 10002, uploadError || cosError)
      return
    }

    const fileInfo = await this.saveCosFile(stream, bizType)
    const result = await ctx.service.file.createFileRecord(fileInfo, ctx.state.admin.id)

    ctx.success(result)
  }

  // 校验上传文件
  validateUpload(stream, bizType) {
    if (!stream || !stream.filename) {
      return '上传文件不能为空'
    }

    if (!BIZ_TYPE_LIST.includes(bizType)) {
      return '业务类型不正确'
    }

    if (!MIME_EXTENSION_MAP[stream.mime]) {
      return '仅支持 jpg、png、webp、gif 图片'
    }

    return ''
  }

  // 校验腾讯云 COS 配置
  validateCosConfig() {
    const { secretId, secretKey, bucket, region } = this.config.cos

    if (!secretId || !secretKey || !bucket || !region) {
      return '腾讯云 COS 配置不完整'
    }

    return ''
  }

  // 保存文件到腾讯云 COS
  async saveCosFile(stream, bizType) {
    const fileId = this.ctx.service.authToken.createId('file')
    const extension = this.getExtension(stream.filename, stream.mime)
    const objectKey = this.createObjectKey(bizType, fileId, extension)
    const fileBuffer = await this.streamToBuffer(stream)
    const cos = this.createCosClient()

    await cos.putObject({
      Bucket: this.config.cos.bucket,
      Region: this.config.cos.region,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: stream.mime,
    })

    return {
      fileId,
      bizType,
      name: path.basename(stream.filename),
      url: this.createFileUrl(objectKey),
      size: fileBuffer.length,
      mimeType: stream.mime,
      objectKey,
      storageProvider: 'tencent-cos',
    }
  }

  // 创建腾讯云 COS 客户端
  createCosClient() {
    return new COS({
      SecretId: this.config.cos.secretId,
      SecretKey: this.config.cos.secretKey,
    })
  }

  // 生成文件访问地址
  createFileUrl(objectKey) {
    const { bucket, region, publicBaseUrl } = this.config.cos
    const baseUrl = publicBaseUrl || `https://${bucket}.cos.${region}.myqcloud.com`

    return `${baseUrl.replace(/\/$/, '')}/${objectKey}`
  }

  // 获取安全文件扩展名
  getExtension(filename, mimeType) {
    const extension = path.extname(filename).toLowerCase()

    return Object.values(MIME_EXTENSION_MAP).includes(extension)
      ? extension
      : MIME_EXTENSION_MAP[mimeType]
  }

  // 生成 COS 对象 Key
  createObjectKey(bizType, fileId, extension) {
    const now = new Date()
    const year = String(now.getFullYear())
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return ['uploads', bizType, year, month, day, `${fileId}${extension}`].join('/')
  }

  // 读取上传流
  async streamToBuffer(stream) {
    const chunks = []

    for await (const chunk of stream) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  }

  // 消费无效上传流
  async drainStream(stream) {
    for await (const chunk of stream) {
      void chunk
    }
  }
}

module.exports = AdminUploadController
