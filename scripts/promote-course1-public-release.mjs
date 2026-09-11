import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const courseId = 'COURSE-LH-TECH1-001';
const practicalId = 'PRACTICAL-LH-TECH1-001-WORKFLOW';
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const writeJson = (rel, value) => {
  const target = path.join(root, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
};
const must = (condition, message) => { if (!condition) throw new Error(message); };
const replaceText = (rel, replacements) => {
  const target = path.join(root, rel);
  if (!fs.existsSync(target)) return;
  let text = fs.readFileSync(target, 'utf8');
  for (const [from, to] of replacements) text = text.replace(from, to);
  fs.writeFileSync(target, text);
};

const coursePath = `content/courses/${courseId}.json`;
const course = readJson(coursePath);
must(course.id === courseId, 'Unexpected course identity');
course.status = 'published';
writeJson(coursePath, course);

const lessonIds = [];
const assessmentIds = new Set();
for (const moduleId of course.modules) {
  const rel = `content/modules/${moduleId}.json`;
  const module = readJson(rel);
  must(module.id === moduleId, `Module identity mismatch: ${moduleId}`);
  module.status = 'published';
  writeJson(rel, module);
  for (const lessonId of module.lessons || []) lessonIds.push(lessonId);
  if (module.assessment) assessmentIds.add(module.assessment);
}
if (course.finalAssessment) assessmentIds.add(course.finalAssessment);
must(lessonIds.length === 18, `Expected 18 Course 1 lessons, found ${lessonIds.length}`);
must(assessmentIds.size === 7, `Expected 7 Course 1 knowledge assessments, found ${assessmentIds.size}`);

for (const lessonId of lessonIds) {
  const rel = `content/lessons/${lessonId}.json`;
  const lesson = readJson(rel);
  must(lesson.id === lessonId, `Lesson identity mismatch: ${lessonId}`);
  lesson.status = 'published';
  writeJson(rel, lesson);
}

let publicItems = 0;
for (const assessmentId of assessmentIds) {
  const rel = `content/assessments/${assessmentId}.json`;
  const assessment = readJson(rel);
  must(assessment.id === assessmentId, `Assessment identity mismatch: ${assessmentId}`);
  must(['formative','summative'].includes(assessment.purpose), `Refusing to publish non-course assessment ${assessmentId} (${assessment.purpose})`);
  assessment.status = 'published';
  writeJson(rel, assessment);
  for (const itemId of assessment.items || []) {
    const itemRel = `content/questions/${itemId}.json`;
    const item = readJson(itemRel);
    must(item.id === itemId, `Item identity mismatch: ${itemId}`);
    must(['formative','summative'].includes(item.purpose), `Refusing to activate credential item ${itemId}`);
    item.status = 'active';
    writeJson(itemRel, item);
    publicItems += 1;
  }
}
must(publicItems === 108, `Expected 108 public Course 1 items, found ${publicItems}`);

const practicalPath = `content/performance-assessments/${practicalId}.json`;
const practical = readJson(practicalPath);
must(practical.id === practicalId, 'Practical identity mismatch');
must(practical.purpose !== 'credential', 'Refusing to publish a credential-purpose practical as public course work');
practical.status = 'published';
writeJson(practicalPath, practical);

replaceText('docs/learning-hub/tech1/course-001/README.md', [
  ['**Status:** Draft production package  ', '**Status:** Published learner course package  '],
  ['Draft production package', 'Published learner course package']
]);
replaceText('docs/academy-v2/certification-courses/COURSE-LH-TECH1-001_BLUEPRINT.md', [
  ['**Status:** Draft certification-course blueprint  ', '**Status:** Published certification-course instructional blueprint  '],
  ['**Planned ID:** `PRACTICAL-LH-TECH1-001-WORKFLOW`', '**Practical ID:** `PRACTICAL-LH-TECH1-001-WORKFLOW`']
]);
replaceText('docs/academy-v2/practicals/PRACTICAL-LH-TECH1-001-WORKFLOW.md', [
  ['**Status:** Draft / requires assessor calibration before operational use  ', '**Status:** Published course practical; credential-assessor calibration is governed separately  ']
]);

const manifest = {
  schemaVersion: 1,
  id: 'PUBLIC-RELEASE-LH-TECH1-001',
  courseId,
  title: course.title,
  publicationState: 'published',
  publicScope: {
    modules: course.modules,
    lessons: lessonIds,
    assessments: [...assessmentIds],
    publicCourseItems: publicItems,
    practicalId,
    studentSources: [
      'docs/learning-hub/tech1/course-001/student/MODULE-01-APPLIED-WORKPLACE-SAFETY.md',
      'docs/learning-hub/tech1/course-001/student/MODULE-02-BIOSECURITY.md',
      'docs/learning-hub/tech1/course-001/student/MODULE-03-SOPS-AUTHORITY.md',
      'docs/learning-hub/tech1/course-001/student/MODULE-04-TRACEABILITY-INVENTORY-WASTE.md',
      'docs/learning-hub/tech1/course-001/student/MODULE-05-EQUIPMENT-CARE.md',
      'docs/learning-hub/tech1/course-001/student/MODULE-06-RECORDS-HANDOFF-INTEGRATION.md',
      'docs/learning-hub/tech1/course-001/student/STUDENT-WORKBOOK.md',
      'docs/learning-hub/tech1/course-001/student/WORKBOOK-TEMPLATES.md',
      'docs/learning-hub/tech1/course-001/student/INTEGRATED-PRACTICAL.md'
    ]
  },
  excludedFromPublicRelease: [
    'credential exam items and answer data',
    'human review records and reviewer queues',
    'pilot participant records and psychometric evidence',
    'assessor calibration records',
    'credential issuance secrets and signing material'
  ],
  boundary: 'Publishing this course releases learner instruction and public course assessments only. It does not activate or publish the separate secure THC Cultivation Technician I certification examination.'
};
writeJson('content/public-releases/PUBLIC-RELEASE-LH-TECH1-001.json', manifest);
console.log(JSON.stringify({ courseId, modules: course.modules.length, lessons: lessonIds.length, assessments: assessmentIds.size, publicItems, practical: practicalId, status: 'published' }, null, 2));
