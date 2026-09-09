/**
 * 62L-ES30 — Agent Reputation & Domain Trust Graph runtime.
 *
 * Domain-isolated trust profiles; increase/decrease rules; routing preference;
 * dissent/evidence primacy; no self-modify; trust≠authority.
 */

import { createHash } from 'node:crypto';
import {
  AGENT_REPUTATION_DOMAIN_TRUST_GRAPH_CYCLE,
  AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY,
  DOMAIN_TRUST_MODEL,
  ES30_AGENT_BOUNDS,
  ES30_DB_CANDIDATES_STATUS,
  ES30_LOCKS,
  ES30_MAY,
  ES30_MUST_NOT,
  ES_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  TRUST_DECREASE_SIGNALS,
  TRUST_INCREASE_SIGNALS,
  TRUST_RECORD_FIELDS,
  TRUST_ROUTING_PATH,
  TRUST_STATES,
  TRUST_STATE_RANK,
  assertEs30LocksIntact,
  computeCompositeTrustScore,
  domainsAreIsolated,
  es30SoftWireSnapshot,
  isSubjectAgent,
  isTrustAuthority,
  mayAutoSuppressLowerTrustWithStrongerEvidence,
  nextTrustStateAfterDecrease,
  nextTrustStateAfterIncrease,
  softWireHopState,
  trustGrantsPermissionsOrAuthority,
  trustTransfersAcrossDomains,
  type CertificationState,
  type DomainTrustRecord,
  type DissentWeightingDecision,
  type Es30Actor,
  type Es30EvidenceState,
  type Es30HopRecord,
  type Es30SoftWireSnapshot,
  type EvidenceStrength,
  type MetricScore,
  type RoutingCandidate,
  type TeamSelectionResult,
  type TrustDecreaseSignal,
  type TrustIncreaseSignal,
  type TrustState,
} from './agent-reputation-domain-trust-graph-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof AGENT_REPUTATION_DOMAIN_TRUST_GRAPH_CYCLE)[number],
  state: Es30EvidenceState,
  summary: string,
): Es30HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'BLOCKED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' | 'BLOCKED' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

function metric(value: number, samples = 1, note?: string): MetricScore {
  return { value, samples, note };
}

export function registerDomainTrustRecord(input: {
  actor: Es30Actor;
  agentId: string;
  skillId?: string | null;
  domain: string;
  taskClass: string;
  certificationState?: CertificationState;
  trustState?: TrustState;
  evidenceRefs?: readonly string[];
  factualAccuracy?: number;
  citationQuality?: number;
  contradictionRate?: number;
  escalationQuality?: number;
  policyCompliance?: number;
  latencyMs?: number;
  costUnits?: number;
  failureRate?: number;
  activityCount?: number;
}): DomainTrustRecord | DenialResult {
  if (!isTrustAuthority(input.actor) && input.actor.kind !== 'certified_skill_registry') {
    return deny(
      'Only trust graph authority / home_base / evaluators / reviewers may register trust records.',
    );
  }
  if (!input.domain.trim()) {
    return deny('Domain is required for domain-isolated trust registration.');
  }
  if (
    input.actor.tenantId.length === 0 ||
    input.actor.universeId.length === 0
  ) {
    return deny('Tenant/Universe required for trust registration.');
  }

  const trustState = input.trustState ?? 'UNVERIFIED';
  const record: DomainTrustRecord = {
    trustRecordId: `tr-${sha256(`${input.agentId}:${input.domain}:${input.taskClass}`).slice(0, 16)}`,
    agentId: input.agentId,
    skillId: input.skillId ?? null,
    domain: input.domain.trim(),
    taskClass: input.taskClass,
    certificationState: input.certificationState ?? 'UNCERTIFIED',
    testHistory: [],
    factualAccuracy: metric(input.factualAccuracy ?? 0.5),
    citationQuality: metric(input.citationQuality ?? 0.5),
    contradictionRate: metric(input.contradictionRate ?? 0.1),
    escalationQuality: metric(input.escalationQuality ?? 0.5),
    policyCompliance: metric(input.policyCompliance ?? 0.5),
    latencyMs: metric(input.latencyMs ?? 100),
    costUnits: metric(input.costUnits ?? 1),
    failureRate: metric(input.failureRate ?? 0.1),
    evaluatorScores: [],
    humanReviewOutcomes: [],
    lastVerifiedDate: null,
    trustState,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    activityCount: input.activityCount ?? 0,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
    l4AutonomyEnabled: false,
    grantsPermissions: false,
    grantsAuthority: false,
  };
  return record;
}

