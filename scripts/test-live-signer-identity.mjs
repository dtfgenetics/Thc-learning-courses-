import assert from 'node:assert/strict';
import { verifySignerIdentity } from './verify-live-signer-identity.mjs';

const env={
  THC_PUBLIC_BASE_URL:'https://academy.dtfseeds.com',
  THC_VERIFY_ADMIN_MFA_TOKEN:'admin-mfa-secret-token'
};
const fetchImpl=async(url,options)=>{
  assert.equal(new URL(url).pathname,'/api/v1/admin/diagnostics');
  assert.equal(options.headers.authorization,`Bearer ${env.THC_VERIFY_ADMIN_MFA_TOKEN}`);
  return new Response(JSON.stringify({
    ok:true,
    credentialSigningConfigured:true,
    credentialSignerKind:'managed-external-signer',
    credentialIssuer:{issuerId:'THC-ACADEMY',name:'Teaching Healthy Cultivation',url:'https://academy.dtfseeds.com'}
  }),{status:200,headers:{'content-type':'application/json'}});
};
const report=await verifySignerIdentity({env,fetchImpl});
assert.equal(report.passed,true);
assert.equal(report.secretsIncluded,false);
assert.equal(report.signerKind,'managed-external-signer');
assert.equal(report.issuer.issuerId,'THC-ACADEMY');
assert.equal(JSON.stringify(report).includes(env.THC_VERIFY_ADMIN_MFA_TOKEN),false);

const missing=await verifySignerIdentity({
  env,
  fetchImpl:async()=>new Response(JSON.stringify({ok:true,credentialSigningConfigured:false,credentialSignerKind:null,credentialIssuer:null}),{status:200,headers:{'content-type':'application/json'}})
});
assert.equal(missing.passed,false);
assert.equal(missing.checks.find(x=>x.name==='credential-signer-configured')?.passed,false);

console.log('Live credential signer identity verifier: PASS');
