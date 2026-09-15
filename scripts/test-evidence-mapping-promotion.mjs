import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root = process.cwd();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-promotion-'));
const script = path.join(root, 'scripts/promote-evidence-mapping.mjs');

function run(review, extra = []) {
  const file = path.join(temp, `${review.id}.json`);
  fs.writeFileSync(file, `${JSON.stringify(review, null, 2)}\n`);
  return spawnSync(process.execPath, [script, `--review=${file}`, ...extra], {
    cwd: root,
    encoding: 'utf8'
  });
}

const base = {
  id: 'EMR-CI-TEST-001',
  mappingCandidateId: 'MAP-CI-TEST-001',
  action: 'create',
  claimId: 'CLAIM-TEST-EVIDENCE-PROMOTION-001',
  statement: 'This test-only claim verifies that reviewed lesson evidence can pass the dry-run promotion gate without writing course content.',
  domain: 'ci-test',
  lessonIds: ['LESSON-LH-TECH1-001-06'],
  referenceIds: ['REF-EPA-WPS-REI-2026'],
  competencyIds: [],
  objectiveIds: [],
  version: '1.0.0',
  claimStatus: 'approved',
  reviewDueAt: null,
  status: 'approved',
  review: {
    editor: 'CI fixture',
    scientificReviewer: 'CI fixture',
    approvedAt: '2026-09-15T00:00:00Z',
    aiAssisted: true,
    rationale: 'Test-only approval metadata used to exercise validation and dry-run behavior.',
    notes: 'This fixture is never promoted to content.'
  }
};

const valid = run(base);
if (valid.status !== 0) {
  console.error(valid.stdout);
  console.error(valid.stderr);
  throw new Error('expected valid dry-run review to pass');
}
const parsed = JSON.parse(valid.stdout);
if (parsed.write !== false || parsed.claim?.evidenceStatus !== 'reviewed') {
  throw new Error('dry-run output did not produce the expected reviewed claim projection');
}
if (fs.existsSync(path.join(root, 'content/claims/CLAIM-TEST-EVIDENCE-PROMOTION-001.json'))) {
  throw new Error('dry-run unexpectedly wrote a claim file');
}

const badReference = run({
  ...base,
  id: 'EMR-CI-TEST-002',
  claimId: 'CLAIM-TEST-EVIDENCE-PROMOTION-002',
  referenceIds: ['REF-DOES-NOT-EXIST']
});
if (badReference.status === 0 || !`${badReference.stderr}${badReference.stdout}`.includes('reference does not exist')) {
  throw new Error('nonexistent evidence was not blocked');
}

const writeOutsideApproved = run({
  ...base,
  id: 'EMR-CI-TEST-003',
  claimId: 'CLAIM-TEST-EVIDENCE-PROMOTION-003'
}, ['--write']);
if (writeOutsideApproved.status === 0 || !`${writeOutsideApproved.stderr}${writeOutsideApproved.stdout}`.includes('--write is only permitted')) {
  throw new Error('write outside approved review directory was not blocked');
}

console.log('Evidence mapping promotion safeguards passed.');
