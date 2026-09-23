import assert from 'node:assert/strict';
import fs from 'node:fs';
const r=p=>JSON.parse(fs.readFileSync(p,'utf8'));const c=r('content/courses/COURSE-LH-TECH2-007.json');assert.equal(c.title,'Traceability, Production Metrics, Shift Coordination & Peer Support');assert.equal(c.finalAssessment,'ASSESS-LH-TECH2-007-FINAL');assert.equal(c.extensions.mappedPractical,'PRACTICAL-TECH2-G-TRACEABILITY-METRICS-SHIFT-COORDINATION');assert.equal(c.extensions.formalSupervisoryAuthorityConferred,false);assert.equal(c.extensions.unauthorizedControlledRecordEditAuthorityConferred,false);const f=r('content/assessments/ASSESS-LH-TECH2-007-FINAL.json'),m=r('content/assessments/ASSESS-LH-TECH2-007-M01.json');assert.equal(f.items.length,24);assert.equal(m.items.length,12);assert.equal(new Set([...f.items,...m.items]).size,36);
assert.equal(f.extensions?.courseDerivedAssessment,true,'Technician II Course 7 final must remain explicitly course-derived');
assert.equal(f.extensions?.encyclopediaSubstitutionAllowed,false,'Encyclopedia material cannot substitute for Tech II Course 7 instruction');
assert.equal(f.extensions?.untaughtMaterialAllowed,false,'Tech II Course 7 final cannot assess untaught material');
assert.equal(f.extensions?.formalSupervisoryAuthorityAllowed,false,'Course 7 assessment must not confer formal supervisory authority');
assert.equal(f.extensions?.unauthorizedControlledRecordEditAllowed,false,'Course 7 assessment must not confer uncontrolled record-edit authority');
const mod=r('content/modules/MOD-LH-TECH2-007-COORDINATION.json');
const expectedObjectives=['LO-LH-TECH2-007-01','LO-LH-TECH2-007-02','LO-LH-TECH2-007-03','LO-LH-TECH2-007-04','LO-LH-TECH2-007-05','LO-LH-TECH2-007-06'];
const taughtMap=f.extensions?.taughtMaterialMap??{};
for(const objectiveId of expectedObjectives){
  assert.ok(Array.isArray(taughtMap[objectiveId])&&taughtMap[objectiveId].length>0,objectiveId+': final must map to dedicated taught material');
  for(const lessonId of taughtMap[objectiveId]){
    assert.match(lessonId,/^LESSON-LH-TECH2-007-/,objectiveId+': test-to-teaching map must stay inside Tech II Course 7');
    assert.ok(mod.lessons.includes(lessonId),objectiveId+': mapped lesson must belong to Tech II Course 7 module');
    const lesson=r('content/lessons/'+lessonId+'.json');
    assert.ok((lesson.learningObjectives??[]).includes(objectiveId),objectiveId+': mapped lesson '+lessonId+' must actually teach the objective');
  }
}
assert.ok(fs.existsSync('docs/learning-hub/tech2/course-007/TEST-TO-TEACHING-MAP.md'),'Tech II Course 7 must retain a human-readable test-to-teaching audit');
assert.ok(f.items.every(x=>x.startsWith('ITEM-LH-TECH2-007-')));console.log('Technician II Course 007 traceability/metrics/coordination contract passed.');
