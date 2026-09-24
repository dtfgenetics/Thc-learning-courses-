import {spawnSync} from 'node:child_process';

const run=spawnSync(process.execPath,['scripts/report-certification-release-dependencies.mjs','--json'],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.summary.canonicalCourses!==15) throw new Error(`expected 15 courses, got ${out.summary.canonicalCourses}`);
if(out.summary.programs!==2) throw new Error(`expected 2 credential programs, got ${out.summary.programs}`);
if(out.summary.productionControlsTotal!==13) throw new Error(`expected 13 production controls, got ${out.summary.productionControlsTotal}`);
for(const p of out.programs){
  if(p.requiredCourses<7) throw new Error(`${p.credentialProgramId}: incomplete required-course mapping`);
  if(!Array.isArray(p.approvalBlockers)||!Array.isArray(p.evidenceBlockers)) throw new Error(`${p.credentialProgramId}: missing dependency blocker arrays`);
}
for(const c of out.courses){
  if(!Array.isArray(c.openDependencies)) throw new Error(`${c.courseId}: missing openDependencies`);
}
if(out.dependencyContradictions.length!==0){
  throw new Error('current repository contains release dependency contradictions: '+out.dependencyContradictions.join('; '));
}
console.log('Certification release dependency graph: PASS (15 courses, 2 programs, 13 production controls, no premature release evidence).');
