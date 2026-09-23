import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root=process.cwd();
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'thc-std-sec-approve-'));

function run(script,args){
  const r=spawnSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8'});
  if(r.status!==0) throw new Error(r.stderr||r.stdout);
  return JSON.parse(r.stdout).record;
}
const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
const stdValidate=ajv.compile(JSON.parse(fs.readFileSync('schemas/standard-setting-evidence.schema.json','utf8')));
const secValidate=ajv.compile(JSON.parse(fs.readFileSync('schemas/secure-form-equivalence-evidence.schema.json','utf8')));

const stdSource=run('scripts/create-standard-setting-evidence-record.mjs',[
  '--course','COURSE-LH-TECH1-001','--method','modified-angoff','--panelists','3','--raw-score','29','--percent','80.6',
  '--authority','TEST-PANEL-LEAD','--pld-approved','--sensitivity-reviewed','--pilot-sample-size','60','--estimated-pass-rate','0.72'
]);
const stdPath=path.join(tmp,'std.json');fs.writeFileSync(stdPath,JSON.stringify(stdSource,null,2));
const stdApproved=run('scripts/approve-standard-setting-evidence.mjs',[
  '--source-file',stdPath,'--production-cut-percent','81','--decision-authority','TEST-GOV-AUTH',
  '--rationale','Synthetic regression confirms explicit governance adoption path.','--confirm-adopt'
]);
if(!stdValidate(stdApproved)) throw new Error('approved standard-setting schema failure: '+JSON.stringify(stdValidate.errors));
if(stdApproved.status!=='approved'||stdApproved.governanceDecision.decision!=='adopt'||stdApproved.governanceDecision.productionCutScorePercent!==81) throw new Error('standard-setting approval transition failed');

const secSource=run('scripts/create-secure-form-equivalence-record.mjs',[
  '--course','COURSE-LH-TECH1-001','--authority','TEST-SECURITY-LEAD','--blueprint-version','ASSESS-LH-TECH1-001-FINAL@1.2.0',
  '--form','FORM-A|r1|36|abcdef0123456789','--form','FORM-B|r1|36|0123456789abcdef'
]);
const secPath=path.join(tmp,'secure.json');fs.writeFileSync(secPath,JSON.stringify(secSource,null,2));
const secApproved=run('scripts/approve-secure-form-equivalence.mjs',[
  '--source-file',secPath,'--authority','TEST-SECURITY-AUTH',
  '--confirm-private-items','--confirm-blueprint-equivalence','--confirm-cognitive-equivalence',
  '--confirm-critical-content-equivalence','--confirm-scored-opportunity-equivalence','--confirm-retest-review',
  '--confirm-private-store','--confirm-answer-exclusion','--confirm-exposure-tracking','--confirm-quarantine',
  '--quantitative-status','preliminary','--max-overlap','0.15'
]);
if(!secValidate(secApproved)) throw new Error('approved secure-form schema failure: '+JSON.stringify(secValidate.errors));
if(secApproved.status!=='approved') throw new Error('secure-form approval transition failed');
if(secApproved.forms.some(f=>!f.approvedOperationalItemsOnly||!f.publicItemsExcluded)) throw new Error('approved secure forms missing private operational boundary');
for(const k of ['blueprintCoverageEquivalent','cognitiveDemandEquivalent','criticalContentRepresentationEquivalent','scoredOpportunityEquivalent','retestDuplicationReviewed']){
  if(secApproved.equivalenceReview[k]!==true) throw new Error('missing equivalence confirmation '+k);
}
for(const k of ['privateStoreVerified','answerMaterialExcludedFromDelivery','exposureTrackingEnabled','quarantineWorkflowEnabled']){
  if(secApproved.securityReview[k]!==true) throw new Error('missing security confirmation '+k);
}

const missingFlag=spawnSync(process.execPath,[
  'scripts/approve-secure-form-equivalence.mjs','--source-file',secPath,'--authority','TEST',
  '--confirm-private-items'
],{cwd:root,encoding:'utf8'});
if(missingFlag.status===0) throw new Error('secure-form approval did not fail closed when confirmations were missing');

console.log('Standard-setting and secure-form approval transitions: PASS (explicit confirmations, exact-version, schema-valid).');
