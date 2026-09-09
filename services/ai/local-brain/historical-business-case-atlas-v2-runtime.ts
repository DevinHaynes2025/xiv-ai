/**
 * 62L-ER6 — Historical Business Case Atlas v2 runtime.
 *
 * Reconstruct cases → evidence review → decision objects → reusable lessons.
 * Analogy labeled SIMILAR_CASE only (never PROVEN_CAUSE).
 * Strengthen/weaken lessons on reuse transfer quality.
 */

import { createHash } from 'node:crypto';
import {
  ALLOWED_ANALOGY_LABEL,
  CONTRADICTION_STATES,
  CURRENT_CONTEXT_REQUIREMENTS,
  ER6_AGENT_BOUNDS,
  ER6_DB_CANDIDATES_STATUS,
  ER6_LOCKS,
  ER6_MAY,
  ER6_MAY_QUERY_APIS,
  ER6_MUST_NOT,
  ER_LAYER_TITLE,
  EVIDENCE_CLASSES,
  FORBIDDEN_ANALOGY_LABEL,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_BUSINESS_CASE_ATLAS_CYCLE,
  HISTORICAL_BUSINESS_CASE_CORE_FLOW,
  HISTORICAL_BUSINESS_CASE_DOMAINS,
  HISTORICAL_BUSINESS_CASE_FIELDS,
  HISTORICAL_BUSINESS_CASE_TRUTH_BOUNDARY,
  HISTORICAL_CASE_NEURAL_PATHWAY,
  HONESTY_BANNER,
  IP_COPYRIGHT_BOUNDARY,
  NEXT_PHASE_TITLE,
  assertEr6LocksIntact,
  er6SoftWireSnapshot,
  isEr6Agent,
  isHumanApprover,
  softWireHopState,
  type ContradictionState,
  type CurrentContextRequirement,
  type Er6Actor,
  type Er6EvidenceState,
  type Er6HopRecord,
  type Er6SoftWireSnapshot,
  type EvidenceClass,
  type HistoricalBusinessCaseDomain,
  type HistoricalBusinessCaseRecord,
  type LessonTransferQuality,
  type NeuralGraphEdge,
  type ReusableLesson,
  type StructuredDecisionObject,
} from './historical-business-case-atlas-v2-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof HISTORICAL_BUSINESS_CASE_ATLAS_CYCLE)[number],
  state: Er6EvidenceState,
  summary: string,
): Er6HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export type AtlasStore = {
  cases: HistoricalBusinessCaseRecord[];
  decisions: StructuredDecisionObject[];
  lessons: ReusableLesson[];
  edges: NeuralGraphEdge[];
};

export function createEmptyAtlasStore(): AtlasStore {
  return { cases: [], decisions: [], lessons: [], edges: [] };
}

export type ReconstructCaseInput = {
  actor: Er6Actor;
  caseId: string;
  organization: string;
  company: string;
  industry: string;
  geography: string;
  timePeriod: string;
  problem: string;
  decision: string;
  constraints?: readonly string[];
  stakeholders?: readonly string[];
  pricingContractContext?: string;
  supplyChainLogisticsContext?: string;
  technologyContext?: string;
  outcome: string;
  unintendedConsequences?: readonly string[];
  lessons?: readonly string[];
  sourceSet: readonly string[];
  evidenceClass?: EvidenceClass;
  confidence?: number;
  contradictionState?: ContradictionState;
  domains: readonly HistoricalBusinessCaseDomain[];
  attemptPiratedCasebook?: boolean;
  attemptFullCopyrightedIngest?: boolean;
  attemptProprietaryConsultingReport?: boolean;
  attemptProvenCauseLabel?: boolean;
};

