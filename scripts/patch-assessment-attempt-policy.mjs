import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const index = source.indexOf(before);
  if (index === -1) throw new Error(`patch target not found: ${label}`);
  if (source.indexOf(before, index + before.length) !== -1) throw new Error(`patch target is not unique: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
}

const serverPath = 'apps/api/src/server.mjs';
let server = fs.readFileSync(serverPath, 'utf8');
server = replaceOnce(
  server,
  "import { createAssessmentDeliveryService } from './assessment-delivery.mjs';\n",
  "import { createAssessmentDeliveryService } from './assessment-delivery.mjs';\nimport { evaluateAssessmentAttemptPolicy } from '../../../packages/domain/assessment-attempt-policy.mjs';\n",
  'server assessment policy import'
);

const oldStart = `      const assessmentStartMatch = url.pathname.match(/^\\/api\\/v1\\/me\\/assessments\\/(ASSESS-[A-Z0-9-]+)\\/attempts$/);\nif (req.method === 'POST' && assessmentStartMatch) {\n  route = 'POST /api/v1/me/assessments/:assessmentId/attempts';\n  const auth = authorizeRequest(resolvedAuthorize, req, 'learner:write', res, requestId);\n  if (!auth) return;\n  if (!learnerStore || typeof learnerStore.createAssessmentAttempt !== 'function') return json(res, 503, { error: 'assessment-persistence-unavailable', requestId });\n  try {\n    const { attempt } = resolvedAssessmentDelivery.start({ learnerId: auth.subject, assessmentId: assessmentStartMatch[1] });\n    const saved = await learnerStore.createAssessmentAttempt(auth.subject, attempt);\n    return json(res, 201, { attempt: resolvedAssessmentDelivery.publicView(saved) });\n  } catch (error) {\n    const message = String(error?.message ?? '');\n    if (message === 'assessment-not-found') return json(res, 404, { error: 'assessment-not-found', requestId });\n    if (message === 'assessment-not-active' || message.startsWith('insufficient-active-items:')) return json(res, 409, { error: 'assessment-not-deliverable', requestId });\n    throw error;\n  }\n}\n`;

const newStart = `      const assessmentStartMatch = url.pathname.match(/^\\/api\\/v1\\/me\\/assessments\\/(ASSESS-[A-Z0-9-]+)\\/attempts$/);\nif (req.method === 'POST' && assessmentStartMatch) {\n  route = 'POST /api/v1/me/assessments/:assessmentId/attempts';\n  const auth = authorizeRequest(resolvedAuthorize, req, 'learner:write', res, requestId);\n  if (!auth) return;\n  if (!learnerStore || typeof learnerStore.createAssessmentAttempt !== 'function' || typeof learnerStore.listAssessmentAttempts !== 'function') {\n    return json(res, 503, { error: 'assessment-persistence-unavailable', requestId });\n  }\n  try {\n    const { attempt, assessment } = resolvedAssessmentDelivery.start({ learnerId: auth.subject, assessmentId: assessmentStartMatch[1] });\n    const previousAttempts = await learnerStore.listAssessmentAttempts(auth.subject, assessment.id);\n    const policy = evaluateAssessmentAttemptPolicy({ assessment, attempts: previousAttempts });\n    if (!policy.allowed) {\n      if (policy.reason === 'active-attempt') {\n        return json(res, 409, { error: 'assessment-attempt-in-progress', attemptId: policy.attemptId, requestId });\n      }\n      if (policy.reason === 'max-attempts') {\n        return json(res, 409, { error: 'assessment-attempt-limit-reached', attemptsUsed: policy.attemptsUsed, maxAttempts: policy.maxAttempts, requestId });\n      }\n      if (policy.reason === 'cooldown') {\n        return json(res, 429, { error: 'assessment-attempt-cooldown', retryAt: policy.retryAt, requestId }, { 'retry-after': String(policy.retryAfterSeconds) });\n      }\n      return json(res, 409, { error: 'assessment-attempt-policy-blocked', requestId });\n    }\n    const saved = await learnerStore.createAssessmentAttempt(auth.subject, attempt);\n    return json(res, 201, { attempt: resolvedAssessmentDelivery.publicView(saved) });\n  } catch (error) {\n    const message = String(error?.message ?? '');\n    if (message === 'assessment-not-found') return json(res, 404, { error: 'assessment-not-found', requestId });\n    if (message === 'assessment-not-active' || message.startsWith('insufficient-active-items:')) return json(res, 409, { error: 'assessment-not-deliverable', requestId });\n    throw error;\n  }\n}\n`;
server = replaceOnce(server, oldStart, newStart, 'learner assessment start route');
fs.writeFileSync(serverPath, server);

const packagePath = 'package.json';
let pkg = fs.readFileSync(packagePath, 'utf8');
pkg = replaceOnce(
  pkg,
  '    "assessment:persistence:test": "node scripts/test-assessment-attempt-persistence.mjs",\n    "assessment:delivery:test": "node scripts/test-assessment-delivery-service.mjs",',
  '    "assessment:persistence:test": "node scripts/test-assessment-attempt-persistence.mjs",\n    "assessment:policy:test": "node scripts/test-assessment-attempt-policy.mjs",\n    "assessment:history:test": "node scripts/test-assessment-attempt-history.mjs",\n    "assessment:delivery:test": "node scripts/test-assessment-delivery-service.mjs",',
  'package assessment scripts'
);
pkg = replaceOnce(
  pkg,
  'npm run production:persistence:test && npm run assessment:persistence:test && npm run assessment:delivery:test && npm run api:learner-assessment:test',
  'npm run production:persistence:test && npm run assessment:persistence:test && npm run assessment:policy:test && npm run assessment:history:test && npm run assessment:delivery:test && npm run api:learner-assessment:test',
  'package full test chain'
);
fs.writeFileSync(packagePath, pkg);

console.log('Assessment attempt policy patch applied.');
