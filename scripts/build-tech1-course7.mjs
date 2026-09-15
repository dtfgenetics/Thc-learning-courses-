import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const write = (rel, value) => {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(value, null, 2) + '\n');
};
const writeText = (rel, value) => {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, value);
};

const objectives = [
  { id:'LO-LH-TECH1-007-01', competency:'COMP-PRO-SOP-001', statement:'Prioritize an integrated cultivation shift from the supplied handoff, work orders, hazards, crop timing and authorization boundaries, identifying work that must stop, proceed, wait or be clarified.', bloomLevel:'analyze', status:'draft', version:'1.0.0' },
  { id:'LO-LH-TECH1-007-02', competency:'COMP-SAFETY-WORK-001', statement:'Execute safe room entry, sanitation, crop observation and environmental evidence collection while preserving biosecurity, measurement context and stop-work boundaries.', bloomLevel:'apply', status:'draft', version:'1.0.0' },
  { id:'LO-LH-TECH1-007-03', competency:'COMP-WATER-001', statement:'Execute an assigned water and irrigation station using verified work-order identity, pH/EC measurement context, delivery checks and actual-versus-planned records without unsupported diagnosis or unauthorized correction.', bloomLevel:'apply', status:'draft', version:'1.0.0' },
  { id:'LO-LH-TECH1-007-04', competency:'COMP-IPM-001', statement:'Integrate IPM scouting with propagation or canopy work while protecting sanitation, material identity, evidence quality and treatment-selection authority boundaries.', bloomLevel:'analyze', status:'draft', version:'1.0.0' },
  { id:'LO-LH-TECH1-007-05', competency:'COMP-CULT-TRACEABILITY-001', statement:'Execute an authorized harvest-to-postharvest transition while preserving genealogy, quantity reconciliation, contamination holds, receiving status and material-location records.', bloomLevel:'apply', status:'draft', version:'1.0.0' },
  { id:'LO-LH-TECH1-007-06', competency:'COMP-PRO-QA-001', statement:'Respond to an unexpected shift event, preserve unresolved evidence, escalate within role boundaries, reconcile the shift record and produce a handoff another qualified person can reconstruct.', bloomLevel:'analyze', status:'draft', version:'1.0.0' }
];
for (const o of objectives) write(`content/learning-objectives/${o.id}.json`, o);

const lesson = (x) => ({
  id:x.id, title:x.title, version:'1.0.0', status:'draft', competencies:x.competencies,
  learningObjectives:x.learningObjectives, estimatedMinutes:x.estimatedMinutes, references:x.references, assessment:null,
  content:{ overview:x.overview, vocabulary:x.vocabulary, sections:x.sections, workedExamples:x.workedExamples, commonMistakes:x.commonMistakes, practicalApplication:x.practicalApplication, summary:x.summary, blocks:x.blocks }
});

