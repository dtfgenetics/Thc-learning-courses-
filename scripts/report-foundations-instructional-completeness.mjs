import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const check = process.argv.includes('--check');
const jsonOnly = process.argv.includes('--json');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(path.join(rel, name)));
}

const registry = readJson('registry/cultivation-foundations.json');
const course = readJson('content/courses/COURSE-CULT-FOUNDATIONS-001.json');
const modules = new Map(readDirJson('content/modules').map((value) => [value.id, value]));
const lessons = new Map(readDirJson('content/lessons').map((value) => [value.id, value]));
const assessments = new Map(readDirJson('content/assessments').map((value) => [value.id, value]));
const questions = readDirJson('content/questions');

const failures = [];
const domains = [];
const taughtObjectives = new Set();
const formativeObjectives = new Set();
const summativeObjectives = new Set();

for (const domain of registry.domains ?? []) {
  const module = modules.get(domain.module);
  if (!module) {
    failures.push(`${domain.id}: missing module ${domain.module}`);
    continue;
  }

  if (!(course.modules ?? []).includes(module.id)) {
    failures.push(`${domain.id}: module ${module.id} is not part of ${course.id}`);
  }

  const domainLessons = (module.lessons ?? []).map((id) => lessons.get(id)).filter(Boolean);
  if (domainLessons.length !== (module.lessons ?? []).length) {
    failures.push(`${domain.id}: one or more declared module lessons are missing`);
  }

  const moduleAssessment = assessments.get(module.assessment);
  if (!moduleAssessment) failures.push(`${domain.id}: missing module assessment ${module.assessment}`);

  const lessonObjectives = new Set(domainLessons.flatMap((lesson) => lesson.learningObjectives ?? []));
  const moduleAssessmentObjectives = new Set(moduleAssessment?.objectives ?? []);
  const moduleAssessmentItems = new Set(moduleAssessment?.items ?? []);
  const moduleAssessmentQuestions = questions.filter((question) => moduleAssessmentItems.has(question.id));

  const objectiveRows = [];
  for (const objective of domain.objectives ?? []) {
    const taught = lessonObjectives.has(objective);
    const declaredFormative = moduleAssessmentObjectives.has(objective);
    const formativeItems = moduleAssessmentQuestions.filter((question) => question.objective === objective);
    const summativeItems = questions.filter((question) =>
      question.objective === objective && ['summative', 'credential'].includes(question.purpose)
    );

    if (taught) taughtObjectives.add(objective);
    if (formativeItems.length > 0) formativeObjectives.add(objective);
    if (summativeItems.length > 0) summativeObjectives.add(objective);

    if (!taught) failures.push(`${domain.id}: objective ${objective} is not taught by any lesson in ${module.id}`);
    if (!declaredFormative) failures.push(`${domain.id}: objective ${objective} is not declared by ${moduleAssessment?.id ?? module.assessment}`);
    if (formativeItems.length === 0) failures.push(`${domain.id}: objective ${objective} has no formative item in ${moduleAssessment?.id ?? module.assessment}`);
    if (summativeItems.length === 0) failures.push(`${domain.id}: objective ${objective} has no summative/credential item in the question bank`);

    objectiveRows.push({
      objective,
      taught,
      formativeAssessmentDeclared: declaredFormative,
      formativeItems: formativeItems.length,
      summativeItems: summativeItems.length
    });
  }

  let sectionCount = 0;
  let vocabularyCount = 0;
  let workedExampleCount = 0;
  let commonMistakeCount = 0;
  let estimatedMinutes = 0;
  let substantiveLessons = 0;

  for (const lesson of domainLessons) {
    const content = lesson.content;
    const sections = content?.sections?.length ?? 0;
    const vocabulary = content?.vocabulary?.length ?? 0;
    const workedExamples = content?.workedExamples?.length ?? 0;
    const commonMistakes = content?.commonMistakes?.length ?? 0;
    sectionCount += sections;
    vocabularyCount += vocabulary;
    workedExampleCount += workedExamples;
    commonMistakeCount += commonMistakes;
    estimatedMinutes += lesson.estimatedMinutes ?? 0;
    if (content?.overview && sections >= 2 && vocabulary >= 1 && commonMistakes >= 1 && content?.practicalApplication && content?.summary) {
      substantiveLessons += 1;
    } else {
      failures.push(`${domain.id}: lesson ${lesson.id} lacks minimum substantive instructional content`);
    }
  }

  domains.push({
    id: domain.id,
    module: module.id,
    competency: domain.competencies?.[0] ?? null,
    lessonCount: domainLessons.length,
    substantiveLessons,
    estimatedMinutes,
    sections: sectionCount,
    vocabularyTerms: vocabularyCount,
    workedExamples: workedExampleCount,
    commonMistakes: commonMistakeCount,
    moduleAssessment: moduleAssessment?.id ?? null,
    objectives: objectiveRows
  });
}

