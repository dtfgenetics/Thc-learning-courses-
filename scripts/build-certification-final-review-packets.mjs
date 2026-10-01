import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const has=(x)=>args.includes(x);
const value=(n)=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const outDir=path.resolve(root,value('--out')??'generated/certification-final-review-packets');
const filterCourse=value('--course');
const filterAssessment=value('--assessment');
const write=has('--write');
const asJson=has('--json');
const checkSourceIntegrity=has('--check-source-integrity');

const read=(rel)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const readDir=(rel)=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).sort().map(n=>read(path.join(rel,n)));};

const assessments=new Map(readDir('content/assessments').map(x=>[x.id,x]));
const questions=new Map(readDir('content/questions').map(x=>[x.id,x]));
const objectives=new Map(readDir('content/learning-objectives').map(x=>[x.id,x]));
const competencies=new Map(readDir('content/competencies').map(x=>[x.id,x]));
const references=new Map(readDir('content/references').map(x=>[x.id,x]));
const reviews=readDir('content/reviews');

const finalIds=[
  ...Array.from({length:6},(_,i)=>'ASSESS-LH-TECH1-'+String(i+1).padStart(3,'0')+'-FINAL'),
  ...Array.from({length:7},(_,i)=>'ASSESS-LH-TECH2-'+String(i+1).padStart(3,'0')+'-FINAL')
];

function latestReview(id,version){
  return reviews.filter(r=>r.objectId===id&&String(r.objectVersion)===String(version)&&r.reviewType==='assessment')
    .sort((a,b)=>Date.parse(b.reviewedAt)-Date.parse(a.reviewedAt))[0]??null;
}
function reviewState(id,version){
  const r=latestReview(id,version);
  if(!r) return {state:'pending',reviewId:null,status:null};
  return {state:r.status==='approved'?'approved':'revision-required',reviewId:r.id,status:r.status};
}
const authoritativeEvidenceLevels=new Set(['standards-government','peer-reviewed','university-extension','standard','A','B']);
const authoritativeTypes=new Set(['government','standard','journal','peer-reviewed-study','peer-reviewed-review','extension']);
function evidenceForItem(item){
  return (item.references??[]).map(id=>{
    const r=references.get(id);
    return {
      id,
      title:r?.title??null,
      status:r?.status??null,
      evidenceLevel:r?.evidenceLevel??null,
      type:r?.type??null,
      publisher:r?.publisher??null,
      url:r?.url??null,
      lastVerifiedAt:r?.lastVerifiedAt??null,
      sourceRevisionDate:r?.sourceRevisionDate??null,
      authoritative:Boolean(r&&(authoritativeEvidenceLevels.has(r.evidenceLevel)||authoritativeTypes.has(r.type))),
      reviewed:Boolean(r&&['reviewed','reviewed-source'].includes(r.status)),
      resolved:Boolean(r)
    };
  });
}
function evidenceHealth(evidence){
  const unresolved=evidence.filter(x=>!x.resolved).map(x=>x.id);
  const problems=[];
  if(evidence.length===0) problems.push('no-item-level-references');
  if(unresolved.length) problems.push('unresolved-reference:'+unresolved.join(','));
  if(evidence.length&&evidence.every(x=>!x.reviewed)) problems.push('no-reviewed-source');
  if(evidence.length&&evidence.every(x=>!x.authoritative)) problems.push('no-authoritative-source');
  return {
    referenceCount:evidence.length,
    reviewedReferenceCount:evidence.filter(x=>x.reviewed).length,
    authoritativeReferenceCount:evidence.filter(x=>x.authoritative).length,
    verifiedAuthoritativeReferenceCount:evidence.filter(x=>x.authoritative&&x.lastVerifiedAt).length,
    unresolvedReferences:unresolved,
    problems
  };
}
function packetFor(id){
  const a=assessments.get(id);
  if(!a) throw new Error('Missing final assessment '+id);
  const items=(a.items??[]).map(itemId=>{
    const item=questions.get(itemId);
    if(!item) throw new Error(a.id+': missing item '+itemId);
    const obj=objectives.get(item.objective);
    const comp=competencies.get(item.competency);
    const evidence=evidenceForItem(item);
    return {
      id:item.id,
      version:item.version,
      review:reviewState(item.id,item.version),
      competency:{id:item.competency,title:comp?.title??null},
      objective:{id:item.objective,statement:obj?.statement??obj?.description??null},
      bloomLevel:item.bloomLevel??null,
      difficulty:item.difficulty??null,
      type:item.type??null,
      stem:item.stem,
      choices:item.choices??[],
      correct:item.correct,
      rationale:item.rationale??null,
      evidence,
      evidenceHealth:evidenceHealth(evidence),
      reviewCommand:'node scripts/create-review-record.mjs --object '+item.id+' --type assessment --reviewer <REVIEWER-ID> --status approved --confirm-approved --write'
    };
  });
  const sourceSummary={
    items:items.length,
    itemsWithReferences:items.filter(x=>x.evidenceHealth.referenceCount>0).length,
    itemsWithReviewedSources:items.filter(x=>x.evidenceHealth.reviewedReferenceCount>0).length,
    itemsWithAuthoritativeSources:items.filter(x=>x.evidenceHealth.authoritativeReferenceCount>0).length,
    itemsWithVerifiedAuthoritativeSources:items.filter(x=>x.evidenceHealth.verifiedAuthoritativeReferenceCount>0).length,
    itemsWithUnresolvedReferences:items.filter(x=>x.evidenceHealth.unresolvedReferences.length>0).length,
    itemsWithSourceProblems:items.filter(x=>x.evidenceHealth.problems.length>0).length
  };
  return {
    packetVersion:'1.1.0',
    assessment:{
      id:a.id,version:a.version,title:a.title,courseId:a.extensions?.courseId??null,totalItems:a.totalItems,
      passingScorePercent:a.passingScorePercent,
      passingScoreBoundary:'Configured score remains provisional for credential use until formal standard setting is complete.',
      blueprint:a.blueprint??[],
      review:reviewState(a.id,a.version)
    },
    sourceSummary,
    checklist:[
      'Verify every item is taught by the current course and does not rely on encyclopedia substitution.',
      'Review the source-health block for every item: exact reference resolution, review state, authoritative evidence type/level, and verification metadata.',
      'Verify objective and competency alignment for each item.',
      'Verify one defensible keyed answer and plausible distractors.',
      'Verify scientific/technical claims and references support the keyed reasoning.',
      'Check reading clarity, ambiguity, fairness, accessibility and role/scope boundaries.',
      'Confirm rationales explain why the key is correct without introducing untaught or unsupported claims.',
      'Record changes-requested rather than approval for any exact-version item requiring revision.',
      'Do not treat the configured passing score as professionally validated standard-setting evidence.'
    ],
    definitionReviewCommand:'node scripts/create-review-record.mjs --object '+a.id+' --type assessment --reviewer <REVIEWER-ID> --status approved --confirm-approved --write',
    items
  };
}

