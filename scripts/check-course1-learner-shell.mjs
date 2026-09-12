import './check-course1-content-assets.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = (path) => fs.readFileSync(path, 'utf8');
const html = read('apps/web/public/index.html');
const styles = read('apps/web/public/styles.css');
const portalStyles = read('apps/web/public/portal.css');
const richStyles = read('apps/web/public/rich-content.css');
const app = read('apps/web/public/app.js');
const portal = read('apps/web/public/portal.js');
const governance = read('apps/web/public/governance.js');

function expect(pattern, source, message) {
  assert.match(source, pattern, message);
}

function reject(pattern, source, message) {
  assert.equal(pattern.test(source), false, message);
}

for (const file of ['apps/web/public/app.js', 'apps/web/public/portal.js', 'apps/web/public/governance.js']) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${file} must pass node --check: ${result.stderr || result.stdout}`);
}

expect(/id="catalog-toggle"[^>]*aria-expanded="true"[^>]*aria-controls="catalog-body"/i, html, 'mobile course outline control must expose expanded state and controlled region');
expect(/id="catalog-body"/i, html, 'course outline body must have a stable controlled-region id');
expect(/id="tab-field-references"/i, html, 'field references must remain a first-class learner tab');

expect(/function\s+renderPracticeSection\s*\(/, app, 'app.js must remain the canonical lesson-practice renderer');
expect(/renderPracticeSection\(article,\s*lesson\)/, app, 'canonical lesson practice must still be attached to rendered lessons');
reject(/function\s+appendPractice\s*\(/, portal, 'portal.js must not reintroduce a second lesson-practice renderer');
reject(/\/practice[`'"?)]/, portal, 'portal.js must not make a duplicate lesson-practice request');
reject(/\.portal-practice\b/, portalStyles, 'retired duplicate portal-practice presentation styles should not return');

expect(/matchMedia\?\.\('\(max-width:\s*840px\)'\)/, portal, 'learner shell must use the shared compact-layout breakpoint');
expect(/function\s+setCatalogExpanded\s*\(/, portal, 'catalog outline needs an explicit responsive expanded-state controller');
expect(/catalogBody\.hidden\s*=\s*isCompact\s*&&\s*!effectiveExpanded/, portal, 'compact outline must hide its body when collapsed');
expect(/closest\('\.lesson-link'\)/, portal, 'lesson selection must be handled through delegated navigation state');
expect(/setActive\('tab-catalog'\)/, portal, 'opening a lesson must restore Curriculum as the active top-level view');
expect(/setCatalogExpanded\(false\)/, portal, 'lesson/feature navigation must be able to collapse the compact outline');

expect(/\.catalog-panel\s*\{[^}]*position:\s*sticky[^}]*max-height:\s*100vh/is, styles, 'desktop course outline must remain available while long lessons scroll');
expect(/\.catalog-toggle\s*\{[^}]*display:\s*none/is, styles, 'course outline toggle must stay out of the desktop layout');
expect(/@media\s*\(max-width:\s*840px\)[\s\S]*\.catalog-toggle\s*\{[^}]*display:\s*flex/is, styles, 'course outline toggle must appear in compact layouts');
expect(/\.lesson-link\s*\{[^}]*min-height:\s*42px/is, styles, 'lesson navigation needs a large touch target');
expect(/\.practice-choice\s*\{[^}]*min-height:\s*44px/is, styles, 'practice choices need a 44px touch target');
expect(/max-width:\s*72ch/, styles, 'long lesson prose must use a readable line-length constraint');

expect(/@media\s*\(max-width:\s*840px\)[\s\S]*\.portal-nav\s*\{[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/is, portalStyles, 'compact feature navigation must scroll horizontally instead of wrapping into a tall header');
expect(/\.portal-tab\s*\{[^}]*min-height:\s*44px/is, portalStyles, 'top-level feature tabs need a 44px touch target');
expect(/\.field-reference-button[^\{]*\{[^}]*min-height:\s*44px/is, portalStyles, 'field-reference actions need a 44px touch target');

expect(/\.rich-table-wrap\s*\{[^}]*overflow-x:\s*auto[^}]*-webkit-overflow-scrolling:\s*touch/is, richStyles, 'rich tables must preserve readable columns with touch scrolling');
expect(/@media\s*\(max-width:\s*700px\)[\s\S]*\.rich-comparison-grid\s*\{[^}]*grid-template-columns:\s*1fr/is, richStyles, 'rich comparisons must stack on narrow screens');
expect(/\.rich-reveal\s+summary\s*\{[^}]*min-height:\s*44px/is, richStyles, 'rich disclosure controls need a touch-sized target');

expect(/field-reference-remediation/, governance, 'incorrect practice responses must retain targeted field-reference remediation');

console.log('Course 1 learner shell audit passed: one practice renderer, responsive outline/navigation, touch targets, readable prose, field-reference remediation, rich-content reflow, and Course 1 content/visual completeness are protected.');
