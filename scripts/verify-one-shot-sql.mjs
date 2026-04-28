import fs from 'node:fs/promises';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

process.env.LANG = 'en_US.UTF-8';
process.env.LC_ALL = 'en_US.UTF-8';
process.env.LC_CTYPE = 'en_US.UTF-8';
process.env.LC_MESSAGES = 'en_US.UTF-8';

const rootDir = '/Users/wanghongfei/Desktop/律植项目';
const dataDir = path.join(rootDir, '.tmp-embedded-postgres-one-shot');
const sqlPath = path.join(rootDir, 'supabase', 'migrations', '000_supabase_one_shot.sql');

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port: 54330,
  persistent: false,
});

const client = pg.getPgClient();

await fs.rm(dataDir, { recursive: true, force: true });
await fs.mkdir(dataDir, { recursive: true, mode: 0o700 });
await fs.chmod(dataDir, 0o700);

await pg.initialise();
await pg.start();
await client.connect();

try {
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

  const sql = await fs.readFile(sqlPath, 'utf8');
  await client.query(sql);
  console.log('one-shot sql ok');
} finally {
  await client.end().catch(() => {});
  await pg.stop().catch(() => {});
}
