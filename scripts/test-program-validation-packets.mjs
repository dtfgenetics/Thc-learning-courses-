import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thc-program-packets-'));
const run=spawnSync(process.execPath,['scripts/build-program-validation-packets.mjs','--write','--json','--out',dir],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.packetCount!==3) throw new Error('expected 3 program/governance packets');
if(out.counts['occupational-program-validation']!==2) throw new Error('expected two occupational packets');
if(out.counts['candidate-governance']!==1) throw new Error('expected one candidate-governance packet');
for(const p of out.packets){
  if(!fs.existsSync(path.join(dir,p.id+'.md'))||!fs.existsSync(path.join(dir,p.id+'.json'))) throw new Error(p.id+': missing generated packet');
}
for(const id of ['PROGRAMVAL-CULT-TECH-I-001','PROGRAMVAL-CULT-TECH-II-001']){
  const packet=JSON.parse(fs.readFileSync(path.join(dir,id+'.json'),'utf8'));
  if(packet.sourceReviewCommand!=='npm run certification:sources:review:write') throw new Error(id+': source review command missing');
  if(packet.sourceReviewPackets.length!==packet.courseLocks.length) throw new Error(id+': source review packet count must match course locks');
  if(!packet.sections.technicalCurriculumReview.some(x=>/source-review packet/i.test(x))) throw new Error(id+': technical review source packet requirement missing');
  if(packet.occupationalSourceBaselineCommand!=='npm run certification:occupational-source-baseline:write') throw new Error(id+': occupational source baseline command missing');
  if(!packet.occupationalSourceBaselinePacket?.includes('generated/occupational-source-baseline/OCCSRC-')) throw new Error(id+': occupational source baseline packet missing');
  if(!packet.sections.jobTaskAnalysis.some(x=>/O\*NET\/BLS|occupational-source baseline/i.test(x))) throw new Error(id+': JTA public occupational source review requirement missing');
  if(packet.jtaEvidenceCommand!=='npm run evidence:build:jta -- --input <PRIVATE-JTA-RATINGS.json> --complete --write') throw new Error(id+': structured JTA evidence command missing');
}
const gov=JSON.parse(fs.readFileSync(path.join(dir,'CANDIDATEGOV-001.json'),'utf8'));
if(gov.unresolvedDecisions.finalAttemptLimit!==null||gov.unresolvedDecisions.waitingPeriodHours!==null||gov.unresolvedDecisions.feePolicy!==null) throw new Error('candidate governance packet fabricated unresolved policy values');
console.log('Program validation packet generation: PASS (2 occupational + 1 candidate governance).');
