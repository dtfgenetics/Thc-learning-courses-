import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { catalogAttestationStatus, catalogAttestationApproval } from './catalog-review-attestation.mjs';

const status = catalogAttestationStatus();
assert.equal(status.validRecords, 1, 'exactly one current catalog attestation should be valid');
assert.equal(status.latestValidId, 'ATTEST-CATALOG-20260920');
assert.equal(catalogAttestationApproval('lesson', 'scientific')?.status, 'approved');
assert.equal(catalogAttestationApproval('lesson', 'editorial')?.status, 'approved');
assert.equal(catalogAttestationApproval('assessment', 'assessment')?.status, 'approved');
assert.equal(catalogAttestationApproval('question', 'assessment')?.status, 'approved');
assert.equal(catalogAttestationApproval('credential', 'credential-definition')?.status, 'approved');
assert.equal(catalogAttestationApproval('unknown', 'assessment'), null);

const queue = JSON.parse(execFileSync(process.execPath, ['scripts/build-review-queue.mjs', '--summary-only'], { encoding: 'utf8' }));
assert.equal(queue.summary.totalTasks, 1583);
assert.equal(queue.summary.approved, 1583);
assert.equal(queue.summary.pending, 0);
assert.equal(queue.summary.blocked, 0);
assert.equal(queue.summary.revisionRequired, 0);

console.log('Snapshot-bound catalog review attestation: PASS');
