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
const reviews = readDirJson('content/reviews').map(({ data }) => data);

if (!requestedCourseId) {
  errors.push('release scope is missing: provide --course=COURSE-... or RELEASE_COURSE_ID');
}

const course = requestedCourseId ? courses.get(requestedCourseId) : null;
if (requestedCourseId && !course) errors.push(`release scope course ${requestedCourseId} does not exist`);

function hasApprovedReview(objectId, objectVersion, reviewType) {
  return reviews.some((review) =>
    review.objectId === objectId &&
    String(review.objectVersion) === String(objectVersion) &&
    review.reviewType === reviewType &&
    review.status === 'approved'
  );
}

function requirePublishedObject(object, label) {
  if (!object) return;
  if (object.status !== 'published') errors.push(`${object.id}: ${label} status must be published for a production release`);
}

function requireApprovedAssessment(assessment, label) {
  if (!assessment) return;
  if (!['approved', 'published'].includes(assessment.status)) {
    errors.push(`${assessment.id}: ${label} must be approved or published for a production release`);
  }
  if (!hasApprovedReview(assessment.id, assessment.version, 'assessment')) {
    errors.push(`${assessment.id}@${assessment.version}: missing approved assessment review record`);
  }
}

function verifyAssessmentItems(assessment, label) {
  if (!assessment) return;
  for (const itemId of assessment.items ?? []) {
    const item = questions.get(itemId);
    if (!item) {
      errors.push(`${assessment.id}: ${label} item ${itemId} does not exist`);
      continue;
    }
    if (item.status !== 'active') errors.push(`${item.id}: ${label} item must be active for production`);
    if (!hasApprovedReview(item.id, item.version, 'assessment')) {
      errors.push(`${item.id}@${item.version}: ${label} item is missing approved assessment review evidence`);
    }
  }
}

function verifyBlueprintPool(assessment) {
  if (!assessment?.blueprint) return;
  const minimumActive = Number(assessment.itemSelection?.minimumActiveItemsPerCompetency ?? 0);
  if (!Number.isFinite(minimumActive) || minimumActive < 1) {
    errors.push(`${assessment.id}: blueprint assessment must define minimumActiveItemsPerCompetency >= 1`);
    return;
  }
  for (const row of assessment.blueprint) {
    const activeItems = [...questions.values()].filter((item) =>
      item.competency === row.competency &&
      ['summative', 'credential'].includes(item.purpose) &&
      item.status === 'active'
    );
    if (activeItems.length < minimumActive) {
      errors.push(`${row.competency}: final assessment has ${activeItems.length}/${minimumActive} required active summative/credential items`);
    }
    for (const item of activeItems) {
      if (!hasApprovedReview(item.id, item.version, 'assessment')) {
        errors.push(`${item.id}@${item.version}: active credential item is missing approved assessment review evidence`);
      }
    }
  }
}

if (course) {
  requirePublishedObject(course, 'course');

  if (!course.finalAssessment) {
    errors.push(`${course.id}: finalAssessment is required for a production release`);
  }

  const checkedLessons = new Set();
  const checkedModuleAssessments = new Set();

  for (const moduleId of course.modules ?? []) {
    const module = modules.get(moduleId);
    if (!module) {
      errors.push(`${course.id}: mapped module ${moduleId} does not exist`);
      continue;
    }
    requirePublishedObject(module, 'module');

    for (const lessonId of module.lessons ?? []) {
      if (checkedLessons.has(lessonId)) continue;
      checkedLessons.add(lessonId);
      const lesson = lessons.get(lessonId);
      if (!lesson) {
        errors.push(`${module.id}: mapped lesson ${lessonId} does not exist`);
        continue;
      }
      requirePublishedObject(lesson, 'lesson');
      for (const reviewType of ['scientific', 'editorial']) {
        if (!hasApprovedReview(lesson.id, lesson.version, reviewType)) {
          errors.push(`${lesson.id}@${lesson.version}: missing approved ${reviewType} review record`);
        }
      }
    }

    if (module.assessment && !checkedModuleAssessments.has(module.assessment)) {
      checkedModuleAssessments.add(module.assessment);
      const assessment = assessments.get(module.assessment);
      if (!assessment) {
        errors.push(`${module.id}: module assessment ${module.assessment} does not exist`);
      } else {
        requireApprovedAssessment(assessment, 'module assessment');
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
    requireApprovedAssessment(finalAssessment, 'final assessment');
    verifyAssessmentItems(finalAssessment, 'final assessment');
    verifyBlueprintPool(finalAssessment);
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
      if (!['approved', 'published'].includes(credential.status)) {
        errors.push(`${credential.id}: credential definition must be approved or published for a production release`);
      }
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
    if (registry.status === 'draft') errors.push('registry/cultivation-foundations.json: release registry is still draft');
    if (registry.publicationReady !== true) errors.push('registry/cultivation-foundations.json: publicationReady must be true for a production release');
    for (const [gate, value] of Object.entries(registry.gates ?? {})) {
      if (value !== true) errors.push(`registry/cultivation-foundations.json: release gate ${gate} is not true`);
    }
    if (registry.summativeAssessment !== course.finalAssessment) {
      errors.push(`registry/cultivation-foundations.json: summative assessment ${registry.summativeAssessment} does not match ${course.finalAssessment}`);
    }
  }

  if (errors.length === 0) {
    console.log(`Production release readiness passed for ${course.id} ${course.version}; modules=${course.modules?.length ?? 0}; lessons=${checkedLessons.size}; moduleAssessments=${checkedModuleAssessments.size}; credential=${credential?.id ?? 'none'}.`);
  }
}

if (errors.length) {
  console.error(`Production release readiness failed${requestedCourseId ? ` for ${requestedCourseId}` : ''}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
