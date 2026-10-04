import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thc-final-review-packets-'));
const run=spawnSync(process.execPath,['scripts/build-certification-final-review-packets.mjs','--write','--json','--out',dir],{cwd:process.cwd(),encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const out=JSON.parse(run.stdout);
if(out.packetCount!==13) throw new Error('expected 13 final review packets, got '+out.packetCount);
if(out.itemCount<13) throw new Error('unexpectedly low certification item count '+out.itemCount);
if(out.sourceIntegrityProblems!==0) throw new Error('final review packet source-integrity problems: '+out.sourceIntegrityProblems);
if(out.itemsWithAuthoritativeSources<out.itemCount) throw new Error('every current final item should expose at least one authoritative source in the review packet');
for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.json'))){
  const p=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
  if(!p.assessment?.id||!p.assessment?.version) throw new Error(name+': missing exact assessment anchor');
  if(p.items.length!==p.assessment.totalItems) throw new Error(name+': item count mismatch');
  for(const item of p.items){
    if(!item.id||item.version===undefined) throw new Error(name+': missing item exact-version anchor');
    if(!item.reviewCommand.includes('create-review-record.mjs')) throw new Error(name+': item review command missing');
    if(item.correct===undefined||!Array.isArray(item.choices)) throw new Error(name+': reviewer packet missing key/choices');
    if(!item.evidenceHealth||item.evidenceHealth.referenceCount<1) throw new Error(name+': item source health missing');
    if(item.evidenceHealth.authoritativeReferenceCount<1) throw new Error(name+': item lacks authoritative evidence in review packet');
    if(item.evidence.some(e=>e.resolved!==true)) throw new Error(name+': unresolved source in item review packet');
  }
}
console.log('Certification final review packet generation: PASS (13 finals, '+out.itemCount+' exact current items).');
