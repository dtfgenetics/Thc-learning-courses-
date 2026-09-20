import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { catalogAttestationStatus, catalogAttestationApproval } from './catalog-review-attestation.mjs';

const root = process.cwd();

function readAttestations() {
  const dir = path.join(root, 'content/review-attestations');
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
}

function gitObjectSha(spec) {
  try {
    return execFileSync('git', ['rev-parse', spec], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const directoryByObjectType = {
  lesson: ['content/lessons', 'lessonsTree', 'scientific'],
  assessment: ['content/assessments', 'assessmentsTree', 'assessment'],
  question: ['content/questions', 'questionsTree', 'assessment'],
  credential: ['content/credentials', 'credentialsTree', 'credential-definition']
};

const attestations = readAttestations();
const status = catalogAttestationStatus();
assert.ok(status.records >= 1, 'at least one catalog attestation record should exist');
assert.equal(status.records, attestations.length);
assert.ok(status.validRecords >= 0 && status.validRecords <= status.records);
assert.equal(Boolean(status.latestValidId), status.validRecords > 0);
assert.equal(catalogAttestationApproval('unknown', 'assessment', 'UNKNOWN-ID'), null);

for (const [objectType, [rel, scopeKey, reviewType]] of Object.entries(directoryByObjectType)) {
  const file = fs.readdirSync(path.join(root, rel)).filter((name) => name.endsWith('.json')).sort()[0];
  assert.ok(file, `${objectType}: expected at least one object file`);
  const objectId = JSON.parse(fs.readFileSync(path.join(root, rel, file), 'utf8')).id;
  const currentBlob = gitObjectSha(`HEAD:${rel}/${file}`);
  const expected = attestations
    .filter((attestation) => attestation.status === 'approved')
    .filter((attestation) => (attestation.approvalTypes ?? []).includes(reviewType))
    .some((attestation) => {
      const tree = attestation.scope?.[scopeKey];
      if (!tree) return false;
      return currentBlob === gitObjectSha(`${tree}:${file}`);
    });
  assert.equal(Boolean(catalogAttestationApproval(objectType, reviewType, objectId)), expected, `${objectType}: object-scoped approval should match immutable blob identity`);
}

const queue = JSON.parse(execFileSync(process.execPath, ['scripts/build-review-queue.mjs', '--summary-only'], { encoding: 'utf8' }));
const accounted = queue.summary.approved + queue.summary.pending + queue.summary.blocked + queue.summary.revisionRequired;
assert.equal(accounted, queue.summary.totalTasks, 'review queue states must account for every task');
assert.ok(queue.summary.approved >= 0);
assert.ok(queue.summary.pending >= 0);
assert.ok(queue.summary.blocked >= 0);
assert.ok(queue.summary.revisionRequired >= 0);

console.log('Object-scoped catalog review attestation: PASS');
