const QTI_ITEM_NS = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0';
const QTI_ITEM_SCHEMA = 'https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd';
const QTI_PACKAGE_NS = 'http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1';

export function xmlEscape(value) {
  return String(value ?? '').replace(/[<>&"']/g, (char) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
  })[char]);
}

export function choiceIdentifier(index) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (!Number.isInteger(index) || index < 0 || index >= alphabet.length) throw new Error('QTI export supports at most 26 choices.');
  return `Choice${alphabet[index]}`;
}

export function assertAcademicQtiExportable({ assessment, items }) {
  if (!assessment || !['approved', 'published'].includes(assessment.status)) {
    throw new Error('QTI export requires an approved or published assessment.');
  }
  if (assessment.purpose === 'credential') {
    throw new Error('Credential assessments are never exportable through the public QTI exporter.');
  }
  if (!['formative', 'summative'].includes(assessment.purpose)) {
    throw new Error(`Unsupported QTI assessment purpose: ${assessment.purpose}`);
  }
  if (!Array.isArray(items) || items.length === 0) throw new Error('QTI export requires at least one item.');
  for (const item of items) {
    if (item.purpose === 'credential') throw new Error(`${item.id}: credential item export is forbidden.`);
    if (item.status !== 'active') throw new Error(`${item.id}: only active items may be exported; found ${item.status}.`);
    if (!['multiple-choice', 'scenario', 'case-study'].includes(item.type)) {
      throw new Error(`${item.id}: QTI prototype currently supports single-choice items only; found ${item.type}.`);
    }
    if (!Array.isArray(item.choices) || item.choices.length < 2) throw new Error(`${item.id}: choices are required.`);
    if (!Number.isInteger(item.correct) || item.correct < 0 || item.correct >= item.choices.length) throw new Error(`${item.id}: valid single correct choice required.`);
  }
}

export function itemToQti3(item, { shuffle = false } = {}) {
  const correct = choiceIdentifier(item.correct);
  const choices = item.choices.map((choice, index) =>
    `      <qti-simple-choice identifier="${choiceIdentifier(index)}">${xmlEscape(choice)}</qti-simple-choice>`
  ).join('\n');
  const title = xmlEscape(item.stem.length > 100 ? `${item.stem.slice(0, 97)}...` : item.stem);
  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="${QTI_ITEM_NS}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${QTI_ITEM_NS} ${QTI_ITEM_SCHEMA}" identifier="${xmlEscape(item.id)}" title="${title}" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>${correct}</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="${shuffle ? 'true' : 'false'}" max-choices="1">
      <qti-prompt>${xmlEscape(item.stem)}</qti-prompt>
${choices}
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>
`;
}

export function qtiManifest({ assessment, items }) {
  const resources = items.map((item) => {
    const href = `items/${item.id}.xml`;
    return `    <resource identifier="RES-${xmlEscape(item.id)}" type="imsqti_item_xmlv3p0" href="${href}">
      <metadata>
        <imsqti:qtiMetadata>
          <imsqti:timeDependent>false</imsqti:timeDependent>
          <imsqti:interactionType>choiceInteraction</imsqti:interactionType>
          <imsqti:feedbackType>none</imsqti:feedbackType>
          <imsqti:solutionAvailable>true</imsqti:solutionAvailable>
        </imsqti:qtiMetadata>
      </metadata>
      <file href="${href}"/>
    </resource>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="${QTI_PACKAGE_NS}" xmlns:imsqti="http://www.imsglobal.org/xsd/imsqti_metadata_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" identifier="MANIFEST-${xmlEscape(assessment.id)}">
  <metadata>
    <schema>QTI Package</schema>
    <schemaversion>3.0.0</schemaversion>
  </metadata>
  <resources>
${resources}
  </resources>
</manifest>
`;
}
