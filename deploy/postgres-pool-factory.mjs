import pg from 'pg';

const { Pool } = pg;

function required(env, name) {
  const value = String(env[name] ?? '').trim();
  if (!value) throw new Error(`PostgreSQL pool configuration requires ${name}`);
  return value;
}

function positiveInteger(env, name, fallback) {
  const raw = String(env[name] ?? '').trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

function validateTlsConnectionString(connectionString, name) {
  let parsed;
  try { parsed = new URL(connectionString); }
  catch { throw new Error(`${name} must be a valid PostgreSQL connection URL`); }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error(`${name} must use postgres:// or postgresql://`);
  }

  const sslMode = String(parsed.searchParams.get('sslmode') ?? '').toLowerCase();
  if (!sslMode) {
    throw new Error(`${name} must include sslmode=require, verify-ca, or verify-full`);
  }
  if (!['require', 'verify-ca', 'verify-full'].includes(sslMode)) {
    throw new Error(`${name} must not disable or weaken PostgreSQL TLS`);
  }
}

export function createConfiguredPostgresPool({
  env = process.env,
  connectionStringEnv,
  poolPrefix,
  applicationName
}) {
  const connectionString = required(env, connectionStringEnv);
  validateTlsConnectionString(connectionString, connectionStringEnv);

  const max = positiveInteger(env, `${poolPrefix}_POOL_MAX`, 10);
  const connectionTimeoutMillis = positiveInteger(env, `${poolPrefix}_CONNECTION_TIMEOUT_MS`, 10000);
  const idleTimeoutMillis = positiveInteger(env, `${poolPrefix}_IDLE_TIMEOUT_MS`, 30000);

  const pool = new Pool({
    connectionString,
    max,
    connectionTimeoutMillis,
    idleTimeoutMillis,
    application_name: applicationName
  });

  pool.on('error', (error) => {
    process.stderr.write(`${JSON.stringify({
      level: 'error',
      event: 'postgres.pool.error',
      pool: applicationName,
      error: error?.name ?? 'Error'
    })}\n`);
  });

  return pool;
}
