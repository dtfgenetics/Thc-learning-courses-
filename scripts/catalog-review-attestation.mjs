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
const shaCache = new Map();
const treeEntryCache = new Map();

function readAttestations() {
  const dir = path.join(root, 'content/review-attestations');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
}

function gitObjectSha(spec) {
  if (shaCache.has(spec)) return shaCache.get(spec);
  try {
    const sha = execFileSync('git', ['rev-parse', spec], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
    shaCache.set(spec, sha);
    return sha;
  } catch {
    shaCache.set(spec, null);
    return null;
  }
}

function treeEntries(treeSha) {
  if (treeEntryCache.has(treeSha)) return treeEntryCache.get(treeSha);
  const output = execFileSync('git', ['ls-tree', treeSha], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const entries = new Map(output.trim().split(/\r?\n/).filter(Boolean).map((line) => {
    const [metadata, name] = line.split('\t');
    return [name, metadata.split(' ')[2]];
  }));
  treeEntryCache.set(treeSha, entries);
  return entries;
}

function currentTree(rel) {
  return gitObjectSha(`HEAD:${rel}`);
}

function currentObjectBlob(rel, objectId) {
  const tree = currentTree(rel);
  return tree ? treeEntries(tree).get(`${objectId}.json`) ?? null : null;
}

function attestedObjectBlob(treeSha, objectId) {
  return treeEntries(treeSha).get(`${objectId}.json`) ?? null;
}

export function validCatalogAttestations() {
  return readAttestations().filter((attestation) => {
    if (attestation.status !== 'approved') return false;
    const scope = attestation.scope ?? {};
    return Object.values(directoryByObjectType).every(([rel, key]) => Boolean(scope[key]) && currentTree(rel) === scope[key]);
  });
}

export function catalogAttestationApproval(objectType, reviewType, objectId = null) {
  const mapping = directoryByObjectType[objectType];
  if (!mapping) return null;
  const [rel, key] = mapping;
  const tree = currentTree(rel);
  if (!tree) return null;

  return readAttestations()
    .filter((attestation) => attestation.status === 'approved')
    .filter((attestation) => (attestation.approvalTypes ?? []).includes(reviewType))
    .filter((attestation) => {
      const attestedTree = attestation.scope?.[key];
      if (!attestedTree) return false;
      if (!objectId) return attestedTree === tree;

      const currentBlob = currentObjectBlob(rel, objectId);
      const attestedBlob = attestedObjectBlob(attestedTree, objectId);
      return Boolean(currentBlob) && currentBlob === attestedBlob;
    })
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
