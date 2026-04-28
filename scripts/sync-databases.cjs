/**
 * 完整的数据库同步脚本
 * 
 * 功能：
 * 1. 连接 Supabase 获取真实表结构
 * 2. 连接阿里云检查当前表结构  
 * 3. 创建缺失的表
 * 4. 添加缺失的列
 * 5. 导入数据
 * 
 * 使用方法：
 * cd 律植项目/scripts
 * node sync-databases.cjs
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ============== 配置 ==============
const SUPABASE_CONFIG = {
  host: 'db.kqtpdsgwkvzinonkprcl.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Wxwzcfwhf205',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000,
};

const ALIYUN_CONFIG = {
  host: 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
  port: 5432,
  database: 'data01',
  user: 'mamba_01',
  password: 'Wxwzcfwhf205',
  ssl: false,
  connectionTimeoutMillis: 30000,
};

const EXPORT_FILE = path.join(__dirname, '../data-exports/supabase-export-full-2026-03-29T11-43-13-364Z.json');
const BATCH_SIZE = 100;

// ============== 辅助函数 ==============
function log(type, message) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warn' ? '⚠️' : '📋';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

// ============== 获取表结构 ==============
async function getTableInfo(client, schema = 'public') {
  // 获取所有表
  const tablesResult = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = $1 AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `, [schema]);
  
  const tables = {};
  
  // 获取每个表的列信息
  for (const row of tablesResult.rows) {
    const tableName = row.table_name;
    
    const colsResult = await client.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default,
        is_identity
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [schema, tableName]);
    
    // 获取主键
    const pkResult = await client.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
    `, [schema, tableName]);
    
    const primaryKeys = pkResult.rows.map(r => r.column_name);
    
    // 获取外键
    const fkResult = await client.query(`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
    `, [schema, tableName]);
    
    tables[tableName] = {
      columns: colsResult.rows.map(col => ({
        name: col.column_name,
        type: col.data_type,
        maxLength: col.character_maximum_length,
        precision: col.numeric_precision,
        scale: col.numeric_scale,
        nullable: col.is_nullable === 'YES',
        default: col.column_default,
        isIdentity: col.is_identity === 'YES'
      })),
      primaryKeys,
      foreignKeys: fkResult.rows
    };
  }
  
  return tables;
}

// ============== 生成 CREATE TABLE SQL ==============
function generateCreateTableSQL(tableName, tableInfo) {
  const lines = [];
  lines.push(`CREATE TABLE IF NOT EXISTS "${tableName}" (`);
  
  const colDefs = [];
  for (const col of tableInfo.columns) {
    let def = `  "${col.name}" ${col.type}`;
    
    if (col.maxLength) {
      def += `(${col.maxLength})`;
    } else if (col.precision !== null && col.scale !== null) {
      def += `(${col.precision},${col.scale})`;
    }
    
    if (col.isIdentity) {
      def += ' GENERATED ALWAYS AS IDENTITY';
    } else if (col.default) {
      def += ` DEFAULT ${col.default}`;
    }
    
    if (!col.nullable) {
      def += ' NOT NULL';
    }
    
    colDefs.push(def);
  }
  
  if (tableInfo.primaryKeys.length > 0) {
    colDefs.push(`  PRIMARY KEY (${tableInfo.primaryKeys.map(c => `"${c}"`).join(', ')})`);
  }
  
  lines.push(colDefs.join(',\n'));
  lines.push(');');
  
  return lines.join('\n');
}

// ============== 生成 ADD COLUMN SQL ==============
function generateAddColumnSQL(tableName, column) {
  let sql = `ALTER TABLE "${tableName}" ADD COLUMN "${column.name}" ${column.type}`;
  
  if (column.maxLength) {
    sql += `(${column.maxLength})`;
  } else if (column.precision !== null && column.scale !== null) {
    sql += `(${column.precision},${column.scale})`;
  }
  
  if (column.default) {
    sql += ` DEFAULT ${column.default}`;
  }
  
  if (!column.nullable) {
    sql += ' NOT NULL';
  }
  
  return sql + ';';
}

// ============== 导出 Supabase 数据到 JSON ==============
async function exportSupabaseData() {
  log('info', '正在连接 Supabase...');
  const client = new Client(SUPABASE_CONFIG);
  
  try {
    await client.connect();
    log('success', '已连接到 Supabase');
    
    // 获取所有表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = {};
    let totalRows = 0;
    
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      process.stdout.write(`  导出 ${tableName}...\r`);
      
      const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
      tables[tableName] = dataResult.rows;
      totalRows += dataResult.rows.length;
    }
    
    console.log('');
    log('success', `已导出 ${tablesResult.rows.length} 张表，共 ${totalRows} 行数据`);
    
    // 保存到文件
    const exportData = {
      exported_at: new Date().toISOString(),
      supabase_url: SUPABASE_CONFIG.host,
      total_tables: tablesResult.rows.length,
      total_rows: totalRows,
      tables
    };
    
    const exportPath = path.join(__dirname, `../data-exports/supabase-export-full-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}Z.json`);
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    log('success', `数据已保存到: ${path.basename(exportPath)}`);
    
    return exportData;
  } finally {
    await client.end();
  }
}

// ============== 主同步函数 ==============
async function syncDatabases() {
  console.log('='.repeat(60));
  console.log('  数据库同步工具 - Supabase → 阿里云 PolarDB');
  console.log('='.repeat(60));
  console.log('');
  
  let supabaseClient, aliyunClient;
  
  try {
    // 步骤 1: 连接数据库
    log('info', '步骤 1: 连接数据库');
    
    log('info', '  连接 Supabase...');
    supabaseClient = new Client(SUPABASE_CONFIG);
    await supabaseClient.connect();
    log('success', '  Supabase 连接成功');
    
    log('info', '  连接阿里云 PolarDB...');
    aliyunClient = new Client(ALIYUN_CONFIG);
    await aliyunClient.connect();
    log('success', '  阿里云 PolarDB 连接成功');
    console.log('');
    
    // 步骤 2: 获取表结构
    log('info', '步骤 2: 获取表结构');
    
    log('info', '  获取 Supabase 表结构...');
    const supabaseTables = await getTableInfo(supabaseClient);
    log('success', `  Supabase 共有 ${Object.keys(supabaseTables).length} 张表`);
    
    log('info', '  获取阿里云表结构...');
    const aliyunTables = await getTableInfo(aliyunClient);
    log('success', `  阿里云 共有 ${Object.keys(aliyunTables).length} 张表`);
    console.log('');
    
    // 步骤 3: 对比并创建缺失的表
    log('info', '步骤 3: 创建缺失的表');
    
    const supabaseTableNames = new Set(Object.keys(supabaseTables));
    const aliyunTableNames = new Set(Object.keys(aliyunTables));
    const missingTables = [...supabaseTableNames].filter(t => !aliyunTableNames.has(t));
    
    if (missingTables.length === 0) {
      log('success', '  所有表都已存在于阿里云');
    } else {
      log('info', `  发现 ${missingTables.length} 张缺失的表`);
      console.log('');
      
      for (const tableName of missingTables) {
        log('info', `  创建表: ${tableName}`);
        const sql = generateCreateTableSQL(tableName, supabaseTables[tableName]);
        
        try {
          await aliyunClient.query(sql);
          log('success', `    表 ${tableName} 创建成功`);
        } catch (err) {
          log('error', `    创建表 ${tableName} 失败: ${err.message}`);
        }
      }
    }
    console.log('');
    
    // 步骤 4: 对比并添加缺失的列
    log('info', '步骤 4: 添加缺失的列');
    
    const commonTables = [...supabaseTableNames].filter(t => aliyunTableNames.has(t));
    let missingColumnsCount = 0;
    
    for (const tableName of commonTables) {
      const supaCols = new Map(supabaseTables[tableName].columns.map(c => [c.name, c]));
      const aliCols = new Map(aliyunTables[tableName].columns.map(c => [c.name, c]));
      
      for (const [colName, colInfo] of supaCols) {
        if (!aliCols.has(colName)) {
          log('info', `  表 ${tableName} 添加列: ${colName} (${colInfo.type})`);
          const sql = generateAddColumnSQL(tableName, colInfo);
          
          try {
            await aliyunClient.query(sql);
            missingColumnsCount++;
          } catch (err) {
            log('error', `    添加列失败: ${err.message}`);
          }
        }
      }
    }
    
    if (missingColumnsCount === 0) {
      log('success', '  所有列都已存在');
    } else {
      log('success', `  已添加 ${missingColumnsCount} 个缺失的列`);
    }
    console.log('');
    
    // 步骤 5: 导入数据
    log('info', '步骤 5: 导入数据');
    
    // 先从 Supabase 导出最新数据
    log('info', '  从 Supabase 导出最新数据...');
    await supabaseClient.end();
    const exportData = await exportSupabaseData();
    
    // 重新连接阿里云
    aliyunClient = new Client(ALIYUN_CONFIG);
    await aliyunClient.connect();
    
    const tableNames = Object.keys(exportData.tables);
    let totalImported = 0;
    let totalErrors = 0;
    
    for (const tableName of tableNames) {
      const rows = exportData.tables[tableName];
      
      if (!rows || rows.length === 0) continue;
      
      process.stdout.write(`  导入 ${tableName}: ${rows.length} 行...\r`);
      
      // 检查表是否存在
      const tableCheck = await aliyunClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        ) as exists
      `, [tableName]);
      
      if (!tableCheck.rows[0].exists) {
        log('warn', `    表 ${tableName} 不存在，跳过`);
        continue;
      }
      
      // 获取列名
      const columns = Object.keys(rows[0]);
      const columnList = columns.join(', ');
      
      // 批量插入
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, Math.min(i + BATCH_SIZE, rows.length));
        
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
          INSERT INTO "${tableName}" (${columnList})
          VALUES ${values}
          ON CONFLICT DO NOTHING
        `;
        
        try {
          await aliyunClient.query(query, params);
        } catch (err) {
          totalErrors++;
          if (totalErrors <= 5) {
            log('error', `    导入错误: ${err.message.slice(0, 100)}`);
          }
        }
      }
      
      totalImported += rows.length;
    }
    
    console.log('');
    log('success', `  数据导入完成: ${totalImported} 行成功`);
    if (totalErrors > 0) {
      log('warn', `  导入错误: ${totalErrors} 个`);
    }
    console.log('');
    
    // 步骤 6: 验证
    log('info', '步骤 6: 验证结果');
    
    const finalAliyunTables = await getTableInfo(aliyunClient);
    log('success', `  阿里云现有 ${Object.keys(finalAliyunTables).length} 张表`);
    
    // 获取总行数
    let totalRows = 0;
    for (const tableName of Object.keys(finalAliyunTables)) {
      try {
        const countResult = await aliyunClient.query(`SELECT COUNT(*) FROM "${tableName}"`);
        totalRows += parseInt(countResult.rows[0].count);
      } catch {}
    }
    log('success', `  阿里云总数据量: ${totalRows} 行`);
    console.log('');
    
    // 完成
    console.log('='.repeat(60));
    log('success', '  数据库同步完成!');
    console.log('='.repeat(60));
    
  } catch (err) {
    log('error', `同步失败: ${err.message}`);
    console.error(err);
  } finally {
    if (supabaseClient) await supabaseClient.end().catch(() => {});
    if (aliyunClient) await aliyunClient.end().catch(() => {});
  }
}

// ============== 运行 ==============
syncDatabases().catch(console.error);
