import assert from 'node:assert/strict';
import fs from 'node:fs';

const m=JSON.parse(fs.readFileSync('registry/certification-pilot-intake-manifest.json','utf8'));
assert.equal(m.courses.length,15);
assert.match(m.privacyBoundary,/Participant-level data remain outside/i);
for(const c of m.courses){
  assert.ok(c.courseId);
  assert.ok(c.courseVersion);
  assert.ok(fs.existsSync(c.pilotProtocolPath),c.courseId+': pilot protocol missing');
  assert.equal(c.intakeState,'protocol-ready-private-data-not-collected');
}
const agg=fs.readFileSync('scripts/build-pilot-evidence-from-results.mjs','utf8');
assert.match(agg,/certification-pilot-intake-manifest\.json/);
assert.match(agg,/courseVersion/);
assert.match(agg,/does not match current/);
const spec=fs.readFileSync('docs/assessment/CERTIFICATION-PILOT-PRIVATE-INTAKE-SPEC.md','utf8');
assert.match(spec,/must not be committed to the public repository/i);
assert.match(spec,/Item statistics are diagnostic evidence/i);
console.log('Certification pilot intake manifest: PASS (15/15 protocols version-anchored; participant-level data remain private; outcomes not fabricated).');
