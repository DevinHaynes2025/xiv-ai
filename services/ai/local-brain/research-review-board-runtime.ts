/**
 * 62L-ER18 — Research Review Board runtime.
 *
 * Multi-role reviews → deny self-approval → quantum classification ceiling →
 * block belief→fact → quarantine unclear/illicit rights → promote only after
 * board decision → neural knowledge graph attach.
 */

import { createHash } from 'node:crypto';
import {
  ER18_AGENT_BOUNDS,
  ER18_DB_CANDIDATES_STATUS,
  ER18_LOCKS,
  ER18_MAY,
  ER18_MUST_NOT,
  ER_LAYER_TITLE,
  EVIDENCE_CLASSES,
  FRESHNESS_STATES,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_CULTURAL_PRESERVE_FIELDS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NON_PROMOTABLE_RIGHTS_STATES,
  QUANTUM_REVIEW_STATES,
  REPRODUCIBILITY_STATES,
  RESEARCH_PROMOTION_FLOW,
  RESEARCH_REVIEW_BOARD_CYCLE,
  RESEARCH_REVIEW_DECISIONS,
  RESEARCH_REVIEW_EVALUATOR_ROLES,
  RESEARCH_REVIEW_FIELDS,
  RIGHTS_STATES,
  TECHNICAL_REVIEW_CHECKS,
  assertEr18LocksIntact,
  er18SoftWireSnapshot,
  isBoardReviewer,
  isHumanEscalationGate,
  isNonPromotableRights,
  isResearchSubmitter,
  quantumReviewStateRank,
  softWireHopState,
  type Er18Actor,
  type Er18EvidenceState,
  type Er18HopRecord,
  type Er18SoftWireSnapshot,
  type EvidenceClass,
  type FreshnessState,
  type HistoricalCulturalPreserveField,
  type QuantumReviewState,
  type ReproducibilityState,
  type ResearchReviewDecision,
  type ResearchReviewEvaluatorRole,
  type RightsState,
  type TechnicalReviewCheck,
} from './research-review-board-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof RESEARCH_REVIEW_BOARD_CYCLE)[number],
  state: Er18EvidenceState,
  summary: string,
): Er18HopRecord {
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
  state: 'DENIED' | 'WAITING_DATA' | 'QUARANTINED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' | 'QUARANTINED' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export type HistoricalCulturalContext = {
  geography: string;
  era: string;
  originalSource: string;
  translationContext: string;
  scholarlyDisagreement: string;
  culturalAttribution: string;
  treatsBeliefAsScientificFact?: boolean;
};

export type TechnicalReviewPacket = {
  commonDataset: boolean;
  baselineComparison: boolean;
  reproducibility: ReproducibilityState;
  hardwareRuntimeVersions: string;
  measurementMethod: string;
  statisticalUncertainty: string;
  regressionRisk: 'low' | 'medium' | 'high' | 'unknown';
};

export type ResearchArtifact = {
  artifactId: string;
  title: string;
  submitterId: string;
  sourceRefs: readonly string[];
  rightsState: RightsState;
  evidenceClass: EvidenceClass;
  confidence: number;
  contradictions: readonly string[];
  reproducibilityState: ReproducibilityState;
  freshness: FreshnessState;
  tenantId: string;
  universeId: string;
  orgId: string;
  claimedQuantumState?: QuantumReviewState;
  supportedQuantumState?: QuantumReviewState;
  historicalCultural?: HistoricalCulturalContext;
  technical?: TechnicalReviewPacket;
  isPrivateOrgFinding?: boolean;
  createdAt: string;
};

export type RoleReviewVote = {
  role: ResearchReviewEvaluatorRole;
  reviewerId: string;
  passed: boolean;
  notes: string;
  at: string;
};

export type ResearchReviewPacket = {
  reviewId: string;
  artifactId: string;
  sourceRefs: readonly string[];
  rightsState: RightsState;
  evidenceClass: EvidenceClass;
  confidence: number;
  contradictions: readonly string[];
  reproducibilityState: ReproducibilityState;
  freshness: FreshnessState;
  tenantUniverse: { tenantId: string; universeId: string; orgId: string };
  reviewers: RoleReviewVote[];
  decision: ResearchReviewDecision;
  conditions: readonly string[];
  expiryRecheckDate: string;
  quantumStateApplied?: QuantumReviewState;
  promotedToNeuralGraph: boolean;
  updatedAt: string;
};

export type NeuralKnowledgeNode = {
  nodeId: string;
  artifactId: string;
  reviewId: string;
  tenantId: string;
  universeId: string;
  decision: ResearchReviewDecision;
  attachedAt: string;
};

export type ReviewBoardStore = {
  artifacts: ResearchArtifact[];
  reviews: ResearchReviewPacket[];
  neuralNodes: NeuralKnowledgeNode[];
};

export function createEmptyReviewBoardStore(): ReviewBoardStore {
  return { artifacts: [], reviews: [], neuralNodes: [] };
}

export function bootstrapResearchReviewBoard(input: {
  actor: Er18Actor;
  repoRoot?: string;
}): {
  ok: true;
  locksIntact: boolean;
  softWire: Er18SoftWireSnapshot;
  roles: typeof RESEARCH_REVIEW_EVALUATOR_ROLES;
  decisions: typeof RESEARCH_REVIEW_DECISIONS;
  flow: typeof RESEARCH_PROMOTION_FLOW;
  quantumStates: typeof QUANTUM_REVIEW_STATES;
  dbStatus: typeof ER18_DB_CANDIDATES_STATUS;
  honesty: typeof HONESTY_BANNER;
  sot: { issue: number; label: string; title: string };
} {
  void input.actor;
  const softWire = er18SoftWireSnapshot(input.repoRoot);
  return {
    ok: true,
    locksIntact: assertEr18LocksIntact(),
    softWire,
    roles: RESEARCH_REVIEW_EVALUATOR_ROLES,
    decisions: RESEARCH_REVIEW_DECISIONS,
    flow: RESEARCH_PROMOTION_FLOW,
    quantumStates: QUANTUM_REVIEW_STATES,
    dbStatus: ER18_DB_CANDIDATES_STATUS,
    honesty: HONESTY_BANNER,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
    },
  };
}

