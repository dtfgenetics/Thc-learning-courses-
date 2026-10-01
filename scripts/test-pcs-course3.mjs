import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const course=read('content/courses/COURSE-LH-PCS-003.json');
assert.equal(course.status,'draft');
assert.equal(course.credentialBearing,false);
assert.equal(course.finalAssessment,'ASSESS-LH-PCS-003-FINAL');
assert.equal(course.extensions.plannedCredentialProgram,'CREDPROG-PROP-CLEAN-STOCK-001');
const mod=read('content/modules/MOD-LH-PCS-003-CLONING-ROOTING-ACCLIMATION.json');
assert.equal(mod.lessons.length,5);
const assessment=read('content/assessments/ASSESS-LH-PCS-003-FINAL.json');
assert.equal(assessment.items.length,15);
assert.equal(assessment.totalItems,15);
assert.equal(assessment.extensions.credentialUseAuthorized,false);
for(let i=1;i<=5;i++){
  const n=String(i).padStart(2,'0');
  const lesson=read(`content/lessons/LESSON-LH-PCS-003-${n}.json`);
  const lo=read(`content/learning-objectives/LO-LH-PCS-003-${n}.json`);
  assert.equal(lesson.learningObjectives[0],lo.id);
  assert.ok(lesson.references.length>0);
  assert.ok(lesson.content.sections.length>=3);
}
for(const id of assessment.items){
  const item=read(`content/questions/${id}.json`);
  assert.equal(item.extensions.specialistCourse,course.id);
  assert.ok(item.references.length>0);
  assert.ok(Number.isInteger(item.correct)&&item.correct>=0&&item.correct<item.choices.length);
}
assert.ok(course.evidencePolicy.includes('does not convert study-specific values into universal setpoints'));
console.log('PCS Course 003 structure, evidence boundary and seed bank validated');
