import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const write = (rel, obj) => {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(obj, null, 2)}\n`);
};

const courseId = 'COURSE-LH-TECH2-005';
const practicalId = 'PRACTICAL-TECH2-E-PROPAGATION-CANOPY-PERFORMANCE-REVIEW';

const objectives = [
  ['LO-LH-TECH2-005-01','COMP-PROP-001','Calculate and compare propagation performance by donor, batch, operator, media, environment and time while preserving denominators, losses and traceable identities.','analyze'],
  ['LO-LH-TECH2-005-02','COMP-PROP-001','Build a propagation-underperformance differential that separates donor condition, sanitation, environment, handling, rooting timing and genotype-related hypotheses and selects the next discriminating verification step.','evaluate'],
  ['LO-LH-TECH2-005-03','COMP-CANOPY-ADV-001','Interpret advanced canopy work orders and evaluate spatial uniformity, recovery and crop response using mapped plant, light, architecture and outcome evidence rather than technique names alone.','evaluate'],
  ['LO-LH-TECH2-005-04','COMP-FLOWER-ADV-001','Compare flowering-stage and cultivar responses without claiming genotype causation from one observation, and identify evidence needed before changing the controlled work plan.','evaluate'],
  ['LO-LH-TECH2-005-05','COMP-IPM-ADV-001','Integrate sanitation, pest/disease observations, movement history and containment status into propagation and canopy performance review while preserving biosecurity boundaries.','analyze'],
  ['LO-LH-TECH2-005-06','COMP-PRO-QA-001','Produce reconstructable propagation or canopy performance reviews that preserve original production records, distinguish fact from hypothesis, document role limits and create a supervisor-ready handoff.','evaluate']
];
for (const [id, competency, statement, bloomLevel] of objectives) {
  write(`content/learning-objectives/${id}.json`, {id, competency, statement, bloomLevel, status:'draft', version:'1.0.0'});
}

const lessons = [
  {
    id:'LESSON-LH-TECH2-005-01',
    title:'Propagation Performance Measurement, Donor Comparison and Batch Evidence',
    competencies:['COMP-PROP-001','COMP-PRO-QA-001'],
    learningObjectives:['LO-LH-TECH2-005-01','LO-LH-TECH2-005-06'],
    estimatedMinutes:60,
    references:['REF-PROP-001','REF-MHRA-GXP-DATA-INTEGRITY'],
    content:{
      overview:'Technician II propagation troubleshooting begins with comparable performance evidence. Rooting success, losses and time-to-root should be tied to donor identity, batch, operator, media, environment, sanitation events and observation timing. Percentages without denominators or genealogy can hide where the problem actually occurred.',
      vocabulary:[
        {term:'Propagation success rate',definition:'The number of units meeting the defined successful outcome divided by the eligible starting units for the same defined batch and time point.'},
        {term:'Loss distribution',definition:'How failed or removed units are distributed across donors, trays, operators, locations, dates or other traceable groups.'},
        {term:'Donor effect hypothesis',definition:'A testable explanation that source-plant condition may contribute to propagation performance; it is not proof of genetic causation.'}
      ],
      sections:[
        {title:'Keep denominators and time points consistent',body:'A 90% rooting result at day 14 cannot be fairly compared with an 80% result at day 7 without accounting for the observation window and starting denominator. Preserve removed or excluded units and the reason for exclusion.',references:['REF-PROP-001']},
        {title:'Stratify before averaging',body:'Facility-wide averages can hide a weak donor, tray position, operator, media lot or environment zone. Compare traceable groups before deciding the problem is systemic.',references:['REF-PROP-001']},
        {title:'Preserve the original production record',body:'If an entry is later found incorrect, correct it through the controlled process while preserving the original value, reason and attribution. Do not rewrite the batch history to make the analysis cleaner.',references:['REF-MHRA-GXP-DATA-INTEGRITY']}
      ],
      workedExamples:['Two donors average 88% rooting together, but one is 98% and the other is 62%; the combined average hides the actionable pattern.','A tray shows lower success than neighboring trays, but it was scored three days earlier; align the time point before assigning a process cause.'],
      commonMistakes:['Comparing percentages with different denominators.','Averaging donors until a localized pattern disappears.','Removing failed units from the denominator without a controlled reason.','Editing source records after seeing the outcome.'],
      practicalApplication:'Build a propagation performance table by donor/batch with starting count, rooted count, loss count, observation day, operator, media, environment notes and sanitation events, then annotate which comparisons are valid.',
      summary:'Propagation performance review depends on comparable denominators, traceable groups and preserved source records.'
    }
  },
  {
    id:'LESSON-LH-TECH2-005-02',
    title:'Propagation Underperformance Differential and Verification Workflow',
    competencies:['COMP-PROP-001','COMP-IPM-ADV-001','COMP-PRO-QA-001'],
    learningObjectives:['LO-LH-TECH2-005-02','LO-LH-TECH2-005-05','LO-LH-TECH2-005-06'],
    estimatedMinutes:65,
    references:['REF-PROP-001','REF-IPM-001','REF-MHRA-GXP-DATA-INTEGRITY'],
    content:{
      overview:'Poor propagation performance can arise from donor condition, handling, sanitation, media, environment, timing, localized pests or disease, or normal cultivar timing differences. Technician II ranks these explanations with evidence and chooses the next check that can separate them rather than claiming contamination or genotype effects from one pattern.',
      vocabulary:[
        {term:'Differential',definition:'A ranked set of plausible explanations tested against the available evidence.'},
        {term:'Discriminating check',definition:'A targeted observation or measurement whose result changes the ranking of competing explanations.'},
        {term:'Confounder',definition:'A changing factor associated with both the apparent cause and outcome that can distort attribution.'}
      ],
      sections:[
        {title:'Separate pattern from cause',body:'A donor-linked or tray-linked cluster is evidence about where to investigate, not proof that genetics, contamination or one operator caused the outcome.',references:['REF-PROP-001']},
        {title:'Use sanitation and plant-health history as evidence',body:'Review donor observations, tool and surface sanitation records, pest/disease scouting, movement history and any quarantine status before ruling plant-health pathways in or out.',references:['REF-IPM-001']},
        {title:'Choose the next check that reduces uncertainty',body:'If environment, handling and donor condition remain plausible, choose a check that differentiates them rather than changing multiple process variables at once.',references:['REF-MHRA-GXP-DATA-INTEGRITY']}
      ],
      workedExamples:['Losses cluster by one propagation zone across multiple donors, making localized environment or handling stronger than a genotype-only explanation.','One cultivar roots more slowly but reaches the same success by the validated later observation point; timing differs, but poor final performance is not established.'],
      commonMistakes:['Calling a problem genetic because one cultivar is involved.','Calling contamination without corroborating observations or tests.','Changing humidity, media and handling simultaneously.','Ignoring donor and sanitation history.'],
      practicalApplication:'Create a propagation differential table with evidence for/against donor, sanitation, environment, handling, media and timing hypotheses, then identify one next discriminating check and the role responsible.',
      summary:'Advanced propagation troubleshooting narrows uncertainty with traceable evidence instead of turning patterns into unsupported causes.'
    }
  },
  {
    id:'LESSON-LH-TECH2-005-03',
    title:'Advanced Canopy Work Orders, Spatial Uniformity and Recovery Evidence',
    competencies:['COMP-CANOPY-ADV-001','COMP-FLOWER-ADV-001','COMP-PRO-QA-001'],
    learningObjectives:['LO-LH-TECH2-005-03','LO-LH-TECH2-005-04','LO-LH-TECH2-005-06'],
    estimatedMinutes:70,
    references:['REF-CANOPY-001','REF-CANOPY-DEFOL-2025-001','REF-FLOWER-001'],
    content:{
      overview:'Advanced canopy work should be judged by controlled work-order intent and measured crop response, not by whether a named technique was performed. Technician II connects canopy height, density, spatial light conditions, recovery, flower position and cultivar/stage context to the actual outcome.',
      vocabulary:[
        {term:'Canopy uniformity',definition:'The degree to which defined architecture or production conditions are consistent across mapped crop positions.'},
        {term:'Recovery assessment',definition:'A planned post-work comparison of plant condition and growth after a canopy intervention.'},
        {term:'Planned versus actual',definition:'A controlled comparison between the authorized work instruction and what was actually completed or observed.'}
      ],
      sections:[
        {title:'Interpret the work order before judging the result',body:'Record target area, crop stage, authorized action, completion extent and exceptions. A technique name alone does not specify intensity, timing or intended outcome.',references:['REF-CANOPY-001']},
        {title:'Map response instead of relying on a center-room impression',body:'Use predefined spatial observations such as canopy height, gaps, density, flower position or light measurements when the question is uniformity. Representative mapped evidence is stronger than one photograph.',references:['REF-CANOPY-001']},
        {title:'Cultivar and stage may modify response without proving genotype causation',body:'Published work shows cultivar- and environment-dependent responses to canopy practices. Compare repeated or replicated evidence before attributing a performance difference to genotype alone.',references:['REF-CANOPY-DEFOL-2025-001','REF-FLOWER-001']}
      ],
      workedExamples:['A room average looks acceptable, but mapped edge positions recover poorly; the spatial pattern requires investigation rather than declaring the whole canopy uniform.','Cultivar A appears slower to recover than cultivar B in one room, but the groups also differed in stage and starting canopy density; genotype remains only one hypothesis.'],
      commonMistakes:['Judging success from the technique name.','Using one center-room photo as a uniformity assessment.','Attributing one observed difference to genotype without controlling context.','Changing the work plan outside assigned authority.'],
      practicalApplication:'Complete a planned-versus-actual canopy review with mapped pre/post observations, crop stage, cultivar, authorized work, exceptions, recovery timing and unresolved factors.',
      summary:'Canopy performance is an evidence question: what was authorized, what occurred, where the response differed and what evidence explains it.'
    }
  },
  {
    id:'LESSON-LH-TECH2-005-04',
    title:'Integrated Propagation/Canopy Review, Biosecurity Boundaries and Supervisor Handoff',
    competencies:['COMP-PROP-001','COMP-CANOPY-ADV-001','COMP-FLOWER-ADV-001','COMP-IPM-ADV-001','COMP-PRO-QA-001'],
    learningObjectives:['LO-LH-TECH2-005-01','LO-LH-TECH2-005-02','LO-LH-TECH2-005-03','LO-LH-TECH2-005-04','LO-LH-TECH2-005-05','LO-LH-TECH2-005-06'],
    estimatedMinutes:65,
    references:['REF-PROP-001','REF-CANOPY-001','REF-FLOWER-001','REF-IPM-001','REF-MHRA-GXP-DATA-INTEGRITY'],
    content:{
      overview:'The Technician II performance review converts production data into a bounded next decision. Strong work preserves sanitation and traceability, separates facts from hypotheses, avoids unauthorized high-risk intervention, and hands off the affected scope, evidence, uncertainty and next verification need to the authorized role.',
      vocabulary:[
        {term:'Affected scope',definition:'The traceable donor, batch, cultivar, zone, work order or time period plausibly involved in the observed deviation.'},
        {term:'Role boundary',definition:'The limit between evidence review or authorized routine action and a decision requiring another qualified role.'},
        {term:'Supervisor handoff',definition:'A reconstructable summary of condition, evidence, action, uncertainty and next decision required.'}
      ],
      sections:[
        {title:'Sanitation and traceability remain active during troubleshooting',body:'Do not move questionable propagation material, share tools across biosecurity boundaries or detach observations from donor/batch identity merely to make review easier.',references:['REF-IPM-001','REF-PROP-001']},
        {title:'Performance evidence does not authorize high-risk intervention',body:'A strong hypothesis may support escalation or an authorized next check; it does not independently authorize a high-risk canopy action, treatment, destruction decision or controlled-program change outside the role.',references:['REF-CANOPY-001']},
        {title:'Preserve contrary evidence',body:'A review should include measurements and observations that disagree with the leading hypothesis. Do not alter original production records to make the final explanation appear more certain.',references:['REF-MHRA-GXP-DATA-INTEGRITY']},
        {title:'Handoff should be decision-ready',body:'State the affected scope, comparable performance metrics, leading and alternative explanations, evidence gaps, biosecurity status, completed authorized actions and the next decision or verification required.',references:['REF-MHRA-GXP-DATA-INTEGRITY']}
      ],
      workedExamples:['A propagation batch remains below target with evidence pointing toward one donor, but sanitation and environment checks are not yet complete; the handoff ranks the donor hypothesis without claiming genotype causation.','A canopy zone shows poor recovery after authorized work; the technician documents mapped response and escalates a proposed high-risk intervention instead of performing it independently.'],
      commonMistakes:['Breaking quarantine to improve access.','Deleting contrary production records.','Converting a hypothesis into a confirmed contamination or genotype claim.','Performing a high-risk intervention because the technician believes it will help.'],
      practicalApplication:'Produce either a Propagation Performance Review or Canopy/Flowering Performance Review with calculations, mapped evidence, differential, role-boundary decision, biosecurity status and supervisor handoff.',
      summary:'Integrated performance review turns production evidence into a clear, traceable, bounded next action without overstating causation or authority.'
    }
  }
];
for (const lesson of lessons) write(`content/lessons/${lesson.id}.json`, {version:'1.0.0',status:'draft',assessment:null,...lesson});

const competencies=['COMP-PROP-001','COMP-CANOPY-ADV-001','COMP-FLOWER-ADV-001','COMP-IPM-ADV-001','COMP-PRO-QA-001'];
const objectiveIds=objectives.map(x=>x[0]);
write('content/modules/MOD-LH-TECH2-005-PERFORMANCE.json',{
  id:'MOD-LH-TECH2-005-PERFORMANCE', title:'Propagation & Canopy Performance Troubleshooting', version:'1.0.0', status:'draft',
  lessons:lessons.map(x=>x.id), competencies, assessment:'ASSESS-LH-TECH2-005-M01'
});

const S=(competency,objective,stem,answer,wrong,references,bloom='analyze',difficulty='hard')=>({competency,objective,stem,answer,wrong,references,bloom,difficulty});
const summative=[
S('COMP-PROP-001','LO-LH-TECH2-005-01','Donor A has 49 rooted of 50 cuttings while Donor B has 31 rooted of 50 at the same validated time point. What is the strongest first interpretation?','Performance differs materially by donor group and the donor-linked pattern should be investigated without yet claiming a genetic cause.',['Average the two donors and report 80% facility performance only.','Donor B is genetically defective.','Remove Donor B losses from the denominator.'],['REF-PROP-001']),
S('COMP-PROP-001','LO-LH-TECH2-005-02','Propagation losses cluster in one zone across several donors. Which hypothesis becomes more important?','A zone-linked environment, handling or sanitation factor because the pattern crosses donor identities.',['A single genotype effect explains every loss.','All donor records should be discarded.','The success denominator should be changed until rates match.'],['REF-PROP-001','REF-IPM-001']),
S('COMP-CANOPY-ADV-001','LO-LH-TECH2-005-03','A canopy review uses only one center-room photograph to claim uniform recovery after work. What evidence would most improve the conclusion?','Repeatable mapped observations across predefined canopy positions linked to the authorized work and recovery timing.',['A second center-room photograph from the same angle.','The name of the training technique alone.','Fixture wattage without spatial crop observations.'],['REF-CANOPY-001']),
S('COMP-FLOWER-ADV-001','LO-LH-TECH2-005-04','One cultivar appears slower to recover after canopy work, but it was at a different flowering stage than the comparison group. What is the best conclusion?','Stage is a confounder, so genotype causation is not established from this comparison.',['The cultivar is proven genetically intolerant.','Recovery timing can be ignored.','The slower group should be removed from the record.'],['REF-FLOWER-001','REF-CANOPY-DEFOL-2025-001']),
S('COMP-IPM-ADV-001','LO-LH-TECH2-005-05','A donor planned for propagation shows new pest-like stippling. What should happen before cuttings are distributed?','Hold or flag the donor material and follow the plant-health/biosecurity escalation process before propagation.',['Take cuttings first so production stays on schedule.','Move the donor into the clean rooting area for observation.','Share tools with healthy donors to compare symptoms.'],['REF-IPM-001','REF-PROP-001']),
S('COMP-PRO-QA-001','LO-LH-TECH2-005-06','A technician later finds that one tray count in the source record was entered incorrectly. What is the correct response?','Use the controlled correction process while preserving the original entry, correction reason and attribution.',['Overwrite the original count with no note.','Delete the entire tray from the analysis.','Change neighboring records so the batch appears consistent.'],['REF-MHRA-GXP-DATA-INTEGRITY']),
S('COMP-PROP-001','LO-LH-TECH2-005-01','Batch X reports 90% rooting at day 14 and Batch Y reports 78% at day 7. Why is a direct performance ranking weak?','The observation time differs, so the outcomes are not yet comparable at the same endpoint.',['The larger percentage always proves the better process.','Only cultivar name matters.','Day of observation never affects propagation performance.'],['REF-PROP-001']),
S('COMP-PROP-001','LO-LH-TECH2-005-02','One cultivar reaches the same final rooting success as others but three days later. What should the technician avoid claiming?','That the cultivar has failed propagation solely because its validated rooting timeline is slower.',['That timing should be documented.','That comparisons should use defined endpoints.','That donor and environment context matter.'],['REF-PROP-001']),
S('COMP-CANOPY-ADV-001','LO-LH-TECH2-005-03','A work order targeted selected dense zones, but the performance review averages the entire room. What is the main analytical weakness?','Room-wide averaging can dilute the response in the actual treated scope.',['The technique name is enough to prove success.','Targeted zones should never be mapped.','Only the highest-performing plants should be reviewed.'],['REF-CANOPY-001']),
S('COMP-FLOWER-ADV-001','LO-LH-TECH2-005-04','Two cultivars differ in flower response, but light exposure and starting canopy density also differ. What is the strongest next step?','Gather comparable spatial and stage-matched evidence before attributing the response to cultivar.',['Declare a genotype effect immediately.','Ignore the environmental differences.','Change the cultivar label in the production record.'],['REF-FLOWER-001','REF-CANOPY-001']),
S('COMP-IPM-ADV-001','LO-LH-TECH2-005-05','A suspect propagation tray must be inspected more closely. Which action best protects biosecurity?','Inspect using the approved quarantine/sanitation workflow or escalate if the needed inspection cannot preserve the boundary.',['Move the tray into a clean room temporarily.','Use the same uncleaned tools on suspect and clean trays.','Release the tray because the cause is not confirmed.'],['REF-IPM-001']),
S('COMP-PRO-QA-001','LO-LH-TECH2-005-06','A leading hypothesis explains most but not all observations. How should the handoff treat the conflicting evidence?','Include it and state the remaining uncertainty instead of deleting or hiding it.',['Remove it because it weakens the conclusion.','Change it to match the leading hypothesis.','Delay the handoff until all uncertainty disappears.'],['REF-MHRA-GXP-DATA-INTEGRITY']),
S('COMP-PROP-001','LO-LH-TECH2-005-01','A propagation report excludes ten failed cuttings because they were discarded before final scoring, without a documented exclusion rule. What is the problem?','The denominator has been changed after the outcome, which can inflate the reported success rate.',['Discarded failures should always be excluded.','Only successful cuttings belong in performance metrics.','The denominator is irrelevant when the numerator is known.'],['REF-PROP-001']),
S('COMP-PROP-001','LO-LH-TECH2-005-02','Losses align with one operator, but that operator also handled the only trays in a warmer zone. What should the technician conclude?','Operator and zone are confounded; more evidence is needed before assigning cause.',['Operator error is proven.','Temperature is proven as the only cause.','Delete the operator field because it is sensitive.'],['REF-PROP-001']),
S('COMP-CANOPY-ADV-001','LO-LH-TECH2-005-03','After canopy work, edge zones show slower recovery than center zones. What is the most useful next review?','Compare mapped pre/post architecture and relevant spatial environment at edge versus center positions.',['Average all zones until the difference disappears.','Repeat the same high-risk work immediately without authorization.','Use only the center-zone photographs.'],['REF-CANOPY-001']),
S('COMP-FLOWER-ADV-001','LO-LH-TECH2-005-04','A canopy practice worked well in one cultivar last cycle. What should govern use on a different cultivar and stage?','The current authorized work plan plus cultivar/stage-specific response evidence, not automatic copying of the prior result.',['The previous cultivar result is universal.','Social-media technique names override the work order.','Flowering stage is irrelevant to canopy response.'],['REF-CANOPY-DEFOL-2025-001','REF-FLOWER-001']),
S('COMP-IPM-ADV-001','LO-LH-TECH2-005-05','Rooting underperformance and new foliar symptoms appear in one donor family. Which evidence is most useful before claiming contamination?','Traceable scouting, sanitation, donor condition and confirmatory observations or tests consistent with the suspected pathway.',['The fact that symptoms look unusual.','One technician opinion without records.','The donor marketing name.'],['REF-IPM-001','REF-PROP-001']),
S('COMP-PRO-QA-001','LO-LH-TECH2-005-06','A proposed corrective action is outside the technician’s assigned authority but the evidence for it is strong. What should the technician do?','Document the evidence and recommendation, then escalate the decision to the authorized role.',['Perform the action because confidence is high.','Hide the recommendation to avoid delay.','Alter the work order locally.'],['REF-MHRA-GXP-DATA-INTEGRITY']),
S('COMP-PROP-001','LO-LH-TECH2-005-01','Facility rooting success is 85%, but one donor/batch combination is 52% while all others exceed 90%. What is the best analytical approach?','Preserve the facility metric but stratify the donor/batch subgroup because the aggregate masks a localized problem.',['Report only 85% and stop investigating.','Remove the 52% group as an outlier automatically.','Average the failed subgroup with the best donor twice.'],['REF-PROP-001']),
S('COMP-PROP-001','LO-LH-TECH2-005-02','A technician suspects handling injury because losses begin after transfer. What next check most directly tests that idea?','Compare handling/transfer records and damage pattern across similarly staged batches with and without the loss pattern.',['Change the nutrient recipe first.','Assume genotype because one cultivar is common.','Delete transfer timestamps.'],['REF-PROP-001']),
S('COMP-CANOPY-ADV-001','LO-LH-TECH2-005-03','The authorized work order called for selective canopy adjustment, but the completion record only says “defoliated.” What is missing for performance review?','Traceable planned-versus-actual scope, intensity/location, timing and post-work observations.',['The technique name is sufficient.','Only the worker name matters.','A room average yield from a different cycle.'],['REF-CANOPY-001']),
S('COMP-FLOWER-ADV-001','LO-LH-TECH2-005-04','Different canopy positions show different flowering response. Which sampling plan is strongest?','Use predefined representative positions and the same observation method across zones and time points.',['Sample only the easiest flower to reach.','Use one previous-cycle photo.','Ignore positional variation and use a room average.'],['REF-FLOWER-001','REF-CANOPY-001']),
S('COMP-IPM-ADV-001','LO-LH-TECH2-005-05','A propagation problem may involve plant-health risk, but no confirmation exists. What wording is defensible?','Describe the observed pattern and plant-health hypothesis, preserve containment, and identify the confirmation needed.',['State contamination is confirmed.','Release material because uncertainty means no risk.','Erase symptom observations until a diagnosis exists.'],['REF-IPM-001']),
S('COMP-PRO-QA-001','LO-LH-TECH2-005-06','What makes a supervisor handoff decision-ready after a propagation/canopy review?','Affected scope, comparable metrics, evidence for and against hypotheses, completed authorized actions, biosecurity status, uncertainty and the next decision required.',['Only the leading diagnosis.','Only the final percentage.','A rewritten record containing only evidence that supports the preferred explanation.'],['REF-MHRA-GXP-DATA-INTEGRITY'])
];

const formative=[
S('COMP-PROP-001','LO-LH-TECH2-005-01','Which propagation metric is most interpretable?','Rooted units divided by the documented eligible starting units at a defined observation time.',['Rooted units with no denominator.','Only the best tray result.','A percentage calculated after failed units are removed without reason.'],['REF-PROP-001'],'apply','moderate'),
S('COMP-PROP-001','LO-LH-TECH2-005-02','A rooting problem follows one bench position across multiple donors. What should rise in the differential?','A location-linked environment, handling or sanitation factor.',['A genotype-only explanation.','A universal nutrient deficiency proven by location.','The idea that records are unnecessary.'],['REF-PROP-001'],'analyze','moderate'),
S('COMP-CANOPY-ADV-001','LO-LH-TECH2-005-03','What evidence best supports canopy uniformity review?','Mapped, repeatable spatial crop observations tied to the work order and recovery timing.',['One center-room image.','The technique name.','Fixture wattage alone.'],['REF-CANOPY-001'],'apply','moderate'),
S('COMP-FLOWER-ADV-001','LO-LH-TECH2-005-04','Why should cultivar response be interpreted with flowering stage?','Stage can change response and confound cultivar comparisons.',['Stage never affects response.','Cultivar labels prove causation.','Stage should be removed from records.'],['REF-FLOWER-001'],'analyze','moderate'),
S('COMP-IPM-ADV-001','LO-LH-TECH2-005-05','A donor is under quarantine. What principle governs troubleshooting?','Collect needed evidence without breaking the quarantine/sanitation boundary.',['Move it into clean production for convenience.','Share tools with clean donors.','Ignore quarantine if symptoms are mild.'],['REF-IPM-001'],'apply','moderate'),
S('COMP-PRO-QA-001','LO-LH-TECH2-005-06','What should happen to evidence that conflicts with the leading hypothesis?','Preserve and discuss it as part of the uncertainty.',['Delete it.','Change it to match the conclusion.','Exclude it without documentation.'],['REF-MHRA-GXP-DATA-INTEGRITY'],'apply','moderate'),
S('COMP-PROP-001','LO-LH-TECH2-005-01','Why stratify propagation results by donor or batch?','To reveal localized performance patterns that an aggregate rate can hide.',['To guarantee a genotype diagnosis.','To remove low-performing groups.','To avoid using denominators.'],['REF-PROP-001'],'analyze','moderate'),
S('COMP-PROP-001','LO-LH-TECH2-005-02','What is a discriminating check?','A check whose result changes the ranking of plausible causes.',['Any additional observation regardless of relevance.','A treatment performed before verification.','A rewritten production record.'],['REF-PROP-001'],'apply','moderate'),
S('COMP-CANOPY-ADV-001','LO-LH-TECH2-005-03','Why record planned-versus-actual canopy work?','Because performance review requires knowing what was authorized and what was actually done.',['Because the technique name is never recorded.','Because all work orders are identical.','Because outcomes can be judged without crop observations.'],['REF-CANOPY-001'],'apply','moderate'),
S('COMP-FLOWER-ADV-001','LO-LH-TECH2-005-04','One cycle shows a cultivar difference. What is the safest interpretation?','Treat genotype as a hypothesis until repeated or better-controlled evidence separates it from stage and environment.',['Declare genotype causation.','Ignore environment.','Alter cultivar identity to match response.'],['REF-FLOWER-001'],'analyze','moderate'),
S('COMP-IPM-ADV-001','LO-LH-TECH2-005-05','What should happen when plant-health risk is plausible but unconfirmed?','Maintain appropriate containment and document the evidence and confirmation needed.',['Declare zero risk.','Release questionable material automatically.','Erase the observations.'],['REF-IPM-001'],'apply','moderate'),
S('COMP-PRO-QA-001','LO-LH-TECH2-005-06','A high-risk intervention is outside assigned authority. What is the correct response?','Escalate with the evidence and recommendation instead of performing it independently.',['Perform it if confidence is high.','Change the work order.','Leave no record of the recommendation.'],['REF-MHRA-GXP-DATA-INTEGRITY'],'apply','moderate')
];

function emitItems(rows, prefix, purpose) {
  return rows.map((q,i)=>{
    const id=`${prefix}${String(i+1).padStart(3,'0')}`;
    const pos=i%4;
    const choices=[...q.wrong];
    choices.splice(pos,0,q.answer);
    write(`content/questions/${id}.json`,{id,version:1,status:'draft',purpose,competency:q.competency,objective:q.objective,bloomLevel:q.bloom,difficulty:q.difficulty,type:'scenario',stem:q.stem,choices,correct:pos,rationale:q.answer,references:q.references});
    return id;
  });
}
const summativeIds=emitItems(summative,'ITEM-LH-TECH2-005-','summative');
const formativeIds=emitItems(formative,'ITEM-LH-TECH2-005-M01-','formative');

const blueprint=[
  {competency:'COMP-PROP-001',items:8,cognitiveTarget:'Propagation performance calculation, stratification and underperformance differential reasoning'},
  {competency:'COMP-CANOPY-ADV-001',items:4,cognitiveTarget:'Canopy work-order interpretation, spatial uniformity and recovery evidence'},
  {competency:'COMP-FLOWER-ADV-001',items:4,cognitiveTarget:'Flowering-stage/cultivar response interpretation without unsupported genotype claims'},
  {competency:'COMP-IPM-ADV-001',items:4,cognitiveTarget:'Plant-health, sanitation, quarantine and biosecurity evidence in performance review'},
  {competency:'COMP-PRO-QA-001',items:4,cognitiveTarget:'Data integrity, role-boundary judgment and reconstructable supervisor handoff'}
];
write('content/assessments/ASSESS-LH-TECH2-005-FINAL.json',{
  id:'ASSESS-LH-TECH2-005-FINAL',title:'Propagation & Canopy Performance Troubleshooting — Course Assessment',version:'1.0.0',status:'draft',purpose:'summative',competencies,objectives:objectiveIds,items:summativeIds,passingScorePercent:80,maxAttempts:null,cooldownHours:0,feedbackMode:'post-attempt-domain-level',totalItems:24,randomizeItems:true,randomizeChoices:true,blueprint,itemSelection:{minimumActiveItemsPerCompetency:1,targetBankItemsPerCompetency:12,requireReferenceBackedItems:true,requireHumanAssessmentReview:true},accommodations:{allowExtendedTime:true,allowAlternativeAccessiblePresentation:true},extensions:{courseId,linkedCredentialPractical:practicalId,bankStatus:'development-seed',bankExpansionTarget:48,distinctFormativeBank:true,formativeAssessment:'ASSESS-LH-TECH2-005-M01',publicCredentialItemsExcluded:true}
});
write('content/assessments/ASSESS-LH-TECH2-005-M01.json',{
  id:'ASSESS-LH-TECH2-005-M01',title:'Propagation & Canopy Performance Troubleshooting — Formative Check',version:'1.0.0',status:'draft',purpose:'formative',competencies,objectives:objectiveIds,items:formativeIds,passingScorePercent:80,maxAttempts:null,cooldownHours:0,feedbackMode:'immediate',totalItems:12,randomizeItems:true,randomizeChoices:true,itemSelection:{minimumActiveItemsPerCompetency:1,targetBankItemsPerCompetency:4,requireReferenceBackedItems:true,requireHumanAssessmentReview:true},accommodations:{allowExtendedTime:true,allowAlternativeAccessiblePresentation:true},extensions:{courseId,distinctFromSummative:true,publicCredentialItemsExcluded:true}
});

const course=read('content/courses/COURSE-LH-TECH2-005.json');
Object.assign(course,{
  title:'Propagation & Canopy Performance Troubleshooting',
  version:'0.2.0',
  description:'Develops propagation performance analysis, donor/batch troubleshooting, advanced canopy and flowering response review, biosecurity-aware evidence interpretation, and supervisor-ready handoff without conferring independent high-risk intervention authority.',
  modules:['MOD-PROP-001','MOD-CANOPY-ADV-001','MOD-FLOWER-ADV-001','MOD-IPM-ADV-001','MOD-PRO-QA-001','MOD-LH-TECH2-005-PERFORMANCE'],
  competencies,
  finalAssessment:'ASSESS-LH-TECH2-005-FINAL',
  learningOutcomes:[
    'Calculate and compare propagation performance using traceable donors, batches, denominators, time points and loss distributions.',
    'Troubleshoot propagation underperformance using donor, sanitation, environment, handling, timing and plant-health evidence without unsupported contamination or genotype claims.',
    'Evaluate canopy and flowering work using planned-versus-actual scope, spatial uniformity, recovery and cultivar/stage context.',
    'Produce a reconstructable performance review and supervisor handoff while maintaining sanitation, traceability, role and authorization boundaries.'
  ]
});
Object.assign(course.extensions,{
  maturity:'instruction-assessment-draft',
  developmentDependencies:['MOD-PROP-001','MOD-CANOPY-ADV-001','MOD-FLOWER-ADV-001','MOD-IPM-ADV-001','MOD-PRO-QA-001'],
  dedicatedCourseAssessmentRequired:false,
  dedicatedPerformanceValidationRequired:true,
  mappedPractical:practicalId,
  independentHighRiskInterventionAuthorityConferred:false,
  architectureCorrection:'Course 205 aligns Technician II curriculum Units 06–07 and Practical E; traceability/metrics/peer-support scope is consolidated into Course 207 / Practical G.'
});
write('content/courses/COURSE-LH-TECH2-005.json',course);

const test=`import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));\nconst c=read('content/courses/COURSE-LH-TECH2-005.json');\nassert.equal(c.title,'Propagation & Canopy Performance Troubleshooting');\nassert.equal(c.finalAssessment,'ASSESS-LH-TECH2-005-FINAL');\nassert.equal(c.extensions.mappedPractical,'${practicalId}');\nassert.equal(c.extensions.independentHighRiskInterventionAuthorityConferred,false);\nfor(const x of ['COMP-PROP-001','COMP-CANOPY-ADV-001','COMP-FLOWER-ADV-001','COMP-IPM-ADV-001','COMP-PRO-QA-001']) assert.ok(c.competencies.includes(x),x);\nconst f=read('content/assessments/ASSESS-LH-TECH2-005-FINAL.json'); const m=read('content/assessments/ASSESS-LH-TECH2-005-M01.json');\nassert.equal(f.items.length,24); assert.equal(m.items.length,12); assert.equal(new Set([...f.items,...m.items]).size,36);\nassert.equal(f.extensions.publicCredentialItemsExcluded,true); assert.ok(f.items.every(x=>x.startsWith('ITEM-LH-TECH2-005-')));\nconsole.log('Technician II Course 005 propagation/canopy performance contract passed.');\n`;
fs.writeFileSync(path.join(root,'scripts/test-tech2-course5.mjs'),test);

const programTest=`import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport path from 'node:path';\nconst read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));\nconst program=read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');\nconst expected=['COURSE-LH-TECH2-001','COURSE-LH-TECH2-002','COURSE-LH-TECH2-003','COURSE-LH-TECH2-004','COURSE-LH-TECH2-005','COURSE-LH-TECH2-006','COURSE-LH-TECH2-007','COURSE-LH-TECH2-008'];\nconst built={\n'COURSE-LH-TECH2-001':{final:'ASSESS-LH-TECH2-001-FINAL',practical:'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP'},\n'COURSE-LH-TECH2-002':{final:'ASSESS-LH-TECH2-002-FINAL',practical:'PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION'},\n'COURSE-LH-TECH2-003':{final:'ASSESS-LH-TECH2-003-FINAL',practical:'PRACTICAL-TECH2-C-FERTIGATION-ROOTZONE-TROUBLESHOOTING'},\n'COURSE-LH-TECH2-004':{final:'ASSESS-LH-TECH2-004-FINAL',practical:'PRACTICAL-TECH2-D-IPM-TREND-TREATMENT-FOLLOWUP'},\n'COURSE-LH-TECH2-005':{final:'ASSESS-LH-TECH2-005-FINAL',practical:'${practicalId}'}\n};\nassert.deepEqual(program.requiredCourses,expected); assert.equal(program.status,'draft'); assert.equal(program.prerequisiteCredentials.includes('CREDPROG-CULT-TECH-I-001'),true); assert.equal(program.assessmentModel.credentialAssessment,'ASSESS-CULT-TECH-II-CREDENTIAL-001'); assert.equal(program.assessmentModel.performanceEvidence.length,7); assert.equal(program.assessmentModel.capstone,'CAPSTONE-TECH2-SENIOR-TECHNICIAN-DIAGNOSTIC-SHIFT');\nfor(const id of expected){const course=read('content/courses/'+id+'.json'); assert.equal(course.status,'draft',id+' must remain draft'); assert.equal(course.credentialBearing,true); assert.equal(course.extensions.credentialPath,program.id); assert.equal(course.extensions.legacySourceCourse,'COURSE-CULT-TECH-II-001'); assert.ok(course.modules.length>0&&course.competencies.length>0); if(built[id]){assert.equal(course.finalAssessment,built[id].final); assert.equal(course.extensions.dedicatedCourseAssessmentRequired,false); assert.equal(course.extensions.dedicatedPerformanceValidationRequired,true); assert.equal(course.extensions.mappedPractical,built[id].practical); assert.ok(fs.existsSync(path.join('content/assessments',course.finalAssessment+'.json')));} else if(id==='COURSE-LH-TECH2-008'){assert.equal(course.finalAssessment,null); assert.equal(course.extensions.dedicatedLabModuleRequired,true); assert.equal(course.extensions.integratedPerformanceValidationRequired,true);} else {assert.equal(course.finalAssessment,null); assert.equal(course.extensions.dedicatedCourseAssessmentRequired,true,id+' must retain build gate');}}\nfor(const id of program.assessmentModel.performanceEvidence) assert.ok(fs.existsSync(path.join('content/performance-assessments',id+'.json')),'missing '+id); assert.ok(fs.existsSync(path.join('content/performance-assessments',program.assessmentModel.capstone+'.json')),'missing capstone'); const legacy=read('content/courses/COURSE-CULT-TECH-II-001.json'); assert.equal(legacy.finalAssessment,'ASSESS-CULT-TECH-II-CREDENTIAL-001'); const exam=read('content/assessments/ASSESS-CULT-TECH-II-CREDENTIAL-001.json'); assert.equal(exam.status,'draft'); assert.equal(exam.purpose,'credential'); assert.equal(exam.items.length,0); console.log('Technician II program structure, five built-course mappings, remaining gates, and legacy boundary passed.');\n`;
fs.writeFileSync(path.join(root,'scripts/test-tech2-program-structure.mjs'),programTest);

