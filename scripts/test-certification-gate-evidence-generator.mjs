import {spawnSync} from 'node:child_process';

const run=spawnSync(process.execPath,[
  'scripts/create-certification-gate-evidence-record.mjs',
  '--course','COURSE-LH-TECH1-001',
  '--gate','pilotExecution',
  '--status','in-progress',
  '--authority','test-authority',
  '--summary','Test record only; not written.'
],{cwd:process.cwd(),encoding:'utf8'});

if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.wroteFile!==false) throw new Error('generator must not write without --write');
if(out.record.courseId!=='COURSE-LH-TECH1-001') throw new Error('course mismatch');
if(out.record.gate!=='pilotExecution') throw new Error('gate mismatch');
if(out.record.status!=='in-progress') throw new Error('status mismatch');
if(!out.record.courseVersion) throw new Error('current course version missing');
console.log('Certification gate evidence generator test passed.');