export function submitResearchArtifact(input: {
  actor: Er18Actor;
  store: ReviewBoardStore;
  artifact: Omit<ResearchArtifact, 'createdAt' | 'submitterId'> & {
    submitterId?: string;
  };
}): { ok: true; artifact: ResearchArtifact } | DenialResult {
  if (!isResearchSubmitter(input.actor) && !isHumanEscalationGate(input.actor)) {
    return deny('Only research agents or human gate may submit artifacts.');
  }
  if (
    input.artifact.tenantId !== input.actor.tenantId ||
    input.artifact.universeId !== input.actor.universeId ||
    input.artifact.orgId !== input.actor.orgId
  ) {
    return deny('Guardian/RLS: artifact tenant/Universe/org must match actor.');
  }
  const artifact: ResearchArtifact = {
    ...input.artifact,
    submitterId: input.artifact.submitterId ?? input.actor.id,
    confidence: clamp01(input.artifact.confidence),
    createdAt: nowIso(),
  };
  input.store.artifacts.push(artifact);
  return { ok: true, artifact };
}

export function attemptSelfApproval(input: {
  submitterId: string;
  approverId: string;
}): DenialResult {
  if (input.submitterId === input.approverId) {
    return deny(
      'No single agent can approve its own research — self-approval denied.',
    );
  }
  return deny('Self-approval path closed; use multi-role board.', 'DENIED');
}

export function denySelfApprovalIfSameAgent(input: {
  artifact: ResearchArtifact;
  reviewer: Er18Actor;
}): true | DenialResult {
  if (input.artifact.submitterId === input.reviewer.id) {
    return deny(
      'No single agent can approve its own research — self-approval denied.',
    );
  }
  return true;
}

export function enforceQuantumClassification(input: {
  claimed: QuantumReviewState;
  supported: QuantumReviewState;
}):
  | { ok: true; applied: QuantumReviewState }
  | DenialResult {
  if (quantumReviewStateRank(input.claimed) > quantumReviewStateRank(input.supported)) {
    return deny(
      `Quantum Evidence Reviewer blocks stronger language: claimed ${input.claimed} exceeds supported ${input.supported}.`,
    );
  }
  return { ok: true, applied: input.claimed };
}

export function attemptBeliefAsScientificFact(input: {
  historicalCultural?: HistoricalCulturalContext;
}): DenialResult | { ok: true } {
  if (input.historicalCultural?.treatsBeliefAsScientificFact === true) {
    return deny(
      'Historical/Cultural review blocks belief → scientific fact promotion.',
    );
  }
  return { ok: true };
}

export function quarantineUnclearOrIllicitRights(input: {
  rightsState: RightsState;
}): DenialResult | { ok: true; promotable: true } {
  if (isNonPromotableRights(input.rightsState)) {
    return deny(
      `Rights state ${input.rightsState} cannot promote — quarantined (leaked/stolen/restricted/revoked/unclear).`,
      'QUARANTINED',
    );
  }
  return { ok: true, promotable: true };
}

export function attemptCrossTenantPrivateOrgLeak(input: {
  artifact: ResearchArtifact;
  targetTenantId: string;
  targetUniverseId: string;
}): DenialResult {
  if (
    input.artifact.isPrivateOrgFinding &&
    (input.artifact.tenantId !== input.targetTenantId ||
      input.artifact.universeId !== input.targetUniverseId)
  ) {
    return deny(
      'Private org findings stay in tenant/Universe — cross-tenant leak denied.',
    );
  }
  return deny('Cross-tenant private org path closed.', 'DENIED');
}

