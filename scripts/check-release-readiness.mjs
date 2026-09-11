import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({ file: path.join(rel, name), data: readJson(path.join(rel, name)) }));
}

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

const requestedCourseId = argValue('course') || process.env.RELEASE_COURSE_ID || process.env.THC_RELEASE_COURSE || null;
const requestedCredentialId = argValue('credential') || process.env.RELEASE_CREDENTIAL_ID || null;

const lessons = new Map(readDirJson('content/lessons').map(({ data }) => [data.id, data]));
const modules = new Map(readDirJson('content/modules').map(({ data }) => [data.id, data]));
const courses = new Map(readDirJson('content/courses').map(({ data }) => [data.id, data]));
const assessments = new Map(readDirJson('content/assessments').map(({ data }) => [data.id, data]));
const questions = new Map(readDirJson('content/questions').map(({ data }) => [data.id, data]));
const credentials = readDirJson('content/credentials').map(({ data }) => data);

if (!requestedCourseId) {
  errors.push('release scope is missing: provide --course=COURSE-... or RELEASE_COURSE_ID');
}

const course = requestedCourseId ? courses.get(requestedCourseId) : null;
if (requestedCourseId && !course) errors.push(`release scope course ${requestedCourseId} does not exist`);

function verifyAssessmentItems(assessment, label) {
  if (!assessment) return;
  for (const itemId of assessment.items ?? []) {
    if (!questions.has(itemId)) {
      errors.push(`${assessment.id}: ${label} item ${itemId} does not exist`);
    }
  }
}

function verifyBlueprintCoverage(assessment) {
  if (!assessment?.blueprint) return;
  for (const row of assessment.blueprint) {
    if (!row.competency) {
      errors.push(`${assessment.id}: blueprint row is missing competency`);
      continue;
    }
    const authoredItems = [...questions.values()].filter((item) =>
      item.competency === row.competency && ['summative', 'credential'].includes(item.purpose)
    );
    if (authoredItems.length < 1) {
      errors.push(`${assessment.id}: blueprint competency ${row.competency} has no authored summative/credential item`);
    }
  }
}

if (course) {
  if (!course.finalAssessment) {
    errors.push(`${course.id}: finalAssessment is required`);
  }

  const checkedLessons = new Set();
  const checkedModuleAssessments = new Set();

  for (const moduleId of course.modules ?? []) {
    const module = modules.get(moduleId);
    if (!module) {
      errors.push(`${course.id}: mapped module ${moduleId} does not exist`);
      continue;
    }

    for (const lessonId of module.lessons ?? []) {
      if (checkedLessons.has(lessonId)) continue;
      checkedLessons.add(lessonId);
      if (!lessons.has(lessonId)) {
        errors.push(`${module.id}: mapped lesson ${lessonId} does not exist`);
      }
    }

    if (module.assessment && !checkedModuleAssessments.has(module.assessment)) {
      checkedModuleAssessments.add(module.assessment);
      const assessment = assessments.get(module.assessment);
      if (!assessment) {
        errors.push(`${module.id}: module assessment ${module.assessment} does not exist`);
      } else {
        verifyAssessmentItems(assessment, 'module assessment');
      }
    }
  }

  const finalAssessment = course.finalAssessment ? assessments.get(course.finalAssessment) : null;
  if (course.finalAssessment && !finalAssessment) {
    errors.push(`${course.id}: final assessment ${course.finalAssessment} does not exist`);
  } else if (finalAssessment) {
    if (!['summative', 'credential'].includes(finalAssessment.purpose)) {
      errors.push(`${finalAssessment.id}: final assessment purpose must be summative or credential`);
    }
    verifyAssessmentItems(finalAssessment, 'final assessment');
    verifyBlueprintCoverage(finalAssessment);
  }

  const mappedCredentials = credentials.filter((credential) => credential.course === course.id);
  let credential = null;
  if (course.credentialBearing) {
    if (requestedCredentialId) {
      credential = credentials.find((candidate) => candidate.id === requestedCredentialId) ?? null;
      if (!credential) errors.push(`release credential ${requestedCredentialId} does not exist`);
      else if (credential.course !== course.id) errors.push(`${credential.id}: credential maps to ${credential.course}, not ${course.id}`);
    } else if (mappedCredentials.length === 1) {
      credential = mappedCredentials[0];
    } else if (mappedCredentials.length === 0) {
      errors.push(`${course.id}: credentialBearing=true but no credential definition maps to the course`);
    } else {
      errors.push(`${course.id}: ${mappedCredentials.length} credential definitions map to the course; provide --credential=... explicitly`);
    }

    if (credential) {
      const requiredAssessments = new Set(credential.eligibility?.requiredAssessments ?? []);
      if (course.finalAssessment && !requiredAssessments.has(course.finalAssessment)) {
        errors.push(`${credential.id}: eligibility must require course final assessment ${course.finalAssessment}`);
      }
      if (finalAssessment && Number(credential.eligibility?.minimumPassingScorePercent) !== Number(finalAssessment.passingScorePercent)) {
        errors.push(`${credential.id}: eligibility passing score must match ${finalAssessment.id} (${finalAssessment.passingScorePercent})`);
      }
      for (const assessmentId of requiredAssessments) {
        if (!assessments.has(assessmentId)) errors.push(`${credential.id}: required assessment ${assessmentId} does not exist`);
      }
    }
  } else if (mappedCredentials.length > 0) {
    errors.push(`${course.id}: credentialBearing=false but ${mappedCredentials.length} credential definition(s) map to the course`);
  }

  if (course.id === 'COURSE-CULT-FOUNDATIONS-001') {
    const registry = readJson('registry/cultivation-foundations.json');
    if (registry.course !== course.id) errors.push(`registry/cultivation-foundations.json: course ${registry.course} does not match release scope ${course.id}`);
    if (registry.summativeAssessment !== course.finalAssessment) {
      errors.push(`registry/cultivation-foundations.json: summative assessment ${registry.summativeAssessment} does not match ${course.finalAssessment}`);
    }
  }

  if (errors.length === 0) {
    console.log(`Certification release integrity passed for ${course.id} ${course.version}; modules=${course.modules?.length ?? 0}; lessons=${checkedLessons.size}; moduleAssessments=${checkedModuleAssessments.size}; credential=${credential?.id ?? 'none'}.`);
  }
}

if (errors.length) {
  console.error(`Certification release integrity failed${requestedCourseId ? ` for ${requestedCourseId}` : ''}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
