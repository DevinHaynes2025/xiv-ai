// 12D-133 — RELEASE-LINEAGE CONSOLIDATION & VALIDATION LEDGER.
//
// The integration branch has accumulated ~301 open merge requests — many stacked,
// many lacking native CI evidence. A new parallel branch would add validation debt.
// This story is the READ-ONLY release ledger that turns that reality into an
// inventory a human can act on:
//
//   * It inventories the DECLARED open-MR snapshot: per MR — source branch, target
//     branch, exact head SHA, parent MR (stacking), story id, pipeline id, declared
//     CI status, conflict flag, opened-at timestamp. It MODIFIES NOTHING: no close,
//     no merge, no rebase, no retry, no deploy, no branch change, no issue change.
//   * It distinguishes NATIVE_CI_PASSED, LOCAL_ONLY, NOT_EXECUTED, QUOTA_BLOCKED,
//     SUPERSEDED, and CONFLICTED — and it NEVER TRUSTS A PASSED CLAIM: a row
//     classified NATIVE_CI_PASSED must be backed by DECLARED pipeline evidence in
//     the same build; an unbacked (or contradicted) claim is recorded as a
//     FALSE_CI_CLAIM finding and the row is downgraded — the claim never stands.
//   * It identifies duplicate stories (the same story id in several open MRs),
//     abandoned MRs (open beyond the age policy with no CI evidence), divergent
//     lineages (one source branch proposed into different targets), excessively
//     deep stacked lineages, missing parents, SHA drift (the inventory's head SHA
//     disagrees with the declared measured branch heads), lineage cycles, and
//     cross-lineage contamination (one story id spanning distinct lineage trees).
//   * It proposes ONE canonical integration path from the LAST NATIVE-CI-VALIDATED
//     head (parent-chain walk, parent first). With no validated head it refuses to
//     propose (fail closed) — it never invents a starting point.
//   * Issues #98 (CHANGES_REQUIRED) and #99 (DIAGNOSTIC_ONLY) keep their declared
//     dispositions — recorded, never altered.
//   * Output is machine-readable JSON plus a CEO-safe Markdown report: titles are
//     bounded and redacted of secret-shaped content, and no MR description, note,
//     or confidential content ever enters the ledger — the row shape rejects them.
//
// It PERMITS NOTHING: no provider call, no traffic movement, no production
// mutation, no merge, no deployment. The MR snapshot is DECLARED input (the
// operator captures it out-of-band); this module reads and classifies — nothing
// else.

import { redactDeclaredNote } from './declared-evidence-collector';

export const RELEASE_LEDGER_POLICY = Object.freeze({
  /** The one project whose lineage this ledger inventories. */
  gitlabProject: 'xiv-ai-group/xiv-ai-project',
  /** Per-MR classifications, distinguished exactly as the story requires. */
  classifications: Object.freeze([
    'NATIVE_CI_PASSED', 'LOCAL_ONLY', 'NOT_EXECUTED', 'QUOTA_BLOCKED',
    'SUPERSEDED', 'CONFLICTED',
  ]),
  /** What a row may DECLARE about its own CI — PASSED is re-verified, never trusted. */
  declaredCiStatuses: Object.freeze(['NATIVE_CI_PASSED', 'LOCAL_ONLY', 'NOT_EXECUTED', 'QUOTA_BLOCKED']),
  /** Pipeline evidence the operator may declare per pipeline id. */
  pipelineEvidenceStatuses: Object.freeze(['PASSED', 'FAILED', 'QUOTA_BLOCKED', 'NOT_EXECUTED']),
  /** Structural finding kinds the ledger records (it reports reality; it never throws on it). */
  findingKinds: Object.freeze([
    'FALSE_CI_CLAIM', 'SHA_DRIFT', 'MISSING_DECLARED_HEAD', 'MISSING_PARENT',
    'DUPLICATE_STORY', 'SUPERSEDED_BY', 'CROSS_LINEAGE_CONTAMINATION',
    'DIVERGENT_SOURCE', 'EXCESSIVE_STACK_DEPTH', 'ABANDONED', 'NO_NATIVE_CI_HEAD',
  ]),
  maxTitleChars: 200,
  maxBranchChars: 200,
  maxStoryIdChars: 32,
  /** Stacking deeper than this is flagged EXCESSIVE_STACK_DEPTH. */
  maxStackedDepth: 8,
  /** An open MR older than this with no CI evidence is flagged ABANDONED. */
  maxAbandonedAgeMs: 30 * 24 * 3_600_000,
  /** Issue dispositions the CEO fixed — recorded verbatim, never modified. */
  issueDispositions: Object.freeze({
    '98': 'CHANGES_REQUIRED',
    '99': 'DIAGNOSTIC_ONLY',
  }),
});

