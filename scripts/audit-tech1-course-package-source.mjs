import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const readDirJson = (rel) => {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort().map((name) => readJson(path.join(rel, name)));
};

const courses = new Map(readDirJson('content/courses').map((entry) => [entry.id, entry]));
const modules = new Map(readDirJson('content/modules').map((entry) => [entry.id, entry]));
const lessons = new Map(readDirJson('content/lessons').map((entry) => [entry.id, entry]));
const objectives = new Map(readDirJson('content/learning-objectives').map((entry) => [entry.id, entry]));
const assessments = new Map(readDirJson('content/assessments').map((entry) => [entry.id, entry]));
const questions = new Map(readDirJson('content/questions').map((entry) => [entry.id, entry]));
const performancePlan = readJson('registry/technician-i-performance-plan.json');
const labPlan = readJson('registry/technician-i-integrated-lab-plan.json');
const performanceIds = new Set((performancePlan.practicals ?? []).map((entry) => entry.id));
const targetIds = [2, 3, 4, 5, 6, 7].map((number) => `COURSE-LH-TECH1-${String(number).padStart(3, '0')}`);

const errors = [];
const results = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

function normalizePracticals(course) {
  const value = course.extensions?.mappedPracticals ?? course.extensions?.mappedPractical ?? [];
  return Array.isArray(value) ? value : (value ? [value] : []);
}

function resolveAssessmentItems(assessment, courseId) {
  const resolved = [];
  for (const itemId of assessment?.items ?? []) {
    const item = questions.get(itemId);
    assert(item, `${courseId}: assessment ${assessment.id} cannot resolve item ${itemId}.`);
    if (item) resolved.push(item);
  }
  return resolved;
}

