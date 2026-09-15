import { spawnSync } from 'node:child_process';

const courseId = 'COURSE-LH-TECH1-001';
const result = spawnSync(process.execPath, [
  'scripts/build-learning-hub-review-queue.mjs',
  `--course=${courseId}`,
  '--summary-only',
  '--check'
], { encoding: 'utf8' });

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || 'Course 1 review queue generation failed.\n');
  process.exit(result.status ?? 1);
}

const queue = JSON.parse(result.stdout);
const errors = [];
const structure = queue.structure ?? {};
const lanes = queue.lanes ?? {};
const totalExpected =
  (structure.lessons ?? 0) * 2 +
  (structure.assessments ?? 0) +
  (structure.knowledgeItems ?? 0) +
  (structure.performanceAssessments ?? 0) +
  2; // course accessibility + legal/compliance

// These are current minimum baselines, not content ceilings. Future valid additions
// should increase the queue rather than fail merely because the package grew.
if ((structure.modules ?? 0) < 6) errors.push(`Expected at least 6 current Course 1 modules, found ${structure.modules ?? 0}.`);
if ((structure.lessons ?? 0) < 18) errors.push(`Expected at least 18 current canonical lessons, found ${structure.lessons ?? 0}.`);
if ((structure.assessments ?? 0) < 7) errors.push(`Expected at least 7 current course assessment definitions, found ${structure.assessments ?? 0}.`);
if ((structure.knowledgeItems ?? 0) < 120) errors.push(`Expected at least 120 current scored knowledge items, found ${structure.knowledgeItems ?? 0}.`);
if ((structure.performanceAssessments ?? 0) < 1) errors.push('Expected the integrated Course 1 performance assessment in the review inventory.');

if ((queue.summary?.totalTasks ?? -1) !== totalExpected) {
  errors.push(`Review queue task count ${queue.summary?.totalTasks ?? 'missing'} does not match dynamically expected ${totalExpected}.`);
}
if ((lanes['lesson-scientific']?.total ?? 0) !== structure.lessons) errors.push('Every canonical lesson must have one scientific review task.');
if ((lanes['lesson-editorial']?.total ?? 0) !== structure.lessons) errors.push('Every canonical lesson must have one editorial review task.');
if ((lanes['assessment-definition']?.total ?? 0) !== structure.assessments) errors.push('Every Course 1 assessment definition must have an assessment review task.');
const knowledgeLaneTotal =
  (lanes['formative-item']?.total ?? 0) +
  (lanes['summative-item']?.total ?? 0) +
  (lanes['credential-item']?.total ?? 0);
if (knowledgeLaneTotal !== structure.knowledgeItems) errors.push('Every Course 1 knowledge item must be represented in an assessment-review lane.');
if ((lanes['performance-assessment']?.total ?? 0) !== structure.performanceAssessments) errors.push('Every Course 1 performance assessment must have an assessment review task.');
if ((lanes['course-accessibility']?.total ?? 0) !== 1) errors.push('Course 1 must have one rendered accessibility review task.');
if ((lanes['course-legal-compliance']?.total ?? 0) !== 1) errors.push('Course 1 must have one legal/compliance review task.');

const humanReviewOpen = (queue.summary?.approved ?? 0) < (queue.summary?.totalTasks ?? 0);
const report = {
  courseId,
  currentInventory: structure,
  reviewTasks: queue.summary,
  laneCoverage: lanes,
  dynamicallyExpectedTaskCount: totalExpected,
  humanReviewOpen,
  note: 'Minimum inventory checks protect the current Course 1 package without imposing a maximum. New valid lessons, assessments, items, or practicals must automatically expand the review queue.'
};

console.log(JSON.stringify(report, null, 2));

if (errors.length) {
  console.error('Course 1 review-inventory audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Course 1 review-inventory audit passed. Queue completeness is verified; human approvals remain real human gates.');
