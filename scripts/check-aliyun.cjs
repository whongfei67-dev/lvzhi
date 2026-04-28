/**
 * Check database and create if needed
 */

const { Client } = require('pg');

async function main() {
  console.log('Connecting to Aliyun PolarDB...');
  console.log('');

  // Try to connect to postgres database first to list databases
  const client = new Client({
    host: 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
    port: 5432,
    database: 'postgres',
    user: 'mamba_01',
    password: 'Wxwzcfwhf205',
    ssl: false,
    connectionTimeoutMillis: 30000,
  });

  try {
    await client.connect();
    console.log('Connected!\n');

    // List databases
    const dbResult = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('Available databases:');
    dbResult.rows.forEach(r => console.log('  -', r.datname));
    console.log('');

    // List tables in lvzhi if it exists
    const hasLvzhi = dbResult.rows.some(r => r.datname === 'lvzhi');
    if (hasLvzhi) {
      console.log('Checking lvzhi database tables...');
      
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log(`\nFound ${tablesResult.rows.length} tables in lvzhi:`);
      tablesResult.rows.forEach(r => console.log('  -', r.table_name));
    } else {
      console.log('Database "lvzhi" does not exist.');
      console.log('');
      console.log('Options:');
      console.log('  1. Create lvzhi database');
      console.log('  2. Use a different existing database');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
