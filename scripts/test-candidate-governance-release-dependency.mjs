import {spawnSync} from 'node:child_process';

function run(script,args=[]){
  const r=spawnSync(process.execPath,[script,...args],{cwd:process.cwd(),encoding:'utf8'});
  if(r.status!==0) throw new Error(r.stderr||r.stdout);
  return JSON.parse(r.stdout);
}
const deps=run('scripts/report-certification-release-dependencies.mjs',['--json']);
const queue=run('scripts/report-certification-execution-work-queue.mjs',['--json']);

if(typeof deps.summary.candidateGovernanceApprovedAndApplied!=='boolean') throw new Error('release dependency summary missing candidate-governance application state');
for(const p of deps.programs){
  if(!p.candidateGovernance) throw new Error(p.credentialProgramId+': candidateGovernance dependency missing');
  const blockers=p.approvalBlockers.filter(x=>x.scope==='candidate-governance');
  if(deps.summary.candidateGovernanceApprovedAndApplied && blockers.length) throw new Error(p.credentialProgramId+': stale candidate-governance blocker after approval/application');
  if(!deps.summary.candidateGovernanceApprovedAndApplied && blockers.length!==1) throw new Error(p.credentialProgramId+': expected exactly one candidate-governance approval blocker');
}

const shared=queue.all.filter(x=>x.scope==='shared-governance'&&x.gate==='candidateGovernance');
if(deps.summary.candidateGovernanceApprovedAndApplied && shared.length!==0) throw new Error('candidate-governance work item remained after approval/application');
if(!deps.summary.candidateGovernanceApprovedAndApplied && shared.length!==1) throw new Error('expected one shared candidate-governance work item while unresolved');

const auth=queue.all.filter(x=>x.scope==='program'&&x.gate==='credentialAuthorization');
if(!deps.summary.candidateGovernanceApprovedAndApplied){
  for(const x of auth){
    if(!x.dependencies.some(d=>d.scope==='candidate-governance')) throw new Error(x.credentialProgramId+': credential authorization missing candidate-governance dependency');
  }
}
console.log('Candidate governance release dependency: PASS');
