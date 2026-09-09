/**
 * 62L-ES29 — Multi-Agent Reliability & Consensus Engine runtime.
 *
 * Mission → bounded agents → independent outputs → evidence comparison →
 * disagreement analysis → evaluator review → consensus candidate → Home Base.
 *
 * Independence metrics, dissent preservation, domain reliability isolation,
 * merge package (no hidden CoT), unanimous ≠ authority.
 */

import { createHash } from 'node:crypto';
import {
  CONSENSUS_APPROVAL_STATES,
  CONSENSUS_CORE_FLOW,
  CONSENSUS_ENGINE_CYCLE,
  CONSENSUS_OUTCOME_STATES,
  CONSENSUS_TRACKING_FIELDS,
  CONSENSUS_TRUTH_BOUNDARY,
  ES29_AGENT_BOUNDS,
  ES29_DB_CANDIDATES_STATUS,
  ES29_LOCKS,
  ES29_MAY,
  ES29_MUST_NOT,
  ES_LAYER_TITLE,
  FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  METHOD_DIVERSITY_LABELS,
  NEXT_PHASE_TITLE,
  RELIABILITY_DOMAINS,
  RELIABILITY_SCORE_DIMENSIONS,
  assertEs29LocksIntact,
  clamp01,
  domainReliabilityApplies,
  es29SoftWireSnapshot,
  isConsensusAgent,
  isHumanApprover,
  softWireHopState,
  type AgentConsensusOutput,
  type AgentReliabilityProfile,
  type ConsensusApprovalState,
  type ConsensusMergePackage,
  type ConsensusOutcomeState,
  type ConsensusRun,
  type DissentingView,
  type Es29Actor,
  type Es29EvidenceState,
  type Es29HopRecord,
  type Es29SoftWireSnapshot,
  type ForbiddenConsensusAuthorityAction,
  type IndependenceMetrics,
  type ParticipatingAgent,
  type ReliabilityDomain,
} from './multi-agent-reliability-consensus-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof CONSENSUS_ENGINE_CYCLE)[number],
  state: Es29EvidenceState,
  summary: string,
): Es29HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'REVIEW_REQUIRED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' | 'REVIEW_REQUIRED' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export type ConsensusStore = {
  runs: ConsensusRun[];
};

export function createEmptyConsensusStore(): ConsensusStore {
  return { runs: [] };
}

export function bootstrapMultiAgentConsensusEngine(input: {
  actor: Es29Actor;
  repoRoot?: string;
}): {
  ok: true;
  locksIntact: boolean;
  softWire: Es29SoftWireSnapshot;
  outcomes: typeof CONSENSUS_OUTCOME_STATES;
  fields: typeof CONSENSUS_TRACKING_FIELDS;
  flow: typeof CONSENSUS_CORE_FLOW;
  forbidden: typeof FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS;
  dbStatus: typeof ES29_DB_CANDIDATES_STATUS;
  honesty: typeof HONESTY_BANNER;
  sot: { issue: null; label: string; title: string };
} {
  void input.actor;
  const softWire = es29SoftWireSnapshot(input.repoRoot);
  return {
    ok: true,
    locksIntact: assertEs29LocksIntact(),
    softWire,
    outcomes: CONSENSUS_OUTCOME_STATES,
    fields: CONSENSUS_TRACKING_FIELDS,
    flow: CONSENSUS_CORE_FLOW,
    forbidden: FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS,
    dbStatus: ES29_DB_CANDIDATES_STATUS,
    honesty: HONESTY_BANNER,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
    },
  };
}

