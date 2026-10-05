import assert from 'node:assert/strict';
import { verifyAuthenticatedProductionBoundaries } from './verify-authenticated-production-boundaries.mjs';

const env={
  THC_VERIFY_LEARNER_TOKEN:'learner-secret-token-value',
  THC_VERIFY_EVALUATOR_TOKEN:'evaluator-secret-token-value',
  THC_VERIFY_ADMIN_NO_MFA_TOKEN:'admin-no-mfa-secret-token-value',
  THC_VERIFY_ADMIN_MFA_TOKEN:'admin-mfa-secret-token-value'
};

function json(status,body){
  return new Response(JSON.stringify(body),{
    status,
    headers:{'content-type':'application/json','x-request-id':`req-${status}-${Math.random()}`}
  });
}

const seenAuth=[];
const goodFetch=async (url,options)=>{
  const auth=String(options?.headers?.authorization??'');
  seenAuth.push(auth);
  const token=auth.replace(/^Bearer\s+/,'');
  const path=new URL(url).pathname;

  if(token===env.THC_VERIFY_LEARNER_TOKEN){
    if(path==='/api/v1/me/progress') return json(200,{learner:{subject:'learner-operator-test'},progress:[]});
    if(path==='/api/v1/admin/diagnostics'||path==='/api/v1/evaluator/capabilities') return json(403,{error:'insufficient-scope'});
  }
  if(token===env.THC_VERIFY_EVALUATOR_TOKEN){
    if(path==='/api/v1/evaluator/capabilities') return json(200,{evaluator:{subject:'evaluator-operator-test'},coursePracticalEvaluation:true});
    if(path==='/api/v1/admin/diagnostics') return json(403,{error:'insufficient-scope'});
  }
  if(token===env.THC_VERIFY_ADMIN_NO_MFA_TOKEN&&path==='/api/v1/admin/diagnostics'){
    return json(403,{error:'admin-mfa-required'});
  }
  if(token===env.THC_VERIFY_ADMIN_MFA_TOKEN){
    if(path==='/api/v1/admin/diagnostics') return json(200,{ok:true,authenticatedSubject:'admin-operator-test',storageAdapter:'postgres',learnerStorageAdapter:'postgres',practicalEvaluatorStorageAdapter:'postgres'});
    if(path==='/api/v1/me/progress') return json(403,{error:'insufficient-scope'});
  }
  return json(500,{error:'unexpected-request'});
};

const report=await verifyAuthenticatedProductionBoundaries({
  baseUrl:'https://academy.dtfseeds.com',
  env,
  fetchImpl:goodFetch,
  timeoutMs:500
});
assert.equal(report.passed,true);
assert.equal(report.secretsIncluded,false);
assert.equal(report.safeForEvidenceAttachment,true);
assert.equal(report.checks.length,9);
assert.equal(report.checks.every(x=>x.passed),true);
const serialized=JSON.stringify(report);
for(const token of Object.values(env)) assert.equal(serialized.includes(token),false);
assert.equal(serialized.includes('learner-operator-test'),false);
assert.equal(serialized.includes('evaluator-operator-test'),false);
assert.equal(serialized.includes('admin-operator-test'),false);
assert.ok(seenAuth.every(x=>x.startsWith('Bearer ')));

const noMfaAllowed=await verifyAuthenticatedProductionBoundaries({
  baseUrl:'https://academy.dtfseeds.com',
  env,
  fetchImpl:async (url,options)=>{
    const token=String(options?.headers?.authorization??'').replace(/^Bearer\s+/,'');
    const path=new URL(url).pathname;
    if(token===env.THC_VERIFY_ADMIN_NO_MFA_TOKEN&&path==='/api/v1/admin/diagnostics'){
      return json(200,{ok:true,authenticatedSubject:'admin-without-mfa'});
    }
    return goodFetch(url,options);
  },
  timeoutMs:500
});
assert.equal(noMfaAllowed.passed,false);
assert.equal(noMfaAllowed.checks.find(x=>x.name==='admin-without-mfa-denied')?.passed,false);

await assert.rejects(
  ()=>verifyAuthenticatedProductionBoundaries({baseUrl:'http://academy.dtfseeds.com',env,fetchImpl:goodFetch}),
  /must use https/
);
await assert.rejects(
  ()=>verifyAuthenticatedProductionBoundaries({
    baseUrl:'https://academy.dtfseeds.com',
    env:{...env,THC_VERIFY_ADMIN_MFA_TOKEN:''},
    fetchImpl:goodFetch
  }),
  /Missing required ephemeral verification token/
);

console.log('Authenticated production scope/MFA verifier: PASS');
