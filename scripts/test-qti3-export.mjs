import assert from 'node:assert/strict';
import { assertAcademicQtiExportable, itemToQti3, qtiManifest } from './lib/qti3-export.mjs';

const item = {
  id: 'ITEM-TEST-QTI-001',
  status: 'active',
  purpose: 'summative',
  type: 'multiple-choice',
  stem: 'Which action best preserves a controlled record?',
  choices: ['Document the change and reason', 'Delete the original entry', 'Rewrite the record silently'],
  correct: 0
};
const assessment = {
  id: 'ASSESS-TEST-QTI-001',
  status: 'published',
  purpose: 'summative',
  randomizeChoices: true
};

assert.doesNotThrow(() => assertAcademicQtiExportable({ assessment, items: [item] }));
const xml = itemToQti3(item, { shuffle: true });
for (const token of [
  'xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"',
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
  '<qti-value>ChoiceA</qti-value>',
  '<qti-choice-interaction response-identifier="RESPONSE" shuffle="true" max-choices="1">',
  '<qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>'
]) assert.ok(xml.includes(token), `Missing QTI token: ${token}`);

const manifest = qtiManifest({ assessment, items: [item] });
assert.ok(manifest.includes('type="imsqti_item_xmlv3p0"'));
assert.ok(manifest.includes('items/ITEM-TEST-QTI-001.xml'));

assert.throws(
  () => assertAcademicQtiExportable({ assessment: { ...assessment, purpose: 'credential' }, items: [item] }),
  /Credential assessments are never exportable/
);
assert.throws(
  () => assertAcademicQtiExportable({ assessment, items: [{ ...item, status: 'draft' }] }),
  /only active items may be exported/
);
assert.throws(
  () => assertAcademicQtiExportable({ assessment, items: [{ ...item, purpose: 'credential' }] }),
  /credential item export is forbidden/
);

console.log('QTI 3 academic export guardrails and XML contracts passed.');
