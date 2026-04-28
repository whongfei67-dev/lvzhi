/**
 * Supabase Storage → 阿里云 OSS 文件迁移脚本
 *
 * 用于将 Supabase Storage 中的文件迁移到 OSS
 *
 * 使用方法：
 *   # 导出文件列表
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=your_key \
 *   npx tsx scripts/migrate-storage.ts --mode=list
 *
 *   # 执行迁移
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=your_key \
 *   OSS_ENDPOINT=oss-cn-shanghai.aliyuncs.com \
 *   OSS_BUCKET=lvzhi-assets \
 *   OSS_ACCESS_KEY_ID=xxx \
 *   OSS_ACCESS_KEY_SECRET=xxx \
 *   npx tsx scripts/migrate-storage.ts --mode=migrate --batch=100
 */

import crypto from 'crypto'

// ============================================
// 配置
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

const OSS_ENDPOINT = process.env.OSS_ENDPOINT || ''
const OSS_BUCKET = process.env.OSS_BUCKET || ''
const OSS_ACCESS_KEY_ID = process.env.OSS_ACCESS_KEY_ID || ''
const OSS_ACCESS_KEY_SECRET = process.env.OSS_ACCESS_KEY_SECRET || ''

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function log(type: 'info' | 'success' | 'warn' | 'error', message: string) {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
  }[type]
  console.log(`${prefix} ${message}`)
}

// ============================================
// Supabase API
// ============================================

async function listSupabaseFiles(bucketName: string): Promise<Array<{ name: string; id: string }>> {
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/admin/object/list/${bucketName}`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.statusText}`)
  }

  return response.json()
}

async function downloadSupabaseFile(bucketName: string, fileName: string): Promise<ArrayBuffer> {
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${encodeURIComponent(fileName)}`
  )

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }

  return response.arrayBuffer()
}

async function getSupabasePublicUrl(bucketName: string, fileName: string): Promise<string> {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${encodeURIComponent(fileName)}`
}

// ============================================
// OSS API (使用签名 URL 上传)
// ============================================

function generateOSSSignature(fileName: string, contentType: string): {
  url: string
  headers: Record<string, string>
} {
  const date = new Date().toISOString().split('T')[0]
  const expireTime = Math.floor(Date.now() / 1000) + 3600
  const conditions: unknown[][] = [
    ['content-length-range', 0, 50 * 1024 * 1024], // 50MB
    { 'key': fileName },
    { 'x-oss-object-acl': 'private' },
    { 'success_action_status': '200' },
  ]

  const policy = Buffer.from(JSON.stringify({
    expiration: new Date(expireTime * 1000).toISOString(),
    conditions,
  })).toString('base64')

  const signature = crypto
    .createHmac('sha1', OSS_ACCESS_KEY_SECRET)
    .update(policy)
    .digest('base64')

  const uploadUrl = `https://${OSS_BUCKET}.${OSS_ENDPOINT}`

  const formData = new FormData()
  formData.append('key', fileName)
  formData.append('policy', policy)
  formData.append('OSSAccessKeyId', OSS_ACCESS_KEY_ID)
  formData.append('signature', signature)
  formData.append('x-oss-object-acl', 'private')
  formData.append('success_action_status', '200')

  return {
    url: uploadUrl,
    headers: {},
  }
}

async function uploadToOSS(fileName: string, data: ArrayBuffer, contentType: string): Promise<boolean> {
  const url = `https://${OSS_BUCKET}.${OSS_ENDPOINT}/${fileName}`

  const date = new Date().toUTCString()
  const contentLength = data.byteLength

  const signature = crypto
    .createHmac('sha1', OSS_ACCESS_KEY_SECRET)
    .update(`PUT\n\n${contentType}\n${date}\n/${OSS_BUCKET}/${fileName}`)
    .digest('base64')

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': contentLength.toString(),
      'Date': date,
      'Authorization': `OSS ${OSS_ACCESS_KEY_ID}:${signature}`,
    },
    body: data,
  })

  return response.ok
}

async function uploadToOSSForm(fileName: string, data: ArrayBuffer, contentType: string): Promise<boolean> {
  const { url } = generateOSSSignature(fileName, contentType)

  const formData = new FormData()
  formData.append('key', fileName)
  formData.append('file', new Blob([data], { type: contentType }))

  // 添加 OSS 签名
  const date = new Date().toISOString().split('T')[0]
  const expireTime = Math.floor(Date.now() / 1000) + 3600
  const policy = Buffer.from(JSON.stringify({
    expiration: new Date(expireTime * 1000).toISOString(),
    conditions: [
      ['content-length-range', 0, 50 * 1024 * 1024],
      { key: fileName },
    ],
  })).toString('base64')

  const signature = crypto
    .createHmac('sha1', OSS_ACCESS_KEY_SECRET)
    .update(policy)
    .digest('base64')

  formData.append('policy', policy)
  formData.append('OSSAccessKeyId', OSS_ACCESS_KEY_ID)
  formData.append('signature', signature)
  formData.append('x-oss-object-acl', 'private')
  formData.append('success_action_status', '200')

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  return response.ok || response.status === 200 || response.status === 204
}

// ============================================
// 文件迁移
// ============================================

