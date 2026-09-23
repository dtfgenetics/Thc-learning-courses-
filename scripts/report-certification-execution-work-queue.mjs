import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const args=new Set(process.argv.slice(2));
const asJson=args.has('--json');

const read=(rel)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=(rel)=>{
  const dir=path.join(root,rel);
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>read(path.join(rel,n)));
};
const runJson=(script,args=[])=>JSON.parse(execFileSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8'}));

const cert=runJson('scripts/report-certification-evidence-reconciliation.mjs',['--json']);
const production=runJson('scripts/report-production-evidence-reconciliation.mjs');
const programs=readDir('content/credential-programs').filter(x=>['CREDPROG-CULT-TECH-I-001','CREDPROG-CULT-TECH-II-001'].includes(x.id));
const candidateControls=read('registry/candidate-governance-controls.json');
const candidateGovernanceApprovals=readDir('content/candidate-governance-approvals')
  .filter(x=>x.controlsId===candidateControls.id&&String(x.controlsVersion)===String(candidateControls.version)&&x.status!=='invalidated')
  .sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt));
const latestCandidateGovernance=candidateGovernanceApprovals[0]??null;
const candidateGovernanceApproved=latestCandidateGovernance?.status==='approved'&&candidateControls.operationalUseAuthorized===true;

const atLeastEvidence=(s)=>['evidence-complete','approved','not-applicable'].includes(s);
const approved=(s)=>['approved','not-applicable'].includes(s);
const gateStatus=(course,gate)=>course?.gates?.[gate]?.status??'missing';

const courseGateDependencies={
  exactVersionHumanAssessmentReview:[],
  pilotExecution:[],
  practicalAssessorCalibration:[],
  accessibilityUxHumanReview:[],
  itemAnalysis:[
    {gate:'pilotExecution',require:'evidence'}
  ],
  standardSetting:[
    {gate:'exactVersionHumanAssessmentReview',require:'approved'},
    {gate:'pilotExecution',require:'evidence'},
    {gate:'itemAnalysis',require:'evidence'}
  ],
  secureOperationalFormReadiness:[
    {gate:'exactVersionHumanAssessmentReview',require:'approved'},
    {gate:'itemAnalysis',require:'evidence'},
    {gate:'standardSetting',require:'evidence'}
  ]
};

function depsFor(course,gate){
  return (courseGateDependencies[gate]??[]).map(d=>{
    const status=gateStatus(course,d.gate);
    const met=d.require==='approved'?approved(status):atLeastEvidence(status);
    return {...d,status,met};
  });
}
function stateFor(status,deps){
  if(status==='not-applicable'||status==='approved') return 'closed';
  if(status==='revision-required') return 'revision-required';
  if(deps.some(d=>!d.met)) return 'blocked';
  if(status==='evidence-complete') return 'ready-for-approval';
  return 'ready';
}
function priorityFor(gate,state){
  if(state==='revision-required') return 0;
  if(state==='ready-for-approval') return 1;
  const order=[
    'exactVersionHumanAssessmentReview',
    'pilotExecution',
    'practicalAssessorCalibration',
    'accessibilityUxHumanReview',
    'itemAnalysis',
    'standardSetting',
    'secureOperationalFormReadiness'
  ];
  return 10+Math.max(0,order.indexOf(gate));
}

const courseWork=[];
for(const course of cert.courses){
  for(const gate of Object.keys(courseGateDependencies)){
    const status=gateStatus(course,gate);
    const deps=depsFor(course,gate);
    const state=stateFor(status,deps);
    if(state==='closed') continue;
    courseWork.push({
      scope:'course',
      courseId:course.courseId,
      track:course.track,
      gate,
      evidenceStatus:status,
      executionState:state,
      dependencies:deps.filter(d=>!d.met),
      priority:priorityFor(gate,state)
    });
  }
}

const sharedGovernanceWork=[];
if(!candidateGovernanceApproved){
  const evidenceStatus=latestCandidateGovernance?.status??'missing';
  const executionState=evidenceStatus==='revision-required'
    ? 'revision-required'
    : evidenceStatus==='approved'&&candidateControls.operationalUseAuthorized!==true
      ? 'ready-for-application'
      : 'ready';
  sharedGovernanceWork.push({
    scope:'shared-governance',
    controlsId:candidateControls.id,
    controlsVersion:candidateControls.version,
    gate:'candidateGovernance',
    evidenceStatus,
    operationalUseAuthorized:candidateControls.operationalUseAuthorized===true,
    executionState,
    dependencies:[],
    priority:executionState==='revision-required'?0:executionState==='ready-for-application'?1:15
  });
}

