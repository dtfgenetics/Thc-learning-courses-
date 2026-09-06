import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sql = fs.readFileSync(path.join(process.cwd(), 'database/rls-policies.sql'), 'utf8');
const protectedTables = [
  'learners',
  'enrollments',
  'lesson_progress',
  'assessment_attempts',
  'assessment_attempt_items',
  'learner_competencies',
  'performance_assessment_results',
  'learner_portfolio_artifacts'
];

for (const table of protectedTables) {
  assert.match(sql, new RegExp(`alter table ${table} enable row level security;`, 'i'));
  assert.match(sql, new RegExp(`alter table ${table} force row level security;`, 'i'));
}

assert.match(sql, /current_setting\('thc\.learner_id', true\)/i);
assert.match(sql, /create policy learner_self_read/i);
assert.match(sql, /create policy assessment_attempt_item_self_read/i);
assert.match(sql, /create policy performance_assessment_result_self_read/i);
assert.match(sql, /create policy portfolio_artifact_self_read/i);
assert.match(sql, /exists\s*\(\s*select 1[\s\S]*assessment_attempts/i);
assert.equal(/create policy[\s\S]{0,100}for (insert|update|delete)/i.test(sql), false, 'candidate learner policies must remain read-only');

console.log('RLS policy contract coverage tests passed');
