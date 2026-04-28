/**
 * Compare table structures between Supabase and Aliyun
 */

const { Client } = require('pg');

// ============================================
// Config
// ============================================

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

// ============================================
// Get table columns
// ============================================

async function getTableColumns(client, schema = 'public') {
  const result = await client.query(`
    SELECT 
      c.table_name,
      c.column_name,
      c.data_type,
      c.character_maximum_length,
      c.numeric_precision,
      c.numeric_scale,
      c.is_nullable,
      c.column_default,
      c.column_name = (
        SELECT column_name 
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND kcu.table_name = c.table_name
          AND kcu.table_schema = c.table_schema
          AND kcu.column_name = c.column_name
      ) as is_primary_key
    FROM information_schema.columns c
    WHERE c.table_schema = $1
    ORDER BY c.table_name, c.ordinal_position
  `, [schema]);

  // Group by table
  const tables = {};
  for (const row of result.rows) {
    if (!tables[row.table_name]) {
      tables[row.table_name] = [];
    }
    tables[row.table_name].push({
      name: row.column_name,
      type: row.data_type,
      maxLength: row.character_maximum_length,
      precision: row.numeric_precision,
      scale: row.numeric_scale,
      nullable: row.is_nullable === 'YES',
      default: row.column_default,
      isPrimaryKey: row.is_primary_key,
    });
  }

  return tables;
}

// ============================================
// Get foreign keys
// ============================================