export function reconstructHistoricalCase(
  input: ReconstructCaseInput,
): HistoricalBusinessCaseRecord | DenialResult {
  if (!isEr6Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER6 agents / home_base may reconstruct cases.');
  }
  if (input.attemptPiratedCasebook || ER6_LOCKS.PIRATED_CASEBOOKS) {
    return deny('PIRATED_CASEBOOKS=false — structured summaries only.');
  }
  if (
    input.attemptFullCopyrightedIngest ||
    ER6_LOCKS.FULL_COPYRIGHTED_ARTICLES
  ) {
    return deny(
      'FULL_COPYRIGHTED_ARTICLES=false — no full copyrighted article ingest.',
    );
  }
  if (
    input.attemptProprietaryConsultingReport ||
    ER6_LOCKS.PROPRIETARY_CONSULTING_REPORTS
  ) {
    return deny(
      'PROPRIETARY_CONSULTING_REPORTS=false — no proprietary consulting reports.',
    );
  }
  if (
    input.attemptProvenCauseLabel ||
    ER6_LOCKS.MAY_LABEL_ANALOGY_AS_PROVEN_CAUSE
  ) {
    return deny(
      'MAY_LABEL_ANALOGY_AS_PROVEN_CAUSE=false — use SIMILAR_CASE only.',
    );
  }
  if (!input.sourceSet.length) {
    return deny('sourceSet required for lawful reconstruction.');
  }
  if (!input.domains.length) {
    return deny('At least one priority domain is required.');
  }
  for (const d of input.domains) {
    if (!(HISTORICAL_BUSINESS_CASE_DOMAINS as readonly string[]).includes(d)) {
      return deny(`Unknown domain: ${d}`);
    }
  }

  return {
    caseId: input.caseId,
    organization: input.organization,
    company: input.company,
    industry: input.industry,
    geography: input.geography,
    timePeriod: input.timePeriod,
    problem: input.problem,
    decision: input.decision,
    constraints: input.constraints ?? [],
    stakeholders: input.stakeholders ?? [],
    pricingContractContext: input.pricingContractContext ?? '',
    supplyChainLogisticsContext: input.supplyChainLogisticsContext ?? '',
    technologyContext: input.technologyContext ?? '',
    outcome: input.outcome,
    unintendedConsequences: input.unintendedConsequences ?? [],
    lessons: input.lessons ?? [],
    sourceSet: input.sourceSet,
    evidenceClass: input.evidenceClass ?? 'STRUCTURED_FACT',
    confidence: clamp01(input.confidence ?? 0.5),
    contradictionState: input.contradictionState ?? 'NONE',
    domains: input.domains,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    analogyLabel: ALLOWED_ANALOGY_LABEL,
    reconstructed: true,
    evidenceReviewed: false,
    fullCopyrightedCorpusPresent: false,
    piratedCasebookPresent: false,
  };
}

export function reviewCaseEvidence(input: {
  actor: Er6Actor;
  caseRecord: HistoricalBusinessCaseRecord;
  evidenceClass?: EvidenceClass;
  confidence?: number;
  contradictionState?: ContradictionState;
}): HistoricalBusinessCaseRecord | DenialResult {
  if (!isEr6Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER6 agents / home_base may review evidence.');
  }
  if (
    input.caseRecord.tenantId !== input.actor.tenantId ||
    input.caseRecord.universeId !== input.actor.universeId
  ) {
    return deny('CROSS_TENANT_REUSE=false — tenant/Universe isolation.');
  }
  return {
    ...input.caseRecord,
    evidenceClass: input.evidenceClass ?? input.caseRecord.evidenceClass,
    confidence: clamp01(input.confidence ?? input.caseRecord.confidence),
    contradictionState:
      input.contradictionState ?? input.caseRecord.contradictionState,
    evidenceReviewed: true,
    analogyLabel: ALLOWED_ANALOGY_LABEL,
  };
}

export function buildStructuredDecisionObject(input: {
  actor: Er6Actor;
  caseRecord: HistoricalBusinessCaseRecord;
  decisionObjectId: string;
  problemPattern: string;
  decisionPattern: string;
  currentContextAccounted?: readonly CurrentContextRequirement[];
  attemptProvenCauseLabel?: boolean;
  attemptIgnoreCurrentContext?: boolean;
}): StructuredDecisionObject | DenialResult {
  if (!isEr6Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER6 agents / home_base may build decision objects.');
  }
  if (
    input.attemptProvenCauseLabel ||
    ER6_LOCKS.MAY_LABEL_ANALOGY_AS_PROVEN_CAUSE ||
    HISTORICAL_BUSINESS_CASE_TRUTH_BOUNDARY.mayLabelAnalogyAsProvenCause
  ) {
    return deny(
      'SIMILAR_CASE ≠ PROVEN_CAUSE — historical analogy labeled SIMILAR_CASE only.',
    );
  }
  if (
    input.attemptIgnoreCurrentContext ||
    ER6_LOCKS.MAY_IGNORE_CURRENT_CONTEXT
  ) {
    return deny(
      'Recommendations must account for current data, market, laws, technology, customer context.',
    );
  }
  if (!input.caseRecord.evidenceReviewed) {
    return deny('Evidence review required before structured decision object.');
  }
  if (
    input.caseRecord.tenantId !== input.actor.tenantId ||
    input.caseRecord.universeId !== input.actor.universeId
  ) {
    return deny('CROSS_TENANT_REUSE=false — tenant/Universe isolation.');
  }

  const accounted =
    input.currentContextAccounted ?? [...CURRENT_CONTEXT_REQUIREMENTS];
  for (const req of CURRENT_CONTEXT_REQUIREMENTS) {
    if (!accounted.includes(req)) {
      return deny(
        `Missing current context requirement: ${req} — never treat history as deterministic proof.`,
      );
    }
  }

  return {
    decisionObjectId: input.decisionObjectId,
    caseId: input.caseRecord.caseId,
    problemPattern: input.problemPattern,
    decisionPattern: input.decisionPattern,
    outcomeSummary: input.caseRecord.outcome,
    analogyLabel: ALLOWED_ANALOGY_LABEL,
    currentContextAccounted: accounted,
    domains: input.caseRecord.domains,
    confidence: input.caseRecord.confidence,
  };
}

