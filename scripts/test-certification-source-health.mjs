import {spawnSync} from 'node:child_process';

function run(script,args=[]){
  const r=spawnSync(process.execPath,[script,...args],{cwd:process.cwd(),encoding:'utf8'});
  if(r.status!==0) throw new Error(r.stderr||r.stdout);
  return r.stdout;
}

run('scripts/validate-public-authoritative-source-supplements.mjs');
const health=JSON.parse(run('scripts/report-certification-source-health.mjs',['--json','--check']));
if(health.summary.canonicalLessons!==284) throw new Error('expected 284 canonical lessons');
if(health.summary.structuralProblems!==0) throw new Error('source structural problems: '+health.structuralProblems.join('; '));
if(health.summary.sourceIdsUsed<1) throw new Error('canonical source inventory unexpectedly empty');
if(health.summary.reviewedSources!==health.summary.sourceIdsUsed) throw new Error('all canonical used sources must be reviewed');
for(const row of health.refreshQueue){
  if(!['verification-not-recorded','refresh-due'].includes(row.reason)) throw new Error('unexpected refresh reason '+row.reason);
}
console.log('Certification source provenance health: PASS (284 lessons, structural source integrity enforced; freshness remains maintenance queue).');
