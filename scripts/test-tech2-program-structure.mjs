import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const program = read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');
const expected = ["COURSE-LH-TECH2-001","COURSE-LH-TECH2-002","COURSE-LH-TECH2-003","COURSE-LH-TECH2-004","COURSE-LH-TECH2-005","COURSE-LH-TECH2-006","COURSE-LH-TECH2-007","COURSE-LH-TECH2-008"];
assert.deepEqual(program.requiredCourses, expected);
assert.equal(program.status, 'draft');
assert.equal(program.prerequisiteCredentials.includes('CREDPROG-CULT-TECH-I-001'), true);
assert.equal(program.assessmentModel.credentialAssessment, 'ASSESS-CULT-TECH-II-CREDENTIAL-001');
assert.equal(program.assessmentModel.performanceEvidence.length, 7);
assert.equal(program.assessmentModel.capstone, 'CAPSTONE-TECH2-SENIOR-TECHNICIAN-DIAGNOSTIC-SHIFT');
for (const id of expected) {
  const course = read('content/courses/' + id + '.json');
  assert.equal(course.status, 'draft', id + ' must remain draft');
  assert.equal(course.credentialBearing, true);
  assert.equal(course.finalAssessment, null);
  assert.equal(course.extensions.credentialPath, program.id);
  assert.equal(course.extensions.legacySourceCourse, 'COURSE-CULT-TECH-II-001');
  assert.ok(course.modules.length > 0 && course.competencies.length > 0);
}
for (const id of program.assessmentModel.performanceEvidence) assert.ok(fs.existsSync(path.join('content/performance-assessments', id + '.json')), 'missing ' + id);
assert.ok(fs.existsSync(path.join('content/performance-assessments', program.assessmentModel.capstone + '.json')), 'missing capstone');
assert.ok(fs.existsSync('content/courses/COURSE-CULT-TECH-II-001.json'), 'legacy Technician II source course must be preserved');
const legacy = read('content/courses/COURSE-CULT-TECH-II-001.json');
assert.equal(legacy.finalAssessment, 'ASSESS-CULT-TECH-II-CREDENTIAL-001');
const exam = read('content/assessments/ASSESS-CULT-TECH-II-CREDENTIAL-001.json');
assert.equal(exam.status, 'draft');
assert.equal(exam.purpose, 'credential');
assert.equal(exam.items.length, 0, 'public credential definition must not contain an operational selected form');
console.log('Technician II eight-course program shell and legacy-preservation contract passed.');
