import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const readText=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const crosswalk=read('registry/course6-practical-f-crosswalk.json');
const course=read('content/courses/COURSE-LH-TECH1-006.json');
const finalAssessment=read('content/assessments/ASSESS-LH-TECH1-006-FINAL.json');
const release=read('content/public-releases/PUBLIC-RELEASE-LH-TECH1-006.json');
const labPlan=read('registry/technician-i-integrated-lab-plan.json');
const releaseEvidence=read('registry/technician-i-release-evidence.json');
const practicalText=readText(crosswalk.practicalDocument);

assert.equal(crosswalk.courseId,course.id);
assert.equal(crosswalk.status,'development');
assert.equal(crosswalk.practicalId,'PRACTICAL-TECH1-F');
assert.equal(course.status,'draft');
assert.equal(course.extensions?.mappedPractical,crosswalk.practicalId);
assert.equal(course.extensions?.practicalCrosswalk,'registry/course6-practical-f-crosswalk.json');
assert.equal(course.extensions?.practicalCrosswalkStatus,'development');
assert.equal(course.extensions?.independentProductReleaseAuthorityConferred,false);
assert.equal(crosswalk.validationBoundary?.independentProductReleaseAuthorityConferred,false);
assert.equal(finalAssessment.extensions?.linkedCredentialPractical,crosswalk.practicalId);
assert.deepEqual(release.publicScope?.practicalIds,[crosswalk.practicalId]);

const practical=(labPlan.practicals??[]).find((row)=>row.id===crosswalk.practicalId);
assert.ok(practical,'Practical F must exist in the integrated lab plan');
assert.equal(practical.status,'development','Practical F must remain development until real validation evidence exists');
assert.equal(practical.document,crosswalk.practicalDocument);

const courseObjectives=['LO-LH-TECH1-006-01','LO-LH-TECH1-006-02','LO-LH-TECH1-006-03','LO-LH-TECH1-006-04','LO-LH-TECH1-006-05','LO-LH-TECH1-006-06'];
assert.deepEqual(new Set(crosswalk.objectiveMappings.map((row)=>row.objectiveId)),new Set(courseObjectives));

for(const mapping of crosswalk.objectiveMappings){
  const objective=read(`content/learning-objectives/${mapping.objectiveId}.json`);
  assert.equal(mapping.statement,objective.statement,`${mapping.objectiveId}: statement must match canonical objective`);
  for(const field of ['practicalTasks','scoringCategories','expectedEvidence','deliverables']) assert.ok(Array.isArray(mapping[field])&&mapping[field].length>0,`${mapping.objectiveId}: ${field} required`);
  for(const task of mapping.practicalTasks) assert.ok(practicalText.includes(task),`${mapping.objectiveId}: task missing from Practical F: ${task}`);
  for(const category of mapping.scoringCategories) assert.ok(practicalText.includes(category),`${mapping.objectiveId}: scoring category missing from Practical F: ${category}`);
  for(const evidence of mapping.expectedEvidence) assert.ok(practicalText.includes(evidence),`${mapping.objectiveId}: evidence missing from Practical F: ${evidence}`);
  for(const deliverable of mapping.deliverables) assert.ok(practicalText.includes(deliverable),`${mapping.objectiveId}: deliverable missing from Practical F: ${deliverable}`);
}

assert.equal(crosswalk.validationBoundary?.practicalValidated,false);
assert.equal(crosswalk.validationBoundary?.humanApprovalImplied,false);
assert.equal(crosswalk.validationBoundary?.pilotEvidenceImplied,false);
assert.equal(crosswalk.validationBoundary?.interRaterEvidenceImplied,false);
assert.equal(crosswalk.courseSpecificReadiness?.objectiveCoverageMapped,true);
assert.equal(crosswalk.courseSpecificReadiness?.practicalMappingBuilt,true);
assert.equal(crosswalk.courseSpecificReadiness?.learnerAssetLayerBuilt,true);
assert.equal(crosswalk.courseSpecificReadiness?.visualRegistry,'visuals/COURSE6-ASSET-REGISTRY.json');
assert.equal(crosswalk.courseSpecificReadiness?.producedLearnerAssets,8);
assert.equal(crosswalk.courseSpecificReadiness?.driveFolderCreated,true);
assert.equal(crosswalk.courseSpecificReadiness?.driveAssetMirroring,'pending');
assert.equal(crosswalk.courseSpecificReadiness?.humanTechnicalReview,'not-started');
assert.equal(crosswalk.courseSpecificReadiness?.renderedAccessibilityReview,'not-started');
assert.equal(crosswalk.courseSpecificReadiness?.practicalValidation,'not-started');
assert.equal(crosswalk.courseSpecificReadiness?.controlledPilotEvidence,'not-started');
assert.notEqual(releaseEvidence.gates?.humanTechnicalReview,'approved');
assert.notEqual(releaseEvidence.gates?.renderedAccessibilityReview,'approved');
assert.notEqual(releaseEvidence.gates?.practicalValidation,'validated');
assert.notEqual(releaseEvidence.gates?.controlledPilotEvidence,'accepted');

console.log('Course 6 Practical F crosswalk passed: all six objectives map to literal development-stage harvest/postharvest evidence, eight learner assets are built, Drive asset mirroring remains pending, and product-release/human/pilot/validation gates remain open.');
