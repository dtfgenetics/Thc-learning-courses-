import crypto from 'node:crypto';
import { buildSecureOperationalForm, assertNoSecureAnswerMaterial } from '../../../packages/domain/secure-operational-assessment.mjs';

function required(value,name){
  const text=String(value??'').trim();
  if(!text) throw new Error(`${name} required`);
  return text;
}
function operationalReadiness({credential,assessment,program}){
  const blockers=[];
  if(!credential||!program||!assessment) blockers.push('credential-program-assessment-definition-missing');
  if(credential?.governance?.releaseApprovalStatus!=='approved') blockers.push('credential-release-not-approved');
  if(credential?.extensions?.operationalUseAuthorized!==true) blockers.push('credential-operational-use-not-authorized');
  if(assessment?.extensions?.operationalUseAuthorized!==true) blockers.push('assessment-operational-use-not-authorized');
  if(assessment?.extensions?.configuredScoreIsProvisional===true) blockers.push('assessment-cut-score-provisional');
  if(assessment?.extensions?.blueprintWeightsStatus && assessment.extensions.blueprintWeightsStatus!=='finalized') blockers.push('assessment-blueprint-not-finalized');
  if(!Number.isFinite(Number(assessment?.passingScorePercent))) blockers.push('assessment-passing-score-missing');
  if(!Number.isInteger(Number(assessment?.totalItems))||Number(assessment.totalItems)<1) blockers.push('assessment-item-count-not-finalized');
  if(!Number.isFinite(Number(assessment?.timeLimitMinutes))||Number(assessment.timeLimitMinutes)<=0) blockers.push('assessment-time-limit-not-finalized');
  if(program?.assessmentModel?.credentialAssessment!==assessment?.id) blockers.push('program-assessment-mismatch');
  return blockers;
}
function attemptExpired(attempt,now=new Date().toISOString()){
  if(!attempt?.expiresAt) return false;
  return Date.parse(now)>=Date.parse(attempt.expiresAt);
}
function attemptPolicy(assessment,attempts=[],now=new Date().toISOString()){
  const completed=(attempts??[]).filter((x)=>x?.status==='scored');
  const maxAttempts=assessment.maxAttempts==null?null:Number(assessment.maxAttempts);
  if(Number.isInteger(maxAttempts)&&maxAttempts>0&&completed.length>=maxAttempts){
    return {allowed:false,error:'assessment-max-attempts-reached',attemptsUsed:completed.length,maxAttempts,retryAfter:null};
  }
  const cooldownHours=Number(assessment.cooldownHours??0);
  if(cooldownHours>0&&completed.length){
    const latest=Math.max(...completed.map((x)=>Date.parse(x.scoredAt??x.submittedAt??x.startedAt??'')).filter(Number.isFinite));
    if(Number.isFinite(latest)){
      const retryAt=latest+cooldownHours*3600000;
      if(Date.parse(now)<retryAt) return {allowed:false,error:'assessment-cooldown-active',attemptsUsed:completed.length,maxAttempts,retryAfter:new Date(retryAt).toISOString()};
    }
  }
  return {allowed:true,attemptsUsed:completed.length,maxAttempts,retryAfter:null};
}
function safeDeliveryItem(item,response=null){
  return {
    id:item.secureItemId,
    revision:String(item.revision),
    competency:item.competency,
    prompt:item.prompt,
    choices:Array.isArray(item.choices)?item.choices:undefined,
    presentation:item.presentation??null,
    response
  };
}
function scoreItem(item,response){
  const mode=String(item.presentation?.mode??'single-select');
  if(mode==='single-select'){
    return Number.isInteger(response)&&Number(response)===Number(item.scoringKey)?1:0;
  }
  if(mode==='multiple-select'){
    const actual=Array.isArray(response)?[...new Set(response.map(Number))].sort((a,b)=>a-b):[];
    const expected=Array.isArray(item.scoringKey)?[...new Set(item.scoringKey.map(Number))].sort((a,b)=>a-b):[];
    return actual.length===expected.length&&actual.every((x,i)=>x===expected[i])?1:0;
  }
  if(mode==='numeric'){
    const actual=Number(response);
    const key=typeof item.scoringKey==='object'?item.scoringKey:{value:item.scoringKey,tolerance:0};
    const target=Number(key.value), tolerance=Math.max(0,Number(key.tolerance??0));
    return Number.isFinite(actual)&&Number.isFinite(target)&&Math.abs(actual-target)<=tolerance?1:0;
  }
  throw new Error(`unsupported secure assessment presentation mode ${mode}`);
}
function validateResponse(item,response){
  const mode=String(item.presentation?.mode??'single-select');
  if(mode==='single-select'){
    if(!Number.isInteger(response)||!Array.isArray(item.choices)||response<0||response>=item.choices.length) throw new Error('invalid single-select response');
    return response;
  }
  if(mode==='multiple-select'){
    if(!Array.isArray(response)||!Array.isArray(item.choices)) throw new Error('invalid multiple-select response');
    const values=[...new Set(response.map(Number))];
    if(values.some((x)=>!Number.isInteger(x)||x<0||x>=item.choices.length)) throw new Error('invalid multiple-select response');
    return values.sort((a,b)=>a-b);
  }
  if(mode==='numeric'){
    const value=Number(response);
    if(!Number.isFinite(value)) throw new Error('invalid numeric response');
    return value;
  }
  throw new Error(`unsupported secure assessment presentation mode ${mode}`);
}

