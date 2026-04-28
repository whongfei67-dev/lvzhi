#!/usr/bin/env node
/**
 * 数据库迁移脚本：从 Supabase 导出数据并导入到阿里云 PolarDB
 * 
 * 使用方法：
 *   1. 设置环境变量（见下方配置）
 *   2. 运行: node scripts/migrate-from-supabase.mjs
 * 
 * 环境变量：
 *   SUPABASE_URL          - Supabase 项目 URL
 *   SUPABASE_SERVICE_KEY  - Supabase Service Role Key
 *   ALIYUN_HOST           - 阿里云 PolarDB 连接地址
 *   ALIYUN_PORT           - 端口（默认 5432）
 *   ALIYUN_DB             - 数据库名
 *   ALIYUN_USER           - 用户名
 *   ALIYUN_PASSWORD       - 密码
 */

import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Client: PgClient } = pg;

// ============================================
// 配置
// ============================================

const config = {
  // Supabase 配置
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // 阿里云 PolarDB 配置
  aliyun: {
    host: process.env.ALIYUN_HOST,
    port: parseInt(process.env.ALIYUN_PORT || '5432'),
    database: process.env.ALIYUN_DB || 'lvzhi',
    user: process.env.ALIYUN_USER,
    password: process.env.ALIYUN_PASSWORD,
  },
  
  // 要迁移的表（按依赖顺序排列）
  tables: [
    // 基础表（无外键依赖）
    'profiles',
    'user_balances',
    'agents',
    'agent_versions',
    'agent_demos',
    'api_credentials',
    
    // 关联表
    'products',
    'subscriptions',
    'subscription_history',
    'coupons',
    'coupon_usages',
    'user_coupons',
    'orders',
    'balance_transactions',
    
    // 社区相关
    'community_posts',
    'community_articles',
    'favorites',
    'comments',
    'likes',
    
    // 互动相关
    'user_activities',
    'notifications',
    'login_history',
    
    // 安全相关
    'api_call_logs',
    'api_usage_stats',
    'login_attempts',
    'ip_blacklist',
    'ip_whitelist',
    'bot_detections',
    
    // 验证相关
    'verification_codes',
    'student_verifications',
    
    // 下载相关
    'download_records',
    'user_download_quotas',
  ],
};

// ============================================
// 日志工具
// ============================================