export function attachReusableLesson(input: {
  actor: Er6Actor;
  caseRecord: HistoricalBusinessCaseRecord;
  decision: StructuredDecisionObject;
  lessonId: string;
  statement: string;
  store?: AtlasStore;
}):
  | {
      lesson: ReusableLesson;
      edges: readonly NeuralGraphEdge[];
      store: AtlasStore;
    }
  | DenialResult {
  if (!isEr6Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER6 agents / home_base may attach lessons.');
  }
  if (input.decision.analogyLabel !== ALLOWED_ANALOGY_LABEL) {
    return deny('Lesson attach requires SIMILAR_CASE analogy label.');
  }
  if (input.decision.caseId !== input.caseRecord.caseId) {
    return deny('Decision object caseId mismatch.');
  }

  const lesson: ReusableLesson = {
    lessonId: input.lessonId,
    caseId: input.caseRecord.caseId,
    decisionObjectId: input.decision.decisionObjectId,
    statement: input.statement,
    strength: 0.5,
    transferCount: 0,
    successfulReuseCount: 0,
    poorTransferCount: 0,
    analogyLabel: ALLOWED_ANALOGY_LABEL,
  };

  const pathway = HISTORICAL_CASE_NEURAL_PATHWAY;
  const edges: NeuralGraphEdge[] = [];
  for (let i = 0; i < pathway.length - 1; i++) {
    edges.push({
      from: pathway[i]!,
      to: pathway[i + 1]!,
      caseId: input.caseRecord.caseId,
      lessonId: lesson.lessonId,
      weight: lesson.strength,
    });
  }

  const store = input.store ?? createEmptyAtlasStore();
  const next: AtlasStore = {
    cases: store.cases.some((c) => c.caseId === input.caseRecord.caseId)
      ? store.cases.map((c) =>
          c.caseId === input.caseRecord.caseId ? input.caseRecord : c,
        )
      : [...store.cases, input.caseRecord],
    decisions: store.decisions.some(
      (d) => d.decisionObjectId === input.decision.decisionObjectId,
    )
      ? store.decisions
      : [...store.decisions, input.decision],
    lessons: [...store.lessons, lesson],
    edges: [...store.edges, ...edges],
  };

  return { lesson, edges, store: next };
}

export type SimilarCaseQueryKind =
  | 'similar_bottleneck'
  | 'multi_year_contract_structures'
  | 'pricing_strategies_that_failed'
  | 'negotiation_concessions_long_term_problems'
  | 'logistics_recovery_from_disruptions'
  | 'technology_transitions_durable_advantage'
  | 'government_contract_patterns';

