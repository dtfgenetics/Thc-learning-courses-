import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const checker = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'check-release-readiness.mjs');

function writeJson(root, rel, data) {
  const target = path.join(root, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`);
}

function run(root, args = [], env = {}) {
  return spawnSync(process.execPath, [checker, ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8'
  });
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'thc-release-scope-'));
for (const dir of ['content/courses','content/modules','content/lessons','content/assessments','content/questions','content/credentials']) {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
}

writeJson(root, 'content/courses/COURSE-TEST-001.json', {
  id: 'COURSE-TEST-001', title: 'Test Course', version: '1.0.0', status: 'draft', credentialBearing: true,
  modules: ['MOD-TEST-001'], competencies: ['COMP-TEST-001'], finalAssessment: 'ASSESS-TEST-FINAL-001'
});
writeJson(root, 'content/modules/MOD-TEST-001.json', {
  id: 'MOD-TEST-001', title: 'Test Module', version: '1.0.0', status: 'draft',
  lessons: ['LESSON-TEST-001'], competencies: ['COMP-TEST-001'], assessment: 'ASSESS-TEST-MODULE-001'
});
writeJson(root, 'content/lessons/LESSON-TEST-001.json', {
  id: 'LESSON-TEST-001', title: 'Test Lesson', version: '1.0.0', status: 'draft'
});
writeJson(root, 'content/assessments/ASSESS-TEST-MODULE-001.json', {
  id: 'ASSESS-TEST-MODULE-001', title: 'Module Check', version: '1.0.0', status: 'draft', purpose: 'formative',
  competencies: ['COMP-TEST-001'], objectives: ['LO-TEST-001'], items: ['ITEM-TEST-MODULE-001'], passingScorePercent: 80, feedbackMode: 'delayed'
});
writeJson(root, 'content/assessments/ASSESS-TEST-FINAL-001.json', {
  id: 'ASSESS-TEST-FINAL-001', title: 'Final Check', version: '1.0.0', status: 'draft', purpose: 'credential',
  competencies: ['COMP-TEST-001'], objectives: ['LO-TEST-001'], items: ['ITEM-TEST-FINAL-001'], passingScorePercent: 80, feedbackMode: 'delayed'
});
for (const [id, purpose] of [['ITEM-TEST-MODULE-001','formative'], ['ITEM-TEST-FINAL-001','credential']]) {
  writeJson(root, `content/questions/${id}.json`, {
    id, version: 1, status: 'draft', purpose, competency: 'COMP-TEST-001', objective: 'LO-TEST-001',
    bloomLevel: 'apply', difficulty: 'moderate', type: 'multiple-choice', stem: 'Test?', choices: ['A','B','C','D'], correct: 0,
    rationale: 'Fixture item.', references: ['REF-TEST-001']
  });
}
writeJson(root, 'content/credentials/CRED-TEST-001.json', {
  id: 'CRED-TEST-001', title: 'Test Credential', version: '1.0.0', status: 'draft', course: 'COURSE-TEST-001',
  eligibility: { requiredAssessments: ['ASSESS-TEST-FINAL-001'], minimumPassingScorePercent: 80 }
});

const missingScope = run(root);
assert.notEqual(missingScope.status, 0);
assert.match(missingScope.stderr, /release scope is missing/);

const success = run(root, ['--course=COURSE-TEST-001']);
assert.equal(success.status, 0, `${success.stdout}\n${success.stderr}`);
assert.match(success.stdout, /Certification release integrity passed for COURSE-TEST-001/);

const credential = JSON.parse(fs.readFileSync(path.join(root, 'content/credentials/CRED-TEST-001.json'), 'utf8'));
credential.eligibility.minimumPassingScorePercent = 75;
writeJson(root, 'content/credentials/CRED-TEST-001.json', credential);
const mismatch = run(root, ['--course=COURSE-TEST-001']);
assert.notEqual(mismatch.status, 0);
assert.match(mismatch.stderr, /eligibility passing score must match/);

const unknown = run(root, ['--course=COURSE-MISSING-001']);
assert.notEqual(unknown.status, 0);
assert.match(unknown.stderr, /does not exist/);

fs.rmSync(root, { recursive: true, force: true });
console.log('Release scope regression tests passed without status, review, pilot, or active-pool restrictions.');
