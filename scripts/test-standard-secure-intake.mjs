import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
const stdSchema=ajv.compile(JSON.parse(fs.readFileSync('schemas/standard-setting-evidence.schema.json','utf8')));
const secureSchema=ajv.compile(JSON.parse(fs.readFileSync('schemas/secure-form-equivalence-evidence.schema.json','utf8')));

const std=spawnSync(process.execPath,[
  'scripts/create-standard-setting-evidence-record.mjs',
  '--course','COURSE-LH-TECH1-001','--method','modified-angoff','--panelists','3','--raw-score','29','--percent','80.6','--authority','TEST-PANEL-LEAD'
],{cwd:process.cwd(),encoding:'utf8'});
if(std.status!==0) throw new Error(std.stderr||std.stdout);
const stdRecord=JSON.parse(std.stdout).record;
if(!stdSchema(stdRecord)) throw new Error('standard-setting schema failure: '+JSON.stringify(stdSchema.errors));
if(stdRecord.status!=='panel-complete'||stdRecord.governanceDecision.decision!=='pending'||stdRecord.governanceDecision.productionCutScorePercent!==null) throw new Error('standard-setting intake fabricated governance adoption');

const secure=spawnSync(process.execPath,[
  'scripts/create-secure-form-equivalence-record.mjs',
  '--course','COURSE-LH-TECH1-001','--authority','TEST-SECURITY-LEAD','--blueprint-version','ASSESS-LH-TECH1-001-FINAL@1.2.0',
  '--form','FORM-A|r1|36|abcdef0123456789','--form','FORM-B|r1|36|0123456789abcdef'
],{cwd:process.cwd(),encoding:'utf8'});
if(secure.status!==0) throw new Error(secure.stderr||secure.stdout);
const secureRecord=JSON.parse(secure.stdout).record;
if(!secureSchema(secureRecord)) throw new Error('secure-form schema failure: '+JSON.stringify(secureSchema.errors));
if(secureRecord.status!=='draft') throw new Error('secure-form intake must start draft');
if(secureRecord.forms.some(f=>f.approvedOperationalItemsOnly!==false)) throw new Error('secure-form intake fabricated operational approval');
if(Object.values(secureRecord.equivalenceReview).some((v)=>v===true)) throw new Error('secure-form intake fabricated equivalence review');
if(Object.values(secureRecord.securityReview).some((v)=>v===true)) throw new Error('secure-form intake fabricated security review');

console.log('Standard-setting and secure-form intake: PASS (schema-valid fail-closed records).');
