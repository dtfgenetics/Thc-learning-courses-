import {spawnSync} from 'node:child_process';

const run=spawnSync(process.execPath,['scripts/report-certification-execution-work-queue.mjs','--json'],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.summary.totalOpenWorkItems<1) throw new Error('expected open validation work while credential release remains blocked');
if(out.summary.courseWorkItems<1) throw new Error('expected course-level evidence work');
if(out.summary.programWorkItems<1) throw new Error('expected program-level evidence work');
if(out.summary.productionWorkItems<1) throw new Error('expected production evidence work');
if(!Array.isArray(out.immediateQueue)||!Array.isArray(out.blockedQueue)) throw new Error('work queues missing');
for(const item of out.immediateQueue){
  if(['blocked','blocked-for-approval','closed'].includes(item.executionState)) throw new Error('blocked item leaked into immediate queue');
}
const programAuth=out.all.filter(x=>x.scope==='program'&&x.gate==='credentialAuthorization');
if(programAuth.length!==2) throw new Error(`expected 2 program credential-authorization work items, got ${programAuth.length}`);
if(programAuth.some(x=>x.executionState==='ready'||x.executionState==='ready-for-approval')){
  throw new Error('credential authorization became executable before prerequisite evidence closed');
}
console.log('Certification execution work queue: PASS (dependency-aware immediate and blocked queues).');
