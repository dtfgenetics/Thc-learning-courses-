export const requiredCredentialAuthorizationTruePaths=[
  ['issuer','authorityConfirmed'],
  ['signing','managedExternalSignerRequired'],
  ['signing','keyIdRecorded'],
  ['signing','privateKeyOutsideRepository'],
  ['signing','keyRotationProcedureApproved'],
  ['signing','compromiseResponseApproved'],
  ['verification','publicVerificationEnabled'],
  ['verification','minimumNecessaryProjection'],
  ['verification','tamperDetectionEnabled'],
  ['verification','statusLookupSupportsRevocation'],
  ['revocation','policyApproved'],
  ['revocation','authorizedDecisionMakerRequired'],
  ['revocation','reasonRecorded'],
  ['revocation','effectiveDateRecorded'],
  ['revocation','publicStatusUpdated'],
  ['revocation','auditTrailRequired'],
  ['appeals','policyApproved'],
  ['appeals','preserveOriginalRecord'],
  ['appeals','independentOrAuthorizedReviewRequired'],
  ['appeals','decisionRecordRequired'],
  ['appeals','secureAnswerDisclosureProhibited'],
  ['lifecycle','validityPolicyApproved'],
  ['lifecycle','renewalPolicyApproved'],
  ['lifecycle','supersessionPolicyApproved'],
  ['lifecycle','expirationBehaviorDefined'],
  ['privacyRetention','policyApproved'],
  ['privacyRetention','dataMinimization'],
  ['privacyRetention','roleBasedAccess'],
  ['privacyRetention','retentionScheduleApproved'],
  ['privacyRetention','auditTrailRequired'],
  ['privacyRetention','deletionOrDispositionProcedureApproved'],
  ['productionControls','persistentStoreValidated'],
  ['productionControls','authorizationValidated'],
  ['productionControls','backupRestoreValidated'],
  ['productionControls','monitoringValidated'],
  ['productionControls','signingIntegrationValidated'],
  ['productionControls','secureAssessmentStoreValidated']
];

export function getPath(obj,path){return path.reduce((v,k)=>v?.[k],obj);}
export function assertCredentialAuthorizationEvidenceComplete(record){
  if(record.status!=='evidence-complete') throw new Error('Credential authorization source must have status=evidence-complete');
  for(const p of requiredCredentialAuthorizationTruePaths){
    if(getPath(record,p)!==true) throw new Error('Credential authorization source requires '+p.join('.')+'=true before final approval');
  }
  return true;
}

export function applyCredentialProgramAuthorization(program){
  const next=structuredClone(program);
  next.status='approved';
  next.assessmentModel={...next.assessmentModel,standardSettingStatus:'validated'};
  next.validation={
    ...next.validation,
    jobTaskAnalysis:'validated',
    smeEmployerValidation:'validated',
    assessmentReview:'validated',
    accessibilityReview:'validated'
  };
  return next;
}

export function applyCourseCredentialAuthorization(course){
  const next=structuredClone(course);
  next.extensions={...(next.extensions??{}),professionalCredentialUseAuthorized:true};
  if(Object.prototype.hasOwnProperty.call(next.extensions,'liveCredentialFormApproved')){
    next.extensions.liveCredentialFormApproved=true;
  }
  return next;
}
