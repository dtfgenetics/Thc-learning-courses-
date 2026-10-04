function required(value,name){
  const text=String(value??'').trim();
  if(!text) throw new Error(`${name} required`);
  return text;
}
function managementAvailable(store,methods){
  return Boolean(store&&methods.every((method)=>typeof store[method]==='function'));
}
function safeItemResult(row){
  if(!row) return null;
  return {
    secureItemId:row.secureItemId,
    revision:Number(row.revision),
    bankVersion:row.bankVersion,
    competency:row.competency,
    status:row.status,
    auditId:row.auditId??null
  };
}
export async function createSecureAssessmentBank({store,actorId,input}={}){
  if(!managementAvailable(store,['createDraftBank'])) return {status:503,body:{error:'secure-assessment-bank-management-unavailable'}};
  try{
    const bank=await store.createDraftBank({
      bankVersion:required(input?.bankVersion,'bankVersion'),
      credentialProgramId:required(input?.credentialProgramId,'credentialProgramId'),
      metadata:input?.metadata??{},
      actorId:required(actorId,'actorId')
    });
    return {status:201,body:{bank}};
  }catch(error){
    return {status:/already exists/.test(error.message)?409:400,body:{error:'secure-assessment-bank-create-failed',detail:error.message}};
  }
}
export async function createSecureAssessmentItem({store,actorId,bankVersion,input}={}){
  if(!managementAvailable(store,['createDraftItem'])) return {status:503,body:{error:'secure-assessment-bank-management-unavailable'}};
  try{
    const item=await store.createDraftItem({
      bankVersion:required(bankVersion,'bankVersion'),
      actorId:required(actorId,'actorId'),
      item:{
        secureItemId:required(input?.secureItemId,'secureItemId'),
        revision:Number(input?.revision),
        competency:required(input?.competency,'competency'),
        prompt:required(input?.prompt,'prompt'),
        choices:Array.isArray(input?.choices)?input.choices:null,
        scoringKey:input?.scoringKey,
        rationale:input?.rationale??null,
        presentation:input?.presentation??null,
        metadata:input?.metadata??{}
      }
    });
    return {status:201,body:{item:safeItemResult(item)}};
  }catch(error){
    return {status:400,body:{error:'secure-assessment-item-create-failed',detail:error.message}};
  }
}
export async function transitionSecureAssessmentItem({store,actorId,secureItemId,revision,input}={}){
  if(!managementAvailable(store,['transitionItem'])) return {status:503,body:{error:'secure-assessment-bank-management-unavailable'}};
  try{
    const item=await store.transitionItem({
      secureItemId:required(secureItemId,'secureItemId'),
      revision:Number(revision),
      nextStatus:required(input?.nextStatus,'nextStatus'),
      evidenceRef:input?.evidenceRef??null,
      reason:input?.reason??null,
      actorId:required(actorId,'actorId')
    });
    return {status:200,body:{item:safeItemResult(item)}};
  }catch(error){
    return {status:409,body:{error:'secure-assessment-item-transition-failed',detail:error.message}};
  }
}
export async function getSecureAssessmentBankSummary({store,bankVersion}={}){
  if(!managementAvailable(store,['bankSummary'])) return {status:503,body:{error:'secure-assessment-bank-management-unavailable'}};
  const summary=await store.bankSummary({bankVersion:required(bankVersion,'bankVersion')});
  return summary?{status:200,body:{bank:summary}}:{status:404,body:{error:'secure-assessment-bank-not-found'}};
}
export async function activateSecureAssessmentBank({store,actorId,bankVersion,input}={}){
  if(!managementAvailable(store,['activateBank'])) return {status:503,body:{error:'secure-assessment-bank-management-unavailable'}};
  try{
    const bank=await store.activateBank({
      bankVersion:required(bankVersion,'bankVersion'),
      approvalRef:required(input?.approvalRef,'approvalRef'),
      actorId:required(actorId,'actorId')
    });
    return {status:200,body:{bank}};
  }catch(error){
    return {status:409,body:{error:'secure-assessment-bank-activation-failed',detail:error.message}};
  }
}
