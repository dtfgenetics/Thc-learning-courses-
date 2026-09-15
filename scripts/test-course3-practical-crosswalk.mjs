import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const readText = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const crosswalk = read('registry/course3-practical-a-crosswalk.json');
const course = read('content/courses/COURSE-LH-TECH1-003.json');
const finalAssessment = read('content/assessments/ASSESS-LH-TECH1-003-FINAL.json');
const release = read('content/public-releases/PUBLIC-RELEASE-LH-TECH1-003.json');
const labPlan = read('registry/technician-i-integrated-lab-plan.json');
const releaseEvidence = read('registry/technician-i-release-evidence.json');
const practicalText = readText(crosswalk.practicalDocument);

assert.equal(crosswalk.courseId, course.id);
assert.equal(crosswalk.status, 'development');
assert.equal(crosswalk.practicalId, 'PRACTICAL-TECH1-A');
assert.equal(course.status, 'draft');
assert.equal(course.extensions?.mappedPractical, crosswalk.practicalId);
assert.equal(course.extensions?.practicalCrosswalk, 'registry/course3-practical-a-crosswalk.json');
assert.equal(course.extensions?.practicalCrosswalkStatus, 'development');
assert.equal(finalAssessment.extensions?.linkedCredentialPractical, crosswalk.practicalId);
assert.deepEqual(release.publicScope?.practicalIds, [crosswalk.practicalId]);

const practical = (labPlan.practicals ?? []).find((row) => row.id === crosswalk.practicalId);
assert.ok(practical, 'Practical A must exist in the integrated lab plan');
assert.equal(practical.status, 'development', 'Practical A must remain development until real validation evidence exists');
assert.equal(practical.document, crosswalk.practicalDocument);

const courseObjectives = ['LO-LH-TECH1-003-01','LO-LH-TECH1-003-02','LO-LH-TECH1-003-03','LO-LH-TECH1-003-04','LO-LH-TECH1-003-05'];
assert.deepEqual(new Set(crosswalk.objectiveMappings.map((row) => row.objectiveId)), new Set(courseObjectives));

for (const mapping of crosswalk.objectiveMappings) {
  const objective = read(`content/learning-objectives/${mapping.objectiveId}.json`);
  assert.equal(mapping.statement, objective.statement, `${mapping.objectiveId}: statement must match canonical objective`);
  assert.ok(mapping.practicalTasks.length > 0, `${mapping.objectiveId}: practical task mapping required`);
  assert.ok(mapping.scoringCategories.length > 0, `${mapping.objectiveId}: scoring mapping required`);
  assert.ok(mapping.expectedEvidence.length > 0, `${mapping.objectiveId}: evidence mapping required`);
  assert.ok(mapping.deliverables.length > 0, `${mapping.objectiveId}: deliverable mapping required`);

  for (const task of mapping.practicalTasks) {
    assert.ok(practicalText.includes(task), `${mapping.objectiveId}: mapped task is not present in Practical A: ${task}`);
  }
  for (const evidence of mapping.expectedEvidence) {
    assert.ok(practicalText.includes(evidence), `${mapping.objectiveId}: mapped evidence is not present in Practical A: ${evidence}`);
  }
  for (const deliverable of mapping.deliverables) {
    assert.ok(practicalText.includes(deliverable), `${mapping.objectiveId}: mapped deliverable is not present in Practical A: ${deliverable}`);
  }
}

assert.equal(crosswalk.validationBoundary?.practicalValidated, false);
assert.equal(crosswalk.validationBoundary?.humanApprovalImplied, false);
assert.equal(crosswalk.validationBoundary?.pilotEvidenceImplied, false);
assert.equal(crosswalk.validationBoundary?.interRaterEvidenceImplied, false);
assert.equal(crosswalk.courseSpecificReadiness?.objectiveCoverageMapped, true);
assert.equal(crosswalk.courseSpecificReadiness?.practicalMappingBuilt, true);
assert.equal(crosswalk.courseSpecificReadiness?.learnerAssetLayerBuilt, false);
assert.equal(crosswalk.courseSpecificReadiness?.humanTechnicalReview, 'not-started');
assert.equal(crosswalk.courseSpecificReadiness?.renderedAccessibilityReview, 'not-started');
assert.equal(crosswalk.courseSpecificReadiness?.practicalValidation, 'not-started');
assert.equal(crosswalk.courseSpecificReadiness?.controlledPilotEvidence, 'not-started');

assert.notEqual(releaseEvidence.gates?.humanTechnicalReview, 'approved');
assert.notEqual(releaseEvidence.gates?.renderedAccessibilityReview, 'approved');
assert.notEqual(releaseEvidence.gates?.practicalValidation, 'validated');
assert.notEqual(releaseEvidence.gates?.controlledPilotEvidence, 'accepted');

console.log('Course 3 Practical A crosswalk passed: all five objectives map to canonical development-stage tasks/evidence while human, pilot and validation gates remain open.');
