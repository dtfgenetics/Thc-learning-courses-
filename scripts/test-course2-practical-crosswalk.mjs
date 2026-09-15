import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const readText = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const course = readJson('content/courses/COURSE-LH-TECH1-002.json');
const crosswalk = readJson('registry/course2-practical-a-crosswalk.json');
const labPlan = readJson('registry/technician-i-integrated-lab-plan.json');

assert.equal(crosswalk.courseId, course.id);
assert.equal(crosswalk.practicalId, course.extensions?.mappedPractical);
assert.equal(crosswalk.status, 'development');
assert.equal(crosswalk.validationBoundary?.practicalValidated, false);
assert.equal(crosswalk.validationBoundary?.humanApprovalImplied, false);
assert.equal(crosswalk.validationBoundary?.pilotEvidenceImplied, false);
assert.equal(crosswalk.validationBoundary?.interRaterEvidenceImplied, false);

const practical = (labPlan.practicals ?? []).find((row) => row.id === crosswalk.practicalId);
assert.ok(practical, `${crosswalk.practicalId}: missing from integrated lab plan`);
assert.equal(practical.status, 'development', 'Practical A must remain development until real validation evidence exists');
assert.equal(practical.document, crosswalk.practicalDocument);

const practicalText = readText(crosswalk.practicalDocument);
const objectiveIds = ['LO-LH-TECH1-002-01','LO-LH-TECH1-002-02','LO-LH-TECH1-002-03','LO-LH-TECH1-002-04','LO-LH-TECH1-002-05'];
assert.equal(crosswalk.objectiveMappings.length, objectiveIds.length);
assert.deepEqual(new Set(crosswalk.objectiveMappings.map((row) => row.objectiveId)), new Set(objectiveIds));

for (const mapping of crosswalk.objectiveMappings) {
  const objective = readJson(`content/learning-objectives/${mapping.objectiveId}.json`);
  assert.equal(mapping.statement, objective.statement, `${mapping.objectiveId}: crosswalk statement must match canonical objective`);
  assert.ok(mapping.practicalTasks.length > 0, `${mapping.objectiveId}: practical tasks required`);
  assert.ok(mapping.scoringCategories.length > 0, `${mapping.objectiveId}: scoring categories required`);
  assert.ok(mapping.expectedEvidence.length > 0, `${mapping.objectiveId}: expected evidence required`);
  assert.ok(mapping.deliverables.length > 0, `${mapping.objectiveId}: deliverables required`);
  for (const task of mapping.practicalTasks) assert.ok(practicalText.includes(task), `${mapping.objectiveId}: practical task not found in Practical A: ${task}`);
  for (const category of mapping.scoringCategories) assert.ok(practicalText.includes(category), `${mapping.objectiveId}: scoring category not found in Practical A: ${category}`);
  for (const evidence of mapping.expectedEvidence) assert.ok(practicalText.includes(evidence), `${mapping.objectiveId}: expected evidence not found in Practical A: ${evidence}`);
  for (const deliverable of mapping.deliverables) assert.ok(practicalText.includes(deliverable), `${mapping.objectiveId}: deliverable not found in Practical A: ${deliverable}`);
}

assert.equal(crosswalk.courseSpecificReadiness?.objectiveCoverageMapped, true);
assert.equal(crosswalk.courseSpecificReadiness?.lessonContentBuilt, true);
assert.equal(crosswalk.courseSpecificReadiness?.assessmentDevelopmentBankBuilt, true);
assert.equal(crosswalk.courseSpecificReadiness?.learnerAssetsBuilt, true);
assert.equal(crosswalk.courseSpecificReadiness?.practicalMappingBuilt, true);
for (const gate of ['humanTechnicalReview','renderedAccessibilityReview','practicalValidation','controlledPilotEvidence']) {
  assert.equal(crosswalk.courseSpecificReadiness?.[gate], 'not-started', `${gate} must not be synthetically advanced`);
}

console.log('Course 2 Practical A development crosswalk passed: all five objectives map to real Practical A tasks, scoring categories, expected evidence and deliverables while human/pilot/validation gates remain open.');
