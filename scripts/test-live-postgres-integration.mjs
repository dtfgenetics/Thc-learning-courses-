import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createPersistenceAdapters } from '../apps/api/src/postgres-persistence-adapter.mjs';
import { createAssessmentDeliveryService } from '../apps/api/src/assessment-delivery.mjs';
import { createApiServer } from '../apps/api/src/server.mjs';

const databaseUrl = String(process.env.DATABASE_URL ?? process.env.THC_DATABASE_URL ?? '').trim();
if (!databaseUrl) throw new Error('DATABASE_URL or THC_DATABASE_URL is required');

const env = {
  ...process.env,
  NODE_ENV: 'development',
  THC_DATABASE_URL: databaseUrl,
  THC_DATABASE_SSL: 'disable',
  THC_REQUIRED_SCHEMA_VERSION: '5'
};

const adapters = await createPersistenceAdapters({ env });
const { credentialStore, credentialWriter, learnerStore } = adapters;
const learnerSubject = 'live-postgres-learner-001';
const assessmentId = 'ASSESS-CULT-FOUNDATIONS-FINAL-001';
const credentialId = 'CRED-CULT-FOUNDATIONS-001';

assert.equal(await credentialStore.ping(), true);
assert.equal(await credentialStore.schemaVersion(), '5');
assert.equal(typeof credentialWriter.transitionById, 'function');

const authorize = async (_req, requiredScope) => ({
  ok: true,
  subject: learnerSubject,
  scopes: requiredScope ? [requiredScope] : []
});
const server = createApiServer({
  credentialStore,
  credentialWriter,
  learnerStore,
  env,
  requiredSchemaVersion: '5',
  authorize,
  logger: () => {}
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
const base = `http://127.0.0.1:${address.port}`;

try {
  let response = await fetch(`${base}/readyz`);
  assert.equal(response.status, 200);
  let body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.schemaVersion, '5');

  response = await fetch(`${base}/api/v1/me/enrollments`, {
    method: 'POST',
    headers: { authorization: 'Bearer integration', 'content-type': 'application/json' },
    body: JSON.stringify({ courseId: 'COURSE-CULT-FOUNDATIONS-001', courseVersion: '1.0.0' })
  });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.enrollment.courseId, 'COURSE-CULT-FOUNDATIONS-001');
  assert.equal(body.enrollment.status, 'active');

  response = await fetch(`${base}/api/v1/me/lessons/LESSON-PLANT-BIO-001`, {
    method: 'PUT',
    headers: { authorization: 'Bearer integration', 'content-type': 'application/json' },
    body: JSON.stringify({ lessonVersion: '1.0.0', status: 'completed' })
  });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.progress.status, 'completed');

  response = await fetch(`${base}/api/v1/me/progress`, { headers: { authorization: 'Bearer integration' } });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.ok(body.progress.some((row) => row.lessonId === 'LESSON-PLANT-BIO-001' && row.status === 'completed'));

  const delivery = createAssessmentDeliveryService({ root: process.cwd(), allowDraft: true });
  const { attempt, selected } = delivery.start({ learnerId: learnerSubject, assessmentId, seed: 'live-postgres-integration' });
  const persistedStarted = await learnerStore.createAssessmentAttempt(learnerSubject, attempt, {
    maxAttempts: 3,
    cooldownHours: 24,
    now: attempt.startedAt
  });
  assert.equal(persistedStarted.status, 'started');
  assert.equal(persistedStarted.items.length, 60);

  const publicStarted = delivery.publicView(persistedStarted);
  const selectedByKey = new Map(selected.map((item) => [`${item.id}@${item.version}`, item]));
  const responses = publicStarted.items.map((publicItem) => {
    const canonical = selectedByKey.get(`${publicItem.itemId}@${publicItem.itemVersion}`);
    assert.ok(canonical, `selected item missing: ${publicItem.itemId}@${publicItem.itemVersion}`);
    let responseValue;
    if (canonical.type === 'numeric') {
      responseValue = canonical.correct;
    } else if (canonical.type === 'multiple-response') {
      responseValue = canonical.correct.map((canonicalIndex) => publicItem.choices.indexOf(canonical.choices[canonicalIndex]));
    } else {
      responseValue = publicItem.choices.indexOf(canonical.choices[canonical.correct]);
    }
    return { itemId: publicItem.itemId, itemVersion: publicItem.itemVersion, response: responseValue };
  });

  const submitted = delivery.submit({ attempt: persistedStarted, responses });
  const persistedSubmitted = await learnerStore.saveSubmittedAssessmentAttempt(learnerSubject, submitted);
  assert.equal(persistedSubmitted.status, 'submitted');

  const { scored } = delivery.score({ attempt: persistedSubmitted });
  const persistedScored = await learnerStore.saveScoredAssessmentAttempt(learnerSubject, scored);
  assert.equal(persistedScored.status, 'scored');
  assert.equal(persistedScored.scorePercent, 100);
  assert.equal(persistedScored.passed, true);

  const evidence = await learnerStore.listCredentialEvidence(learnerSubject, { credentialDefinitionId: credentialId });
  const assessmentEvidence = evidence.assessments.find((row) => row.assessmentId === assessmentId);
  assert.ok(assessmentEvidence);
  assert.equal(assessmentEvidence.status, 'passed');
  assert.equal(assessmentEvidence.scorePercent, 100);
  assert.equal(evidence.competencies.length, 12, 'scored assessment must persist versioned competency mastery');
  assert.ok(evidence.competencies.every((row) => row.masteryLevel === 'demonstrated'));
  assert.ok(evidence.competencies.every((row) => row.evidenceAttemptId === persistedScored.id));

  response = await fetch(`${base}/api/v1/me/credentials/${credentialId}/progress`, {
    headers: { authorization: 'Bearer integration' }
  });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.credential.id, credentialId);
  assert.ok(body.assessmentAttempts.some((row) => row.assessmentId === assessmentId && row.status === 'scored'));
  assert.equal(body.competencies.length, 12);

  console.log('Live PostgreSQL production persistence + API integration passed.');
} finally {
  server.close();
  await once(server, 'close');
  await adapters.close();
}
