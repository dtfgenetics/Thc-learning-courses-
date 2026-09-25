import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs';
import { normalizePracticalEvidenceSubmission, learnerPracticalSubmissionView } from '../packages/domain/practical-evidence-submission.mjs';
import { createApiServer } from '../apps/api/src/server.mjs';

const practical = { id: 'PRACTICAL-LH-TECH1-001-WORKFLOW', title: 'Course 1 practical', version: '1.1.0', evidenceOutputs: ['Record A', 'Record B'] };
const draft = normalizePracticalEvidenceSubmission(practical, { status: 'draft', evidenceOutputs: [{ name: 'Record A', reference: 'packet-1', description: '' }] });
assert.equal(draft.evidenceOutputs.length, 2);
assert.throws(() => normalizePracticalEvidenceSubmission(practical, { status: 'submitted', evidenceOutputs: draft.evidenceOutputs }), /required/);
assert.throws(() => normalizePracticalEvidenceSubmission(practical, { status: 'draft', evidenceOutputs: [{ name: 'Unknown' }] }), /unknown/);
const complete = normalizePracticalEvidenceSubmission(practical, { status: 'submitted', learnerStatement: 'Observed in simulation.', evidenceOutputs: practical.evidenceOutputs.map((name) => ({ name, reference: `ref-${name}`, description: `Evidence for ${name}` })) });
assert.equal(learnerPracticalSubmissionView(practical, complete).submission.status, 'submitted');

const records = new Map();
const learnerStore = {
  async getPracticalSubmission(subject) { return records.get(subject) ?? null; },
  async savePracticalSubmission(subject, { submission }) { const saved = { ...submission, submittedAt: submission.status === 'submitted' ? '2026-09-20T12:00:00.000Z' : null, updatedAt: '2026-09-20T12:00:00.000Z' }; records.set(subject, saved); return saved; }
};
const credentialStore = { async ping() { return true; }, async schemaVersion() { return '6'; }, async getByVerificationId() { return null; } };
const authorize = (req, scope) => req.headers.authorization === 'Bearer learner' ? { ok: true, subject: 'learner-1', scopes: [scope] } : { ok: false, status: 401, error: 'authentication-required' };
const server = createApiServer({ env: { NODE_ENV: 'production' }, credentialStore, learnerStore, requiredSchemaVersion: '6', authorize, logger() {} });
server.listen(0, '127.0.0.1'); await once(server, 'listening');
try {
  const base = `http://127.0.0.1:${server.address().port}`; const url = `${base}/api/v1/me/courses/COURSE-LH-TECH1-001/practical-submission`;
  assert.equal((await fetch(url)).status, 401);
  const initial = await fetch(url, { headers: { authorization: 'Bearer learner' } }); assert.equal(initial.status, 200); assert.equal((await initial.json()).submission.status, 'draft');
  const invalid = await fetch(url, { method: 'PUT', headers: { authorization: 'Bearer learner', 'content-type': 'application/json' }, body: JSON.stringify({ status: 'submitted', evidenceOutputs: [] }) }); assert.equal(invalid.status, 400);
  const livePractical = JSON.parse(fs.readFileSync('content/performance-assessments/PRACTICAL-LH-TECH1-001-WORKFLOW.json', 'utf8'));
  const liveSubmission = { status: 'submitted', learnerStatement: 'Observed in simulation.', evidenceOutputs: livePractical.evidenceOutputs.map((name) => ({ name, reference: `controlled-${name}`, description: `Evidence for ${name}` })) };
  const saved = await fetch(url, { method: 'PUT', headers: { authorization: 'Bearer learner', 'content-type': 'application/json' }, body: JSON.stringify(liveSubmission) }); assert.equal(saved.status, 200); const body = await saved.json(); assert.equal(body.submission.status, 'submitted'); assert.equal(Object.hasOwn(body.submission, 'scorePercent'), false);
} finally { server.close(); await once(server, 'close'); }
console.log('Learner practical evidence submission domain and API contracts passed.');
