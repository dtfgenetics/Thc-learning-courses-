import crypto from 'node:crypto';

const PROTECTED_TABLES=[
  'learners',
  'academy_applications',
  'enrollments',
  'lesson_progress',
  'assessment_attempts',
  'assessment_attempt_items',
  'learner_competencies',
  'performance_assessment_results',
  'learner_portfolio_artifacts'
];

function required(env,name){
  const value=String(env[name]??'').trim();
  if(!value) throw new Error(`Missing required RLS verification setting: ${name}`);
  return value;
}
function uuid(value,name){
  const v=required({[name]:value},name);
  if(!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v)) throw new Error(`${name} must be a UUID`);
  return v.toLowerCase();
}
function validateDatabaseUrl(value){
  let parsed; try{parsed=new URL(value);}catch{throw new Error('THC_VERIFY_RLS_DATABASE_URL must be a valid PostgreSQL URL');}
  if(!['postgres:','postgresql:'].includes(parsed.protocol)) throw new Error('THC_VERIFY_RLS_DATABASE_URL must use postgres or postgresql');
  const ssl=String(parsed.searchParams.get('sslmode')??'').toLowerCase();
  if(!['require','verify-ca','verify-full'].includes(ssl)) throw new Error('THC_VERIFY_RLS_DATABASE_URL must require TLS');
  return value;
}
function fp(value){return crypto.createHash('sha256').update(value).digest('hex').slice(0,16);}
async function defaultClientFactory(connectionString){
  let pg;
  try{pg=await import('pg');}catch{throw new Error('Direct RLS verification requires pg to be installed in the operator/runtime environment');}
  const Client=pg.Client??pg.default?.Client;
  const client=new Client({connectionString});
  await client.connect();
  return client;
}
async function one(client,text,params=[]){
  const result=await client.query(text,params);
  return result.rows?.[0]??null;
}

export async function verifyDirectRls({
  env=process.env,
  clientFactory=defaultClientFactory
}={}){
  const connectionString=validateDatabaseUrl(required(env,'THC_VERIFY_RLS_DATABASE_URL'));
  const learnerA=uuid(env.THC_VERIFY_RLS_LEARNER_A_ID,'THC_VERIFY_RLS_LEARNER_A_ID');
  const learnerB=uuid(env.THC_VERIFY_RLS_LEARNER_B_ID,'THC_VERIFY_RLS_LEARNER_B_ID');
  if(learnerA===learnerB) throw new Error('RLS learner A and learner B IDs must be different');

  const client=await clientFactory(connectionString);
  const checks=[];
  try{
    const role=await one(client,`select current_user as role_name, rolsuper, rolbypassrls from pg_roles where rolname=current_user`);
    checks.push({name:'validation-role-not-superuser',passed:role?.rolsuper===false});
    checks.push({name:'validation-role-not-bypassrls',passed:role?.rolbypassrls===false});

    const tableState=await client.query(
      `select c.relname as table_name, c.relrowsecurity, c.relforcerowsecurity
         from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname=current_schema() and c.relname=any($1::text[])
        order by c.relname`,
      [PROTECTED_TABLES]
    );
    const byTable=new Map((tableState.rows??[]).map(r=>[r.table_name,r]));
    const tableChecks=PROTECTED_TABLES.map(table=>{
      const r=byTable.get(table);
      return {table,enabled:r?.relrowsecurity===true,forced:r?.relforcerowsecurity===true};
    });
    checks.push({name:'protected-tables-have-enabled-forced-rls',passed:tableChecks.every(x=>x.enabled&&x.forced),tables:tableChecks});

    const policies=await client.query(
      `select tablename,count(*)::int as policy_count
         from pg_policies
        where schemaname=current_schema() and tablename=any($1::text[])
        group by tablename order by tablename`,
      [PROTECTED_TABLES]
    );
    const policyMap=new Map((policies.rows??[]).map(r=>[r.tablename,Number(r.policy_count)]));
    checks.push({
      name:'protected-tables-have-policies',
      passed:PROTECTED_TABLES.every(t=>(policyMap.get(t)??0)>0),
      policyCounts:Object.fromEntries(PROTECTED_TABLES.map(t=>[t,policyMap.get(t)??0]))
    });

    await client.query('begin read only');
    try{
      await client.query(`select set_config('thc.learner_id',$1,true)`,[learnerA]);
      const aSelf=await one(client,'select count(*)::int as n from learners where id=$1',[learnerA]);
      const aOther=await one(client,'select count(*)::int as n from learners where id=$1',[learnerB]);
      checks.push({name:'learner-a-sees-self-only',passed:Number(aSelf?.n)===1&&Number(aOther?.n)===0,selfCount:Number(aSelf?.n??0),otherCount:Number(aOther?.n??0)});

      await client.query(`select set_config('thc.learner_id',$1,true)`,[learnerB]);
      const bSelf=await one(client,'select count(*)::int as n from learners where id=$1',[learnerB]);
      const bOther=await one(client,'select count(*)::int as n from learners where id=$1',[learnerA]);
      checks.push({name:'learner-b-sees-self-only',passed:Number(bSelf?.n)===1&&Number(bOther?.n)===0,selfCount:Number(bSelf?.n??0),otherCount:Number(bOther?.n??0)});
    } finally {
      await client.query('rollback');
    }

    return {
      verificationType:'direct-postgres-rls',
      observedAt:new Date().toISOString(),
      passed:checks.every(x=>x.passed),
      roleFingerprint:fp(String(role?.role_name??'unknown')),
      learnerFingerprints:[fp(learnerA),fp(learnerB)],
      checks,
      safeForEvidenceAttachment:true,
      secretsIncluded:false,
      limitations:[
        'This verifier performs read-only direct PostgreSQL checks using two dedicated synthetic learner rows and a non-superuser, non-BYPASSRLS validation role.',
        'It verifies deployed RLS flags/policies and bilateral learner-row visibility at the database layer.',
        'It does not validate service/admin write-role privileges, backup/restore, secure assessment form behavior, monitoring, signing, revocation, or professional credential authorization.'
      ]
    };
  } finally {
    await client.end();
  }
}

if(import.meta.url===`file://${process.argv[1]}`){
  try{
    const report=await verifyDirectRls({env:process.env});
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
    if(!report.passed) process.exitCode=1;
  }catch(error){
    console.error(`Direct RLS verification failed: ${error.message}`);
    process.exitCode=1;
  }
}
