import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const has=x=>args.includes(x);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const write=has('--write');
const asJson=has('--json');
const check=has('--check');
const outDir=path.resolve(root,get('--out')??'generated/certification-source-review-packets');

const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=rel=>{
  const d=path.join(root,rel);
  if(!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>read(path.join(rel,n)));
};
const exists=rel=>fs.existsSync(path.join(root,rel));

const execution=read('registry/certification-validation-execution.json');
const supplements=read('registry/public-authoritative-source-supplements.json');
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const modules=new Map(readDir('content/modules').map(x=>[x.id,x]));
const lessons=new Map(readDir('content/lessons').map(x=>[x.id,x]));
const references=new Map(readDir('content/references').map(x=>[x.id,x]));

const authoritativeLevels=new Set(['standards-government','peer-reviewed','university-extension','standard','A','B']);
const authoritativeTypes=new Set(['government','standard','journal','peer-reviewed-study','peer-reviewed-review','extension']);
const problems=[];
const packets=[];

function sourceView(id){
  const r=references.get(id);
  if(!r) return {id,missing:true};
  return {
    id:r.id,
    title:r.title,
    type:r.type,
    publisher:r.publisher??null,
    year:r.year??null,
    status:r.status,
    evidenceLevel:r.evidenceLevel,
    authoritative:authoritativeLevels.has(r.evidenceLevel)||authoritativeTypes.has(r.type),
    url:r.url??null,
    lastVerifiedAt:r.lastVerifiedAt??null,
    sourceRevisionDate:r.sourceRevisionDate??null,
    supportsDomains:r.supportsDomains??[],
    notes:r.notes??null
  };
}

const supplementByLesson=new Map();
for(const m of supplements.mappings??[]){
  const key=m.lessonId;
  if(!supplementByLesson.has(key)) supplementByLesson.set(key,[]);
  supplementByLesson.get(key).push(m);
  const lesson=lessons.get(m.lessonId);
  if(!lesson) problems.push(`${m.lessonId}: source supplement maps missing lesson`);
  else if(String(lesson.version)!==String(m.lessonVersion)) problems.push(`${m.lessonId}: source supplement version ${m.lessonVersion} is stale; current=${lesson.version}`);
  const course=courses.get(m.courseId);
  if(!course) problems.push(`${m.lessonId}: source supplement maps missing course ${m.courseId}`);
  for(const id of m.sourceIds??[]) if(!references.has(id)) problems.push(`${m.lessonId}: source supplement references missing source ${id}`);
}

for(const row of execution.courses??[]){
  const course=courses.get(row.courseId);
  if(!course){problems.push(`${row.courseId}: missing canonical course`);continue;}
  const lessonIds=[];
  for(const moduleId of course.modules??[]){
    const mod=modules.get(moduleId);
    if(!mod){problems.push(`${course.id}: missing module ${moduleId}`);continue;}
    for(const lessonId of mod.lessons??[]) if(!lessonIds.includes(lessonId)) lessonIds.push(lessonId);
  }

  const lessonRows=[];
  for(const lessonId of lessonIds){
    const lesson=lessons.get(lessonId);
    if(!lesson){problems.push(`${course.id}: missing lesson ${lessonId}`);continue;}
    const direct=(lesson.references??[]).map(sourceView);
    for(const s of direct) if(s.missing) problems.push(`${lesson.id}: unresolved direct reference ${s.id}`);
    const supplemental=(supplementByLesson.get(lesson.id)??[]).flatMap(m=>(m.sourceIds??[]).map(sourceView));
    const uniqueSupplemental=[...new Map(supplemental.map(s=>[s.id,s])).values()];
    const all=[...new Map([...direct,...uniqueSupplemental].map(s=>[s.id,s])).values()];
    lessonRows.push({
      lessonId:lesson.id,
      lessonVersion:String(lesson.version),
      title:lesson.title,
      directReferenceCount:direct.length,
      directAuthoritativeCount:direct.filter(s=>s.authoritative).length,
      supplementalReferenceCount:uniqueSupplemental.length,
      combinedAuthoritativeCount:all.filter(s=>s.authoritative).length,
      directReferences:direct,
      supplementalSources:uniqueSupplemental,
      supplementReviewUse:(supplementByLesson.get(lesson.id)??[]).flatMap(m=>m.reviewUse??[])
    });
  }

  const uniqueRefs=[...new Map(lessonRows.flatMap(x=>[...x.directReferences,...x.supplementalSources]).map(s=>[s.id,s])).values()];
  packets.push({
    courseId:course.id,
    courseVersion:String(course.version),
    title:course.title,
    track:row.track,
    ordinal:row.ordinal,
    lessonCount:lessonRows.length,
    lessonsWithDirectReferences:lessonRows.filter(x=>x.directReferenceCount>0).length,
    lessonsWithDirectAuthoritativeSources:lessonRows.filter(x=>x.directAuthoritativeCount>0).length,
    lessonsWithSupplementalSources:lessonRows.filter(x=>x.supplementalReferenceCount>0).length,
    uniqueReferenceCount:uniqueRefs.length,
    authoritativeReferenceCount:uniqueRefs.filter(x=>x.authoritative).length,
    verifiedAuthoritativeReferenceCount:uniqueRefs.filter(x=>x.authoritative&&x.lastVerifiedAt).length,
    lessons:lessonRows
  });
}

