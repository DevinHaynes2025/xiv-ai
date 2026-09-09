import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  invokeMarketplaceCapability,
  listGatewayCapability,
  requestMarketplaceScope,
  agentGatewayMarketplaceHonesty,
} from './agent-gateway-marketplace';
import {
  claimExchangeNodeRunningVerified,
  knowledgeExchangeKernelHonesty,
  recordExchangeNodeHeartbeat,
  registerExchangeNode,
  setExchangeNodePower,
  submitKnowledgeExchange,
} from './superbrain-knowledge-exchange-kernel';
import {
  federatedDataMemoryFabricHonesty,
  signFabricPayload,
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
  CAPACITY_PLANNER_SPEND_DENIED,
  DE_LOCKS,
  HONESTY_BANNER,
  INCUBATOR_HUMAN_APPROVAL_REQUIRED,
  INCUBATOR_SELF_PROMOTION_DENIED,
  KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_CYCLE,
  KNOWLEDGE_EXCHANGE_PROVENANCE_DENIED,
  KNOWLEDGE_EXCHANGE_RIGHTS_DENIED,
  MARKETPLACE_LISTING_NO_AUTHORITY,
  MISSING_SCOPE_DENIED,
  NEXT_PHASE_TITLE,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  RECOVERY_WITHOUT_AUTH_DENIED,
  REVOKED_RECOVERY_PACK_REJECTED,
  SEALED_SILENT_ROUTE_DENIED,
  TOURNAMENT_WINNER_NOT_PROOF,
  UNSIGNED_RECOVERY_PACK_REJECTED,
  UNVERIFIED_HARDWARE_UNAVAILABLE,
  predecessorMap,
  type DeActor,
} from './knowledge-exchange-gateway-marketplace-types';
import {
  buildKnowledgeExchangeGatewayMarketplaceHealthReport,
  runKnowledgeExchangeGatewayMarketplaceCycle,
} from './knowledge-exchange-gateway-marketplace-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lde-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DeActor = {
  kind: 'knowledge_exchange_curator',
  id: 'curator-de-1',
  orgId: 'org-de',
  tenantId: 'tenant-de',
  universeId: 'univ-de',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
  scopes: [],
};