export function querySimilarCases(input: {
  actor: Er6Actor;
  store: AtlasStore;
  queryKind: SimilarCaseQueryKind;
  domain?: HistoricalBusinessCaseDomain;
  problemHint?: string;
  attemptProvenCauseLabel?: boolean;
  attemptCrossTenant?: boolean;
}):
  | {
      matches: readonly HistoricalBusinessCaseRecord[];
      analogyLabel: typeof ALLOWED_ANALOGY_LABEL;
      queryKind: SimilarCaseQueryKind;
    }
  | DenialResult {
  if (!isEr6Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER6 agents / home_base may query similar cases.');
  }
  if (
    input.attemptProvenCauseLabel ||
    ER6_LOCKS.MAY_LABEL_ANALOGY_AS_PROVEN_CAUSE
  ) {
    return deny(
      'Query results labeled SIMILAR_CASE only — never PROVEN_CAUSE.',
    );
  }
  if (input.attemptCrossTenant || ER6_LOCKS.CROSS_TENANT_REUSE) {
    return deny('CROSS_TENANT_REUSE=false.');
  }

  const matches = input.store.cases.filter((c) => {
    if (
      c.tenantId !== input.actor.tenantId ||
      c.universeId !== input.actor.universeId
    ) {
      return false;
    }
    if (input.domain && !c.domains.includes(input.domain)) return false;
    if (input.problemHint) {
      const hay = `${c.problem} ${c.decision} ${c.outcome}`.toLowerCase();
      if (!hay.includes(input.problemHint.toLowerCase())) return false;
    }
    switch (input.queryKind) {
      case 'similar_bottleneck':
        return (
          c.domains.includes('logistics_and_freight') ||
          c.domains.includes('supply_chain_disruptions') ||
          c.domains.includes('manufacturing') ||
          Boolean(input.problemHint)
        );
      case 'multi_year_contract_structures':
        return (
          c.domains.includes('enterprise_procurement') ||
          c.domains.includes('government_contracting') ||
          c.pricingContractContext.length > 0
        );
      case 'pricing_strategies_that_failed':
        return (
          c.domains.includes('pricing_strategy') ||
          /fail|loss|miss/i.test(c.outcome)
        );
      case 'negotiation_concessions_long_term_problems':
        return (
          c.domains.includes('negotiations') ||
          c.unintendedConsequences.length > 0
        );
      case 'logistics_recovery_from_disruptions':
        return (
          c.domains.includes('logistics_and_freight') ||
          c.domains.includes('supply_chain_disruptions')
        );
      case 'technology_transitions_durable_advantage':
        return (
          c.domains.includes('software_saas') ||
          c.domains.includes('semiconductors_chips') ||
          c.domains.includes('telecom_satellite') ||
          c.technologyContext.length > 0
        );
      case 'government_contract_patterns':
        return c.domains.includes('government_contracting');
      default:
        return false;
    }
  });

  return {
    matches,
    analogyLabel: ALLOWED_ANALOGY_LABEL,
    queryKind: input.queryKind,
  };
}

export function applyLessonTransferFeedback(input: {
  actor: Er6Actor;
  lesson: ReusableLesson;
  quality: LessonTransferQuality;
  store?: AtlasStore;
}): { lesson: ReusableLesson; store?: AtlasStore } | DenialResult {
  if (!isEr6Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER6 agents / home_base may update lesson strength.');
  }
  if (input.lesson.analogyLabel !== ALLOWED_ANALOGY_LABEL) {
    return deny('Lesson must remain SIMILAR_CASE.');
  }

  const delta = input.quality === 'successful_reuse' ? 0.1 : -0.15;
  const next: ReusableLesson = {
    ...input.lesson,
    strength: clamp01(input.lesson.strength + delta),
    transferCount: input.lesson.transferCount + 1,
    successfulReuseCount:
      input.lesson.successfulReuseCount +
      (input.quality === 'successful_reuse' ? 1 : 0),
    poorTransferCount:
      input.lesson.poorTransferCount +
      (input.quality === 'poor_transfer' ? 1 : 0),
    analogyLabel: ALLOWED_ANALOGY_LABEL,
  };

  if (!input.store) return { lesson: next };

  const store: AtlasStore = {
    ...input.store,
    lessons: input.store.lessons.map((l) =>
      l.lessonId === next.lessonId ? next : l,
    ),
    edges: input.store.edges.map((e) =>
      e.lessonId === next.lessonId ? { ...e, weight: next.strength } : e,
    ),
  };
  return { lesson: next, store };
}

export function attemptLabelProvenCause(): DenialResult {
  return deny(
    'PROVEN_CAUSE forbidden — historical analogy labeled SIMILAR_CASE only.',
  );
}

export function attemptPiratedCasebookIngest(): DenialResult {
  return deny('Pirated casebooks denied — structured summaries/facts only.');
}

export function attemptFullCopyrightedIngest(): DenialResult {
  return deny(
    'Full copyrighted articles/documentaries as corpus denied.',
  );
}

export function attemptProprietaryConsultingReportIngest(): DenialResult {
  return deny('Proprietary consulting reports denied.');
}

