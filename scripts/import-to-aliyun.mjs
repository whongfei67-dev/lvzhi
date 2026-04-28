#!/usr/bin/env node
/**
 * 数据导入脚本 - 从导出文件导入到阿里云 PolarDB
 * 
 * 使用方法：
 *   1. 设置环境变量
 *   2. 运行: node scripts/import-to-aliyun.mjs
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
    host: process.env.ALIYUN_HOST,
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
  console.log(`${prefix} [${new Date().toISOString()}] ${message}`, ...args);
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
    
    if (!host || !password) {
      throw new Error('Missing ALIYUN_HOST or ALIYUN_PASSWORD environment variable');
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
    log('success', `Connected to Aliyun PolarDB: ${host}:${port}/${database}`);
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      log('info', 'Disconnected from Aliyun PolarDB');
    }
  }

  async importTable(tableName, rows) {
    if (!rows || rows.length === 0) {
      log('warn', `  Table ${tableName}: no data`);
      this.stats.skipped++;
      return;
    }

    log('info', `Importing table: ${tableName} (${rows.length} rows)`);

    try {
      // 获取列名
      const columns = Object.keys(rows[0]);
      
      // 批量插入
      for (let i = 0; i < rows.length; i += config.batchSize) {
        const batch = rows.slice(i, i + config.batchSize);
        
        const values = batch.map(row => {
          return '(' + columns.map((_, idx) => `$${idx + 1}`).join(', ') + ')';
        }).join(', ');
        
        const params = batch.flatMap(row => columns.map(col => {
          const value = row[col];
          if (value === null) return null;
          if (typeof value === 'object') return JSON.stringify(value);
          return value;
        }));

        const query = `
          INSERT INTO ${tableName} (${columns.join(', ')})
          VALUES ${values}
          ON CONFLICT DO NOTHING
        `;

        await this.client.query(query, params);
      }

      log('success', `  ${tableName}: ${rows.length} rows imported`);
      this.stats.tables++;
      this.stats.imported += rows.length;

    } catch (error) {
      log('error', `  ${tableName}: ${error.message}`);
      this.stats.errors++;
    }
  }

  async verifyTable(tableName) {
    try {
      const result = await this.client.query(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      return -1;
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
      log('info', `Reading import file: ${config.importFile}`);
      const content = await fs.readFile(config.importFile, 'utf-8');
      const exportData = JSON.parse(content);

      const tables = Object.keys(exportData.tables);
      log('info', `Found ${tables.length} tables to import`);

      // 导入每个表
      for (const tableName of tables) {
        const { data } = exportData.tables[tableName];
        await this.importTable(tableName, data);
      }

      // 验证导入结果
      log('info', '\n--- Verifying import results ---\n');
      
      for (const tableName of tables) {
        const { data } = exportData.tables[tableName];
        const targetCount = await this.verifyTable(tableName);
        const sourceCount = data.length;
        
        if (targetCount >= sourceCount) {
          log('success', `  ${tableName}: ${targetCount} rows (expected ${sourceCount})`);
        } else {
          log('warn', `  ${tableName}: ${targetCount} rows (expected ${sourceCount}) - some rows may have been skipped due to conflicts`);
        }
      }

      // 更新统计信息
      log('info', 'Running ANALYZE...');
      await this.client.query('ANALYZE');

      // 统计
      log('success', '\n============================================');
      log('success', '  导入完成!');
      log('success', '============================================');
      log('info', `  表数量: ${this.stats.tables}`);
      log('info', `  导入行数: ${this.stats.imported}`);
      log('info', `  跳过: ${this.stats.skipped}`);
      log('info', `  错误数: ${this.stats.errors}`);

    } catch (error) {
      log('error', `Import failed: ${error.message}`);
      process.exitCode = 1;
    } finally {
      await this.disconnect();
    }
  }
}

// 运行
const importer = new DatabaseImporter();
importer.run();
