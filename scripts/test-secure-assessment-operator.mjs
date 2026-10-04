import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { executeSecureAssessmentOperator } from './secure-assessment-operator.mjs';

const calls=[];
const store={
  createDraftBank:async (input)=>{calls.push(['createDraftBank',input]);return {bankVersion:input.bankVersion,credentialProgramId:input.credentialProgramId,status:'draft',auditId:1,secret:'drop'};},
  createDraftItem:async (input)=>{calls.push(['createDraftItem',input]);return {secureItemId:input.item.secureItemId,revision:Number(input.item.revision),bankVersion:input.bankVersion,competency:input.item.competency,status:'draft',auditId:2,scoringKey:input.item.scoringKey};},
  transitionItem:async (input)=>{calls.push(['transitionItem',input]);return {secureItemId:input.secureItemId,revision:input.revision,status:input.nextStatus,bankVersion:'BANK-1',auditId:3};},
  bankSummary:async (input)=>{calls.push(['bankSummary',input]);return {bankVersion:input.bankVersion,credentialProgramId:'CREDPROG-CULT-TECH-I-001',status:'draft',counts:{items:1,draft:1,pilot:0,approvedOperational:0,quarantined:0,retired:0},metadata:{secret:true}};},
  activateBank:async (input)=>{calls.push(['activateBank',input]);return {bankVersion:input.bankVersion,credentialProgramId:'CREDPROG-CULT-TECH-I-001',status:'approved-operational',activatedAt:'2026-10-04T00:00:00.000Z',auditId:4};},
  quarantineItem:async (input)=>{calls.push(['quarantineItem',input]);return {secureItemId:input.secureItemId,revision:input.revision,status:'quarantined',reason:input.reason};}
};
const env={THC_SECURE_ASSESSMENT_OPERATOR_ID:'operator-qa'};

const help=await executeSecureAssessmentOperator({args:['help'],env,store});
assert.ok(help.help.some((line)=>line.includes('add-item')));

const bank=await executeSecureAssessmentOperator({
  args:['create-bank','--bank=BANK-1','--program=CREDPROG-CULT-TECH-I-001','--metadata={"purpose":"pilot"}'],
  env,store
});
assert.deepEqual(bank,{bankVersion:'BANK-1',credentialProgramId:'CREDPROG-CULT-TECH-I-001',status:'draft',auditId:1});
assert.equal(calls.at(-1)[1].actorId,'operator-qa');

const privateItem={
  secureItemId:'SECITEM-TECH1-PRIVATE-001',
  revision:1,
  competency:'COMP-SAFETY-WORK-001',
  prompt:'Private operational prompt that must never be printed by the operator.',
  choices:['A','B','C','D'],
  scoringKey:2,
  rationale:'Private rationale',
  presentation:{mode:'single-select'}
};
const item=await executeSecureAssessmentOperator({
  args:['add-item','--bank=BANK-1','--input=-'],
  env,store,
  stdin:Readable.from([JSON.stringify(privateItem)])
});
assert.deepEqual(item,{
  secureItemId:'SECITEM-TECH1-PRIVATE-001',
  revision:1,
  bankVersion:'BANK-1',
  competency:'COMP-SAFETY-WORK-001',
  status:'draft',
  auditId:2
});
assert.equal(Object.hasOwn(item,'scoringKey'),false,'operator output must never echo scoring keys');
assert.equal(JSON.stringify(item).includes(privateItem.prompt),false,'operator output must never echo private prompts');
assert.equal(calls.at(-1)[1].item.scoringKey,2,'private scoring material must reach the isolated store adapter');

const promoted=await executeSecureAssessmentOperator({
  args:['transition-item','--item=SECITEM-TECH1-PRIVATE-001','--revision=1','--status=pilot','--evidence=EVIDENCE-PILOT-001'],
  env,store
});
assert.equal(promoted.status,'pilot');
assert.equal(calls.at(-1)[1].evidenceRef,'EVIDENCE-PILOT-001');

const activated=await executeSecureAssessmentOperator({
  args:['activate-bank','--bank=BANK-1','--approval=APPROVAL-STANDARD-001'],
  env,store
});
assert.equal(activated.status,'approved-operational');
assert.equal(calls.at(-1)[1].approvalRef,'APPROVAL-STANDARD-001');

const summary=await executeSecureAssessmentOperator({args:['summary','--bank=BANK-1'],env,store});
assert.equal(summary.counts.items,1);
assert.equal(Object.hasOwn(summary,'metadata'),false,'operator summary must not emit private bank metadata');

const quarantined=await executeSecureAssessmentOperator({
  args:['quarantine-item','--item=SECITEM-TECH1-PRIVATE-001','--revision=1','--reason=exposure'],
  env,store
});
assert.equal(quarantined.status,'quarantined');

await assert.rejects(
  executeSecureAssessmentOperator({args:['create-bank','--bank=BANK-2','--program=CREDPROG-CULT-TECH-I-001'],env:{},store}),
  /THC_SECURE_ASSESSMENT_OPERATOR_ID/
);
await assert.rejects(
  executeSecureAssessmentOperator({args:['unknown'],env,store}),
  /unknown secure assessment operator command/
);
await assert.rejects(
  executeSecureAssessmentOperator({args:['add-item','--bank=BANK-1','--input=package.json'],env,store}),
  /outside the public repository tree/
);

console.log('Secure assessment operator CLI contract: PASS');
