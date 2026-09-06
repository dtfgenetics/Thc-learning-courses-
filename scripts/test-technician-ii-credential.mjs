import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createAttempt, submitAttempt, scoreAttempt } from '../packages/domain/assessment-runtime.mjs';

function run(args) {
  return spawnSync(process.execPath, args, { encoding: 'utf8' });
}

const expectedPools = new Map([
  ['ITEM-TECH2-DIAG-', 8],
  ['ITEM-TECH2-SENSOR-', 8],
  ['ITEM-TECH2-EQUIP-', 6],
  ['ITEM-TECH2-FERT-', 8],
  ['ITEM-TECH2-ROOT-', 8],
  ['ITEM-TECH2-IPM-', 8],
  ['ITEM-TECH2-PROP-', 6],
  ['ITEM-TECH2-CANOPY-', 6],
  ['ITEM-TECH2-POST-', 8],
  ['ITEM-TECH2-DEV-', 6],
  ['ITEM-TECH2-TRACE-', 6],
  ['ITEM-TECH2-METRIC-', 7],
  ['ITEM-TECH2-PEER-', 5]
]);

const generated = run([
  'scripts/generate-exam-form.mjs',
  '--allow-draft',
  '--seed=technician-ii-contract',
  '--assessment=ASSESS-CULT-TECH-II-CREDENTIAL-001'
]);
if (generated.status !== 0) throw new Error(`Technician II form generation failed.\n${generated.stdout}\n${generated.stderr}`);
const form = JSON.parse(generated.stdout);
if (form.items.length !== 90) throw new Error(`Expected 90 Technician II items, got ${form.items.length}`);
if (new Set(form.items.map((item) => `${item.id}@${item.version}`)).size !== 90) throw new Error('Technician II form contains duplicate items');
if (form.coverage.length !== 13) throw new Error(`Expected 13 Technician II coverage pools, got ${form.coverage.length}`);
for (const [prefix, count] of expectedPools) {
  const actual = form.items.filter((item) => item.id.startsWith(prefix)).length;
  if (actual !== count) throw new Error(`${prefix} expected ${count} item(s), got ${actual}`);
}

const eligible = run([
  'scripts/evaluate-credential-eligibility.mjs',
  '--input=tests/fixtures/tech2-eligibility-pass.json',
  '--credential=CRED-CULT-TECH-II-001'
]);
if (eligible.status !== 0) throw new Error(`Passing Technician II evidence was rejected.\n${eligible.stdout}\n${eligible.stderr}`);
const eligibleResult = JSON.parse(eligible.stdout);
if (!eligibleResult.eligible) throw new Error('Passing Technician II fixture returned eligible=false');
if (eligibleResult.requirementSummary.writtenAssessments !== 1 || eligibleResult.requirementSummary.performanceAssessments !== 8 || eligibleResult.requirementSummary.portfolioArtifacts !== 9) {
  throw new Error('Technician II eligibility requirement summary is incorrect');
}

const ineligible = run([
  'scripts/evaluate-credential-eligibility.mjs',
  '--input=tests/fixtures/tech2-eligibility-fail.json',
  '--credential=CRED-CULT-TECH-II-001'
]);
if (ineligible.status !== 2) throw new Error(`Failing Technician II evidence should exit 2, got ${ineligible.status}.\n${ineligible.stdout}\n${ineligible.stderr}`);
const ineligibleResult = JSON.parse(ineligible.stdout);
if (!ineligibleResult.missingRequirements.some((row) => row.reason === 'critical-error')) throw new Error('Critical performance error did not block Technician II eligibility');
if (!ineligibleResult.missingRequirements.some((row) => row.reason === 'missing-artifact')) throw new Error('Missing portfolio artifact did not block Technician II eligibility');

