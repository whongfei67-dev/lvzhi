/**
 * 数据库对比与修复脚本 - 分步骤执行
 * 
 * 使用方法：
 * cd 律植项目/scripts
 * 
 * 步骤1 - 对比表结构:
 *   node sync-steps.cjs compare
 * 
 * 步骤2 - 创建缺失的表:
 *   node sync-steps.cjs create-tables
 * 
 * 步骤3 - 添加缺失的列:
 *   node sync-steps.cjs add-columns
 * 
 * 步骤4 - 导入数据:
 *   node sync-steps.cjs import
 * 
 * 一步完成所有:
 *   node sync-steps.cjs all
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
  const tablesResult = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = $1 AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `, [schema]);
  
  const tables = {};
  
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
      primaryKeys: pkResult.rows.map(r => r.column_name)
    };
  }
  
  return tables;
}

// ============== 生成 SQL ==============
function generateCreateTableSQL(tableName, tableInfo) {
  const lines = [];
  lines.push(`CREATE TABLE IF NOT EXISTS "${tableName}" (`);
  
  const colDefs = [];
  for (const col of tableInfo.columns) {
    let def = `  "${col.name}" ${col.type}`;
    
    if (col.maxLength) def += `(${col.maxLength})`;
    else if (col.precision !== null && col.scale !== null) def += `(${col.precision},${col.scale})`;
    
    if (col.isIdentity) def += ' GENERATED ALWAYS AS IDENTITY';
    else if (col.default) def += ` DEFAULT ${col.default}`;
    
    if (!col.nullable) def += ' NOT NULL';
    colDefs.push(def);
  }
  
  if (tableInfo.primaryKeys.length > 0) {
    colDefs.push(`  PRIMARY KEY (${tableInfo.primaryKeys.map(c => `"${c}"`).join(', ')})`);
  }
  
  lines.push(colDefs.join(',\n'));
  lines.push(');');
  
  return lines.join('\n');
}

function generateAddColumnSQL(tableName, column) {
  let sql = `ALTER TABLE "${tableName}" ADD COLUMN "${column.name}" ${column.type}`;
  if (column.maxLength) sql += `(${column.maxLength})`;
  else if (column.precision !== null && column.scale !== null) sql += `(${column.precision},${column.scale})`;
  if (column.default) sql += ` DEFAULT ${column.default}`;
  if (!column.nullable) sql += ' NOT NULL';
  return sql + ';';
}

// ============== 步骤 1: 对比 ==============
async function stepCompare() {
  console.log('\n' + '='.repeat(60));
  console.log('  步骤 1: 对比 Supabase 和阿里云的表结构');
  console.log('='.repeat(60) + '\n');
  
  let supabaseClient, aliyunClient;
  
  try {
    // 连接 Supabase
    log('info', '连接 Supabase...');
    supabaseClient = new Client(SUPABASE_CONFIG);
    await supabaseClient.connect();
    log('success', 'Supabase 连接成功');
    
    // 连接阿里云
    log('info', '连接阿里云 PolarDB...');
    aliyunClient = new Client(ALIYUN_CONFIG);
    await aliyunClient.connect();
    log('success', '阿里云 PolarDB 连接成功\n');
    
    // 获取表结构
    log('info', '获取 Supabase 表结构...');
    const supabaseTables = await getTableInfo(supabaseClient);
    log('info', `Supabase 共有 ${Object.keys(supabaseTables).length} 张表\n`);
    
    log('info', '获取阿里云表结构...');
    const aliyunTables = await getTableInfo(aliyunClient);
    log('info', `阿里云 共有 ${Object.keys(aliyunTables).length} 张表\n`);
    
    // 对比
    const supabaseTableNames = new Set(Object.keys(supabaseTables));
    const aliyunTableNames = new Set(Object.keys(aliyunTables));
    
    const missingTables = [...supabaseTableNames].filter(t => !aliyunTableNames.has(t));
    const extraTables = [...aliyunTableNames].filter(t => !supabaseTableNames.has(t));
    const commonTables = [...supabaseTableNames].filter(t => aliyunTableNames.has(t));
    
    // 统计缺失列
    const missingColumns = [];
    for (const tableName of commonTables) {
      const supaCols = new Set(supabaseTables[tableName].columns.map(c => c.name));
      const aliCols = new Set(aliyunTables[tableName].columns.map(c => c.name));
      
      for (const colName of supaCols) {
        if (!aliCols.has(colName)) {
          const colInfo = supabaseTables[tableName].columns.find(c => c.name === colName);
          missingColumns.push({ table: tableName, column: colName, info: colInfo });
        }
      }
    }
    
    // 输出结果
    console.log('='.repeat(60));
    console.log('  对比结果');
    console.log('='.repeat(60) + '\n');
    
    console.log(`📋 表统计:`);
    console.log(`   Supabase: ${supabaseTableNames.size} 张表`);
    console.log(`   阿里云:   ${aliyunTableNames.size} 张表`);
    console.log(`   共同:     ${commonTables.length} 张表`);
    console.log('');
    
    if (missingTables.length > 0) {
      console.log(`⚠️  阿里云缺失的表 (${missingTables.length} 张):`);
      missingTables.forEach(t => console.log(`   - ${t}`));
      console.log('');
    } else {
      console.log('✅ 所有表都已存在于阿里云\n');
    }
    
    if (extraTables.length > 0) {
      console.log(`ℹ️  阿里云额外的表 (${extraTables.length} 张):`);
      extraTables.forEach(t => console.log(`   - ${t}`));
      console.log('');
    }
    
    if (missingColumns.length > 0) {
      console.log(`⚠️  阿里云缺失的列 (${missingColumns.length} 个):`);
      // 按表分组
      const grouped = {};
      for (const { table, column, info } of missingColumns) {
        if (!grouped[table]) grouped[table] = [];
        grouped[table].push({ column, info });
      }
      for (const [table, cols] of Object.entries(grouped)) {
        console.log(`   表 ${table}:`);
        for (const { column, info } of cols) {
          console.log(`     - ${column} (${info.type}${info.maxLength ? `(${info.maxLength})` : ''})`);
        }
      }
      console.log('');
    } else if (commonTables.length > 0) {
      console.log('✅ 所有列都已存在于阿里云\n');
    }
    
    // 保存对比结果到文件
    const compareResult = {
      timestamp: new Date().toISOString(),
      supabase_table_count: supabaseTableNames.size,
      aliyun_table_count: aliyunTableNames.size,
      missing_tables: missingTables,
      extra_tables: extraTables,
      missing_columns: missingColumns,
      supabase_tables: supabaseTables,
      aliyun_tables: aliyunTables
    };
    
    const outputPath = path.join(__dirname, '../data-exports/compare-result.json');
    fs.writeFileSync(outputPath, JSON.stringify(compareResult, null, 2));
    log('success', `对比结果已保存到: ${path.basename(outputPath)}`);
    
    return compareResult;
    
  } finally {
    if (supabaseClient) await supabaseClient.end();
    if (aliyunClient) await aliyunClient.end();
  }
}

// ============== 步骤 2: 创建缺失的表 ==============
async function stepCreateTables() {
  console.log('\n' + '='.repeat(60));
  console.log('  步骤 2: 在阿里云创建缺失的表');
  console.log('='.repeat(60) + '\n');
  
  // 读取对比结果
  let compareResult;
  try {
    const data = fs.readFileSync(path.join(__dirname, '../data-exports/compare-result.json'), 'utf-8');
    compareResult = JSON.parse(data);
  } catch {
    log('error', '请先运行步骤1进行对比');
    return;
  }
  
  const { missing_tables, supabase_tables } = compareResult;
  
  if (missing_tables.length === 0) {
    log('success', '没有需要创建的表');
    return;
  }
  
  log('info', `开始创建 ${missing_tables.length} 张缺失的表...\n`);
  
  const aliyunClient = new Client(ALIYUN_CONFIG);
  
  try {
    await aliyunClient.connect();
    
    let successCount = 0;
    let failCount = 0;
    
    for (const tableName of missing_tables) {
      process.stdout.write(`  创建表: ${tableName}... `);
      
      try {
        const sql = generateCreateTableSQL(tableName, supabase_tables[tableName]);
        await aliyunClient.query(sql);
        console.log('✅');
        successCount++;
      } catch (err) {
        console.log('❌');
        log('error', `  创建表 ${tableName} 失败: ${err.message}`);
        failCount++;
      }
    }
    
    console.log('');
    log('success', `创建完成: ${successCount} 成功, ${failCount} 失败`);
    
  } finally {
    await aliyunClient.end();
  }
}

// ============== 步骤 3: 添加缺失的列 ==============
async function stepAddColumns() {
  console.log('\n' + '='.repeat(60));
  console.log('  步骤 3: 在阿里云添加缺失的列');
  console.log('='.repeat(60) + '\n');
  
  // 读取对比结果
  let compareResult;
  try {
    const data = fs.readFileSync(path.join(__dirname, '../data-exports/compare-result.json'), 'utf-8');
    compareResult = JSON.parse(data);
  } catch {
    log('error', '请先运行步骤1进行对比');
    return;
  }
  
  const { missing_columns } = compareResult;
  
  if (missing_columns.length === 0) {
    log('success', '没有需要添加的列');
    return;
  }
  
  log('info', `开始添加 ${missing_columns.length} 个缺失的列...\n`);
  
  const aliyunClient = new Client(ALIYUN_CONFIG);
  
  try {
    await aliyunClient.connect();
    
    let successCount = 0;
    let failCount = 0;
    
    for (const { table, column, info } of missing_columns) {
      process.stdout.write(`  ${table}.${column}... `);
      
      try {
        const sql = generateAddColumnSQL(table, info);
        await aliyunClient.query(sql);
        console.log('✅');
        successCount++;
      } catch (err) {
        console.log('❌');
        log('error', `  添加列 ${table}.${column} 失败: ${err.message}`);
        failCount++;
      }
    }
    
    console.log('');
    log('success', `添加完成: ${successCount} 成功, ${failCount} 失败`);
    
  } finally {
    await aliyunClient.end();
  }
}

// ============== 步骤 4: 导入数据 ==============
async function stepImport() {
  console.log('\n' + '='.repeat(60));
  console.log('  步骤 4: 从 JSON 导入数据到阿里云');
  console.log('='.repeat(60) + '\n');
  
  // 读取导出文件
  let exportData;
  try {
    log('info', '读取导出文件...');
    const rawData = fs.readFileSync(EXPORT_FILE, 'utf-8');
    exportData = JSON.parse(rawData);
    log('success', `找到 ${Object.keys(exportData.tables).length} 张表的数据`);
  } catch (err) {
    log('error', `无法读取导出文件: ${err.message}`);
    return;
  }
  
  const aliyunClient = new Client(ALIYUN_CONFIG);
  
  try {
    await aliyunClient.connect();
    log('success', '已连接到阿里云 PolarDB\n');
    
    const tables = Object.keys(exportData.tables);
    let totalImported = 0;
    let totalErrors = 0;
    let skippedTables = 0;
    
    for (const tableName of tables) {
      const rows = exportData.tables[tableName];
      
      if (!rows || rows.length === 0) continue;
      
      // 检查表是否存在
      const tableCheck = await aliyunClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        ) as exists
      `, [tableName]);
      
      if (!tableCheck.rows[0].exists) {
        log('warn', `  表 ${tableName} 不存在，跳过`);
        skippedTables++;
        continue;
      }
      
      process.stdout.write(`  导入 ${tableName}: ${rows.length} 行... `);
      
      const columns = Object.keys(rows[0]);
      const columnList = columns.map(c => `"${c}"`).join(', ');
      
      let tableSuccess = 0;
      let tableErrors = 0;
      
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
        
        const query = `INSERT INTO "${tableName}" (${columnList}) VALUES ${values} ON CONFLICT DO NOTHING`;
        
        try {
          await aliyunClient.query(query, params);
          tableSuccess += batch.length;
        } catch (err) {
          tableErrors += batch.length;
        }
      }
      
      if (tableErrors > 0) {
        console.log(`⚠️ (${tableErrors} 错误)`);
        totalErrors += tableErrors;
      } else {
        console.log('✅');
      }
      
      totalImported += tableSuccess;
    }
    
    console.log('');
    log('success', `导入完成: ${totalImported} 行成功`);
    if (totalErrors > 0) log('warn', `导入错误: ${totalErrors} 行`);
    if (skippedTables > 0) log('warn', `跳过表: ${skippedTables} 张`);
    
    // 验证
    console.log('\n验证数据...');
    let verifyTotal = 0;
    const verifyResult = await aliyunClient.query(`
      SELECT table_name, (xpath('/row/cnt/text()', xml_count))[1]::text::int as count
      FROM (
        SELECT table_name, query_to_xml(format('SELECT COUNT(*) as cnt FROM %I', table_name), false, true, '') as xml_count
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ) t
    `);
    
    for (const row of verifyResult.rows) {
      verifyTotal += row.count;
    }
    log('success', `阿里云数据库总计: ${verifyTotal} 行数据`);
    
  } finally {
    await aliyunClient.end();
  }
}

// ============== 主函数 ==============
async function main() {
  const command = process.argv[2] || 'compare';
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     数据库同步工具 - Supabase → 阿里云 PolarDB          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  switch (command) {
    case 'compare':
      await stepCompare();
      break;
    case 'create-tables':
      await stepCreateTables();
      break;
    case 'add-columns':
      await stepAddColumns();
      break;
    case 'import':
      await stepImport();
      break;
    case 'all':
      console.log('\n执行完整同步流程...\n');
      await stepCompare();
      console.log('\n' + '-'.repeat(60) + '\n');
      await stepCreateTables();
      console.log('\n' + '-'.repeat(60) + '\n');
      await stepAddColumns();
      console.log('\n' + '-'.repeat(60) + '\n');
      await stepImport();
      console.log('\n' + '='.repeat(60));
      log('success', '完整同步流程执行完毕!');
      console.log('='.repeat(60));
      break;
    default:
      console.log(`
用法: node sync-steps.cjs <命令>

命令:
  compare      - 对比两个数据库的表结构
  create-tables - 创建缺失的表
  add-columns  - 添加缺失的列  
  import       - 导入数据
  all          - 执行全部步骤

示例:
  node sync-steps.cjs compare
  node sync-steps.cjs all
`);
  }
}

main().catch(console.error);
