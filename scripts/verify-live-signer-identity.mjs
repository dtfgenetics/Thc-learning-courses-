function required(env,name){
  const value=String(env[name]??'').trim();
  if(!value) throw new Error(`Missing required signer verification setting: ${name}`);
  return value;
}
function baseUrl(value){
  let parsed;try{parsed=new URL(String(value).trim().replace(/\/$/,''));}catch{throw new Error('THC_PUBLIC_BASE_URL must be a valid URL');}
  if(parsed.protocol!=='https:') throw new Error('THC_PUBLIC_BASE_URL must use https');
  return parsed.toString().replace(/\/$/,'');
}
async function json(response){try{return await response.json();}catch{return null;}}
export async function verifySignerIdentity({env=process.env,fetchImpl=fetch}={}){
  const base=baseUrl(required(env,'THC_PUBLIC_BASE_URL'));
  const token=required(env,'THC_VERIFY_ADMIN_MFA_TOKEN');
  const response=await fetchImpl(`${base}/api/v1/admin/diagnostics`,{
    headers:{accept:'application/json',authorization:`Bearer ${token}`},
    redirect:'error',
    signal:AbortSignal.timeout(10000)
  });
  const body=await json(response);
  const issuer=body?.credentialIssuer??null;
  const urlOk=issuer?.url==null||String(issuer.url).startsWith('https://');
  const checks=[
    {name:'admin-diagnostics-reachable',passed:response.status===200,status:response.status},
    {name:'credential-signer-configured',passed:body?.credentialSigningConfigured===true},
    {name:'managed-signer-kind',passed:body?.credentialSignerKind==='managed-external-signer',kind:body?.credentialSignerKind??null},
    {name:'issuer-identity-present',passed:Boolean(String(issuer?.issuerId??'').trim())&&Boolean(String(issuer?.name??'').trim())},
    {name:'issuer-url-https-when-present',passed:urlOk}
  ];
  const report={
    verificationType:'credential-signer-identity',
    observedAt:new Date().toISOString(),
    baseUrl:base,
    passed:checks.every(x=>x.passed),
    signerKind:body?.credentialSignerKind??null,
    issuer:issuer?{issuerId:issuer.issuerId??null,name:issuer.name??null,url:issuer.url??null}:null,
    checks,
    safeForEvidenceAttachment:true,
    secretsIncluded:false,
    limitations:[
      'This verifier confirms deployed managed-signer configuration and public issuer identity only.',
      'It does not perform a signing operation, validate key custody, verify signature bytes, or authorize credential issuance.'
    ]
  };
  if(JSON.stringify(report).includes(token)) throw new Error('Verifier output attempted to include admin token');
  return report;
}
if(import.meta.url===`file://${process.argv[1]}`){
  try{
    const report=await verifySignerIdentity({env:process.env});
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
    if(!report.passed) process.exitCode=1;
  }catch(error){
    console.error(`Signer identity verification failed: ${error.message}`);
    process.exitCode=1;
  }
}
