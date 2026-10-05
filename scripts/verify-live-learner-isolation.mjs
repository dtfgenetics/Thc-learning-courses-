function requireHttpsBaseUrl(value){
  const raw=String(value??'').trim().replace(/\/$/,'');
  if(!raw) throw new Error('Learner isolation verification requires --base-url or THC_PUBLIC_BASE_URL');
  let parsed; try{parsed=new URL(raw);}catch{throw new Error('Production base URL must be a valid URL');}
  if(parsed.protocol!=='https:') throw new Error('Production base URL must use https');
  return parsed.toString().replace(/\/$/,'');
}
function requireToken(env,name){
  const value=String(env[name]??'').trim();
  if(!value) throw new Error(`Missing required ephemeral verification token: ${name}`);
  return value;
}
async function safeJson(response){try{return await response.json();}catch{return null;}}
async function call(fetchImpl,base,path,token,{method='GET',body=null,timeoutMs=10000}={}){
  const headers={accept:'application/json',authorization:`Bearer ${token}`,'user-agent':'thc-academy-learner-isolation-verifier/1.0'};
  if(body!==null) headers['content-type']='application/json';
  const response=await fetchImpl(`${base}${path}`,{
    method,headers,body:body===null?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(timeoutMs)
  });
  return {status:response.status,body:await safeJson(response),requestId:response.headers.get('x-request-id')??null};
}
function hasMarker(progress,lessonId){
  return Array.isArray(progress)&&progress.some(row=>row?.lessonId===lessonId&&row?.status==='in-progress');
}
function result(name,passed,meta={}){return {name,passed:passed===true,...meta};}
function assertNoLeak(serialized,tokens){for(const token of tokens) if(serialized.includes(token)) throw new Error('Verifier output attempted to include an ephemeral access token');}

export async function verifyLearnerIsolation({
  baseUrl,
  env=process.env,
  fetchImpl=fetch,
  timeoutMs=10000,
  markerA='LESSON-OPS-ISOLATION-A',
  markerB='LESSON-OPS-ISOLATION-B'
}={}){
  const base=requireHttpsBaseUrl(baseUrl??env.THC_PUBLIC_BASE_URL);
  const tokenA=requireToken(env,'THC_VERIFY_LEARNER_A_TOKEN');
  const tokenB=requireToken(env,'THC_VERIFY_LEARNER_B_TOKEN');
  if(tokenA===tokenB) throw new Error('Learner A and learner B tokens must be different');

  const checks=[];
  const reset=async(token,lessonId)=>call(fetchImpl,base,`/api/v1/me/lessons/${lessonId}`,token,{
    method:'PUT',body:{lessonVersion:'1',status:'not-started'},timeoutMs
  });
  const mark=async(token,lessonId)=>call(fetchImpl,base,`/api/v1/me/lessons/${lessonId}`,token,{
    method:'PUT',body:{lessonVersion:'1',status:'in-progress'},timeoutMs
  });
  const read=async(token)=>call(fetchImpl,base,'/api/v1/me/progress',token,{timeoutMs});

  await reset(tokenA,markerA);
  await reset(tokenB,markerB);

  try{
    const writeA=await mark(tokenA,markerA);
    checks.push(result('learner-a-write-succeeds',writeA.status===200&&writeA.body?.progress?.lessonId===markerA,{status:writeA.status,requestId:writeA.requestId}));

    const readA=await read(tokenA);
    checks.push(result('learner-a-sees-own-marker',readA.status===200&&hasMarker(readA.body?.progress,markerA),{status:readA.status,requestId:readA.requestId}));

    const readBafterA=await read(tokenB);
    checks.push(result('learner-b-cannot-see-learner-a-marker',readBafterA.status===200&&!hasMarker(readBafterA.body?.progress,markerA),{status:readBafterA.status,requestId:readBafterA.requestId}));

    const writeB=await mark(tokenB,markerB);
    checks.push(result('learner-b-write-succeeds',writeB.status===200&&writeB.body?.progress?.lessonId===markerB,{status:writeB.status,requestId:writeB.requestId}));

    const readB=await read(tokenB);
    checks.push(result('learner-b-sees-own-marker',readB.status===200&&hasMarker(readB.body?.progress,markerB),{status:readB.status,requestId:readB.requestId}));

    const readAafterB=await read(tokenA);
    checks.push(result('learner-a-cannot-see-learner-b-marker',readAafterB.status===200&&!hasMarker(readAafterB.body?.progress,markerB),{status:readAafterB.status,requestId:readAafterB.requestId}));
  } finally {
    await Promise.allSettled([reset(tokenA,markerA),reset(tokenB,markerB)]);
  }

  const report={
    verificationType:'authenticated-learner-subject-isolation',
    observedAt:new Date().toISOString(),
    baseUrl:base,
    passed:checks.every(x=>x.passed),
    checks,
    cleanupAttempted:true,
    safeForEvidenceAttachment:true,
    secretsIncluded:false,
    limitations:[
      'This verifier demonstrates learner-subject isolation through the deployed application persistence API using dedicated test identities.',
      'It does not independently prove database RLS policy correctness against direct database access or privileged bypass roles.',
      'Use only dedicated short-lived learner test identities; never ordinary learner accounts.',
      'A passing result does not authorize professional credential issuance.'
    ]
  };
  assertNoLeak(JSON.stringify(report),[tokenA,tokenB]);
  return report;
}

function parseArgs(argv){const out={};for(let i=0;i<argv.length;i+=1){if(!argv[i].startsWith('--'))continue;const k=argv[i].slice(2);out[k]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}return out;}

if(import.meta.url===`file://${process.argv[1]}`){
  const args=parseArgs(process.argv.slice(2));
  try{
    const report=await verifyLearnerIsolation({baseUrl:args['base-url']??process.env.THC_PUBLIC_BASE_URL,env:process.env});
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
    if(!report.passed) process.exitCode=1;
  }catch(error){
    console.error(`Learner isolation verification failed: ${error.message}`);
    process.exitCode=1;
  }
}
