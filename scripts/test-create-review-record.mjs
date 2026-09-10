import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReviewRecord, findReviewTarget } from './create-review-record.mjs';

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'thc-review-record-'));
fs.mkdirSync(path.join(tempRoot, 'content/lessons'), { recursive: true });
fs.mkdirSync(path.join(tempRoot, 'content/questions'), { recursive: true });
fs.writeFileSync(path.join(tempRoot, 'content/lessons/LESSON-TEST-001.json'), JSON.stringify({
  id: 'LESSON-TEST-001', version: '2.3.4', title: 'Test lesson', status: 'draft'
}, null, 2));
fs.writeFileSync(path.join(tempRoot, 'content/questions/ITEM-RISKY-001.json'), JSON.stringify({
  id: 'ITEM-RISKY-001', version: 1, status: 'draft', purpose: 'summative', stem: 'Which option best reflects the evidence in this scenario?',
  choices: ['This is a substantially longer keyed answer that creates a visible test-wise cue for the learner', 'Short distractor', 'Another short distractor', 'Third short distractor'],
  correct: 0, rationale: 'This rationale is long enough to satisfy the automated minimum-length preflight requirement.', references: ['REF-TEST-001']
}, null, 2));
fs.writeFileSync(path.join(tempRoot, 'content/questions/ITEM-CLEAN-001.json'), JSON.stringify({
  id: 'ITEM-CLEAN-001', version: 1, status: 'draft', purpose: 'summative', stem: 'Which option best reflects the evidence in this scenario?',
  choices: ['Compare the observations with representative repeated measurements before deciding', 'Increase the intervention before checking whether the measurements are representative', 'Use the single most extreme observation as the primary basis for the decision', 'Replace the recorded observations with a calendar-based assumption instead'],
  correct: 0, rationale: 'Representative repeated measurements provide stronger evidence than a single extreme observation or an unsupported assumption.', references: ['REF-TEST-001']
}, null, 2));

