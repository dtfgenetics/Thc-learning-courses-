import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
const root=process.cwd(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'thc-human-complete-'));
const run=(script,args)=>{const r=spawnSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);return JSON.parse(r.stdout).record;};
const schema=p=>{const a=new Ajv2020({allErrors:true,strict:false});addFormats(a);return a.compile(JSON.parse(fs.readFileSync(p,'utf8')));};

const p=run('scripts/create-course-pilot-execution-record.mjs',['--course','COURSE-LH-TECH1-001','--pilot-id','TEST-PILOT','--cohorts','1','--participants','12','--authority','TEST']);
const pf=path.join(tmp,'pilot.json');fs.writeFileSync(pf,JSON.stringify(p));
const pc=run('scripts/complete-course-pilot-execution.mjs',['--source-file',pf,'--authority','TEST-AUTH','--confirm-feedback','--confirm-data-quality','--confirm-fairness-review','--confirm-fairness-disposition','--confirm-knowledge-current','--confirm-performance-current']);
const pv=schema('schemas/course-pilot-execution-evidence.schema.json');if(!pv(pc))throw new Error(JSON.stringify(pv.errors));if(pc.status!=='evidence-complete')throw new Error('pilot completion failed');

const a=run('scripts/create-accessibility-review-record.mjs',['--course','COURSE-LH-TECH1-001','--build','test-build','--reviewer','TEST','--platform','Windows','--browser','Chrome','--input','keyboard','--viewport','1280px']);
const af=path.join(tmp,'a11y.json');fs.writeFileSync(af,JSON.stringify(a));
const ac=run('scripts/complete-accessibility-review.mjs',['--source-file',af,'--reviewer','TEST-REVIEWER','--environment','Windows|Chrome|NVDA|keyboard|1280px','--environment','macOS|Safari|VoiceOver|keyboard|200%','--environment','Android|Chrome|TalkBack|touch|360px','--confirm-full-coverage','--confirm-aa-disposition']);
const av=schema('schemas/rendered-accessibility-review-evidence.schema.json');if(!av(ac))throw new Error(JSON.stringify(av.errors));if(ac.environments.length<3||ac.unresolvedFailures!==0)throw new Error('accessibility completion failed');

const o=run('scripts/create-occupational-program-validation-record.mjs',['--program','CREDPROG-CULT-TECH-I-001','--authority','TEST']);
const of=path.join(tmp,'occ.json');fs.writeFileSync(of,JSON.stringify(o));

const occupationalBaseline=JSON.parse(fs.readFileSync('registry/public-occupational-source-baseline.json','utf8'));
const tech1Baseline=occupationalBaseline.programs.find(x=>x.credentialProgramId==='CREDPROG-CULT-TECH-I-001');
const jtaInput={
  credentialProgramId:'CREDPROG-CULT-TECH-I-001',
  panelId:'TEST-HUMAN-COMPLETE',
  analystId:'TEST-ANALYST',
  populationDefinition:'Synthetic regression population representing entry cannabis cultivation technicians working under established procedures and bounded authority.',
  operatingContexts:['indoor cultivation'],
  jurisdictionNotes:'Synthetic regression fixture only; no real jurisdictional approval is implied.',
  minimumRatingsPerTask:3,
  reviewers:Array.from({length:3},(_,i)=>({
    reviewerId:'TEST-R'+(i+1),
    employerPerspective:i===0,
    cultivationRole:true,
    ratings:tech1Baseline.taskFamilies.map(t=>({
      taskFamilyId:t.id,frequency:3,importance:4,criticality:4,essential:true,disposition:'keep'
    }))
  }))
};
const jtaInputFile=path.join(tmp,'jta-input.json');fs.writeFileSync(jtaInputFile,JSON.stringify(jtaInput));
const jta=run('scripts/build-job-task-analysis-evidence.mjs',['--input',jtaInputFile,'--complete']);
const jtaFile=path.join(tmp,'jta.json');fs.writeFileSync(jtaFile,JSON.stringify(jta));

const flags=['--confirm-current-courses','--confirm-source-review','--confirm-public-occupational-baseline','--confirm-role-boundaries','--confirm-technical-disposition','--confirm-jta','--confirm-population','--confirm-task-coverage','--confirm-currency','--confirm-sme','--confirm-role-representativeness','--confirm-critical-tasks','--confirm-scope','--confirm-blueprint-weights','--confirm-competency-coverage','--confirm-critical-content','--confirm-cognitive-demand','--confirm-performance-validation','--confirm-critical-decision-coverage'];
const oc=run('scripts/complete-occupational-program-validation.mjs',['--source-file',of,'--jta-source-file',jtaFile,'--authority','TEST-AUTH','--reviewer-count','2','--panelist-count','3','--blueprint-version','TEST-BLUEPRINT',...flags]);
const ov=schema('schemas/occupational-program-validation-evidence.schema.json');if(!ov(oc))throw new Error(JSON.stringify(ov.errors));if(oc.status!=='evidence-complete'||oc.performanceValidation.practicalsValidated!==oc.performanceValidation.practicalsExpected)throw new Error('occupational completion failed');
if(oc.technicalCurriculumReview.publicSourceReviewCompleted!==true)throw new Error('occupational source review not recorded');
const sourceRegistry=JSON.parse(fs.readFileSync('registry/public-authoritative-source-supplements.json','utf8'));
if(oc.technicalCurriculumReview.sourceReviewRegistryId!==sourceRegistry.id||oc.technicalCurriculumReview.sourceReviewRegistryAsOf!==sourceRegistry.asOf)throw new Error('occupational source review provenance mismatch');
if(!oc.evidenceRefs.includes(sourceRegistry.id))throw new Error('occupational source review evidence reference missing');
if(oc.jobTaskAnalysis.publicOccupationalSourceReviewCompleted!==true)throw new Error('public occupational baseline review not recorded');
if(oc.jobTaskAnalysis.occupationalSourceBaselineId!==occupationalBaseline.id||oc.jobTaskAnalysis.occupationalSourceBaselineAsOf!==occupationalBaseline.asOf)throw new Error('occupational baseline provenance mismatch');
if(!oc.evidenceRefs.includes(occupationalBaseline.id))throw new Error('occupational baseline evidence reference missing');
if(!oc.evidenceRefs.includes(jta.id))throw new Error('structured JTA evidence reference missing');
console.log('Human validation completion transitions: PASS (pilot, accessibility, occupational).');