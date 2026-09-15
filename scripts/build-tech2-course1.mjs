import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const write = (rel, obj) => {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(obj, null, 2)}\n`);
};

write('content/references/REF-CANNABIS-NPK-RSM-2024-001.json', {
  id: 'REF-CANNABIS-NPK-RSM-2024-001',
  type: 'journal',
  title: 'Mineral nutrition for Cannabis sativa in the vegetative stage using response surface analysis',
  publisher: 'Frontiers in Plant Science',
  authors: ['Patrick Yawo Kpai', 'Oluwafemi Adaramola', 'Philip Wiredu Addo', 'Sarah MacPherson', 'Mark Lefsrud'],
  year: 2024,
  doi: '10.3389/fpls.2024.1501484',
  url: 'https://pubmed.ncbi.nlm.nih.gov/39691480/',
  status: 'reviewed',
  evidenceLevel: 'peer-reviewed',
  notes: 'Cannabis vegetative-stage hydroponic response-surface study showing significant N-P-K interaction effects on multiple growth attributes. Supports multi-factor nutrient reasoning; study-specific concentration optima must not be generalized as universal crop prescriptions.'
});

const objectives = [
  ['LO-LH-TECH2-001-01','COMP-PRO-QA-001','Frame a crop problem by separating direct observations, contextual facts, hypotheses and confirmed causes, and document uncertainty without changing records to fit a preferred explanation.','analyze'],
  ['LO-LH-TECH2-001-02','COMP-ENV-ADV-001','Analyze spatial, temporal and event-linked environmental patterns while verifying whether sensor data are representative and fit for diagnostic decisions.','analyze'],
  ['LO-LH-TECH2-001-03','COMP-ROOTZONE-001','Evaluate root-zone moisture, drainage, EC, pH and root observations as interacting evidence rather than isolated proof of a single cause.','analyze'],
  ['LO-LH-TECH2-001-04','COMP-NUTRIENT-DIAG-001','Build and rank multi-factor nutrient-related differentials using symptom pattern, tissue or formulation context, root-zone evidence and environmental history.','evaluate'],
  ['LO-LH-TECH2-001-05','COMP-IPM-ADV-001','Distinguish pest or disease hypotheses from abiotic look-alikes and select confirmation proportional to the consequence of being wrong.','evaluate'],
  ['LO-LH-TECH2-001-06','COMP-FLOWER-ADV-001','Use developmental and reproductive morphology to distinguish normal stage-related change from abnormal crop symptoms or delayed transition.','analyze'],
  ['LO-LH-TECH2-001-07','COMP-PLANT-BIO-001','Integrate plant pattern, cohort comparison and chronology to choose the next discriminating observation or test and communicate a bounded diagnostic conclusion.','evaluate']
];
for (const [id, competency, statement, bloomLevel] of objectives) write(`content/learning-objectives/${id}.json`, {id, competency, statement, bloomLevel, status:'draft', version:'1.0.0'});

const lessons = [
  {
    id:'LESSON-LH-TECH2-001-01', title:'Diagnostic Problem Framing and Evidence Hierarchy',
    competencies:['COMP-PRO-QA-001','COMP-PLANT-BIO-001'], learningObjectives:['LO-LH-TECH2-001-01','LO-LH-TECH2-001-07'], estimatedMinutes:55,
    references:['REF-NUTRIENT-DEFICIENCY-001','REF-IPM-GREENHOUSE-2024-001'],
    content:{
      overview:'Advanced crop diagnosis begins by defining what is actually known. A symptom, sensor value or worker report is evidence, not automatically a cause. Technician II work should preserve the original observations, build testable hypotheses and state uncertainty explicitly.',
      vocabulary:[
        {term:'Observation',definition:'A directly recorded feature, measurement or event that can be distinguished from its interpretation.'},
        {term:'Hypothesis',definition:'A plausible causal explanation that remains provisional until evidence supports or rejects it.'},
        {term:'Discriminating evidence',definition:'An observation or test whose result meaningfully changes the relative plausibility of competing hypotheses.'}
      ],
      sections:[
        {title:'Separate evidence from interpretation',body:'Record symptoms, distribution, chronology, measurements, crop stage and recent events before writing a causal label. Preserve conflicting evidence rather than editing it away.',references:['REF-NUTRIENT-DEFICIENCY-001']},
        {title:'Rank hypotheses instead of naming one cause too early',body:'Visible crop responses can arise from nutrition, roots, environment, pests, disease or development. Ranking at least several plausible causes reduces premature treatment decisions.',references:['REF-NUTRIENT-DEFICIENCY-001','REF-IPM-GREENHOUSE-2024-001']},
        {title:'Match confirmation effort to consequence',body:'A low-consequence reversible decision may need less confirmation than a diagnosis that would trigger containment, crop destruction, chemical treatment or major equipment changes.',references:['REF-IPM-GREENHOUSE-2024-001']}
      ],
      workedExamples:['Yellowing in one bench is recorded as a pattern first; nutrient deficiency, localized irrigation, root injury and spatial environment remain hypotheses until evidence separates them.','A suspected contagious disease with propagation-source implications requires stronger confirmation than a minor isolated cosmetic symptom.'],
      commonMistakes:['Writing a diagnosis where the record should contain an observation.','Discarding measurements that conflict with the preferred hypothesis.','Changing several major inputs before a diagnostic baseline is captured.'],
      practicalApplication:'Build a four-column workup: observed facts; relevant context; ranked hypotheses; next discriminating evidence. Add an explicit confidence statement and escalation trigger.',
      summary:'Defensible diagnosis preserves evidence, ranks hypotheses and uses targeted confirmation instead of converting the first clue into a cause.'
    }
  },
  {
    id:'LESSON-LH-TECH2-001-02', title:'Spatial, Temporal and Cohort Pattern Analysis',
    competencies:['COMP-ENV-ADV-001','COMP-PLANT-BIO-001','COMP-FLOWER-ADV-001'], learningObjectives:['LO-LH-TECH2-001-02','LO-LH-TECH2-001-06','LO-LH-TECH2-001-07'], estimatedMinutes:55,
    references:['REF-VPD-002','REF-ENV-TEMP-2025-001','REF-FLOWER-MORPH-2023-001'],
    content:{
      overview:'Where and when a problem occurs often discriminates causes better than symptom color alone. Advanced observation compares locations, irrigation zones, cultivars, developmental stages and event timing while checking whether the measurements represent crop conditions.',
      vocabulary:[
        {term:'Cohort',definition:'A comparison group sharing a relevant condition such as cultivar, batch, age, zone or treatment.'},
        {term:'Spatial gradient',definition:'A systematic change in conditions or symptoms across physical positions.'},
        {term:'Chronology',definition:'The ordered sequence of crop observations, measurements and operational events.'}
      ],
      sections:[
        {title:'Map the problem before averaging it away',body:'A room controller can look normal while canopy locations differ. Compare affected and unaffected positions, canopy levels and equipment or irrigation zones.',references:['REF-VPD-002','REF-ENV-TEMP-2025-001']},
        {title:'Use event timing to test causal stories',body:'Relate symptom onset to irrigation changes, environmental excursions, maintenance, transplanting, sanitation events and crop-stage transitions. Temporal association is evidence but not proof.',references:['REF-VPD-002']},
        {title:'Developmental stage is a diagnostic variable',body:'Flowering progression is expressed through morphology and can vary among cultivars. Calendar week alone should not be used to label a biological abnormality.',references:['REF-FLOWER-MORPH-2023-001']}
      ],
      workedExamples:['Symptoms following one irrigation manifold suggest checking that zone before making a room-wide nutrient change.','Two cultivars flipped on the same date may differ in reproductive morphology without either being abnormal.'],
      commonMistakes:['Using only the room average.','Treating correlation in time as proof of cause.','Comparing plants at different developmental stages as if they were identical cohorts.'],
      practicalApplication:'Create a crop map and timeline with affected/unaffected cohorts, canopy position, irrigation zone, stage and recent operational events. Mark which patterns support or weaken each hypothesis.',
      summary:'Spatial, temporal and cohort structure turns scattered observations into diagnostic evidence while exposing false assumptions created by averages or calendar labels.'
    }
  },
  {
    id:'LESSON-LH-TECH2-001-03', title:'Multi-Factor Differential Diagnosis: Nutrition, Root Zone, Environment and Plant Health',
    competencies:['COMP-NUTRIENT-DIAG-001','COMP-ROOTZONE-001','COMP-ENV-ADV-001','COMP-IPM-ADV-001'], learningObjectives:['LO-LH-TECH2-001-02','LO-LH-TECH2-001-03','LO-LH-TECH2-001-04','LO-LH-TECH2-001-05'], estimatedMinutes:70,
    references:['REF-NUTRIENT-DEFICIENCY-001','REF-NUTRITION-001','REF-ROOTZONE-NUTRIENT-002','REF-CANNABIS-NPK-RSM-2024-001','REF-IPM-GREENHOUSE-2024-001'],
    content:{
      overview:'Crop symptoms can be produced by interacting nutritional, root-zone, environmental and biotic mechanisms. Technician II reasoning combines multiple evidence streams, recognizes nutrient interactions and avoids treating EC, tissue values, photographs or pest observations as complete diagnoses by themselves.',
      vocabulary:[
        {term:'Differential diagnosis',definition:'A structured comparison of plausible causes followed by evidence that changes their relative likelihood.'},
        {term:'Interaction effect',definition:'A response in which the effect of one factor depends on the level or state of another factor.'},
        {term:'Root-zone context',definition:'The moisture, aeration, chemical and biological conditions surrounding roots that influence uptake and plant response.'}
      ],
      sections:[
        {title:'Visual symptoms are not one-to-one labels',body:'Cannabis nutrient-deficiency research shows that visible onset and foliar elemental status do not always align simply. Symptom distribution should be combined with tissue, root-zone and production context.',references:['REF-NUTRIENT-DEFICIENCY-001']},
        {title:'Nutrients interact',body:'Cannabis response-surface research identified significant interactions among primary macronutrients for multiple vegetative growth attributes. This supports multi-factor reasoning and cautions against universalizing one-factor recipes from a specific cultivar or system.',references:['REF-CANNABIS-NPK-RSM-2024-001']},
        {title:'EC and root-zone data are clues, not complete causes',body:'EC describes ionic concentration and cannot identify which ions changed. Moisture, drainage, uptake, pH, roots and irrigation history are needed to interpret accumulation or uptake problems.',references:['REF-ROOTZONE-NUTRIENT-002','REF-NUTRITION-001']},
        {title:'Keep biotic and abiotic look-alikes in the same differential',body:'Pests and pathogens can resemble environmental, nutritional or root problems. Confirmation should be proportional to the consequence of acting on the diagnosis.',references:['REF-IPM-GREENHOUSE-2024-001']}
      ],
      workedExamples:['Interveinal chlorosis limited to one wet irrigation zone supports checking root condition, pH/EC and delivery before adding a micronutrient.','A rising root-zone EC with stable input EC prompts a water-balance and accumulation investigation rather than an automatic meter-failure conclusion.'],
      commonMistakes:['Using EC as a direct meter for each nutrient.','Responding to a tissue value without sampling context.','Treating a pest observation elsewhere in the facility as proof of the current symptom cause.'],
      practicalApplication:'For a case with at least three evidence streams, construct a ranked differential that includes nutritional/root-zone, environmental and biotic alternatives. State evidence for, evidence against and the most discriminating next check for each.',
      summary:'Advanced crop diagnosis is a multi-factor evidence problem. Strong decisions triangulate symptom pattern, roots, chemistry, environment, plant health and crop history.'
    }
  },
  {
    id:'LESSON-LH-TECH2-001-04', title:'Confirmation, Next-Test Selection, Escalation and Diagnostic Reporting',
    competencies:['COMP-PRO-QA-001','COMP-IPM-ADV-001','COMP-NUTRIENT-DIAG-001','COMP-ENV-ADV-001','COMP-ROOTZONE-001'], learningObjectives:['LO-LH-TECH2-001-01','LO-LH-TECH2-001-02','LO-LH-TECH2-001-03','LO-LH-TECH2-001-04','LO-LH-TECH2-001-05','LO-LH-TECH2-001-07'], estimatedMinutes:60,
    references:['REF-IPM-GREENHOUSE-2024-001','REF-NUTRIENT-DEFICIENCY-001','REF-VPD-002'],
    content:{
      overview:'The goal of a diagnostic workup is not to sound certain; it is to choose a safe, informative next step and leave a reconstructable record. Technician II should prefer discriminating checks, preserve before/after evidence, change only what is authorized, and escalate when consequence or uncertainty exceeds role limits.',
      vocabulary:[
        {term:'Next-test value',definition:'How much a proposed observation or test is expected to reduce uncertainty between competing explanations.'},
        {term:'Escalation trigger',definition:'A condition requiring a more qualified role, stronger confirmation, containment or formal deviation process.'},
        {term:'Reconstructable record',definition:'Documentation that allows another qualified person to understand what was observed, what evidence was used, what decision was made and what remains unresolved.'}
      ],
      sections:[
        {title:'Choose the test that separates hypotheses',body:'Prefer a check whose possible results would change the ranking of plausible causes. Repeating low-value measurements without a decision purpose adds data without necessarily adding evidence.',references:['REF-NUTRIENT-DEFICIENCY-001']},
        {title:'Verify data quality before high-consequence action',body:'Unexpected sensor or measurement patterns should be checked for representativeness, calibration, sampling method or other data-quality problems before major changes are made.',references:['REF-VPD-002']},
        {title:'Escalate consequence, uncertainty and authority boundaries',body:'Suspected contagious disease, unsafe equipment, regulated treatment decisions, product disposition or unresolved high-impact uncertainty require appropriate escalation rather than independent action.',references:['REF-IPM-GREENHOUSE-2024-001']},
        {title:'Write what the evidence supports',body:'A diagnostic report should distinguish confirmed facts, leading hypotheses, alternative hypotheses, actions taken, response observed and unresolved questions. Never back-edit observations to create a cleaner story.'}
      ],
      workedExamples:['If a single probe drives a major HVAC hypothesis, colocate a verified sensor before recommending a setpoint change.','If disease remains plausible and the consequence of spread is high, containment and qualified confirmation take priority over an unapproved treatment experiment.'],
      commonMistakes:['Choosing the easiest measurement instead of the most discriminating one.','Using certainty language that exceeds the evidence.','Omitting failed hypotheses or unresolved data from the handoff.'],
      practicalApplication:'Complete a supervisor-ready diagnostic report containing problem statement, map/timeline, data-quality checks, ranked hypotheses, next test, authorized action, escalation decision, outcome and unresolved conditions.',
      summary:'A high-quality workup reduces uncertainty safely, respects authority boundaries and leaves evidence another qualified person can audit.'
    }
  }
];
for (const lesson of lessons) write(`content/lessons/${lesson.id}.json`, {version:'1.0.0',status:'draft',assessment:null,...lesson});

write('content/modules/MOD-LH-TECH2-001-DIAGNOSTIC.json', {
  id:'MOD-LH-TECH2-001-DIAGNOSTIC', title:'Integrated Crop Diagnostic Reasoning', version:'1.0.0', status:'draft',
  lessons:lessons.map(x=>x.id),
  competencies:['COMP-ENV-ADV-001','COMP-PLANT-BIO-001','COMP-ROOTZONE-001','COMP-NUTRIENT-DIAG-001','COMP-IPM-ADV-001','COMP-FLOWER-ADV-001','COMP-PRO-QA-001'],
  assessment:'ASSESS-LH-TECH2-001-M01'
});

const makeItem = (id, purpose, spec, index) => {
  const correctPosition = index % 4;
  const choices = [...spec.wrong];
  choices.splice(correctPosition, 0, spec.answer);
  return {
    id, version:1, status:'draft', purpose, competency:spec.competency, objective:spec.objective,
    bloomLevel:spec.bloom ?? 'analyze', difficulty:spec.difficulty ?? 'hard', type:spec.type ?? 'scenario', stem:spec.stem,
    choices, correct:correctPosition, rationale:spec.rationale, references:spec.references
  };
};

const specs = [
  {competency:'COMP-PRO-QA-001',objective:'LO-LH-TECH2-001-01',stem:'A technician sees pale upper leaves and writes “iron deficiency confirmed” before checking any other evidence. What is the best correction to the workup?',answer:'Record the pale upper leaves as an observation and keep iron deficiency as one hypothesis pending discriminating evidence.',wrong:['Immediately increase iron because the symptom name is specific.','Delete older normal observations so the record is consistent.','Treat the feed chart as confirmation of the plant cause.'],rationale:'A visible symptom is evidence, not proof of one cause; the record should preserve observation separately from hypothesis.',references:['REF-NUTRIENT-DEFICIENCY-001']},
  {competency:'COMP-ENV-ADV-001',objective:'LO-LH-TECH2-001-02',stem:'One wall sensor shows normal RH while affected plants cluster inside a dense canopy. Which next step has the highest diagnostic value?',answer:'Map temperature/RH at representative canopy positions and compare affected with unaffected locations.',wrong:['Average the wall reading with yesterday’s room target.','Raise the dehumidifier setpoint immediately.','Assume the affected plants have a nutrient disorder because room RH is normal.'],rationale:'Spatial mapping tests whether the controller reading represents the conditions experienced by affected plants.',references:['REF-VPD-002','REF-ENV-TEMP-2025-001']},
  {competency:'COMP-ROOTZONE-001',objective:'LO-LH-TECH2-001-03',stem:'Root-zone EC is elevated in one irrigation zone while input EC is unchanged. What interpretation is most defensible first?',answer:'Investigate moisture delivery, drainage, water use, pH and root condition before assigning a single cause.',wrong:['The nutrient formulation is definitely too strong for the whole room.','The EC meter is definitely broken.','High EC proves a specific nutrient toxicity.'],rationale:'Root-zone EC is a concentration signal affected by water balance, uptake and accumulation; it does not identify a single cause or ion.',references:['REF-ROOTZONE-NUTRIENT-002','REF-NUTRITION-001']},
  {competency:'COMP-NUTRIENT-DIAG-001',objective:'LO-LH-TECH2-001-04',stem:'A tissue result is outside a published range, but sampled leaf position and crop stage were not recorded. What is the strongest conclusion?',answer:'The result is potentially useful but cannot be interpreted confidently until sampling context and other evidence are resolved.',wrong:['The crop is definitively deficient.','The crop is definitively toxic.','Tissue testing is never useful for cannabis diagnosis.'],rationale:'Tissue interpretation depends on sampling context, stage and comparison with other evidence.',references:['REF-NUTRIENT-DEFICIENCY-001']},
  {competency:'COMP-IPM-ADV-001',objective:'LO-LH-TECH2-001-05',stem:'Wilted plants occur in wet media, and no pest or pathogen sign has been confirmed. Which diagnostic approach is strongest?',answer:'Keep root dysfunction, irrigation, environment and disease in the differential and collect evidence that separates them.',wrong:['Apply a pesticide immediately because wilt can be caused by disease.','Irrigate more because wilt always indicates water shortage.','Rule out disease because media are wet.'],rationale:'Wilt has multiple biotic and abiotic causes; wet media can be consistent with root dysfunction and does not confirm or exclude disease.',references:['REF-IPM-GREENHOUSE-2024-001']},
  {competency:'COMP-FLOWER-ADV-001',objective:'LO-LH-TECH2-001-06',stem:'Two cultivars changed photoperiod on the same date but show different reproductive morphology. What is the best diagnostic interpretation?',answer:'Use each plant’s morphology and crop context; calendar week alone does not prove one cultivar is abnormal.',wrong:['The slower cultivar is nutrient deficient by definition.','Both cultivars must be assigned the same biological stage.','Immediately increase light intensity for the slower cultivar.'],rationale:'Floral progression varies and should be documented with morphology, not calendar time alone.',references:['REF-FLOWER-MORPH-2023-001','REF-LIGHT-001']},
  {competency:'COMP-PLANT-BIO-001',objective:'LO-LH-TECH2-001-07',stem:'A symptom appears only on one cultivar in two rooms but not on other cultivars sharing those rooms. Which observation most changes the next diagnostic step?',answer:'The repeated cultivar association increases the value of comparing genotype/developmental response with shared environmental and root-zone evidence.',wrong:['Room effects are proven irrelevant.','The cultivar is proven genetically defective.','No additional environmental or root-zone data are needed.'],rationale:'A repeated cohort association is useful evidence but does not by itself prove a genetic cause or eliminate shared-system contributors.',references:['REF-FLOWER-MORPH-2023-001','REF-NUTRIENT-DEFICIENCY-001']},
  {competency:'COMP-PRO-QA-001',objective:'LO-LH-TECH2-001-01',stem:'A supervisor asks for the “confirmed cause” while two leading hypotheses remain plausible. What should the technician report?',answer:'State the leading hypotheses, confidence, evidence for and against each, and the next discriminating check.',wrong:['Choose the more familiar diagnosis so the report is decisive.','Call both causes confirmed.','Remove the weaker hypothesis from the record without explanation.'],rationale:'Diagnostic reporting should match certainty to evidence and preserve unresolved alternatives.',references:['REF-IPM-GREENHOUSE-2024-001']},
  {competency:'COMP-ENV-ADV-001',objective:'LO-LH-TECH2-001-02',stem:'A single canopy sensor suddenly differs from two colocated verified sensors after maintenance. What should happen before changing room controls?',answer:'Verify the suspect sensor’s placement, condition and calibration/data quality.',wrong:['Change HVAC settings to match the outlier.','Average all three values and call the issue resolved.','Ignore all sensor data for the rest of the crop cycle.'],rationale:'A conflicting outlier should trigger data-quality verification before high-consequence control changes.',references:['REF-ENV-TEMP-2025-001','REF-VPD-002']},
  {competency:'COMP-ROOTZONE-001',objective:'LO-LH-TECH2-001-03',stem:'Plants in one zone remain wet longer and show slower growth. Which comparison best tests a root-zone hypothesis?',answer:'Compare irrigation delivery, drainage, substrate moisture trend, root observations and matched unaffected plants.',wrong:['Compare only the nutrient label.','Compare only room-average temperature.','Increase irrigation frequency and judge by one hour of response.'],rationale:'Root-zone hypotheses require a system comparison that includes water delivery, media behavior, roots and a relevant control cohort.',references:['REF-NUTRITION-001','REF-ROOTZONE-NUTRIENT-002']},
  {competency:'COMP-NUTRIENT-DIAG-001',objective:'LO-LH-TECH2-001-04',stem:'Why is a one-factor nutrient explanation often weak when several mineral inputs changed together?',answer:'Nutrients can interact, so plant response may depend on combinations rather than one input acting independently.',wrong:['Plants cannot respond to individual nutrients.','All mineral deficiencies have identical symptoms.','EC identifies every ion concentration separately.'],rationale:'Cannabis response-surface work found interaction effects among N, P and K on multiple growth attributes.',references:['REF-CANNABIS-NPK-RSM-2024-001']},
  {competency:'COMP-IPM-ADV-001',objective:'LO-LH-TECH2-001-05',stem:'A suspected contagious disease would trigger containment and major crop decisions if confirmed. What follows from the high consequence of being wrong?',answer:'Use stronger confirmation and appropriate containment/escalation rather than relying on visual similarity alone.',wrong:['Use less evidence because action is urgent.','Treat every similar symptom as the same disease.','Wait for widespread damage before documenting the concern.'],rationale:'Higher-consequence diagnoses warrant stronger confirmation and timely escalation/containment.',references:['REF-IPM-GREENHOUSE-2024-001']},
  {competency:'COMP-FLOWER-ADV-001',objective:'LO-LH-TECH2-001-06',stem:'A flowering crop appears “late” based only on days since the schedule change. Which evidence should be added before calling the delay abnormal?',answer:'Repeatable reproductive morphology plus light/dark history and cultivar context.',wrong:['Only the current nutrient EC.','Only the room label.','Only flower size from one plant.'],rationale:'Biological stage is better supported by morphology and photoperiod history than calendar count alone.',references:['REF-FLOWER-MORPH-2023-001','REF-LIGHT-001']},
  {competency:'COMP-PLANT-BIO-001',objective:'LO-LH-TECH2-001-07',stem:'Which proposed next test is most valuable in a ranked differential?',answer:'A test whose possible outcomes would materially change the ranking of the leading hypotheses.',wrong:['The fastest measurement even if every hypothesis predicts the same result.','A repeat of the same weak observation with no decision rule.','A test chosen only because the equipment is nearby.'],rationale:'Discriminating tests reduce uncertainty by producing outcomes that separate plausible explanations.',references:['REF-NUTRIENT-DEFICIENCY-001','REF-IPM-GREENHOUSE-2024-001']},
  {competency:'COMP-PRO-QA-001',objective:'LO-LH-TECH2-001-01',stem:'During a workup, a new measurement conflicts with the favored diagnosis. What is the correct record action?',answer:'Preserve the conflicting result, verify its quality, and update the hypothesis ranking if warranted.',wrong:['Delete it because it is probably noise.','Change the recorded value to match the trend.','Keep the diagnosis unchanged regardless of verified evidence.'],rationale:'Data integrity requires preserving and evaluating conflicting evidence, not rewriting it to fit a conclusion.',references:['REF-NUTRIENT-DEFICIENCY-001']},
  {competency:'COMP-ENV-ADV-001',objective:'LO-LH-TECH2-001-02',stem:'Symptoms repeatedly intensify after irrigation and ease later, while RH also spikes inside the canopy after irrigation. What does this timing provide?',answer:'Evidence linking the symptom pattern to an irrigation-associated environmental/root-zone event that should be tested against alternatives.',wrong:['Proof that humidity is the sole cause.','Proof that nutrition cannot be involved.','A reason to ignore unaffected canopy locations.'],rationale:'Temporal association can prioritize hypotheses but does not by itself prove a single mechanism.',references:['REF-VPD-002']},
  {competency:'COMP-ROOTZONE-001',objective:'LO-LH-TECH2-001-03',stem:'Why can two root zones with the same measured EC still differ biologically?',answer:'EC does not identify ion composition, moisture distribution, oxygenation, roots or uptake history.',wrong:['EC is unrelated to dissolved ions.','Root conditions never influence nutrient uptake.','Equal EC guarantees equal nutrient composition and root function.'],rationale:'EC is only one chemical concentration signal and must be interpreted with physical and biological root-zone context.',references:['REF-ROOTZONE-NUTRIENT-002']},
  {competency:'COMP-NUTRIENT-DIAG-001',objective:'LO-LH-TECH2-001-04',stem:'A grower wants to copy the exact N-P-K optimum from one published hydroponic study to every cultivar and system. What is the strongest response?',answer:'Use the study as evidence that nutrient levels and interactions matter, but validate rates for the actual cultivar, stage and production system.',wrong:['The published optimum is universal because it is peer reviewed.','Ignore the study completely because it used hydroponics.','Use only phosphorus because interactions make nitrogen and potassium irrelevant.'],rationale:'Study-specific optima are not universal prescriptions; the interaction finding supports multi-factor reasoning within context.',references:['REF-CANNABIS-NPK-RSM-2024-001']},
  {competency:'COMP-IPM-ADV-001',objective:'LO-LH-TECH2-001-05',stem:'White material is observed on leaves, but no diagnostic structures have been confirmed. What is the best next step before a disease-specific response?',answer:'Examine representative material and obtain confirmation appropriate to the risk while keeping non-disease look-alikes plausible.',wrong:['Assume powdery mildew from color alone.','Apply any available fungicide.','Delete environmental data because disease is suspected.'],rationale:'Visual similarity alone can be misleading; confirmation and alternative causes remain important.',references:['REF-IPM-GREENHOUSE-2024-001']},
  {competency:'COMP-FLOWER-ADV-001',objective:'LO-LH-TECH2-001-06',stem:'Unexpected delayed reproductive development is seen across several cultivars in the same room. Which shared factor deserves early verification?',answer:'Photoperiod/light-dark integrity and other shared room conditions.',wrong:['A unique genetic defect in every cultivar.','A different nutrient deficiency in every plant by default.','Calendar labeling only.'],rationale:'A shared multi-cultivar pattern increases the value of checking shared environmental and photoperiod conditions.',references:['REF-LIGHT-001','REF-FLOWER-MORPH-2023-001']},
  {competency:'COMP-PLANT-BIO-001',objective:'LO-LH-TECH2-001-07',stem:'Affected plants are all from one propagation batch while adjacent older plants under the same room conditions are normal. How should this pattern influence the differential?',answer:'Increase attention to batch-specific history, roots, propagation stress or source health while retaining shared-environment alternatives until tested.',wrong:['Prove the room environment is irrelevant.','Prove a pathogen is present.','Justify changing every room setpoint.'],rationale:'Cohort patterns can prioritize batch-specific hypotheses but do not prove a cause or exclude shared factors.',references:['REF-IPM-GREENHOUSE-2024-001','REF-NUTRIENT-DEFICIENCY-001']},
  {competency:'COMP-PRO-QA-001',objective:'LO-LH-TECH2-001-01',stem:'Which supervisor-ready statement best represents bounded diagnostic certainty?',answer:'“Root-zone dysfunction is the leading hypothesis; sensor and irrigation evidence support it, but root inspection and matched-zone comparison are still needed before cause is confirmed.”',wrong:['“Root-zone dysfunction is definitely the cause.”','“Something is wrong; no evidence summary is needed.”','“All possible causes are equally likely forever.”'],rationale:'A useful handoff identifies the leading hypothesis, supporting evidence, uncertainty and next verification.',references:['REF-NUTRIENT-DEFICIENCY-001']},
  {competency:'COMP-ENV-ADV-001',objective:'LO-LH-TECH2-001-02',stem:'A room average looks acceptable but a symptom map follows the perimeter near exterior walls. What is the most useful interpretation?',answer:'The spatial association supports investigating local environmental gradients and perimeter conditions rather than relying on the room average.',wrong:['The room average disproves an environmental role.','The perimeter pattern proves nutrient deficiency.','The symptom map should be discarded because sensors report an average.'],rationale:'Spatial gradients can be hidden by averages and should drive targeted environmental verification.',references:['REF-VPD-002','REF-ENV-TEMP-2025-001']},
  {competency:'COMP-ROOTZONE-001',objective:'LO-LH-TECH2-001-03',stem:'Which action best preserves diagnostic value when testing a root-zone hypothesis?',answer:'Document the baseline and make only an authorized, interpretable change while holding other major variables stable when practical.',wrong:['Change irrigation, nutrients and HVAC simultaneously.','Skip baseline measurements to save time.','Judge success from one plant immediately after the change.'],rationale:'Limiting simultaneous changes and preserving baseline evidence makes response data more interpretable.',references:['REF-NUTRITION-001','REF-ROOTZONE-NUTRIENT-002']},
  {competency:'COMP-NUTRIENT-DIAG-001',objective:'LO-LH-TECH2-001-04',stem:'A feed sheet matches the target recipe, but plants show a pattern consistent with uptake stress. What should the technician conclude?',answer:'Correct formulation does not prove correct uptake; root-zone, water, environment and plant-health evidence still require evaluation.',wrong:['Nutrient causes are impossible.','The recipe must be changed immediately.','The symptom is definitely genetic.'],rationale:'Nutrients may be present while root-zone or environmental conditions limit uptake; diagnosis must include system context.',references:['REF-NUTRITION-001','REF-NUTRIENT-DEFICIENCY-001']},
  {competency:'COMP-IPM-ADV-001',objective:'LO-LH-TECH2-001-05',stem:'A pest is detected on a trap in another zone, while the symptomatic crop has no pest signs. What is the strongest interpretation?',answer:'The detection raises pest plausibility but does not prove it caused the symptomatic crop; inspect and compare evidence in the affected zone.',wrong:['The pest automatically explains all symptoms facility-wide.','Pests can be ruled out because they were not seen on the first plant.','Apply treatment to the symptomatic crop without authorization or confirmation.'],rationale:'Facility detection is relevant context, but diagnosis still requires evidence linking the causal agent to the affected crop.',references:['REF-IPM-GREENHOUSE-2024-001']},
  {competency:'COMP-PLANT-BIO-001',objective:'LO-LH-TECH2-001-07',stem:'After two hypotheses remain equally plausible, which next step is strongest?',answer:'Choose an observation or test expected to produce different predictions under the two hypotheses.',wrong:['Repeat a measurement both hypotheses predict identically.','Pick the hypothesis with the more familiar name.','Change multiple systems and see what happens.'],rationale:'A discriminating test is designed to change the relative support for competing hypotheses.',references:['REF-NUTRIENT-DEFICIENCY-001','REF-IPM-GREENHOUSE-2024-001']}
];

const summativeSpecs = specs.slice(0,24);
const formativeSpecs = specs.slice(24,36);
// Add distinct formative-only variants if the source specification pool is shorter than 36.
while (formativeSpecs.length < 12) {
  const base = specs[formativeSpecs.length % specs.length];
  formativeSpecs.push({...base, stem:`Formative diagnostic check ${formativeSpecs.length + 1}: ${base.stem}`});
}

const summativeIds = [];
for (let i=0;i<24;i++) {
  const id = `ITEM-LH-TECH2-001-${String(i+1).padStart(3,'0')}`;
  summativeIds.push(id); write(`content/questions/${id}.json`, makeItem(id,'summative',summativeSpecs[i],i));
}
const formativeIds = [];
for (let i=0;i<12;i++) {
  const id = `ITEM-LH-TECH2-001-M01-${String(i+1).padStart(3,'0')}`;
  formativeIds.push(id); write(`content/questions/${id}.json`, makeItem(id,'formative',formativeSpecs[i],i));
}

const allCompetencies = ['COMP-ENV-ADV-001','COMP-PLANT-BIO-001','COMP-ROOTZONE-001','COMP-NUTRIENT-DIAG-001','COMP-IPM-ADV-001','COMP-FLOWER-ADV-001','COMP-PRO-QA-001'];
const objectiveIds = objectives.map(x=>x[0]);
write('content/assessments/ASSESS-LH-TECH2-001-M01.json', {
  id:'ASSESS-LH-TECH2-001-M01', title:'Advanced Crop Observation & Diagnostic Reasoning — Formative Check', version:'1.0.0', status:'draft', purpose:'formative',
  competencies:allCompetencies, objectives:objectiveIds, items:formativeIds, passingScorePercent:80, maxAttempts:null, cooldownHours:0,
  feedbackMode:'after-submit', totalItems:12, randomizeItems:true, randomizeChoices:true,
  accommodations:{allowExtendedTime:true,allowAlternativeAccessiblePresentation:true},
  extensions:{courseId:'COURSE-LH-TECH2-001',bankStatus:'development-seed',distinctSummativeBank:true,publicCredentialItemsExcluded:true}
});
write('content/assessments/ASSESS-LH-TECH2-001-FINAL.json', {
  id:'ASSESS-LH-TECH2-001-FINAL', title:'Advanced Crop Observation & Diagnostic Reasoning — Course Assessment', version:'1.0.0', status:'draft', purpose:'summative',
  competencies:allCompetencies, objectives:objectiveIds, items:summativeIds, passingScorePercent:80, maxAttempts:null, cooldownHours:0,
  feedbackMode:'post-attempt-domain-level', totalItems:24, randomizeItems:true, randomizeChoices:true,
  blueprint:[
    {competency:'COMP-PRO-QA-001',items:4,cognitiveTarget:'Problem framing, uncertainty, data integrity and reconstructable reporting'},
    {competency:'COMP-ENV-ADV-001',items:4,cognitiveTarget:'Spatial/temporal patterns and environmental data quality'},
    {competency:'COMP-ROOTZONE-001',items:3,cognitiveTarget:'Root-zone evidence, water balance and EC context'},
    {competency:'COMP-NUTRIENT-DIAG-001',items:4,cognitiveTarget:'Multi-factor nutrition and uptake differential reasoning'},
    {competency:'COMP-IPM-ADV-001',items:3,cognitiveTarget:'Biotic/abiotic look-alikes and consequence-proportional confirmation'},
    {competency:'COMP-FLOWER-ADV-001',items:3,cognitiveTarget:'Developmental morphology and photoperiod as diagnostic context'},
    {competency:'COMP-PLANT-BIO-001',items:3,cognitiveTarget:'Cohort comparison, chronology and discriminating next-test selection'}
  ],
  itemSelection:{minimumActiveItemsPerCompetency:1,targetBankItemsPerCompetency:12,requireReferenceBackedItems:true,requireHumanAssessmentReview:true},
  accommodations:{allowExtendedTime:true,allowAlternativeAccessiblePresentation:true},
  extensions:{courseId:'COURSE-LH-TECH2-001',linkedCredentialPractical:'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP',bankStatus:'development-seed',bankExpansionTarget:48,completionModel:'Course assessment is development evidence only while Course 201 is draft. Credential performance remains separately dependent on Practical A and program-level release gates.',distinctFormativeBank:true,formativeAssessment:'ASSESS-LH-TECH2-001-M01',publicCredentialItemsExcluded:true}
});

const course = read('content/courses/COURSE-LH-TECH2-001.json');
course.version = '0.2.0';
course.modules = ['MOD-PLANT-BIO-001','MOD-ENV-ADV-001','MOD-ROOTZONE-001','MOD-NUTRIENT-DIAG-001','MOD-IPM-ADV-001','MOD-FLOWER-ADV-001','MOD-PRO-QA-001','MOD-LH-TECH2-001-DIAGNOSTIC'];
course.competencies = allCompetencies;
course.finalAssessment = 'ASSESS-LH-TECH2-001-FINAL';
course.learningOutcomes = [
  'Separate direct observation, contextual facts, hypotheses and confirmed causes while preserving conflicting evidence and uncertainty.',
  'Analyze spatial, temporal, cohort, environmental and developmental patterns and verify whether measurements are representative enough for diagnostic decisions.',
  'Build and rank multi-factor differentials across root-zone, nutrition, environment, pest, disease and developmental causes using discriminating evidence.',
  'Select safe next tests and authorized actions, escalate high-consequence or unresolved conditions, and produce a reconstructable supervisor-ready diagnostic workup.'
];
course.assessmentPolicy = 'Course-specific formative and summative items are separate from the public Technician II credential-development bank. Course completion remains draft/development evidence and does not replace Practical A, private operational credential forms, program validation, standard setting or final release approval.';
course.extensions = {...course.extensions,
  maturity:'instruction-assessment-draft', developmentDependencies:course.modules,
  dedicatedCourseAssessmentRequired:false, dedicatedPerformanceValidationRequired:true,
  mappedPractical:'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP',
  dedicatedItemCount:36, formativeItemCount:12, summativeItemCount:24,
  humanTechnicalReviewRequired:true, accessibilityReviewRequired:true,
  publicCredentialItemsAreDevelopmentOnly:true, operationalCredentialBankMustBePrivate:true
};
write('content/courses/COURSE-LH-TECH2-001.json',course);

const program = read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');
for (const comp of allCompetencies) if (!program.competencies.includes(comp)) program.competencies.push(comp);
write('content/credential-programs/CREDPROG-CULT-TECH-II-001.json', program);

const test = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst read = (p) => JSON.parse(fs.readFileSync(p,'utf8'));\nconst course = read('content/courses/COURSE-LH-TECH2-001.json');\nconst program = read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');\nconst finalA = read('content/assessments/ASSESS-LH-TECH2-001-FINAL.json');\nconst formA = read('content/assessments/ASSESS-LH-TECH2-001-M01.json');\nassert.equal(course.version,'0.2.0');\nassert.equal(course.status,'draft');\nassert.equal(course.finalAssessment,finalA.id);\nassert.ok(course.modules.includes('MOD-LH-TECH2-001-DIAGNOSTIC'));\nassert.equal(course.extensions.mappedPractical,'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP');\nassert.equal(course.extensions.dedicatedCourseAssessmentRequired,false);\nassert.equal(course.extensions.dedicatedPerformanceValidationRequired,true);\nassert.equal(finalA.items.length,24);\nassert.equal(formA.items.length,12);\nassert.equal(new Set([...finalA.items,...formA.items]).size,36,'formative and summative banks must not overlap');\nfor (const id of [...finalA.items,...formA.items]) assert.ok(id.startsWith('ITEM-LH-TECH2-001-'),'course assessment must not reuse public ITEM-TECH2 credential-development items');\nconst counts = [0,0,0,0];\nfor (const id of finalA.items) counts[read('content/questions/'+id+'.json').correct]++;\nassert.deepEqual(counts,[6,6,6,6],'summative authored answer positions must be balanced');\nconst fcounts=[0,0,0,0];\nfor (const id of formA.items) fcounts[read('content/questions/'+id+'.json').correct]++;\nassert.deepEqual(fcounts,[3,3,3,3],'formative authored answer positions must be balanced');\nfor (const comp of ['COMP-ENV-ADV-001','COMP-PLANT-BIO-001','COMP-ROOTZONE-001','COMP-NUTRIENT-DIAG-001','COMP-IPM-ADV-001','COMP-FLOWER-ADV-001','COMP-PRO-QA-001']) { assert.ok(course.competencies.includes(comp),comp+' missing from course'); assert.ok(program.competencies.includes(comp),comp+' missing from program'); }\nassert.ok(fs.existsSync('content/references/REF-CANNABIS-NPK-RSM-2024-001.json'));\nconst practical=read('content/performance-assessments/PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP.json');\nfor (const comp of practical.competencies) assert.ok(course.competencies.includes(comp), 'Practical A competency not taught/mapped: '+comp);\nconsole.log('Technician II Course 001 instruction, assessment, bank-isolation and Practical A alignment passed.');\n`;
fs.writeFileSync(path.join(root,'scripts/test-tech2-course1.mjs'),test);

