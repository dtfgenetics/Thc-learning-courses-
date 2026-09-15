import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const write = (rel, obj) => {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(obj, null, 2)}\n`);
};

const objectives = [
  ['LO-LH-TECH2-003-01','COMP-WATER-QUALITY-ADV-001','Verify source-water identity, sample identity, meter readiness, calibration/verification status and final pH/EC measurements before using values to accept, hold or troubleshoot a fertigation batch.','evaluate'],
  ['LO-LH-TECH2-003-02','COMP-PRO-SOP-001','Execute an approved fertigation batch from the controlled recipe and batch record, verifying material identity, calculations, sequence, target volume and authorization boundaries without independently redesigning the recipe.','apply'],
  ['LO-LH-TECH2-003-03','COMP-SAFETY-WORK-001','Apply chemical identification, label/SDS, PPE, spill/exposure and facility-handling controls during batch work and stop or escalate when safe handling requirements are not established.','apply'],
  ['LO-LH-TECH2-003-04','COMP-IRRIGATION-ADV-001','Analyze measured irrigation distribution, timing, pressure/filtration and delivery history to distinguish distribution or scheduling problems from crop-demand and root-zone causes.','analyze'],
  ['LO-LH-TECH2-003-05','COMP-ROOTZONE-001','Interpret root-zone moisture, dryback, pH, EC and root observations as trends in crop, media, container, stage and environmental context rather than as universal standalone targets.','analyze'],
  ['LO-LH-TECH2-003-06','COMP-NUTRIENT-DIAG-001','Build and rank fertigation/root-zone differentials that distinguish measurement error, delivery, timing, accumulation, nutrient-supply and plant-demand explanations and choose the next discriminating check.','evaluate'],
  ['LO-LH-TECH2-003-07','COMP-PRO-QA-001','Produce reconstructable batch and troubleshooting records that preserve original measurements, deviations, verification evidence, authorized actions, unresolved conditions and escalation decisions.','evaluate']
];
for (const [id, competency, statement, bloomLevel] of objectives) {
  write(`content/learning-objectives/${id}.json`, {id, competency, statement, bloomLevel, status:'draft', version:'1.0.0'});
}

const lessons = [
  {
    id:'LESSON-LH-TECH2-003-01',
    title:'Approved Batch Readiness, Material Identity and Controlled Execution',
    competencies:['COMP-PRO-SOP-001','COMP-SAFETY-WORK-001','COMP-WATER-QUALITY-ADV-001'],
    learningObjectives:['LO-LH-TECH2-003-01','LO-LH-TECH2-003-02','LO-LH-TECH2-003-03'],
    estimatedMinutes:65,
    references:['REF-WATER-ALKALINITY-EXT-001','REF-SAFETY-OSHA-001','REF-ASTM-E2659-001'],
    content:{
      overview:'Technician II fertigation work is controlled execution, not independent recipe design. Before mixing begins, the technician verifies the effective recipe, source water, material identity, target volume, calculation inputs, sequence, measuring tools, PPE and facility authorization. Any mismatch is held and resolved rather than corrected by improvisation.',
      vocabulary:[
        {term:'Controlled recipe',definition:'The currently authorized formulation and instructions that govern batch preparation.'},
        {term:'Material identity',definition:'Verified product or ingredient identity matched to the approved record before use.'},
        {term:'Batch hold',definition:'A documented status that prevents use or release while an unresolved discrepancy is evaluated.'}
      ],
      sections:[
        {title:'Verify the effective instruction before touching materials',body:'Confirm the correct recipe/version, target final volume, source-water condition, material identities and required sequence. A familiar prior batch is not authority to substitute a different material or concentration.',references:['REF-ASTM-E2659-001']},
        {title:'Chemical handling begins with identification and hazard controls',body:'Labels, SDS information, required PPE, decontamination/spill response and facility handling rules must be available and understood before work proceeds. An unidentified, damaged or incompatible material is a stop-and-escalate condition.',references:['REF-SAFETY-OSHA-001']},
        {title:'Source water is an input, not empty background',body:'Alkalinity, dissolved ions and other source-water characteristics can affect pH behavior and nutrient formulation. Verify the source and relevant measurements before interpreting final batch response.',references:['REF-WATER-ALKALINITY-EXT-001']}
      ],
      workedExamples:['A container label does not match the approved material code; the technician places the batch on hold instead of substituting based on appearance.','A recipe calls for a target final volume, so the technician uses the controlled calculation and sequence rather than scaling by memory from yesterday’s batch.'],
      commonMistakes:['Treating a familiar-looking material as verified identity.','Changing a concentration to chase a preferred EC without recipe authority.','Beginning mixing before PPE or spill response requirements are established.'],
      practicalApplication:'Complete a pre-batch readiness checklist documenting effective recipe/version, source water, each material identity, target volume, calculations, sequence, meter status, PPE and any hold/escalation condition.',
      summary:'Controlled fertigation starts with verified identity, effective instructions, safe handling and authority boundaries before any nutrient is added.'
    }
  },
  {
    id:'LESSON-LH-TECH2-003-02',
    title:'Measurement Quality, Final-Batch Verification and Accept/Hold Decisions',
    competencies:['COMP-WATER-QUALITY-ADV-001','COMP-PRO-SOP-001','COMP-PRO-QA-001'],
    learningObjectives:['LO-LH-TECH2-003-01','LO-LH-TECH2-003-02','LO-LH-TECH2-003-07'],
    estimatedMinutes:60,
    references:['REF-WATER-ALKALINITY-EXT-001','REF-MHRA-GXP-DATA-INTEGRITY'],
    content:{
      overview:'A digital value is not automatically decision-grade evidence. pH and EC instruments can drift, foul or be used with the wrong sample method. Final-batch verification therefore checks device identity/status, standards or reference checks, sample identity, stabilization, expected range and the controlled accept/hold/escalate rule.',
      vocabulary:[
        {term:'Verification',definition:'A check that confirms a measuring system performs acceptably for its intended use without necessarily changing calibration.'},
        {term:'Out-of-tolerance',definition:'A measurement or instrument result outside an established acceptance or verification criterion.'},
        {term:'Original observation',definition:'The initially recorded value or fact preserved even when later evidence shows it was affected by error.'}
      ],
      sections:[
        {title:'Verify unexpected readings before changing the batch',body:'When pH or EC changes unexpectedly, check sample identity, instrument status, standards/reference solution, probe condition and a second verified measurement before making a chemistry decision.',references:['REF-WATER-ALKALINITY-EXT-001']},
        {title:'Expected range is not permission to manipulate records',body:'If a verified measurement is outside the controlled range, preserve the value and use the approved hold/escalation or adjustment instruction. Do not retest selectively until a preferred number appears.',references:['REF-MHRA-GXP-DATA-INTEGRITY']},
        {title:'Record the measurement chain',body:'A reconstructable record includes meter/device ID, verification or calibration status, sample identity, timestamp, result, relevant standard/reference and the decision made from the evidence.',references:['REF-MHRA-GXP-DATA-INTEGRITY']}
      ],
      workedExamples:['A final EC is unexpectedly high; a reference check shows the meter is reading high, so the original result is preserved and the batch is remeasured with a verified instrument before disposition.','Two repeated pH results agree and the instrument passes verification but the batch is outside the authorized range; the technician holds and escalates instead of inventing an adjustment.'],
      commonMistakes:['Changing chemistry before checking the meter.','Deleting a suspect measurement after a device problem is found.','Repeating measurements without documenting why the repeat was performed.'],
      practicalApplication:'Complete a final-batch verification record with device/sample identity, verification evidence, result, expected range, disposition and any authorized correction or escalation.',
      summary:'Measurement quality is part of batch quality. Verify the tool and sample before acting, then preserve both the original evidence and the final disposition.'
    }
  },
  {
    id:'LESSON-LH-TECH2-003-03',
    title:'Irrigation Distribution, Root-Zone Trends and Dryback Context',
    competencies:['COMP-IRRIGATION-ADV-001','COMP-ROOTZONE-001','COMP-NUTRIENT-DIAG-001'],
    learningObjectives:['LO-LH-TECH2-003-04','LO-LH-TECH2-003-05','LO-LH-TECH2-003-06'],
    estimatedMinutes:70,
    references:['REF-IRRIGATION-001','REF-NUTRIENT-UPTAKE-2026-001','REF-ROOTZONE-NUTRIENT-002','REF-NUTRITION-001'],
    content:{
      overview:'Root-zone troubleshooting is a connected-system problem. Irrigation volume and timing, distribution uniformity, media/container properties, crop stage, environment, water use, pH and EC all influence what the roots experience. Dryback and EC trends are useful only when interpreted in that context.',
      vocabulary:[
        {term:'Distribution uniformity',definition:'How evenly irrigation delivery is measured among representative locations.'},
        {term:'Dryback',definition:'Decline in root-zone water content between irrigation events.'},
        {term:'Mass-balance context',definition:'Interpretation of what enters, leaves, accumulates in or is taken up from the root-zone system.'}
      ],
      sections:[
        {title:'Measure delivery before blaming plant demand',body:'Representative emitter output, pressure/filtration condition and location comparisons help distinguish irrigation distribution problems from crop or root-zone causes.',references:['REF-IRRIGATION-001']},
        {title:'There is no universal dryback target',body:'Dryback depends on media, container, rooting, plant size, stage, light, VPD and irrigation strategy. Use verified trends and crop response rather than copying a single percentage across systems.',references:['REF-IRRIGATION-001','REF-NUTRIENT-UPTAKE-2026-001']},
        {title:'Root-zone EC needs water-balance and composition context',body:'A rising root-zone EC can reflect reduced water volume, accumulation, selective uptake or delivery changes. EC does not identify which ions changed, so formulation and element-specific evidence may be needed.',references:['REF-ROOTZONE-NUTRIENT-002','REF-NUTRITION-001']}
      ],
      workedExamples:['Only far-end containers dry faster; catch volumes show lower delivery there, so distribution becomes a stronger hypothesis than a room-wide nutrient deficiency.','Root-zone EC rises while input EC is stable and drainage volume has fallen; investigate water balance and accumulation before changing nutrient concentration.'],
      commonMistakes:['Using one dryback percentage for every media and stage.','Assuming nominal emitter flow proves installed delivery.','Treating root-zone EC as an element-specific nutrient assay.'],
      practicalApplication:'Trend representative irrigation timestamps/volumes, emitter output, root-zone moisture, pH/EC, crop stage, environment and plant observations. Annotate which evidence supports delivery, scheduling, accumulation or plant-demand hypotheses.',
      summary:'Root-zone interpretation is strongest when measured irrigation performance, crop demand and chemical trends are analyzed as one system.'
    }
  },
  {
    id:'LESSON-LH-TECH2-003-04',
    title:'Fertigation and Root-Zone Differential Reasoning, Authorized Correction and Handoff',
    competencies:['COMP-NUTRIENT-DIAG-001','COMP-IRRIGATION-ADV-001','COMP-PRO-SOP-001','COMP-SAFETY-WORK-001','COMP-PRO-QA-001'],
    learningObjectives:['LO-LH-TECH2-003-02','LO-LH-TECH2-003-03','LO-LH-TECH2-003-04','LO-LH-TECH2-003-06','LO-LH-TECH2-003-07'],
    estimatedMinutes:65,
    references:['REF-NUTRIENT-DEFICIENCY-001','REF-NUTRITION-001','REF-IRRIGATION-001','REF-SAFETY-OSHA-001','REF-MHRA-GXP-DATA-INTEGRITY'],
    content:{
      overview:'The end product of troubleshooting is a bounded next decision, not a dramatic recipe change. Technician II compares measurement, delivery, timing, accumulation, nutrient-supply, root and plant-demand hypotheses, chooses a discriminating check, completes only authorized corrections and leaves a reconstructable record for the next role or shift.',
      vocabulary:[
        {term:'Discriminating check',definition:'A targeted observation or test whose result changes the ranking of competing explanations.'},
        {term:'Authorized correction',definition:'A corrective action explicitly permitted by the controlled procedure and worker role.'},
        {term:'Escalation boundary',definition:'A condition where uncertainty, risk, chemical decision, equipment work or authorization requires transfer to another qualified role.'}
      ],
      sections:[
        {title:'Keep multiple causal categories alive until evidence separates them',body:'Visible crop symptoms can overlap among nutrition, roots, irrigation, environment and disease. Use pattern, chronology and measurements to rank causes rather than treating one symptom as proof.',references:['REF-NUTRIENT-DEFICIENCY-001','REF-NUTRITION-001']},
        {title:'Prefer the next check that can change the decision',body:'If distribution, measurement and accumulation remain plausible, choose the check most likely to distinguish them rather than collecting more low-value data.',references:['REF-IRRIGATION-001']},
        {title:'Correction authority is not diagnostic confidence',body:'Even a strong hypothesis does not authorize an unapproved recipe or chemical change. Follow the controlled instruction and chemical-safety requirements, or hold/escalate.',references:['REF-SAFETY-OSHA-001']},
        {title:'Preserve before/after evidence and unresolved conditions',body:'Record the original condition, verification steps, selected action, post-action response and what remains uncertain. Do not rewrite the record to make a hypothesis appear confirmed.',references:['REF-MHRA-GXP-DATA-INTEGRITY']}
      ],
      workedExamples:['A verified irrigation distribution fault is corrected under the authorized procedure and catch volumes are repeated before the issue is closed.','A nutrient-related hypothesis remains plausible, but changing the recipe is outside role authority; the technician documents evidence and escalates with a recommended next check.'],
      commonMistakes:['Changing multiple systems at once.','Confusing a plausible diagnosis with authority to change the formulation.','Closing the case without post-action verification or unresolved-condition documentation.'],
      practicalApplication:'Produce a root-zone/irrigation diagnostic memo with ranked hypotheses, evidence for/against, next check, authorized correction or escalation, post-action verification and a supervisor-ready handoff.',
      summary:'Technician II troubleshooting reduces uncertainty, respects chemical and SOP boundaries, and leaves evidence that another qualified person can reconstruct.'
    }
  }
];
for (const lesson of lessons) write(`content/lessons/${lesson.id}.json`, {version:'1.0.0',status:'draft',assessment:null,...lesson});

const allCompetencies = ['COMP-WATER-QUALITY-ADV-001','COMP-IRRIGATION-ADV-001','COMP-NUTRIENT-DIAG-001','COMP-ROOTZONE-001','COMP-PRO-SOP-001','COMP-SAFETY-WORK-001','COMP-PRO-QA-001'];
const objectiveIds = objectives.map((x)=>x[0]);
write('content/modules/MOD-LH-TECH2-003-FERTIGATION.json', {
  id:'MOD-LH-TECH2-003-FERTIGATION', title:'Controlled Fertigation & Root-Zone Troubleshooting', version:'1.0.0', status:'draft',
  lessons:lessons.map((x)=>x.id), competencies:allCompetencies, assessment:'ASSESS-LH-TECH2-003-M01'
});

const S = (competency, objective, stem, answer, wrong, references, bloom='analyze', difficulty='hard') => ({competency, objective, stem, answer, wrong, references, bloom, difficulty});
const summative = [
  S('COMP-WATER-QUALITY-ADV-001','LO-LH-TECH2-003-01','A final-batch EC is unexpectedly high. What is the strongest first response?','Verify sample identity and meter performance with the controlled reference/check before changing the batch.',['Dilute immediately until the display matches target.','Delete the first reading and retest until a normal value appears.','Increase nutrient concentration because high EC indicates deficiency.'],['REF-WATER-ALKALINITY-EXT-001']),
  S('COMP-PRO-SOP-001','LO-LH-TECH2-003-02','The approved recipe specifies Material A, but only a visually similar Material B is available. What should the technician do?','Hold the batch and resolve the material-identity discrepancy through the controlled process.',['Substitute Material B at the same volume.','Use half as much Material B as a precaution.','Ask a coworker whether the substitution usually works.'],['REF-ASTM-E2659-001']),
  S('COMP-SAFETY-WORK-001','LO-LH-TECH2-003-03','A chemical container has an unreadable label and no verified identity. What is the correct action?','Do not use it; isolate/hold it according to procedure and obtain verified identity and hazard information.',['Smell it to identify the material.','Compare its color with known products and proceed.','Use a small amount to see how the batch responds.'],['REF-SAFETY-OSHA-001']),
  S('COMP-IRRIGATION-ADV-001','LO-LH-TECH2-003-04','Far-end plants dry faster than near-end plants on the same schedule. Which check best tests a delivery hypothesis?','Measure representative emitter output and relevant pressure/filtration conditions across the zone.',['Raise nutrient concentration room-wide.','Increase every irrigation event before measuring distribution.','Assume the far-end plants are genetically thirstier.'],['REF-IRRIGATION-001']),
  S('COMP-ROOTZONE-001','LO-LH-TECH2-003-05','Why is a single universal dryback percentage inappropriate for every crop?','Media, container, rooting, stage, environment and plant demand change the meaning of the moisture trend.',['Dryback is determined only by nutrient concentration.','All calibrated sensors produce the same biological target.','Container size has no effect once roots are present.'],['REF-IRRIGATION-001','REF-NUTRIENT-UPTAKE-2026-001']),
  S('COMP-NUTRIENT-DIAG-001','LO-LH-TECH2-003-06','Root-zone EC rises while input EC remains stable. Which interpretation is most defensible?','Investigate water balance, accumulation, selective uptake and delivery before changing nutrient concentration.',['The input recipe is automatically too strong.','The EC meter is automatically defective.','The crop is proven deficient in one specific element.'],['REF-ROOTZONE-NUTRIENT-002','REF-NUTRITION-001']),
  S('COMP-PRO-QA-001','LO-LH-TECH2-003-07','A suspect meter reading is later shown to be biased. What should happen to the original record?','Preserve it with the verification evidence and documented disposition rather than erasing history.',['Replace it with the corrected value only.','Delete the entire batch record.','Backdate a new value to the original timestamp.'],['REF-MHRA-GXP-DATA-INTEGRITY']),
  S('COMP-WATER-QUALITY-ADV-001','LO-LH-TECH2-003-01','A pH meter passes yesterday’s calibration but gives an implausible value today. What is the best reasoning?','Current measurement fitness should be verified; prior calibration alone does not prove today’s reading is valid.',['Yesterday’s calibration makes the value unquestionable.','The batch must be discarded without another check.','Change the recipe until the meter value looks familiar.'],['REF-WATER-ALKALINITY-EXT-001']),
  S('COMP-PRO-SOP-001','LO-LH-TECH2-003-02','A technician believes a different nutrient ratio would perform better than the approved recipe. What may the technician do?','Document the concern and route it through the approved change/escalation process while executing only the authorized recipe.',['Change the ratio for one batch as an experiment.','Quietly reduce one ingredient and compare yield later.','Edit the recipe file in place before mixing.'],['REF-ASTM-E2659-001']),
  S('COMP-IRRIGATION-ADV-001','LO-LH-TECH2-003-04','Nominal 2-L/h emitters are installed. What does that label prove about current installed performance?','It does not prove current field delivery; representative output must be measured.',['Every emitter currently delivers exactly 2 L/h.','Pressure and clogging cannot affect output.','The irrigation zone needs no uniformity testing.'],['REF-IRRIGATION-001']),
  S('COMP-ROOTZONE-001','LO-LH-TECH2-003-05','A moisture sensor is moved into a different substrate. What should happen before its raw value is treated as an absolute target?','Verify installation and substrate-specific behavior/reference so the trend has appropriate context.',['Reuse the old substrate target unchanged.','Increase irrigation until the raw number matches the previous media.','Ignore crop stage because sensor output is universal.'],['REF-IRRIGATION-001']),
  S('COMP-NUTRIENT-DIAG-001','LO-LH-TECH2-003-06','Interveinal chlorosis appears only in one irrigation zone. Which differential is strongest?','Keep nutrition, localized delivery/root-zone conditions and other look-alikes open until zone evidence separates them.',['Declare a micronutrient deficiency from color alone.','Increase micronutrients facility-wide immediately.','Ignore irrigation because leaf symptoms cannot arise from root-zone conditions.'],['REF-NUTRIENT-DEFICIENCY-001','REF-NUTRITION-001']),
  S('COMP-SAFETY-WORK-001','LO-LH-TECH2-003-03','Required PPE for a batch step is unavailable. What is the correct decision?','Do not perform the step until the required control is available or the authorized procedure provides a safe alternative.',['Proceed carefully because the batch is urgent.','Use any glove available regardless of compatibility.','Ask another worker to stand nearby and continue.'],['REF-SAFETY-OSHA-001']),
  S('COMP-PRO-SOP-001','LO-LH-TECH2-003-02','The batch calculation conflicts with the controlled target final volume. What is the best action?','Stop and reconcile the calculation/instruction before adding materials.',['Choose the larger number to avoid deficiency.','Average the two values.','Use yesterday’s volume from memory.'],['REF-ASTM-E2659-001']),
  S('COMP-WATER-QUALITY-ADV-001','LO-LH-TECH2-003-01','Why should source-water identity be verified before comparing two fertigation batches?','Different source-water chemistry can alter pH behavior and ionic contribution, changing the interpretation.',['Source water never affects final solution chemistry.','Only final volume matters.','Source identity matters only for outdoor crops.'],['REF-WATER-ALKALINITY-EXT-001']),
  S('COMP-IRRIGATION-ADV-001','LO-LH-TECH2-003-04','A schedule produces acceptable room-average moisture but one bench repeatedly remains wet. What is the strongest next step?','Compare representative delivery and root-zone trends by location instead of changing the whole-room schedule from the average.',['Shorten every event immediately.','Ignore the wet bench because the room average is acceptable.','Raise EC to increase water use.'],['REF-IRRIGATION-001']),
  S('COMP-ROOTZONE-001','LO-LH-TECH2-003-05','Two rooms use the same media and clock schedule but show different dryback. Which context is most important to compare?','Plant size/stage, light, VPD, rooting and actual irrigation delivery.',['Only the calendar date.','Only the nutrient brand.','Only the room name.'],['REF-NUTRIENT-UPTAKE-2026-001','REF-IRRIGATION-001']),
  S('COMP-NUTRIENT-DIAG-001','LO-LH-TECH2-003-06','A tissue value is outside a published range. Why should it not automatically trigger a recipe change?','Sampling position, stage, symptom pattern, root-zone and environmental context affect interpretation and causality.',['Tissue testing is never useful.','Published ranges always apply only to soil.','The value proves the meter is wrong.'],['REF-NUTRIENT-DEFICIENCY-001']),
  S('COMP-PRO-QA-001','LO-LH-TECH2-003-07','What makes a troubleshooting handoff reconstructable?','It preserves observations, measurements, verification steps, decisions, actions, responses and unresolved conditions with identities/timestamps.',['It states only the technician’s preferred diagnosis.','It replaces conflicting measurements with an average.','It records only the final correction.'],['REF-MHRA-GXP-DATA-INTEGRITY']),
  S('COMP-PRO-SOP-001','LO-LH-TECH2-003-02','A recipe version was recently revised. Which version governs today’s batch?','The currently effective approved version under the facility’s controlled-document process.',['Whichever version the technician remembers best.','The oldest version because it has more history.','Any version that produces the target EC.'],['REF-ASTM-E2659-001']),
  S('COMP-WATER-QUALITY-ADV-001','LO-LH-TECH2-003-01','A repeated out-of-range pH result is obtained with a verified meter and correct sample. What should happen next?','Apply the controlled accept/hold/escalate or authorized adjustment procedure; do not invent a chemistry change.',['Keep retesting until an in-range result appears.','Delete the result and use the target value.','Change multiple ingredients until pH moves.'],['REF-WATER-ALKALINITY-EXT-001','REF-MHRA-GXP-DATA-INTEGRITY']),
  S('COMP-IRRIGATION-ADV-001','LO-LH-TECH2-003-04','After an authorized emitter correction, what evidence best supports closure?','Repeat representative output/uniformity measurements under comparable conditions.',['The alarm is no longer visible.','The technician believes the repair worked.','One plant looks better immediately.'],['REF-IRRIGATION-001']),
  S('COMP-ROOTZONE-001','LO-LH-TECH2-003-05','Root-zone EC is high in only the driest containers. Which conclusion is strongest?','The pattern supports investigating water volume/dryback and accumulation before making a room-wide nutrient change.',['The nutrient recipe is proven excessive for every plant.','High EC identifies the accumulated ion.','The dry containers prove a pathogen is present.'],['REF-ROOTZONE-NUTRIENT-002','REF-IRRIGATION-001']),
  S('COMP-SAFETY-WORK-001','LO-LH-TECH2-003-03','A spill occurs during batch preparation. What should guide the response?','The facility spill/exposure procedure and product hazard information, using required PPE and escalation.',['Continue mixing so the batch does not time out.','Neutralize it with another chemical from memory.','Rinse everything immediately regardless of product hazards.'],['REF-SAFETY-OSHA-001'])
];

const formative = [
  S('COMP-WATER-QUALITY-ADV-001','LO-LH-TECH2-003-01','What is the purpose of meter verification before acting on an unusual batch result?','To confirm the measurement system is fit enough for the decision before changing the process.',['To force the reading into the target range.','To replace the original reading in the record.','To eliminate the need for sample identity.'],['REF-WATER-ALKALINITY-EXT-001'],'apply','moderate'),
  S('COMP-PRO-SOP-001','LO-LH-TECH2-003-02','Why is material identity checked against the batch record?','To prevent the wrong or incompatible material from entering a controlled batch.',['To estimate plant demand.','To determine room VPD.','To avoid recording lot information.'],['REF-ASTM-E2659-001'],'apply','moderate'),
  S('COMP-SAFETY-WORK-001','LO-LH-TECH2-003-03','What should happen if required chemical hazard information is unavailable?','Pause the task and obtain the required identity/hazard controls before handling proceeds.',['Proceed if the container looks familiar.','Use less product and continue.','Skip PPE for the first step only.'],['REF-SAFETY-OSHA-001'],'apply','moderate'),
  S('COMP-IRRIGATION-ADV-001','LO-LH-TECH2-003-04','What is the best evidence that installed emitters are delivering uniformly?','Representative measured output across relevant positions under operating conditions.',['The emitter package rating.','The controller’s programmed duration.','One near-end catch cup.'],['REF-IRRIGATION-001'],'apply','moderate'),
  S('COMP-ROOTZONE-001','LO-LH-TECH2-003-05','Dryback is best understood as what?','A root-zone moisture trajectory interpreted with crop, media, container and environment context.',['A universal percentage for all cannabis crops.','A nutrient concentration target.','A fixed clock interval independent of demand.'],['REF-IRRIGATION-001'],'understand','moderate'),
  S('COMP-NUTRIENT-DIAG-001','LO-LH-TECH2-003-06','Why should a visual symptom not be treated as a confirmed nutrient deficiency?','Similar symptoms can arise from multiple nutritional, root, irrigation, environmental or biotic causes.',['Leaf color is unrelated to plant health.','Only laboratory data may ever be used.','Nutrient deficiencies never produce visible symptoms.'],['REF-NUTRIENT-DEFICIENCY-001'],'analyze','moderate'),
  S('COMP-PRO-QA-001','LO-LH-TECH2-003-07','Why preserve an original abnormal reading after later verification finds meter bias?','It is part of the reconstructable history and should be linked to the verification/disposition evidence.',['It should be hidden to avoid confusion.','It should be replaced with the target value.','It is irrelevant once the meter is serviced.'],['REF-MHRA-GXP-DATA-INTEGRITY'],'apply','moderate'),
  S('COMP-WATER-QUALITY-ADV-001','LO-LH-TECH2-003-01','A pH/EC sample label is missing. What is the strongest response?','Do not use the result for disposition until sample identity is resolved under procedure.',['Assume it came from the latest batch.','Use whichever batch result is closest.','Relabel it from memory and continue.'],['REF-MHRA-GXP-DATA-INTEGRITY'],'apply','moderate'),
  S('COMP-PRO-SOP-001','LO-LH-TECH2-003-02','What does Technician II diagnostic confidence authorize by itself?','Nothing beyond the worker’s controlled procedure and assigned authority.',['Any recipe change that seems scientifically reasonable.','Any chemical substitution with the same EC.','Any equipment repair needed to finish the batch.'],['REF-ASTM-E2659-001'],'understand','moderate'),
  S('COMP-IRRIGATION-ADV-001','LO-LH-TECH2-003-04','A controller run time increased, but catch volume did not. What should the technician infer first?','There is a command/delivery mismatch that requires verification of actual system response.',['The plants automatically used more water.','The nutrient recipe is too weak.','The new run time proves delivery increased.'],['REF-IRRIGATION-001'],'analyze','moderate'),
  S('COMP-ROOTZONE-001','LO-LH-TECH2-003-05','What context should accompany root-zone EC trends?','Irrigation volume/timing, moisture/dryback, stage, environment, media/container and input chemistry.',['Only cultivar name.','Only target pH.','Only the last feeding event.'],['REF-ROOTZONE-NUTRIENT-002','REF-IRRIGATION-001'],'analyze','moderate'),
  S('COMP-PRO-QA-001','LO-LH-TECH2-003-07','What should a next-shift handoff include when the root-zone cause remains unresolved?','Current evidence, ranked possibilities, checks completed, current safe/controlled status and the next verification needed.',['Only the leading hypothesis.','A rewritten record showing one clear cause.','No uncertainty so the next shift is not confused.'],['REF-MHRA-GXP-DATA-INTEGRITY'],'apply','moderate')
];

const makeItem = (id, purpose, spec, index) => {
  const correctPosition = index % 4;
  const choices = [...spec.wrong];
  choices.splice(correctPosition, 0, spec.answer);
  return {id,version:1,status:'draft',purpose,competency:spec.competency,objective:spec.objective,bloomLevel:spec.bloom,difficulty:spec.difficulty,type:'scenario',stem:spec.stem,choices,correct:correctPosition,rationale:spec.answer,references:spec.references};
};
const summativeIds = [];
summative.forEach((spec,i)=>{ const id=`ITEM-LH-TECH2-003-${String(i+1).padStart(3,'0')}`; summativeIds.push(id); write(`content/questions/${id}.json`,makeItem(id,'summative',spec,i)); });
const formativeIds = [];
formative.forEach((spec,i)=>{ const id=`ITEM-LH-TECH2-003-M01-${String(i+1).padStart(3,'0')}`; formativeIds.push(id); write(`content/questions/${id}.json`,makeItem(id,'formative',spec,i)); });

const blueprintCounts = Object.fromEntries(allCompetencies.map((c)=>[c,0]));
for (const spec of summative) blueprintCounts[spec.competency]++;
const targets = {
  'COMP-WATER-QUALITY-ADV-001':'Source water, sample identity, meter readiness and final-batch measurement verification',
  'COMP-IRRIGATION-ADV-001':'Measured distribution, scheduling and delivery-response troubleshooting',
  'COMP-NUTRIENT-DIAG-001':'Multi-factor nutrient/root-zone differential reasoning and next-check selection',
  'COMP-ROOTZONE-001':'Contextual dryback, moisture, pH and EC trend interpretation',
  'COMP-PRO-SOP-001':'Controlled recipe execution, material identity and authority boundaries',
  'COMP-SAFETY-WORK-001':'Chemical handling, PPE, spill/exposure and stop-work decisions',
  'COMP-PRO-QA-001':'Reconstructable batch/troubleshooting records and escalation handoff'
};
write('content/assessments/ASSESS-LH-TECH2-003-FINAL.json', {
  id:'ASSESS-LH-TECH2-003-FINAL',title:'Fertigation Execution, Verification & Root-Zone Interpretation — Course Assessment',version:'1.0.0',status:'draft',purpose:'summative',
  competencies:allCompetencies,objectives:objectiveIds,items:summativeIds,passingScorePercent:80,maxAttempts:null,cooldownHours:0,feedbackMode:'post-attempt-domain-level',totalItems:24,randomizeItems:true,randomizeChoices:true,
  blueprint:allCompetencies.map((competency)=>({competency,items:blueprintCounts[competency],cognitiveTarget:targets[competency]})),
  itemSelection:{minimumActiveItemsPerCompetency:1,targetBankItemsPerCompetency:12,requireReferenceBackedItems:true,requireHumanAssessmentReview:true},
  accommodations:{allowExtendedTime:true,allowAlternativeAccessiblePresentation:true},
  extensions:{courseId:'COURSE-LH-TECH2-003',linkedCredentialPractical:'PRACTICAL-TECH2-C-FERTIGATION-ROOTZONE-TROUBLESHOOTING',bankStatus:'development-seed',bankExpansionTarget:48,distinctFormativeBank:true,formativeAssessment:'ASSESS-LH-TECH2-003-M01',publicCredentialItemsExcluded:true}
});
write('content/assessments/ASSESS-LH-TECH2-003-M01.json', {
  id:'ASSESS-LH-TECH2-003-M01',title:'Fertigation & Root-Zone Verification — Formative Check',version:'1.0.0',status:'draft',purpose:'formative',
  competencies:[...new Set(formative.map((x)=>x.competency))],objectives:objectiveIds,items:formativeIds,passingScorePercent:80,feedbackMode:'immediate-with-rationale',randomizeItems:true,randomizeChoices:true,
  extensions:{courseId:'COURSE-LH-TECH2-003',distinctFromSummativeBank:true,publicCredentialItemsExcluded:true}
});

const course = read('content/courses/COURSE-LH-TECH2-003.json');
course.version='0.2.0';
course.modules=['MOD-WATER-QUALITY-ADV-001','MOD-IRRIGATION-ADV-001','MOD-NUTRIENT-DIAG-001','MOD-ROOTZONE-001','MOD-PRO-SOP-001','MOD-PRO-QA-001','MOD-SAFETY-WORK-001','MOD-LH-TECH2-003-FERTIGATION'];
course.competencies=allCompetencies;
course.finalAssessment='ASSESS-LH-TECH2-003-FINAL';
course.learningOutcomes=[
  'Execute approved fertigation batches with verified material identity, calculations, measurement quality and chemical-safety controls without independently redesigning the recipe.',
  'Interpret irrigation delivery, root-zone moisture/dryback, pH and EC as a connected system using crop, media, container, stage and environmental context.',
  'Build ranked fertigation/root-zone differentials and select discriminating verification steps before corrective action.',
  'Produce reconstructable batch and diagnostic records and escalate chemistry, safety, equipment or crop-risk decisions that exceed Technician II authority.'
];
course.extensions.maturity='instruction-assessment-draft';
course.extensions.developmentDependencies=course.modules.filter((id)=>id!=='MOD-LH-TECH2-003-FERTIGATION');
course.extensions.dedicatedCourseAssessmentRequired=false;
course.extensions.dedicatedPerformanceValidationRequired=true;
course.extensions.mappedPractical='PRACTICAL-TECH2-C-FERTIGATION-ROOTZONE-TROUBLESHOOTING';
course.extensions.publicCredentialItemsAreDevelopmentOnly=true;
course.extensions.operationalCredentialBankMustBePrivate=true;
course.extensions.independentRecipeDesignAuthorityConferred=false;
write('content/courses/COURSE-LH-TECH2-003.json',course);

const program = read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');
for (const comp of allCompetencies) if (!program.competencies.includes(comp)) program.competencies.push(comp);
write('content/credential-programs/CREDPROG-CULT-TECH-II-001.json',program);

const structureTest = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport path from 'node:path';\n\nconst read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));\nconst program = read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');\nconst expected = [\"COURSE-LH-TECH2-001\",\"COURSE-LH-TECH2-002\",\"COURSE-LH-TECH2-003\",\"COURSE-LH-TECH2-004\",\"COURSE-LH-TECH2-005\",\"COURSE-LH-TECH2-006\",\"COURSE-LH-TECH2-007\",\"COURSE-LH-TECH2-008\"];\nconst built = {\n  'COURSE-LH-TECH2-001': { final:'ASSESS-LH-TECH2-001-FINAL', practical:'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP' },\n  'COURSE-LH-TECH2-002': { final:'ASSESS-LH-TECH2-002-FINAL', practical:'PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION' },\n  'COURSE-LH-TECH2-003': { final:'ASSESS-LH-TECH2-003-FINAL', practical:'PRACTICAL-TECH2-C-FERTIGATION-ROOTZONE-TROUBLESHOOTING' }\n};\nassert.deepEqual(program.requiredCourses, expected);\nassert.equal(program.status, 'draft');\nassert.equal(program.prerequisiteCredentials.includes('CREDPROG-CULT-TECH-I-001'), true);\nassert.equal(program.assessmentModel.credentialAssessment, 'ASSESS-CULT-TECH-II-CREDENTIAL-001');\nassert.equal(program.assessmentModel.performanceEvidence.length, 7);\nassert.equal(program.assessmentModel.capstone, 'CAPSTONE-TECH2-SENIOR-TECHNICIAN-DIAGNOSTIC-SHIFT');\nfor (const id of expected) {\n  const course = read('content/courses/' + id + '.json');\n  assert.equal(course.status, 'draft', id + ' must remain draft until validation evidence supports promotion');\n  assert.equal(course.credentialBearing, true);\n  assert.equal(course.extensions.credentialPath, program.id);\n  assert.equal(course.extensions.legacySourceCourse, 'COURSE-CULT-TECH-II-001');\n  assert.ok(course.modules.length > 0 && course.competencies.length > 0);\n  if (built[id]) {\n    assert.equal(course.finalAssessment, built[id].final);\n    assert.equal(course.extensions.dedicatedCourseAssessmentRequired, false);\n    assert.equal(course.extensions.dedicatedPerformanceValidationRequired, true);\n    assert.equal(course.extensions.mappedPractical, built[id].practical);\n    assert.ok(fs.existsSync(path.join('content/assessments', course.finalAssessment + '.json')), id + ' final assessment must resolve');\n  } else if (id === 'COURSE-LH-TECH2-008') {\n    assert.equal(course.finalAssessment, null);\n    assert.equal(course.extensions.dedicatedLabModuleRequired, true);\n    assert.equal(course.extensions.integratedPerformanceValidationRequired, true);\n  } else {\n    assert.equal(course.finalAssessment, null);\n    assert.equal(course.extensions.dedicatedCourseAssessmentRequired, true, id + ' must retain an explicit assessment build gate');\n  }\n}\nfor (const id of program.assessmentModel.performanceEvidence) assert.ok(fs.existsSync(path.join('content/performance-assessments', id + '.json')), 'missing ' + id);\nassert.ok(fs.existsSync(path.join('content/performance-assessments', program.assessmentModel.capstone + '.json')), 'missing capstone');\nassert.ok(fs.existsSync('content/courses/COURSE-CULT-TECH-II-001.json'), 'legacy Technician II source course must be preserved');\nconst legacy = read('content/courses/COURSE-CULT-TECH-II-001.json');\nassert.equal(legacy.finalAssessment, 'ASSESS-CULT-TECH-II-CREDENTIAL-001');\nconst exam = read('content/assessments/ASSESS-CULT-TECH-II-CREDENTIAL-001.json');\nassert.equal(exam.status, 'draft');\nassert.equal(exam.purpose, 'credential');\nassert.equal(exam.items.length, 0, 'public credential definition must not contain an operational selected form');\nconsole.log('Technician II program structure, built-course advancement map, remaining gates, and legacy-preservation contract passed.');\n`;
fs.writeFileSync(path.join(root,'scripts/test-tech2-program-structure.mjs'),structureTest);

