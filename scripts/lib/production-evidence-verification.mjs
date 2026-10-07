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

function validIsoTimestamp(value){
  if(typeof value!=='string') return false;
  const text=value.trim();
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(text)) return false;
  return Number.isFinite(Date.parse(text));
}

function operationalString(value,{min=4}={}){
  if(typeof value!=='string') return false;
  const text=value.trim();
  if(text.length<min) return false;
  if(/^(?:todo|tbd|pending|placeholder|example|sample|unknown|n\/a|null|none)$/i.test(text)) return false;
  return true;
}

function assertBackupRestoreSemantics(verification){
  const errors=[];
  if(!operationalString(verification.backupJobIdentifier,{min:6})) errors.push('backupJobIdentifier must be a real backup job identifier');
  if(!validIsoTimestamp(verification.successfulBackupTimestamp)) errors.push('successfulBackupTimestamp must be an ISO-8601 UTC timestamp');
  if(!operationalString(verification.isolatedRestoreTarget,{min:6})) errors.push('isolatedRestoreTarget must identify the isolated restore target');
  if(!validIsoTimestamp(verification.restoreDrillTimestamp)) errors.push('restoreDrillTimestamp must be an ISO-8601 UTC timestamp');
  if(validIsoTimestamp(verification.successfulBackupTimestamp)&&validIsoTimestamp(verification.restoreDrillTimestamp)&&Date.parse(verification.restoreDrillTimestamp)<Date.parse(verification.successfulBackupTimestamp)){
    errors.push('restoreDrillTimestamp must not precede successfulBackupTimestamp');
  }
  if(!operationalString(verification.schemaDataIntegrityVerification,{min:8})) errors.push('schemaDataIntegrityVerification must summarize the integrity result');
  if(!operationalString(verification.rpoRtoObservations,{min:8})||!/\brpo\b/i.test(verification.rpoRtoObservations)||!/\brto\b/i.test(verification.rpoRtoObservations)){
    errors.push('rpoRtoObservations must include both RPO and RTO observations');
  }
  if(errors.length) throw new Error('backup-restore verification semantics invalid: '+errors.join('; '));
}

function assertMonitoringSemantics(verification){
  const errors=[];
  if(!operationalString(verification.deployedMetricsLogSource,{min:6})) errors.push('deployedMetricsLogSource must identify the deployed telemetry source');
  if(!operationalString(verification.alertRuleIdentifiers,{min:4})) errors.push('alertRuleIdentifiers must identify deployed alert rules');
  if(!validIsoTimestamp(verification.syntheticTestAlertTimestamp)) errors.push('syntheticTestAlertTimestamp must be an ISO-8601 UTC timestamp');
  if(!operationalString(verification.deliveryRecord,{min:6})) errors.push('deliveryRecord must identify delivered alert evidence');
  if(!operationalString(verification.ownerAcknowledgement,{min:6})) errors.push('ownerAcknowledgement must identify the owner acknowledgement');
  if(errors.length) throw new Error('monitoring-alerting verification semantics invalid: '+errors.join('; '));
}

function assertControlSemantics(control,verification){
  if(control?.id==='backup-restore') assertBackupRestoreSemantics(verification);
  if(control?.id==='monitoring-alerting') assertMonitoringSemantics(verification);
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
  assertControlSemantics(control,verification);
  return required;
}
