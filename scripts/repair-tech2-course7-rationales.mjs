import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'content/questions');
const files = fs.readdirSync(dir).filter((name) => /^ITEM-LH-TECH2-007-(?:M01-)?\d{3}\.json$/.test(name));

const explanationByObjective = {
  'LO-LH-TECH2-007-01': 'The correct response preserves source-to-downstream genealogy and treats identity or location differences as evidence to reconcile rather than history to overwrite.',
  'LO-LH-TECH2-007-02': 'The correct response preserves original evidence and routes discrepancies through an authorized, attributable correction process instead of fabricating or silently changing records.',
  'LO-LH-TECH2-007-03': 'The result follows the stated KPI definition by using the supplied numerator, denominator, eligible population, units, and time window without changing the denominator after seeing the result.',
  'LO-LH-TECH2-007-04': 'The interpretation requires repeated comparable observations with stable definitions and operational context; a single cycle or changed denominator cannot establish a defensible trend.',
  'LO-LH-TECH2-007-05': 'Technician II peer support is anchored to the current controlled instruction and may clarify or demonstrate approved work, but it does not create formal supervisory or approval authority.',
  'LO-LH-TECH2-007-06': 'A decision-ready handoff preserves planned-versus-actual history and identifies priority, evidence, dependencies, unresolved decisions, timing, and the authorized next owner.'
};

let changed = 0;
for (const name of files) {
  const full = path.join(dir, name);
  const item = JSON.parse(fs.readFileSync(full, 'utf8'));
  if (String(item.rationale ?? '').trim().length >= 30) continue;
  const explanation = explanationByObjective[item.objective];
  if (!explanation) throw new Error(`No rationale repair rule for ${item.id} objective ${item.objective}`);
  item.rationale = `${item.choices[item.correct]} ${explanation}`;
  fs.writeFileSync(full, `${JSON.stringify(item, null, 2)}\n`);
  changed += 1;
}
console.log(`Expanded ${changed} Course 207 rationale(s) below the quality floor.`);
