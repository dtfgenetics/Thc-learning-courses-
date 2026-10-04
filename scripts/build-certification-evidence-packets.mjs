import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const has=(x)=>args.includes(x);
const value=(name)=>{const i=args.indexOf(name);return i>=0?args[i+1]:null;};
const outDir=path.resolve(root,value('--out')??'generated/certification-evidence-packets');
const write=has('--write');
const asJson=has('--json');

const read=(rel)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=(rel)=>{
  const dir=path.join(root,rel); if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')));
};

const registry=read('registry/certification-validation-execution.json');
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const programs=readDir('content/credential-programs').filter(x=>x.id);
const assessments=new Map(readDir('content/assessments').map(x=>[x.id,x]));
const performance=new Map(readDir('content/performance-assessments').map(x=>[x.id,x]));

const gateGuidance={
  exactVersionHumanAssessmentReview:{
    owner:'assessment reviewer',
    evidenceType:'exact-version assessment review records',
    actions:[
      'Review the current final definition and every current scored item version.',
      'Record approval or revision-required status for each current object version.',
      'Do not reuse approval from superseded item or assessment versions.'
    ]
  },
  pilotExecution:{
    owner:'pilot lead',
    evidenceType:'course pilot execution evidence',
    actions:[
      'Freeze the exact course version and execute the controlled pilot protocol.',
      'Record cohort and participant scope, learner feedback, fairness/accessibility review, data-quality review, and stop criteria.',
      'Keep participant-level PII and private response data outside the public repository.'
    ]
  },
  itemAnalysis:{
    owner:'assessment analyst',
    evidenceType:'de-identified item-level pilot evidence',
    actions:[
      'Aggregate current-version pilot response data for every scored item.',
      'Review difficulty, omit rate, distractor behavior, response time, and item-rest discrimination when available.',
      'Revise or disposition flagged items before approval.'
    ]
  },
  practicalAssessorCalibration:{
    owner:'assessment operations lead',
    evidenceType:'paired assessor calibration evidence',
    actions:[
      'Use common standardized performances and independent scoring before discussion.',
      'Record exact-version agreement, critical-error decisions, score differences, and unresolved disagreements.',
      'Resolve critical-error disagreements before treating calibration evidence as complete.'
    ]
  },
  accessibilityUxHumanReview:{
    owner:'accessibility/UX reviewer',
    evidenceType:'rendered accessibility and learner-UX review evidence',
    actions:[
      'Review the deployed build using the course-specific WCAG 2.2 AA packet.',
      'Cover keyboard, assistive technology, mobile/responsive behavior, zoom/reflow, assessments, visuals, downloads, and progress states.',
      'Correct or formally disposition every applicable Level A/AA failure and record the exact deployed build.'
    ]
  },
  standardSetting:{
    owner:'standard-setting panel/governance authority',
    evidenceType:'standard-setting evidence',
    actions:[
      'Use stable current assessment content and an approved minimally-qualified-performance description.',
      'Record method, panel composition, recommended cut score, sensitivity/impact review, and governance decision.',
      'Keep the panel recommendation distinct from final adoption of the production cut score.'
    ]
  },
  secureOperationalFormReadiness:{
    owner:'assessment security lead',
    evidenceType:'secure-form equivalence and security evidence',
    actions:[
      'Build at least two approved private operational forms from the secure item store.',
      'Document blueprint, cognitive-demand, critical-content and scored-opportunity equivalence plus retest-overlap review.',
      'Store only aggregate metadata/fingerprints in this repository; never commit operational items or keys.'
    ]
  },
  occupationalProgramValidation:{
    owner:'program validation authority',
    evidenceType:'occupational program validation evidence',
    actions:[
      'Complete exact-version technical curriculum review for all courses in the credential program.',
      'Validate the job-task analysis and obtain SME/employer review of role representativeness, critical tasks, and scope boundaries.',
      'Finalize blueprint weights and validate all required practical/capstone performance evidence.'
    ]
  },
  credentialAuthorization:{
    owner:'credential governance authority',
    evidenceType:'credential authorization evidence',
    actions:[
      'Approve candidate governance, privacy/retention, signing, revocation, verification, lifecycle and production controls.',
      'Confirm issuer authority and exact current credential-program/course versions.',
      'Record explicit final release approval only after every prerequisite evidence gate is approved.'
    ]
  }
};

