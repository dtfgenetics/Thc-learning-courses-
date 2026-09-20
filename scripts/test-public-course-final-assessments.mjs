import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildAcademyCatalog } from '../apps/web/server.mjs';

const root = process.cwd();
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const exists = (rel) => fs.existsSync(path.join(root, rel));

const specs = [
  {
    courseId: 'COURSE-HOME-GROW-001',
    finalAssessment: 'ASSESS-HOME-GROW-FINAL-001',
    itemPrefix: 'ITEM-HOME-GROW-FINAL-',
    moduleAssessments: ['ASSESS-HOME-START-001', 'ASSESS-HOME-WORKFLOW-001']
  },
  {
    courseId: 'COURSE-OUTDOOR-GREENHOUSE-001',
    finalAssessment: 'ASSESS-OUTDOOR-GREENHOUSE-FINAL-001',
    itemPrefix: 'ITEM-OUTDOOR-GREENHOUSE-FINAL-',
    moduleAssessments: ['ASSESS-OUTDOOR-SITE-MODULE-001', 'ASSESS-OUTDOOR-MGMT-MODULE-001']
  },
  {
    courseId: 'COURSE-OUTDOOR-RESILIENCE-001',
    finalAssessment: 'ASSESS-OUTDOOR-RESILIENCE-FINAL-001',
    itemPrefix: 'ITEM-OUTDOOR-RESILIENCE-FINAL-',
    moduleAssessments: ['ASSESS-OUTDOOR-ESTABLISH-001', 'ASSESS-OUTDOOR-RISK-001']
  },
  {
    courseId: 'COURSE-ROOTZONE-ADVANCED-001',
    finalAssessment: 'ASSESS-ROOTZONE-ADVANCED-FINAL-001',
    itemPrefix: 'ITEM-ROOTZONE-ADVANCED-FINAL-',
    moduleAssessments: ['ASSESS-HYDRO-ADV-MODULE-001', 'ASSESS-SOIL-BIO-MODULE-001']
  },
  {
    courseId: 'COURSE-SAFETY-RESPONSIBLE-001',
    finalAssessment: 'ASSESS-SAFETY-RESPONSIBLE-FINAL-001',
    itemPrefix: 'ITEM-SAFETY-RESPONSIBLE-FINAL-',
    moduleAssessments: ['ASSESS-SAFETY-WORK-MODULE-001', 'ASSESS-RESPONSIBLE-LEGAL-MODULE-001']
  }
];

const catalog = buildAcademyCatalog({ previewDrafts: true });
const catalogByCourse = new Map((catalog.courses ?? []).map((course) => [course.id, course]));

for (const spec of specs) {
  const course = read(`content/courses/${spec.courseId}.json`);
  assert.equal(course.credentialBearing, false, `${spec.courseId} must remain a noncredential public academy course`);
  assert.equal(course.finalAssessment, spec.finalAssessment, `${spec.courseId} must point at its course final`);
  assert.equal(course.extensions?.certificationUseStatus, 'not-authorized', `${spec.courseId} must not authorize certification use`);

  const final = read(`content/assessments/${spec.finalAssessment}.json`);
  assert.equal(final.purpose, 'summative', `${final.id} must be an academic summative, not credential-purpose`);
  assert.equal(final.status, 'draft', `${final.id} must stay draft until human/release gates are recorded`);
  assert.equal(final.extensions?.courseFinalProfile, 'public-noncredential-dedicated-bank');
  assert.equal(final.extensions?.certificationUseStatus, 'not-authorized');
  assert.deepEqual(final.extensions?.sourceModuleAssessments, spec.moduleAssessments);
  assert.equal(final.extensions?.dedicatedItemBankSource, 'preserved-from-prior-course-final-branches');
  assert.equal(final.feedbackMode, 'after-submit');
  assert.equal(final.passingScorePercent, 80);
  assert.equal(final.items.length, 12, `${final.id} must expose a dedicated 12-item summative final bank`);

  const moduleAssessments = spec.moduleAssessments.map((id) => read(`content/assessments/${id}.json`));
  const moduleItems = moduleAssessments.flatMap((assessment) => assessment.items);
  const moduleCompetencies = new Set(moduleAssessments.flatMap((assessment) => assessment.competencies));
  const moduleObjectives = new Set(moduleAssessments.flatMap((assessment) => assessment.objectives));
  assert.deepEqual(new Set(final.competencies), moduleCompetencies, `${final.id} competency coverage must match module checks`);
  assert.deepEqual(new Set(final.objectives), moduleObjectives, `${final.id} objective coverage must match module checks`);
  assert.equal(final.items.some((itemId) => moduleItems.includes(itemId)), false, `${final.id} final items must be distinct from module-check items`);

  const objectiveCounts = new Map([...moduleObjectives].map((id) => [id, 0]));

  for (const itemId of final.items) {
    assert.ok(itemId.startsWith(spec.itemPrefix), `${itemId} must use the dedicated public final item prefix`);
    assert.ok(exists(`content/questions/${itemId}.json`), `${final.id} missing item ${itemId}`);
    const item = read(`content/questions/${itemId}.json`);
    assert.equal(item.purpose, 'summative', `${itemId} must be a summative public-course item, not credential-purpose`);
    assert.equal(item.extensions?.certificationUseStatus, 'not-authorized', `${itemId} must not authorize certification use`);
    assert.ok(final.competencies.includes(item.competency), `${itemId} competency must be in ${final.id}`);
    assert.ok(final.objectives.includes(item.objective), `${itemId} objective must be in ${final.id}`);
    assert.ok(Array.isArray(item.references) && item.references.length > 0, `${itemId} must retain references`);
    objectiveCounts.set(item.objective, objectiveCounts.get(item.objective) + 1);
  }
  for (const [objectiveId, count] of objectiveCounts) assert.ok(count >= 1, `${final.id} must cover ${objectiveId}`);

  const catalogCourse = catalogByCourse.get(spec.courseId);
  assert.ok(catalogCourse, `${spec.courseId} must appear in the draft-preview learner catalog`);
  assert.equal(catalogCourse.finalAssessment?.id, spec.finalAssessment, `${spec.courseId} catalog must expose safe final-assessment metadata`);
  assert.equal(catalogCourse.finalAssessment?.purpose, 'summative');
  assert.equal(catalogCourse.finalAssessment?.itemCount, final.items.length);
  assert.equal(catalogCourse.finalAssessment?.certificationUseStatus, 'not-authorized');
  assert.equal(Object.hasOwn(catalogCourse.finalAssessment, 'items'), false, `${spec.courseId} catalog must not expose raw item ids`);
}

console.log(`Public noncredential course finals passed: ${specs.length} courses expose dedicated draft academic final banks in the learner catalog without authorizing certification use or leaking item identifiers.`);
