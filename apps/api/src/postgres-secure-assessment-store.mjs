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
    async createDraftBank({bankVersion,credentialProgramId,metadata={},actorId}={}){
      const version=required(bankVersion,'bankVersion');
      const programId=required(credentialProgramId,'credentialProgramId');
      const actor=required(actorId,'actorId');
      const result=await query(`
        with inserted as (
          insert into secure_assessment_banks (bank_version,credential_program_id,status,metadata_json)
          values ($1,$2,'draft',$3::jsonb)
          on conflict (bank_version) do nothing
          returning bank_version,credential_program_id,status,created_at
        ), audited as (
          insert into secure_assessment_admin_audit
            (actor_id,event_type,subject_type,subject_id,metadata_json)
          select $4,'bank.created','secure-assessment-bank',bank_version,
                 jsonb_build_object('credentialProgramId',credential_program_id,'status',status)
            from inserted
          returning id
        )
        select inserted.*, (select id from audited) as audit_id from inserted`,
        [version,programId,JSON.stringify(metadata??{}),actor]);
      if(!result?.rows?.[0]) throw new Error('secure assessment bank already exists');
      const row=result.rows[0];
      return {bankVersion:row.bank_version,credentialProgramId:row.credential_program_id,status:row.status,auditId:row.audit_id};
    },
    async createDraftItem({bankVersion,item,actorId}={}){
      const bank=required(bankVersion,'bankVersion');
      const actor=required(actorId,'actorId');
      const secureItemId=required(item?.secureItemId,'secureItemId');
      if(!/^SECITEM-[A-Z0-9-]+$/i.test(secureItemId)) throw new Error('secureItemId must use SECITEM-* namespace');
      const revision=Number(item?.revision);
      if(!Number.isInteger(revision)||revision<1) throw new Error('revision must be a positive integer');
      const competency=required(item?.competency,'competency');
      const prompt=required(item?.prompt,'prompt');
      if(!Object.hasOwn(item??{},'scoringKey')) throw new Error('private draft item requires scoringKey');
      const result=await query(`
        with eligible_bank as (
          select bank_version from secure_assessment_banks
           where bank_version=$1 and status='draft'
        ), inserted as (
          insert into secure_assessment_items
            (secure_item_id,revision,bank_version,competency_id,status,source_class,prompt,
             choices_json,scoring_key_json,rationale,presentation_json,metadata_json)
          select $2,$3,eligible_bank.bank_version,$4,'draft','private-operational',$5,
                 $6::jsonb,$7::jsonb,$8,$9::jsonb,$10::jsonb
            from eligible_bank
          on conflict (secure_item_id,revision) do nothing
          returning secure_item_id,revision,bank_version,competency_id,status
        ), audited as (
          insert into secure_assessment_admin_audit
            (actor_id,event_type,subject_type,subject_id,metadata_json)
          select $11,'item.created','secure-assessment-item',
                 secure_item_id||'@'||revision::text,
                 jsonb_build_object('bankVersion',bank_version,'competency',competency_id,'status',status)
            from inserted
          returning id
        )
        select inserted.*, (select id from audited) as audit_id from inserted`,
        [bank,secureItemId,revision,competency,prompt,
         JSON.stringify(item.choices??null),JSON.stringify(item.scoringKey),
         item.rationale??null,JSON.stringify(item.presentation??null),JSON.stringify(item.metadata??{}),actor]);
      if(!result?.rows?.[0]) throw new Error('draft bank unavailable or item revision already exists');
      const row=result.rows[0];
      return {secureItemId:row.secure_item_id,revision:Number(row.revision),bankVersion:row.bank_version,competency:row.competency_id,status:row.status,auditId:row.audit_id};
    },
    async transitionItem({secureItemId,revision,nextStatus,evidenceRef,reason,actorId}={}){
      const id=required(secureItemId,'secureItemId');
      if(!/^SECITEM-[A-Z0-9-]+$/i.test(id)) throw new Error('secureItemId must use SECITEM-* namespace');
      const rev=Number(revision);
      if(!Number.isInteger(rev)||rev<1) throw new Error('revision must be a positive integer');
      const next=required(nextStatus,'nextStatus');
      const actor=required(actorId,'actorId');
      const evidence=String(evidenceRef??'').trim()||null;
      const note=String(reason??'').trim()||null;
      const requiresEvidence=next==='pilot'||next==='approved-operational';
      if(requiresEvidence&&!evidence) throw new Error(`${nextStatus} transition requires evidenceRef`);
      const result=await query(`
        with current as (
          select secure_item_id,revision,status,bank_version
            from secure_assessment_items
           where secure_item_id=$1 and revision=$2
           for update
        ), allowed as (
          select *,
            case
              when status='draft' and $3='pilot' then true
              when status='pilot' and $3='approved-operational' then true
              when status in ('draft','pilot','approved-operational') and $3='quarantined' then true
              when status in ('approved-operational','quarantined') and $3='retired' then true
              else false
            end as ok
          from current
        ), updated as (
          update secure_assessment_items i
             set status=$3,
                 quarantine_reason=case when $3='quarantined' then $5 else i.quarantine_reason end,
                 updated_at=now()
            from allowed a
           where i.secure_item_id=a.secure_item_id and i.revision=a.revision and a.ok=true
          returning i.secure_item_id,i.revision,i.status,i.bank_version
        ), audited as (
          insert into secure_assessment_admin_audit
            (actor_id,event_type,subject_type,subject_id,evidence_ref,metadata_json)
          select $6,'item.transitioned','secure-assessment-item',
                 secure_item_id||'@'||revision::text,$4,
                 jsonb_build_object('nextStatus',status,'bankVersion',bank_version,'reason',$5)
            from updated
          returning id
        )
        select updated.*, (select id from audited) as audit_id from updated`,
        [id,rev,next,evidence,note,actor]);
      if(!result?.rows?.[0]) throw new Error('secure assessment item transition not allowed');
      const row=result.rows[0];
      return {secureItemId:row.secure_item_id,revision:Number(row.revision),status:row.status,bankVersion:row.bank_version,auditId:row.audit_id};
    },
    async bankSummary({bankVersion}={}){
      const bank=required(bankVersion,'bankVersion');
      const result=await query(`
        select b.bank_version,b.credential_program_id,b.status,b.created_at,b.activated_at,b.retired_at,
               count(i.*)::int as item_count,
               count(*) filter (where i.status='draft')::int as draft_count,
               count(*) filter (where i.status='pilot')::int as pilot_count,
               count(*) filter (where i.status='approved-operational')::int as approved_count,
               count(*) filter (where i.status='quarantined')::int as quarantined_count,
               count(*) filter (where i.status='retired')::int as retired_count
          from secure_assessment_banks b
          left join secure_assessment_items i on i.bank_version=b.bank_version
         where b.bank_version=$1
         group by b.bank_version,b.credential_program_id,b.status,b.created_at,b.activated_at,b.retired_at`,
        [bank]);
      const row=result?.rows?.[0];
      if(!row) return null;
      return {
        bankVersion:row.bank_version,credentialProgramId:row.credential_program_id,status:row.status,
        counts:{items:Number(row.item_count??0),draft:Number(row.draft_count??0),pilot:Number(row.pilot_count??0),
          approvedOperational:Number(row.approved_count??0),quarantined:Number(row.quarantined_count??0),retired:Number(row.retired_count??0)},
        activatedAt:row.activated_at?new Date(row.activated_at).toISOString():null,
        retiredAt:row.retired_at?new Date(row.retired_at).toISOString():null
      };
    },
    async activateBank({bankVersion,approvalRef,actorId}={}){
      const bank=required(bankVersion,'bankVersion');
      const approval=required(approvalRef,'approvalRef');
      const actor=required(actorId,'actorId');
      const result=await query(`
        with counts as (
          select b.bank_version,b.credential_program_id,b.status,
                 count(i.*)::int as total,
                 count(*) filter (where i.status='approved-operational')::int as approved,
                 count(*) filter (where i.status<>'approved-operational')::int as nonapproved
            from secure_assessment_banks b
            left join secure_assessment_items i on i.bank_version=b.bank_version
           where b.bank_version=$1
           group by b.bank_version,b.credential_program_id,b.status
        ), eligible as (
          select * from counts where status in ('draft','pilot') and total>0 and approved=total and nonapproved=0
        ), retired_prior as (
          update secure_assessment_banks b
             set status='retired',retired_at=now()
            from eligible e
           where b.credential_program_id=e.credential_program_id
             and b.bank_version<>e.bank_version
             and b.status='approved-operational'
          returning b.bank_version
        ), activated as (
          update secure_assessment_banks b
             set status='approved-operational',activated_at=now(),retired_at=null
            from eligible e
           where b.bank_version=e.bank_version
          returning b.bank_version,b.credential_program_id,b.status,b.activated_at
        ), audited as (
          insert into secure_assessment_admin_audit
            (actor_id,event_type,subject_type,subject_id,evidence_ref,metadata_json)
          select $3,'bank.activated','secure-assessment-bank',bank_version,$2,
                 jsonb_build_object('credentialProgramId',credential_program_id,'status',status)
            from activated
          returning id
        )
        select activated.*, (select id from audited) as audit_id from activated`,
        [bank,approval,actor]);
      if(!result?.rows?.[0]) throw new Error('bank activation requires a non-empty bank with every item approved-operational');
      const row=result.rows[0];
      return {bankVersion:row.bank_version,credentialProgramId:row.credential_program_id,status:row.status,activatedAt:new Date(row.activated_at).toISOString(),auditId:row.audit_id};
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
