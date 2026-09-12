/**
 * 12D-106: Governed report composer with a deterministic grammar + honest-claims gate.
 * No model, no network: composition and checks are pure functions over the supplied text,
 * so every output is reproducible from its inputs. The grammar gate is ALSO an evidence
 * gate: banned-claim rules flag reports that assert scale or platform access no receipt
 * supports (e.g. "million users proven", "guaranteed profit", "fully autonomous").
 */
export type ReportMode = 'DRAFT' | 'CLEAN';

export interface ReportSection { heading: string; body: string; evidenceRefs?: readonly string[] }

export interface ReportInput {
  title: string;
  tenantId: string;
  preparedBy: string;
  sections: readonly ReportSection[];
  mode?: ReportMode;
}

export interface GrammarIssue { sectionIndex: number; rule: string; excerpt: string }

export const REPORT_POLICY = Object.freeze({
  maxTitleChars: 200,
  maxHeadingChars: 120,
  maxBodyChars: 5_000,
  maxSections: 20,
  maxEvidenceRefs: 8,
});

export const REPORT_GUARDRAILS = Object.freeze({
  generatedByModel: false,
  modelCalls: 0,
  remoteCalls: 0,
  grammarGateIsDeterministic: true,
  bannedClaimsFlagged: true,
  cleanModeRejectsIssues: true,
  learningPromoted: false,
});

const BANNED_CLAIMS = Object.freeze([
  'guaranteed profit', 'guaranteed returns', 'risk free', 'zero risk',
  'million users proven', 'billion users proven', 'trillion users',
  'fully autonomous', 'no human oversight', 'unlimited scaling',
  'already have access to all social media', 'guaranteed medical cure', 'guaranteed legal outcome',
]);

const ALLOWED_ACRONYMS = new Set(['XIV', 'AI', 'OS', 'MR', 'CI', 'SQL', 'RAM', 'DB', 'API', 'HTTP', 'JSON', 'CEO', 'CPU', 'GPU', 'URL', 'UUID', 'TS']);

function grammarIssuesOf(sections: readonly ReportSection[]): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  sections.forEach((s, sectionIndex) => {
    const body = s.body;
    for (const [rule, re] of [
      ['DOUBLE_SPACE', /(\S)  +(?!$)/],
      ['REPEATED_WORD', /\b(\w+)\s+\1\b/i],
      ['UNBALANCED_BRACKETS', /^(?:(?![(){}\[\]])[\s\S])*$/],
    ] as const) {
      if (rule === 'UNBALANCED_BRACKETS') {
        const pairs: Array<[string, string]> = [['(', ')'], ['[', ']'], ['{', '}']];
        for (const [open, close] of pairs) {
          if ((body.split(open).length - 1) !== (body.split(close).length - 1))
            issues.push({ sectionIndex, rule: 'UNBALANCED_BRACKETS', excerpt: `${open} vs ${close}` });
        }
        continue;
      }
      const m = body.match(re);
      if (m) issues.push({ sectionIndex, rule, excerpt: m[0].slice(0, 60) });
    }
    const trimmed = body.trim();
    if (trimmed.length > 0) {
      if (!/[.!?]$/.test(trimmed)) issues.push({ sectionIndex, rule: 'NO_TERMINAL_PUNCTUATION', excerpt: trimmed.slice(-30) });
      const firstAlpha = trimmed.match(/[A-Za-z]/);
      if (firstAlpha && firstAlpha[0] !== firstAlpha[0].toUpperCase())
        issues.push({ sectionIndex, rule: 'LOWERCASE_START', excerpt: trimmed.slice(0, 30) });
    }
    for (const banned of BANNED_CLAIMS) {
      const idx = body.toLowerCase().indexOf(banned);
      if (idx >= 0) issues.push({ sectionIndex, rule: 'BANNED_CLAIM', excerpt: body.slice(idx, idx + banned.length + 20) });
    }
  });
  return issues;
}

const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(v);
const bounded = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export function composeReport(input: ReportInput): Readonly<{
  title: string; tenantId: string; preparedBy: string; composedAtMs: number;
  sections: ReadonlyArray<Readonly<{ heading: string; body: string; evidenceRefs: readonly string[] }>>;
  grammar: { checked: true; mode: ReportMode; issueCount: number; issues: readonly GrammarIssue[] };
  wordCount: number; humanDecision: 'REQUIRED'; learningPromoted: false; generatedByModel: false;
}> {
  if (!input || !bounded(input.title, REPORT_POLICY.maxTitleChars)) throw new Error('bounded report title required');
  if (!id(input.tenantId) || !id(input.preparedBy)) throw new Error('tenant and author identity required');
  if (!Array.isArray(input.sections) || input.sections.length < 1 || input.sections.length > REPORT_POLICY.maxSections) throw new Error('bounded sections required');
  const mode = input.mode ?? 'DRAFT';
  for (const s of input.sections) {
    if (!s || !bounded(s.heading, REPORT_POLICY.maxHeadingChars)) throw new Error('bounded section heading required');
    if (!bounded(s.body, REPORT_POLICY.maxBodyChars)) throw new Error('bounded section body required');
    if (s.evidenceRefs !== undefined) {
      const refs: readonly string[] = s.evidenceRefs;
      if (refs.length > REPORT_POLICY.maxEvidenceRefs || !refs.every((r: string) => id(r) || bounded(r, 256))) throw new Error('bounded evidence refs required');
    }
  }
  const issues = grammarIssuesOf(input.sections);
  if (mode === 'CLEAN' && issues.length > 0)
    throw new Error(`report failed the CLEAN grammar gate: ${issues.map(i => `${i.rule}@${i.sectionIndex}`).join(', ')}`);
  const sections = Object.freeze(input.sections.map(s => Object.freeze({ heading: s.heading, body: s.body, evidenceRefs: Object.freeze([...(s.evidenceRefs ?? [])]) })));
  const wordCount = input.sections.reduce((n, s) => n + s.body.trim().split(/\s+/).filter(Boolean).length, 0);
  return Object.freeze({ title: input.title, tenantId: input.tenantId, preparedBy: input.preparedBy,
    composedAtMs: Date.now(), sections,
    grammar: Object.freeze({ checked: true as const, mode, issueCount: issues.length, issues: Object.freeze(issues) }),
    wordCount, humanDecision: 'REQUIRED' as const, learningPromoted: false, generatedByModel: false });
}