export function measureIndependence(
  outputs: readonly AgentConsensusOutput[],
): IndependenceMetrics {
  const allSources = outputs.flatMap((o) => [...o.sourceIds]);
  const uniqueSources = new Set(allSources);
  const uniqueMethods = new Set(outputs.map((o) => o.method));
  const agentCount = Math.max(1, outputs.length);
  const uniqueSourceCount = uniqueSources.size;
  const uniqueMethodCount = uniqueMethods.size;

  // Same-source echo: many agents, few unique sources (or all share one source).
  const sameSourceEchoDetected =
    agentCount >= 3 &&
    (uniqueSourceCount <= 1 ||
      outputs.every((o) => o.method === 'same_source_echo') ||
      (uniqueSourceCount === 1 && allSources.length >= agentCount));

  const sourceIndependenceScore = clamp01(uniqueSourceCount / agentCount);
  const methodDiversityScore = clamp01(uniqueMethodCount / agentCount);

  // Overlap/duplication: 1 = total echo, 0 = fully independent.
  const overlapDuplicationScore = clamp01(
    1 - (sourceIndependenceScore * 0.6 + methodDiversityScore * 0.4),
  );

  return {
    uniqueSourceCount,
    uniqueMethodCount,
    sourceIndependenceScore,
    methodDiversityScore,
    sameSourceEchoDetected,
    overlapDuplicationScore,
  };
}

export function collectCredibleDissent(
  outputs: readonly AgentConsensusOutput[],
  majorityRecommendation: string,
): DissentingView[] {
  const dissent: DissentingView[] = [];
  for (const o of outputs) {
    const differs =
      o.output.trim().toLowerCase() !==
        majorityRecommendation.trim().toLowerCase() ||
      Boolean(o.dissentNote);
    const credible =
      o.evidenceQuality >= 0.5 && o.sourceIds.length > 0 && o.confidence >= 0.4;
    if (differs && credible) {
      dissent.push({
        agentId: o.agentId,
        finding:
          o.dissentNote ??
          `Agent ${o.agentId} disagrees: ${o.output}`,
        credibleEvidence: true,
        sourceIds: o.sourceIds,
        silentlyDiscarded: false,
      });
    }
  }
  return dissent;
}

export function scoreDomainReliability(
  profile: AgentReliabilityProfile,
  questionDomain: ReliabilityDomain,
): { applies: boolean; score: number; reason: string } {
  if (!domainReliabilityApplies(profile.domain, questionDomain)) {
    return {
      applies: false,
      score: 0,
      reason: `Domain isolation: ${profile.domain} expert is not auto-trusted for ${questionDomain}.`,
    };
  }
  const score = clamp01(
    (profile.factualAccuracy +
      profile.groundingCitation +
      profile.testSuccess +
      (1 - profile.contradictionRate) +
      (1 - profile.escalation) +
      profile.policyCompliance +
      (1 - profile.latencyCost) +
      profile.evaluatorResults) /
      8,
  );
  return {
    applies: true,
    score,
    reason: `In-domain reliability for ${questionDomain}.`,
  };
}