export function attemptHiddenChainOfThought(): DenialResult {
  return deny('No hidden chain-of-thought persistence — denied.');
}

export function attemptEnableL4Autonomy(): DenialResult {
  return deny('L4_AUTONOMY_ENABLED=false — autonomy enable denied.');
}

export function probeGuardianRlsTenantUniverseIsolation(input: {
  actor: Er18Actor;
  otherTenantId: string;
  otherUniverseId: string;
}): DenialResult {
  if (
    input.actor.tenantId !== input.otherTenantId ||
    input.actor.universeId !== input.otherUniverseId
  ) {
    return deny('Guardian/RLS tenant/Universe isolation unchanged — access denied.');
  }
  return deny('Isolation probe: same tenant only; no expansion.', 'DENIED');
}

function missingHistoricalFields(
  ctx: HistoricalCulturalContext | undefined,
): HistoricalCulturalPreserveField[] {
  if (!ctx) {
    return [...HISTORICAL_CULTURAL_PRESERVE_FIELDS];
  }
  const missing: HistoricalCulturalPreserveField[] = [];
  for (const field of HISTORICAL_CULTURAL_PRESERVE_FIELDS) {
    const value = ctx[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      missing.push(field);
    }
  }
  return missing;
}

function technicalChecksPassed(tech: TechnicalReviewPacket | undefined): {
  passed: boolean;
  failed: TechnicalReviewCheck[];
} {
  if (!tech) {
    return { passed: false, failed: [...TECHNICAL_REVIEW_CHECKS] };
  }
  const failed: TechnicalReviewCheck[] = [];
  if (!tech.commonDataset) failed.push('common_dataset');
  if (!tech.baselineComparison) failed.push('baseline_comparison');
  if (
    tech.reproducibility === 'NOT_REPRODUCED' ||
    tech.reproducibility === 'UNKNOWN'
  ) {
    failed.push('reproducibility');
  }
  if (!tech.hardwareRuntimeVersions.trim()) {
    failed.push('hardware_runtime_versions');
  }
  if (!tech.measurementMethod.trim()) failed.push('measurement_method');
  if (!tech.statisticalUncertainty.trim()) {
    failed.push('statistical_uncertainty');
  }
  if (tech.regressionRisk === 'high' || tech.regressionRisk === 'unknown') {
    failed.push('regression_risk');
  }
  return { passed: failed.length === 0, failed };
}

export function runRoleReview(input: {
  artifact: ResearchArtifact;
  role: ResearchReviewEvaluatorRole;
  reviewer: Er18Actor;
}): RoleReviewVote | DenialResult {
  const selfCheck = denySelfApprovalIfSameAgent({
    artifact: input.artifact,
    reviewer: input.reviewer,
  });
  if (selfCheck !== true) return selfCheck;

  if (!isBoardReviewer(input.reviewer) && !isHumanEscalationGate(input.reviewer)) {
    return deny('Reviewer is not a board evaluator role.');
  }

  let passed = true;
  let notes = `${input.role} review recorded.`;

  switch (input.role) {
    case 'Data Rights Reviewer': {
      const rights = quarantineUnclearOrIllicitRights({
        rightsState: input.artifact.rightsState,
      });
      if ('denied' in rights) {
        passed = false;
        notes = rights.reason;
      }
      break;
    }
    case 'Provenance Reviewer': {
      if (input.artifact.sourceRefs.length === 0) {
        passed = false;
        notes = 'Provenance requires at least one sourceRef.';
      }
      break;
    }
    case 'Technical Evidence Reviewer':
    case 'Benchmark/Reproducibility Reviewer':
    case 'Domain Specialist Reviewer': {
      const tech = technicalChecksPassed(input.artifact.technical);
      if (!tech.passed) {
        passed = false;
        notes = `Technical checks failed: ${tech.failed.join(', ')}`;
      }
      break;
    }
    case 'Historical Context Reviewer':
    case 'Cultural Context Reviewer': {
      const belief = attemptBeliefAsScientificFact({
        historicalCultural: input.artifact.historicalCultural,
      });
      if ('denied' in belief) {
        passed = false;
        notes = belief.reason;
        break;
      }
      const missing = missingHistoricalFields(input.artifact.historicalCultural);
      if (missing.length > 0) {
        passed = false;
        notes = `Missing historical/cultural fields: ${missing.join(', ')}`;
      }
      break;
    }
    case 'Quantum Evidence Reviewer': {
      if (
        input.artifact.claimedQuantumState &&
        input.artifact.supportedQuantumState
      ) {
        const q = enforceQuantumClassification({
          claimed: input.artifact.claimedQuantumState,
          supported: input.artifact.supportedQuantumState,
        });
        if ('denied' in q) {
          passed = false;
          notes = q.reason;
        }
      } else if (input.artifact.claimedQuantumState) {
        passed = false;
        notes =
          'Quantum claim present without supportedQuantumState evidence ceiling.';
      }
      break;
    }
    case 'Security/Privacy Reviewer': {
      if (isNonPromotableRights(input.artifact.rightsState)) {
        passed = false;
        notes = `Security/privacy blocks rightsState=${input.artifact.rightsState}.`;
      }
      break;
    }
    case 'Human Escalation Gate': {
      if (!isHumanEscalationGate(input.reviewer)) {
        passed = false;
        notes = 'Human Escalation Gate requires human actor.';
      }
      break;
    }
    default:
      break;
  }

  return {
    role: input.role,
    reviewerId: input.reviewer.id,
    passed,
    notes,
    at: nowIso(),
  };
}

