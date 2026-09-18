import { spawnSync } from 'node:child_process';

for (let n=1;n<=8;n++) {
  const id=`COURSE-LH-TECH2-${String(n).padStart(3,'0')}`;
  const run=spawnSync(process.execPath,['scripts/build-learning-hub-review-queue.mjs',`--course=${id}`,'--summary-only','--check'],{encoding:'utf8'});
  if (run.status!==0) {
    console.error(`${id} review queue failed`);
    if (run.stdout) console.error(run.stdout);
    if (run.stderr) console.error(run.stderr);
    process.exit(run.status ?? 1);
  }
}
console.log('Technician II Courses 1-8 exact-version review queues: PASS');
