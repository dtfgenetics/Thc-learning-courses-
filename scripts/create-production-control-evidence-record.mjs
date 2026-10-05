import {argsMap,read,int,safe,writeRecord} from './lib/evidence-intake-utils.mjs';

const a=argsMap();
for(const k of ['control','environment','authority','evidence-ref']) if(!a[k]) throw new Error(`--${k} is required`);
const contract=read('registry/production-validation-evidence.json');
const control=(contract.controls??[]).find(x=>x.id===a.control); if(!control) throw new Error(`Unknown production control ${a.control}`);
if(!['staging','production','cross-environment'].includes(a.environment)) throw new Error('--environment must be staging, production, or cross-environment');
const refs=a['evidence-ref'].split(',').map(x=>x.trim()).filter(Boolean);
if(!refs.length) throw new Error('--evidence-ref must contain at least one safe evidence reference');
const deploymentKeys=['service-id','build-id','source-sha','schema-version','image-digest','attestation-ref'];
const hasDeploymentIdentity=deploymentKeys.some(k=>a[k]);
let deploymentIdentity=null;
if(hasDeploymentIdentity){
  for(const k of ['source-sha','image-digest','attestation-ref']) if(!a[k]) throw new Error(`--${k} is required when deployment identity is supplied`);
  if(!/^[0-9a-fA-F]{40}$/.test(a['source-sha'])) throw new Error('--source-sha must be an exact 40-character Git commit SHA');
  if(!/^sha256:[0-9a-fA-F]{64}$/.test(a['image-digest'])) throw new Error('--image-digest must be a sha256: digest with 64 hexadecimal characters');
  deploymentIdentity={
    serviceId:a['service-id']??null,
    buildId:a['build-id']??null,
    sourceSha:a['source-sha'],
    schemaVersion:a['schema-version']??null,
    imageDigest:a['image-digest'],
    attestationRef:a['attestation-ref']
  };
}
const now=new Date().toISOString();
const record={
  id:`PRODEVID-${safe(control.id)}-${safe(now.slice(0,10))}`,
  controlId:control.id,
  status:'in-progress',
  environment:a.environment,
  observedAt:now,
  authorityId:a.authority,
  summary:`Production validation opened for ${control.id}; deployment-backed verification is in progress.`,
  evidenceRefs:refs,
  findingsDispositioned:false,
  deploymentIdentity,
  verification:{},
  limitations:['In-progress record; code/tests alone do not satisfy production approval.']
};
writeRecord('content/production-control-evidence',record,Boolean(a.write));
