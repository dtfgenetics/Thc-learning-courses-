import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort().map((n) => JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')));
}
const items = readDirJson('content/questions').filter((x) => ['summative','credential'].includes(x.purpose));
const pilot = readDirJson('content/pilot-evidence');
const reviews = readDirJson('content/reviews');
const competencies = [...new Set(items.map((x) => x.competency))].sort();
function completePilot(item) { return pilot.some((p) => p.itemId === item.id && String(p.itemVersion) === String(item.version) && p.status === 'complete'); }
function pilotRegistered(item) { return pilot.some((p) => p.itemId === item.id && String(p.itemVersion) === String(item.version) && p.status !== 'invalidated'); }
function approvedReview(item) { return reviews.some((r) => r.objectId === item.id && String(r.objectVersion) === String(item.version) && r.reviewType === 'assessment' && r.status === 'approved'); }
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
    approvedAssessmentReview: pool.filter(approvedReview).length,
    activationEvidenceComplete: pool.filter((x) => completePilot(x) && approvedReview(x)).length
  };
});
const output = {
  summary: {
    items: items.length,
    pilotRecords: pilot.length,
    itemsWithPilotRecord: items.filter(pilotRegistered).length,
    itemsWithCompletePilotEvidence: items.filter(completePilot).length,
    itemsWithApprovedAssessmentReview: items.filter(approvedReview).length,
    itemsWithActivationEvidenceComplete: items.filter((x) => completePilot(x) && approvedReview(x)).length,
    activeItems: items.filter((x) => x.status === 'active').length
  },
  competencies: rows
};
console.log(JSON.stringify(output, null, 2));
