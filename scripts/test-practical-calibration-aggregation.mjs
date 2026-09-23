import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'thc-calibration-test-'));
const input=path.join(tempDir,'ratings.json');
const payload={
  assessmentId:'PRACTICAL-LH-TECH1-001-WORKFLOW',
  assessmentVersion:'1.1.0',
  calibrationId:'TEST-COURSE1-V110',
  analystId:'test-analyst',
  completedAt:'2026-09-23T12:00:00Z',
  ratings:[
    {sampleId:'SAMPLE-A',assessorId:'A1',totalScore:90,criticalError:false,domainScores:{Safety:18,Records:14}},
    {sampleId:'SAMPLE-A',assessorId:'A2',totalScore:88,criticalError:false,domainScores:{Safety:17,Records:14}},
    {sampleId:'SAMPLE-A',assessorId:'A3',totalScore:90,criticalError:true,domainScores:{Safety:18,Records:13}},
    {sampleId:'SAMPLE-B',assessorId:'A1',totalScore:70,criticalError:false,domainScores:{Safety:12,Records:10}},
    {sampleId:'SAMPLE-B',assessorId:'A2',totalScore:70,criticalError:false,domainScores:{Safety:12,Records:10}}
  ]
};
fs.writeFileSync(input,JSON.stringify(payload));

const run=spawnSync(process.execPath,['scripts/build-practical-calibration-evidence.mjs','--input',input,'--complete'],{
  cwd:process.cwd(),encoding:'utf8'
});
fs.rmSync(tempDir,{recursive:true,force:true});
if(run.status!==0) throw new Error(`aggregator failed: ${run.stderr||run.stdout}`);
const out=JSON.parse(run.stdout);
const r=out.record;
if(r.status!=='complete') throw new Error('expected complete status');
if(r.sampleCount!==2) throw new Error(`expected 2 samples, got ${r.sampleCount}`);
if(r.assessorCount!==3) throw new Error(`expected 3 assessors, got ${r.assessorCount}`);
if(r.pairCount!==4) throw new Error(`expected 4 assessor pairs, got ${r.pairCount}`);
if(r.unresolvedCriticalErrorDisagreements!==2) throw new Error(`expected 2 critical-error disagreements, got ${r.unresolvedCriticalErrorDisagreements}`);
if(Math.abs(r.criticalErrorAgreement-0.5)>1e-12) throw new Error(`expected critical-error agreement 0.5, got ${r.criticalErrorAgreement}`);
if(r.domains.length!==2) throw new Error(`expected two domain rows, got ${r.domains.length}`);
if(out.participantOrCandidateLevelDataCommitted!==false) throw new Error('output must state candidate-level data are not committed');
console.log('Practical calibration aggregation test passed.');
