import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { selectNextReviewTask, taskInstructions } from './select-next-review-task.mjs';

const queue = {
  tasks: [
    { lane: 'lesson-editorial', objectId: 'LESSON-B', objectVersion: '1.0.0', reviewType: 'editorial', state: 'blocked' },
    { lane: 'lesson-scientific', objectId: 'LESSON-C', objectVersion: '1.0.0', reviewType: 'scientific', state: 'pending' },
    { lane: 'lesson-scientific', objectId: 'LESSON-A', objectVersion: '1.0.0', reviewType: 'scientific', state: 'revision-required' },
    { lane: 'credential-item', objectId: 'ITEM-B', objectVersion: 1, reviewType: 'assessment', state: 'pending' },
    { lane: 'credential-item', objectId: 'ITEM-A', objectVersion: 1, reviewType: 'assessment', state: 'approved' }
  ]
};

assert.equal(selectNextReviewTask(queue).objectId, 'LESSON-A', 'revision-required work should be prioritized');
assert.equal(selectNextReviewTask(queue, { lane: 'credential-item' }).objectId, 'ITEM-B');
assert.equal(selectNextReviewTask(queue, { lane: 'lesson-scientific', state: 'pending' }).objectId, 'LESSON-C');
assert.equal(selectNextReviewTask(queue, { lane: 'lesson-editorial' }), null, 'blocked tasks must not be selected');
assert.throws(() => selectNextReviewTask(queue, { state: 'approved' }), /unsupported state filter/);
assert.throws(() => selectNextReviewTask({}), /must contain tasks/);

const instructions = taskInstructions(selectNextReviewTask(queue));
assert.match(instructions.nextSteps.join(' '), /human reviewer/i);
assert.match(instructions.nextSteps.join(' '), /--confirm-approved/);
assert.equal(taskInstructions(null), null);

const registry = JSON.parse(fs.readFileSync('registry/curriculum.json', 'utf8'));
const globalQueue = JSON.parse(execFileSync(process.execPath, ['scripts/build-review-queue.mjs', '--summary-only'], { encoding: 'utf8' }));
assert.equal(globalQueue.scope, 'global');
assert.equal(globalQueue.releaseScope.courses, registry.courses.length, 'global review queue must cover every registered course');
assert.equal(globalQueue.releaseScope.lessons, registry.lessons.length, 'global review queue must cover every registered lesson');
assert.equal(globalQueue.releaseScope.assessments, registry.assessments.length, 'global review queue must cover every registered assessment');
assert.equal(globalQueue.releaseScope.questions, registry.questions.length, 'global review queue must cover every registered question');
assert.equal(globalQueue.lanes['lesson-scientific'].total, registry.lessons.length, 'every registered lesson needs a scientific review lane');
assert.equal(globalQueue.lanes['lesson-editorial'].total, registry.lessons.length, 'every registered lesson needs an editorial review lane');

const foundationsQueue = JSON.parse(execFileSync(process.execPath, ['scripts/build-review-queue.mjs', '--summary-only', '--scope=foundations'], { encoding: 'utf8' }));
assert.equal(foundationsQueue.scope, 'foundations');
assert.ok(foundationsQueue.releaseScope.lessons > 0, 'foundations scope must remain available');
assert.ok(foundationsQueue.releaseScope.lessons < globalQueue.releaseScope.lessons, 'foundations scope must be narrower than canonical global scope');

console.log('Next review task selector and review scope tests passed.');
