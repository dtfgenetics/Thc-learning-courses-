import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const controls=JSON.parse(fs.readFileSync(path.join(process.cwd(),'registry/candidate-governance-controls.json'),'utf8'));
if(controls.operationalUseAuthorized===true){
  const dir=path.join(process.cwd(),'content/candidate-governance-approvals');
  const rows=fs.existsSync(dir)?fs.readdirSync(dir).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'))):[];
  const approved=rows.find(x=>x.id===controls.appliedApprovalRecordId&&x.status==='approved'&&x.controlsId===controls.id&&String(x.controlsVersion)===String(controls.version));
  if(!approved) throw new Error('operationalUseAuthorized=true without matching applied approved governance record');
}else{
  if(controls.status==='approved') throw new Error('candidate governance controls cannot be status=approved while operationalUseAuthorized=false');
}
console.log('Candidate governance application boundary: PASS');
