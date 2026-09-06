import assert from 'node:assert/strict';
import { courseProgress, readProgress, setLessonComplete, writeProgress } from '../apps/web/public/progress.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    dump() { return Object.fromEntries(values); }
  };
}

const empty = memoryStorage();
assert.deepEqual(readProgress(empty), { completedLessons: [] });

let progress = setLessonComplete({ completedLessons: [] }, 'LESSON-A-001', true);
assert.deepEqual(progress, { completedLessons: ['LESSON-A-001'] });
progress = setLessonComplete(progress, 'LESSON-A-001', true);
assert.deepEqual(progress, { completedLessons: ['LESSON-A-001'] }, 'completion should be idempotent');
progress = setLessonComplete(progress, 'LESSON-B-001', true);
assert.deepEqual(progress, { completedLessons: ['LESSON-A-001', 'LESSON-B-001'] });
progress = setLessonComplete(progress, 'LESSON-A-001', false);
assert.deepEqual(progress, { completedLessons: ['LESSON-B-001'] });

const storage = memoryStorage();
writeProgress({ completedLessons: ['LESSON-B-001', 'LESSON-A-001', 'LESSON-A-001'] }, storage);
assert.deepEqual(readProgress(storage), { completedLessons: ['LESSON-A-001', 'LESSON-B-001'] });

const malformed = memoryStorage({ 'thc-academy-progress-v1': '{broken-json' });
assert.deepEqual(readProgress(malformed), { completedLessons: [] }, 'malformed local state should fail closed');

const course = {
  modules: [
    { lessons: [{ id: 'LESSON-A-001' }, { id: 'LESSON-B-001' }] },
    { lessons: [{ id: 'LESSON-C-001' }] }
  ]
};
assert.deepEqual(courseProgress(course, { completedLessons: ['LESSON-A-001', 'LESSON-C-001'] }), {
  completed: 2,
  total: 3,
  percent: 67
});
assert.deepEqual(courseProgress({ modules: [] }, { completedLessons: [] }), {
  completed: 0,
  total: 0,
  percent: 0
});

console.log('Learner local-progress tests passed.');
