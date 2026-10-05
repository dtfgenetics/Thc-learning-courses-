import assert from 'node:assert/strict';
import { verifyDirectRls } from './verify-direct-postgres-rls.mjs';

const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const env={
  THC_VERIFY_RLS_DATABASE_URL:'postgresql://validator:secret@db.internal:5432/academy?sslmode=require',
  THC_VERIFY_RLS_LEARNER_A_ID:A,
  THC_VERIFY_RLS_LEARNER_B_ID:B
};
const tables=[
  'learners','academy_applications','enrollments','lesson_progress','assessment_attempts',
  'assessment_attempt_items','learner_competencies','performance_assessment_results','learner_portfolio_artifacts'
];
let context=null;
let ended=false;
const client={
  async query(text,params=[]){
    if(/pg_roles/.test(text)) return {rows:[{role_name:'academy_rls_validator',rolsuper:false,rolbypassrls:false}]};
    if(/pg_class/.test(text)) return {rows:tables.map(table_name=>({table_name,relrowsecurity:true,relforcerowsecurity:true}))};
    if(/pg_policies/.test(text)) return {rows:tables.map(tablename=>({tablename,policy_count:1}))};
    if(/^begin read only$/i.test(text)||/^rollback$/i.test(text)) return {rows:[]};
    if(/set_config/.test(text)){context=params[0];return {rows:[{set_config:context}]};}
    if(/count\(\*\).*from learners/i.test(text)){
      const target=params[0];
      return {rows:[{n:context===target?1:0}]};
    }
    throw new Error(`Unexpected query: ${text}`);
  },
  async end(){ended=true;}
};
const report=await verifyDirectRls({env,clientFactory:async()=>client});
assert.equal(report.passed,true);
assert.equal(report.secretsIncluded,false);
assert.equal(report.checks.every(x=>x.passed),true);
assert.equal(ended,true);
const serialized=JSON.stringify(report);
assert.equal(serialized.includes('validator:secret'),false);
assert.equal(serialized.includes(A),false);
assert.equal(serialized.includes(B),false);

await assert.rejects(
  ()=>verifyDirectRls({env:{...env,THC_VERIFY_RLS_DATABASE_URL:'postgresql://validator:secret@db.internal:5432/academy'},clientFactory:async()=>client}),
  /must require TLS/
);

console.log('Direct PostgreSQL RLS verifier: PASS');