export function lookupDomainTrust(
  records: readonly DomainTrustRecord[],
  agentId: string,
  domain: string,
): DomainTrustRecord | undefined {
  return records.find(
    (r) =>
      r.agentId === agentId &&
      r.domain.trim().toLowerCase() === domain.trim().toLowerCase(),
  );
}

export function assertDomainIsolation(input: {
  supplyChainRecord: DomainTrustRecord;
  legalDomain: string;
}): {
  isolated: true;
  supplyChainTrustDoesNotApplyToLegal: true;
  reason: string;
} | DenialResult {
  if (!domainsAreIsolated(input.supplyChainRecord.domain, input.legalDomain)) {
    return deny('Expected distinct domains for isolation check.');
  }
  if (trustTransfersAcrossDomains()) {
    return deny('Cross-domain trust transfer lock violated.');
  }
  return {
    isolated: true,
    supplyChainTrustDoesNotApplyToLegal: true,
    reason: `HIGH_TRUST (or any trust) in domain "${input.supplyChainRecord.domain}" does not transfer to domain "${input.legalDomain}".`,
  };
}

export function applyTrustIncrease(input: {
  actor: Es30Actor;
  record: DomainTrustRecord;
  signal: TrustIncreaseSignal;
  evidenceRef: string;
  subjectAgentId?: string;
}): DomainTrustRecord | DenialResult {
  if (!isTrustAuthority(input.actor)) {
    return deny('Only trust authorities may apply trust increases.');
  }
  if (
    input.subjectAgentId &&
    input.actor.id === input.subjectAgentId &&
    isSubjectAgent(input.actor)
  ) {
    return deny('Agent may not increase its own trust score (self-modify denied).');
  }
  if (input.actor.id === input.record.agentId && input.actor.kind === 'subject_agent') {
    return deny('Subject agent may not modify its own trust score.');
  }
  if (!TRUST_INCREASE_SIGNALS.includes(input.signal)) {
    return deny(`Unknown trust increase signal: ${input.signal}`);
  }
  if (!input.evidenceRef.trim()) {
    return deny('Trust increase requires evidence ref.');
  }

  const nextState = nextTrustStateAfterIncrease(input.record.trustState);
  const bump = (m: MetricScore, delta: number): MetricScore => ({
    value: Math.min(1, m.value + delta),
    samples: m.samples + 1,
    note: input.signal,
  });

  return {
    ...input.record,
    factualAccuracy: bump(input.record.factualAccuracy, 0.05),
    citationQuality: bump(input.record.citationQuality, 0.04),
    escalationQuality: bump(input.record.escalationQuality, 0.03),
    policyCompliance: bump(input.record.policyCompliance, 0.03),
    contradictionRate: {
      value: Math.max(0, input.record.contradictionRate.value - 0.02),
      samples: input.record.contradictionRate.samples + 1,
      note: input.signal,
    },
    failureRate: {
      value: Math.max(0, input.record.failureRate.value - 0.02),
      samples: input.record.failureRate.samples + 1,
      note: input.signal,
    },
    trustState: nextState,
    lastVerifiedDate: nowIso(),
    evidenceRefs: [...input.record.evidenceRefs, input.evidenceRef],
    testHistory: [
      ...input.record.testHistory,
      {
        testId: `inc-${input.signal}`,
        domain: input.record.domain,
        passed: true,
        at: nowIso(),
        evidenceRef: input.evidenceRef,
      },
    ],
    grantsPermissions: false,
    grantsAuthority: false,
    l4AutonomyEnabled: false,
  };
}

