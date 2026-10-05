import crypto from 'node:crypto';

const REQUIRED_TOKEN_ENV = [
  'THC_VERIFY_LEARNER_TOKEN',
  'THC_VERIFY_EVALUATOR_TOKEN',
  'THC_VERIFY_ADMIN_NO_MFA_TOKEN',
  'THC_VERIFY_ADMIN_MFA_TOKEN'
];

function requireHttpsBaseUrl(value) {
  const raw=String(value??'').trim().replace(/\/$/,'');
  if(!raw) throw new Error('Authenticated production verification requires --base-url or THC_PUBLIC_BASE_URL');
  let parsed;
  try { parsed=new URL(raw); } catch { throw new Error('Production base URL must be a valid URL'); }
  if(parsed.protocol!=='https:') throw new Error('Production base URL must use https');
  return parsed.toString().replace(/\/$/,'');
}

function requireTokens(env) {
  const tokens={};
  for(const name of REQUIRED_TOKEN_ENV){
    const value=String(env[name]??'').trim();
    if(!value) throw new Error(`Missing required ephemeral verification token: ${name}`);
    tokens[name]=value;
  }
  return tokens;
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(String(value??'')).digest('hex').slice(0,16);
}

async function safeJson(response) {
  try { return await response.json(); } catch { return null; }
}

async function call(fetchImpl, base, path, token, timeoutMs) {
  const started=Date.now();
  const response=await fetchImpl(`${base}${path}`,{
    headers:{
      accept:'application/json',
      authorization:`Bearer ${token}`,
      'user-agent':'thc-academy-auth-boundary-verifier/1.0'
    },
    redirect:'error',
    signal:AbortSignal.timeout(timeoutMs)
  });
  const body=await safeJson(response);
  return {
    status:response.status,
    durationMs:Date.now()-started,
    body,
    requestId:response.headers.get('x-request-id')??body?.requestId??null
  };
}

function result(name,passed,meta={}) {
  return {name,passed:passed===true,...meta};
}

function ensureNoTokenLeak(serialized,tokens) {
  for(const value of Object.values(tokens)){
    if(serialized.includes(value)) throw new Error('Verifier output attempted to include an ephemeral access token');
  }
}

