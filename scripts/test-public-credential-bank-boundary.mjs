import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const readDirJson = (rel) => fs.readdirSync(path.join(root, rel))
  .filter((name) => name.endsWith('.json'))
  .map((name) => ({ name, data: readJson(path.join(rel, name)) }));

const questions = readDirJson('content/questions');
const assessments = readDirJson('content/assessments');
const credentialItems = questions.filter(({ data }) => data.purpose === 'credential');
const credentialAssessments = assessments.filter(({ data }) => data.purpose === 'credential');

assert.ok(credentialItems.length > 0, 'expected public development credential-item blueprints to be present');
assert.ok(credentialAssessments.length > 0, 'expected at least one public development credential assessment blueprint');

for (const { name, data } of credentialItems) {
  assert.notEqual(data.status, 'active', `${name}: public credential-purpose item must never be status=active`);
  assert.ok(Object.hasOwn(data, 'correct'), `${name}: public development item is expected to contain an authored key; this is why it cannot be operational credential material`);
}
for (const { name, data } of credentialAssessments) {
  assert.notEqual(data.status, 'active', `${name}: public credential assessment blueprint must never be status=active`);
}

const probe = spawnSync(process.execPath, [
  'scripts/generate-exam-form.mjs',
  '--assessment=ASSESS-CULT-TECH-II-CREDENTIAL-001',
  '--seed=public-boundary-probe'
], { encoding: 'utf8' });

assert.notEqual(probe.status, 0, 'production-mode credential form generation must fail closed in the public repository');
assert.match(`${probe.stderr}\n${probe.stdout}`, /production credential form generation is prohibited from this public repository/i);

const generator = fs.readFileSync(path.join(root, 'scripts/generate-exam-form.mjs'), 'utf8');
assert.match(generator, /assessment\.purpose === 'credential' && !allowDraft/);
assert.match(generator, /approved private assessment store\/delivery service/);

console.log(`Public credential-bank boundary passed: ${credentialItems.length} credential-purpose item blueprints and ${credentialAssessments.length} credential assessment blueprint(s) remain non-active, and production form generation fails closed.`);