for (const courseId of targetIds) {
  const course = courses.get(courseId);
  assert(course, `${courseId}: course definition missing.`);
  if (!course) continue;

  const key = courseId.replace(/^COURSE-/, '');
  const dedicatedModulePrefix = `MOD-${key}-`;
  const dedicatedLessonPrefix = `LESSON-${key}-`;
  const dedicatedObjectivePrefix = `LO-${key}-`;
  const assessmentPrefix = `ASSESS-${key}-`;

  assert(course.status === 'draft', `${courseId}: current source-package audit expects draft lifecycle status until human release evidence exists.`);
  assert(course.credentialBearing === true, `${courseId}: credentialBearing must be true for the Technician I pathway.`);
  assert(course.extensions?.credentialPath === 'CREDPROG-CULT-TECH-I-001', `${courseId}: credentialPath must resolve to Technician I.`);
  assert(course.extensions?.contentCeiling === null, `${courseId}: contentCeiling must remain null (no artificial content ceiling).`);
  assert(Array.isArray(course.intendedAudience) && course.intendedAudience.length > 0, `${courseId}: intendedAudience missing.`);
  assert(Array.isArray(course.deliveryModes) && course.deliveryModes.length > 0, `${courseId}: deliveryModes missing.`);
  assert(typeof course.evidencePolicy === 'string' && course.evidencePolicy.length > 40, `${courseId}: evidencePolicy missing or too weak.`);
  assert(typeof course.assessmentPolicy === 'string' && course.assessmentPolicy.length > 40, `${courseId}: assessmentPolicy missing or too weak.`);
  assert(Array.isArray(course.competencies) && course.competencies.length > 0, `${courseId}: competencies missing.`);
  assert(Array.isArray(course.learningOutcomes) && course.learningOutcomes.length >= 4, `${courseId}: expected at least four course learning outcomes.`);
  assert(course.extensions?.humanTechnicalReviewRequired === true, `${courseId}: human technical review must remain required.`);
  assert(course.extensions?.accessibilityReviewRequired === true, `${courseId}: accessibility review must remain required.`);

  const resolvedModules = [];
  for (const moduleId of course.modules ?? []) {
    const module = modules.get(moduleId);
    assert(module, `${courseId}: cannot resolve module ${moduleId}.`);
    if (!module) continue;
    resolvedModules.push(module);
    for (const lessonId of module.lessons ?? []) assert(lessons.has(lessonId), `${courseId}: module ${moduleId} cannot resolve lesson ${lessonId}.`);
  }
  assert(resolvedModules.length === (course.modules ?? []).length && resolvedModules.length > 0, `${courseId}: module graph is incomplete.`);

  const dedicatedModules = [...modules.values()].filter((entry) => entry.id?.startsWith(dedicatedModulePrefix));
  const dedicatedLessons = [...lessons.values()].filter((entry) => entry.id?.startsWith(dedicatedLessonPrefix));
  const dedicatedObjectives = [...objectives.values()].filter((entry) => entry.id?.startsWith(dedicatedObjectivePrefix));
  assert(dedicatedModules.length >= 1, `${courseId}: missing course-specific occupational module.`);
  assert(dedicatedLessons.length >= 4, `${courseId}: expected at least four course-specific applied lessons; found ${dedicatedLessons.length}.`);
  assert(dedicatedObjectives.length >= 4, `${courseId}: expected at least four controlled course-specific objectives; found ${dedicatedObjectives.length}.`);

  for (const lesson of dedicatedLessons) {
    const lessonObjectives = lesson.learningObjectives ?? lesson.objectives ?? [];
    assert(lessonObjectives.length > 0, `${courseId}: dedicated lesson ${lesson.id} has no objective mapping.`);
    for (const objectiveId of lessonObjectives) assert(objectives.has(objectiveId), `${courseId}: dedicated lesson ${lesson.id} cannot resolve objective ${objectiveId}.`);
    assert((lesson.references ?? []).length > 0, `${courseId}: dedicated lesson ${lesson.id} has no evidence references.`);
    assert(Boolean(lesson.content?.overview), `${courseId}: dedicated lesson ${lesson.id} has no overview.`);
    assert(Boolean(lesson.content?.summary), `${courseId}: dedicated lesson ${lesson.id} has no summary.`);
    assert((lesson.content?.blocks ?? []).length > 0, `${courseId}: dedicated lesson ${lesson.id} has no rich instructional blocks.`);
  }

  if (courseId !== 'COURSE-LH-TECH1-007') {
    const formativeId = `${assessmentPrefix}M01`;
    const formative = assessments.get(formativeId);
    const final = course.finalAssessment ? assessments.get(course.finalAssessment) : null;
    assert(formative, `${courseId}: missing formative assessment ${formativeId}.`);
    assert(course.finalAssessment === `${assessmentPrefix}FINAL`, `${courseId}: finalAssessment must be ${assessmentPrefix}FINAL.`);
    assert(final, `${courseId}: final assessment cannot be resolved.`);

    const formativeItems = formative ? resolveAssessmentItems(formative, courseId) : [];
    const finalItems = final ? resolveAssessmentItems(final, courseId) : [];
    const combinedIds = [...(formative?.items ?? []), ...(final?.items ?? [])];
    assert(new Set(combinedIds).size === combinedIds.length, `${courseId}: formative and summative assessment banks overlap.`);
    assert(formativeItems.length === course.extensions?.formativeItemCount, `${courseId}: formative item count does not match course metadata.`);
    assert(finalItems.length === course.extensions?.summativeItemCount, `${courseId}: summative item count does not match course metadata.`);
    assert(combinedIds.length === course.extensions?.dedicatedItemCount, `${courseId}: total dedicated assessment item count does not match course metadata.`);

    for (const item of formativeItems) {
      assert(item.purpose === 'formative', `${courseId}: ${item.id} must be formative.`);
      assert((item.references ?? []).length > 0, `${courseId}: formative item ${item.id} has no evidence references.`);
      assert(dedicatedObjectives.some((objective) => objective.id === item.objective), `${courseId}: formative item ${item.id} maps outside the dedicated objective set.`);
    }
    for (const item of finalItems) {
      assert(item.purpose === 'summative', `${courseId}: ${item.id} must be summative.`);
      assert((item.references ?? []).length > 0, `${courseId}: summative item ${item.id} has no evidence references.`);
      assert(dedicatedObjectives.some((objective) => objective.id === item.objective), `${courseId}: summative item ${item.id} maps outside the dedicated objective set.`);
    }

    const mappedPracticals = normalizePracticals(course);
    for (const practicalId of mappedPracticals) assert(performanceIds.has(practicalId), `${courseId}: mapped practical ${practicalId} is not present in the Technician I performance plan.`);

    results.push({
      courseId,
      profile: 'ordinary-course',
      lifecycle: course.status,
      dedicatedModules: dedicatedModules.length,
      dedicatedLessons: dedicatedLessons.length,
      dedicatedObjectives: dedicatedObjectives.length,
      formativeItems: formativeItems.length,
      summativeItems: finalItems.length,
      mappedPracticals,
      sourceState: 'source-structure-complete-human-validation-open'
    });
  } else {
    assert(course.finalAssessment === null, `${courseId}: integrated lab should not expose a redundant ordinary final assessment.`);
    const readinessId = course.extensions?.formativeReadinessAssessment;
    const readiness = readinessId ? assessments.get(readinessId) : null;
    assert(readinessId === `${assessmentPrefix}M01`, `${courseId}: formative readiness assessment must use the controlled M01 ID.`);
    assert(readiness, `${courseId}: readiness assessment cannot be resolved.`);
    const readinessItems = readiness ? resolveAssessmentItems(readiness, courseId) : [];
    assert(readinessItems.length >= 12, `${courseId}: expected at least 12 readiness items.`);
    for (const item of readinessItems) assert(item.purpose === 'formative', `${courseId}: readiness item ${item.id} must be formative, not credential-operational.`);

    assert(course.extensions?.dedicatedLabModule && modules.has(course.extensions.dedicatedLabModule), `${courseId}: dedicated lab module cannot be resolved.`);
    assert(course.extensions?.labPlan === labPlan.id, `${courseId}: labPlan must resolve to ${labPlan.id}.`);
    const requiredPracticals = course.extensions?.credentialPracticalSetRequired ?? [];
    const labPracticalIds = new Set((labPlan.practicals ?? []).map((entry) => entry.id));
    assert(requiredPracticals.length === 6, `${courseId}: expected six required Technician I practicals.`);
    for (const practicalId of requiredPracticals) assert(labPracticalIds.has(practicalId), `${courseId}: required practical ${practicalId} missing from integrated lab plan.`);
    assert(course.extensions?.capstoneRequired === labPlan.capstone?.id, `${courseId}: required capstone does not match integrated lab plan.`);
    assert(labPlan.capstone?.secureCredentialFormApproved === false, `${courseId}: secure credential capstone form must remain unapproved/publicly closed during development.`);
    assert(course.extensions?.liveCredentialFormApproved === false, `${courseId}: live credential form must remain false until real release approval exists.`);

    results.push({
      courseId,
      profile: 'integrated-practice-lab',
      lifecycle: course.status,
      dedicatedModules: dedicatedModules.length,
      dedicatedLessons: dedicatedLessons.length,
      dedicatedObjectives: dedicatedObjectives.length,
      readinessItems: readinessItems.length,
      practicals: requiredPracticals.length,
      capstone: course.extensions?.capstoneRequired,
      sourceState: 'source-structure-complete-human-validation-open'
    });
  }
}

console.log(JSON.stringify({
  credentialProgram: 'CREDPROG-CULT-TECH-I-001',
  contract: 'docs/LEARNING-HUB-COURSE-PACKAGE-CONTRACT.md',
  auditedCourses: results.length,
  results,
  humanGatesRemainOpen: true
}, null, 2));

if (errors.length) {
  console.error('Technician I course-package source audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Technician I Courses 2–7 source-package audit passed. This verifies development-source structure only; it does not close gold-standard package, human, pilot, calibration, standard-setting, secure-exam or credential-release gates.');
