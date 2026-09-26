import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (rel) => JSON.parse(fs.readFileSync(rel, 'utf8'));
const performance = new Map(fs.readdirSync('content/performance-assessments')
  .filter((name) => name.endsWith('.json'))
  .map((name) => {
    const item = read(`content/performance-assessments/${name}`);
    return [item.id, item];
  }));

for (const [coursePath, programPath] of [
  ['content/courses/COURSE-LH-TECH1-007.json', 'content/credential-programs/CREDPROG-CULT-TECH-I-001.json'],
  ['content/courses/COURSE-LH-TECH2-008.json', 'content/credential-programs/CREDPROG-CULT-TECH-II-001.json']
]) {
  const course = read(coursePath);
  const program = read(programPath);
  assert.equal(course.finalAssessment, null, `${course.id} must not gain an artificial ordinary final`);
  assert.equal(course.extensions.integratedPerformanceValidationRequired, true);
  const required = course.extensions.credentialPracticalSetRequired;
  assert.ok(required.length >= 6);
  for (const id of required) {
    assert.equal(performance.get(id)?.assessmentType, 'practical', `${course.id}: missing canonical practical ${id}`);
    assert.ok(program.assessmentModel.performanceEvidence.includes(id), `${course.id}: program must map ${id}`);
  }
  const capstone = course.extensions.capstoneRequired;
  assert.equal(performance.get(capstone)?.assessmentType, 'capstone', `${course.id}: missing canonical capstone ${capstone}`);
  assert.equal(program.assessmentModel.capstone, capstone);
  assert.equal(performance.get(capstone)?.extensions?.credentialUseAuthorized ?? false, false, `${course.id}: development capstone must remain unauthorized`);
}

const coverage = execFileSync(process.execPath, ['scripts/report-course-credential-coverage.mjs'], { encoding: 'utf8' });
assert.match(coverage, /completeCredentialPaths=25/);
assert.match(coverage, /draftIncompleteCredentialPaths=0/);
assert.match(coverage, /COURSE-LH-TECH1-007:.*pathwayComplete=true/);
assert.match(coverage, /COURSE-LH-TECH2-008:.*pathwayComplete=true/);

console.log('Integrated practical and capstone pathway coverage: PASS');
