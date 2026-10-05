import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

const credentialId='f5302091-9d48-4f68-9df4-0b606fd35e63';
const verificationId='VERIFY-REVOCATION-001';
let record={
  id:credentialId,
  verificationId,
  credentialDefinitionId:'CRED-CULT-FOUNDATIONS-001',
  credentialDefinitionVersion:'1.0.0',
  courseId:'COURSE-CULT-FOUNDATIONS-001',
  courseVersion:'1.0.0',
  status:'valid',
  issuedAt:'2026-10-05T12:00:00.000Z',
  expiresAt:null,
  payloadJson:{issuer:{name:'Teaching Healthy Cultivation'},publicRecipientNameConsent:false},
  payloadHash:'a'.repeat(64)
};
const credentialStore={
  kind:'memory-revocation-test',
  async ping(){return true;},
  async schemaVersion(){return '7';},
  async getByVerificationId(id){return id===verificationId?record:null;},
  async count(){return 1;}
};
let writes=0;
const credentialWriter={
  async transitionById(id,nextStatus,{actorId,reason}={}){
    assert.equal(id,credentialId);
    assert.equal(nextStatus,'revoked');
    assert.equal(actorId,'admin-test');
    assert.ok(reason);
    if(record.status==='revoked') return {credential:record,event:null,idempotent:true};
    writes+=1;
    record={...record,status:'revoked'};
    return {credential:record,event:{persistence:'test'},idempotent:false};
  }
};
function authorize(req,scope){
  const token=String(req.headers.authorization??'').replace(/^Bearer\s+/,'');
  if(!token) return {ok:false,status:401,error:'authentication-required'};
  if(token==='learner') return scope.startsWith('learner:')?{ok:true,subject:'learner-test',scopes:['learner:read','learner:write']}:{ok:false,status:403,error:'insufficient-scope'};
  if(token==='admin') return {ok:true,subject:'admin-test',scopes:['admin:read','admin:write'],mfaVerified:true};
  return {ok:false,status:401,error:'invalid-access-token'};
}
const server=createApiServer({
  env:{NODE_ENV:'production'},
  credentialStore,
  credentialWriter,
  learnerStore:null,
  secureAssessmentStore:null,
  authorize,
  requiredSchemaVersion:'7',
  logger:()=>{}
});
server.listen(0,'127.0.0.1');
await once(server,'listening');
const base=`http://127.0.0.1:${server.address().port}`;

async function json(path,options={}){
  const response=await fetch(base+path,options);
  let body=null;try{body=await response.json();}catch{}
  return {response,body};
}
try{
  let r=await json(`/api/v1/credentials/${verificationId}`);
  assert.equal(r.response.status,200);
  assert.equal(r.body.valid,true);
  assert.equal(r.body.status,'valid');

  r=await json(`/api/v1/admin/credentials/${credentialId}/revoke`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reason:'controlled production validation'})});
  assert.equal(r.response.status,401);

  r=await json(`/api/v1/admin/credentials/${credentialId}/revoke`,{method:'POST',headers:{authorization:'Bearer learner','content-type':'application/json'},body:JSON.stringify({reason:'controlled production validation'})});
  assert.equal(r.response.status,403);

  r=await json(`/api/v1/admin/credentials/${credentialId}/revoke`,{method:'POST',headers:{authorization:'Bearer admin','content-type':'application/json'},body:JSON.stringify({reason:''})});
  assert.equal(r.response.status,400);

  r=await json(`/api/v1/admin/credentials/${credentialId}/revoke`,{method:'POST',headers:{authorization:'Bearer admin','content-type':'application/json'},body:JSON.stringify({reason:'controlled production validation'})});
  assert.equal(r.response.status,200);
  assert.equal(r.body.credential.status,'revoked');
  assert.equal(r.body.idempotent,false);
  assert.equal(writes,1);

  r=await json(`/api/v1/credentials/${verificationId}`);
  assert.equal(r.response.status,200);
  assert.equal(r.body.valid,false);
  assert.equal(r.body.status,'revoked');

  r=await json(`/api/v1/admin/credentials/${credentialId}/revoke`,{method:'POST',headers:{authorization:'Bearer admin','content-type':'application/json'},body:JSON.stringify({reason:'retry after network uncertainty'})});
  assert.equal(r.response.status,200);
  assert.equal(r.body.idempotent,true);
  assert.equal(writes,1);
} finally {
  server.close();
  await once(server,'close');
}
console.log('Credential revocation API and public verification transition: PASS');
