import assert from 'node:assert/strict';
import fs from 'node:fs';

const practical = JSON.parse(fs.readFileSync('content/performance-assessments/PRACTICAL-LH-TECH1-001-WORKFLOW.json', 'utf8'));
const guide = fs.readFileSync('docs/learning-hub/tech1/course-001/practical/ASSESSOR-GUIDE.md', 'utf8');
const rubric = practical.extensions?.gradingRubric;

assert.ok(rubric?.version, 'canonical practical rubric version is required');
assert.match(guide, new RegExp(rubric.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'assessor guide must name the canonical rubric version');

for (const level of rubric.levels ?? []) {
  assert.match(guide, new RegExp(`\\b${level.label}\\b`, 'i'), `assessor guide must include ${level.label} performance level`);
  assert.match(guide, new RegExp(`${Number(level.minimumPercent)}%`), `assessor guide must include ${level.label} threshold`);
}

for (const domain of practical.scoring?.domains ?? []) {
  assert.match(guide, new RegExp(domain.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `assessor guide must include domain ${domain.name}`);
  const minimum = rubric.domainMinimumPercents?.[domain.name];
  assert.ok(Number.isFinite(Number(minimum)), `canonical minimum is required for ${domain.name}`);
  assert.match(guide, new RegExp(`minimum\\s+${Number(minimum)}%`, 'i'), `assessor guide must include ${domain.name} minimum`);
  for (const levelId of ['strong', 'competent', 'developing', 'insufficient']) {
    assert.ok(typeof rubric.domainAnchors?.[domain.name]?.[levelId] === 'string' && rubric.domainAnchors[domain.name][levelId].trim(), `${domain.name} must have a ${levelId} canonical anchor`);
  }
}

for (const output of practical.evidenceOutputs ?? []) {
  assert.match(guide, new RegExp(output.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `assessor guide must include evidence output ${output}`);
}

assert.match(guide, /at least 80% overall/i, 'assessor guide must include the overall passing threshold');
assert.match(guide, /every configured domain minimum met/i, 'assessor guide must enforce domain floors');
assert.match(guide, /every required output verified/i, 'assessor guide must enforce evidence verification for pass');
assert.match(guide, /critical-error finding.*evaluator documentation/is, 'assessor guide must require documented critical-error context');
assert.equal(/\*\*Partial performance:\*\*/i.test(guide), false, 'retired Partial performance rubric must not return');
assert.equal(/\*\*Weak performance:\*\*/i.test(guide), false, 'retired Weak performance rubric must not return');
assert.equal(/pilot threshold/i.test(guide), false, 'obsolete pilot-threshold wording must not return');

console.log(`Course 1 assessor guide matches canonical practical rubric ${rubric.version}: ${rubric.levels.length} levels, ${practical.scoring.domains.length} domains, and ${practical.evidenceOutputs.length} required evidence outputs.`);
