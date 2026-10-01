import { createAttempt, submitAttempt, scoreAttempt, competencyResults } from '../packages/domain/assessment-runtime.mjs';
import { transitionCredential, publicCredentialView } from '../packages/domain/credential-runtime.mjs';

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
let blocked = false;
try { transitionCredential(valid.credential, 'issued', { actorId:'SYSTEM' }); } catch { blocked = true; }
if (!blocked) throw new Error('Invalid credential transition was not blocked');
const definition = { id:'CRED-CULT-FOUNDATIONS-001', title:'THC Cultivation Foundations Certificate' };
const publicView = publicCredentialView(valid.credential, definition, { now:'2026-09-05T00:14:00.000Z' });
if ('subjectHash' in publicView || 'assessmentEvidence' in publicView) throw new Error('Public credential projection leaked private fields');
if (publicView.valid !== true) throw new Error('Valid credential must project valid=true');

const revokedCredential = { ...valid.credential, status:'revoked' };
if (publicCredentialView(revokedCredential, definition, { now:'2026-09-05T00:14:00.000Z' }).valid !== false) throw new Error('Revoked credential must project valid=false');

const expiredStatusCredential = { ...valid.credential, status:'expired' };
if (publicCredentialView(expiredStatusCredential, definition, { now:'2026-09-05T00:14:00.000Z' }).valid !== false) throw new Error('Expired credential status must project valid=false');

const expiredByDateCredential = { ...valid.credential, status:'valid', expiresAt:'2026-09-05T00:13:30.000Z' };
if (publicCredentialView(expiredByDateCredential, definition, { now:'2026-09-05T00:14:00.000Z' }).valid !== false) throw new Error('Past expiresAt must project valid=false even before lifecycle reconciliation');

const futureExpiryCredential = { ...valid.credential, status:'valid', expiresAt:'2026-09-06T00:00:00.000Z' };
if (publicCredentialView(futureExpiryCredential, definition, { now:'2026-09-05T00:14:00.000Z' }).valid !== true) throw new Error('Future expiresAt must remain valid');

console.log('Runtime core tests passed.');
