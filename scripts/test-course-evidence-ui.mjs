import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const portal = fs.readFileSync('apps/web/public/portal.js', 'utf8');
const css = fs.readFileSync('apps/web/public/portal.css', 'utf8');
const app = fs.readFileSync('apps/web/public/app.js', 'utf8');

const syntax = spawnSync(process.execPath, ['--check', 'apps/web/public/portal.js'], { encoding: 'utf8' });
assert.equal(syntax.status, 0, `portal.js must parse: ${syntax.stderr || syntax.stdout}`);

assert.match(portal, /COURSE1_ID\s*=\s*'COURSE-LH-TECH1-001'/, 'Course 1 evidence UI must be explicitly scoped to Course 1');
assert.match(portal, /\/api\/v1\/me\/courses\/\$\{COURSE1_ID\}\/evidence/, 'Course 1 card must read the authenticated course-evidence endpoint');
assert.match(portal, /credentials:\s*'same-origin'/, 'Course 1 evidence request must use same-origin authentication context');
assert.match(portal, /response\.status === 401 \|\| response\.status === 403/, 'Course 1 evidence UI must handle authentication-required state');
assert.match(portal, /Sign in to view your official Course 1 final-assessment and practical status/, 'unauthenticated learners need a clear official-evidence sign-in message');
assert.match(portal, /Course final/, 'course card must label the written final explicitly');
assert.match(portal, /Course practical/, 'course card must label the course practical explicitly');
assert.match(portal, /Not evaluated/, 'missing practical evidence must be described without implying failure');
assert.match(portal, /Not attempted/, 'missing written evidence must be described without implying failure');
assert.match(portal, /Not passed/, 'failed written/practical outcomes must have a clear learner-facing label');
assert.match(portal, /In progress/, 'active written/practical outcomes must have a clear learner-facing label');
assert.match(portal, /Passed/, 'passed written/practical outcomes must have a clear learner-facing label');
assert.match(portal, /Voided/, 'voided practical records must be represented explicitly');
assert.match(portal, /Device lesson checkmarks are separate from official evidence/, 'official evidence must be distinguished from device lesson progress');
assert.match(portal, /completionModel/, 'course completion-model guidance must be rendered without inventing a new state');
assert.match(portal, /course1EvidencePromise/, 'Course 1 evidence request must be cached across catalog rerenders');
assert.match(portal, /querySelector\('\.course-evidence-panel, \.course-evidence-loading'\)/, 'catalog observer must guard against duplicate evidence injection');

for (const forbidden of [
  /courseComplete/i,
  /credentialEligible/i,
  /credentialIssued/i,
  /overallCourseProgress/i,
  /response_json/,
  /evidence_json/,
  /answerKey/,
  /scoringKey/
]) assert.equal(forbidden.test(portal), false, `learner UI must not invent or expose ${forbidden}`);

assert.match(app, /% lesson progress/, 'lesson percentage must remain explicitly labeled as lesson progress');
assert.match(css, /\.course-evidence-panel\s*\{/, 'course evidence panel needs dedicated visual treatment');
assert.match(css, /\.course-evidence-status\.status-passed/, 'passed evidence status needs styling');
assert.match(css, /\.course-evidence-status\.status-in-progress/, 'in-progress evidence status needs styling');
assert.match(css, /\.course-evidence-status\.status-not-passed/, 'not-passed evidence status needs styling');
assert.match(css, /\.course-evidence-row\s*\{[^}]*display:\s*flex/is, 'course evidence rows must use compact structured layout');
assert.match(css, /@media\s*\(max-width:\s*620px\)[\s\S]*\.course-evidence-row\s*\{[^}]*flex-direction:\s*column/is, 'course evidence rows must stack on narrow screens');

console.log('Course 1 official evidence UI contract passed: lesson progress, final assessment, and course practical remain separate and safely rendered.');
