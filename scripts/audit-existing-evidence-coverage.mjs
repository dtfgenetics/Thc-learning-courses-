import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const hit = args.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
};
const courseId = getArg('--course', 'COURSE-LH-TECH1-001');
const outputPath = getArg('--output');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function jsonFiles(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({name, data: readJson(path.join(dir, name))}));
}

function collectReferenceIds(value, out = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectReferenceIds(item, out);
    return out;
  }
  if (!value || typeof value !== 'object') return out;
  for (const [key, child] of Object.entries(value)) {
    if (key === 'references' && Array.isArray(child)) {
      for (const id of child) if (typeof id === 'string') out.add(id);
    } else {
      collectReferenceIds(child, out);
    }
  }
  return out;
}

const reviewedStatuses = new Set(['reviewed', 'reviewed-source']);
const references = jsonFiles('content/references').map(({data}) => data);
const referenceById = new Map(references.map((item) => [item.id, item]));
const claims = jsonFiles('content/claims').map(({data}) => data);

const lessonRows = [];
for (const {data: lesson} of jsonFiles('content/lessons')) {
  if (!lesson.id?.startsWith('LESSON-LH-TECH1-001-')) continue;
  const directIds = [...collectReferenceIds(lesson)].sort();
  const reviewedDirect = directIds.filter((id) => reviewedStatuses.has(referenceById.get(id)?.status));
  const missing = directIds.filter((id) => !referenceById.has(id));
  const unresolved = directIds.filter((id) => {
    const ref = referenceById.get(id);
    return ref && !reviewedStatuses.has(ref.status);
  });
  const linkedClaims = claims.filter((claim) => (claim.supportsLessons ?? []).includes(lesson.id));
  const claimReferenceIds = [...new Set(linkedClaims.flatMap((claim) => claim.references ?? []))];
  const reviewedClaimBacked = claimReferenceIds.filter((id) => reviewedStatuses.has(referenceById.get(id)?.status));

  lessonRows.push({
    lessonId: lesson.id,
    title: lesson.title,
    directReferenceCount: directIds.length,
    reviewedDirectReferenceCount: reviewedDirect.length,
    claimCount: linkedClaims.length,
    reviewedClaimBackedReferenceCount: reviewedClaimBacked.length,
    directReferenceIds: directIds,
    reviewedDirectReferenceIds: reviewedDirect,
    missingReferenceIds: missing,
    unresolvedReferenceIds: unresolved,
    claimIds: linkedClaims.map((claim) => claim.id).sort(),
    reviewedClaimBackedReferenceIds: reviewedClaimBacked.sort()
  });
}

const allDirect = new Set(lessonRows.flatMap((row) => row.directReferenceIds));
const allReviewedDirect = new Set(lessonRows.flatMap((row) => row.reviewedDirectReferenceIds));
const allMissing = new Set(lessonRows.flatMap((row) => row.missingReferenceIds));
const allUnresolved = new Set(lessonRows.flatMap((row) => row.unresolvedReferenceIds));
const allClaimBacked = new Set(lessonRows.flatMap((row) => row.reviewedClaimBackedReferenceIds));

const report = {
  generatedAt: new Date().toISOString(),
  courseId,
  lessonCount: lessonRows.length,
  uniqueDirectReferences: allDirect.size,
  uniqueReviewedDirectReferences: allReviewedDirect.size,
  uniqueReviewedClaimBackedReferences: allClaimBacked.size,
  missingReferenceRecords: [...allMissing].sort(),
  unresolvedReferenceRecords: [...allUnresolved].sort(),
  lessonsWithoutDirectReferences: lessonRows.filter((row) => row.directReferenceCount === 0).map((row) => row.lessonId),
  lessonsWithoutClaimBackedReviewedEvidence: lessonRows.filter((row) => row.reviewedClaimBackedReferenceCount === 0).map((row) => row.lessonId),
  lessons: lessonRows
};

console.log(JSON.stringify(report, null, 2));
if (outputPath) {
  const full = path.join(root, outputPath);
  fs.mkdirSync(path.dirname(full), {recursive: true});
  fs.writeFileSync(full, `${JSON.stringify(report, null, 2)}\n`);
}
