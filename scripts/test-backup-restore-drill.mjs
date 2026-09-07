import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import pg from 'pg';

const { Pool } = pg;
const databaseUrl = String(process.env.DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const parsed = new URL(databaseUrl);
const sourceDb = parsed.pathname.slice(1);
if (!sourceDb) throw new Error('DATABASE_URL must include a database name');
const restoreDb = `${sourceDb}_restore_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, '_');
const marker = `backup-drill-${crypto.randomUUID()}`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'thc-backup-drill-'));
const dump = path.join(tmp, 'academy.dump');
const admin = new Pool({ connectionString: databaseUrl, ssl: false });

function dbUrl(name) {
  const url = new URL(databaseUrl);
  url.pathname = `/${name}`;
  return url.toString();
}

try {
  await admin.query('insert into academy_schema_migrations (version, description) values ($1, $2) on conflict (version) do update set description = excluded.description', [`backup-drill-${Date.now()}`, marker]);
  execFileSync('pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--file', dump, databaseUrl], { stdio: 'pipe' });
  assert.ok(fs.statSync(dump).size > 0, 'backup dump must not be empty');

  await admin.query(`create database ${restoreDb}`);
  execFileSync('pg_restore', ['--no-owner', '--no-acl', '--dbname', dbUrl(restoreDb), dump], { stdio: 'pipe' });
  const restored = new Pool({ connectionString: dbUrl(restoreDb), ssl: false });
  try {
    const result = await restored.query('select description from academy_schema_migrations where description = $1', [marker]);
    assert.equal(result.rowCount, 1, 'restored database must contain the known backup marker');
    const schema = await restored.query("select to_regclass('public.assessment_attempts') as attempts, to_regclass('public.learners') as learners");
    assert.equal(schema.rows[0].attempts, 'assessment_attempts');
    assert.equal(schema.rows[0].learners, 'learners');
  } finally {
    await restored.end();
  }
  console.log('Disposable PostgreSQL backup/restore drill passed; temporary dump was not persisted as an artifact.');
} finally {
  await admin.query(`select pg_terminate_backend(pid) from pg_stat_activity where datname = $1 and pid <> pg_backend_pid()`, [restoreDb]).catch(() => {});
  await admin.query(`drop database if exists ${restoreDb}`).catch(() => {});
  await admin.end();
  fs.rmSync(tmp, {recursive:true, force:true});
}