const programWork=[];
for(const program of programs){
  const courses=(program.requiredCourses??[]).map(id=>cert.courses.find(x=>x.courseId===id)).filter(Boolean);
  const occupationalStatuses=[...new Set(courses.map(c=>gateStatus(c,'occupationalProgramValidation')))];
  const occupationalClosed=occupationalStatuses.every(s=>s==='approved'||s==='not-applicable');
  if(!occupationalClosed){
    const revision=occupationalStatuses.includes('revision-required');
    const evidence=occupationalStatuses.every(s=>atLeastEvidence(s));
    programWork.push({
      scope:'program',
      credentialProgramId:program.id,
      gate:'occupationalProgramValidation',
      evidenceStatus:occupationalStatuses,
      executionState:revision?'revision-required':evidence?'ready-for-approval':'ready',
      dependencies:[],
      priority:revision?0:evidence?1:14
    });
  }

  const authStatuses=[...new Set(courses.map(c=>gateStatus(c,'credentialAuthorization')))];
  const authClosed=authStatuses.every(s=>s==='approved'||s==='not-applicable');
  if(!authClosed){
    const blockers=[];
    for(const c of courses){
      for(const gate of [
        'exactVersionHumanAssessmentReview','pilotExecution','itemAnalysis','practicalAssessorCalibration',
        'accessibilityUxHumanReview','standardSetting','secureOperationalFormReadiness','occupationalProgramValidation'
      ]){
        const s=gateStatus(c,gate);
        if(!approved(s)) blockers.push({scope:'course',courseId:c.courseId,gate,status:s});
      }
    }
    if(!candidateGovernanceApproved){
      blockers.push({
        scope:'candidate-governance',
        controlsId:candidateControls.id,
        status:latestCandidateGovernance?.status??'missing',
        operationalUseAuthorized:candidateControls.operationalUseAuthorized===true
      });
    }
    for(const p of production.controls){
      if(p.evidenceStatus!=='approved') blockers.push({scope:'production',controlId:p.controlId,status:p.evidenceStatus});
    }
    const revision=authStatuses.includes('revision-required');
    const allEvidenceReady=blockers.every(b=>{
      if(b.scope==='production'){
        const row=production.controls.find(x=>x.controlId===b.controlId);
        return ['evidence-complete','approved'].includes(row?.evidenceStatus);
      }
      if(b.scope==='candidate-governance'){
        return latestCandidateGovernance?.status==='approved';
      }
      const c=cert.courses.find(x=>x.courseId===b.courseId);
      return atLeastEvidence(gateStatus(c,b.gate));
    });
    programWork.push({
      scope:'program',
      credentialProgramId:program.id,
      gate:'credentialAuthorization',
      evidenceStatus:authStatuses,
      executionState:revision?'revision-required':blockers.length===0?'ready-for-approval':allEvidenceReady?'blocked-for-approval':'blocked',
      dependencies:blockers,
      priority:revision?0:100
    });
  }
}

const productionWork=production.controls
  .filter(x=>x.evidenceStatus!=='approved')
  .map(x=>({
    scope:'production',
    controlId:x.controlId,
    evidenceStatus:x.evidenceStatus,
    executionState:x.evidenceStatus==='revision-required'?'revision-required':x.evidenceStatus==='evidence-complete'?'ready-for-approval':'ready',
    dependencies:[],
    priority:x.evidenceStatus==='revision-required'?0:x.evidenceStatus==='evidence-complete'?1:20
  }));

const all=[...courseWork,...sharedGovernanceWork,...programWork,...productionWork]
  .sort((a,b)=>a.priority-b.priority || String(a.courseId??a.credentialProgramId??a.controlId).localeCompare(String(b.courseId??b.credentialProgramId??b.controlId)));

const count=(state)=>all.filter(x=>x.executionState===state).length;
const output={
  generatedFrom:'live exact-version certification + production evidence',
  summary:{
    totalOpenWorkItems:all.length,
    ready:count('ready'),
    readyForApproval:count('ready-for-approval'),
    revisionRequired:count('revision-required'),
    blocked:count('blocked')+count('blocked-for-approval'),
    courseWorkItems:courseWork.length,
    sharedGovernanceWorkItems:sharedGovernanceWork.length,
    programWorkItems:programWork.length,
    productionWorkItems:productionWork.length
  },
  immediateQueue:all.filter(x=>['revision-required','ready-for-approval','ready-for-application','ready'].includes(x.executionState)),
  blockedQueue:all.filter(x=>['blocked','blocked-for-approval'].includes(x.executionState)),
  all
};

if(asJson) console.log(JSON.stringify(output,null,2));
else{
  console.log('Certification execution work queue');
  console.log(`Open work items: ${output.summary.totalOpenWorkItems}`);
  console.log(`Ready now: ${output.summary.ready}; ready for approval: ${output.summary.readyForApproval}; revision required: ${output.summary.revisionRequired}; blocked: ${output.summary.blocked}`);
  console.log('');
  console.log('Immediate queue:');
  for(const x of output.immediateQueue){
    const who=x.courseId??x.credentialProgramId??x.controlId??x.controlsId;
    console.log(`- [${x.executionState}] ${who} :: ${x.gate??'productionControl'}`);
  }
}
