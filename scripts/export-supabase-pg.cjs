/**
 * Export data from Supabase using direct PostgreSQL connection
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

// Tables to export (in order to avoid FK constraints)
const TABLES = [
  // Base tables
  'profiles',
  'agents',
  'agent_demos',
  'agent_favorites',
  'agent_ratings',
  
  // API related
  'api_credentials',
  'api_call_logs',
  'api_usage_stats',
  
  // Products & Subscriptions
  'products',
  'subscriptions',
  'subscription_history',
  'coupons',
  'coupon_usages',
  'user_coupons',
  
  // Orders & Balance
  'orders',
  'balance_transactions',
  'user_balances',
  
  // Community
  'community_posts',
  'comments',
  'likes',
  
  // Jobs
  'jobs',
  'applications',
  
  // User profiles
  'lawyer_profiles',
  'seeker_profiles',
  'recruiter_profiles',
  'student_verifications',
  
  // Security
  'login_history',
  'oauth_connections',
  'user_sessions',
  'user_permissions',
  'user_stats',
  'user_follows',
  'user_download_quotas',
  
  // Top lists
  'top_creators',
  'trending_agents',
  'promo_orders',
];

// ============================================
// Main
// ============================================

async function main() {
  console.log('============================================');
  console.log('  Lvzhi - Export Data from Supabase (PG)');
  console.log('============================================');
  console.log('');

  const client = new Client(SUPABASE_CONFIG);
  
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected!\n');

    // Create export directory
    const exportDir = path.join(__dirname, '..', 'data-exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFile = path.join(exportDir, `supabase-export-${timestamp}.json`);

    const exportData = {
      exported_at: new Date().toISOString(),
      supabase_url: 'db.kqtpdsgwkvzinonkprcl.supabase.co',
      tables: {},
    };

    let totalRows = 0;

    for (const table of TABLES) {
      try {
        console.log(`Exporting: ${table}`);
        const result = await client.query(`SELECT * FROM "${table}"`);
        exportData.tables[table] = result.rows;
        console.log(`  -> ${result.rows.length} rows`);
        totalRows += result.rows.length;
      } catch (error) {
        console.error(`  ERROR: ${error.message}`);
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
    console.log(`Total rows: ${totalRows}`);
    console.log(`File size: ${sizeMB} MB`);
    console.log('');

    // Show sample data
    const firstTable = Object.keys(exportData.tables)[0];
    if (firstTable && exportData.tables[firstTable].length > 0) {
      console.log('Sample data from first non-empty table:');
      console.log(JSON.stringify(exportData.tables[firstTable][0], null, 2).substring(0, 500) + '...');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
