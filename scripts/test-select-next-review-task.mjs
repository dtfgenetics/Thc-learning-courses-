import assert from 'node:assert/strict';
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

console.log('Next review task selector tests passed.');
