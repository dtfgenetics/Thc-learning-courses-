import assert from 'node:assert/strict';
import { createPersistenceAdapters, postgresPoolOptions } from '../apps/api/src/postgres-persistence-adapter.mjs';

assert.throws(() => postgresPoolOptions({}), /THC_DATABASE_URL or DATABASE_URL/);
assert.throws(() => postgresPoolOptions({ THC_DATABASE_URL: 'postgres://db', THC_DATABASE_SSL: 'sometimes' }), /THC_DATABASE_SSL/);
assert.throws(() => postgresPoolOptions({ THC_DATABASE_URL: 'postgres://db', THC_DATABASE_POOL_MAX: '0' }), /positive integer/);

const options = postgresPoolOptions({
  THC_DATABASE_URL: 'postgres://academy.example/db',
  THC_DATABASE_SSL: 'verify-full',
  THC_DATABASE_POOL_MAX: '7',
  THC_DATABASE_CONNECT_TIMEOUT_MS: '4000',
  THC_DATABASE_IDLE_TIMEOUT_MS: '25000',
  THC_DATABASE_APPLICATION_NAME: 'academy-test'
});
assert.equal(options.connectionString, 'postgres://academy.example/db');
assert.deepEqual(options.ssl, { rejectUnauthorized: true });
assert.equal(options.max, 7);
assert.equal(options.connectionTimeoutMillis, 4000);
assert.equal(options.idleTimeoutMillis, 25000);
assert.equal(options.application_name, 'academy-test');

const poolCalls = [];
const clientCalls = [];
let released = 0;
let ended = 0;
const credentialRow = {
  id: 'cred-1',
  verification_id: 'verify-1',
  subject_hash: 'subject-hash',
  credential_definition_id: 'CRED-CULT-TECH-II-001',
  credential_definition_version: '1.0.0',
  course_id: 'COURSE-CULT-TECH-II-001',
  course_version: '1.0.0',
  status: 'valid',
  issued_at: '2026-09-06T00:00:00.000Z',
  expires_at: null,
  payload_json: {},
  payload_hash: 'payload-hash'
};

const client = {
  async query(text, params = []) {
    clientCalls.push({ text, params });
    const normalized = String(text).trim().toLowerCase();
    if (normalized === 'begin' || normalized === 'commit' || normalized === 'rollback') return { rows: [] };
    if (normalized.includes('from credentials') && normalized.includes('for update')) return { rows: [credentialRow] };
    if (normalized.startsWith('update credentials')) return { rowCount: 1, rows: [{ id: 'cred-1' }] };
    return { rows: [] };
  },
  release() { released += 1; }
};

const pool = {
  async query(text, params = []) {
    poolCalls.push({ text, params });
    if (String(text).includes('select 1 as ok')) return { rows: [{ ok: 1 }] };
    if (String(text).includes('academy_schema_migrations')) return { rows: [{ version: '4' }] };
    return { rows: [] };
  },
  async connect() { return client; },
  async end() { ended += 1; }
};

let receivedPoolOptions = null;
const adapters = await createPersistenceAdapters({
  env: { THC_DATABASE_URL: 'postgres://academy.example/db', THC_DATABASE_SSL: 'disable' },
  poolFactory: async (value) => {
    receivedPoolOptions = value;
    return pool;
  }
});

assert.equal(receivedPoolOptions.connectionString, 'postgres://academy.example/db');
assert.equal(receivedPoolOptions.ssl, false);
assert.equal(adapters.credentialStore.kind, 'postgres');
assert.equal(adapters.credentialWriter.kind, 'postgres-transactional');
assert.equal(adapters.learnerStore.kind, 'postgres-learner-runtime');
assert.equal(typeof adapters.learnerStore.recordPerformanceAssessmentResult, 'function');
assert.equal(await adapters.credentialStore.ping(), true);
assert.equal(await adapters.credentialStore.schemaVersion(), '4');
assert.deepEqual(await adapters.learnerStore.listEnrollments('learner-1'), []);

const transition = await adapters.credentialWriter.transitionById('cred-1', 'suspended', {
  actorId: 'admin-1',
  reason: 'quality-review'
});
assert.equal(transition.credential.status, 'suspended');
assert.equal(transition.event.persistence, 'transactional-postgres');
assert.equal(clientCalls[0].text, 'begin');
assert.equal(clientCalls.at(-1).text, 'commit');
assert.equal(released, 1);
assert.equal(poolCalls.some((entry) => String(entry.text).includes('select 1 as ok')), true);

const failingClientCalls = [];
let failingReleased = 0;
const failingAdapters = await createPersistenceAdapters({
  env: { DATABASE_URL: 'postgres://academy.example/db' },
  poolFactory: async () => ({
    query: pool.query,
    async connect() {
      return {
        async query(text) {
          failingClientCalls.push(String(text).trim().toLowerCase());
          if (String(text).trim().toLowerCase() === 'begin') return { rows: [] };
          if (String(text).trim().toLowerCase() === 'rollback') return { rows: [] };
          throw new Error('database-write-failed');
        },
        release() { failingReleased += 1; }
      };
    },
    async end() {}
  })
});
await assert.rejects(
  () => failingAdapters.credentialWriter.transitionById('cred-1', 'suspended', { actorId: 'admin-1' }),
  /database-write-failed/
);
assert.equal(failingClientCalls.includes('rollback'), true);
assert.equal(failingReleased, 1);

await adapters.close();
assert.equal(ended, 1);

console.log('production persistence adapter tests passed');
