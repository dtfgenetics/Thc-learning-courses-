import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const exists = (p) => fs.existsSync(path.join(root, p));
const program = read('content/credential-programs/CREDPROG-CULT-TECH-I-001.json');
assert.equal(program.status, 'draft', 'Technician I program must remain draft until validation and release gates complete');
assert.equal(program.requiredCourses.length, 7);
assert.equal(new Set(program.requiredCourses).size, 7);
for (const courseId of program.requiredCourses) {
  const file = `content/courses/${courseId}.json`;
  assert.ok(exists(file), `${courseId} must have a real course object`);
  const c = read(file);
  assert.equal(c.id, courseId);
  assert.equal(c.credentialBearing, true);
  assert.equal(c.extensions?.credentialPath, program.id);
  assert.ok(Array.isArray(c.modules) && c.modules.length > 0);
  for (const moduleId of c.modules) assert.ok(exists(`content/modules/${moduleId}.json`), `${courseId} references missing module ${moduleId}`);
  assert.equal(c.status, 'published', `${courseId} must remain published as an owner-approved academic course while credential validation remains separate`);
  if (c.finalAssessment) {
    assert.ok(exists(`content/assessments/${c.finalAssessment}.json`), `${courseId} final assessment must resolve`);
    const a = read(`content/assessments/${c.finalAssessment}.json`);
    assert.ok(['summative','credential'].includes(a.purpose));
  } else if (courseId !== 'COURSE-LH-TECH1-001') {
    const exposesGate = c.extensions?.dedicatedCourseAssessmentRequired === true || c.extensions?.dedicatedLabModuleRequired === true || c.extensions?.integratedPerformanceValidationRequired === true;
    assert.equal(exposesGate, true, `${courseId} must expose the missing completion gate`);
  }
}
const course2 = read('content/courses/COURSE-LH-TECH1-002.json');
assert.equal(course2.finalAssessment, 'ASSESS-LH-TECH1-002-FINAL');
assert.equal(course2.extensions?.dedicatedCourseAssessmentRequired, false);
const course3 = read('content/courses/COURSE-LH-TECH1-003.json');
assert.equal(course3.finalAssessment, 'ASSESS-LH-TECH1-003-FINAL');
assert.equal(course3.extensions?.dedicatedCourseAssessmentRequired, false);
const course4 = read('content/courses/COURSE-LH-TECH1-004.json');
assert.equal(course4.finalAssessment, 'ASSESS-LH-TECH1-004-FINAL');
assert.equal(course4.extensions?.dedicatedCourseAssessmentRequired, false);
assert.equal(course4.extensions?.mappedPractical, 'PRACTICAL-TECH1-B');
const course5 = read('content/courses/COURSE-LH-TECH1-005.json');
assert.equal(course5.finalAssessment, 'ASSESS-LH-TECH1-005-FINAL');
assert.equal(course5.extensions?.dedicatedCourseAssessmentRequired, false);
assert.deepEqual(course5.extensions?.mappedPracticals, ['PRACTICAL-TECH1-C','PRACTICAL-TECH1-D','PRACTICAL-TECH1-E']);
assert.equal(course5.extensions?.pesticideApplicatorAuthorityConferred, false);
const course6 = read('content/courses/COURSE-LH-TECH1-006.json');
assert.equal(course6.finalAssessment, 'ASSESS-LH-TECH1-006-FINAL');
assert.equal(course6.extensions?.dedicatedCourseAssessmentRequired, false);
assert.equal(course6.extensions?.mappedPractical, 'PRACTICAL-TECH1-F');
assert.equal(course6.extensions?.independentProductReleaseAuthorityConferred, false);
const integrated = read('content/courses/COURSE-LH-TECH1-007.json');
assert.equal(integrated.extensions?.dedicatedLabModuleRequired, false);
assert.equal(integrated.extensions?.dedicatedLabModule, 'MOD-LH-TECH1-007-LAB');
assert.equal(integrated.extensions?.labPlan, 'LABPLAN-TECH1-001');
assert.equal(integrated.extensions?.integratedPerformanceValidationRequired, true);
assert.equal(integrated.extensions?.liveCredentialFormApproved, false);
assert.equal(integrated.extensions?.credentialPracticalSetRequired.length, 6);
assert.equal(new Set(integrated.extensions.credentialPracticalSetRequired).size, 6);
assert.equal(integrated.extensions?.capstoneRequired, 'CAPSTONE-TECH1-SHIFT-001');
console.log('Technician I program structure passed: all seven academic courses are published and resolve; the Technician I credential program remains draft while practical/capstone validation and credential release gates remain explicit.');
