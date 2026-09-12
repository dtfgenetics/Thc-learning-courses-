import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const writeMode = process.argv.includes('--write');
const COURSE_ID = 'COURSE-LH-TECH1-001';
const RELEASE_PATH = 'content/public-releases/PUBLIC-RELEASE-LH-TECH1-001.json';
const PRACTICAL_PATH = 'content/performance-assessments/PRACTICAL-LH-TECH1-001-WORKFLOW.json';
const errors = [];
const changed = [];

function absolute(rel) { return path.join(root, rel); }
function readJson(rel) { return JSON.parse(fs.readFileSync(absolute(rel), 'utf8')); }
function writeJson(rel, value) {
  const next = `${JSON.stringify(value, null, 2)}\n`;
  const current = fs.readFileSync(absolute(rel), 'utf8');
  if (current !== next) {
    fs.writeFileSync(absolute(rel), next);
    changed.push(rel);
  }
}
function ensurePublished(rel, expectedId) {
  const value = readJson(rel);
  if (value.id !== expectedId) errors.push(`${rel}: expected id ${expectedId}, found ${value.id}`);
  if (writeMode) {
    value.status = 'published';
    writeJson(rel, value);
  } else if (value.status !== 'published') {
    errors.push(`${rel}: public academic object must be status=published, found ${value.status}`);
  }
  return value;
}
function replaceDoc(rel, replacements) {
  if (!fs.existsSync(absolute(rel))) return;
  let text = fs.readFileSync(absolute(rel), 'utf8');
  if (writeMode) {
    const before = text;
    for (const [pattern, replacement] of replacements) text = text.replace(pattern, replacement);
    if (text !== before) {
      fs.writeFileSync(absolute(rel), text);
      changed.push(rel);
    }
  }
  return text;
}
function assertNoPublicationRestriction(rel, text) {
  if (typeof text !== 'string') text = fs.readFileSync(absolute(rel), 'utf8');
  const forbidden = [
    /\bDraft production package\b/i,
    /\bDraft certification-course blueprint\b/i,
    /\bDraft\s*\/\s*requires assessor calibration before operational use\b/i,
    /\bpilot\/calibration only until approved\b/i,
    /\boperational use blocked until calibration\b/i,
    /\bpreparation only\b/i,
    /\brestricted THC Cultivation Technician I certification examination\b/i
  ];
  for (const pattern of forbidden) if (pattern.test(text)) errors.push(`${rel}: learner/public academic document contains obsolete restriction language: ${pattern}`);
}

const release = readJson(RELEASE_PATH);
if (release.courseId !== COURSE_ID) errors.push(`${RELEASE_PATH}: expected courseId ${COURSE_ID}`);
if (writeMode) {
  release.publicationState = 'published';
  release.publicationBoundary ??= {};
  release.publicationBoundary.learnerPackage = 'released';
  release.publicationBoundary.courseTests = 'released-for-learning';
  release.boundary = 'This manifest publishes the complete Course 1 learner-facing academic package, including lessons, learning assessments, practical preparation/evaluation materials, job aids and learner resources. Content remains continuously editable and improvable. The separate secure professional credential examination, credential decision records and signing material are not learner course content and remain outside the public academic package.';
  writeJson(RELEASE_PATH, release);
} else {
  if (release.publicationState !== 'published') errors.push(`${RELEASE_PATH}: publicationState must be published`);
  if (release.publicationBoundary?.learnerPackage !== 'released') errors.push(`${RELEASE_PATH}: learnerPackage must be released`);
  if (release.publicationBoundary?.courseTests !== 'released-for-learning') errors.push(`${RELEASE_PATH}: courseTests must be released-for-learning`);
}

ensurePublished(`content/courses/${COURSE_ID}.json`, COURSE_ID);

