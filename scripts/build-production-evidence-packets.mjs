import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const has=(x)=>args.includes(x);
const value=(name)=>{const i=args.indexOf(name);return i>=0?args[i+1]:null;};
const outDir=path.resolve(root,value('--out')??'generated/production-evidence-packets');
const write=has('--write');
const asJson=has('--json');

const contract=JSON.parse(fs.readFileSync(path.join(root,'registry/production-validation-evidence.json'),'utf8'));
const readiness=JSON.parse(fs.readFileSync(path.join(root,'registry/system-readiness.json'),'utf8'));

const owners={
  'production-postgres':'platform/database owner',
  'admin-mfa':'identity/security owner',
  'row-level-authorization':'database/security owner',
  'security-review':'independent security reviewer',
  'practical-submission-workflow':'learner operations + evaluator operations',
  'staging-environment':'platform/release owner',
  'production-environment':'platform/release owner',
  'backup-restore':'database/platform owner',
  'monitoring-alerting':'operations/on-call owner',
  'issuer-identity':'credential governance authority',
  'secure-assessment-store':'assessment security/platform owner',
  'credential-signing':'credential security/key-custody authority',
  'revocation-persistence':'credential platform owner'
};

const liveChecks={
  'production-postgres':[
    'Record exact deployed database/environment identifier and schema/migration version.',
    'Verify TLS connection requirements from the deployed API/runtime.',
    'Execute a controlled transaction/read-write smoke test and capture safe transaction identifiers.',
    'Exercise retry/failure behavior without committing credentials or learner data.'
  ],
  'admin-mfa':[
    'Identify the production identity-provider policy that protects administrative scopes.',
    'Complete a successful MFA challenge with a dedicated/pseudonymous test admin identity.',
    'Demonstrate denial when the same administrative scope is attempted without the required MFA evidence.'
  ],
  'row-level-authorization':[
    'Record the exact deployed policy/migration version.',
    'Verify learner A cannot read or write learner B protected rows.',
    'Verify authorized service/admin behavior separately from learner behavior.',
    'Capture safe result identifiers rather than row contents.'
  ],
  'security-review':[
    'Freeze the deployment/build and review scope.',
    'Record reviewer identity/organization and methodology.',
    'Disposition every finding and record residual-risk decisions.',
    'Do not mark approved until the designated authority accepts the disposition.'
  ],
  'practical-submission-workflow':[
    'Submit practical evidence as an authenticated learner.',
    'Verify persistent evidence-reference readback after a fresh session.',
    'Verify evaluator queue visibility plus assignment/claim behavior.',
    'Verify scoring/follow-up persistence and the privacy boundary.'
  ],
  'staging-environment':[
    'Record exact staging URL/service identity, database identity and authentication configuration identity.',
    'Record the exact build SHA.',
    'Run a post-deploy smoke suite against staging.'
  ],
  'production-environment':[
    'Record exact production service identity, database identity and authentication configuration identity.',
    'Record the exact release/build SHA.',
    'Run a post-deploy smoke suite against production.'
  ],
  'backup-restore':[
    'Record a successful backup job identifier and timestamp.',
    'Restore into an isolated target.',
    'Verify schema/data integrity after restore.',
    'Record observed RPO/RTO and any exceptions.'
  ],
  'monitoring-alerting':[
    'Record deployed metrics/log sources and alert-rule identifiers.',
    'Trigger a safe synthetic/test alert.',
    'Capture delivery confirmation and owner acknowledgement.',
    'Disposition any failed delivery path.'
  ],
  'issuer-identity':[
    'Record the production issuer identifier and ownership/control evidence.',
    'Verify the public representation used by credential verification.',
    'Record governance approval.'
  ],
  'secure-assessment-store':[
    'Record the deployed private secure assessment store/provider identity.',
    'Verify store ping and exact bank version from the deployed runtime.',
    'Select approved-operational private items and verify public/development item IDs are excluded.',
    'Record a secure form and verify exposure tracking is written.',
    'Exercise quarantine workflow and verify quarantined items are not selectable.',
    'Verify delivery projection excludes scoring keys, rationales and answer material.'
  ],
  'credential-signing':[
    'Record the managed signing provider/key identifier without secret key material.',
    'Verify key-custody/access policy.',
    'Perform a controlled signing smoke test and independent verification.',
    'Confirm rotation/revocation procedure evidence.'
  ],
  'revocation-persistence':[
    'Execute a persistent revocation transaction in the controlled environment.',
    'Verify public credential verification reflects the revoked state.',
    'Verify audit-event persistence.',
    'Exercise retry/idempotency behavior.'
  ]
};

