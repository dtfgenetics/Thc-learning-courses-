import { createAttempt, submitAttempt, scoreAttempt, competencyResults } from '../packages/domain/assessment-runtime.mjs';
import { transitionCredential, lifecycleForDefinition, publicCredentialView } from '../packages/domain/credential-runtime.mjs';

const assessment = { id: 'ASSESS-TEST-001', version: '1.0.0', passingScorePercent: 80 };
const form = {
  id: 'FORM-TEST-001',
  integrityHash: 'abc123',
  items: [
    { itemId: 'ITEM-A-001', itemVersion: 1, competency: 'COMP-A-001' },
    { itemId: 'ITEM-B-001', itemVersion: 1, competency: 'COMP-B-001' }
  ]
};
const bank = [
  { id:'ITEM-A-001', version:1, type:'multiple-choice', correct:1 },
  { id:'ITEM-B-001', version:1, type:'multiple-response', correct:[0,2] }
];

let attempt = createAttempt({ learnerId:'LEARNER-TEST', assessment, form, now:'2026-09-05T00:00:00.000Z' });
if (attempt.status !== 'started' || attempt.items.length !== 2) throw new Error('Attempt creation failed');
attempt = submitAttempt(attempt, [
  { itemId:'ITEM-A-001', itemVersion:1, response:1 },
  { itemId:'ITEM-B-001', itemVersion:1, response:[2,0] }
], '2026-09-05T00:10:00.000Z');
const scored = scoreAttempt(attempt, bank, assessment.passingScorePercent, '2026-09-05T00:11:00.000Z');
if (!scored.passed || scored.scorePercent !== 100) throw new Error('Server scoring failed');
const mastery = competencyResults(scored);
if (mastery.some((row) => row.masteryLevel !== 'demonstrated')) throw new Error('Competency result calculation failed');

const credential = {
  id:'CRED-INSTANCE-001', verificationId:'verify-test', status:'issued', credentialDefinitionVersion:'1.0.0', courseId:'COURSE-CULT-FOUNDATIONS-001', courseVersion:'1.0.0', issuer:{ id:'ISSUER-THC-001', name:'Teaching Healthy Cultivation' }, issuedAt:'2026-09-05T00:12:00.000Z'
};
const valid = transitionCredential(credential, 'valid', { actorId:'SYSTEM', now:'2026-09-05T00:13:00.000Z' });
if (valid.credential.status !== 'valid') throw new Error('Credential transition failed');
const suspended = transitionCredential(valid.credential, 'suspended', { actorId:'ADMIN', reason:'verification-review', now:'2026-09-05T00:14:00.000Z' });
if (suspended.credential.status !== 'suspended' || suspended.event.reason !== 'verification-review') throw new Error('Credential suspension failed');
const reinstated = transitionCredential(suspended.credential, 'valid', { actorId:'ADMIN', reason:'review-cleared', now:'2026-09-05T00:15:00.000Z' });
if (reinstated.credential.status !== 'valid') throw new Error('Credential reinstatement failed');
let blocked = false;
try { transitionCredential(reinstated.credential, 'issued', { actorId:'SYSTEM' }); } catch { blocked = true; }
if (!blocked) throw new Error('Invalid credential transition was not blocked');

const fixedTermDefinition = {
  id:'CRED-TEST-FIXED-001',
  title:'Fixed-term test credential',
  version:'2.0.0',
  lifecycle:{ validityType:'fixed-term', validityDays:365, renewalRequired:true, renewalWindowDays:30, renewalMethod:'reassessment', supersessionPolicy:'require-reissue' }
};
const lifecycle = lifecycleForDefinition(fixedTermDefinition, { issuedAt:'2026-01-01T00:00:00.000Z', now:'2026-12-10T00:00:00.000Z' });
if (lifecycle.expiresAt !== '2027-01-01T00:00:00.000Z') throw new Error(`Unexpected lifecycle expiration ${lifecycle.expiresAt}`);
if (lifecycle.renewalOpensAt !== '2026-12-02T00:00:00.000Z' || !lifecycle.renewalWindowOpen) throw new Error('Renewal window calculation failed');
if (lifecycle.pastExpiration) throw new Error('Credential incorrectly marked past expiration');

const publicView = publicCredentialView(reinstated.credential, fixedTermDefinition, {
  statusHistory: [
    { status:'valid', actorId:'SYSTEM', reason:'issued', createdAt:'2026-09-05T00:13:00.000Z' },
    { status:'suspended', actorId:'PRIVATE-ADMIN', reason:'private-review', createdAt:'2026-09-05T00:14:00.000Z' },
    { status:'valid', actorId:'PRIVATE-ADMIN', reason:'private-cleared', createdAt:'2026-09-05T00:15:00.000Z' }
  ],
  now:'2026-12-10T00:00:00.000Z'
});
if ('subjectHash' in publicView || 'assessmentEvidence' in publicView) throw new Error('Public credential projection leaked private fields');
if (JSON.stringify(publicView).includes('PRIVATE-ADMIN') || JSON.stringify(publicView).includes('private-review')) throw new Error('Public lifecycle projection leaked actor or reason');
if (publicView.credential.currentDefinitionVersion !== '2.0.0' || publicView.statusHistory.length !== 3) throw new Error('Public lifecycle/version projection failed');

console.log('Runtime core tests passed.');
