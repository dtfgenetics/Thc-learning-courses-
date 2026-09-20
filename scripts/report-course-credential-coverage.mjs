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
const performanceAssessments = new Map(readDir('content/performance-assessments').map((x) => [x.id, x]));

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

function integratedPerformancePath(programs, course) {
  if (course.extensions?.integratedPerformanceValidationRequired !== true) return null;
  const requiredPracticals = course.extensions?.credentialPracticalSetRequired ?? [];
  const capstoneId = course.extensions?.capstoneRequired ?? null;
  const missing = [...requiredPracticals, capstoneId].filter(Boolean).filter((id) => !performanceAssessments.has(id));
  const wrongTypes = requiredPracticals.filter((id) => performanceAssessments.get(id)?.assessmentType !== 'practical');
  if (capstoneId && performanceAssessments.get(capstoneId)?.assessmentType !== 'capstone') wrongTypes.push(capstoneId);
  const program = programs.find((candidate) => candidate.assessmentModel?.capstone === capstoneId);
  const mappedPracticals = new Set(program?.assessmentModel?.performanceEvidence ?? []);
  const unmapped = requiredPracticals.filter((id) => !mappedPracticals.has(id));
  return { complete: missing.length === 0 && wrongTypes.length === 0 && unmapped.length === 0 && Boolean(program), missing, wrongTypes, unmapped, capstoneId };
}

let errors = 0;
let credentialBearing = 0;
let completePath = 0;
let draftIncomplete = 0;
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
  const performancePath = integratedPerformancePath(programMapped, course);
  const explicitDraftCompletionGate = course.status === 'draft' && !course.finalAssessment && (
    course.extensions?.dedicatedCourseAssessmentRequired === true ||
    course.extensions?.dedicatedLabModuleRequired === true ||
    course.extensions?.integratedPerformanceValidationRequired === true
  );

  if (!course.finalAssessment) {
    if (performancePath?.complete) {
      console.log(`${course.id}: integrated performance pathway is structurally complete (${course.extensions.credentialPracticalSetRequired.length} practicals plus ${performancePath.capstoneId}); validation and release remain gated`);
    } else if (explicitDraftCompletionGate) {
      draftIncomplete++;
      ok = false;
      const gateType = course.extensions?.integratedPerformanceValidationRequired === true
        ? 'integrated practical/capstone validation'
        : course.extensions?.dedicatedLabModuleRequired === true
          ? 'dedicated lab evidence'
          : 'dedicated final assessment';
      console.log(`${course.id}: draft credential-path course; ${gateType} is explicitly still required before pathway completion`);
      if (performancePath) {
        if (performancePath.missing.length) console.log(`${course.id}: missing performance objects: ${performancePath.missing.join(', ')}`);
        if (performancePath.wrongTypes.length) console.log(`${course.id}: wrong performance object types: ${performancePath.wrongTypes.join(', ')}`);
        if (performancePath.unmapped.length) console.log(`${course.id}: credential program does not map: ${performancePath.unmapped.join(', ')}`);
      }
    } else {
      console.error(`ERROR ${course.id}: credentialBearing=true but finalAssessment is missing without an explicit draft completion gate`);
      errors++; ok = false;
    }
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
  console.log(`${course.id}: credential-bearing; status=${course.status ?? 'unspecified'}; finalAssessment=${course.finalAssessment ?? 'none'}; legacyCredentials=${legacyIds}; credentialPrograms=${programIds}; pathwayComplete=${ok}`);
}

console.log(`Summary: courses=${courses.length}; credentialBearing=${credentialBearing}; completeCredentialPaths=${completePath}; draftIncompleteCredentialPaths=${draftIncomplete}; nonCredential=${nonCredential}`);
if (errors) process.exit(1);