export function deriveBoardDecision(input: {
  artifact: ResearchArtifact;
  votes: RoleReviewVote[];
}): {
  decision: ResearchReviewDecision;
  conditions: string[];
} {
  const rightsGate = quarantineUnclearOrIllicitRights({
    rightsState: input.artifact.rightsState,
  });
  if ('denied' in rightsGate) {
    return {
      decision: 'QUARANTINED',
      conditions: [rightsGate.reason],
    };
  }

  if (input.artifact.freshness === 'STALE' || input.artifact.freshness === 'EXPIRED') {
    return {
      decision: 'STALE',
      conditions: [`Freshness=${input.artifact.freshness} — recheck required.`],
    };
  }

  const belief = attemptBeliefAsScientificFact({
    historicalCultural: input.artifact.historicalCultural,
  });
  if ('denied' in belief) {
    return { decision: 'REJECTED', conditions: [belief.reason] };
  }

  if (
    input.artifact.claimedQuantumState &&
    input.artifact.supportedQuantumState
  ) {
    const q = enforceQuantumClassification({
      claimed: input.artifact.claimedQuantumState,
      supported: input.artifact.supportedQuantumState,
    });
    if ('denied' in q) {
      return { decision: 'REJECTED', conditions: [q.reason] };
    }
  }

  if (input.artifact.contradictions.length > 0) {
    return {
      decision: 'REVIEW_REQUIRED',
      conditions: [
        `Unresolved contradictions: ${input.artifact.contradictions.join('; ')}`,
      ],
    };
  }

  const failedVotes = input.votes.filter((v) => !v.passed);
  if (failedVotes.length > 0) {
    return {
      decision: 'REVIEW_REQUIRED',
      conditions: failedVotes.map((v) => `${v.role}: ${v.notes}`),
    };
  }

  const requiredRoles = RESEARCH_REVIEW_EVALUATOR_ROLES.filter(
    (r) => r !== 'Human Escalation Gate',
  );
  const covered = new Set(input.votes.map((v) => v.role));
  const missingRoles = requiredRoles.filter((r) => !covered.has(r));
  if (missingRoles.length > 0) {
    return {
      decision: 'REVIEW_REQUIRED',
      conditions: [`Missing role reviews: ${missingRoles.join(', ')}`],
    };
  }

  const conditions: string[] = [];
  if (
    input.artifact.evidenceClass === 'SPECULATIVE' ||
    input.artifact.evidenceClass === 'DISPUTED' ||
    input.artifact.confidence < 0.7
  ) {
    conditions.push('Limited promotion: speculative/disputed or low confidence.');
    return { decision: 'APPROVED_WITH_LIMITS', conditions };
  }

  if (input.artifact.rightsState === 'PRIVATE_ORG_TENANT') {
    conditions.push('Private org finding — tenant/Universe scoped only.');
    return { decision: 'APPROVED_WITH_LIMITS', conditions };
  }

  return { decision: 'APPROVED', conditions };
}

