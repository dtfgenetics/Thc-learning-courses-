import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (p) => JSON.parse(fs.readFileSync(p,'utf8'));
const course = read('content/courses/COURSE-LH-TECH2-001.json');
const program = read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');
const finalA = read('content/assessments/ASSESS-LH-TECH2-001-FINAL.json');
const formA = read('content/assessments/ASSESS-LH-TECH2-001-M01.json');
assert.equal(course.version,'0.2.0');
assert.equal(course.status,'published');
assert.equal(course.extensions?.academicPublicationStatus,'owner-approved-public-academic-release');
assert.equal(course.extensions?.professionalCredentialUseAuthorized,false);
assert.equal(course.finalAssessment,finalA.id);
assert.ok(course.modules.includes('MOD-LH-TECH2-001-DIAGNOSTIC'));
assert.equal(course.extensions.mappedPractical,'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP');
assert.equal(course.extensions.dedicatedCourseAssessmentRequired,false);
assert.equal(course.extensions.dedicatedPerformanceValidationRequired,true);
assert.equal(finalA.items.length,24);
assert.equal(formA.items.length,12);
assert.equal(finalA.extensions?.courseDerivedAssessment,true,'Technician II Course 1 final must remain explicitly course-derived');
assert.equal(finalA.extensions?.encyclopediaSubstitutionAllowed,false,'Encyclopedia material cannot substitute for Tech II Course 1 instruction');
assert.equal(finalA.extensions?.untaughtMaterialAllowed,false,'Tech II Course 1 final cannot assess untaught material');
const mod=read('content/modules/MOD-LH-TECH2-001-DIAGNOSTIC.json');
const expectedObjectives=['LO-LH-TECH2-001-01','LO-LH-TECH2-001-02','LO-LH-TECH2-001-03','LO-LH-TECH2-001-04','LO-LH-TECH2-001-05','LO-LH-TECH2-001-06','LO-LH-TECH2-001-07'];
const taughtMap=finalA.extensions?.taughtMaterialMap??{};
for(const objectiveId of expectedObjectives){
  assert.ok(Array.isArray(taughtMap[objectiveId])&&taughtMap[objectiveId].length>0,objectiveId+': final must map to dedicated taught material');
  for(const lessonId of taughtMap[objectiveId]){
    assert.match(lessonId,/^LESSON-LH-TECH2-001-/,objectiveId+': test-to-teaching map must stay inside Tech II Course 1');
    assert.ok(mod.lessons.includes(lessonId),objectiveId+': mapped lesson must belong to Tech II Course 1 module');
    const lesson=read('content/lessons/'+lessonId+'.json');
    assert.ok((lesson.learningObjectives??[]).includes(objectiveId),objectiveId+': mapped lesson '+lessonId+' must actually teach the objective');
  }
}
assert.ok(fs.existsSync('docs/learning-hub/tech2/course-001/TEST-TO-TEACHING-MAP.md'),'Tech II Course 1 must retain a human-readable test-to-teaching audit');

assert.equal(new Set([...finalA.items,...formA.items]).size,36,'formative and summative banks must not overlap');
for (const id of [...finalA.items,...formA.items]) assert.ok(id.startsWith('ITEM-LH-TECH2-001-'),'course assessment must not reuse public ITEM-TECH2 credential-development items');
const counts = [0,0,0,0];
for (const id of finalA.items) counts[read('content/questions/'+id+'.json').correct]++;
assert.deepEqual(counts,[6,6,6,6],'summative authored answer positions must be balanced');
const fcounts=[0,0,0,0];
for (const id of formA.items) fcounts[read('content/questions/'+id+'.json').correct]++;
assert.deepEqual(fcounts,[3,3,3,3],'formative authored answer positions must be balanced');
for (const comp of ['COMP-ENV-ADV-001','COMP-PLANT-BIO-001','COMP-ROOTZONE-001','COMP-NUTRIENT-DIAG-001','COMP-IPM-ADV-001','COMP-FLOWER-ADV-001','COMP-PRO-QA-001']) { assert.ok(course.competencies.includes(comp),comp+' missing from course'); assert.ok(program.competencies.includes(comp),comp+' missing from program'); }
assert.ok(fs.existsSync('content/references/REF-CANNABIS-NPK-RSM-2024-001.json'));
const practical=read('content/performance-assessments/PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP.json');
for (const comp of practical.competencies) assert.ok(course.competencies.includes(comp), 'Practical A competency not taught/mapped: '+comp);
console.log('Technician II Course 001 instruction, assessment, bank-isolation and Practical A alignment passed.');