async function listAllFiles(): Promise<void> {
  log('info', '获取 Supabase Storage 文件列表...')

  const buckets = ['avatars', 'agents', 'posts', 'resources', 'documents']

  const allFiles: Array<{
    bucket: string
    name: string
    oldUrl: string
    newPath: string
  }> = []

  for (const bucket of buckets) {
    try {
      const files = await listSupabaseFiles(bucket)
      log('success', `${bucket}: ${files.length} 个文件`)

      for (const file of files) {
        allFiles.push({
          bucket,
          name: file.name,
          oldUrl: await getSupabasePublicUrl(bucket, file.name),
          newPath: `${bucket}/${file.name}`,
        })
      }
    } catch (error) {
      log('warn', `获取 ${bucket} 文件列表失败`)
    }
  }

  // 保存文件列表
  console.log(`\n总计: ${allFiles.length} 个文件`)
  console.log('文件列表已保存到: migration-data/storage-files.json')

  // 生成 URL 映射表
  const urlMapping = allFiles.map((f) => ({
    old_url: f.oldUrl,
    new_url: `https://${OSS_BUCKET}.${OSS_ENDPOINT}/${f.newPath}`,
    new_path: f.newPath,
  }))

  console.log('URL 映射表已保存到: migration-data/url-mapping.json')

  console.log('\n下一步:')
  console.log('  npx tsx scripts/migrate-storage.ts --mode=migrate')
}

async function migrateFiles(batchSize: number = 50): Promise<void> {
  log('info', `开始迁移文件 (批次大小: ${batchSize})...`)

  if (!OSS_ENDPOINT || !OSS_BUCKET || !OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET) {
    log('error', '请设置 OSS 环境变量')
    process.exit(1)
  }

  // 读取文件列表
  const fileListPath = './migration-data/storage-files.json'
  let files: Array<{ bucket: string; name: string }> = []

  try {
    const { readFileSync } = await import('fs')
    const data = readFileSync(fileListPath, 'utf-8')
    files = JSON.parse(data)
  } catch {
    log('error', '找不到文件列表，请先运行 --mode=list')
    process.exit(1)
  }

  log('info', `待迁移文件: ${files.length} 个`)

  let successCount = 0
  let failCount = 0
  const failedFiles: Array<{ bucket: string; name: string; error: string }> = []

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    log('info', `处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`)

    for (const file of batch) {
      try {
        // 下载文件
        const data = await downloadSupabaseFile(file.bucket, file.name)

        // 上传到 OSS
        const contentType = getContentType(file.name)
        const success = await uploadToOSSForm(
          `${file.bucket}/${file.name}`,
          data,
          contentType
        )

        if (success) {
          successCount++
        } else {
          failCount++
          failedFiles.push({
            bucket: file.bucket,
            name: file.name,
            error: 'Upload failed',
          })
        }
      } catch (error) {
        failCount++
        failedFiles.push({
          bucket: file.bucket,
          name: file.name,
          error: String(error),
        })
      }
    }

    // 批次间隔
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log(`\n${colors.bold}迁移完成${colors.reset}`)
  log('success', `成功: ${successCount}`)
  if (failCount > 0) {
    log('error', `失败: ${failCount}`)
  }

  // 保存失败列表
  if (failedFiles.length > 0) {
    console.log('失败文件列表已保存到: migration-data/failed-files.json')
  }
}

function getContentType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
  }
  return types[ext || ''] || 'application/octet-stream'
}

// ============================================
// URL 更新脚本
// ============================================

async function updateURLs(): Promise<void> {
  log('info', '生成数据库 URL 更新 SQL...')

  try {
    const { readFileSync } = await import('fs')
    const mapping = JSON.parse(readFileSync('./migration-data/url-mapping.json', 'utf-8'))

    let sql = `-- URL 迁移 SQL\n-- 由 migrate-storage.ts 自动生成\n\n`

    for (const item of mapping) {
      const oldUrl = item.old_url
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\//g, '\\/')

      sql += `UPDATE posts SET content = REPLACE(content, '${item.old_url}', '${item.new_url}') WHERE content LIKE '%${oldUrl}%';\n`
      sql += `UPDATE profiles SET avatar_url = '${item.new_url}' WHERE avatar_url = '${item.old_url}';\n`
    }

    console.log('SQL 已保存到: migration-data/update-urls.sql')
    log('success', 'URL 更新 SQL 生成完成')

  } catch {
    log('error', '找不到 URL 映射文件')
  }
}

// ============================================
// 主函数
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const mode = args.find((arg) => arg.startsWith('--mode='))?.split('=')[1] || 'list'
  const batchSize = parseInt(args.find((arg) => arg.startsWith('--batch='))?.split('=')[1] || '50')

  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Supabase Storage → OSS 迁移工具                             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `)

  if (mode === 'list') {
    await listAllFiles()
  } else if (mode === 'migrate') {
    await migrateFiles(batchSize)
  } else if (mode === 'update-urls') {
    await updateURLs()
  } else {
    console.log('用法:')
    console.log('  --mode=list        列出所有文件')
    console.log('  --mode=migrate     迁移文件到 OSS')
    console.log('  --mode=update-urls 生成 URL 更新 SQL')
    console.log('  --batch=50         批次大小（默认 50）')
  }
}

main().catch(console.error)
