import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const course=read('content/courses/COURSE-LH-TECH2-003.json');
const program=read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');
const finalA=read('content/assessments/ASSESS-LH-TECH2-003-FINAL.json');
const formA=read('content/assessments/ASSESS-LH-TECH2-003-M01.json');
const practical=read('content/performance-assessments/PRACTICAL-TECH2-C-FERTIGATION-ROOTZONE-TROUBLESHOOTING.json');
assert.equal(course.version,'0.2.0'); assert.equal(course.status,'published');
assert.equal(course.extensions?.academicPublicationStatus,'owner-approved-public-academic-release');
assert.equal(course.extensions?.professionalCredentialUseAuthorized,false); assert.equal(course.finalAssessment,finalA.id);
assert.ok(course.modules.includes('MOD-LH-TECH2-003-FERTIGATION'));
assert.equal(course.extensions.mappedPractical,practical.id);
assert.equal(course.extensions.independentRecipeDesignAuthorityConferred,false);
assert.equal(finalA.items.length,24); assert.equal(formA.items.length,12);
assert.equal(finalA.extensions?.courseDerivedAssessment,true,'Technician II Course 3 final must remain explicitly course-derived');
assert.equal(finalA.extensions?.encyclopediaSubstitutionAllowed,false,'Encyclopedia material cannot substitute for Tech II Course 3 instruction');
assert.equal(finalA.extensions?.untaughtMaterialAllowed,false,'Tech II Course 3 final cannot assess untaught material');
assert.equal(finalA.extensions?.independentRecipeDesignAuthorityAllowed,false,'Course 3 assessment must not confer independent recipe-design authority');
const mod=read('content/modules/MOD-LH-TECH2-003-FERTIGATION.json');
const expectedObjectives=['LO-LH-TECH2-003-01','LO-LH-TECH2-003-02','LO-LH-TECH2-003-03','LO-LH-TECH2-003-04','LO-LH-TECH2-003-05','LO-LH-TECH2-003-06','LO-LH-TECH2-003-07'];
const taughtMap=finalA.extensions?.taughtMaterialMap??{};
for(const objectiveId of expectedObjectives){
  assert.ok(Array.isArray(taughtMap[objectiveId])&&taughtMap[objectiveId].length>0,objectiveId+': final must map to dedicated taught material');
  for(const lessonId of taughtMap[objectiveId]){
    assert.match(lessonId,/^LESSON-LH-TECH2-003-/,objectiveId+': test-to-teaching map must stay inside Tech II Course 3');
    assert.ok(mod.lessons.includes(lessonId),objectiveId+': mapped lesson must belong to Tech II Course 3 module');
    const lesson=read('content/lessons/'+lessonId+'.json');
    assert.ok((lesson.learningObjectives??[]).includes(objectiveId),objectiveId+': mapped lesson '+lessonId+' must actually teach the objective');
  }
}
assert.ok(fs.existsSync('docs/learning-hub/tech2/course-003/TEST-TO-TEACHING-MAP.md'),'Tech II Course 3 must retain a human-readable test-to-teaching audit');

assert.equal(new Set(finalA.items.filter((id)=>formA.items.includes(id))).size,0);
for(const id of [...finalA.items,...formA.items]) assert.equal(id.startsWith('ITEM-TECH2-'),false,'public credential item leaked into course grading: '+id);
for(const comp of practical.competencies){assert.ok(course.competencies.includes(comp),'Practical C competency not mapped: '+comp);assert.ok(program.competencies.includes(comp),'Program missing Practical C competency: '+comp);}
for(const comp of ['COMP-ROOTZONE-001','COMP-PRO-QA-001']) assert.ok(course.competencies.includes(comp));
assert.equal(finalA.blueprint.reduce((s,r)=>s+r.items,0),24);
for(const itemId of finalA.items){const item=read('content/questions/'+itemId+'.json'); assert.ok(item.references.length>0);}
console.log('Technician II Course 003 instruction, bank isolation, recipe authority, safety boundary and Practical C alignment passed.');
