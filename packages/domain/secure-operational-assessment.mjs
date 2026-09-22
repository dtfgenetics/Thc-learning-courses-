function nonEmpty(value,name){
  const text=String(value??'').trim();
  if(!text) throw new Error(`${name} required`);
  return text;
}
export function validateOperationalSecureItem(item){
  if(!item||typeof item!=='object') throw new Error('secure operational item required');
  const secureItemId=nonEmpty(item.secureItemId,'secureItemId');
  if(/^ITEM-/i.test(secureItemId)) throw new Error('public repository ITEM-* identifiers are prohibited for operational secure items');
  if(!/^SECITEM-[A-Z0-9-]+$/i.test(secureItemId)) throw new Error('secureItemId must use SECITEM-* private operational namespace');
  const revision=nonEmpty(item.revision,'revision');
  if(item.status!=='approved-operational') throw new Error(`${secureItemId}: status must be approved-operational`);
  if(item.sourceClass!=='private-operational') throw new Error(`${secureItemId}: sourceClass must be private-operational`);
  const competency=nonEmpty(item.competency,'competency');
  const prompt=nonEmpty(item.prompt,'prompt');
  const choices=Array.isArray(item.choices)?item.choices.map((x)=>String(x)):null;
  if(choices&&choices.length<2) throw new Error(`${secureItemId}: choices must contain at least two options`);
  if(!Object.hasOwn(item,'scoringKey')) throw new Error(`${secureItemId}: private secure item requires scoringKey in authoring record`);
  return {...item,secureItemId,revision,competency,prompt,choices};
}
export function projectSecureDeliveryItem(item){
  const secure=validateOperationalSecureItem(item);
  return {
    secureItemId:secure.secureItemId,
    revision:secure.revision,
    competency:secure.competency,
    prompt:secure.prompt,
    ...(secure.choices?{choices:secure.choices}:{}),
    presentation:secure.presentation??null
  };
}
export function buildSecureOperationalForm({formId,formRevision,credentialProgramId,blueprintVersion,items,createdAt=new Date().toISOString()}={}){
  nonEmpty(formId,'formId'); nonEmpty(formRevision,'formRevision'); nonEmpty(credentialProgramId,'credentialProgramId'); nonEmpty(blueprintVersion,'blueprintVersion');
  if(!Array.isArray(items)||!items.length) throw new Error('secure operational form requires items');
  const secureItems=items.map(validateOperationalSecureItem);
  const ids=secureItems.map((x)=>`${x.secureItemId}@${x.revision}`);
  if(new Set(ids).size!==ids.length) throw new Error('secure operational form contains duplicate item revisions');
  const privateManifest={
    formId,formRevision,credentialProgramId,blueprintVersion,createdAt,
    itemAssignments:secureItems.map((item,index)=>({
      position:index+1,secureItemId:item.secureItemId,revision:item.revision,competency:item.competency
    }))
  };
  const deliveryPayload={
    formId,formRevision,credentialProgramId,
    items:secureItems.map((item,index)=>({position:index+1,...projectSecureDeliveryItem(item)}))
  };
  return {privateManifest,deliveryPayload};
}
export function assertNoSecureAnswerMaterial(value,path='root'){
  const forbidden=new Set(['correct','answer','answerKey','scoringKey','rationale','pilotStatistics','bankMetadata']);
  if(!value||typeof value!=='object') return true;
  for(const [key,child] of Object.entries(value)){
    if(forbidden.has(key)) throw new Error(`${path} exposes secure answer/bank field ${key}`);
    assertNoSecureAnswerMaterial(child,`${path}.${key}`);
  }
  return true;
}
