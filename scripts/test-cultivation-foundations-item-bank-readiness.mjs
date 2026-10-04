import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const assessment=read('content/assessments/ASSESS-CULT-FOUNDATIONS-FINAL-001.json');
const readiness=read('registry/cultivation-foundations-item-bank-readiness.json');
const questionDir=path.join(root,'content/questions');
const questions=fs.readdirSync(questionDir)
  .filter((name)=>name.endsWith('.json'))
  .map((name)=>read(path.join('content/questions',name)));

assert.equal(readiness.assessmentId,assessment.id);
assert.equal(readiness.minimumCandidateItemsPerCompetency,15);
assert.equal(readiness.minimumActiveItemsPerCompetency,assessment.itemSelection.minimumActiveItemsPerCompetency);
assert.equal(readiness.targetBankItemsPerCompetency,assessment.itemSelection.targetBankItemsPerCompetency);

const rows=[];
for(const bp of assessment.blueprint){
  const pool=questions.filter((q)=>q.competency===bp.competency && ['summative','credential'].includes(q.purpose));
  const active=pool.filter((q)=>q.status==='active');
  rows.push({competency:bp.competency,candidates:pool.length,active:active.length});
  assert.ok(pool.length>=readiness.minimumCandidateItemsPerCompetency,
    `${bp.competency}: candidate pool has ${pool.length}; minimum is ${readiness.minimumCandidateItemsPerCompetency}`);
}
assert.equal(rows.length,12,'Cultivation Foundations blueprint must contain 12 competencies');
assert.equal(readiness.candidateDepthComplete,true,'candidate-depth gate should remain true while all competency pools satisfy the tested minimum');

const productionReady=rows.every((row)=>row.active>=readiness.minimumActiveItemsPerCompetency);
assert.equal(readiness.activeDepthComplete,productionReady,
  `activeDepthComplete registry drift: computed ${productionReady}; rows=${JSON.stringify(rows)}`);

console.log(JSON.stringify({
  state:readiness.state,
  candidateDepthComplete:true,
  activeDepthComplete:productionReady,
  totalCandidates:rows.reduce((n,row)=>n+row.candidates,0),
  totalActive:rows.reduce((n,row)=>n+row.active,0),
  competencies:rows
},null,2));
