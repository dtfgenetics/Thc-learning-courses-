import assert from 'node:assert/strict';
import { courseProgress, createServerProgressClient, progressFromServerRows, readProgress, setLessonComplete, writeProgress } from '../apps/web/public/progress.js';

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

assert.deepEqual(progressFromServerRows([
  { lessonId: 'LESSON-B-001', status: 'completed' },
  { lessonId: 'LESSON-A-001', status: 'in-progress' },
  { lessonId: 'LESSON-B-001', status: 'completed' }
]), { completedLessons: ['LESSON-B-001'] });

const calls = [];
const client = createServerProgressClient({
  fetchImpl: async (url, options) => {
    calls.push({ url, options });
    if (options.method === 'GET') {
      return { ok: true, status: 200, async json() { return { learner: { subject: 'subject-alice' }, progress: [{ lessonId: 'LESSON-A-001', status: 'completed' }] }; } };
    }
    return { ok: true, status: 200, async json() { return { progress: { lessonId: 'LESSON-A-001', lessonVersion: '2', status: 'completed' } }; } };
  }
});
const loaded = await client.load();
assert.deepEqual(loaded, { progress: { completedLessons: ['LESSON-A-001'] }, subject: 'subject-alice' });
await client.setLesson({ lessonId: 'LESSON-A-001', lessonVersion: 2, complete: true });
assert.equal(calls[0].url, '/api/v1/me/progress');
assert.equal(calls[0].options.credentials, 'same-origin');
assert.equal(calls[1].url, '/api/v1/me/lessons/LESSON-A-001');
assert.deepEqual(JSON.parse(calls[1].options.body), { lessonVersion: '2', status: 'completed' });

const unavailableClient = createServerProgressClient({
  fetchImpl: async () => ({ ok: false, status: 401, async json() { return {}; } })
});
await assert.rejects(() => unavailableClient.load(), /Account progress unavailable \(401\)/);

const course = {
  modules: [
    { lessons: [{ id: 'LESSON-A-001' }, { id: 'LESSON-B-001' }] },
    { lessons: [{ id: 'LESSON-C-001' }] }
  ]
};
assert.deepEqual(courseProgress(course, { completedLessons: ['LESSON-A-001', 'LESSON-C-001'] }), { completed: 2, total: 3, percent: 67 });
assert.deepEqual(courseProgress({ modules: [] }, { completedLessons: [] }), { completed: 0, total: 0, percent: 0 });

console.log('Learner local and server-progress tests passed.');
