import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const exists = (rel) => fs.existsSync(path.join(root, rel));

const program = read('content/credential-programs/CREDPROG-CULT-TECH-I-001.json');
const evidence = read('registry/technician-i-release-evidence.json');
const labPlan = read('registry/technician-i-integrated-lab-plan.json');
const programRegistry = read('content/credential-programs/registry.json');

const malformed = [];
const blockers = [];
const addMalformed = (reason, detail) => malformed.push({ reason, detail });
const addBlocker = (reason, detail) => blockers.push({ reason, detail });

if (program.id !== 'CREDPROG-CULT-TECH-I-001') addMalformed('program-id-mismatch', `Unexpected program id ${program.id}`);
if (!Array.isArray(program.requiredCourses) || program.requiredCourses.length !== 7) addMalformed('required-course-contract-invalid', 'Technician I must resolve exactly seven required course objects.');
for (const courseId of program.requiredCourses ?? []) {
  if (!exists(`content/courses/${courseId}.json`)) addMalformed('missing-required-course', courseId);
}
for (const competencyId of program.competencies ?? []) {
  if (!exists(`content/competencies/${competencyId}.json`)) addMalformed('missing-program-competency', competencyId);
}

const assessmentId = program.assessmentModel?.credentialAssessment;
if (!assessmentId) {
  addMalformed('credential-assessment-id-missing', 'Program must identify its credential-assessment contract.');
} else if (!exists(`content/assessments/${assessmentId}.json`)) {
  addMalformed('credential-assessment-object-missing', assessmentId);
}

let assessment = null;
if (assessmentId && exists(`content/assessments/${assessmentId}.json`)) {
  assessment = read(`content/assessments/${assessmentId}.json`);
  if (assessment.id !== assessmentId) addMalformed('credential-assessment-id-mismatch', `${assessment.id} != ${assessmentId}`);
  if (assessment.purpose !== 'credential') addMalformed('credential-assessment-purpose-invalid', assessment.purpose);
  if (assessment.status !== 'draft') addMalformed('public-credential-blueprint-status-unsafe', 'Public Technician I credential blueprint must remain draft until the secure operational assessment system is separately approved.');
  if ((assessment.items ?? []).length !== 0) addMalformed('public-operational-item-exposure', 'Public credential blueprint must not embed operational secure credential item IDs.');
  if (assessment.extensions?.operationalUseAuthorized !== false) addMalformed('public-blueprint-authorization-unsafe', 'Public credential blueprint must explicitly deny operational use.');
  if (assessment.extensions?.publicRepositoryItemsMayBeUsedForOperationalCredentialForms !== false) addMalformed('public-bank-boundary-unsafe', 'Public repository items must be explicitly barred from operational credential forms.');
  if (assessment.extensions?.secureOperationalItemBankRequired !== true) addMalformed('secure-bank-requirement-missing', 'Credential blueprint must require a separate secure operational bank.');
}

const registryEntry = (programRegistry.programs ?? []).find((row) => row.id === program.id);
if (!registryEntry) {
  addMalformed('program-registry-entry-missing', program.id);
} else {
  if (registryEntry.credentialAssessment !== assessmentId) addMalformed('program-registry-assessment-mismatch', `${registryEntry.credentialAssessment} != ${assessmentId}`);
  if (registryEntry.capstone !== program.assessmentModel?.capstone) addMalformed('program-registry-capstone-mismatch', `${registryEntry.capstone} != ${program.assessmentModel?.capstone}`);
}

if (evidence.credentialProgram !== program.id) addMalformed('release-evidence-program-mismatch', evidence.credentialProgram);
if (labPlan.credentialProgram !== program.id) addMalformed('lab-plan-program-mismatch', labPlan.credentialProgram);
if ((labPlan.practicals ?? []).length !== 6) addMalformed('practical-plan-count-invalid', `Expected 6 practicals, found ${(labPlan.practicals ?? []).length}`);
for (const practical of labPlan.practicals ?? []) {
  if (!exists(practical.document)) addMalformed('practical-document-missing', practical.document);
}
if (!exists(labPlan.capstone?.document ?? '')) addMalformed('capstone-document-missing', labPlan.capstone?.document ?? 'none');
if (labPlan.capstone?.id !== program.assessmentModel?.capstone) addMalformed('capstone-id-mismatch', `${labPlan.capstone?.id} != ${program.assessmentModel?.capstone}`);

