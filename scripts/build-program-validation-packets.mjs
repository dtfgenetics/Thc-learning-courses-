import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const has=x=>args.includes(x);
const value=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const write=has('--write');
const asJson=has('--json');
const outDir=path.resolve(root,value('--out')??'generated/program-validation-packets');

const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>read(path.join(rel,n)));};

const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const programs=readDir('content/credential-programs').filter(x=>['CREDPROG-CULT-TECH-I-001','CREDPROG-CULT-TECH-II-001'].includes(x.id));
const performance=readDir('content/performance-assessments');
const controls=read('registry/candidate-governance-controls.json');

function performanceMappings(p){
  const ext=p.extensions??{};
  return [...new Set([...(ext.courseMappings??[]),...(ext.course?[ext.course]:[]),...(ext.integratedCourseId?[ext.integratedCourseId]:[]),...(p.integratedCourseId?[p.integratedCourseId]:[])].filter(Boolean))];
}
function programPerformance(program){
  const courseSet=new Set(program.requiredCourses??[]);
  const ids=new Set(program.assessmentModel?.performanceEvidence??[]);
  if(program.assessmentModel?.capstone) ids.add(program.assessmentModel.capstone);
  for(const p of performance){
    if(performanceMappings(p).some(id=>courseSet.has(id))) ids.add(p.id);
  }
  return [...ids].map(id=>{
    const p=performance.find(x=>x.id===id);
    return {id,version:p?.version??null,assessmentType:p?.assessmentType??null,status:p?.status??'missing'};
  });
}

const packets=[];
for(const p of programs){
  const locks=(p.requiredCourses??[]).map(id=>{
    const c=courses.get(id);if(!c)throw new Error('Missing program course '+id);
    return {courseId:id,courseVersion:String(c.version),title:c.title??id};
  });
  const perf=programPerformance(p);
  packets.push({
    id:'PROGRAMVAL-'+p.id.replace(/^CREDPROG-/,''),
    packetType:'occupational-program-validation',
    credentialProgramId:p.id,
    credentialProgramVersion:String(p.version),
    title:p.title,
    occupationalClaim:p.occupationalClaim,
    targetRoles:p.targetRoles??[],
    courseLocks:locks,
    performanceAssessments:perf,
    currentValidationState:p.validation??{},
    startCommand:'npm run evidence:intake:occupational -- --program '+p.id+' --authority <PROGRAM-VALIDATION-LEAD> --write',
    sections:{
      technicalCurriculumReview:[
        'Review every locked course version for occupational scope, scientific/technical accuracy and role boundaries.',
        'Record reviewer count and disposition all material technical concerns.'
      ],
      jobTaskAnalysis:[
        'Define the target worker population and operating context.',
        'Confirm task/domain inventory reflects actual job work.',
        'Review frequency/importance/criticality methodology and currency.',
        'Document sampling/panel limitations.'
      ],
      smeEmployerValidation:[
        'Recruit role-representative SMEs/employer reviewers.',
        'Review critical tasks, role representativeness and scope-of-practice boundaries.',
        'Record panelist count, conflicts/limitations and dispositions.'
      ],
      assessmentBlueprint:[
        'Finalize weights only after the occupational construct is stable.',
        'Confirm competency coverage, critical-content representation and cognitive demand.'
      ],
      performanceValidation:[
        'Validate every required practical and capstone against occupational tasks.',
        'Confirm critical-decision coverage and resolve all critical issues.'
      ]
    }
  });
}

