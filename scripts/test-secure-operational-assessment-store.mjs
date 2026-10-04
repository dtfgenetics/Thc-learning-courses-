import assert from 'node:assert/strict';
import {
  validateOperationalSecureItem,
  projectSecureDeliveryItem,
  buildSecureOperationalForm,
  assertNoSecureAnswerMaterial
} from '../packages/domain/secure-operational-assessment.mjs';
import { validateSecureAssessmentStore } from '../apps/api/src/secure-assessment-store-adapter.mjs';
import { createPostgresSecureAssessmentStore } from '../apps/api/src/postgres-secure-assessment-store.mjs';

const item=(id,competency)=>({
  secureItemId:id,revision:'1',status:'approved-operational',sourceClass:'private-operational',
  competency,prompt:`Secure prompt for ${competency}`,choices:['A','B','C','D'],
  scoringKey:2,rationale:'private scoring rationale',presentation:{mode:'single-select'}
});
assert.throws(()=>validateOperationalSecureItem({...item('SECITEM-X-001','COMP-X'),secureItemId:'ITEM-PUBLIC-001'}),/public repository ITEM/);
assert.throws(()=>validateOperationalSecureItem({...item('SECITEM-X-001','COMP-X'),status:'pilot'}),/approved-operational/);

const projected=projectSecureDeliveryItem(item('SECITEM-SAFETY-001','COMP-SAFETY-WORK-001'));
assert.equal(projected.secureItemId,'SECITEM-SAFETY-001');
assert.ok(!Object.hasOwn(projected,'scoringKey'));
assert.ok(!Object.hasOwn(projected,'rationale'));

const built=buildSecureOperationalForm({
  formId:'FORM-TECH1-A',formRevision:'1',credentialProgramId:'CREDPROG-CULT-TECH-I-001',blueprintVersion:'1.0.0',
  items:[
    item('SECITEM-SAFETY-001','COMP-SAFETY-WORK-001'),
    item('SECITEM-BIOSEC-001','COMP-SPACE-BIOSEC-001')
  ],
  createdAt:'2026-09-22T00:00:00.000Z'
});
assert.equal(built.privateManifest.itemAssignments.length,2);
assert.equal(built.deliveryPayload.items.length,2);
assertNoSecureAnswerMaterial(built.deliveryPayload);
assert.throws(()=>buildSecureOperationalForm({
  formId:'FORM-DUP',formRevision:'1',credentialProgramId:'CREDPROG-CULT-TECH-I-001',blueprintVersion:'1',
  items:[item('SECITEM-X-001','COMP-X'),item('SECITEM-X-001','COMP-X')]
}),/duplicate/);

const controls={
  accessControlModel:'least-privilege-rbac',
  leastPrivilegeAccess:true,
  privilegedAccessAudited:true,
  encryptionInTransit:true,
  encryptionAtRest:true,
  backupRecoveryDefined:true,
  keyManagementSeparated:true,
  environmentSeparated:true,
  publicRepositoryMaterialExcluded:true
};

const calls=[];
const store=validateSecureAssessmentStore({
  kind:'private-operational-assessment-store',
  securityControls:controls,
  async ping(){return true;},
  async bankVersion(){return 'private-bank-v1';},
  async selectOperationalItems(input){calls.push(['select',input]);return [];},
  async getOperationalItems(input){calls.push(['get',input]);return [];},
  async recordForm(input){calls.push(['form',input]);},
  async recordExposure(input){calls.push(['exposure',input]);},
  async quarantineItem(input){calls.push(['quarantine',input]);}
});
assert.equal(await store.ping(),true);
assert.equal(await store.bankVersion(),'private-bank-v1');
assert.equal(store.securityControls.publicRepositoryMaterialExcluded,true);
assert.throws(()=>validateSecureAssessmentStore({kind:'public-repository'}),/must provide|prohibited/);

