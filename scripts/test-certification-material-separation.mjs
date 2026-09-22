import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const certificationDirs = [
  'content/courses',
  'content/modules',
  'content/lessons',
  'content/questions',
  'content/assessments',
  'content/performance-assessments'
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith('.json') ? [full] : [];
  });
}

function getCourseKey(id) {
  const match = /(?:COURSE|ASSESS|ITEM|LESSON|LO)-LH-([A-Z0-9]+)-(\d{3})/.exec(id ?? '');
  return match ? `${match[1]}-${match[2]}` : null;
}

const structuralKeys = new Set([
  'modules',
  'lessons',
  'learningOutcomes',
  'objectives',
  'items',
  'finalAssessment',
  'integratedPractical',
  'linkedPerformanceAssessment',
  'courseId',
  'credentialPath'
]);

function inspectStructural(value, keyPath, file, problems) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectStructural(item, `${keyPath}[${index}]`, file, problems));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const next = keyPath ? `${keyPath}.${key}` : key;
      if (structuralKeys.has(key)) inspectStructural(child, next, file, problems);
      else if (key === 'extensions' || key === 'blueprint') inspectStructural(child, next, file, problems);
    }
    return;
  }
  if (typeof value !== 'string') return;

  if (/\bTHC-C\d{3}\b/.test(value) || /\bTHC-ENC-\d{3}\b/.test(value)) {
    problems.push(`${file}: ${keyPath} structurally depends on standalone 420 Encyclopedia content: ${value}`);
  }
}

const problems = [];
let certificationObjects = 0;
let checkedAssessments = 0;

for (const relDir of certificationDirs) {
  for (const file of walk(path.join(root, relDir))) {
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    const id = doc.id ?? '';
    const isCertificationObject =
      /^(COURSE|MOD|LESSON|LO|ITEM|ASSESS|PRACTICAL)-LH-/.test(id) ||
      relDir === 'content/courses';

    if (!isCertificationObject) continue;
    certificationObjects += 1;
    inspectStructural(doc, '', path.relative(root, file), problems);

    if (/^ASSESS-LH-/.test(id)) {
      checkedAssessments += 1;
      const assessmentKey = getCourseKey(id);
      const courseId = doc.extensions?.courseId;
      if (courseId) {
        const courseKey = getCourseKey(courseId);
        if (assessmentKey && courseKey && assessmentKey !== courseKey) {
          problems.push(`${path.relative(root, file)}: assessment ${id} is linked to mismatched course ${courseId}`);
        }
      }

      for (const objective of doc.objectives ?? []) {
        const objectiveKey = getCourseKey(objective);
        if (assessmentKey && objectiveKey && objectiveKey !== assessmentKey) {
          problems.push(`${path.relative(root, file)}: objective ${objective} is not owned by assessment course ${assessmentKey}`);
        }
      }

      for (const itemId of doc.items ?? []) {
        const itemKey = getCourseKey(itemId);
        if (assessmentKey && itemKey && itemKey !== assessmentKey) {
          problems.push(`${path.relative(root, file)}: item ${itemId} is not owned by assessment course ${assessmentKey}`);
        }
      }
    }
  }
}

const crosswalkPath = path.join(root, 'registry/learning-hub-course-resource-crosswalk.json');
if (fs.existsSync(crosswalkPath)) {
  const crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, 'utf8'));
  const boundary = crosswalk.boundary ?? {};
  for (const field of ['affectsCourseComposition','affectsCourseCompletion','affectsAssessmentCoverage','affectsCredentialEligibility']) {
    if (boundary[field] !== false) problems.push(`registry/learning-hub-course-resource-crosswalk.json: ${field} must be false`);
  }
  if ((crosswalk.courses ?? []).length !== 0) {
    problems.push('registry/learning-hub-course-resource-crosswalk.json: 420 Encyclopedia entries must not be mapped into certification course composition');
  }
}

if (problems.length) {
  console.error('Certification material separation failed:');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`Certification material separation passed: ${certificationObjects} certification objects checked; ${checkedAssessments} course assessments checked; 420 Encyclopedia excluded from certification composition and completion.`);
