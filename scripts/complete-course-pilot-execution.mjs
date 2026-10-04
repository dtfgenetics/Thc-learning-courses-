import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), args=process.argv.slice(2);
const get=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;}, has=x=>args.includes(x);
const sourceId=get('--source'), sourceFile=get('--source-file'), authority=get('--authority');
const write=has('--write');
if((!sourceId&&!sourceFile)||!authority) throw new Error('Usage: --source <PILOTEXEC-ID> or --source-file <path> --authority <id> --confirm-feedback --confirm-data-quality --confirm-fairness-review --confirm-fairness-disposition [--confirm-knowledge-current] [--confirm-performance-current] [--stop-disposition text] [--write]');
for(const flag of ['--confirm-feedback','--confirm-data-quality','--confirm-fairness-review','--confirm-fairness-disposition']) if(!has(flag)) throw new Error(flag+' is required');
const readDir=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return[];return fs.readdirSync(d).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(d,n),'utf8')));};
const source=sourceFile?JSON.parse(fs.readFileSync(path.resolve(root,sourceFile),'utf8')):readDir('content/course-pilot-execution-evidence').find(x=>x.id===sourceId);
if(!source) throw new Error('Pilot source record not found');
if(!['draft','collecting','analysis-pending'].includes(source.status)) throw new Error('Pilot source must be draft/collecting/analysis-pending');
const course=readDir('content/courses').find(x=>x.id===source.courseId);
if(!course||String(course.version)!==String(source.courseVersion)) throw new Error('Pilot source does not match current course version');
if(source.knowledgeEvidence?.required===true&&!has('--confirm-knowledge-current')) throw new Error('--confirm-knowledge-current is required');
if(source.performanceEvidence?.required===true&&!has('--confirm-performance-current')) throw new Error('--confirm-performance-current is required');
const stopDisposition=get('--stop-disposition');
if(source.stopCriteriaTriggered===true&&!stopDisposition&&!source.stopCriteriaDisposition) throw new Error('Triggered stop criteria require --stop-disposition');
const now=new Date().toISOString(), record=structuredClone(source);
record.id=source.id+'-COMPLETE-'+now.replace(/[-:.TZ]/g,'').slice(0,14);
record.status='evidence-complete'; record.authorityId=authority; record.recordedAt=now;
record.learnerFeedbackCollected=true; record.dataQualityReviewed=true;
record.fairnessAccessibilityEvidence={...record.fairnessAccessibilityEvidence,reviewed:true,materialIssuesResolvedOrDispositioned:true};
if(record.knowledgeEvidence?.required===true){record.knowledgeEvidence.itemEvidenceComplete=true;record.knowledgeEvidence.currentItemVersionsOnly=true;}
if(record.performanceEvidence?.required===true){record.performanceEvidence.executionCompleted=true;record.performanceEvidence.currentAssessmentVersionsOnly=true;}
if(record.stopCriteriaTriggered===true) record.stopCriteriaDisposition=stopDisposition??record.stopCriteriaDisposition;
record.summary='Evidence-complete pilot execution derived from '+source.id+' for '+source.courseId+'@'+source.courseVersion+'.';
record.evidenceRefs=[...new Set([...(source.evidenceRefs??[]),source.id])];
record.limitations=[...(source.limitations??[]),'Evidence-complete does not itself constitute certification gate approval.'];
if(write){const d=path.join(root,'content/course-pilot-execution-evidence');const f=path.join(d,record.id+'.json');if(fs.existsSync(f))throw new Error('Refusing overwrite');fs.writeFileSync(f,JSON.stringify(record,null,2)+'\n');}
console.log(JSON.stringify({wroteFile:write,record},null,2));