import assert from 'node:assert/strict';
import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync('ops/backup-restore-contract.json','utf8'));
assert.equal(c.status,'code-ready-deployment-validation-pending');
for(const key of ['encryptionAtRest','encryptedTransport','automatedBackupsRequired','isolatedRestoreDrillRequired','restoreMustVerifySchemaVersion','restoreMustVerifyCredentialAndAuditIntegrity']) assert.equal(c.requirements[key],true,key);
assert.equal(c.requirements.destructiveProductionRestoreWithoutApprovalAllowed,false);
for(const value of Object.values(c.deploymentValues)) assert.equal(value,null,'unverified deployment values must remain unset');
assert.match(c.readinessBoundary,/does not satisfy backupRestoreTested/i);
console.log('Backup/restore deployment contract passed.');
