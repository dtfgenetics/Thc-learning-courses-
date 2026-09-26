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
assert.match(portal, /\/api\/v1\/me\/credentials\/CRED-CULT-TECH-II-001\/transcript/, 'credential transcript UI must use the dedicated transcript endpoint');
assert.match(portal, /const transcriptData = await transcriptResponse\.json\(\)/, 'credential transcript UI must keep transcript evidence separate from progress evidence');
assert.match(portal, /privacy-bounded evidence view/, 'credential transcript must explain its privacy-bounded projection');
assert.match(portal, /transcriptData\.competencies/, 'competency transcript rows must come from the transcript projection');
assert.match(portal, /transcriptData\.performanceAssessments/, 'practical transcript rows must come from the transcript projection');
assert.match(portal, /transcriptData\.portfolioArtifacts/, 'portfolio transcript rows must come from the transcript projection');
assert.match(portal, /My Learning Dashboard/, 'learner portal should expose one consolidated dashboard');
assert.match(portal, /\/api\/v1\/me\/enrollments/, 'dashboard should read authoritative enrollment state');
assert.match(portal, /\/api\/v1\/me\/courses\/\$\{encodeURIComponent\(course\.id\)\}\/completion/, 'dashboard should read authoritative completion for each enrolled credential-path course');
assert.match(portal, /Academic course status/, 'dashboard should separate academic course status');
assert.match(portal, /Professional credential progress/, 'dashboard should separately label professional credential progress');
assert.match(portal, /portal-course-record-list/, 'dashboard should render a list of enrolled academic course records');
assert.match(portal, /No enrolled credential-path academic course is recorded yet/, 'dashboard must handle an empty academic course record set');
assert.match(portal, /Academic practical/, 'dashboard must distinguish academic practical evidence from professional practical requirements');
assert.match(portal, /Integrated performance lab: this course intentionally has no ordinary final/, 'dashboard must represent Technician I Course 7 / Technician II Course 8 without inventing conventional finals');
assert.match(portal, /does not by itself issue or authorize a professional credential/, 'academic completion must not imply credential issuance');
assert.match(portal, /CREDPROG-CULT-TECH-I-001/, 'learner dashboard must support Technician I certification applications');
assert.match(portal, /CREDPROG-CULT-TECH-II-001/, 'learner dashboard must support Technician II certification applications');
assert.match(portal, /Create \${program\.title} application/, 'learner dashboard must create program-specific application records rather than a single hard-coded application');


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
