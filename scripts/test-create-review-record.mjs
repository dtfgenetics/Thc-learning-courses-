import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildReviewRecord, findReviewTarget } from './create-review-record.mjs';

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'thc-review-record-'));
fs.mkdirSync(path.join(tempRoot, 'content/lessons'), { recursive: true });
fs.writeFileSync(path.join(tempRoot, 'content/lessons/LESSON-TEST-001.json'), JSON.stringify({
  id: 'LESSON-TEST-001',
  version: '2.3.4',
  title: 'Test lesson',
  status: 'draft'
}, null, 2));

try {
  const target = findReviewTarget('LESSON-TEST-001', tempRoot);
  assert.ok(target, 'target should resolve');
  assert.equal(target.data.version, '2.3.4');

  const changes = buildReviewRecord({
    objectId: 'LESSON-TEST-001',
    reviewType: 'editorial',
    reviewerId: 'reviewer-1',
    status: 'changes-requested',
    notes: 'Clarify the opening paragraph.',
    reviewedAt: '2026-09-06T05:00:00.000Z',
    baseDir: tempRoot
  });
  assert.equal(changes.objectVersion, '2.3.4');
  assert.equal(changes.status, 'changes-requested');
  assert.match(changes.id, /^REVIEW-LESSON-TEST-001-EDITORIAL-20260906050000$/);

  assert.throws(() => buildReviewRecord({
    objectId: 'LESSON-TEST-001', reviewType: 'editorial', reviewerId: 'reviewer-1', status: 'approved', baseDir: tempRoot
  }), /confirm-approved/);

  assert.throws(() => buildReviewRecord({
    objectId: 'LESSON-TEST-001', reviewType: 'scientific', reviewerId: 'reviewer-1', status: 'approved', confirmApproved: true, baseDir: tempRoot
  }), /at least one --evidence/);

  const approved = buildReviewRecord({
    objectId: 'LESSON-TEST-001',
    reviewType: 'scientific',
    reviewerId: 'scientist-1',
    status: 'approved',
    confirmApproved: true,
    evidenceChecked: ['REF-TEST-001'],
    reviewedAt: '2026-09-06T05:01:00.000Z',
    baseDir: tempRoot
  });
  assert.deepEqual(approved.evidenceChecked, ['REF-TEST-001']);
  for (const field of ['id', 'objectId', 'objectVersion', 'reviewType', 'status', 'reviewerId', 'reviewedAt']) {
    assert.ok(approved[field], `record must contain ${field}`);
  }

  assert.throws(() => buildReviewRecord({
    objectId: 'LESSON-MISSING-001', reviewType: 'editorial', reviewerId: 'reviewer-1', status: 'rejected', baseDir: tempRoot
  }), /target not found/);

  assert.throws(() => buildReviewRecord({
    objectId: 'LESSON-TEST-001', reviewType: 'scientific', reviewerId: 'reviewer-1', status: 'changes-requested', evidenceChecked: ['REF-A', 'REF-A'], baseDir: tempRoot
  }), /evidenceChecked must be unique/);

  assert.throws(() => buildReviewRecord({
    objectId: 'LESSON-TEST-001', reviewType: 'unknown', reviewerId: 'reviewer-1', status: 'rejected', baseDir: tempRoot
  }), /invalid reviewType/);

  console.log('Safe review-record creation tests passed.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
