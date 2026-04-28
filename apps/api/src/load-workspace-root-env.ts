/**
 * `pnpm dev:api` 的工作目录在 apps/api，默认读不到仓库根目录的 `.env.local`（常见含 DATABASE_URL）。
 * 在尚未配置数据库相关环境变量时，尝试从仓库根与 apps/api 加载 dotenv（不覆盖进程里已有变量）。
 */
import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const srcDir = path.dirname(fileURLToPath(import.meta.url))
const apiRoot = path.resolve(srcDir, '..')
const repoRoot = path.resolve(apiRoot, '..', '..')

if (!process.env.DATABASE_URL && !process.env.DATABASE_HOST) {
  loadEnv({ path: path.join(repoRoot, '.env') })
  loadEnv({ path: path.join(repoRoot, '.env.local'), override: true })
  loadEnv({ path: path.join(apiRoot, '.env') })
  loadEnv({ path: path.join(apiRoot, '.env.local'), override: true })
}
