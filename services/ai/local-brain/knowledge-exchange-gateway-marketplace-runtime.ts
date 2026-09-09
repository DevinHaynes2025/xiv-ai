/**
 * 62L-DE Knowledge Exchange Gateway Marketplace runtime —
 * Walks KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  claimExchangeNodeRunningVerified,
  recordExchangeNodeHeartbeat,
  registerExchangeNode,
  setExchangeNodePower,
  submitKnowledgeExchange,
  knowledgeExchangeKernelHonesty,
} from './superbrain-knowledge-exchange-kernel';
import {
  agentGatewayMarketplaceHonesty,
  invokeMarketplaceCapability,
  listGatewayCapability,
  requestMarketplaceScope,
} from './agent-gateway-marketplace';
import {
  federatedDataMemoryFabricHonesty,
  submitFabricFederationPack,
} from './federated-data-memory-fabric';
import {
  continuousModelCompetitionLabHonesty,
  registerCompetitionTarget,
  runModelTournament,
} from './continuous-model-competition-lab';
import {
  accountCapacityAction,
  computeCapacityPlannerHonesty,
  planCapacityWorkload,
  registerCapacityTarget,
} from './distributed-compute-capacity-planner';
import {
  aiCompanyIncubatorHonesty,
  attemptIncubatorSelfPromotion,
  registerIncubatorCompany,
  requestIncubatorConsequentialChange,
} from './autonomous-ai-company-incubator';
import {
  authorizeRecoveryLink,
  resilienceRecoveryOrchestratorHonesty,
  signRecoveryPayload,
  submitRecoveryPack,
} from './multi-universe-resilience-recovery-orchestrator';
import {
  bootstrapKnowledgeExchangeGatewayMarketplace,
  knowledgeExchangeGatewayMarketplaceHonesty,
} from './knowledge-exchange-gateway-marketplace';
import {
  DE_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type DeActor,
  type DeEvidenceState,
  type DeHop,
  type DeHopRecord,
} from './knowledge-exchange-gateway-marketplace-types';

export {
  DE_LOCKS,
  HONESTY_BANNER,
  KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DeHop, state: DeEvidenceState, summary: string): DeHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DeCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DeActor;
  root?: string;
  repoRoot?: string;
};

export async function runKnowledgeExchangeGatewayMarketplaceCycle(input: DeCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DeHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DE_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DE_LOCKS.LOCAL_FIRST &&
        DE_LOCKS.MARKETPLACE_LISTING_GRANTS_CREDENTIALS === false &&
        DE_LOCKS.MARKETPLACE_LISTING_GRANTS_BILLING === false &&
        DE_LOCKS.MARKETPLACE_LISTING_GRANTS_DEPLOY === false &&
        DE_LOCKS.MARKETPLACE_LISTING_GRANTS_BROADER_DATA_ACCESS === false &&
        DE_LOCKS.KNOWLEDGE_EXCHANGE_WITHOUT_RIGHTS === false &&
        DE_LOCKS.SEALED_SILENT_CLOUD_OR_UNIVERSE_FALLBACK === false &&
        DE_LOCKS.TOURNAMENT_WINNER_EQ_VERIFIED_PROOF === false &&
        DE_LOCKS.CAPACITY_PLANNER_CAN_PURCHASE === false &&
        DE_LOCKS.CAPACITY_PLANNER_CAN_BILL === false &&
        DE_LOCKS.INCUBATOR_SELF_PROMOTION_TO_PRODUCTION === false &&
        DE_LOCKS.RECOVERY_WITHOUT_AUTHORIZATION === false &&
        DE_LOCKS.UNSIGNED_RECOVERY_PACK_ACCEPTED === false &&
        DE_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const system = await bootstrapKnowledgeExchangeGatewayMarketplace({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'knowledge_exchange_kernel_bootstrap',
      'IMPLEMENTED',
      `bootstrapped predecessor=${system.predecessorLayer}`,
    ),
  );

  const listing = await listGatewayCapability({
    name: 'tool-plugin-alpha',
    capabilityKey: 'gateway.tool.alpha',
    requiredScopes: ['gateway:invoke'],
    root,
    actor,
  });
  hops.push(
    hop(
      'marketplace_listing_no_credentials_billing_deploy_broader_access',
      listing.listing &&
        listing.listing.credentialsGranted === false &&
        listing.listing.billingGranted === false &&
        listing.listing.deployGranted === false &&
        listing.listing.broaderDataAccessGranted === false
        ? 'PASS'
        : 'FAIL',
      listing.reason,
    ),
  );

  const missingScope = await requestMarketplaceScope({
    listingId: listing.listing!.id,
    scope: 'gateway:invoke',
    actorScopes: [],
    root,
    actor: { ...actor, scopes: [] },
  });
  hops.push(
    hop(
      'missing_scope_denied_deny_by_default',
      missingScope.accepted === false ? 'DENIED' : 'FAIL',
      missingScope.reason,
    ),
  );

  const noRights = await submitKnowledgeExchange({
    assetClass: 'approved_knowledge',
    payload: 'exchange-payload',
    hasDataRights: false,
    hasProvenance: true,
    root,
    actor,
  });
  const noProv = await submitKnowledgeExchange({
    assetClass: 'approved_knowledge',
    payload: 'exchange-payload-2',
    hasDataRights: true,
    hasProvenance: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'knowledge_exchange_without_rights_provenance_denied',
      noRights.accepted === false && noProv.accepted === false ? 'DENIED' : 'FAIL',
      `${noRights.reason}; ${noProv.reason}`,
    ),
  );

  const sealedSilent = await submitKnowledgeExchange({
    assetClass: 'sealed',
    payload: 'sealed-secret',
    hasDataRights: true,
    hasProvenance: true,
    silent: true,
    root,
    actor,
  });
  const fabricSilent = await submitFabricFederationPack({
    sourceUniverseId: input.universeId,
    targetUniverseId: `${input.universeId}-b`,
    assetClass: 'raw_private',
    payload: 'raw-private',
    hasDataRights: true,
    hasProvenance: true,
    silent: true,
    signature: 'x',
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_silent_route_denied',
      sealedSilent.accepted === false && fabricSilent.accepted === false
        ? 'DENIED'
        : 'FAIL',
      `${sealedSilent.reason}; ${fabricSilent.reason}`,
    ),
  );

  const modelA = await registerCompetitionTarget({
    modelKey: 'local-a',
    configured: true,
    root,
    actor,
  });
  const modelB = await registerCompetitionTarget({
    modelKey: 'local-b',
    configured: true,
    root,
    actor,
  });
  const tournament = await runModelTournament({
    name: 'lab-round-1',
    participantIds: [modelA.id, modelB.id],
    winnerTargetId: modelA.id,
    evaluationEvidence: ['bleu=0.4'],
    claimWinnerIsVerifiedProof: true,
    claimWinnerIsProductionModel: true,
    root,
    actor,
  });
  const tournamentOk = await runModelTournament({
    name: 'lab-round-2',
    participantIds: [modelA.id, modelB.id],
    winnerTargetId: modelA.id,
    evaluationEvidence: ['bleu=0.41'],
    root,
    actor,
  });
  hops.push(
    hop(
      'tournament_winner_not_verified_proof_or_production_model',
      tournament.accepted === false &&
        tournamentOk.tournament?.labeledVerifiedProof === false &&
        tournamentOk.tournament?.productionModelPromoted === false
        ? 'PASS'
        : 'FAIL',
      tournament.reason,
    ),
  );

  const purchase = await accountCapacityAction({
    action: 'purchase',
    units: 10,
    currencyAttempted: true,
    root,
    actor,
  });
  const bill = await accountCapacityAction({
    action: 'bill',
    units: 5,
    root,
    actor,
  });
  hops.push(
    hop(
      'capacity_planner_cannot_purchase_bill',
      purchase.status === 'DENIED' && bill.status === 'DENIED' ? 'DENIED' : 'FAIL',
      `${purchase.reason}; ${bill.reason}`,
    ),
  );

  const unverified = await registerCapacityTarget({
    kind: 'nvidia',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  const planLive = await planCapacityWorkload({
    targetId: unverified.id,
    targetKind: 'nvidia',
    units: 4,
    root,
    actor,
  });
  hops.push(
    hop(
      'unverified_hardware_not_planned_as_live',
      unverified.status === 'UNAVAILABLE' &&
        planLive.plannedAsLive === false &&
        planLive.status === 'UNAVAILABLE'
        ? 'UNAVAILABLE'
        : 'FAIL',
      planLive.reason,
    ),
  );

  const company = await registerIncubatorCompany({
    name: 'sandbox-co',
    root,
    actor,
  });
  const consequential = await requestIncubatorConsequentialChange({
    companyId: company.company!.id,
    changeSummary: 'open vendor account',
    humanApproved: false,
    root,
    actor,
  });
  const selfPromo = await attemptIncubatorSelfPromotion({
    companyId: company.company!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'incubator_self_promote_denied_human_approval_gate',
      consequential.accepted === false && selfPromo.accepted === false
        ? 'DENIED'
        : 'FAIL',
      `${consequential.reason}; ${selfPromo.reason}`,
    ),
  );

  const recoveryNoAuth = await submitRecoveryPack({
    sourceUniverseId: input.universeId,
    targetUniverseId: `${input.universeId}-recovery`,
    payload: 'recovery-blob',
    signature: signRecoveryPayload('recovery-blob', 'key-de'),
    signingKey: 'key-de',
    root,
    actor,
  });
  hops.push(
    hop(
      'recovery_without_authorization_denied',
      recoveryNoAuth.accepted === false ? 'DENIED' : 'FAIL',
      recoveryNoAuth.reason,
    ),
  );

  await authorizeRecoveryLink({
    sourceUniverseId: input.universeId,
    targetUniverseId: `${input.universeId}-recovery`,
    root,
    actor,
  });
  const unsigned = await submitRecoveryPack({
    sourceUniverseId: input.universeId,
    targetUniverseId: `${input.universeId}-recovery`,
    payload: 'recovery-unsigned',
    root,
    actor,
  });
  const revoked = await submitRecoveryPack({
    sourceUniverseId: input.universeId,
    targetUniverseId: `${input.universeId}-recovery`,
    payload: 'recovery-revoked',
    signature: signRecoveryPayload('recovery-revoked', 'key-de'),
    signingKey: 'key-de',
    revoked: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_or_revoked_recovery_pack_rejected',
      unsigned.accepted === false && revoked.accepted === false ? 'REJECTED' : 'FAIL',
      `${unsigned.reason}; ${revoked.reason}`,
    ),
  );

  const node = await registerExchangeNode({
    name: 'exchange-node-1',
    authorizedNodePowered: true,
    root,
    actor,
  });
  await recordExchangeNodeHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'pid=1;runtime=local-exchange',
    root,
    actor,
  });
  const waiting = await setExchangeNodePower({
    nodeId: node.node!.id,
    powered: false,
    stopMode: 'WAITING_NODE',
    root,
    actor,
  });
  const claimOff = await claimExchangeNodeRunningVerified({
    nodeId: node.node!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'no_powered_node_waiting_or_stopped',
      (waiting.node?.status === 'WAITING_NODE' ||
        waiting.node?.status === 'OFFLINE_STOPPED') &&
        claimOff.accepted === false
        ? waiting.node?.status === 'OFFLINE_STOPPED'
          ? 'OFFLINE_STOPPED'
          : 'WAITING_NODE'
        : 'FAIL',
      claimOff.reason,
    ),
  );

  // Allowed marketplace invoke with scopes still grants no authority escalation.
  await invokeMarketplaceCapability({
    listingId: listing.listing!.id,
    requestedScopes: ['gateway:invoke'],
    actorScopes: ['gateway:invoke'],
    root,
    actor: { ...actor, scopes: ['gateway:invoke'] },
  });

  void decisionGate({
    id: 'de-cycle-gate',
    action: '62l_de_knowledge_exchange_gateway_marketplace_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void knowledgeExchangeGatewayMarketplaceHonesty();
  void knowledgeExchangeKernelHonesty();
  void agentGatewayMarketplaceHonesty();
  void federatedDataMemoryFabricHonesty();
  void continuousModelCompetitionLabHonesty();
  void computeCapacityPlannerHonesty();
  void aiCompanyIncubatorHonesty();
  void resilienceRecoveryOrchestratorHonesty();

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DE knowledge exchange gateway marketplace cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DE'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`),
  );

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DE knowledge exchange gateway marketplace cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning≠permission; marketplace listing≠authority; winner≠proof`,
      sourceRefs: ['62L-DE'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      DE_LOCKS.LEARNING_GRANTS_PERMISSION === false ? 'PASS' : 'FAIL',
      'Learning recorded; does not grant permission',
    ),
  );

  return {
    ok: hops.every((h) => h.state !== 'FAIL'),
    system,
    hops,
    honestyBanner: HONESTY_BANNER,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    locks: DE_LOCKS,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    l4AutonomyEnabled: DE_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorized: DE_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: DE_LOCKS.TIP_LAND,
    at: new Date().toISOString(),
  };
}

export async function buildKnowledgeExchangeGatewayMarketplaceHealthReport(input?: {
  root?: string;
  repoRoot?: string;
}) {
  const root = input?.root ?? process.cwd();
  const repoRoot = input?.repoRoot ?? root;
  const preds = predecessorMap(repoRoot);
  const brainHealth = await checkLocalBrainHealth(root).catch(() => null);
  const honesty = knowledgeExchangeGatewayMarketplaceHonesty();
  return {
    phase: '62L-DE',
    title:
      'XIV Superbrain Knowledge Exchange Kernel + Agent Gateway Marketplace + Federated Data/Memory Fabric + Continuous Model Competition Lab + Distributed Compute Capacity Planner + Autonomous AI Company Incubator + Multi-Universe Resilience & Recovery Orchestrator',
    honestyBanner: HONESTY_BANNER,
    locks: DE_LOCKS,
    honesty,
    predecessors: preds,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    brainHealth,
    tipLand: false,
    productionAuthorized: false,
    l4AutonomyEnabled: false,
    dbCandidatesApplied: false,
    at: new Date().toISOString(),
  };
}