function courseProgram(courseId){
  return programs.find(p=>(p.requiredCourses??[]).includes(courseId))??null;
}
function performanceCourseMappings(assessment){
  const ext=assessment?.extensions??{};
  return [...new Set([
    ...(Array.isArray(ext.courseMappings)?ext.courseMappings:[]),
    ...(ext.course?[ext.course]:[]),
    ...(ext.integratedCourseId?[ext.integratedCourseId]:[]),
    ...(assessment?.integratedCourseId?[assessment.integratedCourseId]:[])
  ].filter(Boolean))];
}
function performanceIdsForCourse(course){
  const ext=course?.extensions??{};
  const ids=[
    ...(ext.mappedPractical?[ext.mappedPractical]:[]),
    ...(Array.isArray(ext.credentialPracticalSetRequired)?ext.credentialPracticalSetRequired:[]),
    ...(Array.isArray(ext.mappedPerformanceAssessments)?ext.mappedPerformanceAssessments:[]),
    ...(ext.capstoneRequired?[ext.capstoneRequired]:[])
  ];
  for(const [id,assessment] of performance){
    if(performanceCourseMappings(assessment).includes(course?.id)) ids.push(id);
  }
  return [...new Set(ids)];
}
function packetFor(row){
  const course=courses.get(row.courseId);
  if(!course) throw new Error(`Missing canonical course ${row.courseId}`);
  const program=courseProgram(row.courseId);
  if(!program) throw new Error(`No credential program maps ${row.courseId}`);
  const perfIds=performanceIdsForCourse(course);
  const final=row.finalAssessmentId?assessments.get(row.finalAssessmentId):null;
  return {
    courseId:row.courseId,
    courseVersion:String(course.version),
    courseTitle:course.title??course.name??row.courseId,
    track:row.track,
    credentialProgramId:program.id,
    credentialProgramVersion:String(program.version),
    conventionalFinal:row.conventionalFinal===true,
    finalAssessment:final?{id:final.id,version:String(final.version),itemCount:(final.items??[]).length}:null,
    performanceAssessments:perfIds.map(id=>{
      const x=performance.get(id);
      return {id,version:x?String(x.version):null,status:x?.status??'missing'};
    }),
    pilotProtocolPath:row.pilotProtocolPath,
    gates:(registry.evidenceGates??[]).map(g=>({
      gate:g,
      planningState:row.evidence?.[g]??'missing',
      owner:gateGuidance[g]?.owner??'designated authority',
      evidenceType:gateGuidance[g]?.evidenceType??'controlled evidence',
      actions:gateGuidance[g]?.actions??[]
    }))
  };
}

function markdown(p){
  const lines=[
    `# Evidence Execution Packet — ${p.courseId}`,
    '',
    `**Course:** ${p.courseTitle}`,
    `**Exact course version:** \`${p.courseVersion}\``,
    `**Track:** ${p.track}`,
    `**Credential program:** \`${p.credentialProgramId}@${p.credentialProgramVersion}\``,
    `**Pilot protocol:** \`${p.pilotProtocolPath}\``,
    '',
    '## Exact-version assessment anchors',
    ''
  ];
  if(p.finalAssessment){
    lines.push(`- Conventional final: \`${p.finalAssessment.id}@${p.finalAssessment.version}\` (${p.finalAssessment.itemCount} current items)`);
  }else{
    lines.push('- Conventional final: not applicable; this course uses an integrated performance pathway.');
  }
  if(p.performanceAssessments.length){
    for(const a of p.performanceAssessments) lines.push(`- Performance assessment: \`${a.id}@${a.version??'MISSING'}\` — ${a.status}`);
  }else{
    lines.push('- Course-mapped performance assessment anchors: none declared.');
  }
  lines.push('','## Evidence gates','');
  for(const g of p.gates){
    lines.push(`### ${g.gate}`,'',`Planning state: **${g.planningState}**  `,`Responsible role: **${g.owner}**  `,`Evidence record: **${g.evidenceType}**`,'');
    for(const a of g.actions) lines.push(`- ${a}`);
    lines.push('');
  }
  lines.push(
    '## Execution record',
    '',
    '- Reviewer / lead:',
    '- Date started:',
    '- Date completed:',
    '- Evidence record IDs:',
    '- Issue / change references:',
    '- Decision:',
    '- Decision authority:',
    '- Limitations / follow-up:',
    '',
    '## Integrity boundary',
    '',
    'This packet is an execution aid. Completing the checklist text does not close a certification gate. Only validated, exact-version evidence records recognized by the certification evidence reconciler can advance readiness.'
  );
  return lines.join('\n')+'\n';
}

const packets=(registry.courses??[]).map(packetFor);
if(packets.length!==15) throw new Error(`Expected 15 canonical packets, got ${packets.length}`);

if(write){
  fs.mkdirSync(outDir,{recursive:true});
  for(const p of packets){
    fs.writeFileSync(path.join(outDir,`${p.courseId}.md`),markdown(p));
    fs.writeFileSync(path.join(outDir,`${p.courseId}.json`),JSON.stringify(p,null,2)+'\n');
  }
  const index=[
    '# Certification Evidence Execution Packets','',
    'Generated from the current canonical certification registry, course objects, credential programs, assessments and performance assessments.','',
    ...packets.map(p=>`- \`${p.courseId}@${p.courseVersion}\` — ${p.courseTitle}`)
  ].join('\n')+'\n';
  fs.writeFileSync(path.join(outDir,'README.md'),index);
}

const summary={
  packetCount:packets.length,
  gateCount:registry.evidenceGates?.length??0,
  conventionalFinalPackets:packets.filter(p=>p.conventionalFinal).length,
  integratedPerformancePackets:packets.filter(p=>!p.conventionalFinal).length,
  outputDirectory:path.relative(root,outDir),
  wroteFiles:write,
  packets:packets.map(p=>({courseId:p.courseId,courseVersion:p.courseVersion,credentialProgramId:p.credentialProgramId,gateCount:p.gates.length}))
};
if(asJson) console.log(JSON.stringify(summary,null,2));
else{
  console.log(`Certification evidence packets: ${summary.packetCount} courses × ${summary.gateCount} gates`);
  console.log(`Conventional finals: ${summary.conventionalFinalPackets}; integrated performance: ${summary.integratedPerformancePackets}`);
  console.log(write?`Wrote packets to ${summary.outputDirectory}`:'Dry run only; use --write to create packets.');
}