try {
  check(
    'US-DE1-cycle',
    KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_CYCLE.join(' → ') ===
      'honesty_locks → knowledge_exchange_kernel_bootstrap → marketplace_listing_no_credentials_billing_deploy_broader_access → missing_scope_denied_deny_by_default → knowledge_exchange_without_rights_provenance_denied → sealed_silent_route_denied → tournament_winner_not_verified_proof_or_production_model → capacity_planner_cannot_purchase_bill → unverified_hardware_not_planned_as_live → incubator_self_promote_denied_human_approval_gate → recovery_without_authorization_denied → unsigned_or_revoked_recovery_pack_rejected → no_powered_node_waiting_or_stopped → evidence → learning',
    'Knowledge Exchange Gateway Marketplace cycle recorded in order.',
  );

  check(
    'US-DE-locks',
    DE_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DE_LOCKS.MARKETPLACE_LISTING_GRANTS_CREDENTIALS === false &&
      DE_LOCKS.MARKETPLACE_LISTING_GRANTS_BILLING === false &&
      DE_LOCKS.MARKETPLACE_LISTING_GRANTS_DEPLOY === false &&
      DE_LOCKS.MARKETPLACE_LISTING_GRANTS_BROADER_DATA_ACCESS === false &&
      DE_LOCKS.MARKETPLACE_MISSING_SCOPE_ALLOWED === false &&
      DE_LOCKS.KNOWLEDGE_EXCHANGE_WITHOUT_RIGHTS === false &&
      DE_LOCKS.KNOWLEDGE_EXCHANGE_WITHOUT_PROVENANCE === false &&
      DE_LOCKS.SEALED_SILENT_CLOUD_OR_UNIVERSE_FALLBACK === false &&
      DE_LOCKS.TOURNAMENT_WINNER_EQ_VERIFIED_PROOF === false &&
      DE_LOCKS.TOURNAMENT_WINNER_EQ_PRODUCTION_MODEL === false &&
      DE_LOCKS.CAPACITY_PLANNER_CAN_PURCHASE === false &&
      DE_LOCKS.CAPACITY_PLANNER_CAN_BILL === false &&
      DE_LOCKS.UNVERIFIED_HARDWARE_PLANNED_AS_LIVE === false &&
      DE_LOCKS.INCUBATOR_SELF_PROMOTION_TO_PRODUCTION === false &&
      DE_LOCKS.RECOVERY_WITHOUT_AUTHORIZATION === false &&
      DE_LOCKS.UNSIGNED_RECOVERY_PACK_ACCEPTED === false &&
      DE_LOCKS.REVOKED_RECOVERY_PACK_ACCEPTED === false &&
      DE_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DE_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-DE-honesty-surfaces',
    agentGatewayMarketplaceHonesty().listingGrantsCredentials === false &&
      knowledgeExchangeKernelHonesty().withoutRights === false &&
      federatedDataMemoryFabricHonesty().sealedSilentFallback === false &&
      continuousModelCompetitionLabHonesty().winnerEqVerifiedProof === false &&
      computeCapacityPlannerHonesty().canPurchase === false &&
      aiCompanyIncubatorHonesty().selfPromotionToProduction === false &&
      resilienceRecoveryOrchestratorHonesty().unsignedAccepted === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-DE-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DF —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DE-predecessor-CY-or-better',
    preds.CY.tipProbe === 'PRESENT' ||
      preds.DD.tipProbe === 'PRESENT' ||
      preds.DA.tipProbe === 'PRESENT',
    `DD=${preds.DD.tipProbe}/${preds.DD.report}; DC=${preds.DC.tipProbe}/${preds.DC.report}; DB=${preds.DB.tipProbe}/${preds.DB.report}; DA=${preds.DA.tipProbe}/${preds.DA.report}; CZ=${preds.CZ.tipProbe}/${preds.CZ.report}; CY=${preds.CY.tipProbe}/${preds.CY.report}`,
  );

  // Marketplace listing does not grant credentials/billing/deploy/broader access
  const listing = await listGatewayCapability({
    name: 'plugin-gateway',
    capabilityKey: 'plugin.gateway',
    requiredScopes: ['plugin:run'],
    root,
    actor,
  });
  check(
    'US-DE-marketplace-listing-no-authority',
    listing.accepted === true &&
      listing.reason === MARKETPLACE_LISTING_NO_AUTHORITY &&
      listing.listing?.credentialsGranted === false &&
      listing.listing?.billingGranted === false &&
      listing.listing?.deployGranted === false &&
      listing.listing?.broaderDataAccessGranted === false &&
      listing.listing?.authorityGranted === false,
    listing.reason,
  );

  // Missing scope DENIED
  const missing = await requestMarketplaceScope({
    listingId: listing.listing!.id,
    scope: 'plugin:run',
    actorScopes: [],
    root,
    actor: { ...actor, scopes: [] },
  });
  check(
    'US-DE-missing-scope-denied',
    missing.accepted === false && missing.reason === MISSING_SCOPE_DENIED,
    missing.reason,
  );

  const allowed = await invokeMarketplaceCapability({
    listingId: listing.listing!.id,
    requestedScopes: ['plugin:run'],
    actorScopes: ['plugin:run'],
    root,
    actor: { ...actor, scopes: ['plugin:run'] },
  });
  check(
    'US-DE-allowed-invoke-still-no-escalation',
    allowed.accepted === true &&
      allowed.invoke?.credentialsGranted === false &&
      allowed.invoke?.billingGranted === false &&
      allowed.invoke?.deployGranted === false &&
      allowed.invoke?.broaderDataAccessGranted === false,
    allowed.reason,
  );

  // Knowledge exchange without rights/provenance DENIED
  const noRights = await submitKnowledgeExchange({
    assetClass: 'approved_knowledge',
    payload: 'p1',
    hasDataRights: false,
    hasProvenance: true,
    root,
    actor,
  });
  const noProv = await submitKnowledgeExchange({
    assetClass: 'approved_knowledge',
    payload: 'p2',
    hasDataRights: true,
    hasProvenance: false,
    root,
    actor,
  });
  check(
    'US-DE-knowledge-exchange-rights-provenance-denied',
    noRights.accepted === false &&
      noRights.reason === KNOWLEDGE_EXCHANGE_RIGHTS_DENIED &&
      noProv.accepted === false &&
      noProv.reason === KNOWLEDGE_EXCHANGE_PROVENANCE_DENIED,
    `${noRights.reason}; ${noProv.reason}`,
  );

  // Sealed silent route DENIED
  const sealedSilent = await submitKnowledgeExchange({
    assetClass: 'sealed',
    payload: 'sealed',
    hasDataRights: true,
    hasProvenance: true,
    silent: true,
    root,
    actor,
  });
  const fabricSilent = await submitFabricFederationPack({
    sourceUniverseId: 'univ-de',
    targetUniverseId: 'univ-de-b',
    assetClass: 'raw_private',
    payload: 'raw',
    hasDataRights: true,
    hasProvenance: true,
    silent: true,
    signature: signFabricPayload('raw', 'k'),
    signingKey: 'k',
    root,
    actor,
  });
  check(
    'US-DE-sealed-silent-route-denied',
    sealedSilent.accepted === false &&
      sealedSilent.reason === SEALED_SILENT_ROUTE_DENIED &&
      fabricSilent.accepted === false &&
      fabricSilent.reason === SEALED_SILENT_ROUTE_DENIED,
    `${sealedSilent.reason}; ${fabricSilent.reason}`,
  );

  // Tournament winner ≠ auto verified proof / production model
  const m1 = await registerCompetitionTarget({
    modelKey: 'm1',
    configured: true,
    root,
    actor,
  });
  const m2 = await registerCompetitionTarget({
    modelKey: 'm2',
    configured: true,
    root,
    actor,
  });
  const claimProof = await runModelTournament({
    name: 't1',
    participantIds: [m1.id, m2.id],
    winnerTargetId: m1.id,
    claimWinnerIsVerifiedProof: true,
    root,
    actor,
  });
  const recorded = await runModelTournament({
    name: 't2',
    participantIds: [m1.id, m2.id],
    winnerTargetId: m1.id,
    evaluationEvidence: ['acc=0.9'],
    root,
    actor,
  });
  check(
    'US-DE-tournament-winner-not-proof',
    claimProof.accepted === false &&
      claimProof.reason === TOURNAMENT_WINNER_NOT_PROOF &&
      recorded.tournament?.labeledVerifiedProof === false &&
      recorded.tournament?.productionModelPromoted === false &&
      recorded.tournament?.consensusOnly === true,
    claimProof.reason,
  );

  // Capacity planner cannot purchase/bill
  const purchase = await accountCapacityAction({
    action: 'purchase',
    units: 1,
    currencyAttempted: true,
    root,
    actor,
  });
  const bill = await accountCapacityAction({
    action: 'bill',
    units: 1,
    root,
    actor,
  });
  const forecast = await accountCapacityAction({
    action: 'forecast',
    units: 8,
    root,
    actor,
  });
  check(
    'US-DE-capacity-planner-cannot-purchase-bill',
    purchase.status === 'DENIED' &&
      purchase.reason === CAPACITY_PLANNER_SPEND_DENIED &&
      bill.status === 'DENIED' &&
      bill.reason === CAPACITY_PLANNER_SPEND_DENIED &&
      forecast.status === 'PLAN_ONLY',
    `${purchase.reason}; ${bill.reason}; ${forecast.reason}`,
  );

  // Unverified hardware not planned as live
  const unverified = await registerCapacityTarget({
    kind: 'amd',
    configured: true,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  const plan = await planCapacityWorkload({
    targetId: unverified.id,
    targetKind: 'amd',
    units: 2,
    root,
    actor,
  });
  check(
    'US-DE-unverified-hardware-not-live',
    unverified.status === 'UNAVAILABLE' &&
      unverified.plannedAsLive === false &&
      plan.status === 'UNAVAILABLE' &&
      plan.plannedAsLive === false &&
      plan.reason === UNVERIFIED_HARDWARE_UNAVAILABLE,
    plan.reason,
  );

  // Incubator self-promote DENIED; consequential needs human approval
  const company = await registerIncubatorCompany({
    name: 'sandbox-inc',
    root,
    actor,
  });
  const consequential = await requestIncubatorConsequentialChange({
    companyId: company.company!.id,
    changeSummary: 'open bank account',
    humanApproved: false,
    root,
    actor,
  });
  const selfPromo = await attemptIncubatorSelfPromotion({
    companyId: company.company!.id,
    root,
    actor,
  });
  const humanOk = await requestIncubatorConsequentialChange({
    companyId: company.company!.id,
    changeSummary: 'draft charter',
    humanApproved: true,
    humanOperator: true,
    root,
    actor: { ...actor, kind: 'human_operator' },
  });
  check(
    'US-DE-incubator-self-promote-and-human-gate',
    consequential.accepted === false &&
      consequential.reason === INCUBATOR_HUMAN_APPROVAL_REQUIRED &&
      selfPromo.accepted === false &&
      selfPromo.reason === INCUBATOR_SELF_PROMOTION_DENIED &&
      humanOk.accepted === true &&
      humanOk.company?.productionAuthorized === false,
    `${consequential.reason}; ${selfPromo.reason}; ${humanOk.reason}`,
  );

  // Recovery without authorization DENIED
  const noAuth = await submitRecoveryPack({
    sourceUniverseId: 'univ-de',
    targetUniverseId: 'univ-de-r',
    payload: 'rec1',
    signature: signRecoveryPayload('rec1', 'rk'),
    signingKey: 'rk',
    root,
    actor,
  });
  check(
    'US-DE-recovery-without-auth-denied',
    noAuth.accepted === false && noAuth.reason === RECOVERY_WITHOUT_AUTH_DENIED,
    noAuth.reason,
  );

  // Unsigned/revoked recovery pack rejected
  await authorizeRecoveryLink({
    sourceUniverseId: 'univ-de',
    targetUniverseId: 'univ-de-r',
    root,
    actor,
  });
  const unsigned = await submitRecoveryPack({
    sourceUniverseId: 'univ-de',
    targetUniverseId: 'univ-de-r',
    payload: 'rec2',
    root,
    actor,
  });
  const revoked = await submitRecoveryPack({
    sourceUniverseId: 'univ-de',
    targetUniverseId: 'univ-de-r',
    payload: 'rec3',
    signature: signRecoveryPayload('rec3', 'rk'),
    signingKey: 'rk',
    revoked: true,
    root,
    actor,
  });
  const okPack = await submitRecoveryPack({
    sourceUniverseId: 'univ-de',
    targetUniverseId: 'univ-de-r',
    payload: 'rec4',
    signature: signRecoveryPayload('rec4', 'rk'),
    signingKey: 'rk',
    root,
    actor,
  });
  check(
    'US-DE-unsigned-revoked-recovery-rejected',
    unsigned.accepted === false &&
      unsigned.reason === UNSIGNED_RECOVERY_PACK_REJECTED &&
      revoked.accepted === false &&
      revoked.reason === REVOKED_RECOVERY_PACK_REJECTED &&
      okPack.accepted === true &&
      okPack.pack?.autoProductionRestore === false,
    `${unsigned.reason}; ${revoked.reason}; ${okPack.reason}`,
  );

  // No powered node → WAITING_NODE or OFFLINE_STOPPED
  const node = await registerExchangeNode({
    name: 'n1',
    authorizedNodePowered: true,
    root,
    actor,
  });
  await recordExchangeNodeHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'pid=1',
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
  const claim = await claimExchangeNodeRunningVerified({
    nodeId: node.node!.id,
    root,
    actor,
  });
  const offline = await setExchangeNodePower({
    nodeId: node.node!.id,
    powered: false,
    stopMode: 'OFFLINE_STOPPED',
    root,
    actor,
  });
  check(
    'US-DE-no-powered-node-waiting-or-stopped',
    waiting.node?.status === 'WAITING_NODE' &&
      claim.accepted === false &&
      claim.reason === NO_POWERED_NODE_WAITING_OR_STOPPED &&
      offline.node?.status === 'OFFLINE_STOPPED',
    `${waiting.node?.status}; ${claim.reason}; ${offline.node?.status}`,
  );

  const cycle = await runKnowledgeExchangeGatewayMarketplaceCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'US-DE-cycle-health',
    cycle.ok === true &&
      cycle.githubSotIssue === 122 &&
      cycle.gitlabCoordinationIssue === 56 &&
      cycle.tipLand === false &&
      cycle.l4AutonomyEnabled === false,
    `ok=${cycle.ok}; hops=${cycle.hops.length}`,
  );

  const health = await buildKnowledgeExchangeGatewayMarketplaceHealthReport({
    root,
    repoRoot,
  });
  check(
    'US-DE-health-report',
    health.honestyBanner === HONESTY_BANNER &&
      health.githubSotIssue === 122 &&
      health.tipLand === false,
    `phase=${health.phase}`,
  );

  check(
    'US-DE-CY-modules-present',
    preds.CY.tipProbe === 'PRESENT' && preds.CY.report === 'PRESENT',
    `CY tip=${preds.CY.tipProbe} report=${preds.CY.report}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DE knowledge exchange gateway marketplace tests passed');
