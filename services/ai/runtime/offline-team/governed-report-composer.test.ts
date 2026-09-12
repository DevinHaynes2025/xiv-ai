import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { composeReport, REPORT_GUARDRAILS, REPORT_POLICY } from './governed-report-composer';

const input = (over: Record<string, unknown> = {}) => ({
  title: '12D-103 Operational Drill Report', tenantId: 'xiv-hq', preparedBy: 'claude_code',
  sections: [{ heading: 'Result', body: 'The drill completed with zero anomalies.', evidenceRefs: ['commit:d1ade2ff'] }],
  ...over,
} as Parameters<typeof composeReport>[0]);

test('clean input composes deterministically with honest flags and no issues', () => {
  const r = composeReport(input());
  assert.equal(r.grammar.checked, true);
  assert.equal(r.grammar.issueCount, 0);
  assert.equal(r.wordCount, 6);
  assert.equal(r.generatedByModel, false);
  assert.equal(r.humanDecision, 'REQUIRED');
  assert.equal(r.learningPromoted, false);
  assert.deepEqual([...r.sections[0].evidenceRefs], ['commit:d1ade2ff']);
});

test('grammar rules catch the defects they claim to catch', () => {
  const r = composeReport(input({ sections: [
    { heading: 'A', body: 'the  queue processed  the the stories.' },
    { heading: 'B', body: 'unbalanced (bracket text.' },
    { heading: 'C', body: 'lowercase start without punctuation' },
  ] }));
  const rules = r.grammar.issues.map(i => i.rule).sort();
  assert.ok(rules.includes('DOUBLE_SPACE'));
  assert.ok(rules.includes('REPEATED_WORD'));
  assert.ok(rules.includes('UNBALANCED_BRACKETS'));
  assert.ok(rules.includes('NO_TERMINAL_PUNCTUATION'));
  assert.ok(rules.includes('LOWERCASE_START'));
  assert.equal(r.grammar.issueCount >= 5, true);
});

test('banned scale and access claims are flagged by the evidence gate', () => {
  const r = composeReport(input({ sections: [{ heading: 'Claims', body: 'We have million users proven access. This system is fully autonomous. Done.' }] }));
  const banned = r.grammar.issues.filter(i => i.rule === 'BANNED_CLAIM');
  assert.equal(banned.length, 2);
  assert.equal(r.grammar.issueCount, 2);
});

test('CLEAN mode rejects any issue; DRAFT mode reports it', () => {
  const dirty = input({ sections: [{ heading: 'B', body: 'Double  spaced sentence.' }] });
  const draft = composeReport(dirty);
  assert.equal(draft.grammar.mode, 'DRAFT');
  assert.equal(draft.grammar.issueCount, 1);
  assert.throws(() => composeReport({ ...dirty, mode: 'CLEAN' }), /failed the CLEAN grammar gate/);
  const clean = composeReport(input({ mode: 'CLEAN' }));
  assert.equal(clean.grammar.mode, 'CLEAN');
  assert.equal(clean.grammar.issueCount, 0);
});

test('bounded inputs are enforced', () => {
  assert.throws(() => composeReport(input({ title: '' })), /bounded report title/);
  assert.throws(() => composeReport(input({ title: 'x'.repeat(REPORT_POLICY.maxTitleChars + 1) })), /bounded report title/);
  assert.throws(() => composeReport(input({ tenantId: 'bad tenant!' })), /identity required/);
  assert.throws(() => composeReport(input({ sections: [] })), /bounded sections/);
  assert.throws(() => composeReport(input({ sections: [{ heading: 'ok', body: 'x'.repeat(REPORT_POLICY.maxBodyChars + 1) }] })), /bounded section body/);
  assert.throws(() => composeReport(input({ sections: [{ heading: 'ok', body: 'Fine.', evidenceRefs: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] }] })), /bounded evidence refs/);
});

test('guardrails are frozen and assert the deterministic no-model posture', () => {
  assert.equal(REPORT_GUARDRAILS.generatedByModel, false);
  assert.equal(REPORT_GUARDRAILS.modelCalls, 0);
  assert.equal(REPORT_GUARDRAILS.cleanModeRejectsIssues, true);
  assert.throws(() => { (REPORT_GUARDRAILS as Record<string, unknown>).modelCalls = 1; }, TypeError);
});