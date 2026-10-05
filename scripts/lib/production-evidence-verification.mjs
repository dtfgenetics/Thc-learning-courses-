function words(value){
  return String(value??'')
    .replace(/([a-z0-9])([A-Z])/g,'$1 $2')
    .replace(/[^A-Za-z0-9]+/g,' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function productionEvidenceVerificationKey(label){
  const parts=words(label);
  if(!parts.length) throw new Error('Production evidence label must contain a verification key');
  return parts
    .map((part,index)=>{
      const lower=part.toLowerCase();
      return index===0?lower:lower[0].toUpperCase()+lower.slice(1);
    })
    .join('');
}

export function requiredProductionVerification(control){
  return (control?.requiredEvidence??[]).map((label)=>({
    label,
    key:productionEvidenceVerificationKey(label)
  }));
}

function meaningful(value){
  if(value===true) return true;
  if(typeof value==='string') return value.trim().length>0;
  if(typeof value==='number') return Number.isFinite(value);
  return false;
}

export function assertProductionVerificationComplete(control,verification){
  if(!verification||typeof verification!=='object'||Array.isArray(verification)){
    throw new Error(`${control?.id??'production-control'} verification must be an object`);
  }
  const required=requiredProductionVerification(control);
  const missing=required.filter(({key})=>!meaningful(verification[key]));
  if(missing.length){
    throw new Error(`${control.id} verification missing required evidence: ${missing.map(x=>`${x.key} (${x.label})`).join(', ')}`);
  }
  return required;
}