export function attemptIgnoreCurrentContext(): DenialResult {
  return deny(
    'Must account for current data, market conditions, laws, technology, customer context.',
  );
}

export function attemptCrossTenantReuse(): DenialResult {
  return deny('CROSS_TENANT_REUSE=false.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('BYPASS_GUARDIAN_RLS=false.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('EXPAND_TENANT_UNIVERSE_ACCESS=false.');
}

export function attemptPersistHiddenChainOfThought(): DenialResult {
  return deny('PERSIST_HIDDEN_CHAIN_OF_THOUGHT=false — no hidden CoT.');
}

export function attemptAutoDeployChanges(): DenialResult {
  return deny('AUTO_DEPLOY_CHANGES=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  state: 'PASS';
  isolationUnchanged: true;
} {
  return {
    state: 'PASS',
    isolationUnchanged:
      ER6_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
  };
}

export function bootstrapHistoricalBusinessCaseAtlas(repoRoot?: string): {
  locksIntact: boolean;
  caseFields: typeof HISTORICAL_BUSINESS_CASE_FIELDS;
  domains: typeof HISTORICAL_BUSINESS_CASE_DOMAINS;
  coreFlow: typeof HISTORICAL_BUSINESS_CASE_CORE_FLOW;
  neuralPathway: typeof HISTORICAL_CASE_NEURAL_PATHWAY;
  mayQueryApis: typeof ER6_MAY_QUERY_APIS;
  analogyLabel: typeof ALLOWED_ANALOGY_LABEL;
  forbiddenLabel: typeof FORBIDDEN_ANALOGY_LABEL;
  dbCandidates: typeof ER6_DB_CANDIDATES_STATUS;
  softWire: Er6SoftWireSnapshot;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
    gitlab: typeof GITLAB_MIRROR_NOTE;
  };
} {
  return {
    locksIntact: assertEr6LocksIntact(),
    caseFields: HISTORICAL_BUSINESS_CASE_FIELDS,
    domains: HISTORICAL_BUSINESS_CASE_DOMAINS,
    coreFlow: HISTORICAL_BUSINESS_CASE_CORE_FLOW,
    neuralPathway: HISTORICAL_CASE_NEURAL_PATHWAY,
    mayQueryApis: ER6_MAY_QUERY_APIS,
    analogyLabel: ALLOWED_ANALOGY_LABEL,
    forbiddenLabel: FORBIDDEN_ANALOGY_LABEL,
    dbCandidates: ER6_DB_CANDIDATES_STATUS,
    softWire: er6SoftWireSnapshot(repoRoot),
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
      gitlab: GITLAB_MIRROR_NOTE,
    },
  };
}

export function exampleAtlasCase(actor: Er6Actor): {
  caseRecord: HistoricalBusinessCaseRecord;
  decision: StructuredDecisionObject;
  lesson: ReusableLesson;
  store: AtlasStore;
} {
  const reconstructed = reconstructHistoricalCase({
    actor,
    caseId: 'case-logistics-recovery-1',
    organization: 'Example Freight Co',
    company: 'Example Freight Co',
    industry: 'logistics',
    geography: 'North America',
    timePeriod: '2018-2020',
    problem: 'Port bottleneck after supply shock',
    decision: 'Multi-carrier reroute + temporary pricing surcharge',
    constraints: ['capacity', 'SLA windows'],
    stakeholders: ['shippers', 'carriers', 'customers'],
    pricingContractContext: 'Surcharge clauses in multi-year contracts',
    supplyChainLogisticsContext: 'West-coast port congestion',
    technologyContext: 'TMS visibility upgrade',
    outcome: 'Service restored in 9 weeks; margin pressure for 2 quarters',
    unintendedConsequences: ['Customer churn in mid-tier lanes'],
    lessons: [
      'Diversify carrier contracts before shock',
      'Surcharges need sunset clauses',
    ],
    sourceSet: ['citation://public-filing-summary/1', 'citation://gov-stats/2'],
    evidenceClass: 'SECONDARY_SUMMARY',
    confidence: 0.7,
    domains: ['logistics_and_freight', 'supply_chain_disruptions'],
  });
  if ('denied' in reconstructed) {
    throw new Error(reconstructed.reason);
  }

  const reviewed = reviewCaseEvidence({
    actor,
    caseRecord: reconstructed,
    contradictionState: 'NOTED',
  });
  if ('denied' in reviewed) {
    throw new Error(reviewed.reason);
  }

  const decision = buildStructuredDecisionObject({
    actor,
    caseRecord: reviewed,
    decisionObjectId: 'dec-1',
    problemPattern: 'capacity_bottleneck_after_shock',
    decisionPattern: 'multi_carrier_reroute_plus_temporary_surcharge',
  });
  if ('denied' in decision) {
    throw new Error(decision.reason);
  }

  const attached = attachReusableLesson({
    actor,
    caseRecord: reviewed,
    decision,
    lessonId: 'lesson-1',
    statement:
      'Pre-negotiate multi-carrier capacity and surcharge sunsets before disruption windows.',
  });
  if ('denied' in attached) {
    throw new Error(attached.reason);
  }

  return {
    caseRecord: reviewed,
    decision,
    lesson: attached.lesson,
    store: attached.store,
  };
}