const retest=controls.controls?.retest??{};
const retention=controls.controls?.privacyRetention??{};
packets.push({
  id:'CANDIDATEGOV-'+controls.id.replace(/^CANDIDATE-GOVERNANCE-CONTROLS-/,''), 
  packetType:'candidate-governance',
  controlsId:controls.id,
  controlsVersion:String(controls.version),
  appliesTo:controls.appliesTo??[],
  sourceDrafts:controls.sourceDrafts??[],
  currentStatus:controls.status,
  unresolvedDecisions:{
    finalAttemptLimit:retest.finalAttemptLimit??null,
    waitingPeriodHours:retest.waitingPeriodHours??null,
    feePolicy:retest.feePolicy??null,
    retentionScheduleApproved:retention.retentionScheduleApproved??false,
    retentionPeriods:retention.retentionPeriods??{}
  },
  requiredApprovals:controls.requiredApprovals??[],
  sections:{
    retest:[
      'Approve final attempt limit or explicitly approve no fixed limit if that is the policy.',
      'Approve waiting-period rule and remediation requirements.',
      'Approve fee policy and verify fairness/accessibility implications.',
      'Preserve prior-form exposure records privately and require equivalent secure forms/variants.'
    ],
    accommodations:[
      'Confirm construct-preserving accommodation policy and minimum-necessary disclosure.',
      'Approve handling of documentation and assessor instructions.'
    ],
    appeals:[
      'Approve appeal grounds, authorized decision maker, preserved original record and decision record requirements.',
      'Keep secure answer material protected.'
    ],
    privacyRetention:[
      'Approve the retention schedule separately for every listed evidence category.',
      'Confirm data minimization, role-based access, audit trail and disposal procedure.',
      'Complete privacy/legal review for intended operating jurisdictions.'
    ],
    securityAndPublicVerification:[
      'Approve incident-response controls and credential-verification data fields.',
      'Keep raw scores, secure items, evaluator notes and accommodation data private by default.'
    ],
    finalApprovals:[
      'Program approval',
      'Assessment approval',
      'Accessibility approval',
      'Privacy/legal approval',
      'Security approval',
      'Organizational approval'
    ]
  },
  startCommand:'npm run evidence:intake:candidate-governance -- --authority <GOVERNANCE-LEAD> --write',
  recordTemplate:{
    status:'approval-pending',
    approvals:{program:false,assessment:false,accessibility:false,privacyLegal:false,security:false,organizational:false},
    finalAttemptPolicy:{attemptLimit:null,approved:false,notes:null},
    waitingPeriodPolicy:{waitingPeriodHours:null,approved:false,notes:null},
    feePolicy:{policy:null,approved:false},
    retentionSchedule:{approved:false,periods:retention.retentionPeriods??{}}
  }
});

function md(p){
  const lines=['# Program Validation Packet — '+p.id,'','Packet type: '+p.packetType,''];
  if(p.packetType==='occupational-program-validation'){
    lines.push('Credential program: '+p.credentialProgramId+'@'+p.credentialProgramVersion,'','## Occupational claim','',p.occupationalClaim,'','## Target roles','',...p.targetRoles.map(x=>'- '+x),'','## Current course locks','',...p.courseLocks.map(x=>'- '+x.courseId+'@'+x.courseVersion+' — '+x.title),'','## Required practical/capstone anchors','',...p.performanceAssessments.map(x=>'- '+x.id+'@'+x.version+' — '+x.assessmentType+' / '+x.status),'','## Start record','', '    '+p.startCommand,'');
  }else{
    lines.push('Controls: '+p.controlsId+'@'+p.controlsVersion,'Applies to: '+p.appliesTo.join(', '),'Current status: '+p.currentStatus,'','## Unresolved governance decisions','',
      '- Final attempt limit: '+String(p.unresolvedDecisions.finalAttemptLimit),
      '- Waiting period hours: '+String(p.unresolvedDecisions.waitingPeriodHours),
      '- Fee policy: '+String(p.unresolvedDecisions.feePolicy),
      '- Retention schedule approved: '+String(p.unresolvedDecisions.retentionScheduleApproved),'',
      'Source drafts:','',...p.sourceDrafts.map(x=>'- '+x),'','## Start record','', '    '+p.startCommand,'');
  }
  lines.push('## Review sections','');
  for(const [name,items] of Object.entries(p.sections)){
    lines.push('### '+name,'',...items.map(x=>'- [ ] '+x),'');
  }
  lines.push('## Decision record','','- Reviewer/panel:','- Date:','- Evidence references:','- Material concerns:','- Disposition:','- Authority:','- Decision:','','## Integrity boundary','','This packet organizes program/governance review. It does not itself approve occupational validation, candidate governance, or credential authorization.','');
  return lines.join('\n');
}

if(write){
  fs.mkdirSync(outDir,{recursive:true});
  for(const p of packets){
    fs.writeFileSync(path.join(outDir,p.id+'.json'),JSON.stringify(p,null,2)+'\n');
    fs.writeFileSync(path.join(outDir,p.id+'.md'),md(p));
  }
}
const counts={};for(const p of packets)counts[p.packetType]=(counts[p.packetType]??0)+1;
const out={packetCount:packets.length,counts,wroteFiles:write,outputDirectory:path.relative(root,outDir),packets:packets.map(p=>({id:p.id,packetType:p.packetType,targetId:p.credentialProgramId??p.controlsId,targetVersion:p.credentialProgramVersion??p.controlsVersion}))};
if(asJson) console.log(JSON.stringify(out,null,2)); else console.log('Program validation packets: '+packets.length);
