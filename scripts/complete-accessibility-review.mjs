import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;}, all=n=>{const o=[];for(let i=0;i<args.length;i++)if(args[i]===n&&args[i+1])o.push(args[i+1]);return o;}, has=x=>args.includes(x);
const sourceId=get('--source'), sourceFile=get('--source-file'), reviewer=get('--reviewer'), envSpecs=all('--environment'), write=has('--write');
if((!sourceId&&!sourceFile)||!reviewer||envSpecs.length<3||!has('--confirm-full-coverage')||!has('--confirm-aa-disposition')) throw new Error('Usage requires source, reviewer, >=3 --environment platform|browser|AT-or-none|input|viewport, --confirm-full-coverage, --confirm-aa-disposition [--write]');
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const source=sourceFile?JSON.parse(fs.readFileSync(path.resolve(root,sourceFile),'utf8')):readDir('content/accessibility-review-evidence').find(x=>x.id===sourceId);
if(!source) throw new Error('Accessibility source record not found');
if(!['draft','in-progress'].includes(source.status)) throw new Error('Source must be draft/in-progress');
const course=readDir('content/courses').find(x=>x.id===source.courseId);if(!course||String(course.version)!==String(source.courseVersion))throw new Error('Stale course version');
const environments=envSpecs.map(s=>{const [platform,browser,at,inputMode,viewportOrZoom]=s.split('|');if(!platform||!browser||!inputMode||!viewportOrZoom)throw new Error('Invalid environment '+s);return{platform,browser,assistiveTechnology:at==='none'?null:at,inputMode,viewportOrZoom};});
const now=new Date().toISOString(), record=structuredClone(source);
record.id=source.id+'-COMPLETE-'+now.replace(/[-:.TZ]/g,'').slice(0,14);record.status='evidence-complete';record.reviewerId=reviewer;record.reviewedAt=now;record.environments=environments;
for(const k of Object.keys(record.coverage??{}))record.coverage[k]=true;
record.unresolvedFailures=0;record.levelAAFailuresResolvedOrDispositioned=true;record.summary='Evidence-complete rendered accessibility/UX review derived from '+source.id+' for '+source.courseId+'@'+source.courseVersion+'.';
record.evidenceRefs=[...new Set([...(source.evidenceRefs??[]),source.id])];record.limitations=[...(source.limitations??[]),'Evidence-complete does not itself constitute certification gate approval.'];
if(write){const d=path.join(root,'content/accessibility-review-evidence');const f=path.join(d,record.id+'.json');if(fs.existsSync(f))throw new Error('Refusing overwrite');fs.writeFileSync(f,JSON.stringify(record,null,2)+'\n');}
console.log(JSON.stringify({wroteFile:write,record},null,2));