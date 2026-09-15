import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const exists = (p) => fs.existsSync(path.join(root, p));

const program = read('content/credential-programs/CREDPROG-CULT-TECH-I-001.json');
assert.equal(program.status, 'draft', 'Technician I program must remain draft until validation and release gates complete');
assert.equal(program.requiredCourses.length, 7, 'canonical Technician I program defines seven required courses');
assert.equal(new Set(program.requiredCourses).size, program.requiredCourses.length, 'required Technician I courses must be unique');

for (const courseId of program.requiredCourses) {
  const file = `content/courses/${courseId}.json`;
  assert.ok(exists(file), `${courseId} must have a real course object`);
  const course = read(file);
  assert.equal(course.id, courseId);
  assert.equal(course.credentialBearing, true, `${courseId} must be credential-path coursework`);
  assert.equal(course.extensions?.credentialPath, program.id, `${courseId} must point back to ${program.id}`);
  assert.ok(Array.isArray(course.modules) && course.modules.length > 0, `${courseId} must have mapped instructional modules`);
  for (const moduleId of course.modules) {
    assert.ok(exists(`content/modules/${moduleId}.json`), `${courseId} references missing module ${moduleId}`);
  }

  if (courseId !== 'COURSE-LH-TECH1-001') {
    assert.equal(course.status, 'draft', `${courseId} must remain draft while dedicated instruction and assessment are incomplete`);
    assert.equal(course.finalAssessment, null, `${courseId} must not claim a final assessment before the dedicated bank exists`);
    const exposesCompletionGate = course.extensions?.dedicatedCourseAssessmentRequired === true || course.extensions?.dedicatedLabModuleRequired === true;
    assert.equal(exposesCompletionGate, true, `${courseId} must explicitly expose its next completion gate`);
  }
}

const integrated = read('content/courses/COURSE-LH-TECH1-007.json');
assert.equal(integrated.extensions?.dedicatedLabModuleRequired, true);
assert.ok(Array.isArray(integrated.extensions?.credentialPracticalSetRequired));
assert.equal(integrated.extensions.credentialPracticalSetRequired.length, 6, 'integrated lab must retain six planned Technician I practicals');
assert.equal(new Set(integrated.extensions.credentialPracticalSetRequired).size, 6, 'planned practical IDs must be unique');
assert.equal(integrated.extensions?.capstoneRequired, 'CAPSTONE-TECH1-SHIFT-001');

console.log('Technician I program structure passed: all seven required courses resolve, mapped modules exist, incomplete courses remain draft, and practical/capstone gates remain explicit.');