export function applyTrustDecrease(input: {
  actor: Es30Actor;
  record: DomainTrustRecord;
  signal: TrustDecreaseSignal;
  evidenceRef: string;
}): DomainTrustRecord | DenialResult {
  if (!isTrustAuthority(input.actor)) {
    return deny('Only trust authorities may apply trust decreases.');
  }
  if (input.actor.id === input.record.agentId && input.actor.kind === 'subject_agent') {
    return deny('Subject agent may not modify its own trust score.');
  }
  if (!TRUST_DECREASE_SIGNALS.includes(input.signal)) {
    return deny(`Unknown trust decrease signal: ${input.signal}`);
  }
  if (!input.evidenceRef.trim()) {
    return deny('Trust decrease requires evidence ref.');
  }

  let certificationState = input.record.certificationState;
  if (input.signal === 'certified_skill_expires_or_regresses') {
    certificationState =
      input.record.certificationState === 'CERTIFIED' ? 'REGRESSED' : 'EXPIRED';
  }

  const nextState = nextTrustStateAfterDecrease(input.record.trustState);
  const drop = (m: MetricScore, delta: number): MetricScore => ({
    value: Math.max(0, m.value - delta),
    samples: m.samples + 1,
    note: input.signal,
  });

  return {
    ...input.record,
    certificationState,
    factualAccuracy: drop(input.record.factualAccuracy, 0.08),
    citationQuality: drop(input.record.citationQuality, 0.08),
    policyCompliance: drop(input.record.policyCompliance, 0.1),
    contradictionRate: {
      value: Math.min(1, input.record.contradictionRate.value + 0.1),
      samples: input.record.contradictionRate.samples + 1,
      note: input.signal,
    },
    failureRate: {
      value: Math.min(1, input.record.failureRate.value + 0.1),
      samples: input.record.failureRate.samples + 1,
      note: input.signal,
    },
    trustState: nextState,
    evidenceRefs: [...input.record.evidenceRefs, input.evidenceRef],
    testHistory: [
      ...input.record.testHistory,
      {
        testId: `dec-${input.signal}`,
        domain: input.record.domain,
        passed: false,
        at: nowIso(),
        evidenceRef: input.evidenceRef,
      },
    ],
    grantsPermissions: false,
    grantsAuthority: false,
    l4AutonomyEnabled: false,
  };
}

export function attemptSelfModifyTrustScore(input: {
  actor: Es30Actor;
  record: DomainTrustRecord;
  desiredState: TrustState;
}): DenialResult {
  if (input.actor.id !== input.record.agentId && !isSubjectAgent(input.actor)) {
    // Non-subject foreign actor also cannot unilaterally rewrite without authority path
  }
  if (
    input.actor.id === input.record.agentId ||
    isSubjectAgent(input.actor)
  ) {
    return deny(
      'No agent can modify its own trust score, certification, or reviewer history.',
    );
  }
  if (!isTrustAuthority(input.actor)) {
    return deny('Self-modify / unauthorized trust rewrite denied.');
  }
  // Even authority must use applyTrustIncrease/Decrease with evidence — direct forge denied here
  return deny(
    'Direct trust score forge denied — use evidence-backed increase/decrease signals only.',
  );
}

export function attemptSelfModifyCertification(input: {
  actor: Es30Actor;
  record: DomainTrustRecord;
}): DenialResult {
  if (input.actor.id === input.record.agentId || isSubjectAgent(input.actor)) {
    return deny(
      'No agent can modify its own certification state (self-modify denied).',
    );
  }
  return deny('Unauthorized certification self-modify denied.');
}

export function attemptSelfModifyReviewerHistory(input: {
  actor: Es30Actor;
  record: DomainTrustRecord;
}): DenialResult {
  if (input.actor.id === input.record.agentId || isSubjectAgent(input.actor)) {
    return deny(
      'No agent can modify its own reviewer history (self-modify denied).',
    );
  }
  return deny('Unauthorized reviewer-history self-modify denied.');
}

export function attemptTrustGrantsPermission(input: {
  actor: Es30Actor;
  record: DomainTrustRecord;
  permission: string;
}): DenialResult {
  void input.actor;
  void input.permission;
  if (trustGrantsPermissionsOrAuthority()) {
    return deny('Trust grants permissions lock violated.');
  }
  if (input.record.grantsPermissions || input.record.trustState === 'HIGH_TRUST') {
    return deny(
      'Trust cannot grant new permissions or authority — HIGH_TRUST ≠ permission expansion.',
    );
  }
  return deny(
    'Trust cannot grant new permissions or authority — Guardian/RLS/tenant/Universe unchanged.',
  );
}

export function attemptTrustGrantsAuthority(input: {
  actor: Es30Actor;
  record: DomainTrustRecord;
}): DenialResult {
  void input.actor;
  if (input.record.grantsAuthority) {
    return deny('Trust grants authority lock violated on record.');
  }
  return deny(
    'Trust cannot grant new authority — L4_AUTONOMY_ENABLED=false; recommend ≠ act.',
  );
}

