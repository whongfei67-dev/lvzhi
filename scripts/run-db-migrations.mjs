import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

process.env.LANG = 'en_US.UTF-8';
process.env.LC_ALL = 'en_US.UTF-8';
process.env.LC_CTYPE = 'en_US.UTF-8';
process.env.LC_MESSAGES = 'en_US.UTF-8';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const dataDir = process.env.LOCAL_PG_DATA_DIR || path.join(rootDir, '.tmp-embedded-postgres');
const migrationDir = path.join(rootDir, 'supabase', 'migrations');
const port = Number(process.env.LOCAL_PG_PORT || 54329);

const migrations = [
  '001_initial_schema.sql',
  '002_community.sql',
  '003_rename_role_lawyer_to_creator.sql',
  '004_products_and_orders.sql',
  '005_subscriptions.sql',
  '006_coupons.sql',
  '007_comments_and_likes.sql',
  '008_permissions.sql',
  '009_api_system.sql',
  '010_extensions_and_views.sql',
  '011_auth_system.sql',
  '012_firewall_system.sql',
  '013_data_management.sql',
  '014_antibot_system.sql',
  '015_download_upload_security.sql',
  '021_audit_profiles_trigger_fix.sql',
];

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port,
  persistent: false,
  onLog: (message) => {
    const text = String(message).trim();
    if (text) console.log(`[postgres] ${text}`);
  },
  onError: (message) => {
    const text = String(message).trim();
    if (text) console.error(`[postgres:error] ${text}`);
  },
});

async function ensureCluster() {
  await fs.rm(dataDir, { recursive: true, force: true });
  await fs.mkdir(dataDir, { recursive: true, mode: 0o700 });
  await fs.chmod(dataDir, 0o700);
  await pg.initialise();

  await pg.start();
}

async function prepareSupabaseCompat(client) {
  await client.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    );
    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS UUID
    LANGUAGE sql
    STABLE
    AS $$
      SELECT NULL::UUID;
    $$;
  `);
}

async function run() {
  await ensureCluster();
  const client = pg.getPgClient();

  try {
    await client.connect();
    await prepareSupabaseCompat(client);

    console.log(`Using local PostgreSQL data dir: ${dataDir}`);
    console.log(`Using local PostgreSQL port: ${port}`);

    for (const fileName of migrations) {
      const filePath = path.join(migrationDir, fileName);
      const sql = await fs.readFile(filePath, 'utf8');
      console.log(`\n==> Running ${fileName}`);

      try {
        await client.query(sql);
      } catch (error) {
        console.error(`\nMigration failed: ${fileName}`);
        console.error(error.message);
        throw error;
      }
    }

    console.log('\nAll migrations completed successfully.');
  } finally {
    await client.end().catch(() => {});
    await pg.stop().catch(() => {});
  }
}

run().catch((error) => {
  console.error('\nExecution aborted.');
  console.error(error);
  process.exitCode = 1;
});