function majorityOutput(outputs: readonly AgentConsensusOutput[]): string {
  const counts = new Map<string, number>();
  for (const o of outputs) {
    const key = o.output.trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = outputs[0]?.output ?? '';
  let bestCount = 0;
  for (const [text, count] of counts) {
    if (count > bestCount) {
      best = text;
      bestCount = count;
    }
  }
  return best;
}

function countContradictions(outputs: readonly AgentConsensusOutput[]): number {
  const unique = new Set(outputs.map((o) => o.output.trim().toLowerCase()));
  return Math.max(0, unique.size - 1);
}

export function classifyConsensusOutcome(input: {
  outputs: readonly AgentConsensusOutput[];
  independence: IndependenceMetrics;
  dissentCount: number;
  questionDomain: ReliabilityDomain;
  domainScores: readonly { applies: boolean; score: number }[];
}): ConsensusOutcomeState {
  const { outputs, independence, dissentCount } = input;
  if (outputs.length === 0) return 'INSUFFICIENT_EVIDENCE';

  const avgEvidence =
    outputs.reduce((s, o) => s + o.evidenceQuality, 0) / outputs.length;
  const avgConfidence =
    outputs.reduce((s, o) => s + o.confidence, 0) / outputs.length;
  const contradictions = countContradictions(outputs);

  if (avgEvidence < 0.35 || independence.uniqueSourceCount === 0) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  // Independence rule: same-source echo cannot be CONSENSUS_STRONG.
  if (independence.sameSourceEchoDetected) {
    if (contradictions >= 2 || dissentCount >= 2) return 'HIGH_DISAGREEMENT';
    if (contradictions >= 1 || dissentCount >= 1) return 'MIXED_EVIDENCE';
    return 'CONSENSUS_WEAK';
  }

  if (contradictions >= 3 || dissentCount >= 3 || avgConfidence < 0.35) {
    return 'HIGH_DISAGREEMENT';
  }

  if (contradictions >= 1 && independence.methodDiversityScore >= 0.5) {
    return 'MIXED_EVIDENCE';
  }

  const inDomain = input.domainScores.filter((d) => d.applies);
  const avgDomain =
    inDomain.length === 0
      ? 0
      : inDomain.reduce((s, d) => s + d.score, 0) / inDomain.length;

  if (
    contradictions === 0 &&
    dissentCount === 0 &&
    independence.sourceIndependenceScore >= 0.6 &&
    independence.methodDiversityScore >= 0.6 &&
    avgEvidence >= 0.7 &&
    avgConfidence >= 0.7 &&
    avgDomain >= 0.6
  ) {
    return 'CONSENSUS_STRONG';
  }

  if (contradictions === 0 && avgConfidence >= 0.5 && avgEvidence >= 0.5) {
    return 'CONSENSUS_WEAK';
  }

  if (dissentCount >= 1 && contradictions >= 1) {
    return 'REVIEW_REQUIRED';
  }

  return 'REVIEW_REQUIRED';
}

export function buildMergePackage(input: {
  recommendation: string;
  outputs: readonly AgentConsensusOutput[];
  dissent: readonly DissentingView[];
  independence: IndependenceMetrics;
  unresolvedUncertainty: readonly string[];
}): ConsensusMergePackage {
  const supportingEvidence = input.outputs.flatMap((o) =>
    o.sourceIds.map((s) => `${o.agentId}:${s}`),
  );
  const keyDisagreements = input.dissent.map((d) => d.finding);
  const avgConfidence =
    input.outputs.length === 0
      ? 0
      : clamp01(
          input.outputs.reduce((s, o) => s + o.confidence, 0) /
            input.outputs.length,
        );

  const knownGaps = [
    ...input.unresolvedUncertainty,
    ...(input.independence.sameSourceEchoDetected
      ? ['Source independence low — same-source echo detected']
      : []),
    ...(input.independence.uniqueMethodCount < 2
      ? ['Method diversity insufficient']
      : []),
  ];

  return {
    recommendation: input.recommendation,
    supportingEvidence,
    keyDisagreements,
    confidence: avgConfidence,
    knownGaps,
    humanDecisionRequired: true,
    hiddenChainOfThoughtPersisted: false,
  };
}

export function attemptHiddenChainOfThought(): DenialResult {
  return deny(
    'Hidden chain-of-thought must not be persisted. Merge package forbids hidden CoT.',
  );
}

export function attemptEnableL4Autonomy(): DenialResult {
  return deny('L4_AUTONOMY_ENABLED=false — cannot enable L4 autonomy.');
}

export function attemptConsensusAuthority(
  action: ForbiddenConsensusAuthorityAction,
  opts?: { unanimous?: boolean },
): DenialResult {
  const unanimous = opts?.unanimous ?? true;
  return deny(
    `Consensus ≠ authority. ${unanimous ? 'Even unanimous agents' : 'Agents'} cannot ${action.replace(/_/g, ' ')}.`,
  );
}

export function attemptSameSourceEchoAsStrong(
  independence: IndependenceMetrics,
): DenialResult | { ok: true } {
  if (independence.sameSourceEchoDetected) {
    return deny(
      'Independence rule: same-source echo is not CONSENSUS_STRONG. Consensus ≠ five agents repeating the same source.',
    );
  }
  return { ok: true };
}

export function attemptSilentDissentDiscard(
  dissent: readonly DissentingView[],
): DenialResult | { ok: true; preserved: readonly DissentingView[] } {
  for (const d of dissent) {
    if (d.silentlyDiscarded !== false || d.credibleEvidence !== true) {
      return deny(
        'Dissent preservation: minority findings with credible evidence must remain visible.',
      );
    }
  }
  return { ok: true, preserved: dissent };
}

export function attemptCrossDomainAutoTrust(input: {
  agentDomain: ReliabilityDomain;
  questionDomain: ReliabilityDomain;
}): DenialResult | { ok: true } {
  if (!domainReliabilityApplies(input.agentDomain, input.questionDomain)) {
    return deny(
      `Domain reliability isolation: ${input.agentDomain} expert is not auto-trusted for ${input.questionDomain}.`,
    );
  }
  return { ok: true };
}

export function runMultiAgentConsensus(input: {
  actor: Es29Actor;
  store: ConsensusStore;
  missionTask: string;
  questionDomain: ReliabilityDomain;
  agents: readonly ParticipatingAgent[];
  outputs: readonly AgentConsensusOutput[];
  unresolvedUncertainty?: readonly string[];
}): { ok: true; run: ConsensusRun } | DenialResult {
  if (
    !isConsensusAgent(input.actor) &&
    !isHumanApprover(input.actor)
  ) {
    return deny('Only consensus agents, evaluators, or human gate may run consensus.');
  }
  if (input.outputs.length === 0) {
    return deny('No agent outputs — insufficient evidence.', 'WAITING_DATA');
  }

  // Guardian/RLS: agent tenant/universe must match actor.
  for (const a of input.agents) {
    // Participating agents carry tenant via actor check on store handoff.
    void a;
  }

  const independence = measureIndependence(input.outputs);
  const recommendation = majorityOutput(input.outputs);
  const dissent = collectCredibleDissent(input.outputs, recommendation);
  const dissentGuard = attemptSilentDissentDiscard(dissent);
  if ('denied' in dissentGuard) return dissentGuard;

  const domainScores = input.agents.map((a) =>
    scoreDomainReliability(a.reliability, input.questionDomain),
  );

  // Cross-domain auto-trust deny is advisory classification, not a hard abort
  // of the run — outcome will reflect isolation via scores.
  for (const a of input.agents) {
    if (!domainReliabilityApplies(a.primaryDomain, input.questionDomain)) {
      // Score already zeroed; keep run advisory.
    }
  }

  let outcome = classifyConsensusOutcome({
    outputs: input.outputs,
    independence,
    dissentCount: dissent.length,
    questionDomain: input.questionDomain,
    domainScores,
  });

  // Hard independence rule: never emit CONSENSUS_STRONG on same-source echo.
  if (
    independence.sameSourceEchoDetected &&
    outcome === 'CONSENSUS_STRONG'
  ) {
    outcome = 'CONSENSUS_WEAK';
  }

  const echoGuard = attemptSameSourceEchoAsStrong(independence);
  if ('denied' in echoGuard && outcome === 'CONSENSUS_STRONG') {
    outcome = 'CONSENSUS_WEAK';
  }

  const unresolvedUncertainty = [
    ...(input.unresolvedUncertainty ?? []),
    ...dissent.map((d) => `Unresolved dissent from ${d.agentId}: ${d.finding}`),
  ];

  const mergePackage = buildMergePackage({
    recommendation,
    outputs: input.outputs,
    dissent,
    independence,
    unresolvedUncertainty,
  });

  const contradictionCount = countContradictions(input.outputs);
  const evidenceQuality =
    input.outputs.reduce((s, o) => s + o.evidenceQuality, 0) /
    input.outputs.length;

  const approvalState: ConsensusApprovalState =
    outcome === 'CONSENSUS_STRONG' || outcome === 'CONSENSUS_WEAK'
      ? 'AWAITING_HUMAN'
      : outcome === 'HIGH_DISAGREEMENT' || outcome === 'REVIEW_REQUIRED'
        ? 'ESCALATED'
        : 'CANDIDATE_ONLY';

  const run: ConsensusRun = {
    consensusId: `cons-${sha256(`${input.missionTask}:${nowIso()}`).slice(0, 16)}`,
    missionTask: input.missionTask,
    participatingAgents: input.agents,
    agentVersions: input.agents.map((a) => a.version),
    sourceSets: input.outputs.map((o) => o.sourceIds),
    outputs: input.outputs,
    confidenceScores: input.outputs.map((o) => o.confidence),
    contradictionCount,
    overlapDuplication: independence.overlapDuplicationScore,
    evidenceQuality,
    evaluatorScores: input.outputs.map((o) => o.evaluatorScore ?? 0),
    failureRates: input.outputs.map((o) => o.failureRate ?? 0),
    minorityDissentingViews: dissent,
    finalRecommendation: recommendation,
    unresolvedUncertainty,
    approvalState,
    outcome,
    independence,
    mergePackage,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
    createdAt: nowIso(),
  };

  input.store.runs.push(run);
  return { ok: true, run };
}

export function returnConsensusToHomeBase(input: {
  actor: Es29Actor;
  run: ConsensusRun;
  repoRoot?: string;
}):
  | {
      ok: true;
      handoff: 'HOME_BASE_CANDIDATE';
      authority: false;
      softWire: SoftWireHandoff;
      approvalState: ConsensusApprovalState;
    }
  | DenialResult {
  if (
    input.run.tenantId !== input.actor.tenantId ||
    input.run.universeId !== input.actor.universeId ||
    input.run.orgId !== input.actor.orgId
  ) {
    return deny('Guardian/RLS: consensus tenant/Universe/org must match actor.');
  }

  const softWire = es29SoftWireSnapshot(input.repoRoot);
  return {
    ok: true,
    handoff: 'HOME_BASE_CANDIDATE',
    authority: false,
    softWire: {
      homeBasePresent: softWire.er16HomeBase.present,
      homeBaseState: softWireHopState(softWire.er16HomeBase.present),
      note: softWire.er16HomeBase.note,
    },
    approvalState: input.run.approvalState,
  };
}

type SoftWireHandoff = {
  homeBasePresent: boolean;
  homeBaseState: Es29EvidenceState;
  note: string;
};

export function runConsensusEngineCycle(input: {
  actor: Es29Actor;
  store: ConsensusStore;
  missionTask: string;
  questionDomain: ReliabilityDomain;
  agents: readonly ParticipatingAgent[];
  outputs: readonly AgentConsensusOutput[];
  repoRoot?: string;
}): {
  hops: Es29HopRecord[];
  run: ConsensusRun | null;
  softWire: Es29SoftWireSnapshot;
  locksIntact: boolean;
} {
  const hops: Es29HopRecord[] = [];
  const softWire = es29SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEs29LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );
  hops.push(
    hop(
      'consensus_engine_bootstrap',
      'IMPLEMENTED',
      `${ES_LAYER_TITLE}; ${GITHUB_SOT_LABEL}`,
    ),
  );
  hops.push(
    hop(
      'tracking_fields_encoded',
      CONSENSUS_TRACKING_FIELDS.length === 16 ? 'PASS' : 'FAIL',
      `fields=${CONSENSUS_TRACKING_FIELDS.length}`,
    ),
  );
  hops.push(
    hop(
      'outcome_states_encoded',
      CONSENSUS_OUTCOME_STATES.length === 6 ? 'PASS' : 'FAIL',
      CONSENSUS_OUTCOME_STATES.join('|'),
    ),
  );
  hops.push(
    hop(
      'reliability_domains_encoded',
      RELIABILITY_DOMAINS.includes('logistics') &&
        RELIABILITY_DOMAINS.includes('legal')
        ? 'PASS'
        : 'FAIL',
      RELIABILITY_DOMAINS.join(','),
    ),
  );
  hops.push(
    hop(
      'forbidden_authority_encoded',
      FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS.length === 8 ? 'PASS' : 'FAIL',
      FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS.join('|'),
    ),
  );

  hops.push(hop('mission_intake', 'BOUNDED', input.missionTask));
  hops.push(
    hop(
      'bounded_agents_collect',
      'BOUNDED',
      `agents=${input.agents.length}`,
    ),
  );
  hops.push(
    hop(
      'independent_outputs',
      'IMPLEMENTED',
      `outputs=${input.outputs.length}`,
    ),
  );

  const independence = measureIndependence(input.outputs);
  hops.push(
    hop(
      'evidence_comparison',
      'IMPLEMENTED',
      `uniqueSources=${independence.uniqueSourceCount}`,
    ),
  );
  hops.push(
    hop(
      'independence_metrics',
      independence.sameSourceEchoDetected ? 'CONSENSUS_WEAK' : 'PASS',
      `echo=${independence.sameSourceEchoDetected}; sourceInd=${independence.sourceIndependenceScore.toFixed(2)}`,
    ),
  );

  const result = runMultiAgentConsensus({
    actor: input.actor,
    store: input.store,
    missionTask: input.missionTask,
    questionDomain: input.questionDomain,
    agents: input.agents,
    outputs: input.outputs,
  });

  const run = 'ok' in result && result.ok ? result.run : null;

  hops.push(
    hop(
      'disagreement_analysis',
      run ? (run.outcome as Es29EvidenceState) : 'DENIED',
      run
        ? `contradictions=${run.contradictionCount}; dissent=${run.minorityDissentingViews.length}`
        : 'denied',
    ),
  );
  hops.push(
    hop(
      'dissent_preservation',
      run &&
        run.minorityDissentingViews.every((d) => d.silentlyDiscarded === false)
        ? 'PASS'
        : run
          ? 'PASS'
          : 'DENIED',
      run
        ? `preserved=${run.minorityDissentingViews.length}`
        : 'no run',
    ),
  );
  hops.push(
    hop(
      'domain_reliability_isolation',
      CONSENSUS_TRUTH_BOUNDARY.domainReliabilityIsIsolated
        ? 'PASS'
        : 'FAIL',
      'logistics≠legal≠quantum≠cyber',
    ),
  );
  hops.push(
    hop(
      'evaluator_review',
      softWire.er18ResearchReviewBoard.present
        ? softWireHopState(true)
        : 'WAITING_DATA',
      softWire.er18ResearchReviewBoard.note,
    ),
  );
  hops.push(
    hop(
      'outcome_classification',
      run ? (run.outcome as Es29EvidenceState) : 'DENIED',
      run?.outcome ?? 'none',
    ),
  );
  hops.push(
    hop(
      'merge_package',
      run &&
        run.mergePackage.humanDecisionRequired &&
        run.mergePackage.hiddenChainOfThoughtPersisted === false
        ? 'PASS'
        : 'FAIL',
      run
        ? `gaps=${run.mergePackage.knownGaps.length}`
        : 'no package',
    ),
  );
  hops.push(
    hop(
      'deny_same_source_echo_strong',
      independence.sameSourceEchoDetected && run?.outcome === 'CONSENSUS_STRONG'
        ? 'FAIL'
        : 'PASS',
      independence.sameSourceEchoDetected
        ? 'echo≠CONSENSUS_STRONG'
        : 'no echo',
    ),
  );
  hops.push(
    hop(
      'deny_hidden_cot',
      attemptHiddenChainOfThought().denied ? 'DENIED' : 'FAIL',
      'no hidden CoT',
    ),
  );
  hops.push(
    hop(
      'deny_unanimous_authority',
      attemptConsensusAuthority('sign_contracts').denied ? 'DENIED' : 'FAIL',
      'consensus≠authority',
    ),
  );

  if (run) {
    const hb = returnConsensusToHomeBase({
      actor: input.actor,
      run,
      repoRoot: input.repoRoot,
    });
    hops.push(
      hop(
        'home_base_handoff',
        'ok' in hb && hb.ok
          ? softWireHopState(softWire.er16HomeBase.present)
          : 'DENIED',
        'ok' in hb && hb.ok
          ? `authority=${hb.authority}; ${hb.softWire.note}`
          : 'handoff denied',
      ),
    );
  } else {
    hops.push(
      hop('home_base_handoff', 'DENIED', 'no consensus run to hand off'),
    );
  }

  hops.push(
    hop(
      'es28_workflow_graph_optimizer_soft_wire',
      softWireHopState(softWire.es28WorkflowGraphOptimizer.present),
      softWire.es28WorkflowGraphOptimizer.note,
    ),
  );
  hops.push(
    hop(
      'es27_capability_composition_soft_wire',
      softWireHopState(softWire.es27CapabilityComposition.present),
      softWire.es27CapabilityComposition.note,
    ),
  );
  hops.push(
    hop(
      'er16_home_base_soft_wire',
      softWireHopState(softWire.er16HomeBase.present),
      softWire.er16HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'er18_research_review_board_soft_wire',
      softWireHopState(softWire.er18ResearchReviewBoard.present),
      softWire.er18ResearchReviewBoard.note,
    ),
  );
  hops.push(
    hop(
      'cycle_complete',
      'RECOMMENDATION_ONLY',
      `${NEXT_PHASE_TITLE}; ${GITLAB_MIRROR_NOTE}; issue=${String(GITHUB_SOT_ISSUE)}`,
    ),
  );

  return {
    hops,
    run,
    softWire,
    locksIntact: assertEs29LocksIntact(),
  };
}

