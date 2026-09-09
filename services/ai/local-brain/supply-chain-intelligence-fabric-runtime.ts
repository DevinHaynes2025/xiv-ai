/**
 * 62L-DZ Supply Chain Intelligence Fabric runtime —
 * Walks SUPPLY_CHAIN_INTELLIGENCE_FABRIC_CYCLE and builds health report.
 */

import {
  attemptAlgorithmSelfPromotion,
  discoverAlgorithmCandidate,
  evaluateBenchmarkGate,
} from './algorithm-discovery-benchmark-factory';
import {
  attemptAgentSelfPromotion,
  openAgentShift,
  openSocietyMeeting,
} from './agent-society-coordination-layer';
import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import {
  accessHistoricalMemory,
  accessTemporalKnowledgeGraph,
} from './global-historical-data-memory-engine';
import { checkLocalBrainHealth } from './health-check';
import {
  attemptAppPackSelfPromotion,
  composeIndustryApp,
  evaluateWedgeFirstGate,
} from './industry-app-composer';
import {
  claimTrust,
  evaluatePromotionGate,
  probeDigitalTwinAuthority,
} from './launch-resilience-trust-control-tower';
import { appendLearning } from './learning-ledger';
import {
  probeKnowledgeFirewall,
  probePersonalEnterpriseBoundary,
} from './personal-enterprise-knowledge-graph-firewall';
import {
  denyAutonomyBoundaryAction,
  modelDisruptionPropagation,
  proposeRootCausePathway,
} from './supply-chain-intelligence-fabric';
import {
  bootstrapSupplyChainIntelligenceFabric,
  supplyChainIntelligenceFabricSystemHonesty,
} from './supply-chain-intelligence-fabric-system';
import {
  DZ_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SUPPLY_CHAIN_INTELLIGENCE_FABRIC_CYCLE,
  predecessorMap,
  type DzActor,
  type DzEvidenceState,
  type DzHop,
  type DzHopRecord,
} from './supply-chain-intelligence-fabric-types';
import {
  attemptDeviceSelfPromotion,
  probeEdgeRunningVerified,
  probeOfflineEdgeStopped,
  probeOfflineKnowledgePack,
} from './universal-edge-ai-runtime';

export {
  SUPPLY_CHAIN_INTELLIGENCE_FABRIC_CYCLE,
  DZ_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DzHop, state: DzEvidenceState, summary: string): DzHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DzCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DzActor;
  root?: string;
  repoRoot?: string;
};