if (!['approved', 'published'].includes(program.status)) addBlocker('program-status-not-approved', `status=${program.status}`);
for (const [field, value] of Object.entries(program.validation ?? {})) {
  if (value !== 'validated') addBlocker(`program-validation-${field}-incomplete`, `${field}=${value}`);
}
if (program.assessmentModel?.standardSettingStatus !== 'validated') addBlocker('standard-setting-incomplete', `status=${program.assessmentModel?.standardSettingStatus}`);

const requiredGateState = {
  humanTechnicalReview: 'approved',
  humanAssessmentReview: 'approved',
  renderedAccessibilityReview: 'approved',
  jobTaskAnalysisValidation: 'validated',
  smeEmployerValidation: 'validated',
  controlledPilotEvidence: 'accepted',
  practicalValidation: 'validated',
  capstoneValidation: 'validated',
  evaluatorCalibration: 'complete',
  interRaterEvidence: 'accepted',
  blueprintWeightsFinalization: 'finalized',
  secureOperationalItemBank: 'approved-private-operational',
  secureAssessmentStore: 'approved',
  equivalentSecureForms: 'approved',
  formalStandardSetting: 'validated',
  candidateEvidenceRetentionPrivacyPolicy: 'approved',
  credentialIssuanceWorkflowApproval: 'approved',
  finalProgramReleaseApproval: 'approved'
};
for (const [gate, required] of Object.entries(requiredGateState)) {
  const actual = evidence.gates?.[gate];
  if (actual === undefined) addMalformed('release-gate-missing', gate);
  else if (actual !== required) addBlocker(`release-gate-${gate}-incomplete`, `${actual}; required=${required}`);
}

if (labPlan.capstone?.secureCredentialFormApproved !== true) addBlocker('secure-capstone-form-not-approved', `approved=${labPlan.capstone?.secureCredentialFormApproved}`);
if ((labPlan.practicals ?? []).some((row) => row.status !== 'validated')) addBlocker('practical-set-not-validated', 'At least one Practical A-F remains development/unvalidated.');

const releaseReady = malformed.length === 0 && blockers.length === 0;
if (evidence.releaseReady !== releaseReady) addMalformed('committed-release-ready-flag-mismatch', `evidence.releaseReady=${evidence.releaseReady}; computed=${releaseReady}`);

const result = {
  credentialProgram: program.id,
  releaseReady: malformed.length === 0 && blockers.length === 0,
  structureValid: malformed.length === 0,
  malformed,
  blockers,
  summary: {
    requiredCourses: program.requiredCourses?.length ?? 0,
    practicals: labPlan.practicals?.length ?? 0,
    capstone: labPlan.capstone?.id ?? null,
    credentialAssessment: assessmentId ?? null,
    publicCredentialAssessmentItems: assessment?.items?.length ?? null,
    unresolvedBlockers: blockers.length,
    structuralErrors: malformed.length
  }
};

if (args.has('--human')) {
  console.log(`Technician I release readiness: ${result.releaseReady ? 'READY' : 'BLOCKED'}`);
  console.log(`Structure valid: ${result.structureValid}`);
  console.log(`Credential assessment: ${result.summary.credentialAssessment}; public operational items: ${result.summary.publicCredentialAssessmentItems}`);
  console.log(`Required courses: ${result.summary.requiredCourses}; practicals: ${result.summary.practicals}; capstone: ${result.summary.capstone}`);
  if (malformed.length) {
    console.log('Structural errors:');
    for (const row of malformed) console.log(`- ${row.reason}: ${row.detail}`);
  }
  if (blockers.length) {
    console.log('Release blockers:');
    for (const row of blockers) console.log(`- ${row.reason}: ${row.detail}`);
  }
} else {
  console.log(JSON.stringify(result, null, 2));
}

if (args.has('--check-structure') && malformed.length) process.exit(1);
if (args.has('--require-ready') && !result.releaseReady) process.exit(2);