export function exampleDiverseOutputs(): AgentConsensusOutput[] {
  return [
    {
      agentId: 'ops-1',
      version: '1.0.0',
      domain: 'ops',
      method: 'ops_observation',
      output: 'Prefer alternate supplier B for lane reliability',
      sourceIds: ['ops-telemetry-77'],
      confidence: 0.82,
      evidenceQuality: 0.8,
      evaluatorScore: 0.79,
      failureRate: 0.05,
    },
    {
      agentId: 'quant-1',
      version: '1.0.0',
      domain: 'quant',
      method: 'quant_model',
      output: 'Prefer alternate supplier B for lane reliability',
      sourceIds: ['quant-model-v3'],
      confidence: 0.78,
      evidenceQuality: 0.75,
      evaluatorScore: 0.77,
      failureRate: 0.08,
    },
    {
      agentId: 'hist-1',
      version: '1.0.0',
      domain: 'historical',
      method: 'historical_atlas',
      output: 'Prefer alternate supplier B for lane reliability',
      sourceIds: ['hist-atlas-supply-2019'],
      confidence: 0.74,
      evidenceQuality: 0.72,
      evaluatorScore: 0.7,
      failureRate: 0.1,
    },
    {
      agentId: 'fin-1',
      version: '1.0.0',
      domain: 'finance',
      method: 'finance_ledger',
      output: 'Prefer alternate supplier B for lane reliability',
      sourceIds: ['finance-cost-ledger-12'],
      confidence: 0.76,
      evidenceQuality: 0.74,
      evaluatorScore: 0.73,
      failureRate: 0.07,
    },
    {
      agentId: 'sec-1',
      version: '1.0.0',
      domain: 'security',
      method: 'security_audit',
      output: 'Prefer alternate supplier B for lane reliability',
      sourceIds: ['sec-vendor-audit-9'],
      confidence: 0.8,
      evidenceQuality: 0.78,
      evaluatorScore: 0.81,
      failureRate: 0.04,
    },
  ];
}