const expectedObjectives = new Set((registry.domains ?? []).flatMap((domain) => domain.objectives ?? []));
const courseCompetencies = new Set(course.competencies ?? []);
const registryCompetencies = new Set((registry.domains ?? []).flatMap((domain) => domain.competencies ?? []));

for (const competency of registryCompetencies) {
  if (!courseCompetencies.has(competency)) failures.push(`${course.id}: missing registry competency ${competency}`);
}

const report = {
  course: course.id,
  version: course.version,
  generatedAt: new Date().toISOString(),
  reviewPolicy: 'Instructional completeness is evaluated before human review. Review and pilot evidence remain later release gates.',
  summary: {
    domains: domains.length,
    modules: new Set(domains.map((row) => row.module)).size,
    lessons: domains.reduce((sum, row) => sum + row.lessonCount, 0),
    substantiveLessons: domains.reduce((sum, row) => sum + row.substantiveLessons, 0),
    objectives: expectedObjectives.size,
    taughtObjectives: taughtObjectives.size,
    objectivesWithFormativeItems: formativeObjectives.size,
    objectivesWithSummativeItems: summativeObjectives.size,
    estimatedMinutes: domains.reduce((sum, row) => sum + row.estimatedMinutes, 0),
    sections: domains.reduce((sum, row) => sum + row.sections, 0),
    vocabularyTerms: domains.reduce((sum, row) => sum + row.vocabularyTerms, 0),
    workedExamples: domains.reduce((sum, row) => sum + row.workedExamples, 0),
    commonMistakes: domains.reduce((sum, row) => sum + row.commonMistakes, 0),
    structuralFailures: failures.length,
    instructionallyComplete: failures.length === 0
  },
  domains,
  failures
};

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Foundations instructional completeness: ${report.summary.instructionallyComplete ? 'PASS' : 'INCOMPLETE'}`);
  console.log(`Domains: ${report.summary.domains}`);
  console.log(`Lessons: ${report.summary.substantiveLessons}/${report.summary.lessons} substantive`);
  console.log(`Objectives taught: ${report.summary.taughtObjectives}/${report.summary.objectives}`);
  console.log(`Objectives with formative items: ${report.summary.objectivesWithFormativeItems}/${report.summary.objectives}`);
  console.log(`Objectives with summative items: ${report.summary.objectivesWithSummativeItems}/${report.summary.objectives}`);
  console.log(`Estimated learning time: ${report.summary.estimatedMinutes} minutes`);
  console.log(`Instructional sections: ${report.summary.sections}`);
  console.log(`Vocabulary terms: ${report.summary.vocabularyTerms}`);
  console.log(`Worked examples: ${report.summary.workedExamples}`);
  console.log(`Common mistakes: ${report.summary.commonMistakes}`);
  for (const domain of domains) {
    console.log(`- ${domain.id}: ${domain.substantiveLessons}/${domain.lessonCount} substantive lessons; ${domain.sections} sections; ${domain.estimatedMinutes} min`);
  }
  if (failures.length) {
    console.error('Instructional completeness gaps:');
    for (const failure of failures) console.error(`- ${failure}`);
  }
}

if (check && failures.length) process.exit(1);
