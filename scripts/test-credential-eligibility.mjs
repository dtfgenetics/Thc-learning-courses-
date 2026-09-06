import { spawnSync } from 'node:child_process';
import { evaluateCredentialEligibility } from '../packages/domain/credential-eligibility.mjs';

function run(input) {
  return spawnSync(process.execPath, ['scripts/evaluate-credential-eligibility.mjs', `--input=${input}`], { encoding: 'utf8' });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pass = run('tests/fixtures/eligibility-pass.json');
if (pass.status !== 0) throw new Error(`Expected passing fixture to be eligible.\n${pass.stdout}\n${pass.stderr}`);
const passResult = JSON.parse(pass.stdout);
if (!passResult.eligible) throw new Error('Passing fixture returned eligible=false');

const fail = run('tests/fixtures/eligibility-fail.json');
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
    requireNoCriticalErrors: true,
    requireVerifiedPerformanceEvidence: true,
    requiredPortfolioArtifacts: []
  }
};

const performanceDefinitions = new Map([
  ['PRACTICAL-TEST-001', { id: 'PRACTICAL-TEST-001', version: '1.0.0', passingStandard: { minimumPercent: 80, noCriticalErrors: true } }],
  ['CAPSTONE-TEST-001', { id: 'CAPSTONE-TEST-001', version: '1.0.0', passingStandard: { minimumPercent: 85, noCriticalErrors: true } }]
]);

function makePerformanceEvidence() {
  return {
    learnerId: 'TEST-LEARNER-PERFORMANCE',
    assessments: [{ assessmentId: 'ASSESS-TEST-KNOWLEDGE-001', status: 'passed', scorePercent: 88 }],
    performanceAssessments: [
      { assessmentId: 'PRACTICAL-TEST-001', assessmentVersion: '1.0.0', status: 'passed', scorePercent: 86, criticalErrorCount: 0, evidenceVerified: true },
      { assessmentId: 'CAPSTONE-TEST-001', assessmentVersion: '1.0.0', status: 'passed', scorePercent: 90, criticalErrorCount: 0, evidenceVerified: true }
    ],
    portfolioArtifacts: []
  };
}

const performancePass = evaluateCredentialEligibility({ credential: performanceCredential, evidence: makePerformanceEvidence(), performanceDefinitions });
assert(performancePass.eligible, `Complete performance evidence should pass: ${JSON.stringify(performancePass.missingRequirements)}`);

const lowScoreEvidence = makePerformanceEvidence();
lowScoreEvidence.performanceAssessments[1].scorePercent = 80;
const lowScore = evaluateCredentialEligibility({ credential: performanceCredential, evidence: lowScoreEvidence, performanceDefinitions });
assert(!lowScore.eligible, 'A performance result below its encoded passing standard must fail even when status=passed');
assert(lowScore.missingRequirements.some((row) => row.id === 'CAPSTONE-TEST-001' && row.reason === 'below-performance-minimum-score'), 'Low performance score reason was not reported');

const missingScoreEvidence = makePerformanceEvidence();
missingScoreEvidence.performanceAssessments[0].scorePercent = null;
const missingScore = evaluateCredentialEligibility({ credential: performanceCredential, evidence: missingScoreEvidence, performanceDefinitions });
assert(!missingScore.eligible, 'A performance result without a score must fail eligibility');
assert(missingScore.missingRequirements.some((row) => row.id === 'PRACTICAL-TEST-001' && row.reason === 'missing-score'), 'Missing performance score reason was not reported');

const versionMismatchEvidence = makePerformanceEvidence();
versionMismatchEvidence.performanceAssessments[0].assessmentVersion = '0.9.0';
const versionMismatch = evaluateCredentialEligibility({ credential: performanceCredential, evidence: versionMismatchEvidence, performanceDefinitions });
assert(!versionMismatch.eligible, 'Outdated performance evidence must not satisfy the current practical definition');
assert(versionMismatch.missingRequirements.some((row) => row.id === 'PRACTICAL-TEST-001' && row.reason === 'performance-version-mismatch'), 'Performance version mismatch reason was not reported');

const missingVersionEvidence = makePerformanceEvidence();
delete missingVersionEvidence.performanceAssessments[0].assessmentVersion;
const missingVersion = evaluateCredentialEligibility({ credential: performanceCredential, evidence: missingVersionEvidence, performanceDefinitions });
assert(!missingVersion.eligible, 'Performance evidence without an assessment version must fail when the definition is versioned');
assert(missingVersion.missingRequirements.some((row) => row.id === 'PRACTICAL-TEST-001' && row.reason === 'missing-performance-version'), 'Missing performance version reason was not reported');

const criticalErrorEvidence = makePerformanceEvidence();
criticalErrorEvidence.performanceAssessments[0].criticalErrorCount = 1;
const criticalError = evaluateCredentialEligibility({ credential: performanceCredential, evidence: criticalErrorEvidence, performanceDefinitions });
assert(!criticalError.eligible, 'A critical performance error must block eligibility');
assert(criticalError.missingRequirements.some((row) => row.reason === 'critical-error'), 'Critical error reason was not reported');

const unverifiedEvidence = makePerformanceEvidence();
unverifiedEvidence.performanceAssessments[0].evidenceVerified = false;
const unverified = evaluateCredentialEligibility({ credential: performanceCredential, evidence: unverifiedEvidence, performanceDefinitions });
assert(!unverified.eligible, 'Unverified performance evidence must block eligibility when verification is required');
assert(unverified.missingRequirements.some((row) => row.reason === 'performance-evidence-unverified'), 'Unverified performance evidence reason was not reported');

const missingDefinition = new Map(performanceDefinitions);
missingDefinition.delete('CAPSTONE-TEST-001');
const missingDefinitionResult = evaluateCredentialEligibility({ credential: performanceCredential, evidence: makePerformanceEvidence(), performanceDefinitions: missingDefinition });
assert(!missingDefinitionResult.eligible, 'Missing required performance definitions must fail closed');
assert(missingDefinitionResult.missingRequirements.some((row) => row.id === 'CAPSTONE-TEST-001' && row.reason === 'missing-performance-definition'), 'Missing performance definition reason was not reported');

console.log('Credential eligibility tests passed.');
