import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const check = process.argv.includes('--check');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(rel, name)));
}

const registry = readJson('registry/cultivation-foundations.json');
const policy = readJson('registry/foundations-assessment-coverage.json');
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');

const curriculumObjectives = (registry.domains ?? []).flatMap((domain) =>
  (domain.objectives ?? []).map((objective) => ({ domain: domain.id, objective }))
);
const curriculumSet = new Set(curriculumObjectives.map((row) => row.objective));
const policySet = new Set((policy.objectives ?? []).map((row) => row.objective));

const duplicatePolicyObjectives = (policy.objectives ?? [])
  .map((row) => row.objective)
  .filter((id, index, all) => all.indexOf(id) !== index);
const missingFromPolicy = [...curriculumSet].filter((id) => !policySet.has(id));
const unknownInPolicy = [...policySet].filter((id) => !curriculumSet.has(id));

function hasApprovedAssessmentReview(item) {
  return reviews.some((review) =>
    review.objectId === item.id &&
    String(review.objectVersion) === String(item.version) &&
    review.reviewType === 'assessment' &&
    review.status === 'approved'
  );
}

const rows = (policy.objectives ?? []).map((policyRow) => {
  const bank = questions.filter((item) =>
    item.objective === policyRow.objective &&
    ['summative', 'credential'].includes(item.purpose)
  );
  const reviewed = bank.filter(hasApprovedAssessmentReview);
  const active = bank.filter((item) => item.status === 'active');
  const pilot = bank.filter((item) => item.status === 'pilot');
  const minimum = policy.policy?.minimumSummativeItemsPerObjective ?? 1;
  const curriculumDomain = curriculumObjectives.find((row) => row.objective === policyRow.objective)?.domain ?? null;
  return {
    domain: policyRow.domain,
    curriculumDomain,
    objective: policyRow.objective,
    role: policyRow.role,
    minimumBankItems: minimum,
    targetBankItems: policyRow.targetBankItems,
    bankItems: bank.length,
    humanReviewedBankItems: reviewed.length,
    pilotItems: pilot.length,
    activeItems: active.length,
    minimumCoverageReady: bank.length >= minimum,
    reviewCoverageReady: bank.length >= minimum && reviewed.length >= minimum,
    targetDepthReady: bank.length >= policyRow.targetBankItems,
    domainMatchesRegistry: curriculumDomain === policyRow.domain
  };
});

const summary = {
  curriculumObjectives: curriculumSet.size,
  policyObjectives: policySet.size,
  duplicatePolicyObjectives: [...new Set(duplicatePolicyObjectives)],
  missingFromPolicy,
  unknownInPolicy,
  minimumCoverageReady: rows.filter((row) => row.minimumCoverageReady).length,
  reviewCoverageReady: rows.filter((row) => row.reviewCoverageReady).length,
  targetDepthReady: rows.filter((row) => row.targetDepthReady).length,
  objectivesWithPilotItems: rows.filter((row) => row.pilotItems > 0).length,
  objectivesWithActiveItems: rows.filter((row) => row.activeItems > 0).length,
  domainMismatches: rows.filter((row) => !row.domainMatchesRegistry).map((row) => row.objective),
  totalSummativeCredentialBankItems: rows.reduce((sum, row) => sum + row.bankItems, 0),
  totalHumanReviewedBankItems: rows.reduce((sum, row) => sum + row.humanReviewedBankItems, 0),
  policyComplete: missingFromPolicy.length === 0 && unknownInPolicy.length === 0 && duplicatePolicyObjectives.length === 0,
  minimumCoverageComplete: rows.length > 0 && rows.every((row) => row.minimumCoverageReady),
  reviewCoverageComplete: rows.length > 0 && rows.every((row) => row.reviewCoverageReady)
};

console.log(JSON.stringify({ summary, objectives: rows }, null, 2));

if (check) {
  const errors = [];
  if (policy.course !== registry.course) errors.push(`Policy course ${policy.course} does not match registry course ${registry.course}.`);
  if (policy.assessment !== registry.summativeAssessment) errors.push(`Policy assessment ${policy.assessment} does not match registry assessment ${registry.summativeAssessment}.`);
  if (!summary.policyComplete) errors.push('All 36 curriculum objectives must appear exactly once in the coverage policy.');
  if (summary.domainMismatches.length) errors.push(`Objective domain mismatches: ${summary.domainMismatches.join(', ')}`);
  if (!summary.minimumCoverageComplete) {
    const deficient = rows.filter((row) => !row.minimumCoverageReady).map((row) => `${row.objective} ${row.bankItems}/${row.minimumBankItems}`);
    errors.push(`Objectives without minimum summative coverage: ${deficient.join(', ')}`);
  }
  if (!summary.reviewCoverageComplete) {
    const deficient = rows.filter((row) => !row.reviewCoverageReady).map((row) => `${row.objective} ${row.humanReviewedBankItems}/${row.minimumBankItems}`);
    errors.push(`Objectives without minimum human-reviewed summative coverage: ${deficient.join(', ')}`);
  }
  if (errors.length) {
    for (const error of errors) console.error(`ERROR ${error}`);
    process.exit(1);
  }
}
