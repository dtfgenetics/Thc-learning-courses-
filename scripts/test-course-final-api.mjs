import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';
import { loadPublishedCourseAssessment } from '../apps/api/src/course-assessment-service.mjs';
import { presentCourseAssessmentItem } from '../packages/domain/course-assessment-runtime.mjs';

const attempts = new Map();
const learnerStore = {
  async findOpenAssessmentAttempt(subject, { assessmentId }) {
    return [...attempts.values()].find((row) => row.learnerId === subject && row.assessmentId === assessmentId && ['started','submitted'].includes(row.status)) ?? null;
  },
  async getAssessmentAttempt(subject, { attemptId }) {
    const row = attempts.get(attemptId);
    return row?.learnerId === subject ? structuredClone(row) : null;
  },
  async createAssessmentAttempt(subject, { attempt }) {
    attempts.set(attempt.id, structuredClone({ ...attempt, learnerId: subject }));
    return structuredClone(attempts.get(attempt.id));
  },
  async saveAssessmentResponses(subject, { attemptId, responses }) {
    const attempt = attempts.get(attemptId);
    assert.equal(attempt.learnerId, subject);
    for (const response of responses) {
      const item = attempt.items.find((row) => row.itemId === response.itemId && Number(row.itemVersion) === Number(response.itemVersion));
      assert.ok(item, 'response must belong to the attempt');
      item.response = structuredClone(response.response);
    }
    return { attemptId, saved: responses.length };
  },
  async saveAssessmentScore(subject, { attempt }) {
    assert.equal(attempts.get(attempt.id)?.learnerId, subject);
    attempts.set(attempt.id, structuredClone({ ...attempt, learnerId: subject }));
    return structuredClone(attempts.get(attempt.id));
  }
};

const credentialStore = {
  kind: 'test-persistent',
  async ping() { return true; },
  async schemaVersion() { return '2'; },
  async getByVerificationId() { return null; }
};

const authorize = (req, scope) => {
  if (req.headers.authorization !== 'Bearer learner-token') return { ok: false, status: 401, error: 'authentication-required' };
  if (!['learner:read','learner:write'].includes(scope)) return { ok: false, status: 403, error: 'insufficient-scope' };
  return { ok: true, subject: 'learner-course1', scopes: ['learner:read','learner:write'] };
};

const server = createApiServer({ env: { NODE_ENV: 'production' }, credentialStore, learnerStore, requiredSchemaVersion: '2', authorize, logger: () => {} });
server.listen(0, '127.0.0.1');
await once(server, 'listening');

try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const startUrl = `${base}/api/v1/me/courses/COURSE-LH-TECH1-001/assessment-attempts`;
  const unauthorized = await fetch(startUrl, { method: 'POST' });
  assert.equal(unauthorized.status, 401);

  const start = await fetch(startUrl, { method: 'POST', headers: { authorization: 'Bearer learner-token', accept: 'application/json' } });
  assert.equal(start.status, 200);
  const started = await start.json();
  assert.equal(started.resumed, false);
  assert.equal(started.items.length, 36);
  assert.equal(started.attempt.status, 'started');
  const startedSerialized = JSON.stringify(started);
  for (const forbidden of ['"correct"','"rationale"','answerKey','scoringKey']) assert.equal(startedSerialized.includes(forbidden), false, `start response leaked ${forbidden}`);

  const resume = await fetch(startUrl, { method: 'POST', headers: { authorization: 'Bearer learner-token', accept: 'application/json' } });
  const resumed = await resume.json();
  assert.equal(resume.status, 200);
  assert.equal(resumed.resumed, true);
  assert.equal(resumed.attempt.id, started.attempt.id);
  assert.equal(attempts.size, 1, 'resume must not create a second open attempt');

  const bundle = loadPublishedCourseAssessment('COURSE-LH-TECH1-001');
  assert.equal(bundle.error, undefined);
  const byId = new Map(bundle.itemBank.map((item) => [item.id, item]));
  const responses = started.items.map((safeItem) => {
    const source = byId.get(safeItem.id);
    const presented = presentCourseAssessmentItem(source, {
      formId: started.attempt.formId,
      response: source.correct,
      randomizeChoices: bundle.assessment.randomizeChoices !== false
    });
    return { itemId: safeItem.id, itemVersion: safeItem.version, response: presented.response };
  });

  const save = await fetch(`${base}/api/v1/me/assessment-attempts/${started.attempt.id}/responses`, {
    method: 'PUT',
    headers: { authorization: 'Bearer learner-token', accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ responses })
  });
  assert.equal(save.status, 200);
  assert.equal((await save.json()).saved, 36);

  const submit = await fetch(`${base}/api/v1/me/assessment-attempts/${started.attempt.id}/submit`, {
    method: 'POST', headers: { authorization: 'Bearer learner-token', accept: 'application/json' }
  });
  assert.equal(submit.status, 200);
  const result = await submit.json();
  assert.equal(result.attempt.status, 'scored');
  assert.equal(result.attempt.scorePercent, 100);
  assert.equal(result.attempt.passed, true);
  assert.equal(result.competencyResults.length, 6);
  assert.equal(result.assessment.feedbackMode, 'post-attempt-domain-level');
  const resultSerialized = JSON.stringify(result);
  for (const forbidden of ['correct','rationale','responses','items','answerKey','scoringKey']) assert.equal(resultSerialized.includes(`"${forbidden}"`), false, `result leaked ${forbidden}`);

  const resubmit = await fetch(`${base}/api/v1/me/assessment-attempts/${started.attempt.id}/submit`, {
    method: 'POST', headers: { authorization: 'Bearer learner-token', accept: 'application/json' }
  });
  assert.equal(resubmit.status, 200, 'scored submission should be idempotently readable');
  assert.equal((await resubmit.json()).attempt.scorePercent, 100);

  const blockedCredentialPath = await fetch(`${base}/api/v1/me/courses/COURSE-CULT-TECH-II-001/assessment-attempts`, {
    method: 'POST', headers: { authorization: 'Bearer learner-token' }
  });
  assert.notEqual(blockedCredentialPath.status, 200, 'unreleased credential course assessment must not be launchable');
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Course 1 learner final API start/resume/autosave/score and answer-key non-disclosure tests passed.');