try {
  const target = findReviewTarget('LESSON-TEST-001', tempRoot);
  assert.ok(target, 'target should resolve');
  assert.equal(target.data.version, '2.3.4');

  const changes = buildReviewRecord({ objectId: 'LESSON-TEST-001', reviewType: 'editorial', reviewerId: 'reviewer-1', status: 'changes-requested', notes: 'Clarify the opening paragraph.', reviewedAt: '2026-09-06T05:00:00.000Z', baseDir: tempRoot });
  assert.equal(changes.objectVersion, '2.3.4');
  assert.equal(changes.status, 'changes-requested');

  assert.throws(() => buildReviewRecord({ objectId: 'LESSON-TEST-001', reviewType: 'editorial', reviewerId: 'reviewer-1', status: 'approved', baseDir: tempRoot }), /confirm-approved/);
  assert.throws(() => buildReviewRecord({ objectId: 'LESSON-TEST-001', reviewType: 'scientific', reviewerId: 'reviewer-1', status: 'approved', confirmApproved: true, baseDir: tempRoot }), /at least one --evidence/);

  const approved = buildReviewRecord({ objectId: 'LESSON-TEST-001', reviewType: 'scientific', reviewerId: 'scientist-1', status: 'approved', confirmApproved: true, evidenceChecked: ['REF-TEST-001'], reviewedAt: '2026-09-06T05:01:00.000Z', baseDir: tempRoot });
  assert.deepEqual(approved.evidenceChecked, ['REF-TEST-001']);

  assert.throws(() => buildReviewRecord({ objectId: 'ITEM-RISKY-001', reviewType: 'assessment', reviewerId: 'assessor-1', status: 'approved', confirmApproved: true, baseDir: tempRoot }), /assessment approval blocked by high-severity item preflight/);
  const cleanApproval = buildReviewRecord({ objectId: 'ITEM-CLEAN-001', reviewType: 'assessment', reviewerId: 'assessor-1', status: 'approved', confirmApproved: true, baseDir: tempRoot });
  assert.equal(cleanApproval.status, 'approved');

  assert.throws(() => buildReviewRecord({ objectId: 'LESSON-MISSING-001', reviewType: 'editorial', reviewerId: 'reviewer-1', status: 'rejected', baseDir: tempRoot }), /target not found/);
  assert.throws(() => buildReviewRecord({ objectId: 'LESSON-TEST-001', reviewType: 'scientific', reviewerId: 'reviewer-1', status: 'changes-requested', evidenceChecked: ['REF-A', 'REF-A'], baseDir: tempRoot }), /evidenceChecked must be unique/);
  assert.throws(() => buildReviewRecord({ objectId: 'LESSON-TEST-001', reviewType: 'unknown', reviewerId: 'reviewer-1', status: 'rejected', baseDir: tempRoot }), /invalid reviewType/);

  console.log('Safe review-record creation tests passed.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

const validatorScript = fileURLToPath(new URL('./validate-reviews.mjs', import.meta.url));
const historyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'thc-review-history-'));
const lessonDir = path.join(historyRoot, 'content/lessons');
const reviewDir = path.join(historyRoot, 'content/reviews');
fs.mkdirSync(lessonDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function runReviewValidator() {
  return spawnSync(process.execPath, [validatorScript], {
    cwd: historyRoot,
    encoding: 'utf8'
  });
}

function reviewRecord({ id, objectVersion, reviewType, reviewerId }) {
  return {
    id,
    objectId: 'LESSON-HISTORY-001',
    objectVersion,
    reviewType,
    status: 'approved',
    reviewerId,
    reviewedAt: '2026-09-07T03:55:06.000Z',
    ...(reviewType === 'scientific' ? { evidenceChecked: ['REF-HISTORY-001'] } : {})
  };
}

try {
  const lessonPath = path.join(lessonDir, 'LESSON-HISTORY-001.json');
  writeJson(lessonPath, {
    id: 'LESSON-HISTORY-001',
    version: '1.0.2',
    title: 'Versioned lesson review history test',
    status: 'approved'
  });
  writeJson(path.join(reviewDir, 'REVIEW-HISTORY-EDITORIAL-OLD.json'), reviewRecord({
    id: 'REVIEW-HISTORY-EDITORIAL-OLD',
    objectVersion: '1.0.1',
    reviewType: 'editorial',
    reviewerId: 'editor-1'
  }));
  writeJson(path.join(reviewDir, 'REVIEW-HISTORY-SCIENTIFIC-OLD.json'), reviewRecord({
    id: 'REVIEW-HISTORY-SCIENTIFIC-OLD',
    objectVersion: '1.0.1',
    reviewType: 'scientific',
    reviewerId: 'scientist-1'
  }));

  const approvedWithHistory = runReviewValidator();
  assert.equal(approvedWithHistory.status, 0, approvedWithHistory.stderr);
  assert.match(approvedWithHistory.stdout, /2 historical review record\(s\) are stale for current-version promotion/);

  writeJson(lessonPath, {
    id: 'LESSON-HISTORY-001',
    version: '1.0.2',
    title: 'Versioned lesson review history test',
    status: 'published'
  });
  const publishedWithoutCurrentReviews = runReviewValidator();
  assert.equal(publishedWithoutCurrentReviews.status, 1, 'published content must fail closed without exact-version approvals');
  assert.match(publishedWithoutCurrentReviews.stderr, /missing approved scientific review evidence/);
  assert.match(publishedWithoutCurrentReviews.stderr, /missing approved editorial review evidence/);

  writeJson(path.join(reviewDir, 'REVIEW-HISTORY-EDITORIAL-CURRENT.json'), reviewRecord({
    id: 'REVIEW-HISTORY-EDITORIAL-CURRENT',
    objectVersion: '1.0.2',
    reviewType: 'editorial',
    reviewerId: 'editor-2'
  }));
  writeJson(path.join(reviewDir, 'REVIEW-HISTORY-SCIENTIFIC-CURRENT.json'), reviewRecord({
    id: 'REVIEW-HISTORY-SCIENTIFIC-CURRENT',
    objectVersion: '1.0.2',
    reviewType: 'scientific',
    reviewerId: 'scientist-2'
  }));

  const publishedWithCurrentReviews = runReviewValidator();
  assert.equal(publishedWithCurrentReviews.status, 0, publishedWithCurrentReviews.stderr);
  assert.match(publishedWithCurrentReviews.stdout, /2 historical review record\(s\) are stale for current-version promotion/);

  console.log('Historical review/version semantics tests passed.');
} finally {
  fs.rmSync(historyRoot, { recursive: true, force: true });
}
