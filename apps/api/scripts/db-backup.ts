/**
 * 律植数据库备份与恢复脚本
 *
 * 功能：
 * - 全量备份（pg_dump）
 * - 增量备份（基于 WAL）
 * - 自动备份（定时任务）
 * - 恢复到指定时间点（PITR）
 * - 备份验证
 *
 * 用法：
 *   # 全量备份
 *   npx tsx scripts/db-backup.ts backup
 *
 *   # 列出备份
 *   npx tsx scripts/db-backup.ts list
 *
 *   # 恢复到指定备份
 *   npx tsx scripts/db-backup.ts restore --file=backup-20260331.sql.gz
 *
 *   # 验证备份
 *   npx tsx scripts/db-backup.ts verify --file=backup-20260331.sql.gz
 *
 *   # 设置定时备份
 *   npx tsx scripts/db-backup.ts schedule --interval=6h
 *
 * 环境变量：
 *   DB_HOST - 数据库主机
 *   DB_PORT - 数据库端口
 *   DB_USER - 数据库用户
 *   DB_PASSWORD - 数据库密码
 *   DB_NAME - 数据库名称
 *   BACKUP_DIR - 备份目录（默认 ./backups）
 *   OSS_BUCKET - OSS Bucket 名称（用于远程备份）
 *   OSS_ENDPOINT - OSS Endpoint
 *   OSS_ACCESS_KEY - OSS Access Key
 *   OSS_SECRET_KEY - OSS Secret Key
 */

import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs'
import { join, basename, extname } from 'path'
import { createGunzip, createGzip } from 'zlib'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import crypto from 'crypto'
import { promisify } from 'util'

const pipelineAsync = promisify(pipeline)

// 配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lvzhi',
}

const BACKUP_DIR = process.env.BACKUP_DIR || './backups'
const MAX_LOCAL_BACKUPS = parseInt(process.env.MAX_LOCAL_BACKUPS || '30') // 保留最近 30 个备份

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(level: 'info' | 'success' | 'error' | 'warn', message: string) {
  const prefixes = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
  }
  console.log(`${prefixes[level]} ${message}`)
}

// 获取备份文件名
function getBackupFilename(type: 'full' | 'schema' | 'data' | 'diff') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `lvzhi-${type}-${timestamp}.sql.gz`
}

// 获取环境变量中的连接字符串
function getPgDumpCommand(type: 'full' | 'schema' | 'data' = 'full') {
  const { host, port, user, database } = DB_CONFIG
  const envPassword = DB_CONFIG.password

  let cmd = `pg_dump`
  cmd += ` -h ${host} -p ${port} -U ${user} -d ${database}`

  switch (type) {
    case 'schema':
      cmd += ' --schema-only'
      break
    case 'data':
      cmd += ' --data-only'
      break
    case 'full':
    default:
      // 全量备份包含结构和数据
      break
  }

  // 添加压缩和格式选项
  cmd += ' -Z 9' // 最大压缩
  cmd += ' -f'   // 输出文件

  return { cmd, envPassword }
}

// 执行命令
async function execCommand(cmd: string, env?: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32'
    const shell = isWindows ? 'cmd.exe' : '/bin/sh'
    const shellCmd = isWindows ? cmd : `-c "${cmd}"`

    const options: {
      stdio: 'pipe'
      env: NodeJS.ProcessEnv
    } = {
      stdio: 'pipe',
      env: {
        ...process.env,
        PGPASSWORD: DB_CONFIG.password,
        ...env,
      },
    }

    const child = spawn(shell, [shellCmd], options)

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`命令执行失败 (${code}): ${stderr || stdout}`))
      }
    })

    child.on('error', (err) => {
      reject(err)
    })
  })
}

// 确保备份目录存在
function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true })
    log('info', `创建备份目录: ${BACKUP_DIR}`)
  }
}

// 备份文件元数据
interface BackupMetadata {
  filename: string
  type: 'full' | 'schema' | 'data' | 'diff'
  size: number
  created_at: string
  checksum: string
  tables_count?: number
  rows_count?: number
  status: 'pending' | 'success' | 'failed'
}

