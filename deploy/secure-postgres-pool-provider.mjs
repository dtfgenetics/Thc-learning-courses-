import { createConfiguredPostgresPool } from './postgres-pool-factory.mjs';

export async function createPostgresPool({ env = process.env } = {}) {
  const secureUrl = String(env.THC_SECURE_ASSESSMENT_DATABASE_URL ?? '').trim();
  const runtimeUrl = String(env.THC_POSTGRES_DATABASE_URL ?? '').trim();
  if (secureUrl && runtimeUrl && secureUrl === runtimeUrl) {
    throw new Error('Secure assessment database credentials must be isolated from the learner/runtime database');
  }

  return createConfiguredPostgresPool({
    env,
    connectionStringEnv: 'THC_SECURE_ASSESSMENT_DATABASE_URL',
    poolPrefix: 'THC_SECURE_ASSESSMENT_POSTGRES',
    applicationName: 'thc-academy-secure-assessment'
  });
}
