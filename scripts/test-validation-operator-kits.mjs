import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thc-validation-kits-'));
const run=spawnSync(process.execPath,['scripts/build-validation-operator-kits.mjs','--write','--json','--out',dir],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.counts.pilot!==15) throw new Error('expected 15 pilot kits');
if(out.counts.accessibility!==15) throw new Error('expected 15 accessibility kits');
if(out.counts.calibration!==17) throw new Error('expected 17 calibration kits');
if(out.counts['occupational-validation']!==2) throw new Error('expected 2 occupational-validation kits');
if(out.counts['production-control']!==13) throw new Error('expected 13 production-control kits');
if(out.counts['candidate-governance']!==1) throw new Error('expected 1 candidate-governance kit');
if(out.kitCount!==63) throw new Error('expected 63 total validation operator kits, got '+out.kitCount);
for(const k of out.kits){
  for(const ext of ['md','json']){
    if(!fs.existsSync(path.join(dir,k.id+'.'+ext))) throw new Error(k.id+': missing '+ext+' kit');
  }
}
for(const file of fs.readdirSync(dir).filter(x=>x.startsWith('KIT-OCC-')&&x.endsWith('.json'))){
  const occ=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
  if(occ.sourceReviewCommand!=='npm run certification:sources:review:write') throw new Error(file+': occupational source review command missing');
  if(!Array.isArray(occ.sourceReviewPackets)||occ.sourceReviewPackets.length!==occ.currentCourseLocks.length) throw new Error(file+': occupational source review packets must match course locks');
  if(occ.occupationalSourceBaselineCommand!=='npm run certification:occupational-source-baseline:write') throw new Error(file+': occupational source baseline command missing');
  if(!occ.occupationalSourceBaselineId) throw new Error(file+': occupational source baseline id missing');
  if(occ.jtaEvidenceCommand!=='npm run evidence:build:jta -- --input <PRIVATE-JTA-RATINGS.json> --complete --write') throw new Error(file+': structured JTA evidence command missing');
}
const calFile=fs.readdirSync(dir).find(x=>x.startsWith('KIT-CAL-')&&x.endsWith('.json'));
const cal=JSON.parse(fs.readFileSync(path.join(dir,calFile),'utf8'));
if(!cal.privateInputTemplate||!cal.startCommand.includes('build-practical-calibration-evidence.mjs')) throw new Error('calibration kit missing private input workflow');
for(const file of fs.readdirSync(dir).filter(x=>x.startsWith('KIT-PILOT-')&&x.endsWith('.json'))){
  const kit=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
  if(kit.pilotIntakeManifest!=='registry/certification-pilot-intake-manifest.json') throw new Error(file+': pilot intake manifest missing');
  if(!kit.pilotIntakeLock?.courseVersion) throw new Error(file+': pilot exact-version lock missing');
}
for(const file of fs.readdirSync(dir).filter(x=>x.startsWith('KIT-CAL-')&&x.endsWith('.json'))){
  const kit=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
  if(kit.calibrationPacket && !fs.existsSync(kit.calibrationPacket)) throw new Error(file+': calibration packet path invalid');
}
for(const file of fs.readdirSync(dir).filter(x=>x.startsWith('KIT-OCC-')&&x.endsWith('.json'))){
  const kit=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
  if(!kit.panelInstrument?.panelCsv || !fs.existsSync(kit.panelInstrument.panelCsv)) throw new Error(file+': SME panel rating sheet missing');
  if(!kit.ratingAnalysisCommand?.includes('occupational:ratings:analyze')) throw new Error(file+': occupational rating analyzer missing');
}
const gov=JSON.parse(fs.readFileSync(path.join(dir,'KIT-CANDIDATE-GOVERNANCE-PRIVACY-LEGAL.json'),'utf8'));
if(gov.privacyLegalPreparationRegistry!=='registry/candidate-privacy-legal-review-preparation.json') throw new Error('candidate-governance privacy/legal preparation missing');
console.log('Validation operator kit generation: PASS (63 exact-version execution kits with integrated wave artifacts).');
