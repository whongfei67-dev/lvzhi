#!/usr/bin/env node
/**
 * 数据库导出脚本 - 从 Supabase 导出数据到文件
 * 
 * 此脚本使用 Supabase REST API 导出数据，不依赖 pg_dump
 * 
 * 使用方法：
 *   1. 设置环境变量
 *   2. 运行: node scripts/export-supabase-api.mjs
 * 
 * 环境变量：
 *   SUPABASE_URL          - Supabase 项目 URL
 *   SUPABASE_SERVICE_KEY  - Supabase Service Role Key
 *   EXPORT_DIR            - 导出目录（可选，默认 ./data-exports）
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const EXPORT_DIR = process.env.EXPORT_DIR || path.join(rootDir, 'data-exports');

// ============================================
// 配置
// ============================================

const config = {
  // Supabase 配置
  supabase: {
    url: process.env.SUPABASE_URL || 'https://kqtpdsgwkvzinonkprcl.supabase.co',
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  
  // 要导出的表（按依赖顺序排列，避免外键冲突）
  tables: [
    // 基础表（无外键依赖或自包含）
    'profiles',
    'users',
    'user_balances',
    
    // 智能体相关
    'agents',
    'agent_versions',
    'agent_demos',
    'agent_reviews',
    'agent_favorites',
    'agent_tags',
    
    // API 凭证
    'api_credentials',
    'api_call_logs',
    'api_usage_stats',
    
    // 产品与订阅
    'products',
    'subscriptions',
    'subscription_history',
    
    // 优惠券
    'coupons',
    'coupon_usages',
    'user_coupons',
    
    // 订单与支付
    'orders',
    'balance_transactions',
    'balance_withdrawals',
    
    // 社区
    'community_posts',
    'community_articles',
    'community_comments',
    
    // 互动
    'favorites',
    'comments',
    'likes',
    'user_activities',
    
    // 通知
    'notifications',
    'notification_preferences',
    
    // 认证相关
    'login_history',
    'login_attempts',
    'verification_codes',
    'student_verifications',
    
    // 安全相关
    'ip_blacklist',
    'ip_whitelist',
    'bot_detections',
    
    // 下载相关
    'download_records',
    'user_download_quotas',
    
    // 文件存储相关
    'storage_objects',
    'storage_buckets',
    
    // 会话相关
    'sessions',
    'refresh_tokens',
  ],
};

// ============================================
// 日志工具
// ============================================

function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : '📦';
  console.log(`${prefix} [${timestamp}] ${message}`, ...args);
}

// ============================================
// 主导出类
// ============================================

class DatabaseExporter {
  constructor() {
    this.stats = {
      tables: 0,
      totalRows: 0,
      errors: 0,
    };
  }

  // 验证配置
  validateConfig() {
    if (!config.supabase.url) {
      throw new Error('Missing SUPABASE_URL environment variable');
    }
    if (!config.supabase.serviceKey) {
      throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
    }
  }

  // 获取表列表
  async getTables() {
    log('info', '获取数据库表列表...');
    
    const response = await fetch(`${config.supabase.url}/rest/v1/?apikey=${config.supabase.serviceKey}`, {
      headers: {
        'apikey': config.supabase.serviceKey,
        'Authorization': `Bearer ${config.supabase.serviceKey}`,
      },
    });

    // 由于 REST API 不直接返回表列表，我们使用 metadata 端点
    const metaResponse = await fetch(`${config.supabase.url}/rest/v1/$metadata`, {
      headers: {
        'apikey': config.supabase.serviceKey,
        'Authorization': `Bearer ${config.supabase.serviceKey}`,
      },
    });

    if (!metaResponse.ok) {
      log('warn', '无法获取表元数据，使用预定义表列表');
      return config.tables;
    }

    const metadata = await metaResponse.json();
    const tables = metadata.map(t => t.table_name).filter(Boolean);
    
    log('success', `找到 ${tables.length} 个表`);
    return tables;
  }

  // 获取表的行数
  async getTableCount(tableName) {
    try {
      const response = await fetch(
        `${config.supabase.url}/rest/v1/${tableName}?select=*&count=exact&limit=1`,
        {
          headers: {
            'apikey': config.supabase.serviceKey,
            'Authorization': `Bearer ${config.supabase.serviceKey}`,
            'Prefer': 'count=exact',
          },
        }
      );

      const count = response.headers.get('content-range')?.split('/')[1];
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  // 导出单个表
  async exportTable(tableName, allRows = []) {
    const batchSize = 1000;
    let page = 0;
    let hasMore = true;

    log('info', `导出表: ${tableName}`);

    try {
      while (hasMore) {
        const offset = page * batchSize;
        const response = await fetch(
          `${config.supabase.url}/rest/v1/${tableName}?select=*&offset=${offset}&limit=${batchSize}`,
          {
            headers: {
              'apikey': config.supabase.serviceKey,
              'Authorization': `Bearer ${config.supabase.serviceKey}`,
              'Range': `${offset}-${offset + batchSize - 1}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            log('warn', `  表 ${tableName} 不存在，跳过`);
            return null;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (Array.isArray(data)) {
          allRows.push(...data);
          
          if (data.length < batchSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      log('success', `  ${tableName}: ${allRows.length} 行`);
      this.stats.tables++;
      this.stats.totalRows += allRows.length;

      return allRows;
    } catch (error) {
      log('error', `  ${tableName}: 导出失败 - ${error.message}`);
      this.stats.errors++;
      return null;
    }
  }

  // 执行导出
  async run() {
    console.log('');
    console.log('============================================');
    console.log('  律植 - Supabase 数据库导出工具 (API)');
    console.log('============================================');
    console.log('');

    try {
      // 验证配置
      this.validateConfig();
      log('info', `Supabase URL: ${config.supabase.url}`);

      // 创建导出目录
      await fs.mkdir(EXPORT_DIR, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFile = path.join(EXPORT_DIR, `supabase-export-${timestamp}.json`);

      // 获取表列表
      const tables = await this.getTables();

      // 导出所有表
      log('info', `\n--- 开始导出 ${tables.length} 个表 ---\n`);

      const exportData = {
        exported_at: new Date().toISOString(),
        supabase_url: config.supabase.url,
        tables: {},
      };

      for (const tableName of tables) {
        const rows = await this.exportTable(tableName);
        if (rows !== null) {
          exportData.tables[tableName] = {
            count: rows.length,
            data: rows,
          };
        }
      }

      // 保存导出文件
      log('info', `\n保存导出文件: ${exportFile}`);
      await fs.writeFile(exportFile, JSON.stringify(exportData, null, 2), 'utf-8');

      // 生成导入脚本
      await this.generateImportScript(exportData);

      // 统计信息
      log('success', '\n============================================');
      log('success', '  导出完成!');
      log('success', '============================================');
      log('info', `  导出文件: ${exportFile}`);
      log('info', `  表数量: ${this.stats.tables}`);
      log('info', `  总行数: ${this.stats.totalRows}`);
      log('info', `  错误数: ${this.stats.errors}`);

      // 文件大小
      const stats = await fs.stat(exportFile);
      const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
      log('info', `  文件大小: ${fileSizeMB} MB`);

      console.log('');
      console.log('下一步操作:');
      console.log('  1. 查看导出: cat ' + exportFile);
      console.log('  2. 导入到阿里云: node scripts/import-to-aliyun.mjs');
      console.log('');

    } catch (error) {
      log('error', `导出失败: ${error.message}`);
      process.exitCode = 1;
    }
  }

  // 生成导入脚本
  async generateImportScript(exportData) {
    const scriptContent = `#!/usr/bin/env node
/**
 * 数据导入脚本 - 从导出文件导入到阿里云 PolarDB
 * 
 * 使用方法：
 *   1. 设置环境变量
 *   2. 运行: ALIYUN_PASSWORD=xxx node scripts/import-to-aliyun.mjs
 */

