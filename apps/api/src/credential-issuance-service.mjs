import crypto from 'node:crypto';
import { evaluateCredentialEligibility } from '../../../packages/domain/credential-eligibility.mjs';

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function credentialSubjectHash(learnerSubject) {
  if (!String(learnerSubject ?? '').trim()) throw new Error('learner subject required');
  return sha256(`thc-academy:credential-subject:${learnerSubject}`);
}

function credentialEvidenceProjection(credential, rawEvidence) {
  const assessmentIds = new Set(credential.eligibility.requiredAssessments ?? []);
  const performanceIds = new Set(credential.eligibility.requiredPerformanceAssessments ?? []);
  const artifactIds = new Set(credential.eligibility.requiredPortfolioArtifacts ?? []);

  const assessments = (rawEvidence.assessments ?? [])
    .filter((row) => assessmentIds.has(row.assessmentId) && row.status === 'passed')
    .map((row) => ({
      assessmentId: row.assessmentId,
      scorePercent: Number(row.scorePercent),
      status: 'passed'
    }));

  const performanceAssessments = (rawEvidence.performanceAssessments ?? [])
    .filter((row) => performanceIds.has(row.assessmentId) && row.status === 'passed')
    .map((row) => ({
      assessmentId: row.assessmentId,
      scorePercent: row.scorePercent == null ? null : Number(row.scorePercent),
      status: 'passed',
      criticalErrorCount: Number(row.criticalErrorCount ?? 0)
    }));

  const portfolioArtifacts = (rawEvidence.portfolioArtifacts ?? [])
    .filter((row) => artifactIds.has(row.artifactId) && ['accepted','verified','complete'].includes(row.status))
    .map((row) => ({ artifactId: row.artifactId, status: row.status }));

  return { assessments, performanceAssessments, portfolioArtifacts };
}

function activeApplicationForCredential(credential, applications = []) {
  if (!credential.credentialProgram) return null;
  return applications.find((row) =>
    row.programId === credential.credentialProgram &&
    ['active','completed'].includes(row.status)
  ) ?? null;
}

export async function issueEligibleCredential({
  credential,
  course,
  rawEvidence,
  learnerSubject,
  learnerProfile,
  applications = [],
  credentialWriter,
  credentialSigner,
  actorId,
  now = new Date().toISOString()
} = {}) {
  if (!credential?.id) throw new Error('credential definition required');
  if (!course?.id) throw new Error('credential anchor course required');
  if (!learnerSubject) throw new Error('learner subject required');
  if (!credentialWriter || typeof credentialWriter.issueCredential !== 'function') {
    return { status: 503, body: { error: 'credential-issuance-persistence-unavailable' } };
  }
  if (!credentialSigner || typeof credentialSigner.signCredentialPayload !== 'function') {
    return { status: 503, body: { error: 'credential-signing-unavailable' } };
  }
  if (!actorId) throw new Error('credential issuance actor required');

  const eligibility = evaluateCredentialEligibility({ credential, evidence: rawEvidence });
  if (!eligibility.eligible) {
    return {
      status: 409,
      body: {
        error: 'credential-not-eligible',
        requirementsSatisfied: eligibility.requirementsSatisfied,
        releaseAuthorized: eligibility.releaseAuthorized,
        missingRequirements: eligibility.missingRequirements,
        releaseBlockers: eligibility.releaseBlockers
      }
    };
  }

  const certificateName = String(learnerProfile?.certificateName ?? '').trim();
  if (!certificateName) {
    return { status: 409, body: { error: 'certificate-name-required', action: 'save-learner-profile' } };
  }

  const application = activeApplicationForCredential(credential, applications);
  if (credential.credentialProgram && !application?.applicationReference) {
    return {
      status: 409,
      body: {
        error: 'credential-application-required',
        credentialProgram: credential.credentialProgram
      }
    };
  }

  const evidence = credentialEvidenceProjection(credential, rawEvidence);
  const verificationId = crypto.randomBytes(18).toString('hex').toUpperCase();
  const credentialId = crypto.randomUUID();
  const subjectHash = credentialSubjectHash(learnerSubject);

  const unsignedPayload = {
    format: 'thc-academy-issued-credential-v1',
    credential: {
      id: credential.id,
      version: credential.version,
      title: credential.title,
      role: credential.role ?? null,
      credentialProgram: credential.credentialProgram ?? null
    },
    course: {
      id: course.id,
      version: credential.courseVersion ?? course.version
    },
    recipient: {
      learnerReference: learnerProfile?.learnerReference ?? null,
      certificateName,
      applicationReference: application?.applicationReference ?? null
    },
    issuer: credentialSigner.issuer,
    issuedAt: now,
    verificationId,
    publicRecipientNameConsent: false,
    publicRecipientName: null,
    publicEvidenceSummary: {
      writtenAssessments: evidence.assessments.length,
      performanceAssessments: evidence.performanceAssessments.length,
      portfolioArtifacts: evidence.portfolioArtifacts.length
    },
    evidence: {
      assessments: evidence.assessments,
      performanceAssessments: evidence.performanceAssessments,
      portfolioArtifacts: evidence.portfolioArtifacts
    }
  };

  const signed = await credentialSigner.signCredentialPayload(unsignedPayload, {
    credentialId,
    verificationId
  });

  const payloadJson = {
    ...unsignedPayload,
    integrity: {
      algorithm: signed.algorithm,
      keyId: signed.keyId,
      signature: signed.signature,
      digest: signed.digest
    }
  };

  const record = {
    id: credentialId,
    verificationId,
    subjectHash,
    credentialDefinitionId: credential.id,
    credentialDefinitionVersion: credential.version,
    courseId: course.id,
    courseVersion: credential.courseVersion ?? course.version,
    status: 'issued',
    issuedAt: now,
    expiresAt: null,
    payloadJson,
    payloadHash: signed.digest
  };

  const persisted = await credentialWriter.issueCredential(record, { actorId });
  const saved = persisted.credential;
  const savedPayload = saved.payloadJson ?? payloadJson;

  return {
    status: persisted.created ? 201 : 200,
    body: {
      credential: {
        id: saved.id,
        verificationId: saved.verificationId,
        credentialDefinitionId: saved.credentialDefinitionId,
        credentialDefinitionVersion: saved.credentialDefinitionVersion,
        status: saved.status,
        issuedAt: saved.issuedAt,
        expiresAt: saved.expiresAt ?? null,
        title: credential.title,
        certificateName: savedPayload?.recipient?.certificateName ?? certificateName,
        learnerReference: savedPayload?.recipient?.learnerReference ?? learnerProfile?.learnerReference ?? null,
        applicationReference: savedPayload?.recipient?.applicationReference ?? application?.applicationReference ?? null
      },
      created: persisted.created === true,
      idempotent: persisted.idempotent === true
    }
  };
}
