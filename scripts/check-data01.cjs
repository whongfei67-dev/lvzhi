/**
 * Check data01 database tables
 */

const { Client } = require('pg');

async function main() {
  console.log('Connecting to Aliyun PolarDB data01 database...');
  console.log('');

  const client = new Client({
    host: 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
    port: 5432,
    database: 'data01',
    user: 'mamba_01',
    password: 'Wxwzcfwhf205',
    ssl: false,
    connectionTimeoutMillis: 30000,
  });

  try {
    await client.connect();
    console.log('Connected!\n');

    // Get table list
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(r => console.log('  -', r.table_name));
    
    console.log('');
    
    // Get row counts for each table
    console.log('Table row counts:');
    let totalRows = 0;
    for (const row of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
        const count = parseInt(countResult.rows[0].count);
        totalRows += count;
        if (count > 0) {
          console.log(`  ${row.table_name}: ${count} rows`);
        }
      } catch (e) {
        console.log(`  ${row.table_name}: error`);
      }
    }
    
    console.log(`\nTotal rows with data: ${totalRows}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