export function runBoardReview(input: {
  actor: Er18Actor;
  store: ReviewBoardStore;
  artifactId: string;
  reviewers: Array<{ role: ResearchReviewEvaluatorRole; reviewer: Er18Actor }>;
  expiryRecheckDate?: string;
}): { ok: true; packet: ResearchReviewPacket } | DenialResult {
  const artifact = input.store.artifacts.find(
    (a) => a.artifactId === input.artifactId,
  );
  if (!artifact) {
    return deny(`Artifact ${input.artifactId} not found.`, 'WAITING_DATA');
  }

  if (
    artifact.tenantId !== input.actor.tenantId ||
    artifact.universeId !== input.actor.universeId
  ) {
    return deny('Guardian/RLS: cannot review across tenant/Universe.');
  }

  const votes: RoleReviewVote[] = [];
  for (const seat of input.reviewers) {
    const vote = runRoleReview({
      artifact,
      role: seat.role,
      reviewer: seat.reviewer,
    });
    if ('denied' in vote) return vote;
    votes.push(vote);
  }

  const { decision, conditions } = deriveBoardDecision({ artifact, votes });
  let quantumStateApplied: QuantumReviewState | undefined;
  if (
    artifact.claimedQuantumState &&
    artifact.supportedQuantumState &&
    decision !== 'REJECTED' &&
    decision !== 'QUARANTINED'
  ) {
    const q = enforceQuantumClassification({
      claimed: artifact.claimedQuantumState,
      supported: artifact.supportedQuantumState,
    });
    if ('ok' in q) quantumStateApplied = q.applied;
  }

  const packet: ResearchReviewPacket = {
    reviewId: `rrb-${sha256(artifact.artifactId + nowIso()).slice(0, 12)}`,
    artifactId: artifact.artifactId,
    sourceRefs: artifact.sourceRefs,
    rightsState: artifact.rightsState,
    evidenceClass: artifact.evidenceClass,
    confidence: artifact.confidence,
    contradictions: artifact.contradictions,
    reproducibilityState: artifact.reproducibilityState,
    freshness: artifact.freshness,
    tenantUniverse: {
      tenantId: artifact.tenantId,
      universeId: artifact.universeId,
      orgId: artifact.orgId,
    },
    reviewers: votes,
    decision,
    conditions,
    expiryRecheckDate:
      input.expiryRecheckDate ??
      new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    quantumStateApplied,
    promotedToNeuralGraph: false,
    updatedAt: nowIso(),
  };
  input.store.reviews.push(packet);
  return { ok: true, packet };
}

export function promoteAfterBoardDecision(input: {
  actor: Er18Actor;
  store: ReviewBoardStore;
  reviewId: string;
}):
  | { ok: true; node: NeuralKnowledgeNode; packet: ResearchReviewPacket }
  | DenialResult {
  const packet = input.store.reviews.find((r) => r.reviewId === input.reviewId);
  if (!packet) {
    return deny(`Review ${input.reviewId} not found.`, 'WAITING_DATA');
  }

  if (
    packet.tenantUniverse.tenantId !== input.actor.tenantId ||
    packet.tenantUniverse.universeId !== input.actor.universeId
  ) {
    return deny('Guardian/RLS: promotion blocked across tenant/Universe.');
  }

  if (
    packet.decision !== 'APPROVED' &&
    packet.decision !== 'APPROVED_WITH_LIMITS'
  ) {
    return deny(
      `Promotion denied — board decision is ${packet.decision}; only APPROVED / APPROVED_WITH_LIMITS may attach to neural knowledge graph.`,
    );
  }

  // Self-approval check against artifact submitter
  const artifact = input.store.artifacts.find(
    (a) => a.artifactId === packet.artifactId,
  );
  if (artifact && artifact.submitterId === input.actor.id) {
    return deny(
      'No single agent can approve/promote its own research — self-promotion denied.',
    );
  }

  const node: NeuralKnowledgeNode = {
    nodeId: `nkg-${sha256(packet.reviewId).slice(0, 12)}`,
    artifactId: packet.artifactId,
    reviewId: packet.reviewId,
    tenantId: packet.tenantUniverse.tenantId,
    universeId: packet.tenantUniverse.universeId,
    decision: packet.decision,
    attachedAt: nowIso(),
  };
  packet.promotedToNeuralGraph = true;
  packet.updatedAt = nowIso();
  input.store.neuralNodes.push(node);
  return { ok: true, node, packet };
}

export function requireHumanApproval(input: {
  actor: Er18Actor;
  action: string;
}): { ok: true } | DenialResult {
  if (!isHumanEscalationGate(input.actor)) {
    return deny(
      `Human Escalation Gate required before consequential action: ${input.action}`,
      'WAITING_DATA',
    );
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Human actor lacks approve_consequential permission.');
  }
  return { ok: true };
}

export function returnEr18EvidenceToHomeBase(input: {
  reviewId: string;
  decision: ResearchReviewDecision;
}): { receiptId: string; at: string; summary: string } {
  return {
    receiptId: `er18-home-${sha256(input.reviewId).slice(0, 10)}`,
    at: nowIso(),
    summary: `ER18 board decision ${input.decision} returned to home base (advisory; presence≠VERIFIED).`,
  };
}

export function exampleResearchArtifact(actor: Er18Actor): ResearchArtifact {
  return {
    artifactId: 'art-er18-benchmark-1',
    title: 'Bounded classical baseline comparison on public dataset',
    submitterId: actor.id,
    sourceRefs: ['doi:10.0000/er18-example', 'https://example.org/open-benchmark'],
    rightsState: 'OPEN_LICENSE',
    evidenceClass: 'REPRODUCIBLE_BENCHMARK',
    confidence: 0.82,
    contradictions: [],
    reproducibilityState: 'REPRODUCIBLE_WITH_ARTIFACTS',
    freshness: 'CURRENT',
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    orgId: actor.orgId,
    claimedQuantumState: 'SIMULATED',
    supportedQuantumState: 'SIMULATED',
    historicalCultural: {
      geography: 'n/a-lab',
      era: '2026',
      originalSource: 'open benchmark harness',
      translationContext: 'none',
      scholarlyDisagreement: 'none material',
      culturalAttribution: 'n/a',
      treatsBeliefAsScientificFact: false,
    },
    technical: {
      commonDataset: true,
      baselineComparison: true,
      reproducibility: 'REPRODUCIBLE_WITH_ARTIFACTS',
      hardwareRuntimeVersions: 'x86_64 / node22 / cuda-n/a',
      measurementMethod: 'wall-clock + solution quality',
      statisticalUncertainty: '±2% over 30 seeds',
      regressionRisk: 'low',
    },
    isPrivateOrgFinding: false,
    createdAt: nowIso(),
  };
}