let packets=finalIds.map(packetFor);
if(filterCourse) packets=packets.filter(p=>p.assessment.courseId===filterCourse);
if(filterAssessment) packets=packets.filter(p=>p.assessment.id===filterAssessment);
if(!packets.length) throw new Error('No certification final review packets matched filters');

function markdown(p){
  const lines=[
    '# Certification final review packet — '+p.assessment.id,'',
    'Course: '+p.assessment.courseId,
    'Assessment version: '+p.assessment.version,
    'Title: '+p.assessment.title,
    'Current definition review: '+p.assessment.review.state,
    'Current item count: '+p.assessment.totalItems,
    'Configured passing score: '+p.assessment.passingScorePercent+'% (provisional for credential use)',
    'Items with authoritative evidence: '+p.sourceSummary.itemsWithAuthoritativeSources+'/'+p.sourceSummary.items,
    'Items with verified authoritative evidence: '+p.sourceSummary.itemsWithVerifiedAuthoritativeSources+'/'+p.sourceSummary.items,
    'Items with source problems: '+p.sourceSummary.itemsWithSourceProblems,'',
    '## Assessment-level checklist','',
    ...p.checklist.map(x=>'- [ ] '+x),'',
    '## Record assessment-definition approval','',
    '    '+p.definitionReviewCommand,''
  ];
  for(const item of p.items){
    lines.push(
      '---','',
      '## '+item.id+' — v'+item.version,'',
      'Review state: '+item.review.state,'',
      'Competency: '+item.competency.id+(item.competency.title?' — '+item.competency.title:''),'',
      'Objective: '+item.objective.id+(item.objective.statement?' — '+item.objective.statement:''),'',
      'Bloom / difficulty / type: '+(item.bloomLevel??'—')+' / '+(item.difficulty??'—')+' / '+(item.type??'—'),'',
      '### Stem','',item.stem,'',
      '### Choices','',
      ...item.choices.map((x,i)=>'- '+String.fromCharCode(65+i)+'. '+x),'',
      'Key: '+String.fromCharCode(65+Number(item.correct)),'',
      '### Rationale','',item.rationale??'—','',
      '### Evidence','',
      ...(item.evidence.length?item.evidence.map(e=>'- '+e.id+': '+(e.title??'Untitled')+' ['+(e.status??'unknown')+'; level '+(e.evidenceLevel??'n/a')+'; authoritative='+(e.authoritative?'yes':'no')+'; verified='+(e.lastVerifiedAt??'not-recorded')+']'):['- No item-level references listed.']),'',
      'Evidence health: refs='+item.evidenceHealth.referenceCount+', reviewed='+item.evidenceHealth.reviewedReferenceCount+', authoritative='+item.evidenceHealth.authoritativeReferenceCount+', verified-authoritative='+item.evidenceHealth.verifiedAuthoritativeReferenceCount,
      'Evidence issues: '+(item.evidenceHealth.problems.join('; ')||'none'),'',
      '### Reviewer decision','',
      '- [ ] Approve exact current version',
      '- [ ] Changes requested',
      '- [ ] Reject',
      '- Notes:','',
      '    '+item.reviewCommand,''
    );
  }
  lines.push('---','','## Integrity boundary','','This packet is an internal assessment-review aid. It does not constitute pilot evidence, reliability evidence, standard setting, secure operational form approval, occupational validation, accessibility approval, or credential authorization.','');
  return lines.join('\n');
}

