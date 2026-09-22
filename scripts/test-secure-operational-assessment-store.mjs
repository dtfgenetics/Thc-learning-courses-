import assert from 'node:assert/strict';
import {
  validateOperationalSecureItem,
  projectSecureDeliveryItem,
  buildSecureOperationalForm,
  assertNoSecureAnswerMaterial
} from '../packages/domain/secure-operational-assessment.mjs';
import { validateSecureAssessmentStore } from '../apps/api/src/secure-assessment-store-adapter.mjs';

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

const calls=[];
const store=validateSecureAssessmentStore({
  kind:'private-operational-assessment-store',
  async ping(){return true;},
  async bankVersion(){return 'private-bank-v1';},
  async selectOperationalItems(input){calls.push(['select',input]);return [];},
  async recordForm(input){calls.push(['form',input]);},
  async recordExposure(input){calls.push(['exposure',input]);},
  async quarantineItem(input){calls.push(['quarantine',input]);}
});
assert.equal(await store.ping(),true);
assert.equal(await store.bankVersion(),'private-bank-v1');
assert.throws(()=>validateSecureAssessmentStore({kind:'public-repository'}),/must provide|prohibited/);

console.log('Private secure assessment-store and operational form boundary: PASS');
