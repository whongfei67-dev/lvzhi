/**
 * Aliyun PolarDB Migration Script
 * 
 * 1. Analyze exported JSON structure
 * 2. Connect to Aliyun PolarDB
 * 3. Create missing tables with proper schema
 * 4. Import data from JSON
 * 
 * Usage: node scripts/migrate-to-aliyun.cjs
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ============== CONFIG ==============
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

// ============== TYPE INFERENCE ==============
function inferColumnType(value) {
  if (value === null || value === undefined) {
    return 'TEXT';
  }
  
  const type = typeof value;
  
  if (type === 'boolean') return 'BOOLEAN';
  if (type === 'number') {
    return Number.isInteger(value) ? 'BIGINT' : 'DOUBLE PRECISION';
  }
  if (type === 'string') {
    // Check for UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return 'UUID';
    }
    // Check for timestamp
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return 'TIMESTAMPTZ';
    }
    // Check for date
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return 'DATE';
    }
    // Check for time
    if (/^\d{2}:\d{2}:\d{2}/.test(value)) {
      return 'TIME';
    }
    // Check for JSON
    if (value.startsWith('[') || value.startsWith('{')) {
      try {
        JSON.parse(value);
        return 'JSONB';
      } catch {}
    }
    // Default to TEXT
    return 'TEXT';
  }
  
  if (Array.isArray(value)) return 'JSONB';
  if (type === 'object') return 'JSONB';
  
  return 'TEXT';
}

function inferAllColumns(rows) {
  if (!rows || rows.length === 0) return {};
  
  const columns = {};
  
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (!columns[key]) {
        columns[key] = {
          type: inferColumnType(value),
          nullable: true,
          hasNull: value === null
        };
      } else if (value === null) {
        columns[key].hasNull = true;
      } else {
        // Upgrade type if needed
        const newType = inferColumnType(value);
        if (shouldUpgradeType(columns[key].type, newType)) {
          columns[key].type = newType;
        }
      }
    }
  }
  
  return columns;
}

function shouldUpgradeType(current, needed) {
  const order = ['BOOLEAN', 'BIGINT', 'DOUBLE PRECISION', 'TEXT', 'TIMESTAMPTZ', 'UUID', 'JSONB'];
  return order.indexOf(needed) > order.indexOf(current);
}

// ============== SQL GENERATION ==============
function generateCreateTableSQL(tableName, columns, primaryKeys = ['id']) {
  const lines = [];
  lines.push(`CREATE TABLE IF NOT EXISTS "${tableName}" (`);
  
  const colDefs = [];
  for (const [name, info] of Object.entries(columns)) {
    let def = `  "${name}" ${info.type}`;
    if (!info.nullable) def += ' NOT NULL';
    if (primaryKeys.includes(name) && info.type === 'UUID') {
      def += ' DEFAULT gen_random_uuid()';
    }
    colDefs.push(def);
  }
  
  // Add primary key constraint
  const pkCols = primaryKeys.filter(pk => columns[pk]);
  if (pkCols.length > 0) {
    colDefs.push(`  PRIMARY KEY (${pkCols.map(c => `"${c}"`).join(', ')})`);
  }
  
  lines.push(colDefs.join(',\n'));
  lines.push(');');
  
  return lines.join('\n');
}

function generateInsertSQL(tableName, rows) {
  if (!rows || rows.length === 0) return [];
  
  const sqlStatements = [];
  const columns = Object.keys(rows[0]);
  const columnList = columns.map(c => `"${c}"`).join(', ');
  
  for (const row of rows) {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null) return 'NULL';
      if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'string') {
        // Check for JSON
        if (value.startsWith('[') || value.startsWith('{')) {
          try {
            JSON.parse(value);
            return `'${value.replace(/'/g, "''")}'::jsonb`;
          } catch {}
        }
        return `'${value.replace(/'/g, "''")}'`;
      }
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }).join(', ');
    
    sqlStatements.push(`INSERT INTO "${tableName}" (${columnList}) VALUES (${values});`);
  }
  
  return sqlStatements;
}

// ============== MAIN ==============
async function main() {
  console.log('='.repeat(60));
  console.log('Aliyun PolarDB Migration Script');
  console.log('='.repeat(60));
  console.log('');
  
  // Load export data
  console.log('1. Loading export data...');
  let exportData;
  try {
    const rawData = fs.readFileSync(EXPORT_FILE, 'utf8');
    exportData = JSON.parse(rawData);
  } catch (err) {
    console.error('Failed to load export file:', err.message);
    process.exit(1);
  }
  
  const tables = Object.keys(exportData.tables);
  console.log(`   Found ${tables.length} tables in export file`);
  console.log('');
  
  // Connect to Aliyun
  console.log('2. Connecting to Aliyun PolarDB...');
  const client = new Client(ALIYUN_CONFIG);
  
  try {
    await client.connect();
    console.log('   Connected successfully!');
    console.log('');
  } catch (err) {
    console.error('   Failed to connect:', err.message);
    process.exit(1);
  }
  
  // Get existing tables
  console.log('3. Checking existing tables in Aliyun...');
  const existingResult = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  const existingTables = new Set(existingResult.rows.map(r => r.table_name));
  console.log(`   Found ${existingTables.size} existing tables`);
  console.log('');
  
  // Find missing tables
  const missingTables = tables.filter(t => !existingTables.has(t));
  const existingWithData = tables.filter(t => existingTables.has(t));
  
  console.log(`4. Missing tables (${missingTables.length}):`);
  if (missingTables.length > 0) {
    missingTables.forEach(t => console.log(`   - ${t}`));
  } else {
    console.log('   (none - all tables already exist)');
  }
  console.log('');
  
  console.log(`5. Existing tables (${existingWithData.length}):`);
  existingWithData.forEach(t => console.log(`   - ${t}`));
  console.log('');
  
  // Generate SQL for missing tables
  if (missingTables.length > 0) {
    console.log('6. Generating CREATE TABLE statements...');
    
    let createSQL = '-- Auto-generated migration SQL\n';
    createSQL += `-- Generated at: ${new Date().toISOString()}\n`;
    createSQL += '-- Tables: ' + missingTables.join(', ') + '\n\n';
    
    for (const tableName of missingTables) {
      const rows = exportData.tables[tableName];
      const columns = inferAllColumns(rows);
      
      if (Object.keys(columns).length === 0) {
        console.log(`   ${tableName}: No data, creating minimal table with id (UUID)`);
        createSQL += `-- Table: ${tableName} (empty table)\n`;
        createSQL += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
        createSQL += '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n';
        createSQL += '  created_at TIMESTAMPTZ DEFAULT NOW()\n';
        createSQL += ');\n\n';
      } else {
        console.log(`   ${tableName}: ${Object.keys(columns).length} columns, ${rows.length} rows`);
        createSQL += `-- Table: ${tableName} (${Object.keys(columns).length} columns, ${rows.length} rows)\n`;
        createSQL += generateCreateTableSQL(tableName, columns);
        createSQL += '\n\n';
      }
    }
    
    // Save SQL
    const outputPath = path.join(__dirname, '../data-exports/migration_create_tables.sql');
    fs.writeFileSync(outputPath, createSQL);
    console.log(`   SQL saved to: ${outputPath}`);
    console.log('');
    
    // Execute CREATE TABLE
    console.log('7. Executing CREATE TABLE statements...');
    try {
      await client.query(createSQL);
      console.log('   Tables created successfully!');
    } catch (err) {
      console.error('   Error creating tables:', err.message);
      console.log('   Continuing with data import...');
    }
    console.log('');
  }
  
  // Generate INSERT statements
  console.log('8. Generating INSERT statements...');
  let insertSQL = '-- Auto-generated INSERT statements\n';
  insertSQL += `-- Generated at: ${new Date().toISOString()}\n\n`;
  
  let totalRows = 0;
  for (const tableName of tables) {
    const rows = exportData.tables[tableName];
    if (rows && rows.length > 0) {
      const statements = generateInsertSQL(tableName, rows);
      insertSQL += `-- ${tableName}: ${rows.length} rows\n`;
      insertSQL += statements.join('\n');
      insertSQL += '\n\n';
      totalRows += rows.length;
    }
  }
  
  const insertPath = path.join(__dirname, '../data-exports/migration_insert_data.sql');
  fs.writeFileSync(insertPath, insertSQL);
  console.log(`   INSERT SQL saved to: ${insertPath}`);
  console.log(`   Total rows to insert: ${totalRows}`);
  console.log('');
  
  // Execute INSERT in batches
  console.log('9. Importing data...');
  const results = { success: 0, failed: 0, errors: [] };
  
  for (const tableName of tables) {
    const rows = exportData.tables[tableName];
    if (!rows || rows.length === 0) continue;
    
    const columns = Object.keys(rows[0]);
    const columnList = columns.map(c => `"${c}"`).join(', ');
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const values = columns.map(col => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'string') {
          // Check for JSON
          if ((value.startsWith('[') || value.startsWith('{')) && value.includes(':')) {
            try {
              JSON.parse(value);
              return `'${value.replace(/'/g, "''")}'::jsonb`;
            } catch {}
          }
          return `'${value.replace(/'/g, "''")}'`;
        }
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      }).join(', ');
      
      const sql = `INSERT INTO "${tableName}" (${columnList}) VALUES (${values})`;
      
      try {
        await client.query(sql);
        results.success++;
      } catch (err) {
        results.failed++;
        if (results.errors.length < 10) {
          results.errors.push(`${tableName}[${i}]: ${err.message.substring(0, 100)}`);
        }
      }
    }
    
    process.stdout.write(`   ${tableName}: ${rows.length} rows imported\r`);
  }
  
  console.log('');
  console.log('');
  console.log('10. Import Results:');
  console.log(`    Success: ${results.success}`);
  console.log(`    Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('');
    console.log('Errors:');
    results.errors.forEach(e => console.log(`    - ${e}`));
  }
  console.log('');
  
  // Verify
  console.log('11. Verification:');
  const verifyResult = await client.query(`
    SELECT table_name, (xpath('/row/cnt/text()', xml_count))[1]::text as count
    FROM (
      SELECT table_name, query_to_xml(format('SELECT COUNT(*) as cnt FROM %I', table_name), false, true, '') as xml_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = ANY($1)
    ) t
  `, [tables]);
  
  let totalImported = 0;
  for (const row of verifyResult.rows) {
    const count = parseInt(row.count);
    totalImported += count;
    console.log(`    ${row.table_name}: ${count} rows`);
  }
  console.log(`    Total: ${totalImported} rows in database`);
  console.log('');
  
  // Close connection
  await client.end();
  
  console.log('='.repeat(60));
  console.log('Migration completed!');
  console.log('='.repeat(60));
  console.log('');
  console.log('Next steps:');
  console.log('1. Review the generated SQL files in data-exports/');
  console.log('2. Run verify script to check data integrity');
  console.log('3. Update application to use new database');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
