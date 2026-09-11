import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { courseProgress } from '../apps/web/public/progress.js';

const appSource = fs.readFileSync(path.join(process.cwd(), 'apps/web/public/app.js'), 'utf8');

const sampleCourse = {
  credentialBearing: true,
  modules: [
    { lessons: [{ id: 'LESSON-A' }, { id: 'LESSON-B' }] },
    { lessons: [{ id: 'LESSON-C' }] }
  ]
};
const state = courseProgress(sampleCourse, { completedLessons: ['LESSON-A', 'LESSON-C'] });
assert.deepEqual(state, { completed: 2, total: 3, percent: 67 }, 'courseProgress remains a lesson-completion calculation');

assert.match(appSource, /% lesson progress/, 'course cards must label their percentage as lesson progress');
assert.match(appSource, /aria-label', `\$\{course\.title\} lesson progress`/, 'progressbar accessible name must identify lesson progress');
assert.match(appSource, /Lesson progress only\. Course and credential completion also depend on the required assessment and practical-performance evidence/, 'credential-bearing course cards must distinguish lesson progress from course completion');
assert.match(appSource, /Lesson completion does not itself satisfy assessment, practical, or credential requirements/, 'account lesson completion copy must not imply course completion');
assert.match(appSource, /Device lesson progress is separate from official assessment, practical, and credential records/, 'device progress copy must distinguish local lesson state from official evidence');
assert.doesNotMatch(appSource, /\$\{courseState\.percent\}%`/, 'course cards must not show an unlabeled percentage that could be read as total course completion');

console.log('Course progress semantics contract passed.');
