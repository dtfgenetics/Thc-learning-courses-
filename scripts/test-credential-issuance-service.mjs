import assert from 'node:assert/strict';
import fs from 'node:fs';
import { issueEligibleCredential } from '../apps/api/src/credential-issuance-service.mjs';

const read = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const baseCredential = read('content/credentials/CRED-CULT-TECH-I-001.json');
const course = read('content/courses/COURSE-LH-TECH1-007.json');
const evidence = read('tests/fixtures/tech1-eligibility-pass.json');

const signerCalls = [];
const signer = {
  issuer: { issuerId: 'THC-ACADEMY', name: 'Teaching Healthy Cultivation', url: 'https://dtfseeds.com/' },
  async signCredentialPayload(payload, context) {
    signerCalls.push({ payload, context });
    return {
      digest: 'd'.repeat(64),
      algorithm: 'EdDSA',
      keyId: 'kms/credential-test',
      signature: 'opaque-signature',
      issuer: this.issuer
    };
  }
};
const writerCalls = [];
const writer = {
  async issueCredential(record, options) {
    writerCalls.push({ record, options });
    return { credential: { ...record }, created: true, idempotent: false };
  }
};

const blocked = await issueEligibleCredential({
  credential: baseCredential,
  course,
  rawEvidence: evidence,
  learnerSubject: 'learner-001',
  learnerProfile: { learnerReference: 'THC-LRN-001', certificateName: 'Test Learner' },
  applications: [{ programId: 'CREDPROG-CULT-TECH-I-001', applicationReference: 'THC-APP-001', status: 'active' }],
  credentialWriter: writer,
  credentialSigner: signer,
  actorId: 'credential-admin',
  now: '2026-09-25T23:00:00.000Z'
});
assert.equal(blocked.status, 409);
assert.equal(blocked.body.error, 'credential-not-eligible');
assert.equal(blocked.body.requirementsSatisfied, true);
assert.equal(blocked.body.releaseAuthorized, false);
assert.equal(writerCalls.length, 0, 'release-blocked credential must never reach persistence');
assert.equal(signerCalls.length, 0, 'release-blocked credential must never reach signer');

const releasedCredential = structuredClone(baseCredential);
releasedCredential.status = 'published';
releasedCredential.governance = {
  certificationUseStatus: 'authorized',
  humanReviewStatus: 'complete',
  accessibilityReviewStatus: 'complete',
  pilotStatus: 'complete',
  standardSettingStatus: 'complete',
  releaseApprovalStatus: 'approved'
};

const issued = await issueEligibleCredential({
  credential: releasedCredential,
  course,
  rawEvidence: evidence,
  learnerSubject: 'learner-001',
  learnerProfile: { learnerReference: 'THC-LRN-001', certificateName: 'Test Learner' },
  applications: [{ programId: 'CREDPROG-CULT-TECH-I-001', applicationReference: 'THC-APP-001', status: 'active' }],
  credentialWriter: writer,
  credentialSigner: signer,
  actorId: 'credential-admin',
  now: '2026-09-25T23:00:00.000Z'
});
assert.equal(issued.status, 201);
assert.equal(issued.body.created, true);
assert.equal(issued.body.credential.credentialDefinitionId, 'CRED-CULT-TECH-I-001');
assert.equal(issued.body.credential.certificateName, 'Test Learner');
assert.equal(issued.body.credential.applicationReference, 'THC-APP-001');
assert.equal(writerCalls.length, 1);
assert.equal(signerCalls.length, 1);
assert.equal(writerCalls[0].record.status, 'issued');
assert.equal(writerCalls[0].record.courseId, 'COURSE-LH-TECH1-007');
assert.equal(writerCalls[0].record.payloadJson.evidence.assessments.length, 1);
assert.equal(writerCalls[0].record.payloadJson.evidence.performanceAssessments.length, 7);
assert.equal(writerCalls[0].record.payloadJson.integrity.keyId, 'kms/credential-test');
assert.equal(writerCalls[0].record.payloadHash, 'd'.repeat(64));
assert.notEqual(writerCalls[0].record.subjectHash, 'learner-001');
assert.equal(writerCalls[0].record.payloadJson.publicRecipientNameConsent, false);

const noName = await issueEligibleCredential({
  credential: releasedCredential,
  course,
  rawEvidence: evidence,
  learnerSubject: 'learner-002',
  learnerProfile: { learnerReference: 'THC-LRN-002', certificateName: '' },
  applications: [{ programId: 'CREDPROG-CULT-TECH-I-001', applicationReference: 'THC-APP-002', status: 'active' }],
  credentialWriter: writer,
  credentialSigner: signer,
  actorId: 'credential-admin'
});
assert.equal(noName.status, 409);
assert.equal(noName.body.error, 'certificate-name-required');

const noApplication = await issueEligibleCredential({
  credential: releasedCredential,
  course,
  rawEvidence: evidence,
  learnerSubject: 'learner-003',
  learnerProfile: { learnerReference: 'THC-LRN-003', certificateName: 'Learner Three' },
  applications: [],
  credentialWriter: writer,
  credentialSigner: signer,
  actorId: 'credential-admin'
});
assert.equal(noApplication.status, 409);
assert.equal(noApplication.body.error, 'credential-application-required');

console.log('Fail-closed credential issuance service eligibility, identity, application, signing and persistence contract passed.');