const issued = run([
  'scripts/issue-test-credential.mjs',
  '--test',
  '--input=tests/fixtures/tech2-eligibility-pass.json',
  '--credential=CRED-CULT-TECH-II-001'
]);
if (issued.status !== 0) throw new Error(`Technician II test issuance failed.\n${issued.stdout}\n${issued.stderr}`);
const record = JSON.parse(issued.stdout);
if (record.credentialDefinition !== 'CRED-CULT-TECH-II-001') throw new Error('Issued Technician II record has wrong definition');
if (record.performanceEvidence.length !== 8 || record.portfolioEvidence.length !== 9) throw new Error('Issued Technician II record did not preserve required performance evidence');
if (!record.performanceEvidence.every((row) => row.evidenceVerified === true)) throw new Error('Issued Technician II record did not preserve verified performance evidence');

const tempPath = path.join(os.tmpdir(), 'thc-tech2-public-projection.json');
fs.writeFileSync(tempPath, JSON.stringify(record, null, 2));
const verifiedRecord = run(['scripts/verify-test-credential.mjs', `--input=${tempPath}`]);
if (verifiedRecord.status !== 0) throw new Error(`Issued Technician II record failed schema/integrity verification.\n${verifiedRecord.stdout}\n${verifiedRecord.stderr}`);
const verifiedRecordResult = JSON.parse(verifiedRecord.stdout);
if (!verifiedRecordResult.valid) throw new Error('Issued Technician II record verifier returned valid=false');

const malformedRecord = JSON.parse(JSON.stringify(record));
delete malformedRecord.performanceEvidence[0].evidenceVerified;
fs.writeFileSync(tempPath, JSON.stringify(malformedRecord, null, 2));
const malformedVerification = run(['scripts/verify-test-credential.mjs', `--input=${tempPath}`]);
if (malformedVerification.status !== 2) throw new Error('Malformed Technician II performance evidence should fail credential verification');
const malformedResult = JSON.parse(malformedVerification.stdout);
if (malformedResult.reason !== 'invalid-record-schema') throw new Error(`Expected invalid-record-schema, got ${malformedResult.reason}`);

fs.writeFileSync(tempPath, JSON.stringify(record, null, 2));
const projected = run(['scripts/project-public-verification.mjs', `--input=${tempPath}`]);
if (projected.status !== 0) throw new Error(`Technician II public projection failed.\n${projected.stdout}\n${projected.stderr}`);
const publicResult = JSON.parse(projected.stdout);
if (publicResult.credential?.id !== 'CRED-CULT-TECH-II-001' || publicResult.credential?.role !== 'ROLE-CULT-TECH-II-001') throw new Error('Public Technician II projection resolved the wrong definition or role');
for (const forbidden of ['subjectId', 'assessmentEvidence', 'performanceEvidence', 'portfolioEvidence', 'integrityHash']) {
  if (Object.prototype.hasOwnProperty.call(publicResult, forbidden)) throw new Error(`Public Technician II projection leaked ${forbidden}`);
}
if (publicResult.evidenceSummary?.performanceAssessments !== 8 || publicResult.evidenceSummary?.portfolioArtifacts !== 9) throw new Error('Public Technician II evidence summary is incomplete');

const numericAssessment = { id: 'ASSESS-NUMERIC-CONTRACT', version: '1.0.0' };
const numericForm = { id: 'FORM-NUMERIC-CONTRACT', integrityHash: 'contract-hash', items: [{ id: 'ITEM-NUMERIC-CONTRACT', version: 1 }] };
const started = createAttempt({ learnerId: 'NUMERIC-LEARNER', assessment: numericAssessment, form: numericForm });
const submitted = submitAttempt(started, [{ itemId: 'ITEM-NUMERIC-CONTRACT', itemVersion: 1, response: 42 }]);
const scored = scoreAttempt(submitted, [{ id: 'ITEM-NUMERIC-CONTRACT', version: 1, competency: 'COMP-WATER-001', type: 'numeric', correct: 42 }], 80);
if (!scored.passed || scored.scorePercent !== 100 || scored.items[0].competency !== 'COMP-WATER-001') throw new Error('Numeric scoring/form compatibility contract failed');

console.log('Technician II credential lifecycle contract passed.');
