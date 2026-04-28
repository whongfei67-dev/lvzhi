/**
 * Import data to Aliyun PolarDB
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ============================================
// Config
// ============================================

const ALIYUN_CONFIG = {
  host: process.env.ALIYUN_HOST || 'localhost',
  port: parseInt(process.env.ALIYUN_PORT || '5432'),
  database: process.env.ALIYUN_DB || 'lvzhi',
  user: process.env.ALIYUN_USER || 'lvzhi',
  password: process.env.ALIYUN_PASSWORD || '',
  ssl: false, // PolarDB does not support SSL
  connectionTimeoutMillis: 30000,
};

const BATCH_SIZE = 500;

// ============================================
// Main
// ============================================

async function main() {
  console.log('============================================');
  console.log('  Lvzhi - Import Data to Aliyun PolarDB');
  console.log('============================================');
  console.log('');

  // Check password
  if (!ALIYUN_CONFIG.password) {
    console.error('ERROR: ALIYUN_PASSWORD environment variable not set');
    console.log('\nSet it with:');
    console.log('  export ALIYUN_PASSWORD=your_password');
    console.log('');
    console.log('Or provide the Aliyun connection info:');
    console.log('  1. Go to Aliyun RDS Console');
    console.log('  2. Find your PolarDB instance');
    console.log('  3. Get the public connection address');
    console.log('  4. Set ALIYUN_HOST and ALIYUN_PASSWORD');
    console.log('');
    return;
  }

  console.log('Config:');
  console.log(`  Host: ${ALIYUN_CONFIG.host}`);
  console.log(`  Port: ${ALIYUN_CONFIG.port}`);
  console.log(`  Database: ${ALIYUN_CONFIG.database}`);
  console.log(`  User: ${ALIYUN_CONFIG.user}`);
  console.log('');

  // Find the export file
  const exportDir = path.join(__dirname, '..', 'data-exports');
  const files = fs.readdirSync(exportDir)
    .filter(f => f.startsWith('supabase-export-full-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('ERROR: No export file found');
    console.log('Run export first: node scripts/export-all-tables.cjs');
    return;
  }

  const exportFile = path.join(exportDir, files[0]);
  console.log(`Using export file: ${files[0]}\n`);

  // Read export data
  console.log('Reading export file...');
  const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf-8'));
  const tables = Object.keys(exportData.tables);
  console.log(`Found ${tables.length} tables in export file\n`);

  // Show non-empty tables
  const nonEmptyTables = tables.filter(t => exportData.tables[t].length > 0);
  console.log(`Tables with data: ${nonEmptyTables.length}`);
  for (const table of nonEmptyTables) {
    console.log(`  ${table}: ${exportData.tables[table].length} rows`);
  }
  console.log('');

  // Connect to Aliyun
  const client = new Client(ALIYUN_CONFIG);

  try {
    console.log('Connecting to Aliyun PolarDB...');
    await client.connect();
    console.log('Connected!\n');

    // Import each table
    let totalImported = 0;
    let totalErrors = 0;

    for (const table of tables) {
      const rows = exportData.tables[table];
      
      if (rows.length === 0) {
        console.log(`Skipping: ${table} (empty)`);
        continue;
      }

      console.log(`Importing: ${table} (${rows.length} rows)`);

      try {
        // Check if table exists
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          ) as exists
        `, [table]);

        if (!tableCheck.rows[0].exists) {
          console.log(`  WARNING: Table '${table}' does not exist, skipping`);
          continue;
        }

        // Get column names from first row
        const columns = Object.keys(rows[0]);
        
        // Batch insert
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          
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
            INSERT INTO "${table}" (${columns.join(', ')})
            VALUES ${values}
            ON CONFLICT DO NOTHING
          `;

          await client.query(query, params);
        }

        console.log(`  SUCCESS: ${rows.length} rows imported`);
        totalImported += rows.length;

      } catch (error) {
        console.error(`  ERROR: ${error.message}`);
        totalErrors++;
      }
    }

    // Run ANALYZE
    console.log('\nRunning ANALYZE...');
    await client.query('ANALYZE');

    console.log('');
    console.log('============================================');
    console.log('  Import Complete!');
    console.log('============================================');
    console.log(`Total rows imported: ${totalImported}`);
    console.log(`Tables with errors: ${totalErrors}`);
    console.log('');

  } catch (error) {
    console.error('Connection failed:', error.message);
    console.error('\nMake sure:');
    console.error('  1. ALIYUN_HOST is correct');
    console.error('  2. Public access is enabled');
    console.error('  3. Current IP is in whitelist');
    console.error('  4. Database exists');
  } finally {
    await client.end();
  }
}

main().catch(console.error);