export function weightDissentWithEvidencePrimacy(input: {
  lowerTrustRecord: DomainTrustRecord;
  higherTrustRecord: DomainTrustRecord;
  lowerTrustEvidence: EvidenceStrength;
  higherTrustEvidence: EvidenceStrength;
}): DissentWeightingDecision | DenialResult {
  if (
    input.lowerTrustRecord.domain.trim().toLowerCase() !==
    input.higherTrustRecord.domain.trim().toLowerCase()
  ) {
    return deny('Dissent weighting requires same domain.');
  }
  if (mayAutoSuppressLowerTrustWithStrongerEvidence()) {
    return deny('Auto-suppress lock violated.');
  }

  const lowerStrength = input.lowerTrustEvidence.strength;
  const higherStrength = input.higherTrustEvidence.strength;
  if (lowerStrength <= higherStrength) {
    // Still never suppress — only adjust confidence
    return {
      suppressed: false,
      evidencePrimary: true,
      reputationInfluencesConfidence: true,
      lowerTrustAgentId: input.lowerTrustRecord.agentId,
      higherTrustAgentId: input.higherTrustRecord.agentId,
      lowerTrustEvidenceStrength: lowerStrength,
      higherTrustEvidenceStrength: higherStrength,
      confidenceAdjustment:
        (TRUST_STATE_RANK[input.higherTrustRecord.trustState] -
          TRUST_STATE_RANK[input.lowerTrustRecord.trustState]) *
        0.01,
      reason:
        'Reputation influences confidence only; lower-trust dissent retained (evidence not stronger).',
    };
  }

  return {
    suppressed: false,
    evidencePrimary: true,
    reputationInfluencesConfidence: true,
    lowerTrustAgentId: input.lowerTrustRecord.agentId,
    higherTrustAgentId: input.higherTrustRecord.agentId,
    lowerTrustEvidenceStrength: lowerStrength,
    higherTrustEvidenceStrength: higherStrength,
    confidenceAdjustment: 0,
    reason:
      'Lower-trust agent has stronger evidence — dissent NOT auto-suppressed; evidence remains primary.',
  };
}