import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Client: PgClient } = pg;

// ============================================
// 配置
// ============================================

const config = {
  // 阿里云 PolarDB 配置
  aliyun: {
    host: process.env.ALIYUN_HOST || 'your-aliyun-host.pg.rds.aliyuncs.com',
    port: parseInt(process.env.ALIYUN_PORT || '5432'),
    database: process.env.ALIYUN_DB || 'lvzhi',
    user: process.env.ALIYUN_USER || 'lvzhi',
    password: process.env.ALIYUN_PASSWORD,
  },
  
  // 导入文件路径
  importFile: process.env.IMPORT_FILE || './data-exports/supabase-export-latest.json',
  
  // 批量插入大小
  batchSize: 500,
};

// ============================================
// 日志
// ============================================

function log(level, message, ...args) {
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : '📦';
  console.log(\`\${prefix} [\${new Date().toISOString()}] \${message}\`, ...args);
}

// ============================================
// 主导入类
// ============================================

class DatabaseImporter {
  constructor() {
    this.client = null;
    this.stats = {
      tables: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
    };
  }

  async connect() {
    const { host, port, database, user, password } = config.aliyun;
    
    if (!password) {
      throw new Error('Missing ALIYUN_PASSWORD environment variable');
    }

    this.client = new PgClient({
      host,
      port,
      database,
      user,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000,
    });

    await this.client.connect();
    log('success', \`Connected to Aliyun PolarDB: \${host}:\${port}/\${database}\`);
  }

  async importTable(tableName, rows) {
    if (!rows || rows.length === 0) {
      log('warn', \`  Table \${tableName}: no data\`);
      this.stats.skipped++;
      return;
    }

    log('info', \`Importing table: \${tableName} (\${rows.length} rows)\`);

    try {
      // 获取列名
      const columns = Object.keys(rows[0]);
      
      // 批量插入
      for (let i = 0; i < rows.length; i += config.batchSize) {
        const batch = rows.slice(i, i + config.batchSize);
        
        const values = batch.map(row => {
          return '(' + columns.map((_, idx) => \`\$${idx + 1}\`).join(', ') + ')';
        }).join(', ');
        
        const params = batch.flatMap(row => columns.map(col => {
          const value = row[col];
          if (value === null) return null;
          if (typeof value === 'object') return JSON.stringify(value);
          return value;
        }));

        const query = \`
          INSERT INTO \${tableName} (\${columns.join(', ')})
          VALUES \${values}
          ON CONFLICT DO NOTHING
        \`;

        await this.client.query(query, params);
      }

      log('success', \`  \${tableName}: \${rows.length} rows imported\`);
      this.stats.tables++;
      this.stats.imported += rows.length;

    } catch (error) {
      log('error', \`  \${tableName}: \${error.message}\`);
      this.stats.errors++;
    }
  }

  async run() {
    console.log('');
    console.log('============================================');
    console.log('  律植 - 数据导入工具 (导入到阿里云 PolarDB)');
    console.log('============================================');
    console.log('');

    try {
      // 连接数据库
      await this.connect();

      // 读取导出文件
      log('info', \`Reading import file: \${config.importFile}\`);
      const content = await fs.readFile(config.importFile, 'utf-8');
      const exportData = JSON.parse(content);

      const tables = Object.keys(exportData.tables);
      log('info', \`Found \${tables.length} tables to import\`);

      // 导入每个表
      for (const tableName of tables) {
        const { data } = exportData.tables[tableName];
        await this.importTable(tableName, data);
      }

      // 更新统计信息
      log('info', 'Running ANALYZE...');
      await this.client.query('ANALYZE');

      // 统计
      log('success', '\\n============================================');
      log('success', '  导入完成!');
      log('success', '============================================');
      log('info', \`  表数量: \${this.stats.tables}\`);
      log('info', \`  导入行数: \${this.stats.imported}\`);
      log('info', \`  跳过: \${this.stats.skipped}\`);
      log('info', \`  错误数: \${this.stats.errors}\`);

    } catch (error) {
      log('error', \`Import failed: \${error.message}\`);
      process.exitCode = 1;
    } finally {
      if (this.client) {
        await this.client.end();
      }
    }
  }
}

// 运行
const importer = new DatabaseImporter();
importer.run();
`;

    const scriptPath = path.join(EXPORT_DIR, 'import-to-aliyun.mjs');
    await fs.writeFile(scriptPath, scriptContent, 'utf-8');
    log('success', `导入脚本已生成: ${scriptPath}`);
  }
}

// ============================================
// 主入口
// ============================================

const exporter = new DatabaseExporter();
exporter.run();