const pkgPath=path.join(root,'package.json');
const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));
pkg.scripts['tech2:course1:test']='node scripts/test-tech2-course1.mjs';
if(!pkg.scripts.test.includes('npm run tech2:course1:test')) pkg.scripts.test=pkg.scripts.test.replace('npm run tech2:program:test','npm run tech2:program:test && npm run tech2:course1:test');
fs.writeFileSync(pkgPath,`${JSON.stringify(pkg,null,2)}\n`);

fs.writeFileSync(path.join(root,'docs/academy-v2/TECH2_COURSE001_BUILD_STATUS.md'),`# Technician II Course 001 Build Status\n\n**Course:** Advanced Crop Observation & Diagnostic Reasoning  \n**Status:** instruction-assessment draft\n\nThis build adds seven dedicated learning objectives, four integrated diagnostic lessons, a dedicated module, a 12-item formative bank and a separate 24-item summative bank. It also aligns the course competency map with Practical A and adds the peer-reviewed 2024 cannabis N-P-K interaction reference.\n\nPublic \`ITEM-TECH2-*\` credential-development items are intentionally excluded from both course assessments. Course 201 remains draft and is not credential evidence until human technical/accessibility review and mapped performance/program validation gates are satisfied.\n`);
console.log('Built Technician II Course 001 instruction and assessment slice.');
