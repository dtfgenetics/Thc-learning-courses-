import fs from 'node:fs';
import path from 'node:path';

export const COURSE1_FIELD_REFERENCES = [
  {
    id: 'FR-LH-TECH1-001-HAZARD',
    slug: 'hazard-response-ppe-hazcom',
    title: 'Hazard Response, PPE & HazCom',
    shortTitle: 'Hazard response',
    moduleId: 'MOD-LH-TECH1-001-SAFETY',
    objectives: ['LO-LH-TECH1-001-01', 'LO-LH-TECH1-001-02'],
    workbookActivities: [1, 8, 9],
    path: 'docs/learning-hub/tech1/course-001/student/job-aids/01-HAZARD-RESPONSE-GUIDE.md',
    summary: 'Use before or during assigned work to decide whether a condition can be controlled routinely, requires stopping or escalation, or needs additional authorization.',
    keywords: ['hazard', 'ppe', 'hazcom', 'sds', 'label', 'stop work', 'alarm', 'restricted entry', 'electrical']
  },
  {
    id: 'FR-LH-TECH1-001-BIOSEC',
    slug: 'biosecurity-sanitation-status-controls',
    title: 'Biosecurity, Sanitation & Status Controls',
    shortTitle: 'Biosecurity & status controls',
    moduleId: 'MOD-LH-TECH1-001-BIOSEC',
    objectives: ['LO-LH-TECH1-001-03', 'LO-LH-TECH1-001-04'],
    workbookActivities: [2, 8, 9],
    path: 'docs/learning-hub/tech1/course-001/student/job-aids/02-BIOSECURITY-SANITATION-GUIDE.md',
    summary: 'Map contamination pathways, verify sanitation sequence, and keep quarantine, holds, restricted-entry controls, and equipment status from being confused.',
    keywords: ['biosecurity', 'sanitation', 'disinfection', 'quarantine', 'hold', 'rei', 'restricted entry', 'movement', 'contamination']
  },
  {
    id: 'FR-LH-TECH1-001-SOP',
    slug: 'controlled-work-sop-authority',
    title: 'Controlled Work, SOPs & Authority',
    shortTitle: 'Controlled work & authority',
    moduleId: 'MOD-LH-TECH1-001-WORKFLOW',
    objectives: ['LO-LH-TECH1-001-05'],
    workbookActivities: [3, 8],
    path: 'docs/learning-hub/tech1/course-001/student/job-aids/03-CONTROLLED-WORK-INSTRUCTION-CHECKLIST.md',
    summary: 'Reconcile the current work order and controlled instruction with physical reality, then stop or escalate when instructions conflict or authority is unclear.',
    keywords: ['sop', 'work order', 'revision', 'controlled document', 'authority', 'deviation', 'acceptance criteria', 'escalation']
  },
  {
    id: 'FR-LH-TECH1-001-TRACE',
    slug: 'traceability-movement-reconciliation',
    title: 'Traceability, Movement & Reconciliation',
    shortTitle: 'Traceability & reconciliation',
    moduleId: 'MOD-LH-TECH1-001-TRACEABILITY',
    objectives: ['LO-LH-TECH1-001-06', 'LO-LH-TECH1-001-07', 'LO-LH-TECH1-001-08'],
    workbookActivities: [4, 8, 10],
    path: 'docs/learning-hub/tech1/course-001/student/job-aids/04-TRACEABILITY-RECONCILIATION-GUIDE.md',
    summary: 'Preserve identity and genealogy through movements, splits, merges, discrepancies, downtime, and disposition without forcing the physical and recorded states to agree.',
    keywords: ['traceability', 'genealogy', 'movement', 'inventory', 'reconciliation', 'waste', 'disposition', 'split', 'merge', 'downtime']
  },
  {
    id: 'FR-LH-TECH1-001-EQUIP',
    slug: 'equipment-readiness-fault-escalation',
    title: 'Equipment Readiness & Fault Escalation',
    shortTitle: 'Equipment readiness & faults',
    moduleId: 'MOD-LH-TECH1-001-EQUIPMENT',
    objectives: ['LO-LH-TECH1-001-09', 'LO-LH-TECH1-001-10'],
    workbookActivities: [5, 8, 11],
    path: 'docs/learning-hub/tech1/course-001/student/job-aids/05-EQUIPMENT-READINESS-FAULT-GUIDE.md',
    summary: 'Classify readiness findings, stay inside operator-care boundaries, recognize stored-energy or servicing crossover, and create a maintenance-ready fault timeline.',
    keywords: ['equipment', 'readiness', 'fault', 'alarm', 'maintenance', 'servicing', 'stored energy', 'guard', 'operator care']
  },
  {
    id: 'FR-LH-TECH1-001-RECORDS',
    slug: 'data-integrity-shift-handoff',
    title: 'Data Integrity & Shift Handoff',
    shortTitle: 'Records & shift handoff',
    moduleId: 'MOD-LH-TECH1-001-RECORDS',
    objectives: ['LO-LH-TECH1-001-11', 'LO-LH-TECH1-001-12'],
    workbookActivities: [6, 7, 8, 12],
    path: 'docs/learning-hub/tech1/course-001/student/job-aids/06-DATA-INTEGRITY-HANDOFF-GUIDE.md',
    summary: 'Create reconstructable records, preserve correction history, distinguish observation time from entry time, and complete a closed-loop handoff of unresolved conditions.',
    keywords: ['data integrity', 'record', 'correction', 'late entry', 'handoff', 'read back', 'alcoa', 'shift', 'documentation']
  }
];

function safeMetadata(reference) {
  return {
    id: reference.id,
    slug: reference.slug,
    title: reference.title,
    shortTitle: reference.shortTitle,
    moduleId: reference.moduleId,
    objectives: [...reference.objectives],
    workbookActivities: [...reference.workbookActivities],
    summary: reference.summary,
    keywords: [...reference.keywords]
  };
}

export function listFieldReferences() {
  return COURSE1_FIELD_REFERENCES.map(safeMetadata);
}

export function loadFieldReference(root, idOrSlug) {
  const reference = COURSE1_FIELD_REFERENCES.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
  if (!reference) return null;
  const target = path.resolve(root, reference.path);
  const allowedRoot = path.resolve(root, 'docs/learning-hub/tech1/course-001/student/job-aids');
  if (!target.startsWith(`${allowedRoot}${path.sep}`) || !fs.existsSync(target)) return null;
  return { ...safeMetadata(reference), markdown: fs.readFileSync(target, 'utf8') };
}
