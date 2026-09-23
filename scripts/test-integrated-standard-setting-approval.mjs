import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root=process.cwd();
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'thc-ipstd-approve-'));

function run(script,args){
  const r=spawnSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8'});
  if(r.status!==0) throw new Error(r.stderr||r.stdout);
  return JSON.parse(r.stdout).record;
}
function courseIds(courseId){
  const c=JSON.parse(fs.readFileSync('content/courses/'+courseId+'.json','utf8'));
  const e=c.extensions??{};
  return [...new Set([...(e.credentialPracticalSetRequired??[]),...(e.mappedPerformanceAssessments??[]),...(e.capstoneRequired?[e.capstoneRequired]:[])])];
}

const courseId='COURSE-LH-TECH1-007';
const ids=courseIds(courseId);
const intakeArgs=['--course',courseId,'--panelists','4','--authority','TEST-PANEL'];
for(const id of ids) intakeArgs.push('--component',id+'|80');
const source=run('scripts/create-integrated-performance-standard-setting-record.mjs',intakeArgs);
const sourceFile=path.join(tmp,'source.json');fs.writeFileSync(sourceFile,JSON.stringify(source));

const approveArgs=[
  '--source-file',sourceFile,'--decision-authority','TEST-GOV',
  '--rationale','Synthetic regression validates explicit component adoption.',
  '--confirm-all-components-pass','--confirm-no-critical-errors','--confirm-noncompensatory','--confirm-adopt'
];
for(const id of ids) approveArgs.push('--component',id+'|81');
const approved=run('scripts/approve-integrated-performance-standard-setting.mjs',approveArgs);

const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
const schema=JSON.parse(fs.readFileSync('schemas/integrated-performance-standard-setting-evidence.schema.json','utf8'));
const validate=ajv.compile(schema);
if(!validate(approved)) throw new Error(JSON.stringify(validate.errors));
if(approved.status!=='approved'||approved.governanceDecision.decision!=='adopt') throw new Error('approval transition did not produce approved adopted evidence');
if(approved.components.some(c=>c.adoptedMinimumPercent!==81||c.criticalErrorRuleApproved!==true)) throw new Error('component adoption drift');
if(approved.decisionRule.allRequiredComponentsMustPass!==true||approved.decisionRule.noCriticalErrors!==true||approved.decisionRule.compensatoryScoringAllowed!==false) throw new Error('integrated decision rule drift');

const missing=spawnSync(process.execPath,[
  'scripts/approve-integrated-performance-standard-setting.mjs','--source-file',sourceFile,
  '--decision-authority','TEST-GOV','--rationale','Should fail','--confirm-adopt'
],{cwd:root,encoding:'utf8'});
if(missing.status===0) throw new Error('approval did not fail closed when decision-rule confirmations were missing');

const kitDir=path.join(tmp,'kits');
const kitRun=spawnSync(process.execPath,['scripts/build-integrated-standard-setting-kits.mjs','--write','--json','--out',kitDir],{cwd:root,encoding:'utf8'});
if(kitRun.status!==0) throw new Error(kitRun.stderr||kitRun.stdout);
const kitOut=JSON.parse(kitRun.stdout);
if(kitOut.kitCount!==2) throw new Error('expected two integrated standard-setting kits');
for(const k of kitOut.kits){
  const p=JSON.parse(fs.readFileSync(path.join(kitDir,k.id+'.json'),'utf8'));
  if(!p.panelIntakeCommand.includes('evidence:intake:integrated-standard-setting')) throw new Error(k.id+': panel intake command missing');
  if(!p.approvalCommand.includes('evidence:approve:integrated-standard-setting')) throw new Error(k.id+': approval command missing');
  if(p.components.length<2) throw new Error(k.id+': performance components missing');
}

console.log('Integrated standard-setting approval and operator kits: PASS (append-only approval, explicit decision rules, 2 exact-version kits).');
