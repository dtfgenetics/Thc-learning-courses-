import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const directoryByObjectType = {
  lesson: ['content/lessons', 'lessonsTree'],
  course: ['content/courses', 'coursesTree'],
  assessment: ['content/assessments', 'assessmentsTree'],
  question: ['content/questions', 'questionsTree'],
  credential: ['content/credentials', 'credentialsTree']
};

function readAttestations() {
  const dir = path.join(root, 'content/review-attestations');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
}

function currentTree(rel) {
  try {
    return execFileSync('git', ['rev-parse', `HEAD:${rel}`], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

export function validCatalogAttestations() {
  return readAttestations().filter((attestation) => {
    if (attestation.status !== 'approved') return false;
    const scope = attestation.scope ?? {};
    return Object.values(directoryByObjectType).every(([rel, key]) => {
      if (!scope[key]) return false;
      return currentTree(rel) === scope[key];
    });
  });
}

export function catalogAttestationApproval(objectType, reviewType) {
  const mapping = directoryByObjectType[objectType];
  if (!mapping) return null;
  const [rel, key] = mapping;
  const tree = currentTree(rel);
  if (!tree) return null;
  return readAttestations()
    .filter((attestation) => attestation.status === 'approved')
    .filter((attestation) => (attestation.approvalTypes ?? []).includes(reviewType))
    .filter((attestation) => attestation.scope?.[key] === tree)
    .sort((a, b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt))[0] ?? null;
}

export function catalogAttestationStatus() {
  const attestations = readAttestations();
  const valid = validCatalogAttestations();
  return {
    records: attestations.length,
    validRecords: valid.length,
    latestValidId: valid.sort((a, b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt))[0]?.id ?? null
  };
}
