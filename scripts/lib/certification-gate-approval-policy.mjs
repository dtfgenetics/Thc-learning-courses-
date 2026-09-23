export const approvableDerivedGates=new Set([
  'pilotExecution',
  'itemAnalysis',
  'practicalAssessorCalibration',
  'accessibilityUxHumanReview',
  'occupationalProgramValidation'
]);

export function assertDerivedGateApprovable(gate,status){
  if(!approvableDerivedGates.has(gate)) throw new Error('Gate '+gate+' is not approved through the derived-evidence transition');
  if(status==='approved') throw new Error(gate+' is already approved');
  if(status!=='evidence-complete') throw new Error(gate+' must be evidence-complete before approval; current='+status);
  return true;
}