const lessons = [
  lesson({
    id:'LESSON-LH-TECH1-007-01', title:'Integrated Shift Planning, Evidence and Authority Control', estimatedMinutes:70,
    competencies:['COMP-PRO-SOP-001','COMP-PRO-QA-001','COMP-SAFETY-WORK-001','COMP-CULT-TRACEABILITY-001'], learningObjectives:['LO-LH-TECH1-007-01','LO-LH-TECH1-007-06'],
    references:['REF-NIOSH-CANNABIS-HAZARDS-2024','REF-MHRA-GXP-DATA-INTEGRITY','REF-GS1-GLOBAL-TRACEABILITY'],
    overview:'The integrated lab begins with a shift packet, not a blank checklist. Learners review the previous handoff, room status, work orders, crop timing, traceability identities, known deviations and role boundaries, then build a defensible sequence for the shift. Priority is based on consequence and timing: life-safety and uncontrolled identity problems outrank routine production pressure, while ambiguous or unauthorized work is clarified before execution.',
    vocabulary:[
      {term:'shift packet',definition:'The controlled set of handoff information, work orders, maps, records and role boundaries used to plan the simulated shift.'},
      {term:'priority decision',definition:'A documented choice about what must happen now, next, later, or only after clarification based on consequence, timing and authorization.'},
      {term:'evidence package',definition:'The combined work records, measurements, observations, traceability events, deviations and handoff information used to evaluate performance.'},
      {term:'authority boundary',definition:'The limit of actions the learner is trained and authorized to perform before escalation or qualified review is required.'}
    ],
    sections:[
      {title:'Read the handoff before touching the work',body:'A strong shift begins by reconstructing what is already known: incomplete work, active holds, recent measurements, abnormal conditions, material locations and time-sensitive commitments. The learner should not repeat work simply because it appears on a task list when the handoff shows that the underlying condition has changed.',references:['REF-MHRA-GXP-DATA-INTEGRITY']},
      {title:'Prioritize by consequence and timing',body:'Immediate hazards, active identity loss and conditions that can worsen quickly deserve priority over routine tasks. Time-sensitive plant work is important, but it does not override a life-safety condition or justify acting outside authorization.',references:['REF-NIOSH-CANNABIS-HAZARDS-2024']},
      {title:'Plan evidence before execution',body:'Each workstation should have a clear record target before work begins: what identity is involved, what observation or measurement will be captured, what decision is authorized, and what must be handed off if unresolved. This prevents a technically correct action from becoming unauditable later.',references:['REF-MHRA-GXP-DATA-INTEGRITY','REF-GS1-GLOBAL-TRACEABILITY']},
      {title:'Clarification is a valid operational outcome',body:'If a work order conflicts with physical identity, a limit is missing, or the requested action would exceed Technician I authority, the correct response can be to preserve the state and escalate rather than invent a solution. Completing the wrong task faster is not competent performance.',references:['REF-MHRA-GXP-DATA-INTEGRITY']}
    ],
    workedExamples:['A blocked emergency route and a routine canopy work order appear at shift start. The route is addressed first because the safety consequence is immediate.','A propagation count shortage is noted in the handoff. The learner verifies the physical count and record before planning replacement work rather than editing the expected quantity to match the shortage.'],
    commonMistakes:['Treating the task list as a fixed order regardless of hazards or holds.','Starting work before checking the previous-shift handoff.','Assuming escalation means the task was failed.','Planning actions without planning what evidence must be recorded.'],
    practicalApplication:'Given a mock opening packet, rank eight tasks as immediate, time-sensitive, routine, defer, or clarify-before-execution. State the observation, consequence, authorization boundary and evidence record supporting each ranking.',
    summary:'Integrated technician performance begins with reconstruction, prioritization, evidence planning and role discipline. A defensible shift plan explains not only what will be done, but why the order is appropriate and what must be preserved if work cannot be completed.',
    blocks:[
      {type:'steps',title:'Five-step shift triage',items:[{title:'Reconstruct current state',body:'Read the handoff, active holds, recent deviations, room status and work orders.'},{title:'Identify immediate hazards and identity risks',body:'Place life-safety and uncontrolled traceability conditions ahead of routine production.'},{title:'Identify time-sensitive crop work',body:'Protect biological timing where it can be done safely and within authorization.'},{title:'Mark clarification dependencies',body:'Do not improvise missing limits, destinations, labels or technical authority.'},{title:'Define required evidence',body:'Know what record, measurement, observation or handoff artifact must exist after each station.'}],references:['REF-NIOSH-CANNABIS-HAZARDS-2024','REF-MHRA-GXP-DATA-INTEGRITY']},
      {type:'scenario',title:'Schedule pressure versus identity control',setting:'The shift is behind schedule. A harvest container is ready to move, but its label does not match the work order and a routine pruning task is also waiting.',prompt:'What is the strongest first decision?',options:['Move the container and fix the label later','Resolve or hold the identity conflict before movement, then continue the remaining authorized work by priority','Ignore the mismatch because the cultivar appears correct','Cancel all work for the day'],answer:'Resolve or hold the identity conflict before movement, then continue the remaining authorized work by priority',feedback:'An identity transition can permanently damage genealogy. The conflict is controlled before movement, while unrelated authorized work can continue according to priority.',references:['REF-GS1-GLOBAL-TRACEABILITY','REF-MHRA-GXP-DATA-INTEGRITY']}
    ]
  }),
  lesson({
    id:'LESSON-LH-TECH1-007-02', title:'Room Inspection, Measurement and Irrigation Integration', estimatedMinutes:80,
    competencies:['COMP-SAFETY-WORK-001','COMP-SPACE-BIOSEC-001','COMP-PLANT-BIO-001','COMP-ENV-VPD-001','COMP-WATER-001','COMP-ROOTZONE-001','COMP-NUTRITION-001','COMP-CULT-EQUIPMENT-CARE-001'], learningObjectives:['LO-LH-TECH1-007-02','LO-LH-TECH1-007-03'],
    references:['REF-NIOSH-CANNABIS-HAZARDS-2024','REF-WATER-001','REF-ROOTZONE-001','REF-NUTRITION-001'],
    overview:'This lab segment combines Practical A and Practical B reasoning. Learners enter a room safely, protect sanitation boundaries, inspect crop and environmental evidence, verify sensor or sample context, perform assigned pH/EC work, execute an authorized irrigation task, check representative delivery and document actual-versus-planned conditions. The learner is evaluated on evidence quality and response boundaries, not on guessing a diagnosis from one reading.',
    vocabulary:[
      {term:'representative observation',definition:'An observation or measurement collected from an identified location and method that reasonably represents the condition being evaluated.'},
      {term:'measurement context',definition:'The units, instrument, calibration or verification state, sample identity, location and timing needed to interpret a reading.'},
      {term:'delivery verification',definition:'A check that the assigned irrigation or solution reached representative intended locations and that obvious distribution faults are identified.'},
      {term:'actual-versus-planned',definition:'The comparison between the authorized work order and what was physically delivered or observed during execution.'}
    ],
    sections:[
      {title:'Room entry is an evidence checkpoint',body:'Before crop observations begin, verify the room identity, entry hazards, sanitation sequence and any posted restrictions. A questionable sensor, leak, damaged cord or blocked route is documented in context rather than normalized because the room is familiar.',references:['REF-NIOSH-CANNABIS-HAZARDS-2024']},
      {title:'Record environmental and crop evidence together',body:'Temperature, humidity, airflow, light context and crop appearance should be linked to identified zones and times. A single reading can be useful, but it should not be stretched into a complete causal diagnosis without spatial, temporal and plant context.',references:['REF-ROOTZONE-001','REF-NUTRITION-001']},
      {title:'pH and EC are measurements, not diagnoses',body:'Verify sample identity, instrument readiness, units and method before recording pH or EC. Use the values with root-zone, irrigation and crop context. Do not infer a specific nutrient deficiency, toxicity or product identity from EC alone.',references:['REF-WATER-001','REF-NUTRITION-001']},
      {title:'Irrigation execution includes verification',body:'Match the work order, execute only the authorized settings or sequence, inspect representative delivery points, record actual-versus-planned conditions, and escalate localized faults or unresolved dryback patterns rather than silently compensating outside the work order.',references:['REF-WATER-001','REF-ROOTZONE-001']}
    ],
    workedExamples:['A room sensor shows an unusual value but a reference measurement at the crop zone disagrees. The learner records both locations and escalates the discrepancy rather than adjusting environmental equipment without authority.','An irrigation zone is scheduled correctly but one representative emitter has no delivery. The learner preserves the programmed work order, documents the localized fault and escalates rather than increasing the entire zone duration to compensate.'],
    commonMistakes:['Recording pH or EC without sample identity or units.','Using one environmental reading as proof of a room-wide condition.','Changing irrigation duration to compensate for a local delivery fault without authorization.','Diagnosing a named deficiency from EC or leaf color alone.'],
    practicalApplication:'Run a combined room-inspection and irrigation station with one entry hazard, one sensor-location discrepancy, one pH/EC sample, one root-zone pattern and one delivery fault. Produce a single work record that preserves all relevant identities, readings, observations and escalations.',
    summary:'Integrated room and irrigation work connects safety, sanitation, crop observation, environmental context, measurement discipline and delivery verification. Competence is shown by reconstructable evidence and correct boundaries, not by unsupported certainty.',
    blocks:[
      {type:'table',title:'Evidence needed before interpretation',columns:['Evidence','Minimum context','Do not conclude from it alone'],rows:[['Temperature / RH','identified room or zone, time, sensor or reference location','that the entire canopy experienced the same condition'],['pH','identified sample, meter/method context, time','a complete nutrient diagnosis'],['EC','identified sample/root-zone location, units, trend context','which specific ions caused a plant symptom'],['Dryback observation','identified container/zone, comparable timing and prior state','that elapsed clock time alone defines irrigation need'],['Delivery check','identified emitter/zone and actual observation','that one failed point means every emitter failed']],references:['REF-WATER-001','REF-ROOTZONE-001','REF-NUTRITION-001']},
      {type:'scenario',title:'One failed emitter',setting:'The assigned irrigation cycle completed, but one representative emitter has no delivery while neighboring emitters are normal.',prompt:'What is the strongest Technician I response?',options:['Increase the entire zone duration until that location is wet','Document the localized fault, protect the current work-order record and escalate or service only within authorized procedure','Assume the plant does not need water','Delete the failed reading because most emitters worked'],answer:'Document the localized fault, protect the current work-order record and escalate or service only within authorized procedure',feedback:'A local delivery fault should not be hidden by a broad unauthorized process change.',references:['REF-WATER-001','REF-ROOTZONE-001']}
    ]
  }),
  lesson({
    id:'LESSON-LH-TECH1-007-03', title:'IPM, Propagation and Canopy Workstation Integration', estimatedMinutes:80,
    competencies:['COMP-IPM-001','COMP-PROP-001','COMP-CANOPY-001','COMP-SPACE-BIOSEC-001','COMP-PRO-QA-001'], learningObjectives:['LO-LH-TECH1-007-04','LO-LH-TECH1-007-06'],
    references:['REF-IPM-001','REF-PROP-001','REF-CANOPY-001'],
    overview:'This segment integrates Practicals C, D and E. Learners follow a repeatable scouting route, distinguish symptoms from direct signs, document incidence and spatial pattern, protect sanitation boundaries, and then execute either a propagation or canopy work order as the primary station. The non-primary production domain appears as a shorter decision event. The lab reinforces that Technician I can observe and execute authorized crop-care work without independently selecting pesticide treatments or inventing production thresholds.',
    vocabulary:[
      {term:'scouting route',definition:'A repeatable inspection path and method used to collect comparable plant-health evidence across locations and time.'},
      {term:'incidence',definition:'The number or proportion of plants or sites showing a defined condition.'},
      {term:'production exception',definition:'A plant, tray, tool, label or work-order condition that prevents normal execution until it is controlled or escalated.'},
      {term:'treatment authority',definition:'The facility- and jurisdiction-specific authorization required to select or apply a pest-control treatment; the integrated Technician I lab does not grant that authority.'}
    ],
    sections:[
      {title:'Scout before naming a cause',body:'Follow the supplied route, record location and plant identity, distinguish symptoms from direct signs, estimate incidence/severity using the supplied method and compare prior observations. A close-up image or one affected plant should not be treated as room-wide proof.',references:['REF-IPM-001']},
      {title:'Biosecurity connects scouting and production work',body:'Tool sanitation, movement order, suspect-material handling and clean/dirty boundaries remain active when switching from scouting to propagation or canopy tasks. The learner should not turn a work crew into a spread pathway.',references:['REF-IPM-001','REF-PROP-001','REF-CANOPY-001']},
      {title:'Propagation execution protects identity and donor status',body:'Verify donor or source identity, sanitation readiness, tray labels and the supplied procedure before cutting, sticking, transplanting or counting. Separate abnormal or unidentified material rather than averaging it into the batch record.',references:['REF-PROP-001']},
      {title:'Canopy execution follows the supplied threshold',body:'Confirm plant identity, developmental stage, vigor and the assigned canopy outcome. Do not remove extra tissue because it seems efficient, and stop when damage, stress or an ambiguous threshold makes the supplied instruction unsafe or unclear.',references:['REF-CANOPY-001']},
      {title:'Observation does not confer pesticide authority',body:'The lab can require the learner to recognize, map, isolate, record and escalate a pest condition. It does not authorize independent pesticide selection, rate choice or application unless a separate facility/jurisdiction credential explicitly grants that authority.',references:['REF-IPM-001']}
    ],
    workedExamples:['A sticky-card count increases only near one intake. The learner maps the pattern and escalates with prior-round evidence rather than treating the whole room as uniformly infested.','A canopy work order says to remove lower growth to a supplied mark, but one plant is visibly stressed. The learner documents the exception and escalates rather than forcing the same intervention onto the stressed plant.'],
    commonMistakes:['Naming a pest or disease from an ambiguous symptom without evidence.','Moving from a suspect zone into propagation without sanitation controls.','Guessing a missing propagation label from plant appearance.','Applying a canopy rule uniformly despite a documented exception.','Selecting a pesticide because the learner recognized a likely pest.'],
    practicalApplication:'Complete a scouting route and one assigned production workstation. The packet includes a spatial pest pattern, one biosecurity transition, one identity conflict and one crop-condition exception. Build an evidence record and choose which conditions can be completed, held or escalated.',
    summary:'Integrated crop-care performance combines repeatable scouting, sanitation, identity control and faithful work-order execution. Technician I observes and escalates beyond scope rather than turning uncertain evidence into unauthorized treatment or production decisions.',
    blocks:[
      {type:'comparison',title:'Observation authority versus treatment authority',left:{label:'Technician I evidence role',body:'Observe, count, map, photograph, isolate or hold where procedure allows, preserve biosecurity and escalate with traceable evidence.'},right:{label:'Separate treatment-selection authority',body:'Select pesticide or biological product, rate, timing, application method or regulatory compliance decision only when separately authorized.'}},
      {type:'scenario',title:'Pest evidence during canopy work',setting:'Fresh feeding damage and several insects are found while a pruning crew is moving through a room. The work order does not authorize treatment decisions.',prompt:'What demonstrates the correct integrated response?',options:['Choose a pesticide from memory and keep pruning','Protect biosecurity, document the identified location/evidence, stop or isolate affected work as required and escalate treatment decisions','Prune away the damaged leaves so the issue is less visible','Move affected plants through clean rooms for comparison'],answer:'Protect biosecurity, document the identified location/evidence, stop or isolate affected work as required and escalate treatment decisions',feedback:'The technician controls spread and evidence while treatment selection remains with the authorized role.',references:['REF-IPM-001','REF-CANOPY-001']}
    ]
  }),
  lesson({
    id:'LESSON-LH-TECH1-007-04', title:'Harvest Transition, Dynamic Events and End-of-Shift Handoff', estimatedMinutes:90,
    competencies:['COMP-POSTHARVEST-001','COMP-CULT-TRACEABILITY-001','COMP-PRO-QA-001','COMP-SAFETY-WORK-001','COMP-PRO-SOP-001'], learningObjectives:['LO-LH-TECH1-007-05','LO-LH-TECH1-007-06'],
    references:['REF-POSTHARVEST-001','REF-GS1-GLOBAL-TRACEABILITY','REF-MHRA-GXP-DATA-INTEGRITY','REF-NIOSH-CANNABIS-HAZARDS-2024'],
    overview:'The final integrated segment combines Practical F, a dynamic-event inject and end-of-shift reconciliation. Learners protect harvest genealogy and receiving identity, handle contamination or label exceptions, reconcile outgoing and incoming quantity, respond to one unexpected event, and close the shift with a handoff that preserves completed work, unresolved conditions, holds, deviations and next priorities. The learner is not granted independent product-release authority.',
    vocabulary:[
      {term:'dynamic event inject',definition:'An unexpected simulated condition introduced during the shift to evaluate reprioritization, safe action, documentation and escalation.'},
      {term:'shift reconciliation',definition:'The end-of-shift comparison of planned work, completed work, physical state, records, movements, deviations and open issues.'},
      {term:'receiving handoff',definition:'The controlled transfer of material and information to the next location, role or shift with identity, condition and unresolved issues preserved.'},
      {term:'critical failure',definition:'A serious safety, identity, integrity or authority-boundary violation that prevents the performance evidence from being accepted until remediation and reevaluation occur.'}
    ],
    sections:[
      {title:'Harvest is an identity transformation',body:'Verify source identity, authorization and destination before material moves. Link new harvest or receiving identifiers to their source, preserve lot separation and document quantity and location. A missing or conflicting label is controlled before another transition makes reconstruction harder.',references:['REF-GS1-GLOBAL-TRACEABILITY','REF-MHRA-GXP-DATA-INTEGRITY']},
      {title:'Dynamic events test reprioritization',body:'The learner may encounter a leak, alarm, damaged tool, pest finding, missing label, irrigation failure, count shortage, dry-room excursion or handoff discrepancy. The required response is to reassess consequence and authority, take the immediate safe action, preserve evidence and identify downstream work affected.',references:['REF-NIOSH-CANNABIS-HAZARDS-2024','REF-MHRA-GXP-DATA-INTEGRITY']},
      {title:'Reconcile without falsifying',body:'End-of-shift records should preserve the original planned and actual values, unresolved discrepancies, holds and corrections through the controlled process. The learner never changes a number solely to make two records match.',references:['REF-MHRA-GXP-DATA-INTEGRITY']},
      {title:'Handoff is a continuity control',body:'A useful handoff tells the receiving person what is complete, what is incomplete, what was measured or observed, what changed, what is on hold, what requires follow-up and what should happen next. It should stand on its own without relying on the outgoing learner being present.',references:['REF-MHRA-GXP-DATA-INTEGRITY']},
      {title:'Completion is not product release authority',body:'The integrated lab can show that a learner followed hold, reconciliation and handoff procedures. It does not authorize independent release of held material, override quality review, or replace facility/jurisdiction requirements for product disposition.',references:['REF-POSTHARVEST-001']}
    ],
    workedExamples:['Outgoing harvest weight and receiving weight differ. The learner preserves both readings, checks the controlled reconciliation steps and hands off the unresolved discrepancy if it cannot be resolved before shift end.','A wet-floor event occurs during a time-sensitive transfer. The learner controls or isolates the hazard within authorization, documents the interruption and updates the downstream task sequence rather than continuing because the material is already in motion.'],
    commonMistakes:['Treating a dynamic event as a distraction instead of reprioritizing the shift.','Changing a weight or count to close a discrepancy.','Removing a hold because the material looks acceptable.','Writing a handoff that lists tasks but omits unresolved conditions and next actions.'],
    practicalApplication:'Complete a simulated harvest-to-dry-room transition followed by a randomized event inject and end-of-shift reconciliation. Produce the final shift log, movement chain, discrepancy/hold record and receiving handoff.',
    summary:'The integrated lab closes with controlled transitions, reprioritization under change, truthful reconciliation and a reconstructable handoff. Strong performance protects safety, identity, evidence and authorization even when the shift does not go as planned.',
    blocks:[
      {type:'steps',title:'Dynamic-event response sequence',items:[{title:'Recognize and stabilize',body:'Identify the changed condition and take the immediate safe action permitted by procedure.'},{title:'Reprioritize',body:'Determine which active or downstream tasks are affected and what must pause.'},{title:'Preserve evidence',body:'Record identity, location, time, measurement or observation before information is lost.'},{title:'Escalate within role boundaries',body:'Send the unresolved decision to the correct qualified role rather than inventing authority.'},{title:'Reconcile the shift',body:'Update actual-versus-planned status, deviations, holds and incomplete work.'},{title:'Hand off next action',body:'Make the remaining owner, priority and required follow-up clear to the receiving shift.'}],references:['REF-MHRA-GXP-DATA-INTEGRITY','REF-NIOSH-CANNABIS-HAZARDS-2024']},
      {type:'scenario',title:'Weight mismatch at shift close',setting:'The outgoing harvest record shows 18.4 kg and the receiving record shows 17.9 kg. The shift is ending and no approved explanation has been established yet.',prompt:'What should the learner do?',options:['Change the receiving weight to 18.4 kg so the handoff closes cleanly','Preserve both values, document the discrepancy and controlled checks performed, escalate or hand off the unresolved reconciliation','Average the two numbers','Delete the outgoing measurement because receiving is later'],answer:'Preserve both values, document the discrepancy and controlled checks performed, escalate or hand off the unresolved reconciliation',feedback:'Data integrity requires the discrepancy to remain visible until resolved through the controlled process.',references:['REF-MHRA-GXP-DATA-INTEGRITY']}
    ]
  })
];
for (const l of lessons) write(`content/lessons/${l.id}.json`, l);

