import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

const credentialStore={
  kind:'test-postgres',
  async ping(){return true;},
  async schemaVersion(){return '7';},
  async getByVerificationId(){return null;},
  async count(){return 0;}
};
const credentialSigner={
  kind:'managed-external-signer',
  issuer:{issuerId:'THC-ACADEMY',name:'Teaching Healthy Cultivation',url:'https://academy.dtfseeds.com'},
  async signCredentialPayload(){throw new Error('diagnostics must not sign');}
};
const authorize=(req,scope)=>{
  const token=String(req.headers.authorization??'').replace(/^Bearer\s+/,'');
  if(token==='admin'&&scope==='admin:read') return {ok:true,subject:'admin-test',scopes:['admin:read'],mfaVerified:true};
  return {ok:false,status:401,error:'authentication-required'};
};
const server=createApiServer({env:{NODE_ENV:'production'},credentialStore,credentialSigner,authorize,requiredSchemaVersion:'7',logger:()=>{}});
server.listen(0,'127.0.0.1');
await once(server,'listening');
try{
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/admin/diagnostics`,{headers:{authorization:'Bearer admin'}});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.credentialSigningConfigured,true);
  assert.equal(body.credentialSignerKind,'managed-external-signer');
  assert.deepEqual(body.credentialIssuer,{issuerId:'THC-ACADEMY',name:'Teaching Healthy Cultivation',url:'https://academy.dtfseeds.com'});
  assert.equal(JSON.stringify(body).includes('privateKey'),false);
  assert.equal(JSON.stringify(body).includes('signature'),false);
}finally{
  server.close();
  await once(server,'close');
}
console.log('Admin signer diagnostics projection: PASS');
