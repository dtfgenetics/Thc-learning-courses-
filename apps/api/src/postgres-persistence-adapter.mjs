import { Pool } from 'pg';
import { createPostgresCredentialStore } from './postgres-credential-store.mjs';
import { createPostgresCredentialWriter } from './postgres-credential-writer.mjs';
import { createPostgresLearnerStore } from './postgres-learner-store.mjs';

function requiredDatabaseUrl(env) {
  const value = String(env.THC_DATABASE_URL ?? env.DATABASE_URL ?? '').trim();
  if (!value) throw new Error('Production persistence requires THC_DATABASE_URL or DATABASE_URL');
  return value;
}

function positiveInteger(value, fallback, name) {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function sslConfiguration(env) {
  const mode = String(env.THC_DATABASE_SSL ?? 'require').trim().toLowerCase();
  if (['disable', 'false', 'off', '0'].includes(mode)) return false;
  if (['verify-full', 'verify', 'strict'].includes(mode)) return { rejectUnauthorized: true };
  if (['require', 'true', 'on', '1'].includes(mode)) return { rejectUnauthorized: false };
  throw new Error('THC_DATABASE_SSL must be disable, require, or verify-full');
}

export function postgresPoolOptions(env = process.env) {
  return {
    connectionString: requiredDatabaseUrl(env),
    ssl: sslConfiguration(env),
    max: positiveInteger(env.THC_DATABASE_POOL_MAX, 10, 'THC_DATABASE_POOL_MAX'),
    connectionTimeoutMillis: positiveInteger(env.THC_DATABASE_CONNECT_TIMEOUT_MS, 5000, 'THC_DATABASE_CONNECT_TIMEOUT_MS'),
    idleTimeoutMillis: positiveInteger(env.THC_DATABASE_IDLE_TIMEOUT_MS, 30000, 'THC_DATABASE_IDLE_TIMEOUT_MS'),
    application_name: String(env.THC_DATABASE_APPLICATION_NAME ?? 'thc-academy-api').trim() || 'thc-academy-api'
  };
}

export async function createPersistenceAdapters({ env = process.env, poolFactory = (options) => new Pool(options) } = {}) {
  if (typeof poolFactory !== 'function') throw new Error('poolFactory must be a function');
  const pool = await poolFactory(postgresPoolOptions(env));
  if (!pool || typeof pool.query !== 'function' || typeof pool.connect !== 'function') {
    throw new Error('PostgreSQL pool must provide query() and connect()');
  }

  const query = (text, params = []) => pool.query(text, params);
  const withTransaction = async (callback) => {
    if (typeof callback !== 'function') throw new Error('transaction callback required');
    const client = await pool.connect();
    if (!client || typeof client.query !== 'function' || typeof client.release !== 'function') {
      throw new Error('PostgreSQL transaction client must provide query() and release()');
    }
    try {
      await client.query('begin');
      const result = await callback((text, params = []) => client.query(text, params));
      await client.query('commit');
      return result;
    } catch (error) {
      try { await client.query('rollback'); } catch {}
      throw error;
    } finally {
      client.release();
    }
  };

  return {
    credentialStore: createPostgresCredentialStore({ query }),
    credentialWriter: createPostgresCredentialWriter({ withTransaction }),
    learnerStore: createPostgresLearnerStore({ query, withTransaction }),
    async close() {
      if (typeof pool.end === 'function') await pool.end();
    }
  };
}
