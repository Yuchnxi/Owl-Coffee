'use strict'

const Service = require('egg').Service

class FileService extends Service {
  // 保存上传文件记录
  async createFileRecord(data, adminUserId) {
    const fileId = data.fileId || this.service.authToken.createId('file')

    await this.app.mysql.execute(
      `
        INSERT INTO files (
          id,
          biz_type,
          name,
          url,
          size,
          mime_type,
          storage_provider,
          object_key,
          created_at,
          created_by
        )
        VALUES (
          :fileId,
          :bizType,
          :name,
          :url,
          :size,
          :mimeType,
          'local',
          :objectKey,
          NOW(3),
          :adminUserId
        )
      `,
      {
        fileId,
        bizType: data.bizType,
        name: data.name,
        url: data.url,
        size: data.size,
        mimeType: data.mimeType,
        objectKey: data.objectKey,
        adminUserId,
      }
    )

    return {
      fileId,
      url: data.url,
      name: data.name,
      size: data.size,
      mimeType: data.mimeType,
    }
  }
}

module.exports = FileService
