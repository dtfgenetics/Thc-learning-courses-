import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const check = process.argv.includes('--check');
const json = process.argv.includes('--json');

const moduleIds = [
  'MOD-PLANT-BIO-001',
  'MOD-FLOWER-001',
  'MOD-ENV-001',
  'MOD-LIGHT-001',
  'MOD-WATER-001',
  'MOD-ROOTZONE-001',
  'MOD-NUTRITION-001',
  'MOD-PROP-001',
  'MOD-CANOPY-001',
  'MOD-IPM-001',
  'MOD-POSTHARVEST-001'
];

function readJson(rel) {
  const target = path.join(root, rel);
  return fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : null;
}

function listJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(path.join(rel, name)))
    .filter(Boolean);
}

const questions = listJson('content/questions');
const questionById = new Map(questions.map((item) => [item.id, item]));
const formativeByObjective = new Map();
for (const item of questions) {
  if (item.purpose !== 'formative' || typeof item.objective !== 'string') continue;
  const list = formativeByObjective.get(item.objective) ?? [];
  list.push(item.id);
  formativeByObjective.set(item.objective, list);
}

const failures = [];
const warnings = [];
const modules = [];

for (const moduleId of moduleIds) {
  const module = readJson(`content/modules/${moduleId}.json`);
  if (!module) {
    failures.push({ type: 'missing-module', moduleId });
    continue;
  }

  const moduleReport = {
    id: module.id,
    title: module.title,
    status: module.status,
    assessment: module.assessment ?? null,
    lessons: []
  };

  const assessment = module.assessment
    ? readJson(`content/assessments/${module.assessment}.json`)
    : null;

  if (!assessment) {
    failures.push({ type: 'missing-module-assessment', moduleId, assessmentId: module.assessment ?? null });
  } else {
    if (assessment.purpose !== 'formative') {
      failures.push({ type: 'module-assessment-not-formative', moduleId, assessmentId: assessment.id, purpose: assessment.purpose });
    }
    if (!Array.isArray(assessment.items) || assessment.items.length < 6) {
      failures.push({ type: 'module-assessment-too-thin', moduleId, assessmentId: assessment.id, itemCount: assessment.items?.length ?? 0, minimum: 6 });
    }
    for (const itemId of assessment.items ?? []) {
      const item = questionById.get(itemId);
      if (!item) failures.push({ type: 'missing-assessment-item', moduleId, assessmentId: assessment.id, itemId });
      else if (item.purpose !== 'formative') failures.push({ type: 'non-formative-item-in-module-checkpoint', moduleId, assessmentId: assessment.id, itemId, purpose: item.purpose });
    }
  }

  for (const lessonId of module.lessons ?? []) {
    const lesson = readJson(`content/lessons/${lessonId}.json`);
    if (!lesson) {
      failures.push({ type: 'missing-lesson', moduleId, lessonId });
      continue;
    }
    const c = lesson.content ?? {};
    const visuals = c.extensions?.primaryVisuals ?? [];
    const approvedRasterVisuals = visuals.filter((visual) =>
      visual?.type === 'image' &&
      visual?.extensions?.releaseApproved === true &&
      typeof visual?.src === 'string' &&
      /\.(?:png|webp|jpe?g)$/i.test(visual.src)
    );
    const objectiveIds = lesson.learningObjectives ?? lesson.objectives ?? [];
    const objectiveCoverage = objectiveIds.map((objectiveId) => ({
      objectiveId,
      formativeCount: (formativeByObjective.get(objectiveId) ?? []).length
    }));

    const lessonReport = {
      id: lesson.id,
      title: lesson.title,
      status: lesson.status,
      blocks: c.blocks?.length ?? 0,
      workedExamples: c.workedExamples?.length ?? 0,
      commonMistakes: c.commonMistakes?.length ?? 0,
      references: lesson.references?.length ?? 0,
      approvedRasterVisuals: approvedRasterVisuals.length,
      objectiveCoverage
    };
    moduleReport.lessons.push(lessonReport);

    if ((c.blocks?.length ?? 0) < 4) failures.push({ type: 'lesson-block-depth', moduleId, lessonId, actual: c.blocks?.length ?? 0, minimum: 4 });
    if ((c.workedExamples?.length ?? 0) < 4) failures.push({ type: 'worked-example-depth', moduleId, lessonId, actual: c.workedExamples?.length ?? 0, minimum: 4 });
    if ((c.commonMistakes?.length ?? 0) < 5) failures.push({ type: 'common-mistake-depth', moduleId, lessonId, actual: c.commonMistakes?.length ?? 0, minimum: 5 });
    if ((lesson.references?.length ?? 0) < 2) failures.push({ type: 'reference-depth', moduleId, lessonId, actual: lesson.references?.length ?? 0, minimum: 2 });
    if (approvedRasterVisuals.length < 1) failures.push({ type: 'approved-raster-visual-missing', moduleId, lessonId });
    for (const coverage of objectiveCoverage) {
      if (coverage.formativeCount < 2) failures.push({ type: 'formative-objective-coverage', moduleId, lessonId, objectiveId: coverage.objectiveId, actual: coverage.formativeCount, minimum: 2 });
    }

    if (lesson.status !== 'published') warnings.push({ type: 'lesson-still-draft', moduleId, lessonId, status: lesson.status });
  }

  if (assessment && Array.isArray(assessment.items)) {
    for (const lessonReport of moduleReport.lessons) {
      const lesson = readJson(`content/lessons/${lessonReport.id}.json`);
      for (const objectiveId of lesson?.learningObjectives ?? lesson?.objectives ?? []) {
        const count = assessment.items
          .map((itemId) => questionById.get(itemId))
          .filter((item) => item?.purpose === 'formative' && item?.objective === objectiveId)
          .length;
        if (count < 2) failures.push({ type: 'module-checkpoint-objective-balance', moduleId, assessmentId: assessment.id, objectiveId, actual: count, minimum: 2 });
      }
    }
  }

  if (module.status !== 'published') warnings.push({ type: 'module-still-draft', moduleId, status: module.status });
  modules.push(moduleReport);
}

