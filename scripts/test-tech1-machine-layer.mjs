import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const exists = (rel) => fs.existsSync(path.join(root, rel));
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const program = read('content/credential-programs/CREDPROG-CULT-TECH-I-001.json');
const layer = read('registry/technician-i-machine-layer.json');
const crosswalk = read(layer.jtaCrosswalk);
const labPlan = read(layer.integratedLabPlan);
const releaseEvidence = read(layer.releaseEvidence);
const credentialAssessment = read(layer.credentialAssessmentBlueprint);

assert.equal(layer.credentialProgram, program.id);
assert.equal(layer.sourcePackagesRequired, 7);
assert.equal(program.requiredCourses.length, 7);

for (const file of [
  layer.jtaCrosswalk,
  layer.integratedLabPlan,
  layer.releaseEvidence,
  layer.credentialAssessmentBlueprint,
  ...Object.values(layer.contracts)
]) assert.ok(exists(file), `missing Technician I machine-layer artifact ${file}`);

assert.equal(crosswalk.credentialProgram, program.id);
assert.equal(crosswalk.humanValidationRequired, true);
assert.equal(crosswalk.domains.length, 13);
assert.deepEqual(crosswalk.domains.map((row) => row.domain), Array.from({ length: 13 }, (_, i) => i + 1));
assert.ok(crosswalk.domains.every((row) => row.capstone === true), 'all 13 JTA domains must be represented in the integrated capstone blueprint');

const mappedCompetencies = new Set(crosswalk.domains.flatMap((row) => row.competencies ?? []));
for (const competency of program.competencies) {
  assert.ok(exists(`content/competencies/${competency}.json`), `program competency object missing: ${competency}`);
  assert.ok(mappedCompetencies.has(competency), `program competency is absent from JTA crosswalk: ${competency}`);
}

const mappedCourses = new Set(crosswalk.domains.flatMap((row) => row.courses ?? []));
for (const courseId of program.requiredCourses) assert.ok(mappedCourses.has(courseId), `required course absent from JTA crosswalk: ${courseId}`);
const course7Domains = crosswalk.domains.filter((row) => row.courses.includes('COURSE-LH-TECH1-007')).map((row) => row.domain);
assert.deepEqual(course7Domains, Array.from({ length: 13 }, (_, i) => i + 1), 'Course 7 must integrate all 13 JTA domains');

const expectedPracticals = ['PRACTICAL-TECH1-A', 'PRACTICAL-TECH1-B', 'PRACTICAL-TECH1-C', 'PRACTICAL-TECH1-D', 'PRACTICAL-TECH1-E', 'PRACTICAL-TECH1-F'];
assert.deepEqual(labPlan.practicals.map((row) => row.id), expectedPracticals);
const mappedPracticals = new Set(crosswalk.domains.flatMap((row) => row.practicals ?? []));
for (const practical of expectedPracticals) assert.ok(mappedPracticals.has(practical), `practical absent from JTA crosswalk: ${practical}`);

const expectedCriticalFailures = ['CF-SAFETY-001', 'CF-IDENTITY-001', 'CF-INTEGRITY-001', 'CF-AUTHORITY-001', 'CF-HOLD-001'];
assert.deepEqual(labPlan.criticalFailureRules.map((row) => row.id), expectedCriticalFailures);
assert.ok(labPlan.criticalFailureRules.every((row) => row.blocksCredentialEvidence === true));
assert.match(program.assessmentModel?.passingRule ?? '', /credential-blocking critical failure/i);
assert.equal(program.assessmentModel?.noCriticalErrorsRequired, true);
assert.equal(program.assessmentModel?.standardSettingStatus, 'provisional');

assert.equal(credentialAssessment.status, 'draft');
assert.equal(credentialAssessment.purpose, 'credential');
assert.deepEqual(credentialAssessment.items, []);
assert.equal(credentialAssessment.extensions?.operationalUseAuthorized, false);
assert.equal(credentialAssessment.extensions?.publicRepositoryItemsMayBeUsedForOperationalCredentialForms, false);
assert.equal(credentialAssessment.extensions?.secureOperationalItemBankRequired, true);
assert.equal(credentialAssessment.extensions?.secureAssessmentStoreRequired, true);
assert.equal(credentialAssessment.extensions?.equivalentSecureFormsRequired, true);

for (const [key, value] of Object.entries(layer.securityBoundary)) {
  if (key.endsWith('Allowed') || key.endsWith('Authorized') || key.endsWith('Enabled') || key.endsWith('Approved')) {
    assert.equal(value, false, `security boundary must remain fail-closed: ${key}`);
  }
}
assert.equal(layer.humanEvidenceBoundary.syntheticHumanApprovalAllowed, false);
assert.equal(layer.humanEvidenceBoundary.syntheticPilotEvidenceAllowed, false);
assert.equal(layer.humanEvidenceBoundary.syntheticCalibrationEvidenceAllowed, false);
assert.equal(layer.humanEvidenceBoundary.syntheticStandardSettingAllowed, false);
assert.equal(layer.humanEvidenceBoundary.finalReleaseRequiresHumanApproval, true);

assert.equal(releaseEvidence.releaseReady, false);
assert.notEqual(releaseEvidence.gates.secureOperationalItemBank, 'approved-private-operational');
assert.notEqual(releaseEvidence.gates.secureAssessmentStore, 'approved');
assert.notEqual(releaseEvidence.gates.equivalentSecureForms, 'approved');
assert.notEqual(releaseEvidence.gates.credentialIssuanceWorkflowApproval, 'approved');
assert.notEqual(releaseEvidence.gates.finalProgramReleaseApproval, 'approved');

const packageRun = spawnSync(process.execPath, ['scripts/report-tech1-course-package-readiness.mjs', '--require-source-package'], { encoding: 'utf8' });
assert.equal(packageRun.status, 0, packageRun.stderr || packageRun.stdout || 'all seven Technician I source packages must resolve');

const releaseRun = spawnSync(process.execPath, ['scripts/report-tech1-release-readiness.mjs'], { encoding: 'utf8' });
assert.equal(releaseRun.status, 0, releaseRun.stderr || 'release readiness reporter must execute');
const release = JSON.parse(releaseRun.stdout);
assert.equal(release.structureValid, true, `credential release structure must remain valid: ${JSON.stringify(release.malformed)}`);
assert.equal(release.releaseReady, false, 'credential issuance must remain blocked until genuine release evidence exists');

console.log('Technician I credential machine layer passed: seven source packages, 13-domain JTA/competency mapping, practical/capstone contracts, secure assessment boundaries, candidate governance and disabled issuance/verification controls all resolve while human release gates remain open.');
