import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const getAll=n=>{const out=[];for(let i=0;i<args.length;i++)if(args[i]===n&&args[i+1])out.push(args[i+1]);return out;};
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const has=x=>args.includes(x);
const write=has('--write');

const courseId=get('--course');
const authority=get('--authority');
const blueprintVersion=get('--blueprint-version');
const formSpecs=getAll('--form');
if(!courseId||!authority||!blueprintVersion||formSpecs.length<2) throw new Error('Usage: --course <COURSE-ID> --authority <id> --blueprint-version <version> --form <id|revision|itemCount|fingerprint> --form <...> [--write]');

const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const assessments=readDir('content/assessments');
const programs=readDir('content/credential-programs').filter(x=>x.id);
const course=courses.get(courseId); if(!course) throw new Error('Unknown course '+courseId);
if(!course.finalAssessment) throw new Error(courseId+' does not use a conventional final');
const assessment=assessments.find(x=>x.id===course.finalAssessment); if(!assessment) throw new Error('Missing assessment '+course.finalAssessment);
const program=programs.find(p=>(p.requiredCourses??[]).includes(courseId)); if(!program) throw new Error('No credential program maps '+courseId);

const forms=formSpecs.map(spec=>{
  const parts=spec.split('|');
  if(parts.length!==4) throw new Error('Each --form must be id|revision|itemCount|fingerprint');
  const [formId,formRevision,itemCountRaw,manifestFingerprint]=parts;
  const itemCount=Number(itemCountRaw);
  if(!formId||!formRevision||!Number.isInteger(itemCount)||itemCount<1||!manifestFingerprint||manifestFingerprint.length<8) throw new Error('Invalid --form '+spec);
  return {formId,formRevision,itemCount,manifestFingerprint,approvedOperationalItemsOnly:false,publicItemsExcluded:true};
});
const keys=forms.map(f=>f.formId+'@'+f.formRevision);
if(new Set(keys).size!==keys.length) throw new Error('Duplicate form id/revision');

const now=new Date().toISOString();
const safe=v=>String(v).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
const record={
  id:'FORMEQ-'+safe(course.id.replace(/^COURSE-/,''))+'-'+now.replace(/[-:.TZ]/g,'').slice(0,14),
  courseId:course.id,
  courseVersion:String(course.version),
  assessmentId:assessment.id,
  assessmentVersion:assessment.version,
  status:'draft',
  credentialProgramId:program.id,
  blueprintVersion,
  formCount:forms.length,
  forms,
  equivalenceReview:{
    blueprintCoverageEquivalent:false,
    cognitiveDemandEquivalent:false,
    criticalContentRepresentationEquivalent:false,
    scoredOpportunityEquivalent:false,
    retestDuplicationReviewed:false,
    maximumObservedItemOverlapProportion:null,
    quantitativeEvidenceStatus:'not-yet-available',
    notes:null
  },
  securityReview:{
    privateStoreVerified:false,
    answerMaterialExcludedFromDelivery:false,
    exposureTrackingEnabled:false,
    quarantineWorkflowEnabled:false,
    notes:null
  },
  authorityId:authority,
  recordedAt:now,
  summary:'Secure-form equivalence review opened for '+course.id+'@'+course.version+' using opaque form identifiers/fingerprints; equivalence and security review remain incomplete.',
  evidenceRefs:[],
  limitations:['Draft intake only. No operational form is approved by this record. Secure items, answer keys, manifests, and private store contents must remain outside this repository.']
};

if(write){
  const dir=path.join(root,'content/secure-form-equivalence-evidence');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,record.id+'.json');if(fs.existsSync(file))throw new Error('Refusing to overwrite '+file);
  fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n');
}
console.log(JSON.stringify({wroteFile:write,record},null,2));