export const RELEASE_LEDGER_GUARDRAILS = Object.freeze({
  inventoriesAndClassifies_only: true,
  neverClosesMergesRebasesRetriesDeploysOrModifiesBranchesOrIssues: true,
  nativeCiPassedIsNeverTrustedWithoutDeclaredPipelineEvidence: true,
  canonicalPathIsProposedNeverExecuted: true,
  summariesExcludeSecretsAndConfidentialContent: true,
  snapshotInputIsDeclaredNeverFetchedByThisModule: true,
  permitsNoProviderCall: true,
  permitsNoTrafficMovement: true,
  permitsNoProductionMutation: true,
  permitsNoMergeOrDeployment: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export type LedgerClassification =
  | 'NATIVE_CI_PASSED' | 'LOCAL_ONLY' | 'NOT_EXECUTED'
  | 'QUOTA_BLOCKED' | 'SUPERSEDED' | 'CONFLICTED';

export interface DeclaredMergeRequestRow {
  readonly mrIid: number;
  readonly title: string;
  readonly sourceBranch: string;
  readonly targetBranch: string;
  /** Exact head SHA — 40-hex; cross-checked against the declared measured branch heads. */
  readonly headSha: string;
  /** The MR this one is stacked on, or null when it targets the integration branch directly. */
  readonly parentMrIid: number | null;
  /** The story this MR implements, e.g. `12D-221`, or '' when it carries none. */
  readonly storyId: string;
  readonly pipelineId: number | null;
  readonly declaredCiStatus: 'NATIVE_CI_PASSED' | 'LOCAL_ONLY' | 'NOT_EXECUTED' | 'QUOTA_BLOCKED';
  readonly hasConflicts: boolean;
  readonly openedAtMs: number;
}

export interface DeclaredPipelineEvidence {
  readonly pipelineId: number;
  readonly status: 'PASSED' | 'FAILED' | 'QUOTA_BLOCKED' | 'NOT_EXECUTED';
  readonly recordedAtMs: number;
}

export interface LedgerFinding {
  readonly kind: string;
  readonly mrIid: number;
  readonly detail: string;
}

export interface ClassifiedMergeRequest {
  readonly mrIid: number;
  readonly title: string;
  readonly sourceBranch: string;
  readonly targetBranch: string;
  readonly headSha: string;
  readonly parentMrIid: number | null;
  readonly storyId: string;
  readonly classification: LedgerClassification;
  /** Why this classification holds (declared evidence, supersession, conflict, …). */
  readonly basis: string;
}

export interface ReleaseLineageLedger {
  readonly kind: 'RELEASE_LINEAGE_LEDGER';
  readonly gitlabProject: string;
  readonly integrationBranch: string;
  /** The head the path proposal starts from: the last native-CI-validated head's SHA. */
  readonly lastValidatedHeadSha: string;
  readonly generatedAtMs: number;
  readonly rows: readonly ClassifiedMergeRequest[];
  readonly findings: readonly LedgerFinding[];
  /** Parent-first chain from the last native-CI-validated head — PROPOSED, never executed. */
  readonly canonicalPath: readonly number[] | null;
  readonly canonicalPathBasis: string;
  readonly issueDispositions: Readonly<Record<string, string>>;
  readonly guardrails: Readonly<typeof RELEASE_LEDGER_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

const SHA_RE = /^[0-9a-f]{40}$/;
const STORY_RE = /^12D-[0-9]{1,4}$/;
const hasExactKeys = (v: object, keys: readonly string[]): boolean => {
  const actual = new Set(Object.keys(v));
  if (actual.size !== keys.length) return false;
  return keys.every((k) => actual.has(k));
};

const ROW_KEYS = ['mrIid', 'title', 'sourceBranch', 'targetBranch', 'headSha', 'parentMrIid',
  'storyId', 'pipelineId', 'declaredCiStatus', 'hasConflicts', 'openedAtMs'] as const;
const EVIDENCE_KEYS = ['pipelineId', 'status', 'recordedAtMs'] as const;

const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);
const boundedStr = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;

const classifyDeclared = (
  declared: DeclaredMergeRequestRow['declaredCiStatus'],
  evidenceStatus: DeclaredPipelineEvidence['status'] | undefined,
  hasConflicts: boolean,
): { classification: LedgerClassification; basis: string } => {
  if (hasConflicts) return { classification: 'CONFLICTED', basis: 'declared merge conflicts' };
  if (evidenceStatus === 'PASSED') return { classification: 'NATIVE_CI_PASSED', basis: 'declared pipeline evidence: PASSED' };
  if (evidenceStatus === 'QUOTA_BLOCKED') return { classification: 'QUOTA_BLOCKED', basis: 'declared pipeline evidence: QUOTA_BLOCKED' };
  if (evidenceStatus === 'FAILED') return { classification: 'NOT_EXECUTED', basis: 'declared pipeline evidence: FAILED' };
  if (evidenceStatus === 'NOT_EXECUTED') return { classification: 'NOT_EXECUTED', basis: 'declared pipeline evidence: NOT_EXECUTED' };
  // No pipeline evidence: only a declaration of ABSENCE (LOCAL_ONLY / NOT_EXECUTED /
  // QUOTA_BLOCKED) is taken verbatim. A NATIVE_CI_PASSED claim with no backing
  // evidence never survives intake — it is caught upstream as FALSE_CI_CLAIM and
  // downgraded to NOT_EXECUTED before reaching here.
  return { classification: declared, basis: `declared CI status (no pipeline evidence recorded): ${declared}` };
};

/** Builds the read-only release-lineage ledger from a DECLARED open-MR snapshot. */
export const buildReleaseLedger = (input: {
  integrationBranch: string;
  /** The integration head the path must start from when NO open MR is CI-validated. */
  lastValidatedHeadSha: string;
  /** Declared measured heads (e.g. via `git ls-remote <gitlab>` out-of-band): branch → 40-hex. */
  measuredBranchHeads: Readonly<Record<string, string>>;
  pipelineEvidence: readonly DeclaredPipelineEvidence[];
  rows: readonly DeclaredMergeRequestRow[];
  generatedAtMs: number;
}): Readonly<ReleaseLineageLedger> => {
  if (!input || typeof input !== 'object')
    throw new Error('ledger input required; fail closed');
  if (!boundedStr(input.integrationBranch, RELEASE_LEDGER_POLICY.maxBranchChars))
    throw new Error('integration branch invalid; fail closed');
  if (typeof input.lastValidatedHeadSha !== 'string' || !SHA_RE.test(input.lastValidatedHeadSha))
    throw new Error('lastValidatedHeadSha must be 40-hex; fail closed');
  if (!safeInt(input.generatedAtMs) || input.generatedAtMs <= 0)
    throw new Error('generatedAtMs invalid; fail closed');
  if (!Array.isArray(input.rows) || input.rows.length === 0)
    throw new Error('open-MR snapshot empty or missing; fail closed');
  if (!Array.isArray(input.pipelineEvidence))
    throw new Error('pipeline evidence feed missing; fail closed');
  if (!input.measuredBranchHeads || typeof input.measuredBranchHeads !== 'object')
    throw new Error('measured branch heads missing; fail closed');

  // ---- row shape gate (exact keys — no descriptions, notes, or confidential
  // content can ever ride into the ledger) ----
  const byIid = new Map<number, DeclaredMergeRequestRow>();
  for (const row of input.rows) {
    if (!row || typeof row !== 'object' || !hasExactKeys(row, ROW_KEYS))
      throw new Error(`MR row shape invalid (exact keys required: ${ROW_KEYS.join(',')}); fail closed`);
    if (!safeInt(row.mrIid) || row.mrIid <= 0)
      throw new Error(`MR row ${String(row.mrIid)}: iid invalid; fail closed`);
    if (byIid.has(row.mrIid))
      throw new Error(`duplicate MR iid ${row.mrIid}; fail closed`);
    if (!boundedStr(row.title, RELEASE_LEDGER_POLICY.maxTitleChars))
      throw new Error(`MR row ${row.mrIid}: title invalid; fail closed`);
    if (!boundedStr(row.sourceBranch, RELEASE_LEDGER_POLICY.maxBranchChars)
      || !boundedStr(row.targetBranch, RELEASE_LEDGER_POLICY.maxBranchChars))
      throw new Error(`MR row ${row.mrIid}: branch invalid; fail closed`);
    if (typeof row.headSha !== 'string' || !SHA_RE.test(row.headSha))
      throw new Error(`MR row ${row.mrIid}: headSha must be 40-hex; fail closed`);
    if (row.parentMrIid !== null && (!safeInt(row.parentMrIid) || row.parentMrIid <= 0))
      throw new Error(`MR row ${row.mrIid}: parentMrIid invalid; fail closed`);
    if (row.parentMrIid === row.mrIid)
      throw new Error(`MR row ${row.mrIid}: an MR cannot be its own parent; fail closed`);
    if (typeof row.storyId !== 'string' || row.storyId.length > RELEASE_LEDGER_POLICY.maxStoryIdChars
      || (row.storyId !== '' && !STORY_RE.test(row.storyId)))
      throw new Error(`MR row ${row.mrIid}: storyId must be '' or 12D-<n>; fail closed`);
    if (row.pipelineId !== null && (!safeInt(row.pipelineId) || row.pipelineId <= 0))
      throw new Error(`MR row ${row.mrIid}: pipelineId invalid; fail closed`);
    if (!RELEASE_LEDGER_POLICY.declaredCiStatuses.includes(row.declaredCiStatus))
      throw new Error(`MR row ${row.mrIid}: declaredCiStatus unknown; fail closed`);
    if (typeof row.hasConflicts !== 'boolean')
      throw new Error(`MR row ${row.mrIid}: hasConflicts must be boolean; fail closed`);
    if (!safeInt(row.openedAtMs) || row.openedAtMs <= 0 || row.openedAtMs > input.generatedAtMs)
      throw new Error(`MR row ${row.mrIid}: openedAtMs invalid or in the future; fail closed`);
    byIid.set(row.mrIid, row);
  }

  // ---- pipeline evidence feed gate ----
  const evidence = new Map<number, DeclaredPipelineEvidence>();
  for (const ev of input.pipelineEvidence) {
    if (!ev || typeof ev !== 'object' || !hasExactKeys(ev, EVIDENCE_KEYS))
      throw new Error('pipeline evidence shape invalid; fail closed');
    if (!safeInt(ev.pipelineId) || ev.pipelineId <= 0)
      throw new Error('pipeline evidence: pipelineId invalid; fail closed');
    if (evidence.has(ev.pipelineId))
      throw new Error(`pipeline evidence duplicated for pipeline ${ev.pipelineId}; fail closed`);
    if (!RELEASE_LEDGER_POLICY.pipelineEvidenceStatuses.includes(ev.status))
      throw new Error(`pipeline evidence ${ev.pipelineId}: status unknown; fail closed`);
    if (!safeInt(ev.recordedAtMs) || ev.recordedAtMs <= 0 || ev.recordedAtMs > input.generatedAtMs)
      throw new Error(`pipeline evidence ${ev.pipelineId}: recordedAtMs invalid or in the future; fail closed`);
    evidence.set(ev.pipelineId, ev);
  }

  const findings: LedgerFinding[] = [];
  const addFinding = (kind: string, mrIid: number, detail: string): void => {
    if (!RELEASE_LEDGER_POLICY.findingKinds.includes(kind))
      throw new Error(`finding kind ${kind} is not a declared kind; fail closed`);
    findings.push({ kind, mrIid, detail });
  };

  // ---- lineage cycle detection over the parent graph (structural: throw) ----
  for (const row of byIid.values()) {
    const seen = new Set<number>([row.mrIid]);
    let cur = row.parentMrIid;
    while (cur !== null) {
      if (seen.has(cur))
        throw new Error(`lineage cycle detected at MR ${row.mrIid} (parent ${cur}); fail closed`);
      seen.add(cur);
      const parent = byIid.get(cur);
      if (!parent) break; // a missing parent is a FINDING below, not a crash
      cur = parent.parentMrIid;
    }
  }

  // ---- missing parents ----
  for (const row of byIid.values()) {
    if (row.parentMrIid !== null && !byIid.has(row.parentMrIid))
      addFinding('MISSING_PARENT', row.mrIid, `parent MR !${row.parentMrIid} is not in the open-MR inventory`);
  }

  // ---- SHA drift against the DECLARED measured branch heads ----
  for (const row of byIid.values()) {
    const measured = input.measuredBranchHeads[row.sourceBranch];
    if (measured === undefined)
      addFinding('MISSING_DECLARED_HEAD', row.mrIid, `source branch ${row.sourceBranch} has no declared measured head`);
    else if (measured !== row.headSha)
      addFinding('SHA_DRIFT', row.mrIid, `inventory head ${row.headSha.slice(0, 12)}… ≠ measured head ${measured.slice(0, 12)}… for ${row.sourceBranch}`);
  }

  // ---- false CI claims (a PASSED claim must be backed by pipeline evidence) ----
  for (const row of byIid.values()) {
    if (row.declaredCiStatus !== 'NATIVE_CI_PASSED') continue;
    const ev = row.pipelineId === null ? undefined : evidence.get(row.pipelineId);
    if (!ev || ev.status !== 'PASSED')
      addFinding('FALSE_CI_CLAIM', row.mrIid, `declared NATIVE_CI_PASSED but ${ev ? `pipeline evidence is ${ev.status}` : 'no pipeline evidence was declared'} — downgraded`);
  }

  // ---- duplicate stories, divergence, cross-lineage contamination ----
  const storyRows = new Map<string, number[]>();
  for (const row of byIid.values()) {
    if (row.storyId === '') continue;
    const list = storyRows.get(row.storyId) ?? [];
    list.push(row.mrIid);
    storyRows.set(row.storyId, list);
  }
  for (const [story, iids] of storyRows) {
    if (iids.length > 1)
      addFinding('DUPLICATE_STORY', iids[0]!, `story ${story} appears in ${iids.length} open MRs (!${iids.join(', !')})`);
  }

  const branchTargets = new Map<string, Set<string>>();
  for (const row of byIid.values()) {
    const set = branchTargets.get(row.sourceBranch) ?? new Set<string>();
    set.add(row.targetBranch);
    branchTargets.set(row.sourceBranch, set);
  }
  for (const [branch, targets] of branchTargets) {
    if (targets.size > 1) {
      const firstRow = [...byIid.values()].find((r) => r.sourceBranch === branch)!;
      addFinding('DIVERGENT_SOURCE', firstRow.mrIid,
        `source branch ${branch} is proposed into ${targets.size} different targets (${[...targets].join(', ')})`);
    }
  }

  // Lineage trees: walk each row to its root; the root MR's iid names the tree.
  const rootOf = (row: DeclaredMergeRequestRow): number => {
    let cur: DeclaredMergeRequestRow = row;
    const seen = new Set<number>([row.mrIid]);
    while (cur.parentMrIid !== null) {
      const parent = byIid.get(cur.parentMrIid);
      if (!parent) return cur.mrIid; // detached subtree roots at itself
      if (seen.has(parent.mrIid)) return cur.mrIid; // cycles were thrown on already
      seen.add(parent.mrIid);
      cur = parent;
    }
    return cur.mrIid;
  };
  const storyRoots = new Map<string, Set<number>>();
  for (const row of byIid.values()) {
    if (row.storyId === '') continue;
    const roots = storyRoots.get(row.storyId) ?? new Set<number>();
    roots.add(rootOf(row));
    storyRoots.set(row.storyId, roots);
  }
  for (const [story, roots] of storyRoots) {
    if (roots.size > 1)
      addFinding('CROSS_LINEAGE_CONTAMINATION', [...roots][0]!, `story ${story} spans ${roots.size} distinct lineage trees`);
  }

  // ---- stack depth ----
  const depthOf = (row: DeclaredMergeRequestRow): number => {
    let depth = 1;
    let cur: DeclaredMergeRequestRow = row;
    const seen = new Set<number>([row.mrIid]);
    while (cur.parentMrIid !== null) {
      const parent = byIid.get(cur.parentMrIid);
      if (!parent) break;
      if (seen.has(parent.mrIid)) break;
      seen.add(parent.mrIid);
      depth += 1;
      cur = parent;
    }
    return depth;
  };

  // ---- supersession (deterministic within a duplicate-story group) ----
  const supersededBy = new Map<number, number>();
  for (const [story, iids] of storyRows) {
    if (iids.length < 2) continue;
    const sorted = iids.map((iid) => byIid.get(iid)!)
      .sort((a, b) => (a.openedAtMs !== b.openedAtMs ? b.openedAtMs - a.openedAtMs : a.mrIid - b.mrIid));
    for (const row of sorted.slice(1)) {
      supersededBy.set(row.mrIid, sorted[0]!.mrIid);
      addFinding('SUPERSEDED_BY', row.mrIid, `story ${story} is carried by MR !${sorted[0]!.mrIid} (newer)`);
    }
  }

  // ---- classification (precedence: SUPERSEDED > declared/evidence/conflict) ----
  const rows: ClassifiedMergeRequest[] = [...byIid.values()].map((row) => {
    const ev = row.pipelineId === null ? undefined : evidence.get(row.pipelineId);
    const depth = depthOf(row);
    if (depth > RELEASE_LEDGER_POLICY.maxStackedDepth)
      addFinding('EXCESSIVE_STACK_DEPTH', row.mrIid, `stacked depth ${depth} exceeds policy ${RELEASE_LEDGER_POLICY.maxStackedDepth}`);
    if (input.generatedAtMs - row.openedAtMs > RELEASE_LEDGER_POLICY.maxAbandonedAgeMs && ev === undefined)
      addFinding('ABANDONED', row.mrIid, `open ${Math.round((input.generatedAtMs - row.openedAtMs) / 86_400_000)} days with no CI evidence`);

    const sup = supersededBy.get(row.mrIid);
    if (sup !== undefined)
      return Object.freeze({ ...row, classification: 'SUPERSEDED' as const, basis: `superseded by MR !${sup}` });
    // A PASSED claim without backing evidence is downgraded to NOT_EXECUTED —
    // the claim never stands.
    const contradicted = row.declaredCiStatus === 'NATIVE_CI_PASSED' && (!ev || ev.status !== 'PASSED');
    const effectiveDeclared = contradicted ? 'NOT_EXECUTED' : row.declaredCiStatus;
    const base = classifyDeclared(effectiveDeclared, ev?.status, row.hasConflicts);
    return Object.freeze({ ...row, ...base });
  });

  // ---- canonical path from the last native-CI-validated head (fail-closed) ----
  const validated = [...byIid.values()].filter((r) => {
    if (r.hasConflicts) return false;
    const ev = r.pipelineId === null ? undefined : evidence.get(r.pipelineId);
    return ev !== undefined && ev.status === 'PASSED';
  });
  validated.sort((a, b) => (a.openedAtMs !== b.openedAtMs ? a.openedAtMs - b.openedAtMs : a.mrIid - b.mrIid));
  const lastValidated = validated.length > 0 ? validated[validated.length - 1] : undefined;

  let canonicalPath: number[] | null = null;
  let canonicalPathBasis: string;
  if (lastValidated) {
    canonicalPath = [];
    const seen = new Set<number>();
    let cur: DeclaredMergeRequestRow | undefined = lastValidated;
    while (cur) {
      if (seen.has(cur.mrIid)) break;
      seen.add(cur.mrIid);
      canonicalPath.push(cur.mrIid);
      cur = cur.parentMrIid === null ? undefined : byIid.get(cur.parentMrIid);
    }
    canonicalPath.reverse();
    const headSupersededBy = supersededBy.get(lastValidated.mrIid);
    canonicalPathBasis = `last native-CI-validated head is MR !${lastValidated.mrIid} (${lastValidated.headSha.slice(0, 12)}…); the proposed path walks its parent chain parent-first`
      + (headSupersededBy !== undefined
        ? ` — CAUTION: this validated head is itself superseded by MR !${headSupersededBy}, which carries NO verified CI evidence; the operator must reconcile before merging`
        : '');
  } else {
    addFinding('NO_NATIVE_CI_HEAD', 0, 'no open MR carries verified PASSED pipeline evidence — no canonical path is proposed');
    canonicalPathBasis = `no open MR is native-CI-validated — the canonical path refuses to start anywhere: the last validated head (${input.lastValidatedHeadSha.slice(0, 12)}…) must be verified out-of-band by the operator (fail closed)`;
  }

  return Object.freeze({
    kind: 'RELEASE_LINEAGE_LEDGER' as const,
    gitlabProject: RELEASE_LEDGER_POLICY.gitlabProject,
    integrationBranch: input.integrationBranch,
    lastValidatedHeadSha: lastValidated ? lastValidated.headSha : input.lastValidatedHeadSha,
    generatedAtMs: input.generatedAtMs,
    rows: Object.freeze(rows),
    findings: Object.freeze([...findings].sort((a, b) =>
      (a.kind !== b.kind ? (a.kind < b.kind ? -1 : 1) : a.mrIid - b.mrIid))),
    canonicalPath: canonicalPath === null ? null : Object.freeze(canonicalPath),
    canonicalPathBasis,
    issueDispositions: RELEASE_LEDGER_POLICY.issueDispositions,
    guardrails: RELEASE_LEDGER_GUARDRAILS,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
};

/** Stable, machine-readable JSON (rows sorted by iid; sanitized titles only). */
export const ledgerToJson = (ledger: Readonly<ReleaseLineageLedger>): string => {
  const doc = {
    kind: ledger.kind,
    gitlabProject: ledger.gitlabProject,
    integrationBranch: ledger.integrationBranch,
    generatedAtMs: ledger.generatedAtMs,
    lastValidatedHeadSha: ledger.lastValidatedHeadSha,
    canonicalPath: ledger.canonicalPath,
    canonicalPathBasis: ledger.canonicalPathBasis,
    issueDispositions: ledger.issueDispositions,
    rows: [...ledger.rows]
      .sort((a, b) => a.mrIid - b.mrIid)
      .map((r) => ({
        mrIid: r.mrIid, storyId: r.storyId, sourceBranch: r.sourceBranch,
        targetBranch: r.targetBranch, headSha: r.headSha, parentMrIid: r.parentMrIid,
        classification: r.classification, basis: r.basis,
      })),
    findings: [...ledger.findings]
      .sort((a, b) => (a.kind !== b.kind ? (a.kind < b.kind ? -1 : 1) : a.mrIid - b.mrIid))
      .map((f) => ({ kind: f.kind, mrIid: f.mrIid, detail: f.detail })),
    guardrails: ledger.guardrails,
    humanDecision: ledger.humanDecision,
    learningPromoted: ledger.learningPromoted,
    modelCalls: ledger.modelCalls,
    remoteCalls: ledger.remoteCalls,
    billionUsersProven: ledger.billionUsersProven,
    automaticRecovery: ledger.automaticRecovery,
  };
  return JSON.stringify(doc, null, 2);
};

/**
 * The CEO-safe Markdown report: titles are bounded and redacted of secret-shaped
 * content; no description, note, or confidential content exists anywhere in the
 * ledger to leak (the row shape rejected it at intake).
 */
export const composeCeoReport = (ledger: Readonly<ReleaseLineageLedger>): string => {
  const lines: string[] = [];
  lines.push('# Release-Lineage Consolidation & Validation Ledger (12D-133)');
  lines.push('');
  lines.push(`Project: \`${ledger.gitlabProject}\` — integration branch \`${ledger.integrationBranch}\`.`);
  lines.push(`Generated at ${new Date(ledger.generatedAtMs).toISOString()} from a DECLARED open-MR snapshot.`);
  lines.push('');
  lines.push('## Canonical integration path (PROPOSED — never executed by this ledger)');
  lines.push('');
  if (ledger.canonicalPath === null) {
    lines.push(`None proposed. ${ledger.canonicalPathBasis}`);
  } else {
    lines.push(`Start from the last native-CI-validated head; merge parent-first: ${ledger.canonicalPath.map((iid) => `!${iid}`).join(' → ')}.`);
  }
  lines.push('');
  lines.push('## Issues (dispositions fixed by the CEO — recorded, never modified)');
  lines.push('');
  for (const [iid, disposition] of Object.entries(ledger.issueDispositions))
    lines.push(`- Issue #${iid}: ${disposition}`);
  lines.push('');
  lines.push('## Classified open merge requests');
  lines.push('');
  lines.push('| MR | story | source → target | head | classification | basis |');
  lines.push('|---|---|---|---|---|---|');
  for (const r of [...ledger.rows].sort((a, b) => a.mrIid - b.mrIid)) {
    const redacted = redactDeclaredNote(r.title).redacted ?? '';
    const shown = redacted.length > 72 ? `${redacted.slice(0, 69)}…` : redacted;
    lines.push(`| !${r.mrIid}${shown ? ` ${shown}` : ''} | ${r.storyId || '—'} | ${r.sourceBranch} → ${r.targetBranch} | \`${r.headSha.slice(0, 12)}…\` | ${r.classification} | ${r.basis} |`);
  }
  lines.push('');
  lines.push('## Findings');
  lines.push('');
  if (ledger.findings.length === 0) lines.push('None.');
  else for (const f of ledger.findings) lines.push(`- ${f.kind} (!${f.mrIid}): ${f.detail}`);
  lines.push('');
  lines.push('## What this ledger did NOT do');
  lines.push('');
  lines.push('It closed nothing, merged nothing, rebased nothing, retried nothing, deployed nothing, and modified no branch and no issue. It reads a declared snapshot and proposes — every action on this list remains a human decision.');
  lines.push('');
  lines.push('Honest flags: humanDecision REQUIRED; learningPromoted false; modelCalls 0; remoteCalls 0; automaticRecovery false; billionUsersProven false.');
  lines.push('');
  return lines.join('\n');
};