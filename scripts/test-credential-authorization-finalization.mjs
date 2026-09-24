import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {
  requiredCredentialAuthorizationTruePaths,
  getPath,
  assertCredentialAuthorizationEvidenceComplete,
  applyCredentialProgramAuthorization,
  applyCourseCredentialAuthorization
} from './lib/credential-authorization-finalization.mjs';

const root=process.cwd();
const program=JSON.parse(fs.readFileSync(path.join(root,'content/credential-programs/CREDPROG-CULT-TECH-I-001.json'),'utf8'));
const integratedCourse=JSON.parse(fs.readFileSync(path.join(root,'content/courses/COURSE-LH-TECH1-007.json'),'utf8'));

const appliedProgram=applyCredentialProgramAuthorization(program);
if(appliedProgram.status!=='approved') throw new Error('program authorization transform did not set approved');
if(appliedProgram.assessmentModel.standardSettingStatus!=='validated') throw new Error('program standard-setting state not validated');
for(const key of ['jobTaskAnalysis','smeEmployerValidation','assessmentReview','accessibilityReview']){
  if(appliedProgram.validation[key]!=='validated') throw new Error('program validation '+key+' not validated');
}
const appliedCourse=applyCourseCredentialAuthorization(integratedCourse);
if(appliedCourse.extensions.professionalCredentialUseAuthorized!==true) throw new Error('course professional authorization not applied');
if(appliedCourse.extensions.liveCredentialFormApproved!==true) throw new Error('integrated course live credential form flag not applied');

const intake=spawnSync(process.execPath,[
  'scripts/create-credential-authorization-record.mjs',
  '--program','CREDPROG-CULT-TECH-I-001',
  '--authority','TEST-AUTH',
  '--issuer-id','THC-ACADEMY-TEST',
  '--issuer-name','THC Academy Test Issuer',
  '--issuer-url','https://example.org/verify'
],{cwd:root,encoding:'utf8'});
if(intake.status!==0) throw new Error(intake.stderr||intake.stdout);
const record=JSON.parse(intake.stdout).record;
const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
const schema=JSON.parse(fs.readFileSync(path.join(root,'schemas/credential-authorization-evidence.schema.json'),'utf8'));
const validate=ajv.compile(schema);
if(!validate(record)) throw new Error('credential authorization intake schema failure: '+JSON.stringify(validate.errors));
if(record.status!=='draft'||record.governance.finalReleaseDecision!=='pending') throw new Error('credential authorization intake fabricated release state');

const synthetic=structuredClone(record);
synthetic.status='evidence-complete';
for(const p of requiredCredentialAuthorizationTruePaths){
  let obj=synthetic;
  for(let i=0;i<p.length-1;i++) obj=obj[p[i]];
  obj[p.at(-1)]=true;
}
assertCredentialAuthorizationEvidenceComplete(synthetic);
for(const p of requiredCredentialAuthorizationTruePaths){
  if(getPath(synthetic,p)!==true) throw new Error('synthetic complete evidence missing '+p.join('.'));
}

const kits=spawnSync(process.execPath,['scripts/build-credential-authorization-kits.mjs','--json'],{cwd:root,encoding:'utf8'});
if(kits.status!==0) throw new Error(kits.stderr||kits.stdout);
const kitOut=JSON.parse(kits.stdout);
if(kitOut.kitCount!==2) throw new Error('expected two credential authorization kits');
if(kitOut.kits.some(k=>k.productionControlsTotal!==13)) throw new Error('credential authorization kits must include 13 production controls');

const blocked=spawnSync(process.execPath,[
  'scripts/approve-credential-authorization-evidence.mjs',
  '--source-file',path.join(root,'content/credential-authorization-evidence/DOES-NOT-EXIST.json'),
  '--decision-authority','TEST','--rationale','Should fail',
  '--confirm-program-approval','--confirm-assessment-approval','--confirm-accessibility-approval',
  '--confirm-privacy-legal-approval','--confirm-security-approval','--confirm-organizational-approval','--confirm-release'
],{cwd:root,encoding:'utf8'});
if(blocked.status===0) throw new Error('credential authorization approval unexpectedly succeeded without source evidence');

console.log('Credential authorization finalization: PASS (intake schema, policy transforms, 2 kits, 13 production controls, fail-closed approval).');
