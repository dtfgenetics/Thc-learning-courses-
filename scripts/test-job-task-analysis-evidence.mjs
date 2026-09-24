import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root=process.cwd();
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'thc-jta-'));
const baseline=JSON.parse(fs.readFileSync('registry/public-occupational-source-baseline.json','utf8'));
const bp=baseline.programs.find(x=>x.credentialProgramId==='CREDPROG-CULT-TECH-I-001');
if(!bp) throw new Error('Technician I occupational baseline missing');

function payload(count,min=3){
  return {
    credentialProgramId:'CREDPROG-CULT-TECH-I-001',
    panelId:'PANEL-TEST-'+count,
    analystId:'TEST-ANALYST',
    populationDefinition:'Entry commercial cannabis cultivation technicians performing routine crop-production work under established procedures and bounded authority.',
    operatingContexts:['indoor cultivation','greenhouse/protected cultivation'],
    jurisdictionNotes:'Synthetic regression fixture only; real validation must define intended operating jurisdictions and regulated task boundaries.',
    minimumRatingsPerTask:min,
    reviewers:Array.from({length:count},(_,i)=>({
      reviewerId:'R'+String(i+1).padStart(2,'0'),
      employerPerspective:i===0,
      cultivationRole:true,
      ratings:bp.taskFamilies.map((t,j)=>({
        taskFamilyId:t.id,
        frequency:3+((i+j)%2),
        importance:4,
        criticality:3+((i+j)%2),
        essential:true,
        disposition:j%3===0?'adapt':'keep'
      }))
    })),
    missingTaskFamilies:[{
      id:'JTA-ADD-CANNABIS-TRACEABILITY',
      label:'Cannabis-specific regulated plant and lot traceability',
      rationale:'Public crop occupations do not fully represent cannabis-specific regulated identity, lot genealogy and inventory-control obligations.',
      proposedCourseMappings:['COURSE-LH-TECH1-001','COURSE-LH-TECH1-006'],
      reviewerSupportCount:count
    }]
  };
}
function build(data,complete=true){
  const file=path.join(tmp,'input-'+Math.random().toString(16).slice(2)+'.json');
  fs.writeFileSync(file,JSON.stringify(data,null,2));
  const args=['scripts/build-job-task-analysis-evidence.mjs','--input',file];
  if(complete) args.push('--complete');
  const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});
  if(r.status!==0) throw new Error(r.stderr||r.stdout);
  return JSON.parse(r.stdout);
}

const good=build(payload(3,3));
if(good.record.status!=='complete'||good.coverageComplete!==true) throw new Error('sufficient JTA panel should produce complete aggregate evidence');
if(good.participantLevelDataCommitted!==false) throw new Error('JTA builder must not commit response-level data');
const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
const schema=JSON.parse(fs.readFileSync('schemas/job-task-analysis-evidence.schema.json','utf8'));
const validate=ajv.compile(schema);
if(!validate(good.record)) throw new Error('JTA schema failure: '+JSON.stringify(validate.errors));
if(good.record.taskFamilies.length!==bp.taskFamilies.length) throw new Error('JTA task-family coverage drift');
if(good.record.taskFamilies.some(x=>x.ratingsCount!==3)) throw new Error('JTA ratings count drift');

const small=build(payload(2,3));
if(small.record.status!=='preliminary'||small.coverageComplete!==false) throw new Error('under-minimum JTA panel must remain preliminary');

console.log('Structured JTA evidence: PASS (aggregate-only, exact baseline coverage, minimum-rater fail-closed).');
