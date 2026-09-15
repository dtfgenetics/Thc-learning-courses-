import fs from 'node:fs';

const assessmentPath = 'content/assessments/ASSESS-LH-TECH2-001-FINAL.json';
const assessment = JSON.parse(fs.readFileSync(assessmentPath, 'utf8'));
const counts = new Map();
for (const id of assessment.items) {
  const item = JSON.parse(fs.readFileSync(`content/questions/${id}.json`, 'utf8'));
  counts.set(item.competency, (counts.get(item.competency) ?? 0) + 1);
}
for (const row of assessment.blueprint) row.items = counts.get(row.competency) ?? 0;
const total = assessment.blueprint.reduce((sum, row) => sum + row.items, 0);
if (total !== assessment.items.length) throw new Error(`Blueprint total ${total} does not match assessment item count ${assessment.items.length}`);
if (assessment.blueprint.some((row) => row.items < 1)) throw new Error('Every Course 201 blueprint competency must have at least one authored summative item.');
fs.writeFileSync(assessmentPath, `${JSON.stringify(assessment, null, 2)}\n`);
console.log('Normalized Course 201 blueprint counts:', Object.fromEntries(counts));
