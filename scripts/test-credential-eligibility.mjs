import { spawnSync } from 'node:child_process';

function run(input) {
  return spawnSync(process.execPath, ['scripts/evaluate-credential-eligibility.mjs', `--input=${input}`], { encoding: 'utf8' });
}

const pass = run('tests/fixtures/eligibility-pass.json');
if (pass.status !== 0) throw new Error(`Expected passing fixture to be eligible.\n${pass.stdout}\n${pass.stderr}`);
const passResult = JSON.parse(pass.stdout);
if (!passResult.eligible) throw new Error('Passing fixture returned eligible=false');

const fail = run('tests/fixtures/eligibility-fail.json');
if (fail.status !== 2) throw new Error(`Expected failing fixture to exit 2. Got ${fail.status}.\n${fail.stdout}\n${fail.stderr}`);
const failResult = JSON.parse(fail.stdout);
if (failResult.eligible) throw new Error('Failing fixture returned eligible=true');
if (!failResult.missingRequirements.some((row) => row.reason === 'below-minimum-score')) throw new Error('Failing fixture did not report below-minimum-score');

console.log('Credential eligibility tests passed.');