export function defaultBoardSeats(input: {
  reviewers: Record<string, Er18Actor>;
}): Array<{ role: ResearchReviewEvaluatorRole; reviewer: Er18Actor }> {
  return [
    {
      role: 'Provenance Reviewer',
      reviewer: input.reviewers.provenance,
    },
    {
      role: 'Data Rights Reviewer',
      reviewer: input.reviewers.rights,
    },
    {
      role: 'Technical Evidence Reviewer',
      reviewer: input.reviewers.technical,
    },
    {
      role: 'Historical Context Reviewer',
      reviewer: input.reviewers.historical,
    },
    {
      role: 'Cultural Context Reviewer',
      reviewer: input.reviewers.cultural,
    },
    {
      role: 'Benchmark/Reproducibility Reviewer',
      reviewer: input.reviewers.benchmark,
    },
    {
      role: 'Security/Privacy Reviewer',
      reviewer: input.reviewers.security,
    },
    {
      role: 'Quantum Evidence Reviewer',
      reviewer: input.reviewers.quantum,
    },
    {
      role: 'Domain Specialist Reviewer',
      reviewer: input.reviewers.domain,
    },
  ];
}

export function runResearchReviewBoardCycle(input: {
  actor: Er18Actor;
  human: Er18Actor;
  repoRoot?: string;
  store?: ReviewBoardStore;
  reviewers?: Record<string, Er18Actor>;
}): {
  hops: Er18HopRecord[];
  softWire: Er18SoftWireSnapshot;
  store: ReviewBoardStore;
  lastPacket?: ResearchReviewPacket;
  lastNode?: NeuralKnowledgeNode;
} {
  const hops: Er18HopRecord[] = [];
  const store = input.store ?? createEmptyReviewBoardStore();
  const softWire = er18SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr18LocksIntact() ? 'PASS' : 'FAIL',
      `L4=${ER18_LOCKS.L4_AUTONOMY_ENABLED}; self-approval=${ER18_LOCKS.SELF_APPROVAL}; tip-land=${ER18_LOCKS.TIP_LAND}; DB=${ER18_DB_CANDIDATES_STATUS}`,
    ),
  );

  const boot = bootstrapResearchReviewBoard({
    actor: input.actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'research_review_board_bootstrap',
      boot.locksIntact ? 'PASS' : 'FAIL',
      `${GITHUB_SOT_LABEL} / #${GITHUB_SOT_ISSUE}; ${ER_LAYER_TITLE}; next=${NEXT_PHASE_TITLE}`,
    ),
  );

  hops.push(
    hop(
      'evaluator_roles_encoded',
      RESEARCH_REVIEW_EVALUATOR_ROLES.length === 10 ? 'PASS' : 'FAIL',
      `roles=${RESEARCH_REVIEW_EVALUATOR_ROLES.length}`,
    ),
  );
  hops.push(
    hop(
      'review_fields_encoded',
      RESEARCH_REVIEW_FIELDS.length === 14 ? 'PASS' : 'FAIL',
      `fields=${RESEARCH_REVIEW_FIELDS.join(',')}`,
    ),
  );
  hops.push(
    hop(
      'decisions_encoded',
      RESEARCH_REVIEW_DECISIONS.length === 6 ? 'PASS' : 'FAIL',
      `decisions=${RESEARCH_REVIEW_DECISIONS.join('|')}`,
    ),
  );
  hops.push(
    hop(
      'promotion_flow_encoded',
      RESEARCH_PROMOTION_FLOW.length === 8 ? 'PASS' : 'FAIL',
      `flow=${RESEARCH_PROMOTION_FLOW.join('→')}`,
    ),
  );
  hops.push(
    hop(
      'quantum_states_encoded',
      QUANTUM_REVIEW_STATES.length === 4 &&
        QUANTUM_REVIEW_STATES[0] === 'THEORETICAL' &&
        QUANTUM_REVIEW_STATES[3] === 'PHYSICAL_QPU_VERIFIED'
        ? 'PASS'
        : 'FAIL',
      `quantum=${QUANTUM_REVIEW_STATES.join('|')}`,
    ),
  );
  hops.push(
    hop(
      'historical_cultural_preserve_encoded',
      HISTORICAL_CULTURAL_PRESERVE_FIELDS.length === 6 ? 'PASS' : 'FAIL',
      `preserve=${HISTORICAL_CULTURAL_PRESERVE_FIELDS.join(',')}`,
    ),
  );
  hops.push(
    hop(
      'technical_checks_encoded',
      TECHNICAL_REVIEW_CHECKS.length === 7 ? 'PASS' : 'FAIL',
      `tech=${TECHNICAL_REVIEW_CHECKS.join(',')}`,
    ),
  );

  const artifact = exampleResearchArtifact(input.actor);
  const submitted = submitResearchArtifact({
    actor: input.actor,
    store,
    artifact,
  });
  hops.push(
    hop(
      'submit_artifact',
      'ok' in submitted ? 'PASS' : 'DENIED',
      'ok' in submitted
        ? `artifact=${submitted.artifact.artifactId}`
        : submitted.reason,
    ),
  );

  const rights = quarantineUnclearOrIllicitRights({
    rightsState: artifact.rightsState,
  });
  hops.push(
    hop(
      'rights_review',
      'ok' in rights ? 'PASS' : 'QUARANTINED',
      'ok' in rights ? `rights=${artifact.rightsState}` : rights.reason,
    ),
  );

  hops.push(
    hop(
      'provenance_review',
      artifact.sourceRefs.length > 0 ? 'PASS' : 'FAIL',
      `sourceRefs=${artifact.sourceRefs.length}`,
    ),
  );

  const tech = technicalChecksPassed(artifact.technical);
  hops.push(
    hop(
      'technical_domain_review',
      tech.passed ? 'PASS' : 'REVIEW_REQUIRED',
      tech.passed ? 'technical checks ok' : `failed=${tech.failed.join(',')}`,
    ),
  );

  const belief = attemptBeliefAsScientificFact({
    historicalCultural: artifact.historicalCultural,
  });
  hops.push(
    hop(
      'historical_cultural_review',
      'ok' in belief ? 'PASS' : 'DENIED',
      'ok' in belief ? 'belief≠fact intact' : belief.reason,
    ),
  );

  const quantum = enforceQuantumClassification({
    claimed: artifact.claimedQuantumState ?? 'THEORETICAL',
    supported: artifact.supportedQuantumState ?? 'THEORETICAL',
  });
  hops.push(
    hop(
      'quantum_evidence_review',
      'ok' in quantum ? 'PASS' : 'DENIED',
      'ok' in quantum
        ? `applied=${quantum.applied}`
        : quantum.reason,
    ),
  );

  hops.push(
    hop(
      'contradiction_check',
      artifact.contradictions.length === 0 ? 'PASS' : 'REVIEW_REQUIRED',
      `contradictions=${artifact.contradictions.length}`,
    ),
  );

  hops.push(
    hop(
      'security_privacy_review',
      !isNonPromotableRights(artifact.rightsState) ? 'PASS' : 'QUARANTINED',
      `nonPromotableRights=${NON_PROMOTABLE_RIGHTS_STATES.join('|')}; rightsCatalog=${RIGHTS_STATES.length}; evidenceClasses=${EVIDENCE_CLASSES.length}; repro=${REPRODUCIBILITY_STATES.length}; freshness=${FRESHNESS_STATES.length}`,
    ),
  );

  const selfDeny = attemptSelfApproval({
    submitterId: artifact.submitterId,
    approverId: artifact.submitterId,
  });
  hops.push(
    hop(
      'deny_self_approval',
      selfDeny.denied ? 'DENIED' : 'FAIL',
      selfDeny.reason,
    ),
  );

  const mkReviewer = (
    kind: Er18Actor['kind'],
    id: string,
  ): Er18Actor => ({
    kind,
    id,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    permissions: ['review'],
  });

  const reviewers =
    input.reviewers ??
    ({
      provenance: mkReviewer('provenance_reviewer', 'rev-prov-1'),
      rights: mkReviewer('data_rights_reviewer', 'rev-rights-1'),
      technical: mkReviewer('technical_evidence_reviewer', 'rev-tech-1'),
      historical: mkReviewer('historical_context_reviewer', 'rev-hist-1'),
      cultural: mkReviewer('cultural_context_reviewer', 'rev-cult-1'),
      benchmark: mkReviewer('benchmark_reproducibility_reviewer', 'rev-bench-1'),
      security: mkReviewer('security_privacy_reviewer', 'rev-sec-1'),
      quantum: mkReviewer('quantum_evidence_reviewer', 'rev-q-1'),
      domain: mkReviewer('domain_specialist_reviewer', 'rev-dom-1'),
    } as Record<string, Er18Actor>);

  let lastPacket: ResearchReviewPacket | undefined;
  let lastNode: NeuralKnowledgeNode | undefined;

  const board = runBoardReview({
    actor: input.human,
    store,
    artifactId: artifact.artifactId,
    reviewers: defaultBoardSeats({ reviewers }),
  });
  if ('ok' in board) {
    lastPacket = board.packet;
    hops.push(
      hop(
        'board_decision',
        board.packet.decision === 'APPROVED' ||
          board.packet.decision === 'APPROVED_WITH_LIMITS'
          ? board.packet.decision
          : board.packet.decision,
        `decision=${board.packet.decision}; conditions=${board.packet.conditions.length}`,
      ),
    );

    const humanOk = requireHumanApproval({
      actor: input.human,
      action: 'promote_to_neural_knowledge_graph',
    });
    if ('ok' in humanOk) {
      const promo = promoteAfterBoardDecision({
        actor: input.human,
        store,
        reviewId: board.packet.reviewId,
      });
      if ('ok' in promo) {
        lastNode = promo.node;
        hops.push(
          hop(
            'promotion_gate',
            'PASS',
            `promoted review=${promo.packet.reviewId}`,
          ),
        );
        hops.push(
          hop(
            'neural_knowledge_graph_attach',
            'PASS',
            `node=${promo.node.nodeId}`,
          ),
        );
      } else {
        hops.push(hop('promotion_gate', 'DENIED', promo.reason));
        hops.push(
          hop(
            'neural_knowledge_graph_attach',
            'DENIED',
            'promotion blocked — no neural attach',
          ),
        );
      }
    } else {
      hops.push(hop('promotion_gate', 'HUMAN_APPROVAL_REQUIRED', humanOk.reason));
      hops.push(
        hop(
          'neural_knowledge_graph_attach',
          'HUMAN_APPROVAL_REQUIRED',
          'awaiting human gate',
        ),
      );
    }
  } else {
    hops.push(hop('board_decision', 'DENIED', board.reason));
    hops.push(hop('promotion_gate', 'DENIED', 'no board packet'));
    hops.push(
      hop('neural_knowledge_graph_attach', 'DENIED', 'no board packet'),
    );
  }

  const softPairs: Array<
    [(typeof RESEARCH_REVIEW_BOARD_CYCLE)[number], SoftWirePresenceLike]
  > = [
    ['er17_soft_wire', softWire.er17AutonomousResearchSwarm],
    ['er16_soft_wire', softWire.er16LearningReturnReceipt],
    ['er15_soft_wire', softWire.er15OnlineOfflineSyncContract],
    ['er14_soft_wire', softWire.er14OfflineBrainPackager],
    ['er13_soft_wire', softWire.er13OnlineBrainIndex],
    ['er12_soft_wire', softWire.er12LiveDataConnectorGate],
    ['er11_soft_wire', softWire.er11PublicGovernmentDataPack],
    ['er10_soft_wire', softWire.er10PublicGeospatialMobilityPack],
    ['er9_soft_wire', softWire.er9PublicLawPolicyKnowledgePack],
    ['er8_soft_wire', softWire.er8AncientCivilizationsKnowledgePack],
    ['er7_soft_wire', softWire.er7HistoricalScienceEngineeringAtlas],
    ['er6_soft_wire', softWire.er6HistoricalBusinessCaseAtlasV2],
    ['er5_soft_wire', softWire.er5GlobalHistoricalKnowledgeIngestion],
    ['er4_soft_wire', softWire.er4RightsProvenanceGate],
    ['er3_soft_wire', softWire.er3PublicDataSourceRegistry],
    ['er2_soft_wire', softWire.er2ApiTruthStateMachine],
    ['er1_soft_wire', softWire.er1RealApiConnectionRegistry],
    ['eq16_soft_wire', softWire.eq16SoftwareWormholeRouter],
    ['eq15_soft_wire', softWire.eq15PathwayPlasticity],
    ['eq14_soft_wire', softWire.eq14NeuralPathwayArchitectureGraph],
    ['eq13_soft_wire', softWire.eq13ArchitectureReturnReceipt],
    ['eq12_soft_wire', softWire.eq12CrossArchitectureBenchmarkMatrix],
    ['ep15_soft_wire', softWire.ep15AlgorithmTuningSandbox],
    ['em157_soft_wire', softWire.em157HomeBase],
  ];

  for (const [name, presence] of softPairs) {
    hops.push(
      hop(name, softWireHopState(presence.present), presence.note),
    );
  }

  hops.push(
    hop(
      'cycle_complete',
      'PASS',
      `MAY=${ER18_MAY.length}; MUST_NOT=${ER18_MUST_NOT.length}; gitlab=${GITLAB_MIRROR_NOTE.slice(0, 48)}…; title=${GITHUB_SOT_TITLE.slice(0, 48)}…`,
    ),
  );

  return { hops, softWire, store, lastPacket, lastNode };
}

type SoftWirePresenceLike = { present: boolean; note: string };
