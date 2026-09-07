from pathlib import Path

p = Path('apps/api/src/server.mjs')
text = p.read_text()
anchor = "      const assessmentStartMatch = url.pathname.match(/^\\/api\\/v1\\/me\\/assessments\\/(ASSESS-[A-Z0-9-]+)\\/attempts$/);\n"
routes = """      const assessmentHistoryMatch = url.pathname.match(/^\\/api\\/v1\\/me\\/assessments\\/(ASSESS-[A-Z0-9-]+)\\/attempts$/);
      if (req.method === 'GET' && assessmentHistoryMatch) {
        route = 'GET /api/v1/me/assessments/:assessmentId/attempts';
        const auth = authorizeRequest(resolvedAuthorize, req, 'learner:read', res, requestId);
        if (!auth) return;
        if (!learnerStore || typeof learnerStore.listAssessmentAttempts !== 'function') return json(res, 503, { error: 'assessment-persistence-unavailable', requestId });
        const policyDefinition = resolvedAssessmentDelivery.policyDefinition(assessmentHistoryMatch[1]);
        if (!policyDefinition) return json(res, 404, { error: 'assessment-not-found', requestId });
        const attempts = await learnerStore.listAssessmentAttempts(auth.subject, assessmentHistoryMatch[1]);
        const policy = evaluateAssessmentAttemptPolicy({ assessment: policyDefinition, attempts });
        return json(res, 200, {
          assessment: {
            id: policyDefinition.id,
            version: policyDefinition.version,
            status: policyDefinition.status,
            maxAttempts: policyDefinition.maxAttempts,
            cooldownHours: policyDefinition.cooldownHours
          },
          policy,
          attempts: attempts.map((attempt) => ({
            id: attempt.id,
            assessmentVersion: attempt.assessmentVersion,
            status: attempt.status,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            scoredAt: attempt.scoredAt,
            scorePercent: attempt.scorePercent ?? null,
            passed: attempt.passed ?? null
          }))
        });
      }

"""
if "GET /api/v1/me/assessments/:assessmentId/attempts" not in text:
    if anchor not in text: raise SystemExit('assessment start route anchor missing')
    text = text.replace(anchor, routes + anchor, 1)
p.write_text(text)

p = Path('scripts/test-learner-assessment-api.mjs')
text = p.read_text()
start_assert_anchor = "  assert.equal(body.attempt.items.length, 60);\n"
history_asserts = """  assert.equal(body.attempt.items.length, 60);

  response = await fetch(`${base}/api/v1/me/assessments/${assessmentId}/attempts`, { headers: { authorization: 'Bearer alice' } });
  assert.equal(response.status, 200);
  let history = await response.json();
  assert.equal(history.assessment.id, assessmentId);
  assert.equal(history.assessment.maxAttempts, 3);
  assert.equal(history.assessment.cooldownHours, 24);
  assert.equal(history.attempts.length, 1);
  assert.equal(history.attempts[0].status, 'started');
  assert.equal(Object.hasOwn(history.attempts[0], 'items'), false, 'history must not expose exam items');
  assert.equal(history.policy.allowed, false);
  assert.equal(history.policy.reason, 'active-attempt-exists');
  assert.equal(history.policy.activeAttemptId, attemptId);

  response = await fetch(`${base}/api/v1/me/assessments/${assessmentId}/attempts`, { headers: { authorization: 'Bearer bob' } });
  assert.equal(response.status, 200);
  history = await response.json();
  assert.equal(history.attempts.length, 0, 'assessment history must be learner-isolated');
  assert.equal(history.policy.allowed, true);
"""
if "history must not expose exam items" not in text:
    if start_assert_anchor not in text: raise SystemExit('history test start anchor missing')
    text = text.replace(start_assert_anchor, history_asserts, 1)

scored_anchor = "  assert.equal(body.attempt.competencies.length, 12);\n"
scored_history = """  assert.equal(body.attempt.competencies.length, 12);

  response = await fetch(`${base}/api/v1/me/assessments/${assessmentId}/attempts`, { headers: { authorization: 'Bearer alice' } });
  assert.equal(response.status, 200);
  history = await response.json();
  assert.equal(history.attempts.length, 1);
  assert.equal(history.attempts[0].status, 'scored');
  assert.equal(history.attempts[0].scorePercent, body.attempt.scorePercent);
  assert.equal(history.attempts[0].passed, body.attempt.passed);
  assert.equal(history.policy.allowed, false);
  assert.equal(history.policy.reason, 'cooldown-active');
  assert.ok(history.policy.nextAllowedAt);
"""
if "history.policy.nextAllowedAt" not in text:
    if scored_anchor not in text: raise SystemExit('scored history anchor missing')
    text = text.replace(scored_anchor, scored_history, 1)
p.write_text(text)
