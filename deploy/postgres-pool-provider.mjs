import { createConfiguredPostgresPool } from './postgres-pool-factory.mjs';

export async function createPostgresPool({ env = process.env } = {}) {
  return createConfiguredPostgresPool({
    env,
    connectionStringEnv: 'THC_POSTGRES_DATABASE_URL',
    poolPrefix: 'THC_POSTGRES',
    applicationName: 'thc-academy-runtime'
  });
}
