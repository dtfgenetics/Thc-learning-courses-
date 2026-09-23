import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;},has=x=>args.includes(x),write=has('--write');
const sourceId=get('--source'),sourceFile=get('--source-file'),authority=get('--authority'),decisionNotes=get('--decision-notes');
if((!sourceId&&!sourceFile)||!authority||!decisionNotes||!has('--confirm-live-verification')||!has('--confirm-apply-readiness')) throw new Error('Usage: --source <PRODEVID-ID> or --source-file <path> --authority <id> --decision-notes <text> --confirm-live-verification --confirm-apply-readiness [--write]');
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const source=sourceFile?JSON.parse(fs.readFileSync(path.resolve(root,sourceFile),'utf8')):readDir('content/production-control-evidence').find(x=>x.id===sourceId);
if(!source)throw new Error('Production evidence source not found');
if(source.status!=='evidence-complete')throw new Error('Production evidence must be evidence-complete before approval');
if(source.findingsDispositioned!==true||!(source.evidenceRefs??[]).length)throw new Error('Evidence-complete source is missing findings disposition or evidence refs');

const contractPath=path.join(root,'registry/production-validation-evidence.json');
const readinessPath=path.join(root,'registry/system-readiness.json');
const contract=JSON.parse(fs.readFileSync(contractPath,'utf8'));
const readiness=JSON.parse(fs.readFileSync(readinessPath,'utf8'));
const control=(contract.controls??[]).find(x=>x.id===source.controlId);if(!control)throw new Error('Unknown production control '+source.controlId);

for(const [area,gate] of control.readiness??[]){
  if(readiness.areas?.[area]?.gates?.[gate]===undefined) throw new Error('Missing readiness mapping '+area+'.'+gate);
}

const now=new Date().toISOString(),record=structuredClone(source);
record.id=source.id+'-APPROVED-'+now.replace(/[-:.TZ]/g,'').slice(0,14);record.status='approved';record.authorityId=authority;record.observedAt=now;
record.summary='Approved deployment-backed production validation for '+source.controlId+'; mapped readiness gates applied.';
record.limitations=[...(source.limitations??[]),'Approval applies only to the referenced live environment/control evidence and current production validation contract.','Decision: '+decisionNotes];

const nextContract=structuredClone(contract);
const target=nextContract.controls.find(x=>x.id===source.controlId);
target.status='approved';target.evidenceRefs=[...new Set([...(target.evidenceRefs??[]),record.id,...record.evidenceRefs])];
nextContract.updated=now.slice(0,10);
nextContract.status=nextContract.controls.every(x=>x.status==='approved')?'approved':'evidence-in-progress';

const nextReadiness=structuredClone(readiness);
for(const [area,gate] of control.readiness??[]) nextReadiness.areas[area].gates[gate]=true;
nextReadiness.updatedAt=now.slice(0,10);
nextReadiness.productionReady=false;

if(write){
  const d=path.join(root,'content/production-control-evidence');const f=path.join(d,record.id+'.json');if(fs.existsSync(f))throw new Error('Refusing overwrite');
  fs.writeFileSync(f,JSON.stringify(record,null,2)+'\n');
  fs.writeFileSync(contractPath,JSON.stringify(nextContract,null,2)+'\n');
  fs.writeFileSync(readinessPath,JSON.stringify(nextReadiness,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,record,readinessApplied:(control.readiness??[]).map(([area,gate])=>area+'.'+gate),contractStatus:nextContract.status},null,2));