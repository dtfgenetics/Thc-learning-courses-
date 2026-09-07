from pathlib import Path

p = Path('apps/api/src/assessment-delivery.mjs')
text = p.read_text()
marker = "export function createAssessmentDeliveryService({ root = process.cwd(), allowDraft = false } = {}) {"
feedback = """export function projectAssessmentFeedback({ assessment, scoredAttempt } = {}) {\n  if (!assessment?.id || scoredAttempt?.status !== 'scored') return {};\n  const feedback = {\n    scorePercent: scoredAttempt.scorePercent,\n    passed: scoredAttempt.passed\n  };\n  if (assessment.feedbackMode === 'post-attempt-domain-level') {\n    feedback.competencies = competencyResults(scoredAttempt);\n  }\n  return feedback;\n}\n\n"""
if 'export function projectAssessmentFeedback' not in text:
    if marker not in text: raise SystemExit('delivery service marker missing')
    text = text.replace(marker, feedback + marker, 1)
old = """      if (attempt.status === 'scored') {\n        view.scorePercent = attempt.scorePercent;\n        view.passed = attempt.passed;\n        view.competencies = competencyResults(attempt);\n      }\n"""
new = "      if (attempt.status === 'scored') Object.assign(view, projectAssessmentFeedback({ assessment, scoredAttempt: attempt }));\n"
if new not in text:
    if old not in text: raise SystemExit('scored projection block missing')
    text = text.replace(old, new, 1)
p.write_text(text)

p = Path('package.json')
text = p.read_text()
anchor = '    "assessment:delivery:test": "node scripts/test-assessment-delivery-service.mjs",\n'
line = '    "assessment:feedback:test": "node scripts/test-assessment-feedback-policy.mjs",\n'
if line not in text:
    if anchor not in text: raise SystemExit('assessment delivery script anchor missing')
    text = text.replace(anchor, anchor + line, 1)
chain = 'npm run assessment:persistence:test && npm run assessment:delivery:test && npm run assessment:competency-version:test'
replacement = 'npm run assessment:persistence:test && npm run assessment:delivery:test && npm run assessment:feedback:test && npm run assessment:competency-version:test'
if replacement not in text:
    if chain not in text: raise SystemExit('test chain anchor missing')
    text = text.replace(chain, replacement, 1)
p.write_text(text)
