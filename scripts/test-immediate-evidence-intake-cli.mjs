import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ajv=new Ajv2020({allErrors:true,strict:false});
addFormats(ajv);
const compile=(p)=>ajv.compile(JSON.parse(fs.readFileSync(p,'utf8')));

const cases=[
  {
    name:'pilot',
    script:'scripts/create-course-pilot-execution-record.mjs',
    args:['--course','COURSE-LH-TECH1-001','--pilot-id','TEST-PILOT','--cohorts','1','--participants','12','--authority','TEST-PILOT-LEAD'],
    validate:compile('schemas/course-pilot-execution-evidence.schema.json'),
    assert:r=>{
      if(r.status!=='collecting') throw new Error('pilot intake must start collecting');
      if(r.participantCount!==12) throw new Error('pilot participant count drift');
      if(r.learnerFeedbackCollected!==false||r.dataQualityReviewed!==false) throw new Error('pilot intake fabricated completion');
    }
  },
  {
    name:'accessibility',
    script:'scripts/create-accessibility-review-record.mjs',
    args:['--course','COURSE-LH-TECH1-001','--build','test-build-001','--reviewer','TEST-A11Y','--platform','Windows','--browser','Chrome','--input','keyboard','--viewport','1280px / 200%','--at','NVDA','--known-failures','0'],
    validate:compile('schemas/rendered-accessibility-review-evidence.schema.json'),
    assert:r=>{
      if(r.status!=='in-progress') throw new Error('accessibility intake must start in-progress');
      if(Object.values(r.coverage).some(Boolean)) throw new Error('accessibility intake fabricated completed coverage');
      if(r.levelAAFailuresResolvedOrDispositioned!==false) throw new Error('accessibility intake fabricated disposition');
    }
  },
  {
    name:'occupational',
    script:'scripts/create-occupational-program-validation-record.mjs',
    args:['--program','CREDPROG-CULT-TECH-I-001','--authority','TEST-PROGRAM-LEAD'],
    validate:compile('schemas/occupational-program-validation-evidence.schema.json'),
    assert:r=>{
      if(r.status!=='in-progress') throw new Error('occupational intake must start in-progress');
      if(r.technicalCurriculumReview.allCurrentCourseVersionsReviewed!==false) throw new Error('occupational intake fabricated technical review');
      if(r.performanceValidation.practicalsExpected<1) throw new Error('occupational intake failed to derive practical coverage');
    }
  },
  {
    name:'production',
    script:'scripts/create-production-control-evidence-record.mjs',
    args:['--control','backup-restore','--environment','production','--authority','TEST-PLATFORM-LEAD','--evidence-ref','TEST-RUN-001'],
    validate:compile('schemas/production-control-evidence.schema.json'),
    assert:r=>{
      if(r.status!=='in-progress') throw new Error('production intake must start in-progress');
      if(r.findingsDispositioned!==false) throw new Error('production intake fabricated findings disposition');
    }
  }
];

for(const tc of cases){
  const run=spawnSync(process.execPath,[tc.script,...tc.args],{cwd:process.cwd(),encoding:'utf8'});
  if(run.status!==0) throw new Error(`${tc.name} intake failed: ${run.stderr||run.stdout}`);
  const record=JSON.parse(run.stdout);
  if(!tc.validate(record)) throw new Error(`${tc.name} schema failure: ${JSON.stringify(tc.validate.errors)}`);
  tc.assert(record);
}
console.log('Immediate evidence intake CLI: PASS (pilot, accessibility, occupational and production records are exact-schema, fail-open=false starters).');
