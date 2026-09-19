import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const registry=JSON.parse(fs.readFileSync(path.join(root,'registry/academy-course-pilot-protocols.json'),'utf8'));
assert.equal(registry.courses.length,14,'expected six Technician I and eight Technician II pilot protocols');
assert.equal(registry.defaultKnowledgeItemPlanningTarget.usableResponsesPerItem,50);
assert.equal(registry.defaultKnowledgeItemPlanningTarget.preliminaryMinimumPerItem,30);

const ids=new Set();
for(const entry of registry.courses){
  assert.ok(!ids.has(entry.courseId),`duplicate pilot protocol entry ${entry.courseId}`);
  ids.add(entry.courseId);
  assert.equal(entry.state,'protocol-ready-pilot-not-started',`${entry.courseId}: protocol presence must not imply pilot completion`);
  const file=path.join(root,entry.protocol);
  assert.ok(fs.existsSync(file),`${entry.courseId}: pilot protocol missing`);
  const md=fs.readFileSync(file,'utf8');
  for(const required of [
    '# Pilot Protocol',
    'Canonical material freeze',
    'Entry gates',
    'Academic item pilot',
    'Course-level learner evidence',
    'Performance evidence',
    'Fairness and accessibility evidence',
    'Stop / invalidate criteria',
    'Data and privacy boundary',
    'Analysis package required after collection',
    'Decision boundary',
    'Pilot record'
  ]) assert.ok(md.includes(required),`${entry.courseId}: missing pilot section ${required}`);
  assert.match(md,/50 usable responses per scored knowledge item/i,`${entry.courseId}: missing default item target`);
  assert.match(md,/30 usable responses per item/i,`${entry.courseId}: missing preliminary item minimum`);
  assert.match(md,/Do not store learner PII/i,`${entry.courseId}: public-repo privacy boundary missing`);
  assert.match(md,/does not by itself[\s\S]*validate a professional credential/i,`${entry.courseId}: credential boundary missing`);
  assert.match(md,/Human approval to advance:\s*\*\*pending\*\*/i,`${entry.courseId}: pilot approval must remain pending`);
  assert.doesNotMatch(md,/Human approval to advance:\s*\*\*(?:approved|complete|passed)\*\*/i,`${entry.courseId}: fabricated pilot approval`);
}
console.log('Academy course pilot protocols: PASS (14 controlled protocols; pilot evidence remains pending).');
