import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const readText = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

const course = read('content/courses/COURSE-LH-TECH1-007.json');
assert.equal(course.status, 'draft');
assert.equal(course.finalAssessment, null, 'Course 7 intentionally uses integrated performance rather than an ordinary final exam');
assert.equal(course.extensions?.dedicatedLabModuleRequired, false);
assert.equal(course.extensions?.dedicatedLabModule, 'MOD-LH-TECH1-007-LAB');
assert.equal(course.extensions?.labPlan, 'LABPLAN-TECH1-001');
assert.equal(course.extensions?.integratedPerformanceValidationRequired, true);
assert.equal(course.extensions?.liveCredentialFormApproved, false);
assert.equal(course.extensions?.independentPesticideTreatmentAuthorityConferred, false);
assert.equal(course.extensions?.independentProductReleaseAuthorityConferred, false);
assert.equal(course.extensions?.pilotEvidenceRequired, true);
assert.equal(course.extensions?.evaluatorCalibrationRequired, true);
assert.equal(course.extensions?.standardSettingRequired, true);
assert.equal(course.extensions?.candidateEvidenceRetentionPolicyRequired, true);

const mod = read('content/modules/MOD-LH-TECH1-007-LAB.json');
assert.equal(mod.lessons.length, 4);
assert.equal(mod.assessment, 'ASSESS-LH-TECH1-007-M01');
for (const id of mod.lessons) {
  assert.ok(exists(`content/lessons/${id}.json`), `missing integrated lab lesson ${id}`);
  const lesson = read(`content/lessons/${id}.json`);
  assert.ok(lesson.estimatedMinutes >= 60, `${id} should retain substantive integrated lab time`);
  assert.ok((lesson.references ?? []).length > 0, `${id} must retain evidence references`);
  assert.ok((lesson.content?.blocks ?? []).length > 0, `${id} must retain applied learner blocks`);
}

const expectedObjectives = Array.from({ length: 6 }, (_, i) => `LO-LH-TECH1-007-0${i + 1}`);
for (const id of expectedObjectives) assert.ok(exists(`content/learning-objectives/${id}.json`), `missing Course 7 objective ${id}`);

const assess = read('content/assessments/ASSESS-LH-TECH1-007-M01.json');
assert.equal(assess.status, 'draft');
assert.equal(assess.purpose, 'formative');
assert.equal(assess.items.length, 12);
assert.equal(new Set(assess.items).size, 12);
assert.deepEqual(new Set(assess.objectives), new Set(expectedObjectives));
const readinessCounts = new Map(expectedObjectives.map((id) => [id, 0]));
for (const id of assess.items) {
  const q = read(`content/questions/${id}.json`);
  assert.equal(q.status, 'draft');
  assert.equal(q.purpose, 'formative');
  assert.notEqual(q.purpose, 'credential');
  assert.ok(assess.objectives.includes(q.objective), `${id} objective must belong to Course 7 readiness assessment`);
  assert.ok(assess.competencies.includes(q.competency), `${id} competency must belong to Course 7 readiness assessment`);
  assert.ok(Array.isArray(q.references) && q.references.length > 0, `${id} must retain evidence references`);
  readinessCounts.set(q.objective, readinessCounts.get(q.objective) + 1);
}
assert.deepEqual([...readinessCounts.values()], [2, 2, 2, 2, 2, 2], 'Course 7 readiness bank must retain two formative items per integrated objective');

const plan = read('registry/technician-i-integrated-lab-plan.json');
assert.equal(plan.courseId, course.id);
assert.equal(plan.credentialProgram, 'CREDPROG-CULT-TECH-I-001');
assert.equal(plan.practicals.length, 6);
assert.deepEqual(plan.practicals.map((p) => p.id), ['PRACTICAL-TECH1-A', 'PRACTICAL-TECH1-B', 'PRACTICAL-TECH1-C', 'PRACTICAL-TECH1-D', 'PRACTICAL-TECH1-E', 'PRACTICAL-TECH1-F']);
for (const p of plan.practicals) {
  assert.equal(p.totalPoints, 100);
  assert.equal(p.targetPassPoints, 80);
  assert.equal(p.status, 'development');
  assert.ok(exists(p.document), `missing controlled practical document ${p.document}`);
}
assert.equal(plan.capstone.id, 'CAPSTONE-TECH1-SHIFT-001');
assert.equal(plan.capstone.totalPoints, 200);
assert.equal(plan.capstone.developmentTargetPassPoints, 160);
assert.equal(plan.capstone.scoreDomains.reduce((sum, domain) => sum + domain.points, 0), 200);
assert.equal(plan.capstone.secureCredentialFormApproved, false);
assert.ok(exists(plan.capstone.document));
assert.equal(plan.criticalFailureRules.length, 5);
assert.ok(plan.criticalFailureRules.every((rule) => rule.blocksCredentialEvidence === true));
assert.deepEqual(plan.criticalFailureRules.map((rule) => rule.id), ['CF-SAFETY-001', 'CF-IDENTITY-001', 'CF-INTEGRITY-001', 'CF-AUTHORITY-001', 'CF-HOLD-001']);
assert.equal(plan.evaluatorControls.rubricTrainingRequired, true);
assert.equal(plan.evaluatorControls.evidenceBasedScoringRequired, true);
assert.equal(plan.evaluatorControls.pilotDoubleScoringRequired, true);
assert.equal(plan.evaluatorControls.interRaterAgreementTarget, 'to-be-set-from-pilot-evidence');
assert.equal(plan.formControls.equivalentFormsRequired, true);
assert.equal(plan.formControls.secureCredentialFormsPublic, false);
assert.equal(plan.formControls.credentialFormHintsAllowed, false);
assert.equal(plan.retestPolicy.remediationBeforeRetest, true);
assert.equal(plan.retestPolicy.equivalentFormRequired, true);
assert.equal(plan.retestPolicy.criticalFailureRequiresAffectedDomainReevaluation, true);
assert.equal(plan.retestPolicy.finalPolicyRequiresHumanApproval, true);

