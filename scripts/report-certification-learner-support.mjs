import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const readJson=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists=(p)=>fs.existsSync(path.join(root,p));
const readText=(p)=>exists(p)?fs.readFileSync(path.join(root,p),'utf8'):'';

const canonical=[
  ...Array.from({length:7},(_,i)=>`COURSE-LH-TECH1-${String(i+1).padStart(3,'0')}`),
  ...Array.from({length:8},(_,i)=>`COURSE-LH-TECH2-${String(i+1).padStart(3,'0')}`)
];
const downloadDir=path.join(root,'content/downloads');
const downloadRecords=fs.readdirSync(downloadDir)
  .filter((name)=>name.endsWith('.json'))
  .map((name)=>readJson(`content/downloads/${name}`));

const rows=[];
for(const courseId of canonical){
  const course=readJson(`content/courses/${courseId}.json`);
  const dedicatedModules=(course.modules??[]).filter(id=>id.startsWith(courseId.replace('COURSE-','MOD-')));
  const lessonIds=[];
  for(const moduleId of dedicatedModules){
    const modulePath=`content/modules/${moduleId}.json`;
    if(!exists(modulePath)) continue;
    const module=readJson(modulePath);
    for(const lessonId of module.lessons??[]) if(!lessonIds.includes(lessonId)) lessonIds.push(lessonId);
  }

  let workedExamples=0, commonMistakes=0, practicalApplications=0, scenarios=0, images=0, resources=0, tables=0;
  for(const lessonId of lessonIds){
    const lesson=readJson(`content/lessons/${lessonId}.json`);
    const content=lesson.content??{};
    workedExamples+=(content.workedExamples??[]).length;
    commonMistakes+=(content.commonMistakes??[]).length;
    if(content.practicalApplication) practicalApplications++;
    for(const block of content.blocks??[]){
      if(block.type==='scenario') scenarios++;
      if(block.type==='image') images++;
      if(block.type==='resource') resources++;
      if(block.type==='table' || block.type==='comparison') tables++;
      if(['activity','steps','document'].includes(block.type)) practicalApplications++;
    }
  }

  const parts=courseId.split('-');
  const tier=parts[2].toLowerCase();
  const num=parts[3];
  const base=`docs/learning-hub/${tier}/course-${num}`;
  const learnerCandidates=[
    `${base}/LEARNER-MATERIALS.md`,
    `${base}/LEARNER-REMEDIATION-VISUAL-PACKAGE.md`,
    `${base}/INTEGRATED-LAB-LEARNER-PACKET.md`
  ];
  if(courseId==='COURSE-LH-TECH1-001'){
    learnerCandidates.push(
      `${base}/student/STUDENT-WORKBOOK.md`,
      `${base}/student/WORKBOOK-TEMPLATES.md`,
      `${base}/student/INTEGRATED-PRACTICAL.md`,
      `${base}/job-aids/FIELD-REFERENCE-INDEX.md`,
      `${base}/instructor/OBJECTIVE-REMEDIATION-MATRIX.md`
    );
  }
  const mappedDownloads=downloadRecords.filter((record)=>record.courseMappings?.includes(courseId));
  const publicDownloads=mappedDownloads.filter((record)=>record.status==='published' && record.releaseStatus==='public');
  const supportText=learnerCandidates.map(readText).join('\n');
  const hasLearnerPackage=learnerCandidates.some(exists) || publicDownloads.length>0;
  const remediationSignals=(supportText.match(/remediat|corrective coaching|reassessment/gi)??[]).length;
  const documentJobAidSignals=(supportText.match(/worksheet|job aid|checklist|download|practice sheet|record template|workbook|field reference/gi)??[]).length;
  const jobAidSignals=documentJobAidSignals+publicDownloads.length;
  const integratedSignals=(supportText.match(/integrated (practice|scenario)|multi-stage scenario|application scenario|integrated practical/gi)??[]).length;

  const supportScore=
    Math.min(workedExamples,4)+Math.min(commonMistakes,4)+Math.min(practicalApplications,6)+
    Math.min(scenarios,4)+Math.min(images,6)+Math.min(resources,4)+
    Math.min(remediationSignals,4)+Math.min(jobAidSignals,4)+Math.min(integratedSignals,2);

  const flags=[];
  if(!hasLearnerPackage) flags.push('missing-learner-support-package');
  if(commonMistakes===0) flags.push('no-common-mistake-array');
  if(workedExamples===0) flags.push('no-worked-example-array');
  if(practicalApplications===0) flags.push('no-applied-practice-signal');
  if(resources===0 && jobAidSignals===0) flags.push('no-downloadable-job-aid-signal');
  if(remediationSignals===0) flags.push('no-remediation-signal');
  if(images===0) flags.push('no-dedicated-lesson-image-block');
  if(integratedSignals===0 && scenarios===0) flags.push('no-integrated-scenario-signal');

  rows.push({
    courseId,title:course.title,lessonCount:lessonIds.length,
    objectiveCount:(course.learningOutcomes??[]).length,supportScore,
    signals:{workedExamples,commonMistakes,practicalApplications,scenarios,images,resources,tables,remediationSignals,jobAidSignals,integratedSignals,publishedDownloads:publicDownloads.length,mappedDownloads:mappedDownloads.length},
    flags
  });
}

rows.sort((a,b)=>a.supportScore-b.supportScore || b.flags.length-a.flags.length || a.courseId.localeCompare(b.courseId));

if(process.argv.includes('--json')){
  console.log(JSON.stringify({scope:'15 canonical Technician certification courses only',method:'Comparative prioritization signals, not release quotas',rows},null,2));
}else{
  console.log('# Certification Learner-Support Audit\n');
  console.log('Lower scores indicate fewer detectable support signals and should guide review; they are not automatic course failures.\n');
  console.log('| Course | Score | Lessons | Worked examples | Common mistakes | Applied practice | Scenarios | Images | Resources/job aids | Public downloads | Remediation | Flags |');
  console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|');
  for(const r of rows){
    console.log(`| ${r.courseId} | ${r.supportScore} | ${r.lessonCount} | ${r.signals.workedExamples} | ${r.signals.commonMistakes} | ${r.signals.practicalApplications} | ${r.signals.scenarios+r.signals.integratedSignals} | ${r.signals.images} | ${r.signals.resources+r.signals.jobAidSignals} | ${r.signals.publishedDownloads} | ${r.signals.remediationSignals} | ${r.flags.join(', ')||'—'} |`);
  }
}

if(process.argv.includes('--check')){
  const structural=rows.filter(r=>r.flags.includes('missing-learner-support-package')||r.flags.includes('no-applied-practice-signal'));
  if(structural.length){
    console.error('\nStructural learner-support gaps:');
    for(const r of structural) console.error(`- ${r.courseId}: ${r.flags.join(', ')}`);
    process.exitCode=1;
  }
}
