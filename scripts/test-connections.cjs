/**
 * Database Connection Test Script
 * 
 * Tests connection to Supabase and Aliyun PolarDB
 */

const { Client } = require('pg');

// ============================================
// Supabase Connection Test
// ============================================

async function testSupabase() {
  console.log('\n--- Testing Supabase Connection ---\n');
  
  const configs = [
    {
      name: 'Direct Connection (PgBouncer port 6543)',
      host: 'db.kqtpdsgwkvzinonkprcl.supabase.co',
      port: 6543,
      database: 'postgres',
      user: 'postgres',
      password: 'Wxwzcfwhf205',
    },
    {
      name: 'Standard PostgreSQL Port 5432',
      host: 'db.kqtpdsgwkvzinonkprcl.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'Wxwzcfwhf205',
    },
  ];

  let success = false;

  for (const config of configs) {
    console.log(`Trying: ${config.name}`);
    console.log(`  Host: ${config.host}:${config.port}`);

    let client;
    try {
      client = new Client({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000,
        statement_timeout: 60000,
      });

      await client.connect();
      console.log('SUCCESS!\n');

      console.log('Testing query...');
      const versionResult = await client.query('SELECT version()');
      console.log(`DB Version: ${versionResult.rows[0].version.split(',')[0]}`);

      console.log('\nGetting table list...');
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);

      console.log(`\nFound ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });

      console.log('\nTable row counts (first 10):');
      let count = 0;
      for (const row of tablesResult.rows) {
        if (count >= 10) {
          console.log(`  ... and ${tablesResult.rows.length - 10} more tables`);
          break;
        }
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
          console.log(`  ${row.table_name}: ${countResult.rows[0].count} rows`);
        } catch (e) {
          console.log(`  ${row.table_name}: error getting count`);
        }
        count++;
      }

      console.log('\nSupabase connection test COMPLETE!');
      success = true;
      
    } catch (error) {
      console.error(`FAILED: ${error.message}`);
      console.log('');
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (e) {}
      }
    }
  }

  if (!success) {
    console.error('\nAll connection attempts failed.');
    console.error('Try using Supabase CLI instead:');
    console.error('  npm install -g supabase');
    console.error('  supabase login');
    console.error('  supabase link --project-ref kqtpdsgwkvzinonkprcl');
    console.error('  supabase db dump -f backup.sql');
  }
  
  return success;
}

// ============================================
// Aliyun PolarDB Connection Test
// ============================================

async function testAliyun() {
  console.log('\n--- Testing Aliyun PolarDB Connection ---\n');
  
  const config = {
    host: process.env.ALIYUN_HOST || 'localhost',
    port: parseInt(process.env.ALIYUN_PORT || '5432'),
    database: process.env.ALIYUN_DB || 'lvzhi',
    user: process.env.ALIYUN_USER || 'lvzhi',
    password: process.env.ALIYUN_PASSWORD || '',
  };

  console.log('Config:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Password: ${config.password ? '******' : 'NOT SET'}`);
  console.log('');

  if (!config.password) {
    console.error('ERROR: ALIYUN_PASSWORD not set');
    console.log('\nSet it with:');
    console.log('  export ALIYUN_PASSWORD=your_password');
    console.log('');
    return false;
  }

  let client;
  try {
    client = new Client({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000,
    });

    console.log('Connecting...');
    await client.connect();
    console.log('SUCCESS!\n');

    console.log('Testing query...');
    const versionResult = await client.query('SELECT version()');
    console.log(`DB Version: ${versionResult.rows[0].version.split(',')[0]}`);

    console.log('\nGetting table list...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`\nFound ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\nTable row counts:');
    for (const row of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
        console.log(`  ${row.table_name}: ${countResult.rows[0].count} rows`);
      } catch (e) {
        console.log(`  ${row.table_name}: error getting count`);
      }
    }

    console.log('\nAliyun PolarDB connection test COMPLETE!');
    return true;
    
  } catch (error) {
    console.error('FAILED:', error.message);
    return false;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('============================================');
  console.log('  Lvzhi - Database Connection Test');
  console.log('============================================');
  console.log('');

  const supabaseOk = await testSupabase();
  const aliyunOk = await testAliyun();

  console.log('\n============================================');
  console.log('  Summary');
  console.log('============================================');
  console.log(`Supabase: ${supabaseOk ? 'OK' : 'FAILED'}`);
  console.log(`Aliyun: ${aliyunOk ? 'OK' : 'FAILED'}`);
  console.log('');

  if (supabaseOk && aliyunOk) {
    console.log('Ready for data migration!');
  }
}

main().catch(console.error);
