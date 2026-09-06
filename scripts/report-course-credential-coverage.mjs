import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readDir = (dir) => fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(root, dir, f), 'utf8')));
const courses = readDir('content/courses');
const assessments = new Map(readDir('content/assessments').map((x) => [x.id, x]));
const credentials = readDir('content/credentials');
const credentialsByCourse = new Map();
for (const credential of credentials) {
  const list = credentialsByCourse.get(credential.course) ?? [];
  list.push(credential);
  credentialsByCourse.set(credential.course, list);
}

let errors = 0;
let credentialBearing = 0;
let completePath = 0;
let nonCredential = 0;
console.log('Course credential pathway coverage');
for (const course of [...courses].sort((a,b) => a.id.localeCompare(b.id))) {
  const mapped = credentialsByCourse.get(course.id) ?? [];
  if (!course.credentialBearing) {
    nonCredential++;
    console.log(`${course.id}: non-credential; finalAssessment=${course.finalAssessment ?? 'none'}; credentials=${mapped.length}`);
    continue;
  }
  credentialBearing++;
  let ok = true;
  if (!course.finalAssessment) {
    console.error(`ERROR ${course.id}: credentialBearing=true but finalAssessment is missing`);
    errors++; ok = false;
  } else {
    const assessment = assessments.get(course.finalAssessment);
    if (!assessment) {
      console.error(`ERROR ${course.id}: missing finalAssessment ${course.finalAssessment}`);
      errors++; ok = false;
    } else if (!['summative','credential'].includes(assessment.purpose)) {
      console.error(`ERROR ${course.id}: final assessment ${assessment.id} must be summative/credential purpose`);
      errors++; ok = false;
    }
  }
  if (mapped.length === 0) {
    console.error(`ERROR ${course.id}: credentialBearing=true but no credential definition maps to the course`);
    errors++; ok = false;
  }
  if (ok) completePath++;
  console.log(`${course.id}: credential-bearing; finalAssessment=${course.finalAssessment ?? 'none'}; credentials=${mapped.map((x) => x.id).join(',') || 'none'}; pathwayComplete=${ok}`);
}
console.log(`Summary: courses=${courses.length}; credentialBearing=${credentialBearing}; completeCredentialPaths=${completePath}; nonCredential=${nonCredential}`);
if (errors) process.exit(1);
