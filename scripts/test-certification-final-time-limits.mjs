import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(rel)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const execution=read('registry/certification-validation-execution.json');
const courses=execution.courses ?? execution.courseValidation ?? execution.entries ?? [];
const finals=courses.filter((row)=>row.conventionalFinal===true && row.finalAssessmentId).map((row)=>row.finalAssessmentId);
assert.equal(finals.length,13,'canonical Technician curriculum must expose exactly 13 conventional finals');

for(const id of finals){
  const assessment=read(`content/assessments/${id}.json`);
  assert.equal(assessment.purpose,'summative',`${id}: conventional final must be summative`);
  assert.ok(Number.isInteger(assessment.timeLimitMinutes),`${id}: timeLimitMinutes must be an integer`);
  assert.ok(assessment.timeLimitMinutes>=30 && assessment.timeLimitMinutes<=120,`${id}: time limit must remain in the controlled 30–120 minute range`);
  assert.equal(assessment.accommodations?.allowExtendedTime,true,`${id}: timed final must preserve extended-time accommodation support`);
  assert.equal(assessment.feedbackMode,'post-attempt-domain-level',`${id}: final must not reveal answer-key feedback during the attempt`);
}
console.log(`Certification final timing contract passed for ${finals.length} conventional finals.`);
