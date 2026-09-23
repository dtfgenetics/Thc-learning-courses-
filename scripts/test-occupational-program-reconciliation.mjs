import {spawnSync} from 'node:child_process';

const run=spawnSync(process.execPath,['scripts/report-certification-evidence-reconciliation.mjs','--json'],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.canonicalCourses!==15) throw new Error(`expected 15 canonical courses, found ${out.canonicalCourses}`);
if(!out.gateSummary?.occupationalProgramValidation) throw new Error('occupationalProgramValidation missing from gate summary');

const tracks=new Map();
for(const row of out.courses){
  const gate=row.gates?.occupationalProgramValidation;
  if(!gate) throw new Error(`${row.courseId} missing occupationalProgramValidation`);
  if(!['prepared','in-progress','evidence-complete','approved','revision-required'].includes(gate.status)){
    throw new Error(`${row.courseId} invalid occupationalProgramValidation status ${gate.status}`);
  }
  if(!['derived','attestation','derived-with-rejected-attestation'].includes(gate.source)){
    throw new Error(`${row.courseId} occupationalProgramValidation must be evidence-derived; got ${gate.source}`);
  }
  const programId=gate.detail?.credentialProgramId;
  if(programId) tracks.set(row.track,programId);
}
if(tracks.get('Technician I') && tracks.get('Technician I')!=='CREDPROG-CULT-TECH-I-001') throw new Error('Technician I mapped to wrong credential program');
if(tracks.get('Technician II') && tracks.get('Technician II')!=='CREDPROG-CULT-TECH-II-001') throw new Error('Technician II mapped to wrong credential program');

if(out.allCoursesReleaseReady===true){
  for(const row of out.courses){
    if(row.gates.occupationalProgramValidation.status!=='approved') throw new Error('release-ready state bypassed occupational program validation');
  }
}
console.log('Occupational program validation is enforced across all 15 canonical courses.');
