import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const course=read('content/courses/COURSE-LH-PCS-002.json');
assert.equal(course.status,'draft');
assert.equal(course.credentialBearing,false);
assert.equal(course.finalAssessment,'ASSESS-LH-PCS-002-FINAL');
const mod=read('content/modules/MOD-LH-PCS-002-DONOR-IDENTITY.json');
assert.equal(mod.lessons.length,5);
const assessment=read('content/assessments/ASSESS-LH-PCS-002-FINAL.json');
assert.equal(assessment.items.length,15);
assert.equal(assessment.totalItems,15);
assert.equal(assessment.extensions.credentialUseAuthorized,false);
for(let i=1;i<=5;i++){const n=String(i).padStart(2,'0');const lesson=read(`content/lessons/LESSON-LH-PCS-002-${n}.json`);const lo=read(`content/learning-objectives/LO-LH-PCS-002-${n}.json`);assert.equal(lesson.learningObjectives[0],lo.id);assert.ok(lesson.references.length>0);}
for(const id of assessment.items){const item=read(`content/questions/${id}.json`);assert.equal(item.extensions.specialistCourse,course.id);assert.ok(item.references.length>0);assert.ok(Number.isInteger(item.correct)&&item.correct>=0&&item.correct<item.choices.length);}
console.log('PCS Course 002 structure and seed bank validated');
