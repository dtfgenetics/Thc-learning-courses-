import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root=process.cwd();
const course=JSON.parse(fs.readFileSync('content/courses/COURSE-LH-TECH1-007.json','utf8'));
const ids=[...new Set([
  ...(course.extensions?.credentialPracticalSetRequired??[]),
  ...(course.extensions?.mappedPerformanceAssessments??[]),
  ...(course.extensions?.capstoneRequired?[course.extensions.capstoneRequired]:[])
])];
if(ids.length!==7) throw new Error('expected six Technician I practicals plus capstone');

const args=['scripts/create-integrated-performance-standard-setting-record.mjs','--course',course.id,'--panelists','3','--authority','TEST-PERFORMANCE-PANEL'];
for(const id of ids) args.push('--component',id+'|80');
const run=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const record=JSON.parse(run.stdout).record;

const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
const schema=JSON.parse(fs.readFileSync('schemas/integrated-performance-standard-setting-evidence.schema.json','utf8'));
const validate=ajv.compile(schema);
if(!validate(record)) throw new Error(JSON.stringify(validate.errors));
if(record.status!=='panel-complete'||record.governanceDecision.decision!=='pending') throw new Error('intake fabricated governance approval');
if(record.components.length!==7) throw new Error('component coverage mismatch');

function json(script,args=[]){
  const r=spawnSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8'});
  if(r.status!==0) throw new Error(r.stderr||r.stdout);
  return JSON.parse(r.stdout);
}
const rec=json('scripts/report-certification-evidence-reconciliation.mjs',['--json']);
for(const id of ['COURSE-LH-TECH1-007','COURSE-LH-TECH2-008']){
  const row=rec.courses.find(x=>x.courseId===id);
  if(!row) throw new Error('missing reconciled course '+id);
  if(row.gates.standardSetting.status==='not-applicable') throw new Error(id+': standard setting incorrectly not-applicable');
  if(row.gates.standardSetting.detail?.standardSettingModel!=='integrated-performance-decision-rule') throw new Error(id+': wrong standard-setting model');
}
const queue=json('scripts/report-certification-execution-work-queue.mjs',['--json']);
for(const id of ['COURSE-LH-TECH1-007','COURSE-LH-TECH2-008']){
  const work=queue.all.find(x=>x.courseId===id&&x.gate==='standardSetting');
  if(!work) throw new Error(id+': standard-setting work item missing');
  const cal=work.dependencies.find(x=>x.gate==='practicalAssessorCalibration');
  if(!cal) throw new Error(id+': integrated standard setting must depend on assessor calibration');
}
console.log('Integrated performance standard setting: PASS (2 integrated courses applicable; calibration prerequisite enforced).');
