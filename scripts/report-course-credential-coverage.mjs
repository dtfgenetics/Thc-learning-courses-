import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readDir = (dir) => {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(full, f), 'utf8')));
};

const courses = readDir('content/courses');
const assessments = new Map(readDir('content/assessments').map((x) => [x.id, x]));
const credentials = readDir('content/credentials');
const credentialPrograms = readDir('content/credential-programs');

const legacyCredentialsByCourse = new Map();
for (const credential of credentials) {
  const list = legacyCredentialsByCourse.get(credential.course) ?? [];
  list.push(credential);
  legacyCredentialsByCourse.set(credential.course, list);
}

const credentialProgramsByCourse = new Map();
for (const program of credentialPrograms) {
  for (const courseId of program.requiredCourses ?? []) {
    const list = credentialProgramsByCourse.get(courseId) ?? [];
    list.push(program);
    credentialProgramsByCourse.set(courseId, list);
  }
}

let errors = 0;
let credentialBearing = 0;
let completePath = 0;
let nonCredential = 0;
console.log('Course credential pathway coverage');
for (const course of [...courses].sort((a,b) => a.id.localeCompare(b.id))) {
  const legacyMapped = legacyCredentialsByCourse.get(course.id) ?? [];
  const programMapped = credentialProgramsByCourse.get(course.id) ?? [];
  const mappedCount = legacyMapped.length + programMapped.length;

  if (!course.credentialBearing) {
    nonCredential++;
    console.log(`${course.id}: non-credential; finalAssessment=${course.finalAssessment ?? 'none'}; legacyCredentials=${legacyMapped.length}; credentialPrograms=${programMapped.length}`);
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

  if (mappedCount === 0) {
    console.error(`ERROR ${course.id}: credentialBearing=true but no legacy credential or multi-course credential program maps to the course`);
    errors++; ok = false;
  }

  if (ok) completePath++;
  const legacyIds = legacyMapped.map((x) => x.id).join(',') || 'none';
  const programIds = programMapped.map((x) => x.id).join(',') || 'none';
  console.log(`${course.id}: credential-bearing; finalAssessment=${course.finalAssessment ?? 'none'}; legacyCredentials=${legacyIds}; credentialPrograms=${programIds}; pathwayComplete=${ok}`);
}

console.log(`Summary: courses=${courses.length}; credentialBearing=${credentialBearing}; completeCredentialPaths=${completePath}; nonCredential=${nonCredential}`);
if (errors) process.exit(1);
