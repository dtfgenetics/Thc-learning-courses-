import { spawnSync } from 'node:child_process';
import { evaluateCredentialEligibility } from './evaluate-credential-eligibility.mjs';

function run(input, credential = null) {
  const args = ['scripts/evaluate-credential-eligibility.mjs', `--input=${input}`];
  if (credential) args.push(`--credential=${credential}`);
  return spawnSync(process.execPath, args, { encoding: 'utf8' });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pass = run('tests/fixtures/eligibility-pass.json', 'CRED-CULT-FOUNDATIONS-001');
if (pass.status !== 0) throw new Error(`Expected passing fixture to be eligible.\n${pass.stdout}\n${pass.stderr}`);
const passResult = JSON.parse(pass.stdout);
if (!passResult.eligible) throw new Error('Passing fixture returned eligible=false');

const fail = run('tests/fixtures/eligibility-fail.json', 'CRED-CULT-FOUNDATIONS-001');
if (fail.status !== 2) throw new Error(`Expected failing fixture to exit 2. Got ${fail.status}.\n${fail.stdout}\n${fail.stderr}`);
const failResult = JSON.parse(fail.stdout);
if (failResult.eligible) throw new Error('Failing fixture returned eligible=true');
if (!failResult.missingRequirements.some((row) => row.reason === 'below-minimum-score')) throw new Error('Failing fixture did not report below-minimum-score');

const performanceCredential = {
  id: 'CRED-TEST-PERFORMANCE-001',
  version: '1.0.0',
  eligibility: {
    requiredAssessments: ['ASSESS-TEST-KNOWLEDGE-001'],
    minimumPassingScorePercent: 80,
    requiredPerformanceAssessments: ['PRACTICAL-TEST-001', 'CAPSTONE-TEST-001'],
    requireVerifiedPerformanceEvidence: true
  }
};

const performanceDefinitions = new Map([
  ['PRACTICAL-TEST-001', { id: 'PRACTICAL-TEST-001', passingStandard: { minimumPercent: 80, noCriticalErrors: true } }],
  ['CAPSTONE-TEST-001', { id: 'CAPSTONE-TEST-001', passingStandard: { minimumPercent: 85, noCriticalErrors: true } }]
]);

function makePerformanceEvidence() {
  return {
    learnerId: 'TEST-LEARNER-PERFORMANCE',
    assessments: [{ assessmentId: 'ASSESS-TEST-KNOWLEDGE-001', status: 'passed', scorePercent: 88 }],
    performanceAssessments: [
      { assessmentId: 'PRACTICAL-TEST-001', status: 'passed', scorePercent: 86, evidenceVerified: true, criticalErrors: [] },
      { assessmentId: 'CAPSTONE-TEST-001', status: 'passed', scorePercent: 90, evidenceVerified: true, criticalErrors: [] }
    ]
  };
}

const performancePass = evaluateCredentialEligibility({
  credential: performanceCredential,
  evidence: makePerformanceEvidence(),
  performanceDefinitions
});
assert(performancePass.eligible, `Complete performance evidence should pass: ${JSON.stringify(performancePass.missingRequirements)}`);

const missingPracticalEvidence = makePerformanceEvidence();
missingPracticalEvidence.performanceAssessments = missingPracticalEvidence.performanceAssessments.filter((row) => row.assessmentId !== 'PRACTICAL-TEST-001');
const missingPractical = evaluateCredentialEligibility({ credential: performanceCredential, evidence: missingPracticalEvidence, performanceDefinitions });
assert(!missingPractical.eligible, 'Missing practical should make credential ineligible');
assert(missingPractical.missingRequirements.some((row) => row.id === 'PRACTICAL-TEST-001' && row.reason === 'missing-result'), 'Missing practical reason was not reported');

const criticalErrorEvidence = makePerformanceEvidence();
criticalErrorEvidence.performanceAssessments[0].criticalErrors = ['Unsafe action requiring assessor stop'];
const criticalError = evaluateCredentialEligibility({ credential: performanceCredential, evidence: criticalErrorEvidence, performanceDefinitions });
assert(!criticalError.eligible, 'Critical error should make credential ineligible');
assert(criticalError.missingRequirements.some((row) => row.reason === 'critical-error'), 'Critical error reason was not reported');

const lowCapstoneEvidence = makePerformanceEvidence();
lowCapstoneEvidence.performanceAssessments[1].scorePercent = 80;
const lowCapstone = evaluateCredentialEligibility({ credential: performanceCredential, evidence: lowCapstoneEvidence, performanceDefinitions });
assert(!lowCapstone.eligible, 'Capstone below its own passing standard should make credential ineligible');
assert(lowCapstone.missingRequirements.some((row) => row.id === 'CAPSTONE-TEST-001' && row.reason === 'below-performance-minimum-score'), 'Performance score failure reason was not reported');

const unverifiedEvidence = makePerformanceEvidence();
unverifiedEvidence.performanceAssessments[0].evidenceVerified = false;
const unverified = evaluateCredentialEligibility({ credential: performanceCredential, evidence: unverifiedEvidence, performanceDefinitions });
assert(!unverified.eligible, 'Unverified performance evidence should make credential ineligible when required');
assert(unverified.missingRequirements.some((row) => row.reason === 'performance-evidence-unverified'), 'Unverified evidence reason was not reported');

const missingDefinition = new Map(performanceDefinitions);
missingDefinition.delete('CAPSTONE-TEST-001');
const definitionFailure = evaluateCredentialEligibility({ credential: performanceCredential, evidence: makePerformanceEvidence(), performanceDefinitions: missingDefinition });
assert(!definitionFailure.eligible, 'Missing performance definition should fail closed');
assert(definitionFailure.missingRequirements.some((row) => row.id === 'CAPSTONE-TEST-001' && row.reason === 'missing-performance-definition'), 'Missing performance definition reason was not reported');

console.log('Credential eligibility tests passed.');
