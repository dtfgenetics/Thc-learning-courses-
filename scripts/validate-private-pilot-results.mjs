import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAndValidatePrivatePilotResults } from './private-pilot-results-input.mjs';

const args = process.argv.slice(2);
const index = args.indexOf('--input');
const input = index >= 0 ? args[index + 1] : null;

if (!input) {
  console.error('Usage: node scripts/validate-private-pilot-results.mjs --input <private-results.json>');
  process.exit(64);
}

try {
  const payload = readAndValidatePrivatePilotResults(input);
  console.log(JSON.stringify({
    valid: true,
    cohortId: payload.cohortId,
    responses: payload.responses.length,
    participantLevelDataCommitted: false
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