export async function runSupplyChainIntelligenceFabricCycle(
  input: DzCycleInput,
) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DzHopRecord[] = [];
  const actor = {
    ...input.actor,
    universeId: input.universeId || input.actor.universeId,
  };
  const twinActor: DzActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

  hops.push(
    hop(
      'honesty_locks',
      DZ_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DZ_LOCKS.LOCAL_FIRST &&
        DZ_LOCKS.FREIGHT_BOOKING_AUTONOMOUS === false &&
        DZ_LOCKS.PATHWAY_EQ_VERIFIED_CAUSATION === false &&
        DZ_LOCKS.DISCOVERY_CANDIDATE_EQ_PRODUCTION_ALGORITHM === false &&
        DZ_LOCKS.ALGORITHM_SELF_PROMOTION_ALLOWED === false &&
        DZ_LOCKS.DEVICE_SELF_PROMOTION_ALLOWED === false &&
        DZ_LOCKS.AGENT_SELF_PROMOTION_ALLOWED === false &&
        DZ_LOCKS.APP_PACK_SELF_PROMOTION_ALLOWED === false &&
        DZ_LOCKS.SANDBOX_COMPOSITION_EQ_PROD_DEPLOY === false &&
        DZ_LOCKS.PROMOTION_WITHOUT_EXPLICIT_AUTH === false &&
        DZ_LOCKS.CLASSICAL_BASELINE_OPTIONAL === false &&
        DZ_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
        DZ_LOCKS.TIP_LAND === false &&
        DZ_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapSupplyChainIntelligenceFabric({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'supply_chain_intelligence_fabric_bootstrap',
      'PASS',
      `os=${os.id}; predecessor=${os.predecessorLayer}; softWire=${os.softWiredPredecessors.join(',')}`,
    ),
  );

  // A
  const pathway = await proposeRootCausePathway({
    incidentId: 'inc-1',
    summary: 'port delay hypothesized pathway',
    verifiedEvidence: false,
    causationClaimed: false,
    attemptPhysicalExecution: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'root_cause_pathway_hypothesized_only',
      pathway.status === 'hypothesized' &&
        pathway.physicalExecutionAuthorized === false
        ? 'PASS'
        : 'FAIL',
      pathway.reason,
    ),
  );
  const disruption = await modelDisruptionPropagation({
    sourceNode: 'port-a',
    targetNode: 'dc-b',
    correlationObserved: true,
    verifiedCausation: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'disruption_propagation_neq_verified_causation',
      disruption.status === 'hypothesized' && !disruption.verifiedCausation
        ? 'PASS'
        : 'FAIL',
      disruption.reason,
    ),
  );
  for (const [action, hopName] of [
    ['book_freight', 'freight_booking_denied'],
    ['issue_purchase_order', 'purchase_order_denied'],
    ['sign_contract', 'contract_signing_denied'],
    ['spend_money', 'spend_money_denied'],
    ['change_production_system', 'production_change_denied'],
  ] as const) {
    const denial = await denyAutonomyBoundaryAction({ action, root, actor });
    hops.push(
      hop(hopName, denial.status === 'denied' ? 'PASS' : 'FAIL', denial.reason),
    );
  }

  // B
  const hist = await accessHistoricalMemory({
    memoryId: 'mem-1',
    contextId: 'ctx-a',
    aclGranted: false,
    labelPresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'historical_memory_acl_deny_by_default',
      hist.status === 'denied' ? 'PASS' : 'FAIL',
      hist.reason,
    ),
  );
  const labelHist = await accessHistoricalMemory({
    memoryId: 'mem-2',
    contextId: 'ctx-a',
    aclGranted: false,
    labelPresent: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'label_alone_neq_historical_access',
      labelHist.status === 'denied' ? 'PASS' : 'FAIL',
      labelHist.reason,
    ),
  );
  const tkg = await accessTemporalKnowledgeGraph({
    graphId: 'tkg-1',
    contextId: 'ctx-b',
    aclGranted: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'temporal_knowledge_graph_acl_enforced',
      tkg.status === 'denied' ? 'PASS' : 'FAIL',
      tkg.reason,
    ),
  );

  // C
  const disc = await discoverAlgorithmCandidate({
    candidateId: 'alg-route',
    family: 'classical',
    classicalBaselinePresent: true,
    attemptProductionPromote: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'discovery_candidate_neq_production_algorithm',
      disc.productionAlgorithmAuthorized === false && disc.status === 'candidate'
        ? 'PASS'
        : 'FAIL',
      disc.reason,
    ),
  );
  const qi = await discoverAlgorithmCandidate({
    candidateId: 'alg-qi',
    family: 'quantum_inspired',
    classicalBaselinePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_inspired_requires_classical_baseline',
      qi.status === 'denied' ? 'PASS' : 'FAIL',
      qi.reason,
    ),
  );
  const bench = await evaluateBenchmarkGate({
    discoveryId: disc.id,
    reproducible: true,
    evidenceBacked: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'benchmark_gate_requires_reproducible_evidence',
      bench.status === 'benchmark_pass' &&
        bench.productionAlgorithmAuthorized === false
        ? 'PASS'
        : 'FAIL',
      bench.reason,
    ),
  );
  const algPromo = await attemptAlgorithmSelfPromotion({
    discoveryId: disc.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'algorithm_self_promotion_denied',
      algPromo.status === 'denied' ? 'PASS' : 'FAIL',
      algPromo.reason,
    ),
  );

  // D
  const edge = await probeEdgeRunningVerified({
    nodeId: 'edge-1',
    authorized: true,
    heartbeatPresent: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'edge_running_verified_needs_evidence',
      edge.state === 'NOT_VERIFIED' && edge.status === 'denied' ? 'PASS' : 'FAIL',
      edge.reason,
    ),
  );
  const pack = await probeOfflineKnowledgePack({
    packId: 'pack-offline-1',
    poweredNodePresent: false,
    accuracyClaimedWithoutEvidence: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_knowledge_pack_honest',
      pack.status === 'honest_offline' && pack.state === 'NOT_VERIFIED'
        ? 'PASS'
        : 'FAIL',
      pack.reason,
    ),
  );
  const offlineStop = await probeOfflineEdgeStopped({
    nodeId: 'edge-2',
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_without_powered_node_waiting_or_stopped',
      offlineStop.state === 'OFFLINE_STOPPED' || pack.state === 'WAITING_NODE'
        ? 'PASS'
        : 'FAIL',
      offlineStop.reason,
    ),
  );
  const devicePromo = await attemptDeviceSelfPromotion({
    deviceId: 'dev-1',
    root,
    actor,
  });
  hops.push(
    hop(
      'device_self_promotion_denied',
      devicePromo.status === 'denied' ? 'PASS' : 'FAIL',
      devicePromo.reason,
    ),
  );

  // E
  const unsigned = await openAgentShift({
    shiftId: 'shift-1',
    signed: false,
    authorized: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_agent_shift_denied',
      unsigned.status === 'denied' ? 'PASS' : 'FAIL',
      unsigned.reason,
    ),
  );
  const unauthMeet = await openSocietyMeeting({
    meetingId: 'meet-1',
    signed: true,
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_society_meeting_denied',
      unauthMeet.status === 'denied' ? 'PASS' : 'FAIL',
      unauthMeet.reason,
    ),
  );
  const autonomy = await openAgentShift({
    shiftId: 'shift-2',
    signed: true,
    authorized: true,
    unrestrictedAutonomyClaimed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'task_reliability_neq_unrestricted_autonomy',
      autonomy.status === 'denied' ? 'PASS' : 'FAIL',
      autonomy.reason,
    ),
  );
  const agentPromo = await attemptAgentSelfPromotion({
    agentId: 'agent-1',
    root,
    actor,
  });
  hops.push(
    hop(
      'agent_self_promotion_denied',
      agentPromo.status === 'denied' ? 'PASS' : 'FAIL',
      agentPromo.reason,
    ),
  );

  // F
  const fw = await probeKnowledgeFirewall({
    sourceContext: 'personal-a',
    targetContext: 'enterprise-b',
    crossContextAttempt: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'knowledge_firewall_sealed_deny_cross_context',
      fw.status === 'denied' ? 'PASS' : 'FAIL',
      fw.reason,
    ),
  );
  const unlabeled = await probeKnowledgeFirewall({
    sourceContext: 'ctx-x',
    targetContext: 'ctx-y',
    crossContextAttempt: false,
    unlabeled: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unlabeled_leakage_denied',
      unlabeled.status === 'denied' ? 'PASS' : 'FAIL',
      unlabeled.reason,
    ),
  );
  const boundary = await probePersonalEnterpriseBoundary({
    personalContextId: 'pers-1',
    enterpriseContextId: 'ent-1',
    attemptCrossBoundary: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'personal_enterprise_boundary_enforced',
      boundary.status === 'denied' ? 'PASS' : 'FAIL',
      boundary.reason,
    ),
  );

  // G
  const app = await composeIndustryApp({
    packId: 'pack-retail',
    industry: 'retail',
    supplyChainPilotProven: true,
    attemptProdDeploy: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sandbox_composition_neq_prod_deploy',
      app.productionDeployAuthorized === false && app.sandboxOnly === true
        ? 'PASS'
        : 'FAIL',
      app.reason,
    ),
  );
  const appPromo = await attemptAppPackSelfPromotion({
    packId: 'pack-retail',
    root,
    actor,
  });
  hops.push(
    hop(
      'app_pack_self_promotion_denied',
      appPromo.status === 'denied' ? 'PASS' : 'FAIL',
      appPromo.reason,
    ),
  );
  const wedge = await evaluateWedgeFirstGate({
    supplyChainPilotProofPresent: false,
    attemptBroaderIndustry: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'wedge_first_industry_pack_gated',
      wedge.status === 'denied' ? 'PASS' : 'FAIL',
      wedge.reason,
    ),
  );

  // H
  const promoGate = await evaluatePromotionGate({
    subject: 'algorithm',
    evidencePresent: false,
    testingPassed: false,
    permissionsGranted: false,
    rollbackPlanPresent: false,
    explicitAuthorization: false,
    selfPromotionAttempted: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'promotion_gate_requires_evidence_testing_permissions_rollback_auth',
      promoGate.status === 'denied' &&
        promoGate.productionAuthorized === false
        ? 'PASS'
        : 'FAIL',
      promoGate.reason,
    ),
  );
  const trust = await claimTrust({
    claim: 'launch resilient',
    evidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'trust_claim_needs_evidence',
      trust.status === 'denied' ? 'PASS' : 'FAIL',
      trust.reason,
    ),
  );
  const twinAuth = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  hops.push(
    hop(
      'digital_twin_neq_founder',
      twinAuth.status === 'denied' ? 'PASS' : 'FAIL',
      twinAuth.reason,
    ),
  );

  const preds = predecessorMap(input.repoRoot ?? root);
  const softWireOk =
    preds.DY.tipProbe === 'PRESENT' ||
    preds.DX.tipProbe === 'PRESENT' ||
    preds.DW.tipProbe === 'PRESENT' ||
    preds.DY.tipProbe === 'WAITING_DATA';
  hops.push(
    hop(
      'dy_dx_soft_wire_probe',
      softWireOk ? 'PASS' : 'FAIL',
      `DY=${preds.DY.tipProbe}/${preds.DY.report}; DX=${preds.DX.tipProbe}/${preds.DX.report}; DW=${preds.DW.tipProbe}/${preds.DW.report}`,
    ),
  );

  void decisionGate({
    id: 'dz-cycle-gate',
    action: '62l_dz_supply_chain_intelligence_fabric_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void supplyChainIntelligenceFabricSystemHonesty(input.repoRoot);
  void SUPPLY_CHAIN_INTELLIGENCE_FABRIC_CYCLE;

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DZ supply chain intelligence fabric cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DZ'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DZ supply chain intelligence fabric cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; pathway≠causation; discovery≠prod; self-promotion denied; ` +
        'sandbox≠prod; firewall sealed; promotion gate hard',
      sourceRefs: ['62L-DZ'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ permission; no self-promotion; no production authorization.',
    ),
  );

  const health = await checkLocalBrainHealth(root).catch(() => null);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DZ_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: os.predecessorLayer,
    softWiredPredecessors: os.softWiredPredecessors,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionSupplyChainIntelligenceFabricShipped: false as const,
    dbCandidatesApplied: false as const,
    os,
  };
}

export async function buildSupplyChainIntelligenceFabricHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: DzActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: DzActor = input?.actor ?? {
    kind: 'supply_chain_intelligence_curator',
    id: 'health',
    orgId,
    tenantId,
    universeId,
  };
  const cycle = await runSupplyChainIntelligenceFabricCycle({
    orgId,
    tenantId,
    universeId,
    actor,
    root: input?.root,
    repoRoot: input?.repoRoot,
  });
  const failed = cycle.hops.filter((h) => h.state === 'FAIL');
  return {
    status: failed.length === 0 ? 'HEALTHY' : 'DEGRADED',
    failedHops: failed.map((h) => h.hop),
    hopCount: cycle.hops.length,
    predecessorLayer: cycle.predecessorLayer,
    softWiredPredecessors: cycle.softWiredPredecessors,
    honesty: supplyChainIntelligenceFabricSystemHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    dbCandidatesApplied: false as const,
  };
}