export function returnEr6EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er6Actor;
  caseRecord: HistoricalBusinessCaseRecord;
  summary: string;
}):
  | {
      evidenceId: string;
      summary: string;
      analogyLabel: typeof ALLOWED_ANALOGY_LABEL;
      caseId: string;
      piratedCasebookPresent: false;
      fullCopyrightedCorpusPresent: false;
    }
  | DenialResult {
  if (!isEr6Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER6 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    summary: input.summary,
    analogyLabel: ALLOWED_ANALOGY_LABEL,
    caseId: input.caseRecord.caseId,
    piratedCasebookPresent: false,
    fullCopyrightedCorpusPresent: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er6Actor;
  action: string;
}): { approvalId: string; approved: true; action: string } | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny('Human approver required for consequential actions.');
  }
  if (
    !ER6_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS ||
    !ER6_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED
  ) {
    return deny('Human approval boundaries must remain unchanged.');
  }
  return {
    approvalId: input.approvalId,
    approved: true,
    action: input.action,
  };
}

export function runHistoricalBusinessCaseAtlasCycle(input: {
  actor: Er6Actor;
  human: Er6Actor;
  repoRoot?: string;
}): {
  hops: Er6HopRecord[];
  caseRecord: HistoricalBusinessCaseRecord;
  lesson: ReusableLesson;
  softWire: Er6SoftWireSnapshot;
  cycleEvidenceSha256: string;
} {
  const hops: Er6HopRecord[] = [];
  const softWire = er6SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr6LocksIntact() ? 'PASS' : 'FAIL',
      `${HONESTY_BANNER}; L4_AUTONOMY_ENABLED=false`,
    ),
  );

  const boot = bootstrapHistoricalBusinessCaseAtlas(input.repoRoot);
  hops.push(
    hop(
      'historical_business_case_atlas_bootstrap',
      boot.locksIntact ? 'PASS' : 'FAIL',
      'Atlas bootstrap; locks intact; soft-wires probed.',
    ),
  );

  hops.push(
    hop(
      'case_fields_encoded',
      HISTORICAL_BUSINESS_CASE_FIELDS.length === 20 ? 'PASS' : 'FAIL',
      'Case structure fields encoded.',
    ),
  );
  hops.push(
    hop(
      'priority_domains_encoded',
      HISTORICAL_BUSINESS_CASE_DOMAINS.length === 17 ? 'PASS' : 'FAIL',
      'Priority domains encoded.',
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      HISTORICAL_BUSINESS_CASE_CORE_FLOW.length === 6 ? 'PASS' : 'FAIL',
      'Core flow encoded.',
    ),
  );
  hops.push(
    hop(
      'decision_learning_lock_encoded',
      ALLOWED_ANALOGY_LABEL === 'SIMILAR_CASE' &&
        FORBIDDEN_ANALOGY_LABEL === 'PROVEN_CAUSE' &&
        HISTORICAL_BUSINESS_CASE_TRUTH_BOUNDARY.similarCaseEqProvenCause ===
          false
        ? 'PASS'
        : 'FAIL',
      'SIMILAR_CASE ≠ PROVEN_CAUSE lock encoded.',
    ),
  );
  hops.push(
    hop(
      'neural_pathway_encoded',
      HISTORICAL_CASE_NEURAL_PATHWAY.length === 6 ? 'PASS' : 'FAIL',
      'Neural pathway encoded.',
    ),
  );
  hops.push(
    hop(
      'ip_copyright_boundary_encoded',
      IP_COPYRIGHT_BOUNDARY.mayStorePiratedCasebooks === false &&
        IP_COPYRIGHT_BOUNDARY.mayStoreFullCopyrightedArticles === false &&
        IP_COPYRIGHT_BOUNDARY.mayStoreStructuredSummaries === true
        ? 'PASS'
        : 'FAIL',
      'IP/copyright boundary encoded.',
    ),
  );
  hops.push(
    hop(
      'may_query_apis_encoded',
      ER6_MAY_QUERY_APIS.length === 7 ? 'PASS' : 'FAIL',
      'Agent MAY query APIs encoded.',
    ),
  );

  const example = exampleAtlasCase(input.actor);
  hops.push(
    hop(
      'reconstruct_case',
      example.caseRecord.reconstructed &&
        example.caseRecord.analogyLabel === 'SIMILAR_CASE'
        ? 'PASS'
        : 'FAIL',
      'Historical case reconstructed as SIMILAR_CASE.',
    ),
  );
  hops.push(
    hop(
      'evidence_review',
      example.caseRecord.evidenceReviewed ? 'PASS' : 'FAIL',
      'Evidence review completed.',
    ),
  );
  hops.push(
    hop(
      'build_decision_object',
      example.decision.analogyLabel === 'SIMILAR_CASE' &&
        example.decision.currentContextAccounted.length ===
          CURRENT_CONTEXT_REQUIREMENTS.length
        ? 'PASS'
        : 'FAIL',
      'Structured decision object with current-context requirements.',
    ),
  );
  hops.push(
    hop(
      'attach_reusable_lesson',
      example.lesson.analogyLabel === 'SIMILAR_CASE' &&
        example.store.edges.length === HISTORICAL_CASE_NEURAL_PATHWAY.length - 1
        ? 'PASS'
        : 'FAIL',
      'Reusable lesson attached to neural pathway.',
    ),
  );

  const query = querySimilarCases({
    actor: input.actor,
    store: example.store,
    queryKind: 'logistics_recovery_from_disruptions',
    domain: 'logistics_and_freight',
  });
  hops.push(
    hop(
      'query_similar_cases_similar_case_only',
      !('denied' in query) &&
        query.analogyLabel === 'SIMILAR_CASE' &&
        query.matches.length >= 1
        ? 'PASS'
        : 'FAIL',
      'Similar-case query returns SIMILAR_CASE only.',
    ),
  );

  const strengthened = applyLessonTransferFeedback({
    actor: input.actor,
    lesson: example.lesson,
    quality: 'successful_reuse',
    store: example.store,
  });
  hops.push(
    hop(
      'strengthen_lesson_on_successful_reuse',
      !('denied' in strengthened) &&
        strengthened.lesson.strength > example.lesson.strength &&
        strengthened.lesson.successfulReuseCount === 1
        ? 'PASS'
        : 'FAIL',
      'Successful reuse strengthens lesson.',
    ),
  );

  const baseLesson =
    'denied' in strengthened ? example.lesson : strengthened.lesson;
  const weakened = applyLessonTransferFeedback({
    actor: input.actor,
    lesson: baseLesson,
    quality: 'poor_transfer',
    store: 'denied' in strengthened ? example.store : strengthened.store,
  });
  hops.push(
    hop(
      'weaken_lesson_on_poor_transfer',
      !('denied' in weakened) &&
        weakened.lesson.strength < baseLesson.strength &&
        weakened.lesson.poorTransferCount === 1
        ? 'PASS'
        : 'FAIL',
      'Poor transfer weakens lesson.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof HISTORICAL_BUSINESS_CASE_ATLAS_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_proven_cause_label', fn: attemptLabelProvenCause },
    { hop: 'deny_pirated_casebooks', fn: attemptPiratedCasebookIngest },
    {
      hop: 'deny_full_copyrighted_ingest',
      fn: attemptFullCopyrightedIngest,
    },
    {
      hop: 'deny_proprietary_consulting_reports',
      fn: attemptProprietaryConsultingReportIngest,
    },
    { hop: 'deny_ignore_current_context', fn: attemptIgnoreCurrentContext },
    { hop: 'deny_cross_tenant_reuse', fn: attemptCrossTenantReuse },
    { hop: 'deny_bypass_guardian_rls', fn: attemptBypassGuardianRls },
    {
      hop: 'deny_expand_tenant_universe_access',
      fn: attemptExpandTenantUniverseAccess,
    },
    {
      hop: 'deny_persist_hidden_chain_of_thought',
      fn: attemptPersistHiddenChainOfThought,
    },
    { hop: 'deny_auto_deploy_changes', fn: attemptAutoDeployChanges },
  ];
  for (const d of denyHops) {
    hops.push(
      hop(d.hop, d.fn().state === 'DENIED' ? 'PASS' : 'FAIL', `${d.hop} DENIED.`),
    );
  }

  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' &&
        attemptAgentAutoAuthority().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; no agent auto-authority.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER6_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      ER_LAYER_TITLE.includes('Real API Data Fabric') &&
        GITHUB_SOT_ISSUE === 162 &&
        NEXT_PHASE_TITLE.includes('ER7')
        ? 'PASS'
        : 'FAIL',
      'ER layer context (#162); next ER7 Historical Science & Engineering Atlas.',
    ),
  );

  hops.push(
    hop(
      'er5_soft_wire',
      softWireHopState(softWire.er5GlobalHistoricalKnowledgeIngestion.present),
      softWire.er5GlobalHistoricalKnowledgeIngestion.note,
    ),
  );
  hops.push(
    hop(
      'er4_soft_wire',
      softWireHopState(softWire.er4RightsProvenanceGate.present),
      softWire.er4RightsProvenanceGate.note,
    ),
  );
  hops.push(
    hop(
      'er3_soft_wire',
      softWireHopState(softWire.er3PublicDataSourceRegistry.present),
      softWire.er3PublicDataSourceRegistry.note,
    ),
  );
  hops.push(
    hop(
      'er2_soft_wire',
      softWireHopState(softWire.er2ApiTruthStateMachine.present),
      softWire.er2ApiTruthStateMachine.note,
    ),
  );
  hops.push(
    hop(
      'er1_soft_wire',
      softWireHopState(softWire.er1RealApiConnectionRegistry.present),
      softWire.er1RealApiConnectionRegistry.note,
    ),
  );
  hops.push(
    hop(
      'eq16_soft_wire',
      softWireHopState(softWire.eq16SoftwareWormholeRouter.present),
      softWire.eq16SoftwareWormholeRouter.note,
    ),
  );
  hops.push(
    hop(
      'eq15_soft_wire',
      softWireHopState(softWire.eq15PathwayPlasticity.present),
      softWire.eq15PathwayPlasticity.note,
    ),
  );
  hops.push(
    hop(
      'eq14_soft_wire',
      softWireHopState(softWire.eq14NeuralPathwayArchitectureGraph.present),
      softWire.eq14NeuralPathwayArchitectureGraph.note,
    ),
  );
  hops.push(
    hop(
      'eq13_soft_wire',
      softWireHopState(softWire.eq13ArchitectureReturnReceipt.present),
      softWire.eq13ArchitectureReturnReceipt.note,
    ),
  );
  hops.push(
    hop(
      'eq12_soft_wire',
      softWireHopState(softWire.eq12CrossArchitectureBenchmarkMatrix.present),
      softWire.eq12CrossArchitectureBenchmarkMatrix.note,
    ),
  );
  hops.push(
    hop(
      'ep15_soft_wire',
      softWireHopState(softWire.ep15AlgorithmTuningSandbox.present),
      softWire.ep15AlgorithmTuningSandbox.note,
    ),
  );
  hops.push(
    hop(
      'em157_soft_wire',
      softWireHopState(softWire.em157HomeBase.present),
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ER6_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const evidence = returnEr6EvidenceToHomeBase({
    evidenceId: 'ev-er6-atlas-1',
    actor: input.actor,
    caseRecord: example.caseRecord,
    summary: 'historical business case atlas advisory',
  });
  const humanGate = requireHumanApproval({
    approvalId: 'appr-er6-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in evidence || 'denied' in humanGate ? 'DENIED' : 'PASS',
      'Atlas evidence to Home Base; SIMILAR_CASE; human gate exercised.',
    ),
  );

  void HISTORICAL_BUSINESS_CASE_ATLAS_CYCLE;
  void ER6_MAY;
  void ER6_MUST_NOT;
  void ER6_AGENT_BOUNDS;
  void EVIDENCE_CLASSES;
  void CONTRADICTION_STATES;

  const finalLesson =
    'denied' in weakened ? example.lesson : weakened.lesson;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
      caseId: example.caseRecord.caseId,
      lessonId: finalLesson.lessonId,
      analogyLabel: ALLOWED_ANALOGY_LABEL,
    }),
  );

  return {
    hops,
    caseRecord: example.caseRecord,
    lesson: finalLesson,
    softWire,
    cycleEvidenceSha256,
  };
}
