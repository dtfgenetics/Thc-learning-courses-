const STATUS_LABELS = {
  'not-recorded': 'Not evaluated',
  'in-progress': 'In progress',
  passed: 'Passed',
  failed: 'Not passed',
  voided: 'Voided'
};

function resultView(rawResult, practical) {
  const result = rawResult && rawResult.assessmentId === practical.id ? rawResult : null;
  return {
    status: result?.status ?? 'not-recorded',
    statusLabel: STATUS_LABELS[result?.status ?? 'not-recorded'] ?? String(result?.status ?? 'not-recorded').replaceAll('-', ' '),
    scorePercent: result?.scorePercent ?? null,
    criticalErrorCount: Number(result?.criticalErrorCount ?? 0),
    evaluatedAt: result?.evaluatedAt ?? null,
    updatedAt: result?.updatedAt ?? null
  };
}

function remediationFor(result) {
  if (result.status === 'failed') {
    return {
      required: true,
      message: 'Review the weak performance areas with the Course 1 workbook, field references, and instructor remediation materials before an equivalent practical reassessment. A failed practical is not corrected by repeating the same scenario from memory.'
    };
  }
  if (result.status === 'voided') {
    return {
      required: true,
      message: 'The recorded practical was voided. Confirm the reason and next authorized assessment step with the instructor or assessor before another evaluated attempt.'
    };
  }
  return { required: false, message: null };
}

export function coursePracticalLearnerView(course, practical, rawResult = null) {
  if (!course?.id || !practical?.id) throw new Error('course and practical required');
  const workflow = practical.extensions?.learnerWorkflow ?? {};
  const operationalBlocked = practical.extensions?.operationalUseBlockedUntilCalibration === true;
  const result = resultView(rawResult, practical);
  const remediation = remediationFor(result);

  return {
    course: { id: course.id, title: course.title, version: course.version },
    practical: {
      id: practical.id,
      title: practical.title,
      version: practical.version,
      purpose: practical.purpose,
      assessmentType: practical.assessmentType,
      deliveryModes: [...(practical.deliveryModes ?? [])],
      evidenceOutputs: [...(practical.evidenceOutputs ?? [])],
      scoring: {
        totalPoints: Number(practical.scoring?.totalPoints ?? 0),
        domains: (practical.scoring?.domains ?? []).map((row) => ({ name: row.name, points: Number(row.points) }))
      },
      passingStandard: {
        minimumPercent: Number(practical.passingStandard?.minimumPercent ?? 0),
        noCriticalErrors: practical.passingStandard?.noCriticalErrors === true
      },
      criticalErrors: [...(practical.criticalErrors ?? [])],
      preparationSteps: [...(workflow.preparationSteps ?? [])],
      stages: (workflow.stages ?? []).map((row) => ({ title: row.title, summary: row.summary })),
      learnerGuide: workflow.learnerGuide ?? null,
      supportResources: [...(workflow.supportResources ?? [])]
    },
    availability: {
      preparationAvailable: true,
      officialEvaluationAvailable: !operationalBlocked && ['approved', 'published'].includes(practical.status),
      status: operationalBlocked ? 'calibration-blocked' : ['approved', 'published'].includes(practical.status) ? 'operational' : 'development',
      message: operationalBlocked
        ? 'Learner preparation is available, but official operational scoring remains blocked until assessor calibration and approval are complete.'
        : ['approved', 'published'].includes(practical.status)
          ? 'This practical is available for authorized supervised evaluation.'
          : 'Learner preparation is available while the practical remains in development.'
    },
    result,
    remediation,
    boundary: 'This is Course 1 practical evidence. It is separate from the restricted Technician I certification examination and does not by itself issue or authorize a professional credential.'
  };
}
