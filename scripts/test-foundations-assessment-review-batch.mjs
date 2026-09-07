import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const script = path.join(root, 'scripts/build-foundations-assessment-review-batch.mjs');
const result = spawnSync(process.execPath, [script, '--check'], {cwd: root, encoding: 'utf8'});
if (result.status !== 0) {
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  throw new Error('Foundations assessment review batch structural check failed.');
}
const output = JSON.parse(result.stdout);
if (output.summary.course !== 'COURSE-CULT-FOUNDATIONS-001') throw new Error('Unexpected Foundations course id.');
if (!output.summary.readyForHumanReview) throw new Error('Pending review batch is not structurally ready for human review.');
if (output.summary.structuralErrors !== 0) throw new Error('Pending review batch reports structural errors.');
for (const objectives of Object.values(output.grouped ?? {})) {
  for (const packets of Object.values(objectives ?? {})) {
    for (const packet of packets) {
      if (!packet.item?.id || !packet.item?.objective || !packet.item?.competency) throw new Error('Review packet is missing traceability fields.');
      if (!Array.isArray(packet.evidence) || packet.evidence.length === 0) throw new Error(`${packet.item.id} is missing review evidence.`);
      if (!Array.isArray(packet.checklist) || packet.checklist.length < 5) throw new Error(`${packet.item.id} is missing the assessment-review checklist.`);
    }
  }
}
console.log(`Foundations assessment review batch test passed for ${output.summary.pendingAssessmentReviewItems} pending item(s).`);
