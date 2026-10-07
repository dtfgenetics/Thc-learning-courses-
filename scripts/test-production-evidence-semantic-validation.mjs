import assert from 'node:assert/strict';
import { assertProductionVerificationComplete } from './lib/production-evidence-verification.mjs';

const backupControl={
  id:'backup-restore',
  requiredEvidence:[
    'backup job identifier',
    'successful backup timestamp',
    'isolated restore target',
    'restore drill timestamp',
    'schema/data-integrity verification',
    'RPO/RTO observations'
  ]
};
const monitoringControl={
  id:'monitoring-alerting',
  requiredEvidence:[
    'deployed metrics/log source',
    'alert rule identifiers',
    'synthetic/test alert timestamp',
    'delivery record',
    'owner acknowledgement'
  ]
};

const goodBackup={
  backupJobIdentifier:'aws-backup-job-7d91f2',
  successfulBackupTimestamp:'2026-10-07T14:00:00Z',
  isolatedRestoreTarget:'academy-restore-drill-20261007',
  restoreDrillTimestamp:'2026-10-07T15:20:00Z',
  schemaDataIntegrityVerification:'Schema v7 and credential/audit row-count checks passed',
  rpoRtoObservations:'Observed RPO 18 minutes and RTO 42 minutes'
};
assert.doesNotThrow(()=>assertProductionVerificationComplete(backupControl,goodBackup));

for(const [name,patch,pattern] of [
  ['bad backup timestamp',{successfulBackupTimestamp:'today'},/successfulBackupTimestamp/],
  ['restore before backup',{restoreDrillTimestamp:'2026-10-07T13:00:00Z'},/must not precede/],
  ['placeholder target',{isolatedRestoreTarget:'TBD'},/isolatedRestoreTarget/],
  ['missing RTO',{rpoRtoObservations:'Observed RPO 18 minutes'},/both RPO and RTO/]
]){
  assert.throws(()=>assertProductionVerificationComplete(backupControl,{...goodBackup,...patch}),pattern,name);
}

const goodMonitoring={
  deployedMetricsLogSource:'datadog-prod-academy-service',
  alertRuleIdentifiers:'dd-monitor-4512,dd-monitor-4513',
  syntheticTestAlertTimestamp:'2026-10-07T15:30:00Z',
  deliveryRecord:'pagerduty-incident-PD9K2',
  ownerAcknowledgement:'oncall-ack-PD9K2'
};
assert.doesNotThrow(()=>assertProductionVerificationComplete(monitoringControl,goodMonitoring));

for(const [name,patch,pattern] of [
  ['bad alert timestamp',{syntheticTestAlertTimestamp:'10/7 3:30'},/syntheticTestAlertTimestamp/],
  ['placeholder metrics source',{deployedMetricsLogSource:'placeholder'},/deployedMetricsLogSource/],
  ['placeholder alert IDs',{alertRuleIdentifiers:'TBD'},/alertRuleIdentifiers/],
  ['placeholder delivery',{deliveryRecord:'none'},/deliveryRecord/],
  ['placeholder acknowledgement',{ownerAcknowledgement:'pending'},/ownerAcknowledgement/]
]){
  assert.throws(()=>assertProductionVerificationComplete(monitoringControl,{...goodMonitoring,...patch}),pattern,name);
}

console.log('Production backup/monitoring evidence semantic validation: PASS');
