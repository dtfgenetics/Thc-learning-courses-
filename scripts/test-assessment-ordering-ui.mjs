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
  "type === 'ordering'",
  "select[data-order-position]",
  "function orderingControl",
  "Rank every option once. Duplicate selections are not saved.",
  "fieldset.append(orderingControl(item, fieldset, panel))"
]) assert.ok(source.includes(marker), `ordering learner UI missing: ${marker}`);

assert.ok(source.includes("new Set(values).size === values.length"), 'ordering response must reject duplicate ranks before save');
assert.ok(css.includes('.course-assessment-ordering'), 'ordering layout styles missing');
assert.ok(css.includes('.course-assessment-order-select:focus-visible'), 'ordering controls need visible keyboard focus');
assert.ok(css.includes('@media (max-width: 560px)'), 'ordering controls need mobile layout');

console.log('Ordering learner UI contract tests passed.');
