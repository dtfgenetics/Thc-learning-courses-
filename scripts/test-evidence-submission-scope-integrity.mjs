import {buildOwnershipResolver} from './lib/evidence-submission-utils.mjs';

const ownership=buildOwnershipResolver();

function expectCourse(hit,course,program){
  const o=ownership.resolve(hit);
  if(!o.courseIds.includes(course)) throw new Error(JSON.stringify({hit,o,expectedCourse:course}));
  if(program&&!o.programIds.includes(program)) throw new Error(JSON.stringify({hit,o,expectedProgram:program}));
}

expectCourse(
  {dir:'content/reviews',record:{id:'TEST-REVIEW',objectId:'ITEM-LH-TECH1-001-001'}},
  'COURSE-LH-TECH1-001','CREDPROG-CULT-TECH-I-001'
);
expectCourse(
  {dir:'content/reviews',record:{id:'TEST-ASSESS-REVIEW',objectId:'ASSESS-LH-TECH1-001-FINAL'}},
  'COURSE-LH-TECH1-001','CREDPROG-CULT-TECH-I-001'
);
expectCourse(
  {dir:'content/calibration-evidence',record:{id:'TEST-CAL',assessmentId:'PRACTICAL-LH-TECH1-001-WORKFLOW'}},
  'COURSE-LH-TECH1-001','CREDPROG-CULT-TECH-I-001'
);
const gov=ownership.resolve({dir:'content/candidate-governance-approvals',record:{id:'TEST-GOV'}});
for(const p of ['CREDPROG-CULT-TECH-I-001','CREDPROG-CULT-TECH-II-001']){
  if(!gov.programIds.includes(p)) throw new Error('candidate governance missing ownership for '+p);
}
const prod=ownership.resolve({dir:'content/production-control-evidence',record:{id:'TEST-PROD',controlId:'backup-restore'}});
if(prod.controlIds.join(',')!=='backup-restore') throw new Error('production control ownership drift');

console.log('Evidence submission scope resolver: PASS (assessment items, assessments, practical calibration, candidate governance, production control).');
