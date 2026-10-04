import assert from 'node:assert/strict';
import {
  credentialPayloadDigest,
  validateIssuerIdentity,
  validateSignatureEnvelope,
  wrapCredentialSigner
} from '../apps/api/src/credential-signing-adapter.mjs';

const a={b:2,a:1,nested:{z:true,a:'x'}};
const b={nested:{a:'x',z:true},a:1,b:2};
assert.equal(credentialPayloadDigest(a),credentialPayloadDigest(b),'credential digest must be stable across object key order');

assert.deepEqual(validateIssuerIdentity({issuerId:'THC-ACADEMY',name:'Teaching Healthy Cultivation',url:'https://dtfseeds.com/'}),{
  issuerId:'THC-ACADEMY',name:'Teaching Healthy Cultivation',url:'https://dtfseeds.com/'
});
assert.throws(()=>validateIssuerIdentity({issuerId:'x',name:'x',url:'http://example.com'}),/https/);
assert.throws(()=>validateSignatureEnvelope({algorithm:'EdDSA',keyId:'kid',signature:'sig',privateKey:'never'}),/must not expose/);

const calls=[];
const signer=wrapCredentialSigner({
  async signDigest(input){
    calls.push(input);
    return {algorithm:'EdDSA',keyId:'kms/key/academy-credential-v1',signature:'opaque-external-signature'};
  }
},{issuerIdentity:{issuerId:'THC-ACADEMY',name:'Teaching Healthy Cultivation',url:'https://dtfseeds.com/'}});
const payload={verificationId:'VERIFY-TEST-1',credential:{id:'CRED-TEST-001',version:'1.0.0'},status:'valid'};
const signed=await signer.signCredentialPayload(payload,{credentialId:'cred-1',verificationId:'VERIFY-TEST-1'});
assert.equal(signed.algorithm,'EdDSA');
assert.equal(signed.keyId,'kms/key/academy-credential-v1');
assert.equal(signed.issuer.issuerId,'THC-ACADEMY');
assert.equal(calls.length,1);
assert.match(calls[0].digest,/^[a-f0-9]{64}$/);
assert.deepEqual(calls[0].context,{credentialId:'cred-1',verificationId:'VERIFY-TEST-1',issuerId:'THC-ACADEMY'});
const forbiddenKeys=new Set(['privateKey','private_key','secret','seed','pem','keyMaterial']);
function assertNoForbiddenKeys(value,path='root'){
  if(!value||typeof value!=='object') return;
  for(const [key,child] of Object.entries(value)){
    assert.ok(!forbiddenKeys.has(key), `${path} must not expose forbidden field ${key}`);
    assertNoForbiddenKeys(child,`${path}.${key}`);
  }
}
assertNoForbiddenKeys(signed);

console.log('Managed credential issuer/signing integration contract: PASS');
