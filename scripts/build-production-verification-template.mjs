import fs from 'node:fs';
import { requiredProductionVerification } from './lib/production-evidence-verification.mjs';

const args=process.argv.slice(2);
const value=(name)=>{const i=args.indexOf(name);return i>=0?args[i+1]:null;};
const controlId=value('--control');
if(!controlId) throw new Error('Usage: --control <production-control-id>');

const contract=JSON.parse(fs.readFileSync('registry/production-validation-evidence.json','utf8'));
const control=(contract.controls??[]).find(x=>x.id===controlId);
if(!control) throw new Error(`Unknown production control ${controlId}`);

const fields=requiredProductionVerification(control);
const out={
  controlId,
  verification:Object.fromEntries(fields.map(({key})=>[key,null])),
  fieldLabels:Object.fromEntries(fields.map(({key,label})=>[key,label])),
  completionBoundary:'Replace every null with real deployment-backed verification data before evidence completion. Generic confirmations are insufficient.'
};
console.log(JSON.stringify(out,null,2));
