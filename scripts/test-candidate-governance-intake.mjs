import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const run=spawnSync(process.execPath,['scripts/create-candidate-governance-approval-record.mjs','--authority','TEST-GOV-LEAD'],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const record=JSON.parse(run.stdout).record;

const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
const schema=JSON.parse(fs.readFileSync('schemas/candidate-governance-approval.schema.json','utf8'));
const validate=ajv.compile(schema);
if(!validate(record)) throw new Error(JSON.stringify(validate.errors));
if(record.status!=='approval-pending') throw new Error('starter must remain approval-pending');
if(Object.values(record.approvals).some(Boolean)) throw new Error('starter fabricated approvals');
if(record.finalAttemptPolicy.approved||record.waitingPeriodPolicy.approved||record.feePolicy.approved||record.retentionSchedule.approved) throw new Error('starter fabricated policy approval');
console.log('Candidate governance intake: PASS (exact-version approval-pending starter, no fabricated decisions).');