export async function verifyAuthenticatedProductionBoundaries({
  baseUrl,
  env=process.env,
  fetchImpl=fetch,
  timeoutMs=10_000
}={}) {
  const base=requireHttpsBaseUrl(baseUrl??env.THC_PUBLIC_BASE_URL);
  const tokens=requireTokens(env);
  const checks=[];

  const learner=await call(fetchImpl,base,'/api/v1/me/progress',tokens.THC_VERIFY_LEARNER_TOKEN,timeoutMs);
  const learnerSubject=learner.status===200&&typeof learner.body?.learner?.subject==='string'
    ? learner.body.learner.subject
    : null;
  checks.push(result('learner-token-accesses-learner-route',learner.status===200&&Boolean(learnerSubject),{
    status:learner.status,
    requestId:learner.requestId,
    durationMs:learner.durationMs,
    subjectFingerprint:learnerSubject?fingerprint(learnerSubject):null
  }));

  const learnerAdmin=await call(fetchImpl,base,'/api/v1/admin/diagnostics',tokens.THC_VERIFY_LEARNER_TOKEN,timeoutMs);
  checks.push(result('learner-token-denied-admin-scope',learnerAdmin.status===403&&learnerAdmin.body?.error==='insufficient-scope',{
    status:learnerAdmin.status,
    requestId:learnerAdmin.requestId,
    error:learnerAdmin.body?.error??null
  }));

  const learnerEvaluator=await call(fetchImpl,base,'/api/v1/evaluator/capabilities',tokens.THC_VERIFY_LEARNER_TOKEN,timeoutMs);
  checks.push(result('learner-token-denied-evaluator-scope',learnerEvaluator.status===403&&learnerEvaluator.body?.error==='insufficient-scope',{
    status:learnerEvaluator.status,
    requestId:learnerEvaluator.requestId,
    error:learnerEvaluator.body?.error??null
  }));

  const evaluator=await call(fetchImpl,base,'/api/v1/evaluator/capabilities',tokens.THC_VERIFY_EVALUATOR_TOKEN,timeoutMs);
  const evaluatorSubject=evaluator.status===200&&typeof evaluator.body?.evaluator?.subject==='string'
    ? evaluator.body.evaluator.subject
    : null;
  checks.push(result('evaluator-token-accesses-evaluator-route',evaluator.status===200&&Boolean(evaluatorSubject),{
    status:evaluator.status,
    requestId:evaluator.requestId,
    durationMs:evaluator.durationMs,
    subjectFingerprint:evaluatorSubject?fingerprint(evaluatorSubject):null,
    practicalEvaluationAvailable:evaluator.body?.coursePracticalEvaluation===true
  }));

  const evaluatorAdmin=await call(fetchImpl,base,'/api/v1/admin/diagnostics',tokens.THC_VERIFY_EVALUATOR_TOKEN,timeoutMs);
  checks.push(result('evaluator-token-denied-admin-scope',evaluatorAdmin.status===403&&evaluatorAdmin.body?.error==='insufficient-scope',{
    status:evaluatorAdmin.status,
    requestId:evaluatorAdmin.requestId,
    error:evaluatorAdmin.body?.error??null
  }));

  const adminNoMfa=await call(fetchImpl,base,'/api/v1/admin/diagnostics',tokens.THC_VERIFY_ADMIN_NO_MFA_TOKEN,timeoutMs);
  checks.push(result('admin-without-mfa-denied',adminNoMfa.status===403&&adminNoMfa.body?.error==='admin-mfa-required',{
    status:adminNoMfa.status,
    requestId:adminNoMfa.requestId,
    error:adminNoMfa.body?.error??null
  }));

  const adminMfa=await call(fetchImpl,base,'/api/v1/admin/diagnostics',tokens.THC_VERIFY_ADMIN_MFA_TOKEN,timeoutMs);
  const adminSubject=adminMfa.status===200&&typeof adminMfa.body?.authenticatedSubject==='string'
    ? adminMfa.body.authenticatedSubject
    : null;
  checks.push(result('admin-with-mfa-accesses-admin-route',adminMfa.status===200&&adminMfa.body?.ok===true&&Boolean(adminSubject),{
    status:adminMfa.status,
    requestId:adminMfa.requestId,
    durationMs:adminMfa.durationMs,
    subjectFingerprint:adminSubject?fingerprint(adminSubject):null,
    storageAdapter:adminMfa.body?.storageAdapter??null,
    learnerStorageAdapter:adminMfa.body?.learnerStorageAdapter??null,
    practicalEvaluatorStorageAdapter:adminMfa.body?.practicalEvaluatorStorageAdapter??null
  }));

  const adminLearner=await call(fetchImpl,base,'/api/v1/me/progress',tokens.THC_VERIFY_ADMIN_MFA_TOKEN,timeoutMs);
  checks.push(result('admin-token-denied-learner-scope',adminLearner.status===403&&adminLearner.body?.error==='insufficient-scope',{
    status:adminLearner.status,
    requestId:adminLearner.requestId,
    error:adminLearner.body?.error??null
  }));

  const uniqueSubjects=[learnerSubject,evaluatorSubject,adminSubject].filter(Boolean);
  const distinctSubjects=new Set(uniqueSubjects).size===uniqueSubjects.length;
  checks.push(result('verification-identities-are-distinct',uniqueSubjects.length===3&&distinctSubjects,{
    subjectFingerprints:uniqueSubjects.map(fingerprint)
  }));

  const report={
    verificationType:'authenticated-production-scope-and-mfa-boundary',
    observedAt:new Date().toISOString(),
    baseUrl:base,
    passed:checks.every(x=>x.passed),
    checks,
    secretsIncluded:false,
    safeForEvidenceAttachment:true,
    limitations:[
      'This verifier confirms live authentication, scope separation, and admin MFA enforcement for the supplied short-lived test identities.',
      'It does not prove database row-level isolation between two learner identities, secure assessment bank integrity, backup/restore, monitoring, signing, revocation persistence, or independent security review.',
      'Tokens must be short-lived test credentials supplied through the process environment and must not be committed, echoed, or attached as evidence.',
      'A passing result does not authorize professional credential issuance.'
    ]
  };
  ensureNoTokenLeak(JSON.stringify(report),tokens);
  return report;
}

function parseArgs(argv){
  const out={};
  for(let i=0;i<argv.length;i+=1){
    if(!argv[i].startsWith('--')) continue;
    const k=argv[i].slice(2);
    out[k]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;
  }
  return out;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const args=parseArgs(process.argv.slice(2));
  try{
    const report=await verifyAuthenticatedProductionBoundaries({
      baseUrl:args['base-url']??process.env.THC_PUBLIC_BASE_URL,
      env:process.env,
      timeoutMs:args['timeout-ms']?Number(args['timeout-ms']):10_000
    });
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
    if(!report.passed) process.exitCode=1;
  }catch(error){
    console.error(`Authenticated production verification failed: ${error.message}`);
    process.exitCode=1;
  }
}
