function requireHttpsBaseUrl(value){
  const raw=String(value??'').trim().replace(/\/$/,'');
  if(!raw) throw new Error('Secure assessment verification requires --base-url or THC_PUBLIC_BASE_URL');
  let parsed; try{parsed=new URL(raw);}catch{throw new Error('Production base URL must be a valid URL');}
  if(parsed.protocol!=='https:') throw new Error('Production base URL must use https');
  return parsed.toString().replace(/\/$/,'');
}
function required(env,name){
  const value=String(env[name]??'').trim();
  if(!value) throw new Error(`Missing required secure assessment verification setting: ${name}`);
  return value;
}
async function safeJson(response){try{return await response.json();}catch{return null;}}
function containsProtectedMaterial(value){
  const serialized=JSON.stringify(value??{}).toLowerCase();
  return ['scoringkey','rationale','prompt','choices','correctanswer','answerkey'].some(k=>serialized.includes(k));
}
export async function verifySecureAssessmentStore({
  baseUrl,
  env=process.env,
  fetchImpl=fetch,
  timeoutMs=10000
}={}){
  const base=requireHttpsBaseUrl(baseUrl??env.THC_PUBLIC_BASE_URL);
  const token=required(env,'THC_VERIFY_ADMIN_MFA_TOKEN');
  const bankVersion=required(env,'THC_VERIFY_SECURE_BANK_VERSION');
  const response=await fetchImpl(`${base}/api/v1/admin/secure-assessment/banks/${encodeURIComponent(bankVersion)}`,{
    headers:{
      accept:'application/json',
      authorization:`Bearer ${token}`,
      'user-agent':'thc-academy-secure-store-verifier/1.0'
    },
    redirect:'error',
    signal:AbortSignal.timeout(timeoutMs)
  });
  const body=await safeJson(response);
  const bank=body?.bank??null;
  const counts=bank?.counts??{};
  const checks=[
    {name:'secure-store-summary-reachable',passed:response.status===200,status:response.status},
    {name:'bank-version-matches',passed:bank?.bankVersion===bankVersion},
    {name:'bank-approved-operational',passed:bank?.status==='approved-operational',status:bank?.status??null},
    {name:'approved-operational-items-present',passed:Number(counts.approvedOperational??0)>0,approvedOperational:Number(counts.approvedOperational??0)},
    {name:'no-protected-item-material-returned',passed:!containsProtectedMaterial(body)}
  ];
  const report={
    verificationType:'secure-assessment-store-readonly-summary',
    observedAt:new Date().toISOString(),
    baseUrl:base,
    bankVersion,
    passed:checks.every(x=>x.passed),
    checks,
    counts:{
      items:Number(counts.items??0),
      approvedOperational:Number(counts.approvedOperational??0),
      quarantined:Number(counts.quarantined??0),
      retired:Number(counts.retired??0)
    },
    activatedAt:bank?.activatedAt??null,
    safeForEvidenceAttachment:true,
    secretsIncluded:false,
    limitations:[
      'This read-only verifier confirms the deployed private bank summary is reachable with an MFA-asserted admin test identity and that an approved-operational bank is present.',
      'It does not enumerate or expose protected items, prompts, answer material, rationales, or scoring keys.',
      'It does not independently prove item selection, exposure tracking, quarantine exclusion during form assembly, or learner delivery projection.',
      'A passing result does not authorize professional credential issuance.'
    ]
  };
  if(JSON.stringify(report).includes(token)) throw new Error('Verifier output attempted to include an access token');
  return report;
}
function parseArgs(argv){const out={};for(let i=0;i<argv.length;i+=1){if(!argv[i].startsWith('--'))continue;const k=argv[i].slice(2);out[k]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}return out;}
if(import.meta.url===`file://${process.argv[1]}`){
  const args=parseArgs(process.argv.slice(2));
  try{
    const report=await verifySecureAssessmentStore({baseUrl:args['base-url']??process.env.THC_PUBLIC_BASE_URL,env:process.env});
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
    if(!report.passed) process.exitCode=1;
  }catch(error){
    console.error(`Secure assessment store verification failed: ${error.message}`);
    process.exitCode=1;
  }
}
