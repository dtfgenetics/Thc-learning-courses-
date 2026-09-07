import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({
      file: path.join(rel, name),
      data: readJson(path.join(rel, name))
    }));
}

const issues = [];
const fixes = [];

console.log('🔍 Scanning for assessment items that need review records...\n');

const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');

// Build review index by target ID
const reviewsByTargetId = new Map();
for (const { data } of reviews) {
  const targetId = data.targetId || data.objectId;
  if (!reviewsByTargetId.has(targetId)) {
    reviewsByTargetId.set(targetId, []);
  }
  reviewsByTargetId.get(targetId).push(data);
}

// Find items that should have reviews but don't
for (const { file, data } of questions) {
  // Items with active or published status MUST have approval reviews
  if (data.status === 'active' || data.status === 'published') {
    const itemReviews = reviewsByTargetId.get(data.id) || [];
    const hasApprovedReview = itemReviews.some((r) => r.status === 'approved');
    
    if (itemReviews.length === 0) {
      issues.push({
        type: 'MISSING_REVIEWS',
        severity: 'CRITICAL',
        file,
        id: data.id,
        message: `${data.id} is ${data.status} but has NO review records`
      });
      
      fixes.push({
        command: `npm run review:record -- --object ${data.id} --type assessment --reviewer "REVIEWER_NAME" --status approved --confirm-approved --write`,
        description: `Create approval review for ${data.id}`
      });
    } else if (!hasApprovedReview) {
      issues.push({
        type: 'UNAPPROVED_REVIEWS',
        severity: 'CRITICAL',
        file,
        id: data.id,
        message: `${data.id} is ${data.status} but has ${itemReviews.length} review(s) with no approvals`
      });
      
      fixes.push({
        command: `npm run review:record -- --object ${data.id} --type assessment --reviewer "REVIEWER_NAME" --status approved --confirm-approved --write`,
        description: `Create approval review for ${data.id}`
      });
    }
  }
}

// Display results
if (issues.length > 0) {
  console.log(`⚠️  FOUND ${issues.length} ISSUE(S) PREVENTING PUBLICATION:\n`);
  
  const critical = issues.filter((i) => i.severity === 'CRITICAL');
  const warnings = issues.filter((i) => i.severity === 'WARNING');
  
  if (critical.length > 0) {
    console.log('🔴 CRITICAL (Must fix before publication):');
    for (const issue of critical) {
      console.log(`  ${issue.id}: ${issue.message}`);
      console.log(`    File: ${issue.file}\n`);
    }
  }
  
  if (warnings.length > 0) {
    console.log('🟡 WARNINGS (Should review):');
    for (const issue of warnings) {
      console.log(`  ${issue.id}: ${issue.message}`);
      console.log(`    File: ${issue.file}\n`);
    }
  }
  
  if (fixes.length > 0) {
    console.log('\n💡 SUGGESTED FIXES:\n');
    for (let i = 0; i < Math.min(5, fixes.length); i++) {
      const fix = fixes[i];
      console.log(`${i + 1}. ${fix.description}`);
      console.log(`   ${fix.command}\n`);
    }
    if (fixes.length > 5) {
      console.log(`... and ${fixes.length - 5} more fixes\n`);
    }
  }
  
  if (checkOnly) {
    console.log(`Run without --check to see all issues and suggested fixes.`);
    process.exit(1);
  } else {
    process.exit(1);
  }
} else {
  console.log(`✅ All active/published assessment items have approval review records!\n`);
}

console.log(`Summary:`);
console.log(`  Total items scanned: ${questions.length}`);
console.log(`  Active/published items: ${questions.filter((q) => q.data.status === 'active' || q.data.status === 'published').length}`);
console.log(`  Items with reviews: ${questions.filter((q) => {
  if (q.data.status !== 'active' && q.data.status !== 'published') return false;
  return (reviewsByTargetId.get(q.data.id) || []).length > 0;
}).length}`);
console.log(`  Items with approval: ${questions.filter((q) => {
  if (q.data.status !== 'active' && q.data.status !== 'published') return false;
  return (reviewsByTargetId.get(q.data.id) || []).some((r) => r.status === 'approved');
}).length}\n`);
