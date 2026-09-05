import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry/cultivation-foundations.json'), 'utf8'));

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

const rows = [];
for (const domain of registry.domains ?? []) {
  const module = readJson(path.join('content/modules', `${domain.module}.json`));
  for (const lessonId of module.lessons ?? []) {
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

    rows.push({
      domain: domain.id,
      module: module.id,
      lesson: lesson.id,
      lessonStatus: lesson.status,
      substantiveContent: substantive,
      referencesReady,
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
    referenceReadyLessons: domainRows.filter((row) => row.referencesReady).length
  };
});

const summary = {
  domains: domainSummary.length,
  lessons: rows.length,
  substantiveLessons: rows.filter((row) => row.substantiveContent).length,
  referencesReadyLessons: rows.filter((row) => row.referencesReady).length,
  scientificReviewGate: registry.gates?.allLessonsScientificallyReviewed ?? false,
  editorialReviewGate: registry.gates?.allLessonsEditoriallyReviewed ?? false,
  publicationReady: registry.publicationReady === true
};

console.log(JSON.stringify({ summary, domainSummary, lessons: rows }, null, 2));

if (registry.gates?.allLessonsHaveSubstantiveContent === true && summary.substantiveLessons !== rows.length) {
  throw new Error(`Registry claims all lessons have substantive content, but report found ${summary.substantiveLessons}/${rows.length}.`);
}
