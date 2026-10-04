import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const c=read('content/courses/COURSE-LH-TECH2-005.json');
assert.equal(c.title,'Propagation & Canopy Performance Troubleshooting');
assert.equal(c.finalAssessment,'ASSESS-LH-TECH2-005-FINAL');
assert.equal(c.extensions.mappedPractical,'PRACTICAL-TECH2-E-PROPAGATION-CANOPY-PERFORMANCE-REVIEW');
assert.equal(c.extensions.independentHighRiskInterventionAuthorityConferred,false);
for(const x of ['COMP-PROP-001','COMP-CANOPY-ADV-001','COMP-FLOWER-ADV-001','COMP-IPM-ADV-001','COMP-PRO-QA-001']) assert.ok(c.competencies.includes(x),x);
const f=read('content/assessments/ASSESS-LH-TECH2-005-FINAL.json'); const m=read('content/assessments/ASSESS-LH-TECH2-005-M01.json');
assert.equal(f.items.length,24); assert.equal(m.items.length,12); assert.equal(new Set([...f.items,...m.items]).size,36);
assert.equal(f.extensions?.courseDerivedAssessment,true,'Technician II Course 5 final must remain explicitly course-derived');
assert.equal(f.extensions?.encyclopediaSubstitutionAllowed,false,'Encyclopedia material cannot substitute for Tech II Course 5 instruction');
assert.equal(f.extensions?.untaughtMaterialAllowed,false,'Tech II Course 5 final cannot assess untaught material');
assert.equal(f.extensions?.unsupportedGenotypeClaimAllowed,false,'Course 5 assessment must not permit unsupported genotype claims');
assert.equal(f.extensions?.unsupportedContaminationClaimAllowed,false,'Course 5 assessment must not permit unsupported contamination claims');
assert.equal(f.extensions?.independentHighRiskInterventionAllowed,false,'Course 5 assessment must not confer high-risk intervention authority');
const mod=read('content/modules/MOD-LH-TECH2-005-PERFORMANCE.json');
const expectedObjectives=['LO-LH-TECH2-005-01','LO-LH-TECH2-005-02','LO-LH-TECH2-005-03','LO-LH-TECH2-005-04','LO-LH-TECH2-005-05','LO-LH-TECH2-005-06'];
const taughtMap=f.extensions?.taughtMaterialMap??{};
for(const objectiveId of expectedObjectives){
  assert.ok(Array.isArray(taughtMap[objectiveId])&&taughtMap[objectiveId].length>0,objectiveId+': final must map to dedicated taught material');
  for(const lessonId of taughtMap[objectiveId]){
    assert.match(lessonId,/^LESSON-LH-TECH2-005-/,objectiveId+': test-to-teaching map must stay inside Tech II Course 5');
    assert.ok(mod.lessons.includes(lessonId),objectiveId+': mapped lesson must belong to Tech II Course 5 module');
    const lesson=read('content/lessons/'+lessonId+'.json');
    assert.ok((lesson.learningObjectives??[]).includes(objectiveId),objectiveId+': mapped lesson '+lessonId+' must actually teach the objective');
  }
}
assert.ok(fs.existsSync('docs/learning-hub/tech2/course-005/TEST-TO-TEACHING-MAP.md'),'Tech II Course 5 must retain a human-readable test-to-teaching audit');

assert.equal(f.extensions.publicCredentialItemsExcluded,true); assert.ok(f.items.every(x=>x.startsWith('ITEM-LH-TECH2-005-')));
console.log('Technician II Course 005 propagation/canopy performance contract passed.');
