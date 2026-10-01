import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const readText=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const crosswalk=read('registry/course5-practical-cde-crosswalk.json');
const course=read('content/courses/COURSE-LH-TECH1-005.json');
const finalAssessment=read('content/assessments/ASSESS-LH-TECH1-005-FINAL.json');
const release=read('content/public-releases/PUBLIC-RELEASE-LH-TECH1-005.json');
const labPlan=read('registry/technician-i-integrated-lab-plan.json');
const releaseEvidence=read('registry/technician-i-release-evidence.json');

assert.equal(crosswalk.courseId,course.id);
assert.equal(crosswalk.status,'development');
assert.equal(course.status,'published');
assert.equal(course.extensions?.academicPublicationStatus,'owner-approved-public-academic-release');
assert.equal(course.extensions?.professionalCredentialUseAuthorized,false);
assert.equal(course.extensions?.practicalCrosswalk,'registry/course5-practical-cde-crosswalk.json');
assert.equal(course.extensions?.practicalCrosswalkStatus,'development');
assert.equal(course.extensions?.pesticideApplicatorAuthorityConferred,false);
assert.equal(course.extensions?.treatmentSelectionAuthorityConferred,false);
assert.equal(crosswalk.validationBoundary?.pesticideApplicatorAuthorityConferred,false);
assert.equal(crosswalk.validationBoundary?.treatmentSelectionAuthorityConferred,false);

const practicalIds=crosswalk.practicals.map((p)=>p.id);
assert.deepEqual(practicalIds,['PRACTICAL-TECH1-C','PRACTICAL-TECH1-D','PRACTICAL-TECH1-E']);
assert.deepEqual(course.extensions?.mappedPracticals,practicalIds);
assert.deepEqual(finalAssessment.extensions?.linkedCredentialPracticals,practicalIds);
assert.deepEqual(release.publicScope?.practicalIds,practicalIds);

const practicalTexts=new Map();
for(const p of crosswalk.practicals){
  const planned=(labPlan.practicals??[]).find((row)=>row.id===p.id);
  assert.ok(planned,`${p.id}: practical missing from integrated lab plan`);
  assert.equal(planned.status,'development',`${p.id}: practical must remain development`);
  assert.equal(planned.document,p.document,`${p.id}: canonical document mismatch`);
  practicalTexts.set(p.id,readText(p.document));
}

const courseObjectives=['LO-LH-TECH1-005-01','LO-LH-TECH1-005-02','LO-LH-TECH1-005-03','LO-LH-TECH1-005-04','LO-LH-TECH1-005-05','LO-LH-TECH1-005-06'];
assert.deepEqual(new Set(crosswalk.objectiveMappings.map((row)=>row.objectiveId)),new Set(courseObjectives));

for(const mapping of crosswalk.objectiveMappings){
  const objective=read(`content/learning-objectives/${mapping.objectiveId}.json`);
  assert.equal(mapping.statement,objective.statement,`${mapping.objectiveId}: statement must match canonical objective`);
  assert.ok(Array.isArray(mapping.performanceMappings)&&mapping.performanceMappings.length>0,`${mapping.objectiveId}: performance mapping required`);
  for(const performance of mapping.performanceMappings){
    assert.ok(practicalTexts.has(performance.practicalId),`${mapping.objectiveId}: unknown practical ${performance.practicalId}`);
    const text=practicalTexts.get(performance.practicalId);
    for(const field of ['practicalTasks','scoringCategories','expectedEvidence','deliverables']) assert.ok(Array.isArray(performance[field])&&performance[field].length>0,`${mapping.objectiveId}/${performance.practicalId}: ${field} required`);
    for(const task of performance.practicalTasks) assert.ok(text.includes(task),`${mapping.objectiveId}/${performance.practicalId}: task missing: ${task}`);
    for(const category of performance.scoringCategories) assert.ok(text.includes(category),`${mapping.objectiveId}/${performance.practicalId}: scoring category missing: ${category}`);
    for(const evidence of performance.expectedEvidence) assert.ok(text.includes(evidence),`${mapping.objectiveId}/${performance.practicalId}: evidence missing: ${evidence}`);
    for(const deliverable of performance.deliverables) assert.ok(text.includes(deliverable),`${mapping.objectiveId}/${performance.practicalId}: deliverable missing: ${deliverable}`);
  }
}

const biosecurity=crosswalk.objectiveMappings.find((row)=>row.objectiveId==='LO-LH-TECH1-005-04');
assert.deepEqual(new Set(biosecurity.performanceMappings.map((row)=>row.practicalId)),new Set(practicalIds),'Biosecurity objective must be observable in scouting, propagation and canopy practicals');

assert.equal(crosswalk.validationBoundary?.practicalsValidated,false);
assert.equal(crosswalk.validationBoundary?.humanApprovalImplied,false);
assert.equal(crosswalk.validationBoundary?.pilotEvidenceImplied,false);
assert.equal(crosswalk.validationBoundary?.interRaterEvidenceImplied,false);
assert.equal(crosswalk.courseSpecificReadiness?.objectiveCoverageMapped,true);
assert.equal(crosswalk.courseSpecificReadiness?.practicalMappingBuilt,true);
assert.equal(crosswalk.courseSpecificReadiness?.learnerAssetLayerBuilt,true);
assert.equal(crosswalk.courseSpecificReadiness?.learnerAssetCount,11);
assert.equal(crosswalk.courseSpecificReadiness?.visualRegistry,'visuals/COURSE5-ASSET-REGISTRY.json');
assert.equal(course.extensions?.learnerAssetLayerBuilt,true);
assert.equal(course.extensions?.totalLearnerAssetCount,11);
assert.equal(course.extensions?.visualRegistry,'visuals/COURSE5-ASSET-REGISTRY.json');
assert.equal(crosswalk.courseSpecificReadiness?.humanTechnicalReview,'not-started');
assert.equal(crosswalk.courseSpecificReadiness?.renderedAccessibilityReview,'not-started');
assert.equal(crosswalk.courseSpecificReadiness?.practicalValidation,'not-started');
assert.equal(crosswalk.courseSpecificReadiness?.controlledPilotEvidence,'not-started');
assert.notEqual(releaseEvidence.gates?.humanTechnicalReview,'approved');
assert.notEqual(releaseEvidence.gates?.renderedAccessibilityReview,'approved');
assert.notEqual(releaseEvidence.gates?.practicalValidation,'validated');
assert.notEqual(releaseEvidence.gates?.controlledPilotEvidence,'accepted');

console.log('Course 5 C/D/E crosswalk passed: all six objectives have literal development-stage practical evidence, the eleven-asset learner layer is built, biosecurity spans all three contexts, and pesticide/treatment authority remains excluded.');
