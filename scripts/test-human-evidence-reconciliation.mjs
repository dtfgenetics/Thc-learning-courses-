import {spawnSync} from 'node:child_process';

const run=spawnSync(process.execPath,['scripts/report-certification-evidence-reconciliation.mjs','--json'],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.canonicalCourses!==15) throw new Error(`expected 15 canonical courses, found ${out.canonicalCourses}`);
for(const row of out.courses){
  for(const gateName of ['pilotExecution','accessibilityUxHumanReview']){
    const gate=row.gates?.[gateName];
    if(!gate) throw new Error(`${row.courseId} missing ${gateName}`);
    if(!['prepared','in-progress','evidence-complete','approved','revision-required'].includes(gate.status)){
      throw new Error(`${row.courseId} invalid ${gateName} state ${gate.status}`);
    }
    if(!['derived','attestation','derived-with-rejected-attestation'].includes(gate.source)){
      throw new Error(`${row.courseId} ${gateName} must be evidence-derived; got ${gate.source}`);
    }
  }
}
console.log('Pilot and accessibility evidence reconciliation mapping passed for all 15 canonical courses.');
