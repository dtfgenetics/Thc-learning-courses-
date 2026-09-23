import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;},has=x=>args.includes(x),write=has('--write');
const sourceId=get('--source'),sourceFile=get('--source-file'),authority=get('--authority');
const extraRefs=(get('--evidence-ref')??'').split(',').map(x=>x.trim()).filter(Boolean);
if((!sourceId&&!sourceFile)||!authority||!has('--confirm-required-evidence')||!has('--confirm-findings-dispositioned')) throw new Error('Usage: --source <PRODEVID-ID> or --source-file <path> --authority <id> --confirm-required-evidence --confirm-findings-dispositioned [--evidence-ref ref,ref] [--write]');
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const source=sourceFile?JSON.parse(fs.readFileSync(path.resolve(root,sourceFile),'utf8')):readDir('content/production-control-evidence').find(x=>x.id===sourceId);
if(!source) throw new Error('Production evidence source not found');
if(source.status!=='in-progress') throw new Error('Source must be in-progress');
const contract=JSON.parse(fs.readFileSync(path.join(root,'registry/production-validation-evidence.json'),'utf8'));
const control=(contract.controls??[]).find(x=>x.id===source.controlId);if(!control)throw new Error('Unknown production control '+source.controlId);
const refs=[...new Set([...(source.evidenceRefs??[]),...extraRefs])];
if(refs.length===0) throw new Error('At least one safe evidence reference is required');
const now=new Date().toISOString(),record=structuredClone(source);
record.id=source.id+'-COMPLETE-'+now.replace(/[-:.TZ]/g,'').slice(0,14);
record.status='evidence-complete';record.authorityId=authority;record.observedAt=now;record.evidenceRefs=refs;record.findingsDispositioned=true;
record.summary='Evidence-complete production validation for '+source.controlId+' derived from '+source.id+'.';
record.limitations=[...(source.limitations??[]),'Evidence-complete does not itself advance live readiness gates; approval/application is separate.'];
if(write){const d=path.join(root,'content/production-control-evidence');const f=path.join(d,record.id+'.json');if(fs.existsSync(f))throw new Error('Refusing overwrite');fs.writeFileSync(f,JSON.stringify(record,null,2)+'\n');}
console.log(JSON.stringify({wroteFile:write,controlId:control.id,requiredEvidence:control.requiredEvidence??[],record},null,2));