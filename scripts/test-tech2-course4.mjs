import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const course=read('content/courses/COURSE-LH-TECH2-004.json');const finalA=read('content/assessments/ASSESS-LH-TECH2-004-FINAL.json');const formA=read('content/assessments/ASSESS-LH-TECH2-004-M01.json');const practical=read('content/performance-assessments/PRACTICAL-TECH2-D-IPM-TREND-TREATMENT-FOLLOWUP.json');
assert.equal(course.version,'0.2.0');assert.equal(course.status,'draft');assert.equal(course.finalAssessment,finalA.id);assert.equal(course.extensions.mappedPractical,practical.id);assert.equal(course.extensions.pesticideApplicatorAuthorityConferred,false);assert.equal(finalA.items.length,24);assert.equal(formA.items.length,12);
assert.equal(finalA.extensions?.courseDerivedAssessment,true,'Technician II Course 4 final must remain explicitly course-derived');
assert.equal(finalA.extensions?.encyclopediaSubstitutionAllowed,false,'Encyclopedia material cannot substitute for Tech II Course 4 instruction');
assert.equal(finalA.extensions?.untaughtMaterialAllowed,false,'Tech II Course 4 final cannot assess untaught material');
assert.equal(finalA.extensions?.pesticideTreatmentAuthorityAllowed,false,'Course 4 assessment must not confer pesticide/treatment authority');
const mod=read('content/modules/MOD-LH-TECH2-004-IPM.json');
const expectedObjectives=['LO-LH-TECH2-004-01','LO-LH-TECH2-004-02','LO-LH-TECH2-004-03','LO-LH-TECH2-004-04','LO-LH-TECH2-004-05','LO-LH-TECH2-004-06'];
const taughtMap=finalA.extensions?.taughtMaterialMap??{};
for(const objectiveId of expectedObjectives){
  assert.ok(Array.isArray(taughtMap[objectiveId])&&taughtMap[objectiveId].length>0,objectiveId+': final must map to dedicated taught material');
  for(const lessonId of taughtMap[objectiveId]){
    assert.match(lessonId,/^LESSON-LH-TECH2-004-/,objectiveId+': test-to-teaching map must stay inside Tech II Course 4');
    assert.ok(mod.lessons.includes(lessonId),objectiveId+': mapped lesson must belong to Tech II Course 4 module');
    const lesson=read('content/lessons/'+lessonId+'.json');
    assert.ok((lesson.learningObjectives??[]).includes(objectiveId),objectiveId+': mapped lesson '+lessonId+' must actually teach the objective');
  }
}
assert.ok(fs.existsSync('docs/learning-hub/tech2/course-004/TEST-TO-TEACHING-MAP.md'),'Tech II Course 4 must retain a human-readable test-to-teaching audit');
assert.equal(new Set(finalA.items.filter(id=>formA.items.includes(id))).size,0);for(const id of [...finalA.items,...formA.items])assert.equal(id.startsWith('ITEM-TECH2-'),false,'public credential item leaked into course grading: '+id);for(const comp of practical.competencies)assert.ok(course.competencies.includes(comp),'Practical D competency not mapped: '+comp);assert.equal(finalA.blueprint.reduce((s,r)=>s+r.items,0),24);console.log('Technician II Course 004 instruction, bank isolation, treatment-authority boundary and Practical D alignment passed.');
