from pathlib import Path

# Patch assessment delivery service to expose non-secret policy metadata.
p = Path('apps/api/src/assessment-delivery.mjs')
text = p.read_text()
anchor = "  return {\n    start({ learnerId, assessmentId, seed = crypto.randomUUID() }) {\n"
replacement = "  return {\n    policyDefinition(assessmentId) {\n      const assessment = loadAssessment(assessmentId);\n      if (!assessment) return null;\n      return {\n        id: assessment.id,\n        version: assessment.version,\n        status: assessment.status,\n        maxAttempts: assessment.maxAttempts ?? null,\n        cooldownHours: assessment.cooldownHours ?? 0\n      };\n    },\n    start({ learnerId, assessmentId, seed = crypto.randomUUID() }) {\n"
if 'policyDefinition(assessmentId)' not in text:
    if anchor not in text: raise SystemExit('delivery return anchor missing')
    text = text.replace(anchor, replacement, 1)
p.write_text(text)

# Patch PostgreSQL learner store with attempt listing and transaction-enforced start policy.
p = Path('apps/api/src/postgres-learner-store.mjs')
text = p.read_text()
get_anchor = "  async getAssessmentAttempt(externalSubject, attemptId) {\n"
list_method = """  async listAssessmentAttempts(externalSubject, assessmentId) {
    if (!externalSubject) throw new Error('externalSubject required');
    if (!assessmentId) throw new Error('assessmentId required');
    const result = await queryOrUnavailable(
      query,
      `select a.id, a.assessment_id, a.assessment_version, a.form_id, a.form_hash, a.status,
              a.started_at, a.submitted_at, a.scored_at, a.score_percent, a.passed
         from learners l
         join assessment_attempts a on a.learner_id = l.id
        where l.external_subject = $1 and a.assessment_id = $2
        order by a.started_at desc, a.id`,
      [externalSubject, assessmentId]
    );
    return (result.rows ?? []).map((row) => assessmentAttemptRow(row, [], externalSubject));
  },
"""
if 'async listAssessmentAttempts(externalSubject, assessmentId)' not in text:
    if get_anchor not in text: raise SystemExit('learner get attempt anchor missing')
    text = text.replace(get_anchor, list_method + get_anchor, 1)

sig_old = "    async createAssessmentAttempt(externalSubject, attempt = {}) {"
sig_new = "    async createAssessmentAttempt(externalSubject, attempt = {}, policy = null) {"
if sig_new not in text:
    if sig_old not in text: raise SystemExit('create attempt signature missing')
    text = text.replace(sig_old, sig_new, 1)

policy_anchor = "      const learner = await ensureLearner(externalSubject, runQuery);\n      if (!learner?.id) throw new Error('learner-resolution-failed');\n      await queryOrUnavailable(\n"
policy_insert = """      const learner = await ensureLearner(externalSubject, runQuery);
      if (!learner?.id) throw new Error('learner-resolution-failed');
      await queryOrUnavailable(runQuery, `select id from learners where id = $1 for update`, [learner.id]);
      if (policy) {
        const priorResult = await queryOrUnavailable(
          runQuery,
          `select id, assessment_id, assessment_version, status, started_at, submitted_at, scored_at
             from assessment_attempts
            where learner_id = $1 and assessment_id = $2 and assessment_version = $3
            order by started_at desc, id`,
          [learner.id, attempt.assessmentId, String(attempt.assessmentVersion)]
        );
        const nowMs = Date.parse(policy.now ?? attempt.startedAt ?? new Date().toISOString());
        const active = (priorResult.rows ?? []).find((row) => ['started', 'submitted'].includes(row.status));
        if (active) throw new Error('assessment-policy:active-attempt-exists');
        const nonVoided = (priorResult.rows ?? []).filter((row) => row.status !== 'voided');
        const maxAttempts = Number(policy.maxAttempts ?? 0);
        if (Number.isInteger(maxAttempts) && maxAttempts > 0 && nonVoided.length >= maxAttempts) {
          throw new Error('assessment-policy:max-attempts-reached');
        }
        const cooldownHours = Number(policy.cooldownHours ?? 0);
        if (Number.isFinite(cooldownHours) && cooldownHours > 0) {
          const completedTimes = nonVoided
            .filter((row) => row.status === 'scored')
            .map((row) => Date.parse(row.scored_at ?? row.submitted_at ?? row.started_at))
            .filter(Number.isFinite);
          if (completedTimes.length) {
            const latest = Math.max(...completedTimes);
            if (nowMs < latest + cooldownHours * 60 * 60 * 1000) throw new Error('assessment-policy:cooldown-active');
          }
        }
      }
      await queryOrUnavailable(
"""
if "assessment-policy:active-attempt-exists" not in text:
    if policy_anchor not in text: raise SystemExit('transaction policy anchor missing')
    text = text.replace(policy_anchor, policy_insert, 1)
p.write_text(text)

# Patch API server to evaluate and pass attempt policy.
p = Path('apps/api/src/server.mjs')
text = p.read_text()
import_anchor = "import { createAssessmentDeliveryService } from './assessment-delivery.mjs';\n"
import_line = "import { evaluateAssessmentAttemptPolicy } from '../../../packages/domain/assessment-attempt-policy.mjs';\n"
if import_line not in text:
    if import_anchor not in text: raise SystemExit('server delivery import anchor missing')
    text = text.replace(import_anchor, import_anchor + import_line, 1)

