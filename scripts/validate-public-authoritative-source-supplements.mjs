import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root=process.cwd();
const errors=[];
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>read(path.join(rel,n)));};

const schema=read('schemas/public-authoritative-source-supplements.schema.json');
const registry=read('registry/public-authoritative-source-supplements.json');
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const modules=new Map(readDir('content/modules').map(x=>[x.id,x]));
const lessons=new Map(readDir('content/lessons').map(x=>[x.id,x]));
const refs=new Map(readDir('content/references').map(x=>[x.id,x]));

const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
const validate=ajv.compile(schema);
if(!validate(registry)){
  for(const e of validate.errors??[]) errors.push('registry/public-authoritative-source-supplements.json'+(e.instancePath||'/')+': '+e.message);
}

const courseLessonIds=new Map();
for(const [courseId,course] of courses){
  const ids=new Set();
  for(const mid of course.modules??[]){
    const mod=modules.get(mid);
    for(const lid of mod?.lessons??[]) ids.add(lid);
  }
  courseLessonIds.set(courseId,ids);
}
const mappingKeys=new Set();
for(const m of registry.mappings??[]){
  const key=m.courseId+'|'+m.lessonId+'|'+m.lessonVersion;
  if(mappingKeys.has(key)) errors.push('duplicate supplement mapping '+key); else mappingKeys.add(key);
  const course=courses.get(m.courseId);
  const lesson=lessons.get(m.lessonId);
  if(!course) errors.push(m.lessonId+': unknown course '+m.courseId);
  if(!lesson) errors.push(m.lessonId+': missing lesson');
  else if(String(lesson.version)!==String(m.lessonVersion)) errors.push(m.lessonId+': stale lessonVersion '+m.lessonVersion+'; current='+lesson.version);
  if(course&&!courseLessonIds.get(m.courseId)?.has(m.lessonId)) errors.push(m.lessonId+': not contained in mapped course '+m.courseId);
  for(const id of m.sourceIds??[]){
    const r=refs.get(id);
    if(!r){errors.push(m.lessonId+': missing source '+id);continue;}
    if(!['reviewed','reviewed-source'].includes(r.status)) errors.push(m.lessonId+': supplemental source '+id+' is not reviewed');
    if(!r.url?.startsWith('https://')) errors.push(m.lessonId+': supplemental source '+id+' lacks HTTPS URL');
  }
}

if(errors.length){
  console.error('Public authoritative source supplement validation failed:');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}
console.log('Public authoritative source supplement validation passed: '+(registry.mappings??[]).length+' exact-version mapping(s).');
