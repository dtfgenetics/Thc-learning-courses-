import assert from 'node:assert/strict';
import { createPersistenceAdaptersFromPool } from '../apps/api/src/postgres-production-adapter.mjs';

const events=[];
const credentialRow={
  id:'cred-1',verification_id:'VERIFY-1',subject_hash:'hash',
  credential_definition_id:'CRED-TEST-001',credential_definition_version:'1.0.0',
  course_id:'COURSE-TEST-001',course_version:'1.0.0',status:'valid',
  issued_at:'2026-09-22T00:00:00.000Z',expires_at:null,payload_json:{issuer:'THC Academy'},payload_hash:'payload-hash'
};
const client={
  async query(text,params=[]){
    events.push({text:String(text).trim(),params});
    if(String(text).trim()==='begin'||String(text).trim()==='commit'||String(text).trim()==='rollback') return {rows:[]};
    if(String(text).includes('from credentials')&&String(text).includes('for update')) return {rows:[credentialRow]};
    if(String(text).startsWith('update credentials')) return {rowCount:1,rows:[{id:'cred-1'}]};
    if(String(text).startsWith('insert into credential_status_events')) return {rowCount:1,rows:[]};
    if(String(text).startsWith('insert into audit_events')) return {rowCount:1,rows:[]};
    throw new Error(`unexpected transactional query: ${text}`);
  },
  release(){ events.push({text:'release',params:[]}); }
};
const pool={
  async query(text){
    if(String(text).includes('select 1 as ok')) return {rows:[{ok:1}]};
    if(String(text).includes('academy_schema_migrations')) return {rows:[{version:'4'}]};
    if(String(text).includes('count(*)::int as count from credentials')) return {rows:[{count:1}]};
    if(String(text).includes('where verification_id = $1')) return {rows:[credentialRow]};
    throw new Error(`unexpected pool query: ${text}`);
  },
  async connect(){ return client; }
};
const adapters=createPersistenceAdaptersFromPool({pool});
assert.equal(adapters.credentialStore.kind,'postgres');
assert.equal(adapters.credentialWriter.kind,'postgres-transactional');
assert.equal(adapters.learnerStore.kind,'postgres-learner-runtime');
assert.equal(adapters.practicalEvaluatorStore.kind,'postgres-practical-evaluator');
assert.equal(adapters.enrollmentCompletionStore.kind,'postgres-enrollment-completion');
assert.equal(await adapters.credentialStore.ping(),true);
assert.equal(await adapters.credentialStore.schemaVersion(),'6');
assert.equal((await adapters.credentialStore.getByVerificationId('VERIFY-1')).status,'valid');

const transition=await adapters.credentialWriter.transitionById('cred-1','revoked',{actorId:'admin-1',reason:'controlled test'});
assert.equal(transition.credential.status,'revoked');
assert.ok(events.some((row)=>row.text==='begin'));
assert.ok(events.some((row)=>row.text==='commit'));
assert.ok(events.some((row)=>row.text.startsWith('insert into credential_status_events')));
assert.ok(events.some((row)=>row.text.startsWith('insert into audit_events')));
assert.equal(events.at(-1).text,'release');

const rollbackEvents=[];
const badPool={
  async query(){ return {rows:[]}; },
  async connect(){
    return {
      async query(text){ rollbackEvents.push(String(text).trim()); if(String(text).trim()==='begin') return {rows:[]}; if(String(text).includes('from credentials')) throw new Error('db-failure'); if(String(text).trim()==='rollback') return {rows:[]}; },
      release(){ rollbackEvents.push('release'); }
    };
  }
};
const bad=createPersistenceAdaptersFromPool({pool:badPool});
await assert.rejects(()=>bad.credentialWriter.transitionById('cred-1','revoked',{actorId:'admin-1'}),/db-failure/);
assert.ok(rollbackEvents.includes('rollback'));
assert.equal(rollbackEvents.at(-1),'release');

console.log('Production PostgreSQL adapter composition and transactional credential revocation: PASS');