const methodCompleteStore={
  kind:'private-operational-assessment-store',
  async ping(){return true;},
  async bankVersion(){return 'v1';},
  async selectOperationalItems(){return [];},
  async getOperationalItems(){return [];},
  async recordForm(){},
  async recordExposure(){},
  async quarantineItem(){}
};
assert.throws(()=>validateSecureAssessmentStore(methodCompleteStore),/securityControls/);
assert.throws(()=>validateSecureAssessmentStore({
  ...methodCompleteStore,
  securityControls:{...controls,privilegedAccessAudited:false}
}),/privilegedAccessAudited/);
assert.throws(()=>validateSecureAssessmentStore({
  ...methodCompleteStore,
  securityControls:{...controls,accessControlModel:'none'}
}),/accessControlModel/);
assert.throws(()=>validateSecureAssessmentStore({
  ...methodCompleteStore,
  kind:'development-public-bank',
  securityControls:controls
}),/prohibited/);

console.log('Private secure assessment-store and operational form boundary: PASS');


const sqlCalls=[];
const postgresStore=createPostgresSecureAssessmentStore({
  securityControls:controls,
  auditHmacKey:'unit-test-hmac-key-that-is-not-a-production-secret',
  async query(text,params=[]){
    const sql=String(text);
    sqlCalls.push({sql,params});
    if(sql.includes('select 1 as ok')) return {rows:[{ok:1}]};
    if(sql.includes('join secure_assessment_items')||sql.includes('from secure_assessment_items')) return {rows:[{
      secure_item_id:'SECITEM-SAFETY-101',revision:1,bank_version:'BANK-TECH1-OP-001',
      competency_id:'COMP-SAFETY-WORK-001',status:'approved-operational',source_class:'private-operational',
      prompt:'Private operational prompt',choices_json:['A','B','C','D'],scoring_key_json:2,
      rationale:'private',presentation_json:{mode:'single-select'}
    }]};
    if(sql.includes('from secure_assessment_banks')) return {rows:[{bank_version:'BANK-TECH1-OP-001'}]};
    if(sql.includes('insert into secure_assessment_forms')) return {rowCount:1,rows:[]};
    if(sql.includes('insert into secure_assessment_exposures')) return {rowCount:1,rows:[]};
    if(sql.includes('update secure_assessment_items')) return {rows:[{secure_item_id:'SECITEM-SAFETY-101',revision:1,status:'quarantined'}]};
    throw new Error(`unexpected secure store query: ${sql}`);
  }
});
validateSecureAssessmentStore(postgresStore);
assert.equal(await postgresStore.ping(),true);
assert.equal(await postgresStore.bankVersion(),'BANK-TECH1-OP-001');
const privateItems=await postgresStore.selectOperationalItems({
  credentialProgramId:'CREDPROG-CULT-TECH-I-001',
  blueprint:{itemCount:1,requiredCompetencies:['COMP-SAFETY-WORK-001']},
  exclusions:['SECITEM-EXCLUDED-001']
});
assert.equal(privateItems.length,1);
assert.equal(privateItems[0].secureItemId,'SECITEM-SAFETY-101');
assert.equal(privateItems[0].scoringKey,2);
const exactPrivateItems=await postgresStore.getOperationalItems({assignments:[{secureItemId:'SECITEM-SAFETY-101',revision:1}]});
assert.equal(exactPrivateItems.length,1);
assert.equal(exactPrivateItems[0].secureItemId,'SECITEM-SAFETY-101');
await postgresStore.recordForm({privateManifest:{
  formId:'FORM-TECH1-OP-A',formRevision:'1',credentialProgramId:'CREDPROG-CULT-TECH-I-001',
  blueprintVersion:'1.0.0',itemAssignments:[{position:1,secureItemId:'SECITEM-SAFETY-101',revision:'1',competency:'COMP-SAFETY-WORK-001'}]
}});
await postgresStore.recordExposure({
  candidateRef:'PRIVATE-CANDIDATE-REFERENCE',
  formId:'FORM-TECH1-OP-A',
  formRevision:'1',
  itemAssignments:[{position:1,secureItemId:'SECITEM-SAFETY-101',revision:'1'}]
});
const exposureCall=sqlCalls.find((row)=>row.sql.includes('insert into secure_assessment_exposures'));
assert.ok(exposureCall);
assert.ok(!exposureCall.params.includes('PRIVATE-CANDIDATE-REFERENCE'),'candidate reference must be HMACed before persistence');
assert.match(String(exposureCall.params[0]),/^[a-f0-9]{64}$/);
const quarantined=await postgresStore.quarantineItem({secureItemId:'SECITEM-SAFETY-101',revision:1,reason:'exposure incident'});
assert.equal(quarantined.status,'quarantined');
