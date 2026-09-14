import assert from 'node:assert/strict';
import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const schema = JSON.parse(fs.readFileSync('schemas/lesson.schema.json', 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

const extensibleLesson = {
  id: 'LESSON-EXTENSION-CONTRACT-001',
  title: 'Extensible lesson contract probe',
  version: '1.0.0',
  status: 'draft',
  competencies: ['COMP-EXTENSION-CONTRACT-001'],
  learningObjectives: ['LO-EXTENSION-CONTRACT-001'],
  estimatedMinutes: 5,
  references: [],
  extensions: {
    localization: { ready: false },
    research: { sourceRefreshPolicy: 'author-controlled' }
  },
  content: {
    overview: 'This probe verifies that future academic metadata and instructional structures can be added without weakening the required lesson identity contract.',
    blocks: [
      {
        type: 'extension',
        namespace: 'dtf.learning.experimental',
        renderer: 'future-interactive-v1',
        title: 'Future interactive learning block',
        body: 'The generic learner renderer must preserve a usable text representation until a specialized renderer is available.',
        data: {
          interaction: 'decision-tree',
          branches: [{ id: 'A', label: 'Example branch' }],
          arbitraryFutureField: { enabled: true }
        },
        extensions: {
          analytics: { eventName: 'extension-probe' }
        }
      }
    ],
    extensions: {
      authoring: { notes: ['No fixed block-count ceiling'] }
    }
  }
};

assert.equal(validate(extensibleLesson), true, JSON.stringify(validate.errors, null, 2));

const invalidCore = structuredClone(extensibleLesson);
delete invalidCore.id;
assert.equal(validate(invalidCore), false, 'extensions must not bypass required core lesson identity fields');

const invalidKnownBlock = structuredClone(extensibleLesson);
invalidKnownBlock.content.blocks = [{ type: 'image', src: '/assets/example.svg' }];
assert.equal(validate(invalidKnownBlock), false, 'known block types must retain their strict required fields');

console.log('Lesson schema extensibility contract passed: open namespaced extension data is allowed while core/known block validation remains strict.');