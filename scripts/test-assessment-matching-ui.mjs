import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const jsPath = 'apps/web/public/course-assessment.js';
const cssPath = 'apps/web/public/course-assessment.css';
const source = fs.readFileSync(jsPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const syntax = spawnSync(process.execPath, ['--check', jsPath], { encoding:'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);

for (const marker of [
  "type === 'matching'",
  "select[data-match-prompt]",
  "function matchingControl",
  "Choose one match for each prompt.",
  "fieldset.append(matchingControl(item, fieldset, panel))"
]) assert.ok(source.includes(marker), `matching learner UI missing: ${marker}`);

assert.ok(source.includes(".course-assessment-form select"), 'assessment timeout lock must disable matching selects');
assert.ok(source.includes("querySelector('input, select')"), 'question navigator must focus matching selects');
assert.ok(css.includes('.course-assessment-matching'), 'matching layout styles missing');
assert.ok(css.includes('.course-assessment-match-select:focus-visible'), 'matching controls need visible keyboard focus');
assert.ok(css.includes('@media (max-width: 620px)'), 'matching controls need mobile layout');

console.log('Matching learner UI contract tests passed.');