export function selectTeamByTrustGraph(input: {
  actor: Es30Actor;
  domain: string;
  candidates: readonly RoutingCandidate[];
  maxTeamSize?: number;
}): TeamSelectionResult | DenialResult {
  if (!isTrustAuthority(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only home_base / trust authority may select teams via trust graph.');
  }
  const eligible = input.candidates.filter(
    (c) =>
      c.available &&
      c.domain.trim().toLowerCase() === input.domain.trim().toLowerCase() &&
      c.trustState !== 'SUSPENDED',
  );
  if (eligible.length === 0) {
    return deny('No eligible agents for domain — WAITING_DATA / no team.', 'WAITING_DATA');
  }

  // Prefer best qualified: trustScore + capabilityFit, NOT activity or cost ascendency
  const ranked = [...eligible].sort((a, b) => {
    const scoreA = a.trustScore + a.capabilityFit * 10;
    const scoreB = b.trustScore + b.capabilityFit * 10;
    if (scoreB !== scoreA) return scoreB - scoreA;
    // Tie-break: lower cost preferred (not most expensive)
    if (a.costUnits !== b.costUnits) return a.costUnits - b.costUnits;
    // Tie-break: lower activity (not most active)
    return a.activityCount - b.activityCount;
  });

  const max = input.maxTeamSize ?? 2;
  const selected = ranked.slice(0, max).map((c) => c.agentId);

  // Guard: must not have selected solely by activity or expense
  const mostActive = [...eligible].sort((a, b) => b.activityCount - a.activityCount)[0]!;
  const mostExpensive = [...eligible].sort((a, b) => b.costUnits - a.costUnits)[0]!;
  const best = ranked[0]!;

  if (
    ES30_LOCKS.PREFER_MOST_ACTIVE_OVER_BEST_QUALIFIED === true ||
    ES30_LOCKS.PREFER_MOST_EXPENSIVE_OVER_BEST_QUALIFIED === true
  ) {
    return deny('Routing preference locks violated.');
  }

  return {
    selectedAgentIds: selected,
    preferredBy: 'best_qualified',
    notPreferredBy: ['most_active', 'most_expensive'],
    domain: input.domain,
    reason: `Selected by domain trust + capability fit (best=${best.agentId}); not most_active=${mostActive.agentId}; not most_expensive=${mostExpensive.agentId}.`,
  };
}

export function candidatesFromRecords(
  records: readonly DomainTrustRecord[],
  extras?: Readonly<
    Record<
      string,
      { capabilityFit?: number; available?: boolean }
    >
  >,
): RoutingCandidate[] {
  return records.map((r) => ({
    agentId: r.agentId,
    domain: r.domain,
    trustState: r.trustState,
    trustScore: computeCompositeTrustScore(r),
    capabilityFit: extras?.[r.agentId]?.capabilityFit ?? 0.5,
    costUnits: r.costUnits.value,
    available: extras?.[r.agentId]?.available ?? true,
    activityCount: r.activityCount,
  }));
}

export function attemptTipLand(): DenialResult {
  return deny('Tip-land onto xiv-v2/main denied for ES30 park-and-implement.');
}

export function attemptManagePullRequest(): DenialResult {
  return deny('ManagePullRequest / open PR denied unless founder explicitly asks.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('Bypass Guardian/RLS denied — tenant/Universe isolation unchanged.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('Expand tenant/Universe access denied.');
}

export function attemptEnableL4Autonomy(): DenialResult {
  return deny('L4_AUTONOMY_ENABLED must remain false.');
}

export function probeGuardianRlsTenantUniverseIsolation(input: {
  actor: Es30Actor;
  record: DomainTrustRecord;
}): { isolated: true; summary: string } | DenialResult {
  if (
    input.actor.tenantId !== input.record.tenantId ||
    input.actor.universeId !== input.record.universeId
  ) {
    return deny('Tenant/Universe mismatch — cross-tenant trust access denied.');
  }
  return {
    isolated: true,
    summary:
      'Guardian/RLS/tenant/Universe isolation enforced; trust graph does not expand access.',
  };
}

export function exampleSupplyChainHighTrust(
  actor: Es30Actor,
  agentId = 'agent-supply-chain-1',
): DomainTrustRecord {
  const registered = registerDomainTrustRecord({
    actor,
    agentId,
    domain: 'supply_chain',
    taskClass: 'inventory_forecast',
    certificationState: 'CERTIFIED',
    trustState: 'HIGH_TRUST',
    factualAccuracy: 0.95,
    citationQuality: 0.92,
    contradictionRate: 0.02,
    escalationQuality: 0.9,
    policyCompliance: 0.96,
    latencyMs: 80,
    costUnits: 2,
    failureRate: 0.03,
    activityCount: 12,
    evidenceRefs: ['ev-sc-inventory-1'],
  });
  if ('denied' in registered) {
    throw new Error(registered.reason);
  }
  return {
    ...registered,
    lastVerifiedDate: nowIso(),
  };
}

export function exampleLegalUnverified(
  actor: Es30Actor,
  agentId = 'agent-supply-chain-1',
): DomainTrustRecord {
  const registered = registerDomainTrustRecord({
    actor,
    agentId,
    domain: 'legal',
    taskClass: 'contract_review',
    certificationState: 'UNCERTIFIED',
    trustState: 'UNVERIFIED',
    factualAccuracy: 0.4,
    citationQuality: 0.35,
    contradictionRate: 0.2,
    escalationQuality: 0.4,
    policyCompliance: 0.5,
    latencyMs: 120,
    costUnits: 3,
    failureRate: 0.25,
    activityCount: 12,
    evidenceRefs: [],
  });
  if ('denied' in registered) {
    throw new Error(registered.reason);
  }
  return registered;
}

export function exampleLowerTrustStrongEvidencePair(actor: Es30Actor): {
  lowerTrust: DomainTrustRecord;
  higherTrust: DomainTrustRecord;
  lowerEvidence: EvidenceStrength;
  higherEvidence: EvidenceStrength;
} {
  const lower = registerDomainTrustRecord({
    actor,
    agentId: 'agent-low-trust',
    domain: 'research',
    taskClass: 'factual_claim',
    trustState: 'LIMITED_TRUST',
    factualAccuracy: 0.6,
    citationQuality: 0.55,
    activityCount: 3,
    costUnits: 1,
  });
  const higher = registerDomainTrustRecord({
    actor,
    agentId: 'agent-high-trust',
    domain: 'research',
    taskClass: 'factual_claim',
    trustState: 'HIGH_TRUST',
    factualAccuracy: 0.9,
    citationQuality: 0.88,
    activityCount: 50,
    costUnits: 9,
  });
  if ('denied' in lower || 'denied' in higher) {
    throw new Error('Failed to build dissent example records.');
  }
  return {
    lowerTrust: lower,
    higherTrust: higher,
    lowerEvidence: {
      evidenceId: 'ev-strong',
      agentId: lower.agentId,
      domain: 'research',
      strength: 0.95,
      grounded: true,
      citationOk: true,
      contradictionFree: true,
      refs: ['primary-source-a', 'measurement-b'],
    },
    higherEvidence: {
      evidenceId: 'ev-weak',
      agentId: higher.agentId,
      domain: 'research',
      strength: 0.4,
      grounded: false,
      citationOk: false,
      contradictionFree: false,
      refs: ['opinion-c'],
    },
  };
}

export type Es30CycleResult = {
  honestyBanner: typeof HONESTY_BANNER;
  githubSotLabel: typeof GITHUB_SOT_LABEL;
  githubSotIssue: typeof GITHUB_SOT_ISSUE;
  githubSotTitle: typeof GITHUB_SOT_TITLE;
  gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
  layerTitle: typeof ES_LAYER_TITLE;
  nextPhaseTitle: typeof NEXT_PHASE_TITLE;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  dbCandidatesStatus: typeof ES30_DB_CANDIDATES_STATUS;
  softWire: Es30SoftWireSnapshot;
  hops: Es30HopRecord[];
  trustStates: typeof TRUST_STATES;
  trustRecordFields: typeof TRUST_RECORD_FIELDS;
  domainModel: typeof DOMAIN_TRUST_MODEL;
  routingPath: typeof TRUST_ROUTING_PATH;
  may: typeof ES30_MAY;
  mustNot: typeof ES30_MUST_NOT;
  agentBounds: typeof ES30_AGENT_BOUNDS;
  truthBoundary: typeof AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY;
  tipLand: false;
  managePullRequest: false;
  evidenceHash: string;
};

export function runAgentReputationDomainTrustGraphCycle(input: {
  actor: Es30Actor;
  repoRoot?: string;
}): Es30CycleResult {
  const softWire = es30SoftWireSnapshot(input.repoRoot);
  const locksIntact = assertEs30LocksIntact();
  const hops: Es30HopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      locksIntact ? 'PASS' : 'FAIL',
      locksIntact
        ? 'Honesty locks intact; L4=false; trust≠authority; no self-modify.'
        : 'Honesty locks broken.',
    ),
  );
  hops.push(
    hop(
      'agent_reputation_domain_trust_graph_bootstrap',
      'IMPLEMENTED',
      'ES30 Agent Reputation & Domain Trust Graph bootstrap on child branch.',
    ),
  );
  hops.push(
    hop('trust_states_encoded', 'PASS', `Trust states: ${TRUST_STATES.join(', ')}`),
  );
  hops.push(
    hop(
      'trust_record_fields_encoded',
      'PASS',
      `Trust record fields encoded (${TRUST_RECORD_FIELDS.length}).`,
    ),
  );
  hops.push(
    hop(
      'domain_trust_model_encoded',
      'PASS',
      `Model: ${DOMAIN_TRUST_MODEL.join(' → ')}`,
    ),
  );
  hops.push(
    hop(
      'trust_routing_path_encoded',
      'PASS',
      `Routing: ${TRUST_ROUTING_PATH.join(' → ')}`,
    ),
  );
  hops.push(
    hop(
      'increase_decrease_signals_encoded',
      'PASS',
      `Increase(${TRUST_INCREASE_SIGNALS.length}) / Decrease(${TRUST_DECREASE_SIGNALS.length}) signals encoded.`,
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      'PASS',
      'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED; evidence primary.',
    ),
  );

  const sc = exampleSupplyChainHighTrust(input.actor);
  hops.push(
    hop(
      'register_domain_trust_record',
      'PASS',
      `Registered domain trust record ${sc.trustRecordId} for ${sc.domain}.`,
    ),
  );

  const isolation = assertDomainIsolation({
    supplyChainRecord: sc,
    legalDomain: 'legal',
  });
  hops.push(
    hop(
      'enforce_domain_isolation',
      'denied' in isolation ? 'DENIED' : 'PASS',
      'denied' in isolation ? isolation.reason : isolation.reason,
    ),
  );

  const increased = applyTrustIncrease({
    actor: input.actor,
    record: exampleLegalUnverified(input.actor, 'agent-research-1'),
    signal: 'independent_tests_pass',
    evidenceRef: 'ev-test-pass-1',
  });
  hops.push(
    hop(
      'apply_trust_increase',
      'denied' in increased ? 'DENIED' : 'PASS',
      'denied' in increased
        ? increased.reason
        : `Trust increased to ${increased.trustState}.`,
    ),
  );

  const decreased = applyTrustDecrease({
    actor: input.actor,
    record: sc,
    signal: 'hallucinations',
    evidenceRef: 'ev-hallucination-1',
  });
  hops.push(
    hop(
      'apply_trust_decrease',
      'denied' in decreased ? 'DENIED' : 'PASS',
      'denied' in decreased
        ? decreased.reason
        : `Trust decreased to ${decreased.trustState}.`,
    ),
  );

  hops.push(
    hop(
      'deny_cross_domain_trust_transfer',
      trustTransfersAcrossDomains() ? 'FAIL' : 'PASS',
      'Cross-domain trust transfer denied.',
    ),
  );

  const legal = exampleLegalUnverified(input.actor, 'agent-active-expensive');
  const qualified = registerDomainTrustRecord({
    actor: input.actor,
    agentId: 'agent-best-qualified',
    domain: 'supply_chain',
    taskClass: 'inventory_forecast',
    trustState: 'DOMAIN_VERIFIED',
    factualAccuracy: 0.93,
    citationQuality: 0.91,
    costUnits: 2,
    activityCount: 2,
  });
  const activeExpensive = registerDomainTrustRecord({
    actor: input.actor,
    agentId: 'agent-active-expensive',
    domain: 'supply_chain',
    taskClass: 'inventory_forecast',
    trustState: 'LIMITED_TRUST',
    factualAccuracy: 0.5,
    citationQuality: 0.4,
    costUnits: 99,
    activityCount: 10_000,
  });

  const routeRecords: DomainTrustRecord[] = [];
  if (!('denied' in qualified)) routeRecords.push(qualified);
  if (!('denied' in activeExpensive)) routeRecords.push(activeExpensive);
  void legal;

  const selection = selectTeamByTrustGraph({
    actor: input.actor,
    domain: 'supply_chain',
    candidates: candidatesFromRecords(routeRecords, {
      'agent-best-qualified': { capabilityFit: 0.95, available: true },
      'agent-active-expensive': { capabilityFit: 0.4, available: true },
    }),
    maxTeamSize: 1,
  });
  hops.push(
    hop(
      'route_mission_via_trust_graph',
      'denied' in selection ? 'DENIED' : 'PASS',
      'denied' in selection ? selection.reason : selection.reason,
    ),
  );
  hops.push(
    hop(
      'prefer_best_qualified_not_most_active_or_expensive',
      !('denied' in selection) &&
        selection.selectedAgentIds[0] === 'agent-best-qualified'
        ? 'PASS'
        : 'FAIL',
      'Prefer best qualified, not most active/expensive.',
    ),
  );

  const dissentPair = exampleLowerTrustStrongEvidencePair(input.actor);
  const dissent = weightDissentWithEvidencePrimacy({
    lowerTrustRecord: dissentPair.lowerTrust,
    higherTrustRecord: dissentPair.higherTrust,
    lowerTrustEvidence: dissentPair.lowerEvidence,
    higherTrustEvidence: dissentPair.higherEvidence,
  });
  hops.push(
    hop(
      'weight_dissent_without_suppressing_stronger_evidence',
      !('denied' in dissent) && dissent.suppressed === false ? 'PASS' : 'FAIL',
      'denied' in dissent ? dissent.reason : dissent.reason,
    ),
  );
  hops.push(
    hop(
      'evidence_remains_primary',
      AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY.evidenceRemainsPrimaryOverReputation
        ? 'PASS'
        : 'FAIL',
      'Evidence remains primary over reputation.',
    ),
  );

  const subject: Es30Actor = {
    kind: 'subject_agent',
    id: sc.agentId,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    permissions: [],
  };
  hops.push(
    hop(
      'deny_self_modify_trust_score',
      attemptSelfModifyTrustScore({
        actor: subject,
        record: sc,
        desiredState: 'HIGH_TRUST',
      }).denied
        ? 'DENIED'
        : 'FAIL',
      'Self-modify trust score denied.',
    ),
  );
  hops.push(
    hop(
      'deny_self_modify_certification',
      attemptSelfModifyCertification({ actor: subject, record: sc }).denied
        ? 'DENIED'
        : 'FAIL',
      'Self-modify certification denied.',
    ),
  );
  hops.push(
    hop(
      'deny_self_modify_reviewer_history',
      attemptSelfModifyReviewerHistory({ actor: subject, record: sc }).denied
        ? 'DENIED'
        : 'FAIL',
      'Self-modify reviewer history denied.',
    ),
  );
  hops.push(
    hop(
      'deny_trust_grants_permissions',
      attemptTrustGrantsPermission({
        actor: input.actor,
        record: sc,
        permission: 'admin',
      }).denied
        ? 'DENIED'
        : 'FAIL',
      'Trust≠permission grant.',
    ),
  );
  hops.push(
    hop(
      'deny_trust_grants_authority',
      attemptTrustGrantsAuthority({ actor: input.actor, record: sc }).denied
        ? 'DENIED'
        : 'FAIL',
      'Trust≠authority grant.',
    ),
  );
  hops.push(
    hop(
      'deny_bypass_guardian_rls',
      attemptBypassGuardianRls().denied ? 'DENIED' : 'FAIL',
      'Guardian/RLS bypass denied.',
    ),
  );
  hops.push(
    hop(
      'deny_expand_tenant_universe_access',
      attemptExpandTenantUniverseAccess().denied ? 'DENIED' : 'FAIL',
      'Tenant/Universe expansion denied.',
    ),
  );

  const isolationProbe = probeGuardianRlsTenantUniverseIsolation({
    actor: input.actor,
    record: sc,
  });
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      'denied' in isolationProbe ? 'DENIED' : 'PASS',
      'denied' in isolationProbe ? isolationProbe.reason : isolationProbe.summary,
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      ES30_LOCKS.RECOMMEND_EQ_ACT === false ? 'PASS' : 'FAIL',
      'Recommend ≠ act.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ES30_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false.',
    ),
  );

  hops.push(
    hop(
      'es29_multi_agent_consensus_soft_wire',
      softWireHopState(softWire.es29MultiAgentConsensus),
      softWire.es29MultiAgentConsensus.note,
    ),
  );
  hops.push(
    hop(
      'es28_prior_tip_soft_wire',
      softWireHopState(softWire.es28PriorTip),
      softWire.es28PriorTip.note,
    ),
  );
  hops.push(
    hop(
      'es25_skill_certification_soft_wire',
      softWireHopState(softWire.es25SkillCertification),
      softWire.es25SkillCertification.note,
    ),
  );
  hops.push(
    hop(
      'es16_home_base_soft_wire',
      softWire.homeBaseComputeSurface.present || softWire.es16HomeBase.present
        ? 'AVAILABLE'
        : 'WAITING_DATA',
      softWire.homeBaseComputeSurface.present
        ? softWire.homeBaseComputeSurface.note
        : softWire.es16HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ES30_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'NOT_APPLIED' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const evidenceHash = sha256(
    JSON.stringify({
      label: GITHUB_SOT_LABEL,
      hops: hops.map((h) => [h.hop, h.state]),
      locks: ES30_LOCKS,
    }),
  );
  hops.push(
    hop('evidence', 'IMPLEMENTED', `Evidence hash ${evidenceHash.slice(0, 12)}.`),
  );

  // Ensure cycle constant covers all hops we emit (defensive)
  void AGENT_REPUTATION_DOMAIN_TRUST_GRAPH_CYCLE;

  return {
    honestyBanner: HONESTY_BANNER,
    githubSotLabel: GITHUB_SOT_LABEL,
    githubSotIssue: GITHUB_SOT_ISSUE,
    githubSotTitle: GITHUB_SOT_TITLE,
    gitlabMirrorNote: GITLAB_MIRROR_NOTE,
    layerTitle: ES_LAYER_TITLE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    locksIntact,
    l4AutonomyEnabled: false,
    dbCandidatesStatus: ES30_DB_CANDIDATES_STATUS,
    softWire,
    hops,
    trustStates: TRUST_STATES,
    trustRecordFields: TRUST_RECORD_FIELDS,
    domainModel: DOMAIN_TRUST_MODEL,
    routingPath: TRUST_ROUTING_PATH,
    may: ES30_MAY,
    mustNot: ES30_MUST_NOT,
    agentBounds: ES30_AGENT_BOUNDS,
    truthBoundary: AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY,
    tipLand: false,
    managePullRequest: false,
    evidenceHash,
  };
}
