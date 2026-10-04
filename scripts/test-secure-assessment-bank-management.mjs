import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createSecureAssessmentBank,
  createSecureAssessmentItem,
  transitionSecureAssessmentItem,
  getSecureAssessmentBankSummary,
  activateSecureAssessmentBank
} from '../apps/api/src/secure-assessment-bank-admin-service.mjs';

const calls=[];
const store={
  async createDraftBank(input){calls.push(['bank',input]);return {bankVersion:input.bankVersion,credentialProgramId:input.credentialProgramId,status:'draft',auditId:1};},
  async createDraftItem(input){calls.push(['item',input]);return {secureItemId:input.item.secureItemId,revision:input.item.revision,bankVersion:input.bankVersion,competency:input.item.competency,status:'draft',auditId:2};},
  async transitionItem(input){calls.push(['transition',input]);if(!input.evidenceRef) throw new Error('pilot transition requires evidenceRef');return {secureItemId:input.secureItemId,revision:input.revision,bankVersion:'BANK-1',status:input.nextStatus,auditId:3};},
  async bankSummary(){return {bankVersion:'BANK-1',credentialProgramId:'CREDPROG-CULT-TECH-I-001',status:'draft',counts:{items:1,draft:0,pilot:0,approvedOperational:1,quarantined:0,retired:0},activatedAt:null,retiredAt:null};},
  async activateBank(input){calls.push(['activate',input]);if(!input.approvalRef) throw new Error('approvalRef required');return {bankVersion:input.bankVersion,credentialProgramId:'CREDPROG-CULT-TECH-I-001',status:'approved-operational',activatedAt:'2026-10-04T03:30:00.000Z',auditId:4};}
};

const created=await createSecureAssessmentBank({store,actorId:'admin-1',input:{bankVersion:'BANK-1',credentialProgramId:'CREDPROG-CULT-TECH-I-001'}});
assert.equal(created.status,201);
assert.equal(created.body.bank.status,'draft');

const privateKey=2;
const item=await createSecureAssessmentItem({store,actorId:'admin-1',bankVersion:'BANK-1',input:{
  secureItemId:'SECITEM-ADMIN-001',revision:1,competency:'COMP-SAFETY-WORK-001',
  prompt:'Protected operational prompt',choices:['A','B','C','D'],scoringKey:privateKey,
  rationale:'Protected operational rationale',presentation:{mode:'single-select'}
}});
assert.equal(item.status,201);
assert.equal(item.body.item.secureItemId,'SECITEM-ADMIN-001');
const itemJson=JSON.stringify(item.body);
assert.ok(!itemJson.includes('Protected operational prompt'));
assert.ok(!itemJson.includes('Protected operational rationale'));
assert.ok(!itemJson.includes('scoringKey'));

const missingEvidence=await transitionSecureAssessmentItem({store,actorId:'admin-1',secureItemId:'SECITEM-ADMIN-001',revision:1,input:{nextStatus:'pilot'}});
assert.equal(missingEvidence.status,409);

const promoted=await transitionSecureAssessmentItem({store,actorId:'admin-1',secureItemId:'SECITEM-ADMIN-001',revision:1,input:{nextStatus:'approved-operational',evidenceRef:'EVIDENCE-ASSESSMENT-REVIEW-001'}});
assert.equal(promoted.status,200);
assert.equal(promoted.body.item.status,'approved-operational');

const summary=await getSecureAssessmentBankSummary({store,bankVersion:'BANK-1'});
assert.equal(summary.status,200);
assert.equal(summary.body.bank.counts.approvedOperational,1);
assert.ok(!JSON.stringify(summary.body).includes('scoringKey'));

const activated=await activateSecureAssessmentBank({store,actorId:'admin-1',bankVersion:'BANK-1',input:{approvalRef:'APPROVAL-SECURE-BANK-001'}});
assert.equal(activated.status,200);
assert.equal(activated.body.bank.status,'approved-operational');

const schema=fs.readFileSync('database/secure-assessment-schema.sql','utf8');
assert.match(schema,/create table if not exists secure_assessment_admin_audit/i);
assert.match(schema,/actor_id text not null/i);
assert.match(schema,/evidence_ref text/i);

const provider=fs.readFileSync('apps/api/src/postgres-secure-assessment-store.mjs','utf8');
for(const symbol of ['createDraftBank','createDraftItem','transitionItem','bankSummary','activateBank']) assert.ok(provider.includes(`async ${symbol}`));
assert.ok(provider.includes('secure_assessment_admin_audit'));
assert.ok(provider.includes("total>0 and approved=total and nonapproved=0"),'bank activation must require every bank item approved-operational');

console.log('Secure assessment bank management lifecycle and non-echo boundary: PASS');
