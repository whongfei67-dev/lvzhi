/**
 * 律植文件迁移工具
 *
 * 功能：
 * - 从 Supabase Storage 迁移到阿里云 OSS
 * - 批量迁移文件
 * - 断点续传
 * - 迁移进度跟踪
 * - URL 更新（数据库中的文件地址替换）
 *
 * 用法：
 *   # 迁移所有文件
 *   npx tsx scripts/migrate-files.ts
 *
 *   # 只迁移 images 目录
 *   npx tsx scripts/migrate-files.ts --prefix=images
 *
 *   # 从断点继续
 *   npx tsx scripts/migrate-files.ts --resume
 *
 *   # 预览迁移（不实际执行）
 *   npx tsx scripts/migrate-files.ts --dry-run
 *
 * 环境变量：
 *   SUPABASE_URL - Supabase 项目 URL
 *   SUPABASE_SERVICE_KEY - Supabase Service Role Key
 *   SUPABASE_ACCESS_TOKEN - Supabase Personal Access Token
 *   OSS_ACCESS_KEY_ID - 阿里云 Access Key ID
 *   OSS_ACCESS_KEY_SECRET - 阿里云 Access Key Secret
 *   OSS_BUCKET - OSS Bucket 名称
 *   OSS_REGION - OSS 区域
 *   OSS_ENDPOINT - OSS Endpoint
 *   OSS_CDN_URL - CDN 加速域名（可选）
 *   MIGRATION_BATCH_SIZE - 每批迁移数量（默认 50）
 *   MIGRATION_DELAY_MS - 批次间延迟（默认 100ms）
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs'
import { join } from 'path'

// ============================================
// 配置
// ============================================

interface MigrationConfig {
  supabase: {
    url: string
    serviceKey: string
    accessToken: string
  }
  oss: {
    accessKeyId: string
    accessKeySecret: string
    bucket: string
    region: string
    endpoint: string
    cdnUrl?: string
  }
  migration: {
    batchSize: number
    delayMs: number
    checkpointFile: string
    logFile: string
  }
}

function getConfig(): MigrationConfig {
  return {
    supabase: {
      url: process.env.SUPABASE_URL || '',
      serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
      accessToken: process.env.SUPABASE_ACCESS_TOKEN || '',
    },
    oss: {
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET || 'lvzhi-files',
      region: process.env.OSS_REGION || 'cn-shanghai',
      endpoint: process.env.OSS_ENDPOINT || 'oss-cn-shanghai.aliyuncs.com',
      cdnUrl: process.env.OSS_CDN_URL,
    },
    migration: {
      batchSize: parseInt(process.env.MIGRATION_BATCH_SIZE || '50'),
      delayMs: parseInt(process.env.MIGRATION_DELAY_MS || '100'),
      checkpointFile: './migrations/checkpoint.json',
      logFile: './migrations/migration.log',
    },
  }
}

// ============================================
// 日志
// ============================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(level: 'info' | 'success' | 'error' | 'warn' | 'progress', message: string) {
  const prefixes = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    progress: `${colors.cyan}→${colors.reset}`,
  }
  const timestamp = new Date().toISOString().slice(11, 19)
  console.log(`${prefixes[level]} [${timestamp}] ${message}`)
}

function logToFile(message: string) {
  const config = getConfig()
  const dir = join(process.cwd(), 'migrations')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  appendFileSync(
    join(process.cwd(), config.migration.logFile),
    `${new Date().toISOString()} ${message}\n`
  )
}

// ============================================
// 类型定义
// ============================================

interface StorageFile {
  name: string
  id: string
  bucket_id: string
  created_at: string
  updated_at: string
  last_accessed_at: string
  metadata: {
    size: number
    mimetype: string
  }
}

interface MigrationResult {
  success: boolean
  sourceUrl: string
  destPath: string
  destUrl: string
  size: number
  error?: string
}

interface Checkpoint {
  lastProcessedId: string
  processedCount: number
  failedCount: number
  totalCount: number
  startTime: string
  lastUpdateTime: string
  failedFiles: Array<{
    name: string
    error: string
    attempts: number
  }>
}

// ============================================
// Supabase Storage API
// ============================================

async function listSupabaseFiles(
  bucketId: string,
  prefix?: string
): Promise<StorageFile[]> {
  const config = getConfig()

  if (!config.supabase.url || !config.supabase.accessToken) {
    throw new Error('Supabase 配置不完整，请设置 SUPABASE_URL 和 SUPABASE_ACCESS_TOKEN')
  }

  const url = new URL(
    `${config.supabase.url}/storage/v1/object/list/${bucketId}`
  )
  if (prefix) {
    url.searchParams.set('prefix', prefix)
  }
  url.searchParams.set('recursive', 'true')

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${config.supabase.accessToken}`,
      'apikey': config.supabase.accessToken,
    },
  })

  if (!response.ok) {
    throw new Error(`列出文件失败: ${response.status} ${response.statusText}`)
  }

  const files = await response.json()
  return files.filter((f: StorageFile) => f.metadata?.size > 0)
}

async function downloadFromSupabase(
  bucketId: string,
  filePath: string
): Promise<Buffer> {
  const config = getConfig()

  const response = await fetch(
    `${config.supabase.url}/storage/v1/object/${bucketId}/${filePath}`,
    {
      headers: {
        'Authorization': `Bearer ${config.supabase.serviceKey}`,
        'apikey': config.supabase.serviceKey,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`下载文件失败: ${response.statusText}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

// ============================================
// OSS 上传
// ============================================

import crypto from 'crypto'

async function uploadToOSS(
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const config = getConfig()
  const { accessKeyId, accessKeySecret, bucket, endpoint } = config.oss

  const url = `https://${bucket}.${endpoint}/${filePath}`
  const date = new Date().toUTCString()

  const signature = crypto
    .createHmac('sha1', accessKeySecret)
    .update(`PUT\n\n${contentType}\n${date}\n/${bucket}/${filePath}`)
    .digest('base64')

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
      'Authorization': `OSS ${accessKeyId}:${signature}`,
      'Date': date,
    },
    body: buffer,
  })

  if (!response.ok) {
    throw new Error(`OSS 上传失败: ${response.status} ${response.statusText}`)
  }

  // 返回 CDN URL（如果有）
  return config.oss.cdnUrl
    ? `${config.oss.cdnUrl}/${filePath}`
    : url
}

// ============================================
// 迁移逻辑
// ============================================

function loadCheckpoint(): Checkpoint | null {
  const config = getConfig()
  const file = join(process.cwd(), config.migration.checkpointFile)

  if (!existsSync(file)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(file, 'utf-8'))
  } catch {
    return null
  }
}

function saveCheckpoint(checkpoint: Checkpoint) {
  const config = getConfig()
  const dir = join(process.cwd(), 'migrations')

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const file = join(process.cwd(), config.migration.checkpointFile)
  writeFileSync(file, JSON.stringify(checkpoint, null, 2))
}

async function migrateFile(
  bucketId: string,
  file: StorageFile
): Promise<MigrationResult> {
  const config = getConfig()

  const sourceUrl = `${config.supabase.url}/storage/v1/object/public/${bucketId}/${file.name}`
  const destPath = file.name

  try {
    // 下载文件
    const buffer = await downloadFromSupabase(bucketId, file.name)

    // 上传到 OSS
    const destUrl = await uploadToOSS(
      destPath,
      buffer,
      file.metadata.mimetype
    )

    return {
      success: true,
      sourceUrl,
      destPath,
      destUrl,
      size: file.metadata.size,
    }
  } catch (error) {
    return {
      success: false,
      sourceUrl,
      destPath,
      destUrl: '',
      size: file.metadata.size,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function migrateBatch(
  bucketId: string,
  files: StorageFile[],
  onProgress: (result: MigrationResult) => void
): Promise<void> {
  const config = getConfig()

  for (const file of files) {
    const result = await migrateFile(bucketId, file)
    onProgress(result)

    // 批次间延迟，避免限流
    if (files.indexOf(file) < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, config.migration.delayMs))
    }
  }
}

// ============================================
// 数据库 URL 更新
// ============================================

async function updateFileUrlsInDatabase(
  results: MigrationResult[]
): Promise<{ updated: number; failed: number }> {
  const config = getConfig()
  const successful = results.filter(r => r.success)

  if (successful.length === 0) {
    return { updated: 0, failed: 0 }
  }

  // 生成 SQL 更新语句
  const sqlStatements = successful.map(r => {
    const escapedSource = r.sourceUrl.replace(/'/g, "''")
    const escapedDest = r.destUrl.replace(/'/g, "''")
    return `UPDATE files SET url = '${escapedDest}' WHERE url = '${escapedSource}';`
  })

  // 输出 SQL（供手动执行或 DBA 执行）
  const updateScript = join(process.cwd(), 'migrations', 'update_file_urls.sql')
  writeFileSync(updateScript, sqlStatements.join('\n'))

  log('success', `生成了 ${sqlStatements.length} 条 URL 更新语句`)
  log('info', `SQL 文件: ${updateScript}`)
  log('warn', '请手动执行 SQL 或让 DBA 执行')

  return { updated: sqlStatements.length, failed: 0 }
}

// ============================================
// 主迁移流程
// ============================================

async function runMigration(options: {
  bucketId: string
  prefix?: string
  dryRun?: boolean
  resume?: boolean
}) {
  const config = getConfig()
  const { bucketId, prefix, dryRun, resume } = options

  log('info', `开始文件迁移任务`)
  log('info', `源: Supabase Storage (${bucketId})`)
  log('info', `目标: 阿里云 OSS (${config.oss.bucket})`)

  if (dryRun) {
    log('warn', 'Dry Run 模式 - 只显示文件列表，不实际迁移')
  }

  // 加载检查点
  let checkpoint = resume ? loadCheckpoint() : null

  if (resume && checkpoint) {
    log('info', `从检查点恢复，已处理 ${checkpoint.processedCount} 个文件`)
  } else {
    checkpoint = {
      lastProcessedId: '',
      processedCount: 0,
      failedCount: 0,
      totalCount: 0,
      startTime: new Date().toISOString(),
      lastUpdateTime: new Date().toISOString(),
      failedFiles: [],
    }
  }

  // 列出所有文件
  log('progress', '列出源文件...')
  const allFiles = await listSupabaseFiles(bucketId, prefix)

  // 过滤已处理的文件
  const filesToProcess = checkpoint.lastProcessedId
    ? allFiles.filter(f => f.id > checkpoint!.lastProcessedId)
    : allFiles

  log('info', `共 ${allFiles.length} 个文件，待处理 ${filesToProcess.length} 个`)

  if (dryRun) {
    console.log('\n文件列表预览（前 20 个）：')
    filesToProcess.slice(0, 20).forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} (${(f.metadata.size / 1024).toFixed(1)} KB)`)
    })
    if (filesToProcess.length > 20) {
      console.log(`  ... 还有 ${filesToProcess.length - 20} 个文件`)
    }
    return
  }

  // 开始迁移
  const results: MigrationResult[] = []
  const startTime = Date.now()

  log('info', `开始迁移，批次大小: ${config.migration.batchSize}`)

  for (let i = 0; i < filesToProcess.length; i += config.migration.batchSize) {
    const batch = filesToProcess.slice(i, i + config.migration.batchSize)
    const batchNum = Math.floor(i / config.migration.batchSize) + 1
    const totalBatches = Math.ceil(filesToProcess.length / config.migration.batchSize)

    log('progress', `处理批次 ${batchNum}/${totalBatches} (${batch.length} 个文件)`)

    await migrateBatch(bucketId, batch, (result) => {
      results.push(result)
      checkpoint!.processedCount++
      checkpoint!.lastProcessedId = result.destPath
      checkpoint!.lastUpdateTime = new Date().toISOString()

      if (result.success) {
        logToFile(`SUCCESS: ${result.sourceUrl} -> ${result.destUrl}`)
      } else {
        checkpoint!.failedCount++
        checkpoint!.failedFiles.push({
          name: result.destPath,
          error: result.error || 'Unknown error',
          attempts: 1,
        })
        logToFile(`FAILED: ${result.sourceUrl} - ${result.error}`)
      }
    })

    // 保存检查点
    saveCheckpoint(checkpoint)

    const progress = ((i + batch.length) / filesToProcess.length * 100).toFixed(1)
    const speed = ((i + batch.length) / ((Date.now() - startTime) / 1000)).toFixed(1)
    log('info', `进度: ${progress}% | 速度: ${speed} 文件/秒 | 失败: ${checkpoint.failedCount}`)
  }

  // 统计
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length
  const totalSize = results.reduce((sum, r) => sum + r.size, 0)
  const duration = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log(`\n${colors.green}━━━ 迁移完成 ━━━${colors.reset}\n`)
  console.log(`  总文件数: ${allFiles.length}`)
  console.log(`  成功: ${successCount}`)
  console.log(`  失败: ${failCount}`)
  console.log(`  总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`  耗时: ${duration} 秒`)
  console.log(`  平均速度: ${(successCount / parseFloat(duration)).toFixed(2)} 文件/秒\n`)

  // 生成 URL 更新 SQL
  if (successCount > 0) {
    await updateFileUrlsInDatabase(results)
  }

  // 导出失败文件列表
  if (failCount > 0) {
    const failedFile = join(process.cwd(), 'migrations', 'failed_files.json')
    writeFileSync(
      failedFile,
      JSON.stringify(checkpoint.failedFiles, null, 2)
    )
    log('warn', `失败文件列表已保存: ${failedFile}`)
    log('info', '可以修复后重新运行: npx tsx scripts/migrate-files.ts --resume')
  }
}

// ============================================
// CLI 入口
// ============================================

async function main() {
  const args = process.argv.slice(2)

  const options = {
    bucketId: args.find(a => a.startsWith('--bucket='))?.split('=')[1] || 'avatars',
    prefix: args.find(a => a.startsWith('--prefix='))?.split('=')[1],
    dryRun: args.includes('--dry-run'),
    resume: args.includes('--resume'),
    help: args.includes('--help'),
  }

  if (options.help) {
    console.log(`
${colors.cyan}律植文件迁移工具${colors.reset}

用法:
  npx tsx scripts/migrate-files.ts [选项]

选项:
  --bucket=<name>    指定 Supabase Storage Bucket (默认: avatars)
  --prefix=<path>    只迁移指定前缀的文件
  --dry-run          预览模式，只显示文件列表
  --resume           从检查点恢复继续迁移
  --help             显示帮助

示例:
  # 迁移所有文件
  npx tsx scripts/migrate-files.ts

  # 只迁移 avatars 目录
  npx tsx scripts/migrate-files.ts --bucket=avatars --prefix=users

  # 预览要迁移的文件
  npx tsx scripts/migrate-files.ts --dry-run

  # 从断点继续
  npx tsx scripts/migrate-files.ts --resume

环境变量:
  SUPABASE_URL           Supabase 项目 URL
  SUPABASE_SERVICE_KEY   Supabase Service Role Key
  SUPABASE_ACCESS_TOKEN   Supabase Personal Access Token
  OSS_ACCESS_KEY_ID       阿里云 Access Key ID
  OSS_ACCESS_KEY_SECRET  阿里云 Access Key Secret
  OSS_BUCKET              OSS Bucket 名称
  OSS_REGION              OSS 区域
  OSS_ENDPOINT            OSS Endpoint
  MIGRATION_BATCH_SIZE    每批迁移数量（默认 50）
  MIGRATION_DELAY_MS      批次间延迟（默认 100ms）
`)
    return
  }

  try {
    await runMigration(options)
  } catch (error) {
    log('error', `迁移失败: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

main()
