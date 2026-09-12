import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('apps/web/public/index.html', 'utf8');
const styles = fs.readFileSync('apps/web/public/styles.css', 'utf8');
const governanceStyles = fs.readFileSync('apps/web/public/governance.css', 'utf8');
const portalStyles = fs.readFileSync('apps/web/public/portal.css', 'utf8');
const assessmentStyles = fs.readFileSync('apps/web/public/course-assessment.css', 'utf8');
const app = fs.readFileSync('apps/web/public/app.js', 'utf8');
const portal = fs.readFileSync('apps/web/public/portal.js', 'utf8');
const assessment = fs.readFileSync('apps/web/public/course-assessment.js', 'utf8');

function expect(pattern, source, message) {
  assert.match(source, pattern, message);
}

expect(/<html[^>]*lang="en"/i, html, 'document must declare language');
expect(/<meta[^>]*name="viewport"/i, html, 'viewport metadata required');
expect(/class="skip-link"[^>]*href="#lesson-view"/i, html, 'skip link must target lesson content');
expect(/<main[^>]*class="app-shell"/i, html, 'main landmark required');
expect(/<aside[^>]*aria-label="Course catalog"/i, html, 'course catalog must have an accessible name');
expect(/<nav[^>]*aria-label="Academy courses"/i, html, 'course navigation must have an accessible name');
expect(/<nav[^>]*aria-label="Academy features"/i, html, 'Academy feature navigation must have an accessible name');
expect(/id="tab-progress"[^>]*aria-pressed="false"/i, html, 'credential progress tab must expose pressed state');
expect(/<label[^>]*for="course-search"/i, html, 'search field needs an explicit label');
expect(/id="course-search"[^>]*type="search"/i, html, 'search input must use search semantics');
expect(/id="lesson-view"[^>]*tabindex="-1"[^>]*aria-live="polite"/i, html, 'lesson panel must be focusable and announce updates');
expect(/id="governance-dashboard"[^>]*aria-live="polite"/i, html, 'governance updates must be announced');
expect(/@media\s*\(prefers-reduced-motion:\s*reduce\)/i, styles, 'reduced-motion fallback required');
expect(/\.skip-link:focus\s*\{/i, styles, 'skip link needs visible focus behavior');
expect(/\.search:focus[^\{]*\{/i, styles, 'interactive search focus styling required');
expect(/\.lesson-link:focus[^\{]*\{/i, styles, 'lesson links need focus styling');
expect(/\.practice-choice:focus-within[^\{]*\{/i, styles, 'practice choices need visible keyboard focus');
expect(/createElement\('fieldset'\)/, app, 'practice questions must use fieldset grouping');
expect(/createElement\('legend'\)/, app, 'practice questions must use legends for question prompts');
expect(/setAttribute\('aria-live',\s*'polite'\)/, app, 'practice feedback must be announced to assistive technology');
expect(/@media\s*\(max-width:\s*700px\)/i, governanceStyles, 'governance dashboard needs narrow-screen treatment');
expect(/\.portal-tab:focus-visible[^\{]*\{/i, portalStyles, 'feature tabs need visible keyboard focus');
expect(/\.portal-table-wrap\s*\{[^}]*overflow-x:\s*auto/i, portalStyles, 'credential attempt table must remain horizontally scrollable on narrow screens');
expect(/@media\s*\(max-width:\s*620px\)/i, portalStyles, 'credential progress view needs narrow-screen treatment');
expect(/button\.type\s*=\s*'button'/, app, 'dynamic lesson controls must use explicit button type');
expect(/aria-pressed/, app, 'lesson completion state must expose pressed state');
expect(/setAttribute\('aria-pressed'/, portal, 'feature tab state must be updated accessibly');
expect(/credentials:\s*'same-origin'/, portal, 'private learner evidence requests must preserve same-origin authentication');

expect(/createElement\('fieldset'\)/, assessment, 'course final items must use fieldset grouping');
expect(/createElement\('legend'\)/, assessment, 'course final items must use legends for question prompts');
expect(/input\.type\s*=\s*'radio'/, assessment, 'course final single-choice inputs must use radio semantics');
expect(/input\.type\s*=\s*'checkbox'/, assessment, 'course final multiple-response inputs must use checkbox semantics');
expect(/input\.type\s*=\s*'number'/, assessment, 'course final numeric inputs must use numeric semantics');
expect(/lessonView\.focus\(\)/, assessment, 'course final view changes must move focus to the learner content region');
expect(/\.course-assessment-choice:focus-within[^\{]*\{/i, assessmentStyles, 'course final choices need visible keyboard focus');
expect(/\.course-assessment-launch[^\{]*\{[^}]*min-height:\s*44px/i, assessmentStyles, 'course final launch control needs an accessible touch target');
expect(/@media\s*\(max-width:\s*620px\)/i, assessmentStyles, 'course final needs narrow-screen treatment');

for (const forbidden of [
  /outline\s*:\s*none/i,
  /user-scalable\s*=\s*no/i,
  /maximum-scale\s*=\s*1/i
]) {
  assert.equal(forbidden.test(`${html}\n${styles}\n${governanceStyles}\n${portalStyles}\n${assessmentStyles}`), false, `forbidden accessibility pattern found: ${forbidden}`);
}

console.log('Academy accessibility regression checks passed, including Course 1 final controls. Manual keyboard, screen-reader, zoom/reflow, contrast, and assessment accessibility review remain required before the production accessibility gate can close.');
