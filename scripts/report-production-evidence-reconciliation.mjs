import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=new Set(process.argv.slice(2));
const read=(rel)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=(rel)=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};

const contract=read('registry/production-validation-evidence.json');
const readiness=read('registry/system-readiness.json');
const evidence=readDir('content/production-control-evidence');

const rows=[];
const problems=[];
for(const control of contract.controls??[]){
  const records=evidence
    .filter(x=>x.controlId===control.id&&x.status!=='invalidated')
    .sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt));
  const latest=records[0]??null;
  const status=latest?.status??'pending';
  const mapped=(control.readiness??[]).map(([area,gate])=>({
    area,gate,committed:Boolean(readiness.areas?.[area]?.gates?.[gate])
  }));
  const shouldBeTrue=status==='approved';
  for(const m of mapped){
    if(m.committed!==shouldBeTrue){
      problems.push(`${control.id}: readiness ${m.area}.${m.gate}=${m.committed} but exact evidence state is ${status}`);
    }
  }
  rows.push({
    controlId:control.id,
    evidenceStatus:status,
    latestEvidenceId:latest?.id??null,
    observedAt:latest?.observedAt??null,
    requiredEvidenceCount:(control.requiredEvidence??[]).length,
    referencedEvidenceCount:(latest?.evidenceRefs??[]).length,
    findingsDispositioned:latest?.findingsDispositioned??false,
    readiness:mapped
  });
}

const summary={
  controls:rows.length,
  approved:rows.filter(x=>x.evidenceStatus==='approved').length,
  evidenceComplete:rows.filter(x=>x.evidenceStatus==='evidence-complete').length,
  pending:rows.filter(x=>x.evidenceStatus==='pending').length,
  inProgress:rows.filter(x=>x.evidenceStatus==='in-progress').length,
  revisionRequired:rows.filter(x=>x.evidenceStatus==='revision-required').length
};
const out={summary,structuralProblems:problems,controls:rows};
console.log(JSON.stringify(out,null,2));
if(args.has('--check')&&problems.length) process.exitCode=1;
