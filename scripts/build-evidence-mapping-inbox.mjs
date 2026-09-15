import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const hit = args.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
};
const outputPath = getArg('--output', 'automation/curriculum-ingestion/inbox/evidence-mapping-candidates.json');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}
function jsonFiles(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((name) => name.endsWith('.json')).sort().map((name) => readJson(path.join(dir, name)));
}

function collectReferenceContexts(value, jsonPath = '$', contextTitle = null, out = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectReferenceContexts(item, `${jsonPath}[${index}]`, contextTitle, out));
    return out;
  }
  if (!value || typeof value !== 'object') return out;
  const nextTitle = typeof value.title === 'string' ? value.title : contextTitle;
  for (const [key, child] of Object.entries(value)) {
    if (key === 'references' && Array.isArray(child)) {
      for (const referenceId of child) {
        if (typeof referenceId === 'string') out.push({referenceId, jsonPath: `${jsonPath}.references`, contextTitle: nextTitle});
      }
    } else {
      collectReferenceContexts(child, `${jsonPath}.${key}`, nextTitle, out);
    }
  }
  return out;
}

const reviewedStatuses = new Set(['reviewed', 'reviewed-source']);
const references = jsonFiles('content/references');
const referenceById = new Map(references.map((ref) => [ref.id, ref]));
const claims = jsonFiles('content/claims');
const existingPairs = new Set();
for (const claim of claims) {
  for (const lessonId of claim.supportsLessons ?? []) {
    for (const referenceId of claim.references ?? []) existingPairs.add(`${lessonId}::${referenceId}`);
  }
}

const candidates = [];
for (const lesson of jsonFiles('content/lessons')) {
  if (!lesson.id?.startsWith('LESSON-LH-TECH1-001-')) continue;
  const grouped = new Map();
  for (const occurrence of collectReferenceContexts(lesson)) {
    if (!grouped.has(occurrence.referenceId)) grouped.set(occurrence.referenceId, []);
    grouped.get(occurrence.referenceId).push({jsonPath: occurrence.jsonPath, contextTitle: occurrence.contextTitle});
  }

  for (const [referenceId, occurrences] of grouped) {
    const reference = referenceById.get(referenceId);
    if (!reference || !reviewedStatuses.has(reference.status)) continue;
    if (existingPairs.has(`${lesson.id}::${referenceId}`)) continue;
    candidates.push({
      id: `MAP-${lesson.id.replace(/^LESSON-/, '')}-${referenceId.replace(/^REF-/, '')}`,
      status: 'needs-claim-review',
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      learningObjectives: lesson.learningObjectives ?? [],
      competencies: lesson.competencies ?? [],
      referenceId,
      referenceTitle: reference.title,
      referenceType: reference.type,
      evidenceLevel: reference.evidenceLevel,
      referenceStatus: reference.status,
      url: reference.url ?? null,
      occurrences,
      recommendedAction: 'Review the cited instructional context, extract only supportable atomic claims, then create or update claim records linking this lesson and reference. Do not auto-create scientific claims from citation presence alone.'
    });
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  courseId: 'COURSE-LH-TECH1-001',
  policy: {
    candidateOnly: true,
    citationPresenceDoesNotProveClaimSupport: true,
    requireClaimReviewBeforePromotion: true
  },
  candidateCount: candidates.length,
  candidates
};

const full = path.join(root, outputPath);
fs.mkdirSync(path.dirname(full), {recursive: true});
fs.writeFileSync(full, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