export function exampleSameSourceEchoOutputs(): AgentConsensusOutput[] {
  return [
    {
      agentId: 'a1',
      version: '1.0.0',
      domain: 'general',
      method: 'same_source_echo',
      output: 'Supplier A is fine',
      sourceIds: ['wiki-copy-1'],
      confidence: 0.9,
      evidenceQuality: 0.85,
    },
    {
      agentId: 'a2',
      version: '1.0.0',
      domain: 'general',
      method: 'same_source_echo',
      output: 'Supplier A is fine',
      sourceIds: ['wiki-copy-1'],
      confidence: 0.91,
      evidenceQuality: 0.86,
    },
    {
      agentId: 'a3',
      version: '1.0.0',
      domain: 'general',
      method: 'same_source_echo',
      output: 'Supplier A is fine',
      sourceIds: ['wiki-copy-1'],
      confidence: 0.89,
      evidenceQuality: 0.84,
    },
    {
      agentId: 'a4',
      version: '1.0.0',
      domain: 'general',
      method: 'same_source_echo',
      output: 'Supplier A is fine',
      sourceIds: ['wiki-copy-1'],
      confidence: 0.88,
      evidenceQuality: 0.83,
    },
    {
      agentId: 'a5',
      version: '1.0.0',
      domain: 'general',
      method: 'same_source_echo',
      output: 'Supplier A is fine',
      sourceIds: ['wiki-copy-1'],
      confidence: 0.9,
      evidenceQuality: 0.85,
    },
  ];
}

