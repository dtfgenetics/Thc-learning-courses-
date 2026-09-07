import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const evidenceDir = path.join(root, 'content/production-control-evidence');
const readiness = JSON.parse(fs.readFileSync(path.join(root, 'registry/system-readiness.json'), 'utf8'));
const schema = JSON.parse(fs.readFileSync(path.join(root, 'schemas/production-control-evidence.schema.json'), 'utf8'));
const ajv = new Ajv2020({allErrors:true, strict:false});
addFormats(ajv);
const validate = ajv.compile(schema);
const errors = [];
const records = [];
const seen = new Set();

if (fs.existsSync(evidenceDir)) {
  for (const name of fs.readdirSync(evidenceDir).filter((n) => n.endsWith('.json')).sort()) {
    const rel = path.join('content/production-control-evidence', name);
    let record;
    try { record = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); }
    catch (error) { errors.push(`${rel}: invalid JSON (${error.message})`); continue; }
    if (!validate(record)) {
      for (const issue of validate.errors ?? []) errors.push(`${rel}${issue.instancePath || '/'}: ${issue.message}`);
      continue;
    }
    if (seen.has(record.id)) errors.push(`${rel}: duplicate evidence id ${record.id}`);
    seen.add(record.id);
    if (record.validUntil && Date.parse(record.validUntil) <= Date.now() && record.status === 'verified') {
      errors.push(`${rel}: verified evidence is expired at ${record.validUntil}`);
    }
    records.push({file:rel, ...record});
  }
}

const controlledGates = [
  'credentials.productionIssuerIdentity',
  'credentials.productionSigning',
  'security.adminMfaEnforced',
  'security.rowLevelAuthorization',
  'security.securityReviewComplete',
  'accessibility.contentAccessibilityReviewComplete',
  'accessibility.assessmentAccessibilityReviewComplete',
  'accessibility.frontendAccessibilityTestingComplete',
  'operations.stagingEnvironment',
  'operations.productionEnvironment',
  'operations.backupRestoreTested',
  'operations.monitoringAndAlerting'
];

function readinessValue(gate) {
  const [area, name] = gate.split('.');
  return readiness.areas?.[area]?.gates?.[name];
}
function verifiedFor(gate) {
  return records.filter((record) => record.gate === gate && record.status === 'verified' && (!record.validUntil || Date.parse(record.validUntil) > Date.now()));
}

for (const gate of controlledGates) {
  const value = readinessValue(gate);
  if (value === true && verifiedFor(gate).length === 0) {
    errors.push(`registry/system-readiness.json claims ${gate}=true without current verified production-control evidence`);
  }
}

if (errors.length) {
  console.error('Production control evidence validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const summary = Object.fromEntries(controlledGates.map((gate) => [gate, {readiness: readinessValue(gate) === true, verifiedEvidence: verifiedFor(gate).length}]));
console.log(JSON.stringify({records:records.length, controlledGates:controlledGates.length, summary}, null, 2));
