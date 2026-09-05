import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry/cultivation-foundations.json'), 'utf8'));

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

const rows = [];
for (const domain of registry.domains ?? []) {
  const lessonFile = path.join('content/lessons', `${domain.lesson}.json`);
  const lesson = readJson(lessonFile);
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

  rows.push({
    domain: domain.id,
    lesson: lesson.id,
    lessonStatus: lesson.status,
    substantiveContent: substantive,
    referencesReady,
    references: referenceStatuses
  });
}

const summary = {
  domains: rows.length,
  substantiveContent: rows.filter((row) => row.substantiveContent).length,
  referencesReady: rows.filter((row) => row.referencesReady).length,
  scientificReviewGate: registry.gates?.allLessonsScientificallyReviewed ?? false,
  editorialReviewGate: registry.gates?.allLessonsEditoriallyReviewed ?? false,
  publicationReady: registry.publicationReady === true
};

console.log(JSON.stringify({ summary, domains: rows }, null, 2));

if (registry.gates?.allDomainsHaveSubstantiveContent === true && summary.substantiveContent !== rows.length) {
  throw new Error(`Registry claims all domains have substantive content, but report found ${summary.substantiveContent}/${rows.length}.`);
}
