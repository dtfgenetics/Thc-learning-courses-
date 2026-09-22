import fs from 'node:fs';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const boundary = readJson('registry/content-system-boundary.json');
const curriculum = readJson('registry/curriculum.json');

const fail = (message) => {
  console.error(`CONTENT SYSTEM BOUNDARY VIOLATION: ${message}`);
  process.exitCode = 1;
};

const encyclopedia = boundary?.systems?.encyclopedia;
const certification = boundary?.systems?.certification;
const legacy = boundary?.systems?.legacy420Catalog;

if (encyclopedia?.targetCount !== 420) {
  fail('encyclopedia target must remain exactly 420 topics');
}
if (encyclopedia?.canonicalIdPattern !== 'THC-ENC-001..THC-ENC-420') {
  fail('canonical encyclopedia identity must remain THC-ENC-001..THC-ENC-420');
}
if (certification?.mustRemainIndependent !== true) {
  fail('certification curriculum must remain independent from encyclopedia completion');
}
for (const field of [
  'encyclopediaMaySatisfyCourseObjective',
  'encyclopediaMaySatisfyLessonRequirement',
  'encyclopediaMaySatisfyAssessmentCoverage',
  'encyclopediaMaySatisfyCourseCompletion',
  'encyclopediaMaySatisfyCredentialEligibility',
  'testsMayAssessUntaughtMaterial',
  'crossCourseTestSubstitutionAllowed'
]) {
  if (certification?.[field] !== false) fail(`${field} must remain false`);
}
if (legacy?.status !== 'crosswalk-only') {
  fail('historical THC-C001..THC-C420 catalog must remain crosswalk-only');
}
if (boundary?.countingRules?.noCombinedCompletionPercentage !== true) {
  fail('encyclopedia and certification may not share one completion percentage');
}

const certificationCollections = {
  courses: curriculum.courses ?? [],
  lessons: curriculum.lessons ?? [],
  assessments: curriculum.assessments ?? []
};

for (const [collection, ids] of Object.entries(certificationCollections)) {
  for (const id of ids) {
    if (/^THC-ENC-\d{3}$/.test(id)) {
      fail(`${collection} contains encyclopedia topic ${id}`);
    }
    if (/^THC-C\d{3}$/.test(id)) {
      fail(`${collection} contains exact historical catalog record ${id}`);
    }
  }
}

const courseIds = certificationCollections.courses;
if (!courseIds.some((id) => id.startsWith('COURSE-LH-'))) {
  fail('certification curriculum must contain dedicated COURSE-LH-* objects');
}

const root = process.cwd();
const readIfPresent = (rel) => fs.existsSync(rel) ? readJson(rel) : null;

const courseFiles = fs.readdirSync('content/courses')
  .filter((name) => name.startsWith('COURSE-LH-') && name.endsWith('.json'));

for (const name of courseFiles) {
  const course = readJson(`content/courses/${name}`);
  const courseKey = course.id.replace(/^COURSE-LH-/, '');
  const expectedObjectivePrefix = `LO-LH-${courseKey}-`;
  const expectedItemPrefix = `ITEM-LH-${courseKey}-`;
  const expectedAssessmentPrefix = `ASSESS-LH-${courseKey}-`;

  const structuralText = JSON.stringify({
    modules: course.modules,
    finalAssessment: course.finalAssessment,
    extensions: {
      integratedPractical: course.extensions?.integratedPractical,
      credentialPath: course.extensions?.credentialPath
    }
  });
  if (/THC-ENC-\d{3}|THC-C\d{3}/.test(structuralText)) {
    fail(`${course.id} structurally depends on encyclopedia/legacy 420 material`);
  }

  if (course.finalAssessment) {
    if (!course.finalAssessment.startsWith(expectedAssessmentPrefix)) {
      fail(`${course.id} final assessment ${course.finalAssessment} is not course-owned`);
      continue;
    }
    const assessment = readIfPresent(`content/assessments/${course.finalAssessment}.json`);
    if (!assessment) {
      fail(`${course.id} final assessment file is missing: ${course.finalAssessment}`);
      continue;
    }

    for (const objective of assessment.objectives ?? []) {
      if (!objective.startsWith(expectedObjectivePrefix)) {
        fail(`${assessment.id} includes objective not owned by ${course.id}: ${objective}`);
      }
    }
    for (const item of assessment.items ?? []) {
      if (!item.startsWith(expectedItemPrefix)) {
        fail(`${assessment.id} includes item not owned by ${course.id}: ${item}`);
        continue;
      }
      const itemDoc = readIfPresent(`content/questions/${item}.json`);
      if (!itemDoc) {
        fail(`${assessment.id} item file missing: ${item}`);
        continue;
      }
      if (!itemDoc.objective?.startsWith(expectedObjectivePrefix)) {
        fail(`${item} objective is not owned by ${course.id}: ${itemDoc.objective ?? 'missing'}`);
      }
      if (/THC-ENC-\d{3}|THC-C\d{3}/.test(JSON.stringify({
        objective:itemDoc.objective,
        competency:itemDoc.competency
      }))) {
        fail(`${item} uses encyclopedia/legacy 420 material as test structure`);
      }
    }
  }
}

console.log(`Content-system boundary OK: 420 encyclopedia is separate; ${courseFiles.length} certification courses use dedicated course-owned material/test namespaces.`);
