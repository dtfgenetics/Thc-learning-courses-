#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { validCatalogAttestations } from './catalog-review-attestation.mjs';

const root = process.cwd();
const write = process.argv.includes('--write');
const confirm = process.argv.includes('--confirm-approved');

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({
      name,
      path: path.join(dir, name),
      data: JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))
    }));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function compactTimestamp(iso) {
  return iso.replace(/[-:.TZ]/g, '').slice(0, 14);
}

function reviewId(objectId, reviewType, reviewedAt) {
  return `REVIEW-${objectId}-${reviewType.toUpperCase()}-${compactTimestamp(reviewedAt)}`;
}

const attestations = validCatalogAttestations();
if (attestations.length === 0) {
  console.error('No valid snapshot-bound catalog approval attestation matches the current content trees.');
  process.exit(1);
}
const attestation = attestations.sort((a, b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt))[0];

const lessons = readDirJson('content/lessons');
const courses = readDirJson('content/courses');
const assessments = readDirJson('content/assessments');
const questions = readDirJson('content/questions');
const credentials = readDirJson('content/credentials');
const existingReviews = readDirJson('content/reviews').map((entry) => entry.data);
const reviewDir = path.join(root, 'content/reviews');

function hasApprovedReview(objectId, objectVersion, reviewType) {
  return existingReviews.some((review) =>
    review.objectId === objectId &&
    String(review.objectVersion) === String(objectVersion) &&
    review.reviewType === reviewType &&
    review.status === 'approved'
  );
}

const newReviews = [];
for (const { data: lesson } of lessons) {
  for (const reviewType of ['scientific', 'editorial']) {
    if (hasApprovedReview(lesson.id, lesson.version, reviewType)) continue;
    newReviews.push({
      id: reviewId(lesson.id, reviewType, attestation.reviewedAt),
      objectId: lesson.id,
      objectVersion: lesson.version,
      reviewType,
      status: 'approved',
      reviewerId: attestation.reviewerId,
      reviewedAt: attestation.reviewedAt,
      notes: `Durable exact-version approval generated from ${attestation.id}.`,
      evidenceChecked: reviewType === 'scientific' ? [...new Set(lesson.references ?? [])] : []
    });
  }
}
for (const { data: assessment } of assessments) {
  if (hasApprovedReview(assessment.id, assessment.version, 'assessment')) continue;
  newReviews.push({
    id: reviewId(assessment.id, 'assessment', attestation.reviewedAt),
    objectId: assessment.id,
    objectVersion: assessment.version,
    reviewType: 'assessment',
    status: 'approved',
    reviewerId: attestation.reviewerId,
    reviewedAt: attestation.reviewedAt,
    notes: `Durable exact-version approval generated from ${attestation.id}.`,
    evidenceChecked: []
  });
}
for (const { data: item } of questions) {
  if (hasApprovedReview(item.id, item.version, 'assessment')) continue;
  newReviews.push({
    id: reviewId(item.id, 'assessment', attestation.reviewedAt),
    objectId: item.id,
    objectVersion: item.version,
    reviewType: 'assessment',
    status: 'approved',
    reviewerId: attestation.reviewerId,
    reviewedAt: attestation.reviewedAt,
    notes: `Durable exact-version approval generated from ${attestation.id}.`,
    evidenceChecked: [...new Set(item.references ?? [])]
  });
}

const promotableQuestionStatuses = new Set(['draft', 'technical-review', 'editorial-review']);
const plan = {
  attestation: attestation.id,
  lessonsToApproved: lessons.filter(({ data }) => !['approved', 'published'].includes(data.status)).length,
  coursesToApproved: courses.filter(({ data }) => !['approved', 'published'].includes(data.status)).length,
  assessmentsToApproved: assessments.filter(({ data }) => !['approved', 'published'].includes(data.status)).length,
  questionsToPilot: questions.filter(({ data }) => promotableQuestionStatuses.has(data.status)).length,
  credentialsToApproved: credentials.filter(({ data }) => !['approved', 'published'].includes(data.status)).length,
  durableReviewRecordsToCreate: newReviews.length
};

console.log(JSON.stringify({ mode: write ? 'write' : 'preview', plan }, null, 2));

if (!write) process.exit(0);
if (!confirm) {
  console.error('Refusing to write approved lifecycle states without --confirm-approved.');
  process.exit(1);
}

for (const entry of lessons) {
  if (!['approved', 'published'].includes(entry.data.status)) {
    entry.data.status = 'approved';
    writeJson(entry.path, entry.data);
  }
}
for (const entry of courses) {
  if (!['approved', 'published'].includes(entry.data.status)) {
    entry.data.status = 'approved';
    writeJson(entry.path, entry.data);
  }
}
for (const entry of assessments) {
  if (!['approved', 'published'].includes(entry.data.status)) {
    entry.data.status = 'approved';
    writeJson(entry.path, entry.data);
  }
}
for (const entry of questions) {
  if (promotableQuestionStatuses.has(entry.data.status)) {
    entry.data.status = 'pilot';
    writeJson(entry.path, entry.data);
  }
}
for (const entry of credentials) {
  if (!['approved', 'published'].includes(entry.data.status)) {
    entry.data.status = 'approved';
    writeJson(entry.path, entry.data);
  }
}

for (const review of newReviews) {
  const file = path.join(reviewDir, `${review.id}.json`);
  if (fs.existsSync(file)) throw new Error(`Review record already exists: ${file}`);
  writeJson(file, review);
}

const readinessPath = path.join(root, 'registry/system-readiness.json');
if (fs.existsSync(readinessPath)) {
  const readiness = JSON.parse(fs.readFileSync(readinessPath, 'utf8'));
  readiness.updatedAt = new Date().toISOString().slice(0, 10);
  if (readiness.areas?.curriculum?.gates) {
    readiness.areas.curriculum.status = 'approved';
    readiness.areas.curriculum.gates.scientificReviewComplete = true;
    readiness.areas.curriculum.gates.editorialReviewComplete = true;
  }
  if (readiness.areas?.assessment?.gates) {
    readiness.areas.assessment.status = 'pilot-bank';
    readiness.areas.assessment.gates.humanAssessmentReviewComplete = true;
  }
  writeJson(readinessPath, readiness);
}

console.log('Catalog promotion written. Rebuild the global registry, run npm test, review the diff, and commit only if all gates remain green.');