function md(p){
  const lines=[
    '# Certification Source Review Packet — '+p.courseId,'',
    'Course: '+p.courseId+'@'+p.courseVersion,
    'Title: '+p.title,
    'Track: '+p.track,
    'Lessons: '+p.lessonCount,
    'Lessons with direct references: '+p.lessonsWithDirectReferences+'/'+p.lessonCount,
    'Lessons with direct authoritative sources: '+p.lessonsWithDirectAuthoritativeSources+'/'+p.lessonCount,
    'Lessons with public-source supplements: '+p.lessonsWithSupplementalSources,
    'Unique sources represented: '+p.uniqueReferenceCount,
    'Authoritative sources represented: '+p.authoritativeReferenceCount,
    'Authoritative sources with verification timestamps: '+p.verifiedAuthoritativeReferenceCount,'',
    '## Lesson review index',''
  ];
  for(const l of p.lessons){
    lines.push(
      '### '+l.lessonId+'@'+l.lessonVersion+' — '+l.title,'',
      '- Direct references: '+l.directReferenceCount,
      '- Direct authoritative: '+l.directAuthoritativeCount,
      '- Supplemental reviewed public sources: '+l.supplementalReferenceCount
    );
    if(l.supplementReviewUse.length){
      lines.push('- Supplemental review use:');
      for(const x of l.supplementReviewUse) lines.push('  - '+x);
    }
    lines.push('- Sources:');
    for(const s of [...l.directReferences,...l.supplementalSources]){
      lines.push('  - '+s.id+' — '+(s.title??'MISSING')+'; '+(s.evidenceLevel??'missing')+'; verified='+(s.lastVerifiedAt??'not-recorded'));
    }
    lines.push('');
  }
  lines.push(
    '## Integrity boundary','',
    'This packet assembles source provenance for technical review. A reviewed source is not the same as an approved lesson. Supplemental mappings do not change published lesson content or its exact-version review state. Any lesson-content change must follow the normal versioned review workflow.',''
  );
  return lines.join('\n');
}

if(write){
  fs.mkdirSync(outDir,{recursive:true});
  for(const p of packets){
    fs.writeFileSync(path.join(outDir,p.courseId+'.json'),JSON.stringify(p,null,2)+'\n');
    fs.writeFileSync(path.join(outDir,p.courseId+'.md'),md(p));
  }
}
const summary={
  canonicalCourses:packets.length,
  lessons:packets.reduce((n,p)=>n+p.lessonCount,0),
  lessonsWithDirectReferences:packets.reduce((n,p)=>n+p.lessonsWithDirectReferences,0),
  lessonsWithDirectAuthoritativeSources:packets.reduce((n,p)=>n+p.lessonsWithDirectAuthoritativeSources,0),
  lessonsWithSupplementalSources:packets.reduce((n,p)=>n+p.lessonsWithSupplementalSources,0),
  sourceIntegrityProblems:problems.length
};
const out={summary,problems,wroteFiles:write,outputDirectory:path.relative(root,outDir),courses:packets.map(p=>({
  courseId:p.courseId,courseVersion:p.courseVersion,lessonCount:p.lessonCount,
  lessonsWithDirectAuthoritativeSources:p.lessonsWithDirectAuthoritativeSources,
  lessonsWithSupplementalSources:p.lessonsWithSupplementalSources,
  authoritativeReferenceCount:p.authoritativeReferenceCount,
  verifiedAuthoritativeReferenceCount:p.verifiedAuthoritativeReferenceCount
}))};
if(asJson) console.log(JSON.stringify(out,null,2));
else{
  console.log('Certification public-source review');
  console.log('Canonical courses: '+summary.canonicalCourses+'/15');
  console.log('Lessons: '+summary.lessons);
  console.log('Lessons with direct references: '+summary.lessonsWithDirectReferences);
  console.log('Lessons with direct authoritative sources: '+summary.lessonsWithDirectAuthoritativeSources);
  console.log('Supplemented lessons: '+summary.lessonsWithSupplementalSources);
  console.log('Source integrity problems: '+summary.sourceIntegrityProblems);
  if(problems.length){for(const p of problems) console.log('- '+p);}
}
if(check&&problems.length) process.exitCode=1;