if(write){
  fs.mkdirSync(outDir,{recursive:true});
  for(const p of packets){
    fs.writeFileSync(path.join(outDir,p.assessment.id+'.json'),JSON.stringify(p,null,2)+'\n');
    fs.writeFileSync(path.join(outDir,p.assessment.id+'.md'),markdown(p));
  }
  fs.writeFileSync(path.join(outDir,'README.md'),[
    '# Certification Final Assessment Review Packets','',
    'Internal exact-version human assessment review packets for the 13 conventional Technician finals.','',
    ...packets.map(p=>'- '+p.assessment.id+'@'+p.assessment.version+' — '+p.items.length+' items')
  ].join('\n')+'\n');
}

const sourceIntegrityProblems=packets.flatMap(p=>p.items.flatMap(item=>item.evidenceHealth.problems
  .filter(x=>x==='no-item-level-references'||x.startsWith('unresolved-reference:'))
  .map(problem=>({assessmentId:p.assessment.id,itemId:item.id,problem}))));
const summary={
  packetCount:packets.length,
  finalDefinitionCount:packets.length,
  itemCount:packets.reduce((n,p)=>n+p.items.length,0),
  definitionPending:packets.filter(p=>p.assessment.review.state==='pending').length,
  definitionApproved:packets.filter(p=>p.assessment.review.state==='approved').length,
  itemsPending:packets.reduce((n,p)=>n+p.items.filter(x=>x.review.state==='pending').length,0),
  itemsApproved:packets.reduce((n,p)=>n+p.items.filter(x=>x.review.state==='approved').length,0),
  itemsWithAuthoritativeSources:packets.reduce((n,p)=>n+p.sourceSummary.itemsWithAuthoritativeSources,0),
  itemsWithVerifiedAuthoritativeSources:packets.reduce((n,p)=>n+p.sourceSummary.itemsWithVerifiedAuthoritativeSources,0),
  sourceIntegrityProblems:sourceIntegrityProblems.length,
  outputDirectory:path.relative(root,outDir),
  wroteFiles:write
};
if(asJson) console.log(JSON.stringify({...summary,sourceIntegrityProblemDetails:sourceIntegrityProblems},null,2));
else console.log('Certification final review packets: '+summary.packetCount+' finals, '+summary.itemCount+' current items; authoritative='+summary.itemsWithAuthoritativeSources+'; sourceIntegrityProblems='+summary.sourceIntegrityProblems+'; wroteFiles='+write);
if(checkSourceIntegrity&&sourceIntegrityProblems.length){
  console.error('Certification final review source-integrity check failed:');
  for(const p of sourceIntegrityProblems) console.error('- '+p.assessmentId+' / '+p.itemId+': '+p.problem);
  process.exitCode=1;
}
