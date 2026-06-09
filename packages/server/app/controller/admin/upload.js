'use strict'

const fs = require('fs')
const path = require('path')
const { pipeline } = require('stream/promises')
const Controller = require('egg').Controller

const BIZ_TYPE_LIST = ['product', 'logo', 'store', 'website']
const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

class AdminUploadController extends Controller {
  // 上传后台文件
  async create() {
    const { ctx } = this
    const stream = await ctx.getFileStream()
    const bizType = (stream.fields || {}).bizType
    const errorMessage = this.validateUpload(stream, bizType)

    if (errorMessage) {
      await this.drainStream(stream)
      ctx.status = 400
      ctx.fail(10001, errorMessage)
      return
    }

    const fileInfo = await this.saveLocalFile(stream, bizType)
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

  // 保存本地文件
  async saveLocalFile(stream, bizType) {
    const fileId = this.ctx.service.authToken.createId('file')
    const extension = this.getExtension(stream.filename, stream.mime)
    const objectKey = this.createObjectKey(bizType, fileId, extension)
    const targetPath = path.join(this.app.baseDir, 'app', 'public', objectKey)

    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true })
    await pipeline(stream, fs.createWriteStream(targetPath))

    const stat = await fs.promises.stat(targetPath)

    return {
      fileId,
      bizType,
      name: path.basename(stream.filename),
      url: `/public/${objectKey.replace(/\\/g, '/')}`,
      size: stat.size,
      mimeType: stream.mime,
      objectKey: objectKey.replace(/\\/g, '/'),
    }
  }

  // 获取安全文件扩展名
  getExtension(filename, mimeType) {
    const extension = path.extname(filename).toLowerCase()

    return Object.values(MIME_EXTENSION_MAP).includes(extension)
      ? extension
      : MIME_EXTENSION_MAP[mimeType]
  }

  // 生成本地文件路径
  createObjectKey(bizType, fileId, extension) {
    const now = new Date()
    const year = String(now.getFullYear())
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return path.join('uploads', bizType, year, month, day, `${fileId}${extension}`)
  }

  // 消费无效上传流
  async drainStream(stream) {
    for await (const chunk of stream) {
      void chunk
    }
  }
}

module.exports = AdminUploadController
