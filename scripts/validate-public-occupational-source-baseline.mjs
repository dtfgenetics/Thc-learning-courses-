import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const errors=[];
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=rel=>{
  const d=path.join(root,rel);
  if(!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>read(path.join(rel,n)));
};
const baseline=read('registry/public-occupational-source-baseline.json');
const programs=new Map(readDir('content/credential-programs').filter(x=>x.id).map(x=>[x.id,x]));
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const refs=new Map(readDir('content/references').map(x=>[x.id,x]));

if((baseline.programs??[]).length!==2) errors.push('baseline must contain exactly two canonical credential programs');
const ids=new Set();
for(const p of baseline.programs??[]){
  if(ids.has(p.credentialProgramId)) errors.push('duplicate program '+p.credentialProgramId);
  ids.add(p.credentialProgramId);
  const current=programs.get(p.credentialProgramId);
  if(!current){errors.push('unknown credential program '+p.credentialProgramId);continue;}
  if(String(current.version)!==String(p.credentialProgramVersion)) errors.push(p.credentialProgramId+': baseline version '+p.credentialProgramVersion+' is stale; current='+current.version);
  const required=new Set(current.requiredCourses??[]);
  const sourceSet=new Set(p.sourceIds??[]);
  for(const sid of p.sourceIds??[]){
    const r=refs.get(sid);
    if(!r) errors.push(p.credentialProgramId+': missing source '+sid);
    else{
      if(!['reviewed','reviewed-source'].includes(r.status)) errors.push(sid+': occupational source must be reviewed');
      if(typeof r.url!=='string'||!r.url.startsWith('https://')) errors.push(sid+': occupational source must use HTTPS public URL');
    }
  }
  const familyIds=new Set();
  for(const f of p.taskFamilies??[]){
    if(familyIds.has(f.id)) errors.push(p.credentialProgramId+': duplicate task family '+f.id);
    familyIds.add(f.id);
    for(const sid of f.sourceSupport??[]){
      if(!sourceSet.has(sid)) errors.push(f.id+': source '+sid+' must be listed in program sourceIds');
    }
    for(const cid of f.courseMappings??[]){
      if(!required.has(cid)) errors.push(f.id+': course '+cid+' is outside '+p.credentialProgramId);
      if(!courses.has(cid)) errors.push(f.id+': mapped course missing '+cid);
    }
  }
  for(const cid of required){
    const covered=(p.taskFamilies??[]).some(f=>(f.courseMappings??[]).includes(cid));
    if(!covered) errors.push(p.credentialProgramId+': required course '+cid+' is not represented in any public occupational task family');
  }
}
if(!ids.has('CREDPROG-CULT-TECH-I-001')) errors.push('Technician I baseline missing');
if(!ids.has('CREDPROG-CULT-TECH-II-001')) errors.push('Technician II baseline missing');

if(errors.length){
  console.error('Public occupational source baseline validation failed:');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}
console.log('Public occupational source baseline validation passed. 2 programs checked.');
