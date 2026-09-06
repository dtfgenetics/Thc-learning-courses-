import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('apps/web/public/index.html', 'utf8');
const styles = fs.readFileSync('apps/web/public/styles.css', 'utf8');
const governanceStyles = fs.readFileSync('apps/web/public/governance.css', 'utf8');
const app = fs.readFileSync('apps/web/public/app.js', 'utf8');

function expect(pattern, source, message) {
  assert.match(source, pattern, message);
}

expect(/<html[^>]*lang="en"/i, html, 'document must declare language');
expect(/<meta[^>]*name="viewport"/i, html, 'viewport metadata required');
expect(/class="skip-link"[^>]*href="#lesson-view"/i, html, 'skip link must target lesson content');
expect(/<main[^>]*class="app-shell"/i, html, 'main landmark required');
expect(/<aside[^>]*aria-label="Course catalog"/i, html, 'course catalog must have an accessible name');
expect(/<nav[^>]*aria-label="Academy courses"/i, html, 'course navigation must have an accessible name');
expect(/<label[^>]*for="course-search"/i, html, 'search field needs an explicit label');
expect(/id="course-search"[^>]*type="search"/i, html, 'search input must use search semantics');
expect(/id="lesson-view"[^>]*tabindex="-1"[^>]*aria-live="polite"/i, html, 'lesson panel must be focusable and announce updates');
expect(/id="governance-dashboard"[^>]*aria-live="polite"/i, html, 'governance updates must be announced');
expect(/@media\s*\(prefers-reduced-motion:\s*reduce\)/i, styles, 'reduced-motion fallback required');
expect(/\.skip-link:focus\s*\{/i, styles, 'skip link needs visible focus behavior');
expect(/\.search:focus[^\{]*\{/i, styles, 'interactive search focus styling required');
expect(/\.lesson-link:focus[^\{]*\{/i, styles, 'lesson links need focus styling');
expect(/@media\s*\(max-width:\s*700px\)/i, governanceStyles, 'governance dashboard needs narrow-screen treatment');
expect(/button\.type\s*=\s*'button'/, app, 'dynamic lesson controls must use explicit button type');
expect(/aria-pressed/, app, 'lesson completion state must expose pressed state');

for (const forbidden of [
  /outline\s*:\s*none/i,
  /user-scalable\s*=\s*no/i,
  /maximum-scale\s*=\s*1/i
]) {
  assert.equal(forbidden.test(`${html}\n${styles}\n${governanceStyles}`), false, `forbidden accessibility pattern found: ${forbidden}`);
}

console.log('Academy accessibility regression checks passed. Manual keyboard, screen-reader, zoom/reflow, contrast, and assessment accessibility review remain required before the production accessibility gate can close.');
