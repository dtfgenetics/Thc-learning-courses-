import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { activationEvidenceEvaluation, loadPilotEvidencePolicy } from './pilot-evidence-quality.mjs';

const root = process.cwd();
function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort().map((n) => JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')));
}
const items = readDirJson('content/questions').filter((x) => ['summative','credential'].includes(x.purpose));
const pilot = readDirJson('content/pilot-evidence');
const reviews = readDirJson('content/reviews');
const policy = loadPilotEvidencePolicy(root);
const competencies = [...new Set(items.map((x) => x.competency))].sort();
function itemPilotRecords(item) { return pilot.filter((p) => p.itemId === item.id && String(p.itemVersion) === String(item.version)); }
function completePilot(item) { return itemPilotRecords(item).some((p) => p.status === 'complete'); }
function pilotRegistered(item) { return itemPilotRecords(item).some((p) => p.status !== 'invalidated'); }
function activationReadyPilot(item) { return itemPilotRecords(item).some((record) => activationEvidenceEvaluation(record, item, policy).ready); }
function approvedReview(item) { return reviews.some((r) => r.objectId === item.id && String(r.objectVersion) === String(item.version) && r.reviewType === 'assessment' && r.status === 'approved'); }
function reviewFlagged(item) { return itemPilotRecords(item).some((record) => record.status === 'complete' && activationEvidenceEvaluation(record, item, policy).reviewFlags.length > 0); }
const rows = competencies.map((competency) => {
  const pool = items.filter((x) => x.competency === competency);
  return {
    competency,
    items: pool.length,
    draft: pool.filter((x) => x.status === 'draft').length,
    inReview: pool.filter((x) => ['technical-review','editorial-review'].includes(x.status)).length,
    pilot: pool.filter((x) => x.status === 'pilot').length,
    active: pool.filter((x) => x.status === 'active').length,
    pilotRecords: pool.filter(pilotRegistered).length,
    completePilotEvidence: pool.filter(completePilot).length,
    policyQualifiedPilotEvidence: pool.filter(activationReadyPilot).length,
    pilotEvidenceWithReviewFlags: pool.filter(reviewFlagged).length,
    approvedAssessmentReview: pool.filter(approvedReview).length,
    activationEvidenceComplete: pool.filter((x) => activationReadyPilot(x) && approvedReview(x)).length
  };
});

let foundationsCandidates = null;
try {
  foundationsCandidates = JSON.parse(execFileSync(process.execPath, [path.join(root, 'scripts/build-foundations-pilot-candidates.mjs'), '--check'], {cwd: root, encoding: 'utf8'}));
} catch (error) {
  if (error.stdout) process.stdout.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw new Error('Foundations pilot candidate readiness failed.');
}

const output = {
  policy: {
    version: policy.version,
    minimumResponsesPerItem: policy.activation.minimumResponsesPerItem,
    minimumDiscrimination: policy.activation.minimumDiscrimination,
    targetResponsesPerItem: policy.reviewSignals.targetResponsesPerItem
  },
  summary: {
    items: items.length,
    pilotRecords: pilot.length,
    itemsWithPilotRecord: items.filter(pilotRegistered).length,
    itemsWithCompletePilotEvidence: items.filter(completePilot).length,
    itemsWithPolicyQualifiedPilotEvidence: items.filter(activationReadyPilot).length,
    itemsWithPilotReviewFlags: items.filter(reviewFlagged).length,
    itemsWithApprovedAssessmentReview: items.filter(approvedReview).length,
    itemsWithActivationEvidenceComplete: items.filter((x) => activationReadyPilot(x) && approvedReview(x)).length,
    activeItems: items.filter((x) => x.status === 'active').length,
    foundationsPilotCandidatePoolsReady: foundationsCandidates.summary.candidatePoolsReady,
    foundationsPilotCandidateCompetencies: foundationsCandidates.summary.competencies,
    foundationsPilotCandidateItems: foundationsCandidates.summary.totalSelectedCandidates,
    foundationsPilotCandidateReady: foundationsCandidates.summary.allCompetenciesPilotCandidateReady
  },
  foundationsPilotCandidates: foundationsCandidates,
  competencies: rows
};
console.log(JSON.stringify(output, null, 2));