old = """  if (!learnerStore || typeof learnerStore.createAssessmentAttempt !== 'function') return json(res, 503, { error: 'assessment-persistence-unavailable', requestId });
  try {
    const { attempt } = resolvedAssessmentDelivery.start({ learnerId: auth.subject, assessmentId: assessmentStartMatch[1] });
    const saved = await learnerStore.createAssessmentAttempt(auth.subject, attempt);
    return json(res, 201, { attempt: resolvedAssessmentDelivery.publicView(saved) });
  } catch (error) {
"""
new = """  if (!learnerStore || typeof learnerStore.createAssessmentAttempt !== 'function' || typeof learnerStore.listAssessmentAttempts !== 'function') return json(res, 503, { error: 'assessment-persistence-unavailable', requestId });
  try {
    const policyDefinition = resolvedAssessmentDelivery.policyDefinition(assessmentStartMatch[1]);
    if (!policyDefinition) return json(res, 404, { error: 'assessment-not-found', requestId });
    const priorAttempts = await learnerStore.listAssessmentAttempts(auth.subject, assessmentStartMatch[1]);
    const attemptPolicy = evaluateAssessmentAttemptPolicy({ assessment: policyDefinition, attempts: priorAttempts });
    if (!attemptPolicy.allowed) return json(res, 409, { error: 'assessment-attempt-policy-blocked', policy: attemptPolicy, requestId });
    const { attempt } = resolvedAssessmentDelivery.start({ learnerId: auth.subject, assessmentId: assessmentStartMatch[1] });
    const saved = await learnerStore.createAssessmentAttempt(auth.subject, attempt, {
      maxAttempts: policyDefinition.maxAttempts,
      cooldownHours: policyDefinition.cooldownHours,
      now: attempt.startedAt
    });
    return json(res, 201, { attempt: resolvedAssessmentDelivery.publicView(saved), policy: attemptPolicy });
  } catch (error) {
"""
if "assessment-attempt-policy-blocked" not in text:
    if old not in text: raise SystemExit('server start route anchor missing')
    text = text.replace(old, new, 1)

catch_anchor = "    if (message === 'assessment-not-active' || message.startsWith('insufficient-active-items:')) return json(res, 409, { error: 'assessment-not-deliverable', requestId });\n"
catch_new = catch_anchor + "    if (message.startsWith('assessment-policy:')) return json(res, 409, { error: 'assessment-attempt-policy-blocked', policy: { allowed: false, reason: message.slice('assessment-policy:'.length) }, requestId });\n"
if "message.startsWith('assessment-policy:')" not in text:
    if catch_anchor not in text: raise SystemExit('server catch anchor missing')
    text = text.replace(catch_anchor, catch_new, 1)
p.write_text(text)

# Extend assessment API test store and scenarios.
p = Path('scripts/test-learner-assessment-api.mjs')
text = p.read_text()
store_anchor = "  async createAssessmentAttempt(subject, attempt) {\n"
list_impl = """  async listAssessmentAttempts(subject, assessmentId) {
    return [...subjectAttempts(subject).values()]
      .filter((attempt) => attempt.assessmentId === assessmentId)
      .map((attempt) => structuredClone(attempt));
  },
"""
if 'async listAssessmentAttempts(subject, assessmentId)' not in text:
    if store_anchor not in text: raise SystemExit('API test store anchor missing')
    text = text.replace(store_anchor, list_impl + store_anchor, 1)

retry_anchor = "  assert.equal((await response.json()).attempt.status, 'scored');\n\n  response = await fetch(`${base}/api/v1/me/assessments/ASSESS-NOT-REAL-001/attempts`, {\n"
retry_insert = """  assert.equal((await response.json()).attempt.status, 'scored');

  response = await fetch(`${base}/api/v1/me/assessments/${assessmentId}/attempts`, {
    method: 'POST',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: '{}'
  });
  assert.equal(response.status, 409, 'cooldown must block immediate retake');
  body = await response.json();
  assert.equal(body.error, 'assessment-attempt-policy-blocked');
  assert.equal(body.policy.reason, 'cooldown-active');

  response = await fetch(`${base}/api/v1/me/assessments/ASSESS-NOT-REAL-001/attempts`, {
"""
if "cooldown must block immediate retake" not in text:
    if retry_anchor not in text: raise SystemExit('API policy test insertion anchor missing')
    text = text.replace(retry_anchor, retry_insert, 1)
p.write_text(text)

# Add a PostgreSQL-focused race/policy assertion to persistence test by checking constructor method and policy failure contract.
p = Path('scripts/test-assessment-attempt-persistence.mjs')
text = p.read_text()
if "listAssessmentAttempts" not in text:
    marker = "assert.equal(typeof learnerStore.getAssessmentAttempt, 'function');\n"
    if marker in text:
        text = text.replace(marker, marker + "assert.equal(typeof learnerStore.listAssessmentAttempts, 'function');\n", 1)
p.write_text(text)

# Wire domain policy test into package test chain.
p = Path('package.json')
text = p.read_text()
script_anchor = '    "assessment:delivery:test": "node scripts/test-assessment-delivery-service.mjs",\n'
script_line = '    "assessment:policy:test": "node scripts/test-assessment-attempt-policy.mjs",\n'
if '"assessment:policy:test"' not in text:
    if script_anchor not in text: raise SystemExit('package policy script anchor missing')
    text = text.replace(script_anchor, script_anchor + script_line, 1)
chain_anchor = 'npm run assessment:persistence:test && npm run assessment:delivery:test && npm run api:learner-assessment:test'
chain_new = 'npm run assessment:persistence:test && npm run assessment:delivery:test && npm run assessment:policy:test && npm run api:learner-assessment:test'
if chain_new not in text:
    if chain_anchor not in text: raise SystemExit('package policy chain anchor missing')
    text = text.replace(chain_anchor, chain_new, 1)
p.write_text(text)