const report = {
  scope: 'shared-foundation-modules-tech1-courses-2-through-6',
  generatedAt: new Date().toISOString(),
  requirements: {
    minimumBlocksPerLesson: 4,
    minimumWorkedExamplesPerLesson: 4,
    minimumCommonMistakesPerLesson: 5,
    minimumReferencesPerLesson: 2,
    minimumApprovedRasterVisualsPerLesson: 1,
    minimumFormativeItemsPerObjective: 2,
    minimumModuleCheckpointItems: 6,
    minimumModuleCheckpointItemsPerObjective: 2,
    credentialOrSummativeItemsAllowedInModuleCheckpoint: false
  },
  summary: {
    modulesChecked: modules.length,
    lessonsChecked: modules.reduce((sum, module) => sum + module.lessons.length, 0),
    failures: failures.length,
    warnings: warnings.length,
    releaseReady: failures.length === 0
  },
  failures,
  warnings,
  modules
};

if (json) {
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} else {
  console.log('Shared foundation academic readiness');
  console.log(`Modules: ${report.summary.modulesChecked}`);
  console.log(`Lessons: ${report.summary.lessonsChecked}`);
  console.log(`Blocking failures: ${report.summary.failures}`);
  console.log(`Status warnings: ${report.summary.warnings}`);
  console.log(`Release-ready by machine content gate: ${report.summary.releaseReady ? 'YES' : 'NO'}`);
  if (failures.length) {
    console.log('\nBlocking issues:');
    for (const failure of failures) console.log(`- ${failure.type}: ${failure.lessonId ?? failure.moduleId ?? failure.assessmentId ?? ''}`);
  }
}

if (check && failures.length) process.exitCode = 1;