const competencies = ['COMP-SAFETY-WORK-001','COMP-SPACE-BIOSEC-001','COMP-PLANT-BIO-001','COMP-ENV-VPD-001','COMP-WATER-001','COMP-NUTRITION-001','COMP-ROOTZONE-001','COMP-IPM-001','COMP-PROP-001','COMP-CANOPY-001','COMP-FLOWER-001','COMP-POSTHARVEST-001','COMP-PRO-SOP-001','COMP-PRO-QA-001','COMP-CULT-TRACEABILITY-001','COMP-CULT-EQUIPMENT-CARE-001'];
const moduleId = 'MOD-LH-TECH1-007-LAB';
write(`content/modules/${moduleId}.json`, {
  id:moduleId,
  title:'Integrated Cultivation Technician Practice Lab',
  version:'1.0.0', status:'draft',
  lessons:lessons.map((l)=>l.id), competencies,
  assessment:'ASSESS-LH-TECH1-007-M01'
});

const itemDefs = [
  ['001','COMP-PRO-SOP-001','LO-LH-TECH1-007-01','A work order is routine, but the opening handoff shows an unresolved life-safety alarm in the same area. What should control the first action?',['Begin the routine task because it was scheduled','Follow the posted alarm/emergency process and keep the affected work stopped until the condition is controlled','Silence the alarm if possible and continue','Move the task to another worker without documenting the alarm'],1,'Shift priority is driven by consequence and controlled procedures; scheduled work does not override an unresolved life-safety condition.','REF-NIOSH-CANNABIS-HAZARDS-2024'],
  ['002','COMP-PRO-QA-001','LO-LH-TECH1-007-01','Which opening-shift plan is most defensible when one task has a missing limit or threshold?',['Guess the missing value from yesterday','Mark the task for clarification before execution and continue unrelated authorized work by priority','Skip all work until the next shift','Use the most aggressive value to avoid delay'],1,'Ambiguous limits are clarified before affected execution while unrelated authorized work can continue.','REF-MHRA-GXP-DATA-INTEGRITY'],
  ['003','COMP-SAFETY-WORK-001','LO-LH-TECH1-007-02','A room sensor and an identified reference measurement disagree substantially. What is the strongest Technician I response?',['Adjust the controller until both values match','Record both measurements with locations and instrument context, then escalate the discrepancy within procedure','Delete the less convenient value','Average them and record only the average'],1,'Conflicting measurements should remain traceable; the technician preserves context rather than inventing a technical correction.','REF-NIOSH-CANNABIS-HAZARDS-2024'],
  ['004','COMP-WATER-001','LO-LH-TECH1-007-03','One representative irrigation emitter has no delivery after the assigned cycle, while neighboring emitters are normal. What should happen next?',['Increase the entire zone duration','Document the localized fault and follow the authorized service/escalation process without hiding it through a broad process change','Assume that plant needs no water','Change the work order after the fact'],1,'Localized delivery failure is evidence to preserve and address within authorization, not a reason for an unapproved room-wide correction.','REF-WATER-001'],
  ['005','COMP-NUTRITION-001','LO-LH-TECH1-007-03','A leaf symptom occurs with an unusual root-zone EC reading. Which conclusion is appropriate at Technician I level?',['The exact deficient nutrient is proven','The EC and symptom are evidence to record with pH, root-zone, irrigation and developmental context before causal diagnosis','The cultivar is defective','The fertilizer label must be wrong'],1,'Symptoms and EC are clues, not proof of one nutrient cause.','REF-NUTRITION-001'],
  ['006','COMP-IPM-001','LO-LH-TECH1-007-04','A scouting route finds direct pest evidence concentrated near one intake. What best preserves useful evidence?',['Record only the pest name','Record the identified locations, incidence/severity or counts, direct evidence and prior-round comparison, then protect biosecurity and escalate as required','Treat the whole room immediately without authorization','Remove the affected leaves and omit the finding'],1,'Spatial pattern and comparable evidence make the finding actionable without granting independent treatment authority.','REF-IPM-001'],
  ['007','COMP-PROP-001','LO-LH-TECH1-007-04','Two propagation trays become separated from their labels during the integrated lab. What is the first correct action?',['Guess identity from leaf shape','Stop the affected movement/work and resolve identity from approved records before another transition','Combine the trays','Assign both the more common cultivar'],1,'Propagation traceability depends on controlled identity; appearance is not a valid recovery method.','REF-PROP-001'],
  ['008','COMP-CANOPY-001','LO-LH-TECH1-007-04','A canopy work order is clear for most plants, but one identified plant is visibly stressed and would exceed the supplied intervention threshold. What should the learner do?',['Apply the same work to every plant for consistency','Document the exception and hold/escalate the affected plant while completing authorized work that still meets the supplied standard','Remove extra tissue to finish faster','Rewrite the threshold'],1,'Uniform execution does not justify ignoring a condition that falls outside the supplied work standard.','REF-CANOPY-001'],
  ['009','COMP-CULT-TRACEABILITY-001','LO-LH-TECH1-007-05','A harvest container label conflicts with the source batch record before movement to the dry room. What is the strongest response?',['Move it and reconcile later','Hold the affected transition, preserve the current identifiers and resolve the mismatch through the controlled process','Use cultivar appearance to choose the likely identity','Replace both identifiers with a new one'],1,'Identity conflict must be controlled before a transition makes genealogy harder to reconstruct.','REF-GS1-GLOBAL-TRACEABILITY'],
  ['010','COMP-PRO-QA-001','LO-LH-TECH1-007-05','Outgoing harvest weight and receiving weight do not match. Which record action is acceptable?',['Change one value to match the other','Preserve both original values and document the discrepancy and controlled reconciliation steps','Average the readings','Delete the earlier reading'],1,'Reconciliation must not destroy original evidence or force a false match.','REF-MHRA-GXP-DATA-INTEGRITY'],
  ['011','COMP-SAFETY-WORK-001','LO-LH-TECH1-007-06','A leak creates a wet walking surface during a time-sensitive transfer. What demonstrates integrated judgment?',['Continue because material is already moving','Reassess the hazard, apply authorized controls or stop/isolate as required, then update affected downstream work and records','Walk around it without recording','Ask the next shift to handle it'],1,'Dynamic events require reprioritization and safe control; schedule pressure does not freeze the risk assessment.','REF-NIOSH-CANNABIS-HAZARDS-2024'],
  ['012','COMP-PRO-QA-001','LO-LH-TECH1-007-06','What makes an end-of-shift handoff reconstructable to a qualified person who was not present?',['Only a list of completed tasks','Completed and incomplete work, key measurements/observations, movements, deviations, holds, unresolved conditions, owners and next priorities','A verbal summary with no written record','Only problems that were fully resolved'],1,'A handoff must preserve both completed work and open conditions so the next person can reconstruct the operational state.','REF-MHRA-GXP-DATA-INTEGRITY']
];
const itemIds = [];
for (const [n, competency, objective, stem, choices, correct, rationale, ref] of itemDefs) {
  const id = `ITEM-LH-TECH1-007-M01-${n}`;
  itemIds.push(id);
  write(`content/questions/${id}.json`, { id, version:1, status:'draft', purpose:'formative', competency, objective, bloomLevel:n==='001'?'apply':'analyze', difficulty:n==='001'?'easy':'moderate', type:'scenario', stem, choices, correct, rationale, references:[ref] });
}
write('content/assessments/ASSESS-LH-TECH1-007-M01.json', {
  version:'1.0.0', status:'draft', competencies, objectives:objectives.map((o)=>o.id), passingScorePercent:80,
  randomizeItems:true, randomizeChoices:true, accommodations:{allowExtendedTime:true,allowAlternativeAccessiblePresentation:true},
  id:'ASSESS-LH-TECH1-007-M01', title:'Course 007 — Integrated Lab Readiness Check', purpose:'formative', items:itemIds,
  maxAttempts:null, feedbackMode:'immediate'
});