const packageFiles = [
  'docs/learning-hub/tech1/course-007/OBJECTIVE-PERFORMANCE-CROSSWALK.md',
  'docs/learning-hub/tech1/course-007/INTEGRATED-LAB-LEARNER-PACKET.md',
  'docs/learning-hub/tech1/course-007/INTEGRATED-EVIDENCE-DOSSIER.md',
  'docs/learning-hub/tech1/course-007/REMEDIATION-RETEST-MATRIX.md',
  'docs/learning-hub/tech1/course-007/assessor/CAPSTONE-ASSESSOR-GUIDE.md',
  'docs/learning-hub/tech1/course-007/assessor/CAPSTONE-CALIBRATION-VALIDATION-PACKET.md',
  'docs/learning-hub/tech1/course-007/CANDIDATE-EVIDENCE-RETENTION-PRIVACY-DRAFT.md',
  'docs/learning-hub/tech1/course-007/accessibility/COURSE7-INTEGRATED-LAB-ACCESSIBILITY-UX-REVIEW.md',
  'docs/learning-hub/tech1/course-007/assets/visuals/VISUAL-REFERENCE-MANIFEST.md',
  'docs/learning-hub/tech1/course-007/FINAL-HUMAN-REVIEW-WORKLIST.md',
  'docs/learning-hub/tech1/course-007/COURSE-PACKAGE-MANIFEST.md'
];
for (const file of packageFiles) assert.ok(exists(file), `missing Course 7 integrated package artifact ${file}`);

const capstoneText = readText(plan.capstone.document);
for (const phrase of [
  'CF-SAFETY-001',
  'CF-IDENTITY-001',
  'CF-INTEGRITY-001',
  'CF-AUTHORITY-001',
  'CF-HOLD-001',
  'development target',
  'formal standard setting'
]) assert.ok(capstoneText.includes(phrase), `capstone governance text must include ${phrase}`);

const program = read('content/credential-programs/CREDPROG-CULT-TECH-I-001.json');
assert.equal(program.status, 'draft');
assert.equal(program.assessmentModel?.criticalFailureRuleSource, 'registry/technician-i-integrated-lab-plan.json');
assert.deepEqual(program.assessmentModel?.criticalFailureRuleIds, plan.criticalFailureRules.map((rule) => rule.id));
assert.equal(program.assessmentModel?.criticalFailurePolicyStatus, 'development');
assert.equal(program.assessmentModel?.standardSettingStatus, 'provisional');

const credentialAssessment = read('content/assessments/ASSESS-CRED-TECH1-001.json');
assert.equal(credentialAssessment.status, 'draft');
assert.equal(credentialAssessment.purpose, 'credential');
assert.deepEqual(credentialAssessment.items, [], 'public credential blueprint must contain no operational secure items');
assert.equal(credentialAssessment.extensions?.operationalUseAuthorized, false);
assert.equal(credentialAssessment.extensions?.publicRepositoryItemsMayBeUsedForOperationalCredentialForms, false);
assert.equal(credentialAssessment.extensions?.secureOperationalItemBankRequired, true);
assert.equal(credentialAssessment.extensions?.secureAssessmentStoreRequired, true);
assert.equal(credentialAssessment.extensions?.equivalentSecureFormsRequired, true);
assert.equal(credentialAssessment.extensions?.releaseApprovalRequired, true);

console.log('Technician I Course 007 integrated lab passed: four integrated lessons, six objectives with 2-item readiness coverage each, all six 100-point practicals, 200-point capstone, five controlled critical failures, package/evidence/privacy/accessibility controls and secure-form boundaries resolve while credential issuance remains fail-closed.');
