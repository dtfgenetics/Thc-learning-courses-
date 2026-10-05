import crypto from 'node:crypto';

function required(env,name){
  const value=String(env[name]??'').trim();
  if(!value) throw new Error(`Missing required revocation verification setting: ${name}`);
  return value;
}
function httpsBase(value){
  let u;try{u=new URL(String(value??'').trim().replace(/\/$/,''));}catch{throw new Error('THC_PUBLIC_BASE_URL must be a valid URL');}
  if(u.protocol!=='https:') throw new Error('THC_PUBLIC_BASE_URL must use https');
  return u.toString().replace(/\/$/,'');
}
function uuid(value){
  if(!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)) throw new Error('THC_VERIFY_CREDENTIAL_ID must be a UUID');
  return value;
}
function fp(value){return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0,16);}
async function body(response){try{return await response.json();}catch{return null;}}
async function request(fetchImpl,url,options={}){const response=await fetchImpl(url,options);return {status:response.status,body:await body(response)};}

export async function verifyLiveCredentialRevocation({env=process.env,fetchImpl=fetch}={}){
  const base=httpsBase(required(env,'THC_PUBLIC_BASE_URL'));
  const token=required(env,'THC_VERIFY_ADMIN_MFA_TOKEN');
  const credentialId=uuid(required(env,'THC_VERIFY_CREDENTIAL_ID'));
  const verificationId=required(env,'THC_VERIFY_CREDENTIAL_VERIFICATION_ID');
  if(env.THC_VERIFY_REVOCATION_CONFIRM_TEST_CREDENTIAL!=='I_UNDERSTAND_TEST_CREDENTIAL_WILL_BE_REVOKED'){
    throw new Error('Refusing live revocation without explicit dedicated test credential confirmation');
  }

  const before=await request(fetchImpl,`${base}/api/v1/credentials/${encodeURIComponent(verificationId)}`,{headers:{accept:'application/json'}});
  if(before.status!==200) throw new Error(`Public credential lookup failed before revocation: HTTP ${before.status}`);
  if(!['issued','valid'].includes(before.body?.status)||before.body?.valid!==true){
    throw new Error('Dedicated test credential must be currently issued/valid before controlled revocation');
  }

  const revokeOptions={
    method:'POST',
    headers:{accept:'application/json','content-type':'application/json',authorization:`Bearer ${token}`},
    body:JSON.stringify({reason:'controlled production revocation verification'})
  };
  const revoked=await request(fetchImpl,`${base}/api/v1/admin/credentials/${credentialId}/revoke`,revokeOptions);
  if(revoked.status!==200||revoked.body?.credential?.status!=='revoked') throw new Error(`Credential revocation failed: HTTP ${revoked.status}`);

  const after=await request(fetchImpl,`${base}/api/v1/credentials/${encodeURIComponent(verificationId)}`,{headers:{accept:'application/json'}});
  if(after.status!==200||after.body?.status!=='revoked'||after.body?.valid!==false) throw new Error('Public verification did not reflect revoked status');

  const retry=await request(fetchImpl,`${base}/api/v1/admin/credentials/${credentialId}/revoke`,{
    ...revokeOptions,
    body:JSON.stringify({reason:'controlled revocation retry/idempotency verification'})
  });
  if(retry.status!==200||retry.body?.idempotent!==true||retry.body?.credential?.status!=='revoked'){
    throw new Error('Repeated revocation was not idempotent');
  }

  const report={
    verificationType:'live-credential-revocation',
    observedAt:new Date().toISOString(),
    passed:true,
    credentialFingerprint:fp(credentialId),
    verificationIdFingerprint:fp(verificationId),
    checks:[
      {name:'public-credential-valid-before',passed:true,status:before.body.status},
      {name:'admin-revocation-persisted',passed:true,status:revoked.body.credential.status,idempotent:revoked.body.idempotent===true},
      {name:'public-verification-reflects-revoked',passed:true,status:after.body.status,valid:after.body.valid},
      {name:'revocation-retry-idempotent',passed:true,idempotent:retry.body.idempotent===true}
    ],
    safeForEvidenceAttachment:true,
    secretsIncluded:false,
    limitations:[
      'This verifier permanently revokes the explicitly confirmed dedicated test credential.',
      'It verifies the deployed API/public-verification revocation path and retry idempotency only.',
      'It does not authorize professional credential issuance.'
    ]
  };
  if(JSON.stringify(report).includes(token)) throw new Error('Verifier output attempted to include admin token');
  return report;
}

if(import.meta.url===`file://${process.argv[1]}`){
  try{
    const report=await verifyLiveCredentialRevocation({env:process.env});
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
  }catch(error){
    console.error(`Live credential revocation verification failed: ${error.message}`);
    process.exitCode=1;
  }
}
