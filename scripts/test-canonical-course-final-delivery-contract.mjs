import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const tech1=Array.from({length:7},(_,i)=>`COURSE-LH-TECH1-${String(i+1).padStart(3,'0')}`);
const tech2=Array.from({length:8},(_,i)=>`COURSE-LH-TECH2-${String(i+1).padStart(3,'0')}`);
const expectedIntegrated=new Set(['COURSE-LH-TECH1-007','COURSE-LH-TECH2-008']);
let conventional=0;

for(const courseId of [...tech1,...tech2]){
  const course=read(`content/courses/${courseId}.json`);
  assert.equal(course.status,'published',`${courseId}: canonical academic course must remain published`);
  if(expectedIntegrated.has(courseId)){
    assert.equal(course.finalAssessment,null,`${courseId}: integrated performance course must not gain a fabricated ordinary final`);
    continue;
  }
  assert.ok(course.finalAssessment,`${courseId}: conventional course must map a final`);
  const assessment=read(`content/assessments/${course.finalAssessment}.json`);
  conventional++;
  assert.equal(assessment.status,'published',`${courseId}: final must be published academic content`);
  assert.equal(assessment.purpose,'summative',`${courseId}: final must be summative`);
  assert.equal(assessment.extensions?.courseId,courseId,`${courseId}: final must be course-owned`);
  assert.equal(assessment.extensions?.courseDerivedAssessment,true,`${courseId}: final must remain course-derived`);
  assert.equal(assessment.extensions?.encyclopediaSubstitutionAllowed,false,`${courseId}: encyclopedia substitution must remain blocked`);
  assert.equal(assessment.extensions?.untaughtMaterialAllowed,false,`${courseId}: untaught scored material must remain blocked`);
  assert.ok(Number.isInteger(assessment.timeLimitMinutes)&&assessment.timeLimitMinutes>=30&&assessment.timeLimitMinutes<=120,`${courseId}: final must have a reasonable explicit academic time limit`);
  assert.ok(Number(assessment.passingScorePercent)>0&&Number(assessment.passingScorePercent)<=100,`${courseId}: final must declare a passing threshold`);
  assert.equal(assessment.feedbackMode,'post-attempt-domain-level',`${courseId}: final must not self-verify item answers during the attempt`);
  assert.equal(assessment.randomizeItems,true,`${courseId}: final item order should be randomized`);
  assert.equal(assessment.randomizeChoices,true,`${courseId}: final choice order should be randomized`);
  assert.ok(Array.isArray(assessment.items)&&assessment.items.length>=20,`${courseId}: conventional final must contain a substantive course-owned item set`);
}

assert.equal(conventional,13,'Canonical Technician curriculum must retain exactly 13 conventional finals plus two integrated performance courses');
console.log('Canonical Technician final delivery contract: PASS (13 timed server-graded finals; 2 intentional integrated performance courses)');
