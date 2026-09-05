import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry/cultivation-foundations.json'), 'utf8'));

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

const reviews = readDirJson('content/reviews');
function hasApprovedReview(objectId, objectVersion, reviewType) {
  return reviews.some((review) =>
    review.objectId === objectId &&
    String(review.objectVersion) === String(objectVersion) &&
    review.reviewType === reviewType &&
    review.status === 'approved'
  );
}

const rows = [];
const seenLessons = new Set();
for (const domain of registry.domains ?? []) {
  const module = readJson(path.join('content/modules', `${domain.module}.json`));
  for (const lessonId of module.lessons ?? []) {
    if (seenLessons.has(lessonId)) continue;
    seenLessons.add(lessonId);

    const lesson = readJson(path.join('content/lessons', `${lessonId}.json`));
    const substantive = Boolean(
      lesson.content?.overview &&
      (lesson.content?.vocabulary?.length ?? 0) > 0 &&
      (lesson.content?.sections?.length ?? 0) >= 2 &&
      (lesson.content?.commonMistakes?.length ?? 0) > 0 &&
      lesson.content?.practicalApplication &&
      lesson.content?.summary
    );

    const referenceStatuses = (lesson.references ?? []).map((id) => {
      const ref = readJson(path.join('content/references', `${id}.json`));
      return { id, status: ref.status, evidenceLevel: ref.evidenceLevel };
    });
    const referencesReady = referenceStatuses.length > 0 && referenceStatuses.every((ref) => ref.status !== 'needs-authoritative-source' && ref.evidenceLevel !== 'unverified');
    const scientificApproved = hasApprovedReview(lesson.id, lesson.version, 'scientific');
    const editorialApproved = hasApprovedReview(lesson.id, lesson.version, 'editorial');

    rows.push({
      domain: domain.id,
      module: module.id,
      lesson: lesson.id,
      lessonVersion: lesson.version,
      lessonStatus: lesson.status,
      substantiveContent: substantive,
      referencesReady,
      scientificApproved,
      editorialApproved,
      references: referenceStatuses
    });
  }
}

const domainSummary = (registry.domains ?? []).map((domain) => {
  const domainRows = rows.filter((row) => row.domain === domain.id);
  return {
    domain: domain.id,
    lessons: domainRows.length,
    substantiveLessons: domainRows.filter((row) => row.substantiveContent).length,
    referenceReadyLessons: domainRows.filter((row) => row.referencesReady).length,
    scientificallyReviewedLessons: domainRows.filter((row) => row.scientificApproved).length,
    editoriallyReviewedLessons: domainRows.filter((row) => row.editorialApproved).length
  };
});

const scientificApprovedCount = rows.filter((row) => row.scientificApproved).length;
const editorialApprovedCount = rows.filter((row) => row.editorialApproved).length;
const actualScientificGate = rows.length > 0 && scientificApprovedCount === rows.length;
const actualEditorialGate = rows.length > 0 && editorialApprovedCount === rows.length;

const summary = {
  domains: domainSummary.length,
  lessons: rows.length,
  substantiveLessons: rows.filter((row) => row.substantiveContent).length,
  referencesReadyLessons: rows.filter((row) => row.referencesReady).length,
  scientificallyReviewedLessons: scientificApprovedCount,
  editoriallyReviewedLessons: editorialApprovedCount,
  scientificReviewGate: actualScientificGate,
  editorialReviewGate: actualEditorialGate,
  registryScientificReviewGate: registry.gates?.allLessonsScientificallyReviewed ?? false,
  registryEditorialReviewGate: registry.gates?.allLessonsEditoriallyReviewed ?? false,
  publicationReady: registry.publicationReady === true
};

console.log(JSON.stringify({ summary, domainSummary, lessons: rows }, null, 2));

if (registry.gates?.allLessonsHaveSubstantiveContent === true && summary.substantiveLessons !== rows.length) {
  throw new Error(`Registry claims all lessons have substantive content, but report found ${summary.substantiveLessons}/${rows.length}.`);
}
if (registry.gates?.allLessonsScientificallyReviewed === true && !actualScientificGate) {
  throw new Error(`Registry claims scientific review is complete, but approved records exist for ${scientificApprovedCount}/${rows.length} lessons.`);
}
if (registry.gates?.allLessonsEditoriallyReviewed === true && !actualEditorialGate) {
  throw new Error(`Registry claims editorial review is complete, but approved records exist for ${editorialApprovedCount}/${rows.length} lessons.`);
}