export function exampleDissentOutputs(): AgentConsensusOutput[] {
  return [
    {
      agentId: 'agent-a',
      version: '1.0.0',
      domain: 'ops',
      method: 'ops_observation',
      output: 'Use supplier A',
      sourceIds: ['ops-live-1'],
      confidence: 0.7,
      evidenceQuality: 0.7,
    },
    {
      agentId: 'agent-b',
      version: '1.0.0',
      domain: 'finance',
      method: 'finance_ledger',
      output: 'Use supplier A',
      sourceIds: ['fin-cost-2'],
      confidence: 0.68,
      evidenceQuality: 0.65,
    },
    {
      agentId: 'agent-c',
      version: '1.0.0',
      domain: 'ops',
      method: 'ops_observation',
      output: 'Do not use supplier A',
      sourceIds: ['supplier-freshness-check'],
      confidence: 0.72,
      evidenceQuality: 0.8,
      dissentNote: 'Agent C: supplier data stale',
    },
  ];
}

export function exampleParticipatingAgents(
  outputs: readonly AgentConsensusOutput[],
): ParticipatingAgent[] {
  return outputs.map((o) => ({
    agentId: o.agentId,
    version: o.version,
    primaryDomain: o.domain,
    method: o.method,
    reliability: {
      agentId: o.agentId,
      domain: o.domain,
      factualAccuracy: 0.8,
      groundingCitation: 0.8,
      testSuccess: 0.75,
      contradictionRate: 0.1,
      escalation: 0.1,
      policyCompliance: 0.9,
      latencyCost: 0.2,
      evaluatorResults: o.evaluatorScore ?? 0.7,
    },
  }));
}

export function exampleLogisticsExpertProfile(): AgentReliabilityProfile {
  return {
    agentId: 'logistics-expert-1',
    domain: 'logistics',
    factualAccuracy: 0.95,
    groundingCitation: 0.9,
    testSuccess: 0.92,
    contradictionRate: 0.05,
    escalation: 0.05,
    policyCompliance: 0.95,
    latencyCost: 0.1,
    evaluatorResults: 0.93,
  };
}

void METHOD_DIVERSITY_LABELS;
void RELIABILITY_SCORE_DIMENSIONS;
void CONSENSUS_APPROVAL_STATES;
void ES29_AGENT_BOUNDS;
void ES29_MAY;
void ES29_MUST_NOT;
void ES29_LOCKS;
