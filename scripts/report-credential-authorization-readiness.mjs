import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const readDir=(rel)=>{
  const dir=path.join(root,rel); if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')));
};
const programs=readDir('content/credential-programs').filter(x=>['CREDPROG-CULT-TECH-I-001','CREDPROG-CULT-TECH-II-001'].includes(x.id));
const courses=new Map(readDir('content/courses').map(x=>[x.id,x]));
const auth=readDir('content/credential-authorization-evidence');

const rows=programs.map(program=>{
  const records=auth
    .filter(r=>r.credentialProgramId===program.id&&String(r.credentialProgramVersion)===String(program.version)&&r.status!=='invalidated')
    .sort((a,b)=>Date.parse(b.recordedAt)-Date.parse(a.recordedAt));
  const latest=records[0]??null;
  const currentCourses=(program.requiredCourses??[]).map(id=>({courseId:id,courseVersion:courses.get(id)?.version??null}));
  const versionMatch=latest ? currentCourses.every(c=>latest.authorizedCourses?.some(x=>x.courseId===c.courseId&&String(x.courseVersion)===String(c.courseVersion))) : false;
  return {
    credentialProgramId:program.id,
    credentialProgramVersion:program.version,
    requiredCourses:currentCourses.length,
    currentCourseVersionsCovered:versionMatch,
    authorization:latest?{
      id:latest.id,status:latest.status,finalReleaseDecision:latest.governance?.finalReleaseDecision??null,
      issuerId:latest.issuer?.issuerId??null,recordedAt:latest.recordedAt
    }:{status:'missing'}
  };
});
console.log(JSON.stringify({
  summary:{
    programs:rows.length,
    programsWithCurrentAuthorizationEvidence:rows.filter(x=>x.authorization.status!=='missing').length,
    programsApproved:rows.filter(x=>x.authorization.status==='approved'&&x.currentCourseVersionsCovered).length
  },
  programs:rows
},null,2));
