import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists=(p)=>fs.existsSync(path.join(root,p));
const course=read('content/courses/COURSE-LH-TECH1-003.json');
assert.equal(course.status,'draft');
assert.equal(course.finalAssessment,'ASSESS-LH-TECH1-003-FINAL');
assert.ok(course.modules.includes('MOD-LH-TECH1-003-MONITORING'));
assert.equal(course.extensions?.dedicatedCourseAssessmentRequired,false);
assert.equal(course.extensions?.dedicatedPerformanceValidationRequired,true);
assert.equal(course.extensions?.dedicatedItemCount,32);
const module=read('content/modules/MOD-LH-TECH1-003-MONITORING.json');
assert.equal(module.lessons.length,4);
for(const id of module.lessons){assert.ok(exists(`content/lessons/${id}.json`));const l=read(`content/lessons/${id}.json`);assert.ok(l.estimatedMinutes>=45);for(const o of l.learningObjectives)assert.ok(exists(`content/learning-objectives/${o}.json`));}
const formative=read('content/assessments/ASSESS-LH-TECH1-003-M01.json');
const final=read('content/assessments/ASSESS-LH-TECH1-003-FINAL.json');
assert.equal(formative.items.length,12);assert.equal(final.items.length,20);assert.equal(new Set([...formative.items,...final.items]).size,32);
const objectives=new Map(final.objectives.map(x=>[x,0]));const keys=[0,0,0,0];let high=0;
for(const id of final.items){const q=read(`content/questions/${id}.json`);assert.equal(q.purpose,'summative');assert.ok(q.references.length);objectives.set(q.objective,objectives.get(q.objective)+1);keys[q.correct]++;if(['apply','analyze','evaluate','create'].includes(q.bloomLevel))high++;}
for(const [id,n] of objectives)assert.ok(n>=4,`${id} needs >=4 summative items, found ${n}`);assert.ok(high>=18);assert.ok(Math.max(...keys)<=6,`unbalanced key positions: ${keys}`);
for(const id of formative.items){const q=read(`content/questions/${id}.json`);assert.equal(q.purpose,'formative');}
console.log('Course 003 production slice passed: four lessons, five objectives, 12 distinct formative items and 20 balanced summative items are draft-wired.');