const test = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));\nconst course=read('content/courses/COURSE-LH-TECH2-003.json');\nconst program=read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');\nconst finalA=read('content/assessments/ASSESS-LH-TECH2-003-FINAL.json');\nconst formA=read('content/assessments/ASSESS-LH-TECH2-003-M01.json');\nconst practical=read('content/performance-assessments/PRACTICAL-TECH2-C-FERTIGATION-ROOTZONE-TROUBLESHOOTING.json');\nassert.equal(course.version,'0.2.0'); assert.equal(course.status,'draft'); assert.equal(course.finalAssessment,finalA.id);\nassert.ok(course.modules.includes('MOD-LH-TECH2-003-FERTIGATION'));\nassert.equal(course.extensions.mappedPractical,practical.id);\nassert.equal(course.extensions.independentRecipeDesignAuthorityConferred,false);\nassert.equal(finalA.items.length,24); assert.equal(formA.items.length,12);\nassert.equal(new Set(finalA.items.filter((id)=>formA.items.includes(id))).size,0);\nfor(const id of [...finalA.items,...formA.items]) assert.equal(id.startsWith('ITEM-TECH2-'),false,'public credential item leaked into course grading: '+id);\nfor(const comp of practical.competencies){assert.ok(course.competencies.includes(comp),'Practical C competency not mapped: '+comp);assert.ok(program.competencies.includes(comp),'Program missing Practical C competency: '+comp);}\nfor(const comp of ['COMP-ROOTZONE-001','COMP-PRO-QA-001']) assert.ok(course.competencies.includes(comp));\nassert.equal(finalA.blueprint.reduce((s,r)=>s+r.items,0),24);\nfor(const itemId of finalA.items){const item=read('content/questions/'+itemId+'.json'); assert.ok(item.references.length>0);}\nconsole.log('Technician II Course 003 instruction, bank isolation, recipe authority, safety boundary and Practical C alignment passed.');\n`;
fs.writeFileSync(path.join(root,'scripts/test-tech2-course3.mjs'),test);

const pkgPath=path.join(root,'package.json');
const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));
pkg.scripts['tech2:course3:test']='node scripts/test-tech2-course3.mjs';
if(!pkg.scripts.test.includes('npm run tech2:course3:test')) pkg.scripts.test=pkg.scripts.test.replace('npm run tech2:course2:test','npm run tech2:course2:test && npm run tech2:course3:test');
fs.writeFileSync(pkgPath,`${JSON.stringify(pkg,null,2)}\n`);

fs.writeFileSync(path.join(root,'docs/academy-v2/TECH2_COURSE003_BUILD_STATUS.md'),`# Technician II Course 003 Build Status\n\n**Course:** Fertigation Execution, Verification & Root-Zone Interpretation  \n**Status:** instruction-assessment draft\n\nDedicated instruction, objectives, formative/summative development banks and Practical C mapping are generated. Public Technician II credential-development items remain isolated from course grading. Human technical/assessment review, accessibility review, Practical C validation, pilot/performance evidence and program release gates remain required.\n`);

console.log('Built Technician II Course 003 instruction and assessment slice.');