async function getForeignKeys(client, schema = 'public') {
  const result = await client.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = $1
  `, [schema]);

  return result.rows;
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('============================================');
  console.log('  Database Structure Comparison');
  console.log('============================================');
  console.log('');

  let supabaseClient, aliyunClient;

  try {
    // Connect to both databases
    console.log('Connecting to Supabase...');
    supabaseClient = new Client(SUPABASE_CONFIG);
    await supabaseClient.connect();
    console.log('Connected!\n');

    console.log('Connecting to Aliyun...');
    aliyunClient = new Client(ALIYUN_CONFIG);
    await aliyunClient.connect();
    console.log('Connected!\n');

    // Get table columns
    console.log('Fetching Supabase structure...');
    const supabaseTables = await getTableColumns(supabaseClient);
    console.log(`Found ${Object.keys(supabaseTables).length} tables\n`);

    console.log('Fetching Aliyun structure...');
    const aliyunTables = await getTableColumns(aliyunClient);
    console.log(`Found ${Object.keys(aliyunTables).length} tables\n`);

    // Get foreign keys
    console.log('Fetching foreign keys...');
    const supabaseFKs = await getForeignKeys(supabaseClient);
    const aliyunFKs = await getForeignKeys(aliyunClient);
    console.log('');

    // Compare
    const supabaseTableNames = new Set(Object.keys(supabaseTables));
    const aliyunTableNames = new Set(Object.keys(aliyunTables));

    // Tables only in Supabase
    const onlyInSupabase = [...supabaseTableNames].filter(t => !aliyunTableNames.has(t));

    // Tables only in Aliyun
    const onlyInAliyun = [...aliyunTableNames].filter(t => !supabaseTableNames.has(t));

    // Tables in both
    const inBoth = [...supabaseTableNames].filter(t => aliyunTableNames.has(t));

    console.log('============================================');
    console.log('  Comparison Results');
    console.log('============================================');
    console.log('');

    console.log(`Tables only in Supabase (${onlyInSupabase.length}):`);
    if (onlyInSupabase.length === 0) {
      console.log('  (none)');
    } else {
      onlyInSupabase.forEach(t => console.log(`  - ${t}`));
    }
    console.log('');

    console.log(`Tables only in Aliyun (${onlyInAliyun.length}):`);
    if (onlyInAliyun.length === 0) {
      console.log('  (none)');
    } else {
      onlyInAliyun.forEach(t => console.log(`  - ${t}`));
    }
    console.log('');

    console.log(`Tables in both databases (${inBoth.length}):`);
    console.log('');

    // Column differences
    const missingColumns = [];
    const extraColumns = [];
    const typeDifferences = [];

    for (const table of inBoth) {
      const supabaseCols = supabaseTables[table];
      const aliyunCols = aliyunTables[table];

      const supabaseColNames = new Set(supabaseCols.map(c => c.name));
      const aliyunColNames = new Set(aliyunCols.map(c => c.name));

      // Missing in Aliyun
      for (const col of supabaseCols) {
        if (!aliyunColNames.has(col.name)) {
          missingColumns.push({ table, column: col });
        }
      }

      // Extra in Aliyun
      for (const col of aliyunCols) {
        if (!supabaseColNames.has(col.name)) {
          extraColumns.push({ table, column: col });
        }
      }

      // Type differences for common columns
      const supabaseColMap = new Map(supabaseCols.map(c => [c.name, c]));
      const aliyunColMap = new Map(aliyunCols.map(c => [c.name, c]));

      for (const colName of supabaseColNames) {
        if (aliyunColNames.has(colName)) {
          const supaCol = supabaseColMap.get(colName);
          const aliCol = aliyunColMap.get(colName);
          
          if (supaCol.type !== aliCol.type || 
              supaCol.maxLength !== aliCol.maxLength ||
              supaCol.nullable !== aliCol.nullable) {
            typeDifferences.push({ table, column: colName, supabase: supaCol, aliyun: aliCol });
          }
        }
      }
    }

    if (missingColumns.length > 0) {
      console.log('============================================');
      console.log('  Missing Columns in Aliyun (need to add)');
      console.log('============================================');
      console.log('');
      
      const grouped = {};
      for (const { table, column } of missingColumns) {
        if (!grouped[table]) grouped[table] = [];
        grouped[table].push(column);
      }

      for (const [table, cols] of Object.entries(grouped)) {
        console.log(`Table: ${table}`);
        for (const col of cols) {
          let sql = `  ALTER TABLE "${table}" ADD COLUMN "${col.name}" ${col.type}`;
          if (col.maxLength) sql += `(${col.maxLength})`;
          if (!col.nullable) sql += ' NOT NULL';
          if (col.default) sql += ` DEFAULT ${col.default}`;
          console.log(sql + ';');
        }
        console.log('');
      }
    }

    if (extraColumns.length > 0) {
      console.log('============================================');
      console.log('  Extra Columns in Aliyun (not in Supabase)');
      console.log('============================================');
      console.log('');
      
      const grouped = {};
      for (const { table, column } of extraColumns) {
        if (!grouped[table]) grouped[table] = [];
        grouped[table].push(column);
      }

      for (const [table, cols] of Object.entries(grouped)) {
        console.log(`Table: ${table}:`);
        for (const col of cols) {
          console.log(`  - ${col.name} (${col.type})`);
        }
        console.log('');
      }
    }

    if (typeDifferences.length > 0) {
      console.log('============================================');
      console.log('  Type Differences');
      console.log('============================================');
      console.log('');
      
      const grouped = {};
      for (const diff of typeDifferences) {
        if (!grouped[diff.table]) grouped[diff.table] = [];
        grouped[diff.table].push(diff);
      }

      for (const [table, diffs] of Object.entries(grouped)) {
        console.log(`Table: ${table}`);
        for (const diff of diffs) {
          console.log(`  ${diff.column}:`);
          console.log(`    Supabase: ${diff.supabase.type}${diff.supabase.maxLength ? `(${diff.supabase.maxLength})` : ''} ${diff.supabase.nullable ? 'NULL' : 'NOT NULL'}`);
          console.log(`    Aliyun:   ${diff.aliyun.type}${diff.aliyun.maxLength ? `(${diff.aliyun.maxLength})` : ''} ${diff.aliyun.nullable ? 'NULL' : 'NOT NULL'}`);
        }
        console.log('');
      }
    }

    // Summary
    console.log('============================================');
    console.log('  Summary');
    console.log('============================================');
    console.log('');
    console.log(`Missing tables in Aliyun: ${onlyInSupabase.length}`);
    console.log(`Missing columns in Aliyun: ${missingColumns.length}`);
    console.log(`Extra tables in Aliyun: ${onlyInAliyun.length}`);
    console.log(`Extra columns in Aliyun: ${extraColumns.length}`);
    console.log(`Type differences: ${typeDifferences.length}`);
    console.log('');

    // Generate CREATE TABLE statements for missing tables
    if (onlyInSupabase.length > 0) {
      console.log('============================================');
      console.log('  CREATE TABLE Statements for Missing Tables');
      console.log('============================================');
      console.log('');

      for (const tableName of onlyInSupabase) {
        const cols = supabaseTables[tableName];
        console.log(`-- Table: ${tableName}`);
        console.log(`CREATE TABLE "${tableName}" (`);
        const colDefs = [];
        for (const col of cols) {
          let def = `  "${col.name}" ${col.type}`;
          if (col.maxLength) def += `(${col.maxLength})`;
          if (!col.nullable) def += ' NOT NULL';
          if (col.default) def += ` DEFAULT ${col.default}`;
          if (col.isPrimaryKey) def += ' PRIMARY KEY';
          colDefs.push(def);
        }

        // Add foreign keys
        const tableFKs = supabaseFKs.filter(fk => fk.table_name === tableName);
        for (const fk of tableFKs) {
          colDefs.push(`  FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}")`);
        }

        console.log(colDefs.join(',\n'));
        console.log(');');
        console.log('');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (supabaseClient) await supabaseClient.end();
    if (aliyunClient) await aliyunClient.end();
  }
}

main().catch(console.error);