const practicals = [
  ['PRACTICAL-TECH1-A','Safe Room Entry & Crop Inspection','docs/academy-v2/practicals/PRACTICAL-TECH1-A-SAFE-ROOM-ENTRY-CROP-INSPECTION.md'],
  ['PRACTICAL-TECH1-B','Water & Irrigation Shift','docs/academy-v2/practicals/PRACTICAL-TECH1-B-WATER-IRRIGATION-SHIFT.md'],
  ['PRACTICAL-TECH1-C','IPM Scouting Route','docs/academy-v2/practicals/PRACTICAL-TECH1-C-IPM-SCOUTING-ROUTE.md'],
  ['PRACTICAL-TECH1-D','Propagation Workstation','docs/academy-v2/practicals/PRACTICAL-TECH1-D-PROPAGATION-WORKSTATION.md'],
  ['PRACTICAL-TECH1-E','Canopy Maintenance Work Order','docs/academy-v2/practicals/PRACTICAL-TECH1-E-CANOPY-MAINTENANCE-WORK-ORDER.md'],
  ['PRACTICAL-TECH1-F','Harvest-to-Dry-Room Handoff','docs/academy-v2/practicals/PRACTICAL-TECH1-F-HARVEST-TO-DRY-ROOM-HANDOFF.md']
].map(([id,title,document])=>({id,title,document,totalPoints:100,targetPassPoints:80,status:'development'}));
const scoreDomains = [
  {id:'safety-biosecurity',title:'Safety and biosecurity',points:30},
  {id:'crop-environment',title:'Crop observation and environment',points:25},
  {id:'water-irrigation',title:'Water and irrigation',points:25},
  {id:'ipm-scouting',title:'IPM scouting',points:25},
  {id:'production-execution',title:'Propagation/canopy production execution',points:25},
  {id:'harvest-traceability',title:'Harvest/postharvest/traceability',points:25},
  {id:'documentation-integrity',title:'Documentation and data integrity',points:25},
  {id:'priority-escalation-handoff',title:'Prioritization, escalation and handoff',points:20}
];
write('registry/technician-i-integrated-lab-plan.json', {
  id:'LABPLAN-TECH1-001', version:'0.1.0', status:'draft', courseId:'COURSE-LH-TECH1-007', credentialProgram:'CREDPROG-CULT-TECH-I-001',
  purpose:'Development blueprint for integrated Technician I practical and capstone evidence. This file does not approve a live credential form or final cut score.',
  prerequisites:['COURSE-LH-TECH1-001','COURSE-LH-TECH1-002','COURSE-LH-TECH1-003','COURSE-LH-TECH1-004','COURSE-LH-TECH1-005','COURSE-LH-TECH1-006'],
  practicals,
  capstone:{ id:'CAPSTONE-TECH1-SHIFT-001', document:'docs/academy-v2/practicals/CAPSTONE-TECH1-ONE-CULTIVATION-SHIFT.md', totalPoints:200, developmentTargetPassPoints:160, scoreDomains, secureCredentialFormApproved:false },
  evidenceRequired:['task decisions and timestamps','work-order selections','identified measurements with units/context','crop and scouting observations','traceability events and movement records','deviations, holds and escalation decisions','practical outputs','final shift log','final receiving/next-shift handoff'],
  criticalFailureRules:[
    {id:'CF-SAFETY-001',rule:'Knowingly continue through an unresolved life-safety or serious uncontrolled hazard when stop/emergency procedure is required.',blocksCredentialEvidence:true},
    {id:'CF-IDENTITY-001',rule:'Knowingly move, merge, relabel or transform material after an unresolved identity conflict in a way that breaks genealogy.',blocksCredentialEvidence:true},
    {id:'CF-INTEGRITY-001',rule:'Falsify, overwrite or force a measurement, count, weight or record to hide a discrepancy.',blocksCredentialEvidence:true},
    {id:'CF-AUTHORITY-001',rule:'Perform an unauthorized pesticide/treatment selection, technical repair/bypass, or product-release decision outside the supplied Technician I authority.',blocksCredentialEvidence:true},
    {id:'CF-HOLD-001',rule:'Knowingly move or release material from an active contamination/quality hold without the required authorization.',blocksCredentialEvidence:true}
  ],
  evaluatorControls:{ rubricTrainingRequired:true, evidenceBasedScoringRequired:true, pilotDoubleScoringRequired:true, interRaterAgreementTarget:'to-be-set-from-pilot-evidence', conflictResolutionProcessRequired:true },
  formControls:{ equivalentFormsRequired:true, secureCredentialFormsPublic:false, practiceFormMayExposeFeedback:true, readinessFormMayExposePostStationFeedback:true, credentialFormHintsAllowed:false },
  retestPolicy:{ status:'development', remediationBeforeRetest:true, equivalentFormRequired:true, criticalFailureRequiresAffectedDomainReevaluation:true, finalPolicyRequiresHumanApproval:true },
  releaseGates:['human technical review','accessibility review','pilot evidence','item/form equivalence evidence where applicable','evaluator calibration evidence','standard setting','approved retention/privacy policy for candidate evidence','program release approval']
});