function packet(control){
  const mapped=(control.readiness??[]).map(([area,gate])=>({
    area,gate,current:Boolean(readiness.areas?.[area]?.gates?.[gate])
  }));
  return {
    controlId:control.id,
    owner:owners[control.id]??'designated operational owner',
    currentControlStatus:control.status,
    mappedReadiness:mapped,
    requiredEvidence:control.requiredEvidence??[],
    evidenceRefs:control.evidenceRefs??[],
    executionChecks:liveChecks[control.id]??[],
    completionRule:'Advance only from real deployment-backed evidence with findings dispositioned; repository code/tests alone are insufficient.',
    prohibited:['secrets','raw tokens','database passwords','private keys','learner PII','fabricated success evidence']
  };
}

function md(p){
  const lines=[
    `# Production Evidence Packet — ${p.controlId}`,'',
    `**Responsible role:** ${p.owner}`,
    `**Current contract state:** ${p.currentControlStatus}`,'',
    '## Mapped readiness gates',''
  ];
  for(const m of p.mappedReadiness) lines.push(`- \`${m.area}.${m.gate}\` — current: **${m.current?'true':'false'}**`);
  lines.push('','## Required evidence','');
  for(const x of p.requiredEvidence) lines.push(`- [ ] ${x}`);
  lines.push('','## Live execution checks','');
  for(const x of p.executionChecks) lines.push(`- [ ] ${x}`);
  lines.push(
    '','## Evidence record','',
    '- Environment:',
    '- Deployment/service identity:',
    '- Build/source SHA:',
    '- Observed at:',
    '- Evidence references:',
    '- Findings:',
    '- Findings disposition:',
    '- Authority:',
    '- Decision: in-progress / evidence-complete / approved / revision-required',
    '- Limitations:',
    '',
    '## Integrity boundary','',
    p.completionRule,
    '',
    'Never commit secrets, raw tokens, passwords, private keys, learner PII, or fabricated validation evidence.'
  );
  return lines.join('\n')+'\n';
}

const packets=(contract.controls??[]).map(packet);
if(packets.length!==13) throw new Error(`Expected 13 production controls, found ${packets.length}`);
const ids=packets.map(p=>p.controlId);
if(new Set(ids).size!==ids.length) throw new Error('Duplicate production control IDs');

if(write){
  fs.mkdirSync(outDir,{recursive:true});
  for(const p of packets){
    fs.writeFileSync(path.join(outDir,`${p.controlId}.md`),md(p));
    fs.writeFileSync(path.join(outDir,`${p.controlId}.json`),JSON.stringify(p,null,2)+'\n');
  }
  fs.writeFileSync(path.join(outDir,'README.md'),[
    '# Production Validation Execution Packets','',
    'Generated from registry/production-validation-evidence.json and registry/system-readiness.json.','',
    ...packets.map(p=>`- \`${p.controlId}\` — ${p.owner}`)
  ].join('\n')+'\n');
}

const out={
  packetCount:packets.length,
  mappedGateCount:packets.reduce((n,p)=>n+p.mappedReadiness.length,0),
  controlsWithTrueReadiness:packets.filter(p=>p.mappedReadiness.some(m=>m.current)).map(p=>p.controlId),
  outputDirectory:path.relative(root,outDir),
  wroteFiles:write,
  packets:packets.map(p=>({controlId:p.controlId,owner:p.owner,mappedGates:p.mappedReadiness.length,requiredEvidence:p.requiredEvidence.length,executionChecks:p.executionChecks.length}))
};
console.log(JSON.stringify(out,null,2));
