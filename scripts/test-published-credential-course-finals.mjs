import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startOrResumeCourseAssessment, loadPublishedCourseAssessment } from '../apps/api/src/course-assessment-service.mjs';

const root = process.cwd();
const readDir = (rel) => {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort().map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
};

const releases = readDir('content/public-releases').filter((release) => release.publicationState === 'published');
const releasedCourseIds = new Set(releases.map((release) => release.courseId));
const targetPrograms = new Set(['CREDPROG-CULT-TECH-I-001', 'CREDPROG-CULT-TECH-II-001']);
const courses = readDir('content/courses').filter((course) =>
  course.status === 'published' &&
  course.credentialBearing === true &&
  targetPrograms.has(course.extensions?.credentialPath) &&
  typeof course.finalAssessment === 'string' &&
  releasedCourseIds.has(course.id)
);

assert.ok(courses.length >= 10, `Expected a broad published credential-course final inventory; found ${courses.length}`);

for (const course of courses) {
  const bundle = loadPublishedCourseAssessment(course.id);
  assert.equal(bundle.error, undefined, `${course.id} must load through the authenticated graded-final runtime`);
  assert.equal(bundle.assessment.id, course.finalAssessment);
  assert.equal(bundle.assessment.purpose, 'summative');
  assert.ok(bundle.itemBank.length > 0);

  const applicationRefs = new Map([
    ['CREDPROG-CULT-TECH-I-001', 'THC-APP-TECH1-TEST'],
    ['CREDPROG-CULT-TECH-II-001', 'THC-APP-TECH2-TEST']
  ]);
  const attempts = new Map();
  const learnerStore = {
    async getLearnerProfile() {
      return { learnerReference: 'THC-LRN-PUBLISHED-FINALS', displayName: 'Published Finals Test', certificateName: 'Published Finals Test' };
    },
    async listApplications() {
      return [...applicationRefs.entries()].map(([programId, applicationReference]) => ({ programId, applicationReference, status: 'active' }));
    },
    async findOpenAssessmentAttempt() { return null; },
    async listCourseEvidence() { return { assessmentAttempts: [] }; },
    async createAssessmentAttempt(subject, { attempt, programId }) {
      const stored = {
        ...structuredClone(attempt),
        learnerId: subject,
        learnerReference: 'THC-LRN-PUBLISHED-FINALS',
        certificateName: 'Published Finals Test',
        applicationReference: applicationRefs.get(programId) ?? null
      };
      attempts.set(attempt.id, stored);
      return structuredClone(stored);
    }
  };

  const result = await startOrResumeCourseAssessment({
    learnerStore,
    subject: 'published-finals-learner',
    courseId: course.id,
    now: '2026-09-25T18:00:00.000Z'
  });

  assert.equal(result.status, 200, `${course.id} final should start`);
  assert.equal(result.body.course.id, course.id);
  assert.equal(result.body.learner.learnerReference, 'THC-LRN-PUBLISHED-FINALS');
  assert.equal(result.body.learner.applicationReference, applicationRefs.get(course.extensions?.credentialPath));
  assert.equal(result.body.learner.certificateName, 'Published Finals Test');
  assert.ok(result.body.attempt.id);
  assert.ok(Array.isArray(result.body.items) && result.body.items.length === bundle.itemBank.length);

  const serialized = JSON.stringify(result.body);
  for (const forbidden of ['"correct"', '"rationale"', 'answerKey', 'scoringKey']) {
    assert.equal(serialized.includes(forbidden), false, `${course.id} learner presentation leaked ${forbidden}`);
  }
}

console.log(`Published credential-course graded-final runtime: PASS (${courses.length} conventional finals)`);
