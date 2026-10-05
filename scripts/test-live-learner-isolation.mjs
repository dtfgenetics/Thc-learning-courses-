import assert from 'node:assert/strict';
import { verifyLearnerIsolation } from './verify-live-learner-isolation.mjs';

const env={THC_VERIFY_LEARNER_A_TOKEN:'token-a-secret',THC_VERIFY_LEARNER_B_TOKEN:'token-b-secret'};
const stores=new Map([['token-a-secret',[]],['token-b-secret',[]]]);
let req=0;
function json(status,body){req+=1;return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','x-request-id':`req-${req}`}});}
const fetchImpl=async(url,options={})=>{
  const token=String(options.headers?.authorization??'').replace(/^Bearer\s+/,'');
  const path=new URL(url).pathname;
  if(!stores.has(token)) return json(401,{error:'invalid-token'});
  if(path==='/api/v1/me/progress') return json(200,{progress:structuredClone(stores.get(token))});
  const m=path.match(/^\/api\/v1\/me\/lessons\/(LESSON-[A-Z0-9-]+)$/);
  if(options.method==='PUT'&&m){
    const body=JSON.parse(options.body);
    const rows=stores.get(token).filter(x=>x.lessonId!==m[1]);
    const saved={lessonId:m[1],lessonVersion:body.lessonVersion,status:body.status};
    rows.push(saved);stores.set(token,rows);
    return json(200,{progress:saved});
  }
  return json(404,{error:'not-found'});
};

const report=await verifyLearnerIsolation({baseUrl:'https://academy.dtfseeds.com',env,fetchImpl});
assert.equal(report.passed,true);
assert.equal(report.checks.length,6);
assert.equal(report.checks.every(x=>x.passed),true);
assert.equal(report.secretsIncluded,false);
assert.equal(JSON.stringify(report).includes(env.THC_VERIFY_LEARNER_A_TOKEN),false);
assert.equal(JSON.stringify(report).includes(env.THC_VERIFY_LEARNER_B_TOKEN),false);
assert.equal(stores.get(env.THC_VERIFY_LEARNER_A_TOKEN).find(x=>x.lessonId==='LESSON-OPS-ISOLATION-A')?.status,'not-started');
assert.equal(stores.get(env.THC_VERIFY_LEARNER_B_TOKEN).find(x=>x.lessonId==='LESSON-OPS-ISOLATION-B')?.status,'not-started');

await assert.rejects(
  ()=>verifyLearnerIsolation({baseUrl:'https://academy.dtfseeds.com',env:{...env,THC_VERIFY_LEARNER_B_TOKEN:env.THC_VERIFY_LEARNER_A_TOKEN},fetchImpl}),
  /must be different/
);

console.log('Live learner subject-isolation verifier: PASS');