const lessonIds = new Set();
for (const moduleId of release.publicScope?.modules ?? []) {
  const rel = `content/modules/${moduleId}.json`;
  const module = ensurePublished(rel, moduleId);
  for (const lessonId of module.lessons ?? []) lessonIds.add(lessonId);
}
for (const lessonId of lessonIds) ensurePublished(`content/lessons/${lessonId}.json`, lessonId);
for (const assessmentId of release.publicScope?.assessments ?? []) ensurePublished(`content/assessments/${assessmentId}.json`, assessmentId);

const practical = ensurePublished(PRACTICAL_PATH, release.publicScope?.practicalId ?? 'PRACTICAL-LH-TECH1-001-WORKFLOW');
practical.extensions ??= {};
if (writeMode) {
  practical.extensions.operationalUseBlockedUntilCalibration = false;
  practical.extensions.standardSettingStatus = 'continuous-quality-improvement';
  practical.extensions.publicAcademicViewing = true;
  writeJson(PRACTICAL_PATH, practical);
} else {
  if (practical.extensions.operationalUseBlockedUntilCalibration === true) errors.push(`${PRACTICAL_PATH}: public academic practical must not be calibration-blocked`);
  if (practical.extensions.publicAcademicViewing !== true) errors.push(`${PRACTICAL_PATH}: publicAcademicViewing must be true`);
}

const docs = new Map([
  ['docs/learning-hub/tech1/course-001/README.md', [
    [/\*\*Status:\*\* Draft production package/g, '**Status:** Public academic course package'],
    [/draft production package/gi, 'public academic course package']
  ]],
  ['docs/learning-hub/tech1/course-001/COURSE-PACKAGE-MANIFEST.md', [
    [/restricted THC Cultivation Technician I certification examination/gi, 'separate THC Cultivation Technician I credential examination']
  ]],
  ['docs/academy-v2/certification-courses/COURSE-LH-TECH1-001_BLUEPRINT.md', [
    [/\*\*Status:\*\* Draft certification-course blueprint/g, '**Status:** Public academic curriculum blueprint'],
    [/Draft certification-course blueprint/gi, 'Public academic curriculum blueprint']
  ]],
  ['docs/academy-v2/practicals/PRACTICAL-LH-TECH1-001-WORKFLOW.md', [
    [/\*\*Status:\*\* Draft \/ requires assessor calibration before operational use/g, '**Status:** Public academic practical — continuously improvable'],
    [/operational use blocked until calibration/gi, 'calibration retained as continuous quality improvement']
  ]],
  ['docs/learning-hub/tech1/course-001/practical/CANDIDATE-PACKET-FORM-A.md', [
    [/\*\*Use:\*\* pilot\/calibration only until approved/g, '**Use:** Public academic practical form; may also support calibration and equivalent-form review']
  ]],
  ['docs/learning-hub/tech1/course-001/practical/CANDIDATE-PACKET-FORM-B.md', [
    [/\*\*Use:\*\* pilot\/calibration only until approved/g, '**Use:** Public academic practical alternate form; may also support calibration and equivalent-form review']
  ]]
]);

for (const [rel, replacements] of docs) {
  const text = replaceDoc(rel, replacements);
  assertNoPublicationRestriction(rel, text);
}

if (!writeMode) {
  const learnerVisibleRoots = [
    'docs/learning-hub/tech1/course-001/student',
    'docs/learning-hub/tech1/course-001/job-aids'
  ];
  for (const directory of learnerVisibleRoots) {
    const dir = absolute(directory);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.md'))) {
      const rel = path.join(directory, file);
      assertNoPublicationRestriction(rel, fs.readFileSync(absolute(rel), 'utf8'));
    }
  }
}

if (writeMode) {
  console.log(JSON.stringify({ courseId: COURSE_ID, normalized: changed.length, changed }, null, 2));
  process.exit(0);
}

if (errors.length) {
  console.error(`Course 1 public academic publication audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Course 1 public academic publication audit passed: 1 course, ${release.publicScope?.modules?.length ?? 0} modules, ${lessonIds.size} lessons, ${release.publicScope?.assessments?.length ?? 0} assessments, and the integrated practical are published; obsolete learner-facing draft/blocking language is absent.`);
