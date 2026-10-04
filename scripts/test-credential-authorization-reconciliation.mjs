import {spawnSync} from 'node:child_process';

const run=spawnSync(process.execPath,['scripts/report-certification-evidence-reconciliation.mjs','--json'],{
  cwd:process.cwd(),encoding:'utf8'
});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.canonicalCourses!==15) throw new Error(`expected 15 canonical courses, found ${out.canonicalCourses}`);
for(const row of out.courses){
  const gate=row.gates?.credentialAuthorization;
  if(!gate) throw new Error(`${row.courseId} missing credentialAuthorization gate`);
  if(!['prepared','in-progress','evidence-complete','approved','revision-required'].includes(gate.status)){
    throw new Error(`${row.courseId} has invalid credentialAuthorization state ${gate.status}`);
  }
  if(gate.source!=='derived' && gate.source!=='attestation' && gate.source!=='derived-with-rejected-attestation'){
    throw new Error(`${row.courseId} credentialAuthorization must be evidence-derived, got source ${gate.source}`);
  }
  if(gate.detail?.credentialProgramId && !['CREDPROG-CULT-TECH-I-001','CREDPROG-CULT-TECH-II-001'].includes(gate.detail.credentialProgramId)){
    throw new Error(`${row.courseId} mapped to unexpected credential program ${gate.detail.credentialProgramId}`);
  }
}
console.log('Credential authorization reconciliation mapping passed for all 15 canonical courses.');