function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`, ...args);
}

// ============================================
// 主迁移类
// ============================================

class DatabaseMigrator {
  constructor() {
    this.supabase = null;
    this.sourceClient = null;
    this.targetClient = null;
    this.stats = {
      exported: 0,
      imported: 0,
      errors: 0,
      skipped: 0,
    };
  }

  // 初始化 Supabase 客户端
  initSupabase() {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    }
    
    this.supabase = createClient(config.supabase.url, config.supabase.serviceKey);
    log('info', 'Supabase client initialized');
  }

  // 初始化源数据库连接（Supabase PostgreSQL）
  async initSourceConnection() {
    // 如果有直接的 PostgreSQL 连接信息，可以使用
    // 否则通过 Supabase API 获取数据
    log('info', 'Will use Supabase API for data export');
  }

  // 初始化目标数据库连接（阿里云 PolarDB）
  async initTargetConnection() {
    const { host, port, database, user, password } = config.aliyun;
    
    if (!host || !user || !password) {
      throw new Error('Missing ALIYUN_HOST, ALIYUN_USER, or ALIYUN_PASSWORD environment variables');
    }

    this.targetClient = new PgClient({
      host,
      port,
      database,
      user,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000,
    });

    await this.targetClient.connect();
    log('info', `Connected to Aliyun PolarDB: ${host}:${port}/${database}`);
  }

  // 验证表是否存在
  async validateTables() {
    log('info', 'Validating tables in target database...');
    
    const result = await this.targetClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = new Set(result.rows.map(r => r.table_name));
    const missingTables = config.tables.filter(t => !existingTables.has(t));
    
    if (missingTables.length > 0) {
      log('warn', `Missing tables in target database: ${missingTables.join(', ')}`);
      log('warn', 'Please run migrations first: supabase/migrations/all_new_migrations.sql');
    } else {
      log('info', 'All required tables exist in target database');
    }
    
    return existingTables;
  }

  // 获取源数据总数
  async getSourceRowCount(tableName) {
    const { count, error } = await this.supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      log('warn', `Error getting count for ${tableName}: ${error.message}`);
      return 0;
    }
    
    return count || 0;
  }

  // 获取目标数据总数
  async getTargetRowCount(tableName) {
    const result = await this.targetClient.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    return parseInt(result.rows[0].count);
  }

  // 迁移单个表的数据
  async migrateTable(tableName) {
    log('info', `Migrating table: ${tableName}`);
    
    try {
      // 获取源数据总数
      const sourceCount = await this.getSourceRowCount(tableName);
      if (sourceCount === 0) {
        log('warn', `Table ${tableName} is empty, skipping`);
        this.stats.skipped++;
        return;
      }
      
      log('info', `  Source rows: ${sourceCount}`);
      
      // 获取目标当前行数
      const targetBeforeCount = await this.getTargetRowCount(tableName);
      log('info', `  Target rows before: ${targetBeforeCount}`);
      
      // 从 Supabase 获取数据（分批获取）
      const batchSize = 1000;
      let page = 0;
      let totalFetched = 0;
      
      while (true) {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .range(page * batchSize, (page + 1) * batchSize - 1);
        
        if (error) {
          throw new Error(`Supabase query error: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
          break;
        }
        
        // 插入到目标数据库
        if (data.length > 0) {
          await this.insertBatch(tableName, data);
          totalFetched += data.length;
          this.stats.exported += data.length;
        }
        
        if (data.length < batchSize) {
          break;
        }
        
        page++;
        
        // 进度显示
        if (page % 5 === 0) {
          log('info', `  Progress: ${totalFetched}/${sourceCount} rows`);
        }
      }
      
      // 验证导入结果
      const targetAfterCount = await this.getTargetRowCount(tableName);
      const importedCount = targetAfterCount - targetBeforeCount;
      
      this.stats.imported += importedCount;
      log('info', `  Imported: ${importedCount} new rows (total: ${targetAfterCount})`);
      
    } catch (error) {
      log('error', `  Failed to migrate ${tableName}: ${error.message}`);
      this.stats.errors++;
      throw error;
    }
  }

  // 批量插入数据
  async insertBatch(tableName, rows) {
    if (rows.length === 0) return;
    
    // 获取列名
    const columns = Object.keys(rows[0]);
    
    // 构建 VALUES 部分
    const values = rows.map(row => {
      return '(' + columns.map((col, i) => `$${i + 1}`).join(', ') + ')';
    }).join(', ');
    
    // 构建参数数组
    const params = rows.flatMap(row => columns.map(col => {
      const value = row[col];
      // 处理特殊类型
      if (value === null) return null;
      if (typeof value === 'object') return JSON.stringify(value);
      return value;
    }));
    
    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${values}
      ON CONFLICT DO NOTHING
    `;
    
    try {
      await this.targetClient.query(query, params);
    } catch (error) {
      // 如果表没有唯一约束，退回逐条插入
      if (error.code === '23505') {
        for (const row of rows) {
          await this.insertRow(tableName, row);
        }
      } else {
        throw error;
      }
    }
  }

  // 插入单行数据
  async insertRow(tableName, row) {
    const columns = Object.keys(row);
    const values = columns.map((_, i) => `$${i + 1}`);
    const params = columns.map(col => {
      const value = row[col];
      if (value === null) return null;
      if (typeof value === 'object') return JSON.stringify(value);
      return value;
    });
    
    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${values.join(', ')})
    `;
    
    try {
      await this.targetClient.query(query, params);
    } catch (error) {
      // 忽略唯一约束冲突
      if (error.code !== '23505') {
        log('warn', `  Insert error: ${error.message}`);
      }
    }
  }

  // 执行迁移
  async run() {
    log('info', '==========================================');
    log('info', '  Database Migration: Supabase → Aliyun PolarDB');
    log('info', '==========================================\n');

    try {
      // 初始化连接
      this.initSupabase();
      await this.initTargetConnection();
      
      // 验证表结构
      await this.validateTables();
      
      // 按顺序迁移表
      log('info', '\n--- Starting table migration ---\n');
      
      for (const tableName of config.tables) {
        await this.migrateTable(tableName);
      }
      
      // 统计信息
      log('info', '\n==========================================');
      log('info', '  Migration Summary');
      log('info', '==========================================');
      log('info', `  Tables processed: ${config.tables.length - this.stats.skipped}`);
      log('info', `  Tables skipped (empty): ${this.stats.skipped}`);
      log('info', `  Rows exported: ${this.stats.exported}`);
      log('info', `  Rows imported: ${this.stats.imported}`);
      log('info', `  Errors: ${this.stats.errors}`);
      
      if (this.stats.errors > 0) {
        log('warn', '\n⚠️  Some errors occurred during migration');
        log('warn', 'Please check the logs above and handle them manually');
        process.exitCode = 1;
      } else {
        log('info', '\n✅ Migration completed successfully!');
      }
      
      // 执行 ANALYZE 更新统计信息
      log('info', '\nRunning ANALYZE to update statistics...');
      await this.targetClient.query('ANALYZE');
      log('info', 'Statistics updated');
      
    } catch (error) {
      log('error', `Migration failed: ${error.message}`);
      process.exitCode = 1;
    } finally {
      // 清理连接
      if (this.targetClient) {
        await this.targetClient.end();
      }
    }
  }
}

// ============================================
// 直接 pg_dump 导出方法（备选方案）
// ============================================

async function exportWithPgDump() {
  log('info', 'Alternative: Using pg_dump for export');
  log('info', '\nTo export from Supabase, run:');
  log('info', `
    # 1. Get your Supabase connection string from dashboard
    # 2. Run pg_dump:
    
    PGPASSWORD=<your_password> pg_dump \\
      -h db.<your_project>.supabase.co \\
      -U postgres \\
      -d postgres \\
      --no-owner \\
      --no-acl \\
      -Fc \\
      -f backup.dump
    
    # 3. Import to Aliyun PolarDB:
    
    PGPASSWORD=<your_password> pg_restore \\
      -h <your_aliyun_host> \\
      -U <your_user> \\
      -d lvzhi \\
      --no-owner \\
      --no-acl \\
      --data-only \\
      backup.dump
  `);
}

// ============================================
// 主入口
// ============================================

const migrator = new DatabaseMigrator();

// 检查是否有 --dump 参数
if (process.argv.includes('--dump')) {
  await exportWithPgDump();
} else {
  await migrator.run();
}

export default DatabaseMigrator;
