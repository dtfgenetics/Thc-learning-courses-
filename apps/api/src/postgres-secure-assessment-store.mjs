import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function required(value,name){
  const text=String(value??'').trim();
  if(!text) throw new Error(`PostgreSQL secure assessment store requires ${name}`);
  return text;
}
function parseControls(env={}){
  const raw=required(env.THC_SECURE_ASSESSMENT_SECURITY_CONTROLS_JSON,'THC_SECURE_ASSESSMENT_SECURITY_CONTROLS_JSON');
  let controls;
  try{ controls=JSON.parse(raw); }catch{ throw new Error('THC_SECURE_ASSESSMENT_SECURITY_CONTROLS_JSON must be valid JSON'); }
  return controls;
}
function candidateHash(candidateRef,key){
  return crypto.createHmac('sha256',key).update(required(candidateRef,'candidateRef')).digest('hex');
}
function normalizeExclusions(exclusions=[]){
  return [...new Set((Array.isArray(exclusions)?exclusions:[]).map((x)=>String(x).trim()).filter(Boolean))];
}
function normalizeBlueprint(blueprint={}){
  const itemCount=Number(blueprint.itemCount??blueprint.count??0);
  const competencies=[...new Set((blueprint.requiredCompetencies??blueprint.competencies??[]).map((x)=>String(x).trim()).filter(Boolean))];
  return {itemCount:Number.isInteger(itemCount)&&itemCount>0?itemCount:null,competencies};
}
function mapItem(row){
  return {
    secureItemId:row.secure_item_id,
    revision:String(row.revision),
    status:row.status,
    sourceClass:row.source_class,
    competency:row.competency_id,
    prompt:row.prompt,
    choices:row.choices_json??null,
    scoringKey:row.scoring_key_json,
    rationale:row.rationale??null,
    presentation:row.presentation_json??null,
    bankVersion:row.bank_version
  };
}

