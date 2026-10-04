import fs from 'node:fs';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ajv=new Ajv2020({allErrors:true,strict:false});
addFormats(ajv);

const standardSchema=JSON.parse(fs.readFileSync('schemas/standard-setting-evidence.schema.json','utf8'));
const formSchema=JSON.parse(fs.readFileSync('schemas/secure-form-equivalence-evidence.schema.json','utf8'));
const validateStandard=ajv.compile(standardSchema);
const validateForm=ajv.compile(formSchema);

const standard={
  id:'STDSET-TECH1-001-V1',
  courseId:'COURSE-LH-TECH1-001',
  courseVersion:'0.2.0',
  assessmentId:'ASSESS-LH-TECH1-001-FINAL',
  assessmentVersion:1,
  status:'approved',
  method:'modified-angoff',
  panelistCount:3,
  stableItemCount:20,
  performanceLevelDescriptionApproved:true,
  recommendedCutScore:{rawScore:15.6,percent:78,roundingRule:'round up to next whole scored point'},
  impactReview:{pilotSampleSize:50,estimatedPassRateAtRecommendedCut:0.74,sensitivityReviewed:true,notes:null},
  governanceDecision:{decision:'adopt',productionCutScorePercent:80,decisionAuthority:'GOV-BOARD',decisionDate:'2026-09-23T00:00:00Z',rationale:'Test fixture'},
  authorityId:'ASSESSMENT-LEAD',
  recordedAt:'2026-09-23T00:00:00Z',
  summary:'Synthetic schema-validation fixture only.',
  evidenceRefs:[],
  limitations:[]
};
assert.equal(validateStandard(standard),true,JSON.stringify(validateStandard.errors));

const secure={
  id:'FORMEQ-TECH1-001-V1',
  courseId:'COURSE-LH-TECH1-001',
  courseVersion:'0.2.0',
  assessmentId:'ASSESS-LH-TECH1-001-FINAL',
  assessmentVersion:1,
  status:'approved',
  credentialProgramId:'CREDPROG-CULT-TECH-I-001',
  blueprintVersion:'1.0.0',
  formCount:2,
  forms:[
    {formId:'FORM-A',formRevision:'1',itemCount:40,manifestFingerprint:'abc12345deadbeef',approvedOperationalItemsOnly:true,publicItemsExcluded:true},
    {formId:'FORM-B',formRevision:'1',itemCount:40,manifestFingerprint:'def67890deadbeef',approvedOperationalItemsOnly:true,publicItemsExcluded:true}
  ],
  equivalenceReview:{
    blueprintCoverageEquivalent:true,cognitiveDemandEquivalent:true,criticalContentRepresentationEquivalent:true,
    scoredOpportunityEquivalent:true,retestDuplicationReviewed:true,maximumObservedItemOverlapProportion:0.2,
    quantitativeEvidenceStatus:'preliminary',notes:null
  },
  securityReview:{
    privateStoreVerified:true,answerMaterialExcludedFromDelivery:true,exposureTrackingEnabled:true,quarantineWorkflowEnabled:true,notes:null
  },
  authorityId:'ASSESSMENT-SECURITY-LEAD',
  recordedAt:'2026-09-23T00:00:00Z',
  summary:'Synthetic schema-validation fixture only.',
  evidenceRefs:[],
  limitations:[]
};
assert.equal(validateForm(secure),true,JSON.stringify(validateForm.errors));

const insecure=structuredClone(secure);
insecure.forms[0].publicItemsExcluded=false;
assert.equal(validateForm(insecure),true,'Schema permits boolean false so semantic validator can report exact governance defect');

console.log('Standard-setting and secure-form evidence schemas compile and accept controlled fixture shapes.');
