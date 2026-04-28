/**
 * Export ALL data from Supabase using direct PostgreSQL connection
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

// ============================================
// Main
// ============================================

async function main() {
  console.log('============================================');
  console.log('  Lvzhi - Export ALL Data from Supabase');
  console.log('============================================');
  console.log('');

  const client = new Client(SUPABASE_CONFIG);
  
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected!\n');

    // Get all tables
    console.log('Getting table list...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables\n`);

    // Create export directory
    const exportDir = path.join(__dirname, '..', 'data-exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFile = path.join(exportDir, `supabase-export-full-${timestamp}.json`);

    const exportData = {
      exported_at: new Date().toISOString(),
      supabase_url: 'db.kqtpdsgwkvzinonkprcl.supabase.co',
      total_tables: tables.length,
      tables: {},
    };

    let totalRows = 0;
    let emptyTables = 0;
    let nonEmptyTables = [];

    for (const table of tables) {
      try {
        process.stdout.write(`Exporting: ${table.padEnd(40)}`);
        const result = await client.query(`SELECT * FROM "${table}"`);
        exportData.tables[table] = result.rows;
        const count = result.rows.length;
        totalRows += count;
        
        if (count > 0) {
          nonEmptyTables.push({ table, count });
          console.log(` ${count} rows`);
        } else {
          emptyTables++;
          console.log(' 0 rows');
        }
      } catch (error) {
        console.error(`ERROR: ${error.message}`);
        exportData.tables[table] = [];
      }
    }

    // Write to file
    console.log('\nWriting to file...');
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2), 'utf-8');

    const stats = fs.statSync(exportFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('');
    console.log('============================================');
    console.log('  Export Complete!');
    console.log('============================================');
    console.log(`File: ${exportFile}`);
    console.log(`Total tables: ${tables.length}`);
    console.log(`Non-empty tables: ${nonEmptyTables.length}`);
    console.log(`Empty tables: ${emptyTables}`);
    console.log(`Total rows: ${totalRows}`);
    console.log(`File size: ${sizeMB} MB`);
    console.log('');

    // Show non-empty tables
    if (nonEmptyTables.length > 0) {
      console.log('Non-empty tables:');
      for (const { table, count } of nonEmptyTables) {
        console.log(`  ${table}: ${count} rows`);
      }
    }

    // Show sample data
    if (nonEmptyTables.length > 0) {
      const firstNonEmpty = nonEmptyTables[0].table;
      console.log(`\nSample data from '${firstNonEmpty}':`);
      const sample = JSON.stringify(exportData.tables[firstNonEmpty][0], null, 2);
      console.log(sample.substring(0, 800) + (sample.length > 800 ? '...' : ''));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
