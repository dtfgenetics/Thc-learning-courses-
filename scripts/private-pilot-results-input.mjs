import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export function validatePrivatePilotResults(payload, {baseDir = process.cwd()} = {}) {
  const schemaPath = path.join(baseDir, 'schemas/private-pilot-results.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv2020({allErrors: true, strict: false});
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(payload);
  if (valid) return {valid: true, errors: []};
  return {
    valid: false,
    errors: (validate.errors ?? []).map((issue) => `${issue.instancePath || '/'} ${issue.message}`)
  };
}

export function readAndValidatePrivatePilotResults(inputPath, {baseDir = process.cwd()} = {}) {
  const absolute = path.isAbsolute(inputPath) ? inputPath : path.resolve(baseDir, inputPath);
  if (!fs.existsSync(absolute)) throw new Error(`Pilot results file not found: ${inputPath}`);
  const payload = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  const result = validatePrivatePilotResults(payload, {baseDir});
  if (!result.valid) throw new Error(`Private pilot results schema validation failed:\n${result.errors.map((error) => `- ${error}`).join('\n')}`);
  return payload;
}