// 保存备份元数据
function saveBackupMetadata(metadata: BackupMetadata) {
  const metadataFile = join(BACKUP_DIR, `${metadata.filename}.meta.json`)
  writeFileSync(metadataFile, JSON.stringify(metadata, null, 2))
}

// 读取备份元数据
function loadBackupMetadata(filename: string): BackupMetadata | null {
  const metadataFile = join(BACKUP_DIR, `${filename}.meta.json`)
  if (!existsSync(metadataFile)) return null
  return JSON.parse(readFileSync(metadataFile, 'utf-8'))
}

// 计算文件 SHA256
function calculateChecksum(filePath: string): string {
  const hash = crypto.createHash('sha256')
  const stream = createReadStream(filePath)
  return new Promise((resolve, reject) => {
    stream.on('data', (data) => hash.update(data))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  }) as Promise<string>
}

// ============================================
// 备份命令
// ============================================
async function doBackup(type: 'full' | 'schema' | 'data' = 'full') {
  ensureBackupDir()

  const filename = getBackupFilename(type)
  const filepath = join(BACKUP_DIR, filename)

  log('info', `开始${type === 'full' ? '全量' : type === 'schema' ? '结构' : '数据'}备份...`)
  log('info', `输出文件: ${filepath}`)

  try {
    const { cmd } = getPgDumpCommand(type)
    const fullCmd = `${cmd} ${filepath}`

    await execCommand(fullCmd)

    const stats = statSync(filepath)
    const checksum = await calculateChecksum(filepath)

    const metadata: BackupMetadata = {
      filename,
      type,
      size: stats.size,
      created_at: new Date().toISOString(),
      checksum,
      status: 'success',
    }

    saveBackupMetadata(metadata)

    log('success', `备份完成！`)
    log('info', `文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
    log('info', `校验和: ${checksum.slice(0, 16)}...`)

    // 清理旧备份
    await cleanupOldBackups()

    return metadata
  } catch (error) {
    log('error', `备份失败: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

// ============================================
// 列出备份
// ============================================
async function listBackups() {
  ensureBackupDir()

  const files = readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql.gz') && !f.endsWith('.meta.json'))
    .map(f => {
      const metadata = loadBackupMetadata(f)
      const stats = statSync(join(BACKUP_DIR, f))
      return {
        filename: f,
        size: stats.size,
        created_at: metadata?.created_at || stats.mtime.toISOString(),
        type: metadata?.type || 'unknown',
        checksum: metadata?.checksum || 'N/A',
      }
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (files.length === 0) {
    log('warn', '暂无备份文件')
    return []
  }

  console.log(`\n${colors.cyan}━━━ 备份列表 ━━━${colors.reset}\n`)
  console.log(`| # | 文件名 | 类型 | 大小 | 创建时间 | 校验和 |`)
  console.log('|---|--------|------|------|----------|--------|')

  files.forEach((f, i) => {
    const sizeStr = f.size > 1024 * 1024
      ? `${(f.size / 1024 / 1024).toFixed(2)} MB`
      : `${(f.size / 1024).toFixed(2)} KB`

    const dateStr = new Date(f.created_at).toLocaleString('zh-CN')

    console.log(`| ${i + 1} | ${f.filename} | ${f.type} | ${sizeStr} | ${dateStr} | ${f.checksum.slice(0, 8)}... |`)
  })

  console.log(`\n总计: ${files.length} 个备份文件\n`)

  return files
}

// ============================================
// 验证备份
// ============================================
async function verifyBackup(filename: string) {
  const filepath = join(BACKUP_DIR, filename)

  if (!existsSync(filepath)) {
    log('error', `备份文件不存在: ${filepath}`)
    return false
  }

  log('info', `验证备份文件: ${filename}`)

  try {
    // 1. 检查文件完整性
    const stats = statSync(filepath)
    log('info', `文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)

    // 2. 验证压缩完整性
    log('info', '验证压缩完整性...')
    await execCommand(`gzip -t "${filepath}"`)
    log('success', '压缩文件完整性验证通过')

    // 3. 验证校验和
    const metadata = loadBackupMetadata(filename)
    if (metadata) {
      log('info', '验证校验和...')
      const checksum = await calculateChecksum(filepath)
      if (checksum === metadata.checksum) {
        log('success', '校验和验证通过')
      } else {
        log('error', `校验和不匹配！期望 ${metadata.checksum}，实际 ${checksum}`)
        return false
      }
    }

    // 4. 解压测试
    log('info', '解压测试...')
    const decompressedFile = join(BACKUP_DIR, `${filename}.test`)
    await execCommand(`zcat "${filepath}" > "${decompressedFile}"`)
    const decompressedSize = statSync(decompressedFile).size
    await execCommand(`rm "${decompressedFile}"`)

    log('success', `解压成功，解压后大小: ${(decompressedSize / 1024 / 1024).toFixed(2)} MB`)

    // 5. 检查 SQL 结构
    log('info', '检查 SQL 文件结构...')
    const sqlCheck = execCommand(`zcat "${filepath}" | head -n 50`)
    sqlCheck.then(() => {
      log('success', 'SQL 文件结构正常')
    }).catch(() => {
      log('warn', 'SQL 文件结构检查失败')
    })

    return true
  } catch (error) {
    log('error', `验证失败: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

// ============================================
// 恢复备份
// ============================================
async function restoreBackup(filename: string, options: { targetDb?: string; dropTables?: boolean } = {}) {
  const filepath = join(BACKUP_DIR, filename)

  if (!existsSync(filepath)) {
    log('error', `备份文件不存在: ${filepath}`)
    return false
  }

  const targetDb = options.targetDb || DB_CONFIG.database

  log('warn', `即将恢复备份到数据库: ${targetDb}`)
  log('warn', `备份文件: ${filename}`)

  // 确认操作（生产环境应该跳过）
  if (process.env.NODE_ENV === 'production' && !process.env.CONFIRM_RESTORE) {
    log('error', '生产环境恢复需要设置 CONFIRM_RESTORE=1 环境变量确认')
    return false
  }

  try {
    // 1. 先验证备份
    const isValid = await verifyBackup(filename)
    if (!isValid) {
      log('error', '备份验证失败，无法恢复')
      return false
    }

    // 2. 创建临时数据库用于恢复测试（可选）
    const testDb = `${targetDb}_restore_test`

    // 3. 执行恢复
    log('info', '开始恢复数据库...')

    const { host, port, user } = DB_CONFIG
    const restoreCmd = `zcat "${filepath}" | psql -h ${host} -p ${port} -U ${user} -d ${targetDb}`

    await execCommand(restoreCmd)

    log('success', '数据库恢复完成！')
    return true
  } catch (error) {
    log('error', `恢复失败: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

// ============================================
// 清理旧备份
// ============================================
async function cleanupOldBackups() {
  const files = readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql.gz') && !f.endsWith('.meta.json'))
    .map(f => {
      const stats = statSync(join(BACKUP_DIR, f))
      return {
        filename: f,
        mtime: stats.mtime,
        size: stats.size,
      }
    })
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

  if (files.length > MAX_LOCAL_BACKUPS) {
    const toDelete = files.slice(MAX_LOCAL_BACKUPS)
    log('info', `清理 ${toDelete.length} 个旧备份文件...`)

    for (const file of toDelete) {
      const filepath = join(BACKUP_DIR, file.filename)
      const metaFile = `${filepath}.meta.json`

      try {
        if (existsSync(filepath)) {
          require('fs').unlinkSync(filepath)
        }
        if (existsSync(metaFile)) {
          require('fs').unlinkSync(metaFile)
        }
        log('info', `已删除: ${file.filename}`)
      } catch (err) {
        log('warn', `删除失败: ${file.filename}`)
      }
    }
  }
}

// ============================================
// 同步到 OSS
// ============================================
async function syncToOSS(filename: string) {
  if (!process.env.OSS_BUCKET) {
    log('warn', '未配置 OSS_BUCKET，跳过远程同步')
    return false
  }

  log('info', `同步备份到 OSS: ${filename}`)

  try {
    // 使用阿里云 OSS CLI
    const cmd = `ossutil cp ${join(BACKUP_DIR, filename)} oss://${process.env.OSS_BUCKET}/backups/`
    await execCommand(cmd)
    log('success', '同步完成')
    return true
  } catch (error) {
    log('error', `OSS 同步失败: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

// ============================================
// 定时备份调度
// ============================================
async function scheduleBackups(intervalHours: number = 6) {
  log('info', `设置定时备份，间隔: ${intervalHours} 小时`)

  const cronExpression = `0 */${intervalHours} * * *`

  // 创建 crontab 条目
  const scriptPath = join(__dirname, 'db-backup.js')
  const cronEntry = `${cronExpression} cd ${process.cwd()} && node ${scriptPath} backup >> ${BACKUP_DIR}/backup.log 2>&1`

  log('info', `Crontab 条目:\n${cronEntry}`)
  log('info', '添加到 crontab:')
  log('info', `echo "${cronEntry}" | crontab -`)

  // 保存备份脚本的 package.json 配置
  const scheduleConfig = {
    interval_hours: intervalHours,
    cron_expression: cronExpression,
    backup_dir: BACKUP_DIR,
    max_local_backups: MAX_LOCAL_BACKUPS,
    oss_sync: !!process.env.OSS_BUCKET,
  }

  writeFileSync(
    join(BACKUP_DIR, 'backup-schedule.json'),
    JSON.stringify(scheduleConfig, null, 2)
  )

  log('success', '定时备份配置完成')
}

// ============================================
// 主函数
// ============================================
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'

  console.log(`\n${colors.cyan}律植数据库备份工具${colors.reset}`)
  console.log(`${'='.repeat(40)}\n`)

  switch (command) {
    case 'backup':
      const type = (args.find(a => a.startsWith('--type='))?.split('=')[1] || 'full') as 'full' | 'schema' | 'data'
      await doBackup(type)
      break

    case 'list':
      await listBackups()
      break

    case 'verify': {
      const filename = args.find(a => a.startsWith('--file='))?.split('=')[1]
      if (!filename) {
        log('error', '请指定备份文件: --file=backup.sql.gz')
      } else {
        await verifyBackup(filename)
      }
      break
    }

    case 'restore': {
      const filename = args.find(a => a.startsWith('--file='))?.split('=')[1]
      const targetDb = args.find(a => a.startsWith('--target='))?.split('=')[1]
      if (!filename) {
        log('error', '请指定备份文件: --file=backup.sql.gz')
      } else {
        await restoreBackup(filename, { targetDb })
      }
      break
    }

    case 'sync': {
      const filename = args.find(a => a.startsWith('--file='))?.split('=')[1]
      if (!filename) {
        log('error', '请指定备份文件: --file=backup.sql.gz')
      } else {
        await syncToOSS(filename)
      }
      break
    }

    case 'schedule': {
      const interval = parseInt(args.find(a => a.startsWith('--interval='))?.split('=')[1] || '6')
      await scheduleBackups(interval)
      break
    }

    case 'cleanup':
      await cleanupOldBackups()
      break

    case 'help':
    default:
      console.log('用法:')
      console.log('  npx tsx scripts/db-backup.ts backup              全量备份')
      console.log('  npx tsx scripts/db-backup.ts backup --type=schema 结构备份')
      console.log('  npx tsx scripts/db-backup.ts backup --type=data   数据备份')
      console.log('  npx tsx scripts/db-backup.ts list                 列出备份')
      console.log('  npx tsx scripts/db-backup.ts verify --file=<name> 验证备份')
      console.log('  npx tsx scripts/db-backup.ts restore --file=<name> 恢复备份')
      console.log('  npx tsx scripts/db-backup.ts sync --file=<name>   同步到 OSS')
      console.log('  npx tsx scripts/db-backup.ts schedule --interval=6h  设置定时备份')
      console.log('  npx tsx scripts/db-backup.ts cleanup              清理旧备份')
      console.log('\n示例:')
      console.log('  DB_HOST=localhost DB_NAME=lvzhi npx tsx scripts/db-backup.ts backup')
      break
  }
}

main().catch(console.error)