const course = read('content/courses/COURSE-LH-TECH1-007.json');
course.version = '0.2.0';
course.status = 'draft';
course.finalAssessment = null;
course.description = 'Provides the integrated Technician I practice and capstone-preparation lab spanning shift prioritization, safety, sanitation, crop/environment observation, pH/EC and irrigation work, IPM scouting, propagation/canopy execution, harvest/postharvest traceability, dynamic-event response, records and handoff. The dedicated lab module now exists, but credential evidence remains development-only until practical, pilot, evaluator, accessibility, standard-setting and release gates are satisfied.';
course.modules = [...new Set([...course.modules, moduleId])];
course.learningOutcomes = objectives.map((o)=>o.statement);
course.extensions = {
  ...course.extensions,
  maturity:'integrated-lab-draft',
  dedicatedLabModuleRequired:false,
  dedicatedLabModule:moduleId,
  formativeReadinessAssessment:'ASSESS-LH-TECH1-007-M01',
  labPlan:'LABPLAN-TECH1-001',
  integratedPerformanceValidationRequired:true,
  humanTechnicalReviewRequired:true,
  accessibilityReviewRequired:true,
  pilotEvidenceRequired:true,
  evaluatorCalibrationRequired:true,
  standardSettingRequired:true,
  candidateEvidenceRetentionPolicyRequired:true,
  liveCredentialFormApproved:false,
  independentPesticideTreatmentAuthorityConferred:false,
  independentProductReleaseAuthorityConferred:false,
  contentCeiling:null
};
write('content/courses/COURSE-LH-TECH1-007.json', course);