export function createPostgresSecureAssessmentStore({query,securityControls,auditHmacKey}={}){
  if(typeof query!=='function') throw new Error('PostgreSQL secure assessment store requires query(text, params)');
  const auditKey=required(auditHmacKey,'auditHmacKey');
  return {
    kind:'private-operational-assessment-store',
    securityControls,
    async ping(){ const result=await query('select 1 as ok'); return result?.rows?.[0]?.ok===1; },
    async bankVersion(){
      const result=await query(`
        select bank_version
          from secure_assessment_banks
         where status = 'approved-operational'
         order by activated_at desc nulls last, created_at desc
         limit 1`);
      return result?.rows?.[0]?.bank_version??null;
    },
    async selectOperationalItems({credentialProgramId,blueprint={},exclusions=[]}={}){
      const programId=required(credentialProgramId,'credentialProgramId');
      const {itemCount,competencies}=normalizeBlueprint(blueprint);
      const excluded=normalizeExclusions(exclusions);
      const result=await query(`
        select i.secure_item_id,i.revision,i.bank_version,i.competency_id,i.status,i.source_class,
               i.prompt,i.choices_json,i.scoring_key_json,i.rationale,i.presentation_json
          from secure_assessment_items i
          join secure_assessment_banks b on b.bank_version=i.bank_version
         where b.credential_program_id=$1
           and b.status='approved-operational'
           and i.status='approved-operational'
           and i.source_class='private-operational'
           and not (i.secure_item_id = any($2::text[]))
           and (cardinality($3::text[])=0 or i.competency_id = any($3::text[]))
         order by i.secure_item_id, i.revision desc`,
        [programId,excluded,competencies]);
      const rows=(result?.rows??[]).map(mapItem);
      return itemCount?rows.slice(0,itemCount):rows;
    },
    async getOperationalItems({assignments=[]}={}){
      if(!Array.isArray(assignments)||!assignments.length) throw new Error('assignments required');
      const normalized=assignments.map((row)=>({
        secureItemId:required(row?.secureItemId,'secureItemId'),
        revision:Number(row?.revision)
      }));
      if(normalized.some((row)=>!/^SECITEM-[A-Z0-9-]+$/i.test(row.secureItemId)||!Number.isInteger(row.revision)||row.revision<1)){
        throw new Error('invalid secure item assignment');
      }
      const result=await query(`
        with requested as (
          select * from jsonb_to_recordset($1::jsonb) as x(secure_item_id text, revision integer)
        )
        select i.secure_item_id,i.revision,i.bank_version,i.competency_id,i.status,i.source_class,
               i.prompt,i.choices_json,i.scoring_key_json,i.rationale,i.presentation_json
          from requested r
          join secure_assessment_items i
            on i.secure_item_id=r.secure_item_id and i.revision=r.revision
          join secure_assessment_banks b on b.bank_version=i.bank_version
         where b.status='approved-operational'
           and i.status='approved-operational'
           and i.source_class='private-operational'`,
        [JSON.stringify(normalized.map((row)=>({secure_item_id:row.secureItemId,revision:row.revision})))]);
      const items=(result?.rows??[]).map(mapItem);
      if(items.length!==normalized.length) throw new Error('secure operational item assignment unavailable');
      const byKey=new Map(items.map((item)=>[`${item.secureItemId}@${item.revision}`,item]));
      return normalized.map((row)=>{
        const item=byKey.get(`${row.secureItemId}@${row.revision}`);
        if(!item) throw new Error('secure operational item assignment unavailable');
        return item;
      });
    },
    async recordForm({privateManifest}={}){
      if(!privateManifest?.formId||!privateManifest?.formRevision) throw new Error('privateManifest formId/formRevision required');
      const bank=await this.bankVersion();
      if(!bank) throw new Error('no approved operational secure assessment bank available');
      await query(`
        insert into secure_assessment_forms
          (form_id,form_revision,credential_program_id,blueprint_version,bank_version,private_manifest,status)
        values ($1,$2,$3,$4,$5,$6::jsonb,'active')
        on conflict (form_id,form_revision) do nothing`,
        [privateManifest.formId,String(privateManifest.formRevision),privateManifest.credentialProgramId,
         privateManifest.blueprintVersion,bank,JSON.stringify(privateManifest)]);
      return {formId:privateManifest.formId,formRevision:String(privateManifest.formRevision),bankVersion:bank};
    },
    async recordExposure({candidateRef,formId,formRevision='1',itemAssignments=[]}={}){
      const hash=candidateHash(candidateRef,auditKey);
      await query(`
        insert into secure_assessment_exposures
          (candidate_ref_hash,form_id,form_revision,item_assignments)
        values ($1,$2,$3,$4::jsonb)`,
        [hash,required(formId,'formId'),String(formRevision),JSON.stringify(itemAssignments??[])]);
      return {recorded:true};
    },
    async quarantineItem({secureItemId,revision,reason}={}){
      const id=required(secureItemId,'secureItemId');
      if(!/^SECITEM-[A-Z0-9-]+$/i.test(id)) throw new Error('secureItemId must use SECITEM-* namespace');
      const result=await query(`
        update secure_assessment_items
           set status='quarantined',quarantine_reason=$3,updated_at=now()
         where secure_item_id=$1 and revision=$2
         returning secure_item_id,revision,status`,
        [id,Number(revision),required(reason,'reason')]);
      return result?.rows?.[0]??null;
    }
  };
}

export async function createSecureAssessmentStore({env=process.env}={}){
  const modulePath=required(env.THC_SECURE_ASSESSMENT_POSTGRES_POOL_MODULE,'THC_SECURE_ASSESSMENT_POSTGRES_POOL_MODULE');
  const provider=await import(modulePath.startsWith('.')||modulePath.startsWith('/')?pathToFileURL(path.resolve(process.cwd(),modulePath)).href:modulePath);
  if(typeof provider.createPostgresPool!=='function') throw new Error('THC_SECURE_ASSESSMENT_POSTGRES_POOL_MODULE must export createPostgresPool({ env })');
  const pool=await provider.createPostgresPool({env});
  if(!pool||typeof pool.query!=='function') throw new Error('PostgreSQL pool must provide query(text, params)');
  return createPostgresSecureAssessmentStore({
    query:(text,params=[])=>pool.query(text,params),
    securityControls:parseControls(env),
    auditHmacKey:required(env.THC_SECURE_ASSESSMENT_AUDIT_HMAC_KEY,'THC_SECURE_ASSESSMENT_AUDIT_HMAC_KEY')
  });
}