export async function startSecureCredentialAssessment({
  learnerStore,secureAssessmentStore,subject,credential,program,assessment,now=new Date().toISOString()
}={}){
  if(!learnerStore||!secureAssessmentStore) return {status:503,body:{error:'secure-credential-assessment-unavailable'}};
  const blockers=operationalReadiness({credential,program,assessment});
  if(blockers.length) return {status:409,body:{error:'credential-assessment-not-authorized',blockers}};
  const open=await learnerStore.findOpenAssessmentAttempt(subject,{assessmentId:assessment.id});
  if(open){
    const items=await secureAssessmentStore.getOperationalItems({assignments:(open.items??[]).map((x)=>({secureItemId:x.itemId,revision:x.itemVersion}))});
    return {status:200,body:{resumed:true,attempt:{
      id:open.id,assessmentId:open.assessmentId,assessmentVersion:open.assessmentVersion,formId:open.formId,status:open.status,
      startedAt:open.startedAt,expiresAt:open.expiresAt
    },assessment:{id:assessment.id,title:assessment.title,totalItems:open.items.length,timeLimitMinutes:Number(assessment.timeLimitMinutes)},
    items:items.map((item,i)=>safeDeliveryItem(item,open.items[i]?.response??null))}};
  }
  const [profile,applications,evidence]=await Promise.all([
    learnerStore.getLearnerProfile(subject),
    learnerStore.listApplications(subject),
    typeof learnerStore.listCourseEvidence==='function'
      ? learnerStore.listCourseEvidence(subject,{assessmentId:assessment.id})
      : Promise.resolve({assessmentAttempts:[]})
  ]);
  const policy=attemptPolicy(assessment,evidence?.assessmentAttempts??[],now);
  if(!policy.allowed) return {status:409,body:{error:policy.error,attemptsUsed:policy.attemptsUsed,maxAttempts:policy.maxAttempts,retryAfter:policy.retryAfter}};
  if(!profile?.learnerReference||!profile?.certificateName) return {status:409,body:{error:'credential-assessment-identity-profile-incomplete'}};
  const application=(applications??[]).find((x)=>x.programId===program.id&&x.status==='active');
  if(!application?.applicationReference) return {status:409,body:{error:'active-credential-application-required',programId:program.id}};
  const selected=await secureAssessmentStore.selectOperationalItems({
    credentialProgramId:program.id,
    blueprint:{itemCount:Number(assessment.totalItems),requiredCompetencies:assessment.competencies??[]},
    exclusions:[]
  });
  if(selected.length!==Number(assessment.totalItems)) return {status:503,body:{error:'secure-operational-bank-insufficient',required:Number(assessment.totalItems),available:selected.length}};
  const represented=new Set(selected.map((x)=>x.competency));
  const missing=(assessment.competencies??[]).filter((x)=>!represented.has(x));
  if(missing.length) return {status:503,body:{error:'secure-operational-bank-competency-gap',missingCompetencies:missing}};
  const formId=`FORM-${assessment.id.replace(/^ASSESS-/,'')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const built=buildSecureOperationalForm({
    formId,formRevision:'1',credentialProgramId:program.id,blueprintVersion:String(assessment.version),items:selected,createdAt:now
  });
  assertNoSecureAnswerMaterial(built.deliveryPayload);
  await secureAssessmentStore.recordForm({privateManifest:built.privateManifest});
  const expiresAt=new Date(Date.parse(now)+Number(assessment.timeLimitMinutes)*60000).toISOString();
  const formHash=crypto.createHash('sha256').update(JSON.stringify(built.privateManifest)).digest('hex');
  const attempt={
    id:crypto.randomUUID(),assessmentId:assessment.id,assessmentVersion:String(assessment.version),formId,formHash,
    status:'started',startedAt:now,expiresAt,submittedAt:null,scoredAt:null,scorePercent:null,passed:null,
    items:built.privateManifest.itemAssignments.map((x)=>({
      position:x.position,itemId:x.secureItemId,itemVersion:Number(x.revision),competency:x.competency,response:null,score:null,maxScore:1
    }))
  };
  const created=await learnerStore.createAssessmentAttempt(subject,{attempt,programId:program.id});
  await secureAssessmentStore.recordExposure({
    candidateRef:profile.learnerReference,formId,formRevision:'1',itemAssignments:built.privateManifest.itemAssignments
  });
  return {status:201,body:{resumed:false,learner:{learnerReference:profile.learnerReference,applicationReference:application.applicationReference},
    attempt:{id:created.id??attempt.id,assessmentId:assessment.id,assessmentVersion:String(assessment.version),formId,status:'started',startedAt:now,expiresAt},
    assessment:{id:assessment.id,title:assessment.title,totalItems:selected.length,timeLimitMinutes:Number(assessment.timeLimitMinutes)},
    items:built.deliveryPayload.items.map((x)=>safeDeliveryItem(x,null))}};
}

export async function saveSecureCredentialAssessmentResponses({learnerStore,secureAssessmentStore,subject,attemptId,responses,assessment,now=new Date().toISOString()}={}){
  const attempt=await learnerStore.getAssessmentAttempt(subject,{attemptId});
  if(!attempt) return {status:404,body:{error:'assessment-attempt-not-found'}};
  if(assessment?.id && attempt.assessmentId!==assessment.id) return {status:409,body:{error:'credential-assessment-mismatch'}};
  if(attempt.status!=='started') return {status:409,body:{error:'assessment-attempt-not-editable',status:attempt.status}};
  if(attemptExpired(attempt,now)) return {status:409,body:{error:'assessment-time-expired',expiresAt:attempt.expiresAt}};
  if(!Array.isArray(responses)||!responses.length) return {status:400,body:{error:'invalid-assessment-responses'}};
  const assignments=attempt.items.map((x)=>({secureItemId:x.itemId,revision:x.itemVersion}));
  const items=await secureAssessmentStore.getOperationalItems({assignments});
  const byKey=new Map(items.map((x)=>[`${x.secureItemId}@${x.revision}`,x]));
  const allowed=new Set(attempt.items.map((x)=>`${x.itemId}@${x.itemVersion}`));
  const seen=new Set(), normalized=[];
  try{
    for(const row of responses){
      const key=`${row?.itemId}@${row?.itemVersion}`;
      if(!allowed.has(key)||seen.has(key)) throw new Error('response item mismatch');
      seen.add(key);
      const item=byKey.get(key);
      if(!item) throw new Error('secure item unavailable');
      normalized.push({itemId:item.secureItemId,itemVersion:Number(item.revision),response:validateResponse(item,row.response)});
    }
  }catch(error){ return {status:400,body:{error:'invalid-assessment-response',detail:error.message}}; }
  await learnerStore.saveAssessmentResponses(subject,{attemptId,responses:normalized});
  return {status:200,body:{attemptId,saved:normalized.length}};
}

export async function submitSecureCredentialAssessment({learnerStore,secureAssessmentStore,subject,attemptId,assessment,now=new Date().toISOString()}={}){
  const attempt=await learnerStore.getAssessmentAttempt(subject,{attemptId});
  if(!attempt) return {status:404,body:{error:'assessment-attempt-not-found'}};
  if(attempt.assessmentId!==assessment?.id) return {status:409,body:{error:'credential-assessment-mismatch'}};
  if(attempt.status==='scored') return {status:200,body:{attempt:{id:attempt.id,status:'scored',scorePercent:Number(attempt.scorePercent),passed:Boolean(attempt.passed),scoredAt:attempt.scoredAt}}};
  if(attempt.status!=='started') return {status:409,body:{error:'assessment-attempt-not-submittable',status:attempt.status}};
  const assignments=attempt.items.map((x)=>({secureItemId:x.itemId,revision:x.itemVersion}));
  const items=await secureAssessmentStore.getOperationalItems({assignments});
  const byKey=new Map(items.map((x)=>[`${x.secureItemId}@${x.revision}`,x]));
  const allowIncomplete=attemptExpired(attempt,now);
  const unanswered=attempt.items.filter((x)=>x.response==null||(Array.isArray(x.response)&&x.response.length===0));
  if(unanswered.length&&!allowIncomplete) return {status:409,body:{error:'assessment-incomplete',unanswered:unanswered.length}};
  const scoredItems=attempt.items.map((row)=>{
    const item=byKey.get(`${row.itemId}@${row.itemVersion}`);
    if(!item) throw new Error('secure operational item unavailable during scoring');
    return {...row,score:row.response==null?0:scoreItem(item,row.response),maxScore:1};
  });
  const total=scoredItems.reduce((sum,x)=>sum+Number(x.score??0),0);
  const max=scoredItems.reduce((sum,x)=>sum+Number(x.maxScore??1),0);
  const scorePercent=max>0?Number(((total/max)*100).toFixed(2)):0;
  const passing=Number(assessment.passingScorePercent);
  const scored={...attempt,status:'scored',submittedAt:now,scoredAt:now,scorePercent,passed:scorePercent>=passing,items:scoredItems};
  const saved=await learnerStore.saveAssessmentScore(subject,{attempt:scored});
  return {status:200,body:{assessment:{id:assessment.id,title:assessment.title,passingScorePercent:passing},
    attempt:{id:saved.id??attempt.id,status:'scored',submittedAt:now,scoredAt:now,scorePercent,passed:scorePercent>=passing},
    remediation:scorePercent>=passing?null:{message:'Credential assessment standard not met. Follow the approved retest and remediation policy.'}}};
}


export async function getSecureCredentialAssessmentStatus({learnerStore,secureAssessmentStore,subject,attemptId,assessment}={}){
  const attempt=await learnerStore.getAssessmentAttempt(subject,{attemptId});
  if(!attempt) return {status:404,body:{error:'assessment-attempt-not-found'}};
  if(attempt.assessmentId!==assessment?.id) return {status:409,body:{error:'credential-assessment-mismatch'}};
  if(attempt.status==='scored'){
    return {status:200,body:{assessment:{id:assessment.id,title:assessment.title,passingScorePercent:Number(assessment.passingScorePercent)},
      attempt:{id:attempt.id,status:'scored',startedAt:attempt.startedAt,expiresAt:attempt.expiresAt,submittedAt:attempt.submittedAt,scoredAt:attempt.scoredAt,scorePercent:Number(attempt.scorePercent),passed:Boolean(attempt.passed)},
      editable:false}};
  }
  const items=await secureAssessmentStore.getOperationalItems({
    assignments:(attempt.items??[]).map((x)=>({secureItemId:x.itemId,revision:x.itemVersion}))
  });
  return {status:200,body:{assessment:{id:assessment.id,title:assessment.title,totalItems:items.length,timeLimitMinutes:Number(assessment.timeLimitMinutes)},
    attempt:{id:attempt.id,status:attempt.status,startedAt:attempt.startedAt,expiresAt:attempt.expiresAt,submittedAt:attempt.submittedAt,scoredAt:attempt.scoredAt},
    expired:attemptExpired(attempt),editable:attempt.status==='started'&&!attemptExpired(attempt),
    items:items.map((item,i)=>safeDeliveryItem(item,attempt.items[i]?.response??null))}};
}
