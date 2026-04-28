/**
 * Export data from Supabase to local JSON files
 * Uses REST API to avoid pg_dump connection issues
 */

const https = require('https');

// ============================================
// Config
// ============================================

const SUPABASE_URL = 'https://kqtpdsgwkvzinonkprcl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdHBkc2d3a3Z6aW5vbqtybCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NDEwMzg5MDYsImV4cCI6MjA1NjYxNDkwNn0.W3J-j3xJ8Vb9Y4V3E2M9T3cXy8Y2M9Z5X1K9B8C7A0'; // anon key should work

const TABLES = [
  'profiles',
  'agents',
  'agent_demos',
  'agent_favorites',
  'agent_ratings',
  'api_call_logs',
  'api_credentials',
  'api_usage_stats',
  'applications',
  'balance_transactions',
  'comments',
  'community_posts',
  'coupon_usages',
  'coupons',
  'jobs',
  'lawyer_profiles',
  'likes',
  'login_history',
  'oauth_connections',
  'orders',
  'products',
  'promo_orders',
  'recruiter_profiles',
  'seeker_profiles',
  'student_verifications',
  'subscription_history',
  'subscriptions',
  'top_creators',
  'trending_agents',
  'user_balances',
  'user_coupons',
  'user_download_quotas',
  'user_follows',
  'user_permissions',
  'user_sessions',
  'user_stats',
];

const fs = require('fs');
const path = require('path');

// ============================================
// Supabase REST API helper
// ============================================

async function fetchFromSupabase(tableName, offset = 0, limit = 1000) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${tableName}`);
    url.searchParams.append('select', '*');
    url.searchParams.append('offset', offset.toString());
    url.searchParams.append('limit', limit.toString());
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function fetchAllFromTable(tableName) {
  console.log(`Exporting: ${tableName}`);
  let allRows = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    try {
      const rows = await fetchFromSupabase(tableName, offset, limit);
      if (!Array.isArray(rows) || rows.length === 0) break;
      allRows = allRows.concat(rows);
      if (rows.length < limit) break;
      offset += limit;
    } catch (error) {
      console.error(`  Error at offset ${offset}: ${error.message}`);
      break;
    }
  }

  console.log(`  -> ${allRows.length} rows`);
  return allRows;
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('============================================');
  console.log('  Lvzhi - Export Data from Supabase');
  console.log('============================================');
  console.log('');

  const exportDir = path.join(__dirname, '..', 'data-exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportFile = path.join(exportDir, `supabase-export-${timestamp}.json`);

  const exportData = {
    exported_at: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    tables: {},
  };

  let totalRows = 0;

  for (const table of TABLES) {
    try {
      const rows = await fetchAllFromTable(table);
      exportData.tables[table] = rows;
      totalRows += rows.length;
    } catch (error) {
      console.error(`  Failed: ${error.message}`);
    }
  }

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
}

main().catch(console.error);