const test7 = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport path from 'node:path';\nconst root=process.cwd();\nconst read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));\nconst exists=(p)=>fs.existsSync(path.join(root,p));\nconst course=read('content/courses/COURSE-LH-TECH1-007.json');\nassert.equal(course.status,'draft');\nassert.equal(course.finalAssessment,null);\nassert.equal(course.extensions?.dedicatedLabModuleRequired,false);\nassert.equal(course.extensions?.dedicatedLabModule,'MOD-LH-TECH1-007-LAB');\nassert.equal(course.extensions?.labPlan,'LABPLAN-TECH1-001');\nassert.equal(course.extensions?.integratedPerformanceValidationRequired,true);\nassert.equal(course.extensions?.liveCredentialFormApproved,false);\nassert.equal(course.extensions?.independentPesticideTreatmentAuthorityConferred,false);\nassert.equal(course.extensions?.independentProductReleaseAuthorityConferred,false);\nconst mod=read('content/modules/MOD-LH-TECH1-007-LAB.json');\nassert.equal(mod.lessons.length,4);\nassert.equal(mod.assessment,'ASSESS-LH-TECH1-007-M01');\nfor(const id of mod.lessons) assert.ok(exists(\`content/lessons/\${id}.json\`));\nfor(let i=1;i<=6;i++) assert.ok(exists(\`content/learning-objectives/LO-LH-TECH1-007-0\${i}.json\`));\nconst assess=read('content/assessments/ASSESS-LH-TECH1-007-M01.json');\nassert.equal(assess.purpose,'formative');\nassert.equal(assess.items.length,12);\nfor(const id of assess.items){ const q=read(\`content/questions/\${id}.json\`); assert.equal(q.purpose,'formative'); assert.notEqual(q.purpose,'credential'); }\nconst plan=read('registry/technician-i-integrated-lab-plan.json');\nassert.equal(plan.practicals.length,6);\nassert.deepEqual(plan.practicals.map(p=>p.id),['PRACTICAL-TECH1-A','PRACTICAL-TECH1-B','PRACTICAL-TECH1-C','PRACTICAL-TECH1-D','PRACTICAL-TECH1-E','PRACTICAL-TECH1-F']);\nfor(const p of plan.practicals){assert.equal(p.totalPoints,100);assert.equal(p.targetPassPoints,80);assert.ok(exists(p.document));}\nassert.equal(plan.capstone.totalPoints,200);\nassert.equal(plan.capstone.developmentTargetPassPoints,160);\nassert.equal(plan.capstone.scoreDomains.reduce((s,d)=>s+d.points,0),200);\nassert.equal(plan.capstone.secureCredentialFormApproved,false);\nassert.ok(exists(plan.capstone.document));\nassert.equal(plan.criticalFailureRules.length,5);\nassert.ok(plan.criticalFailureRules.every(r=>r.blocksCredentialEvidence===true));\nassert.equal(plan.evaluatorControls.pilotDoubleScoringRequired,true);\nassert.equal(plan.formControls.secureCredentialFormsPublic,false);\nconst program=read('content/credential-programs/CREDPROG-CULT-TECH-I-001.json');\nassert.equal(program.status,'draft');\nconsole.log('Technician I Course 007 integrated lab passed: dedicated lab/readiness module, all six practicals, 200-point capstone blueprint, evidence controls and release gates resolve without approving a live credential form.');\n`;
writeText('scripts/test-tech1-course7.mjs', test7);

let programTest = fs.readFileSync(path.join(root,'scripts/test-tech1-program-structure.mjs'),'utf8');
programTest = programTest.replace("const exposesGate = c.extensions?.dedicatedCourseAssessmentRequired === true || c.extensions?.dedicatedLabModuleRequired === true;", "const exposesGate = c.extensions?.dedicatedCourseAssessmentRequired === true || c.extensions?.dedicatedLabModuleRequired === true || c.extensions?.integratedPerformanceValidationRequired === true;");
programTest = programTest.replace("assert.equal(integrated.extensions?.dedicatedLabModuleRequired, true);", "assert.equal(integrated.extensions?.dedicatedLabModuleRequired, false);\nassert.equal(integrated.extensions?.dedicatedLabModule, 'MOD-LH-TECH1-007-LAB');\nassert.equal(integrated.extensions?.labPlan, 'LABPLAN-TECH1-001');\nassert.equal(integrated.extensions?.integratedPerformanceValidationRequired, true);\nassert.equal(integrated.extensions?.liveCredentialFormApproved, false);");
programTest = programTest.replace("console.log('Technician I program structure passed: all seven courses resolve; Courses 002-006 have advanced to draft instruction/assessment while Course 007 retains explicit integrated lab/practical/capstone gates.');", "console.log('Technician I program structure passed: all seven courses resolve; Courses 002-006 contain draft instruction/assessment and Course 007 now contains the dedicated integrated lab while practical/capstone validation and release gates remain explicit.');");
writeText('scripts/test-tech1-program-structure.mjs', programTest);

const pkg = read('package.json');
pkg.scripts['tech1:course7:test'] = 'node scripts/test-tech1-course7.mjs';
if (!pkg.scripts.test.includes('npm run tech1:course7:test')) pkg.scripts.test = pkg.scripts.test.replace('npm run tech1:course6:test', 'npm run tech1:course6:test && npm run tech1:course7:test');
write('package.json', pkg);

writeText('docs/academy-v2/COURSE007_BUILD_STATUS.md', `# Course 007 Build Status — Integrated Cultivation Technician Practice Lab\n\n## Built in this milestone\n\n- Dedicated integrated lab module with four applied lab lessons\n- Six measurable integrated performance objectives\n- Twelve-item formative lab-readiness assessment (not a credential answer-key bank)\n- Explicit mapping to Practicals A-F\n- 200-point capstone evidence/scoring blueprint with the existing 160-point development target\n- Five critical-failure rules protecting safety, identity, data integrity, role authority and active holds\n- Evaluator calibration, equivalent-form, retest and evidence-retention release gates\n- Explicit controls that secure credential forms are not approved/public and that Technician I does not gain independent pesticide-treatment or product-release authority\n- Course 007 and program regression tests wired into the deterministic suite\n\n## Deliberately still draft\n\nThis milestone does **not** declare the Technician I credential ready for public issuance. Remaining gates include human technical review, accessibility review, pilot evidence, evaluator calibration/inter-rater evidence, standard setting, approved candidate-evidence retention/privacy policy, approved secure credential forms, completion of required practical/capstone validation and program release approval.\n\n## Evidence model\n\nThe integrated lab is designed to produce reconstructable work evidence: task decisions/timestamps, identified measurements, crop/scouting observations, traceability events, deviations/holds/escalations, practical outputs, shift log and final handoff. Employer-facing outputs should report validated capability areas without exposing secure credential forms or answer keys.\n`);