const pkg=read('package.json');
pkg.scripts['tech2:course5:test']='node scripts/test-tech2-course5.mjs';
if(!pkg.scripts.test.includes('npm run tech2:course5:test')) pkg.scripts.test=pkg.scripts.test.replace('npm run tech2:course4:test','npm run tech2:course4:test && npm run tech2:course5:test');
write('package.json',pkg);

const milestonePath=path.join(root,'docs/academy-v2/TECH2_PROGRAM_SHELL_INTEGRATION_MILESTONE.md');
let milestone=fs.readFileSync(milestonePath,'utf8');
milestone=milestone.replace('5. `COURSE-LH-TECH2-005` — Production Records, Traceability & Inventory Reconciliation','5. `COURSE-LH-TECH2-005` — Propagation & Canopy Performance Troubleshooting');
milestone=milestone.replace('7. `COURSE-LH-TECH2-007` — Production Metrics, Shift Coordination & Peer Support','7. `COURSE-LH-TECH2-007` — Traceability, Production Metrics, Shift Coordination & Peer Support');
fs.writeFileSync(milestonePath,milestone);

fs.writeFileSync(path.join(root,'docs/academy-v2/TECH2_COURSE005_BUILD_STATUS.md'),`# Technician II Course 005 Build Status\n\nCourse 005 is built as the dedicated propagation/canopy performance course aligned to Technician II Curriculum Map Units 06–07 and Practical E. The previous traceability shell assignment was an architecture mismatch; traceability/metrics/peer-support is consolidated into Course 007 / Practical G.\n\nGenerated: six objectives, four applied lessons, one dedicated module, 12 distinct formative items, 24 summative items, Practical E mapping, and deterministic regression coverage.\n\nStatus remains **draft** pending human technical/assessment review, accessibility review, Practical E validation, pilot/performance evidence, private operational credential forms, standard setting and final release approval.\n`);

console.log('Built Technician II Course 005 propagation and canopy performance slice.');
