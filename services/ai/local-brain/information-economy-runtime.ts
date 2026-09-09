import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { LocalCheckpointStore } from './checkpoint-store';
import { redactSealedForRouting, SEALED_REDACTION, sealCeoRecord, sealedVaultStats } from './ceo-sealed-vault';
import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { promoteLakeClaim } from './evidence-graph';
import type { SealedActor } from './hybrid-edge-cloud-types';
import type { InformationRoot, SemanticQuery } from './information-control-tower-types';
import { appendLearning } from './learning-ledger';
import { providerSlots } from './provider-fabric';
import {
  ANTI_COLLUSION_DENY,
  CENTRALIZATION_DENY,
  FOUNDER_IMPERSONATION_DENY,
  HASH_REF_BYTES,
  INFORMATION_ECONOMY_LOCKS,
  INFORMATION_ECONOMY_LOOP,
  PREDECESSOR_REPORTS,
  RAW_POOL_DENY,
  SEALED_NON_MOVEMENT,
  type EconomyEvidenceState,
  type EconomyHopRecord,
  type InformationEconomyHop,
} from './information-economy-types';
import {
  fingerprintDemand,
  qualifyInformationSource,
  recordSourceQualification,
  registerInformationSku,
  type InformationSku,
} from './information-skus';
import {
  forecastFromLog,
  lookupInformationInventory,
  recordInformationDemand,
  replenishInformation,
} from './information-inventory';
import {
  costToServe,
  detectInformationBullwhip,
  leanTraceForFulfillment,
  reduceInformationBullwhip,
  wastefulBullwhipTrace,
  type BullwhipDetection,
  type BullwhipReduction,
} from './information-bullwhip';
import {
  appendChainOfCustody,
  buildKnowledgeLogisticsNetwork,
  detectLogisticsBottlenecks,
  deliverOffline,
  evaluateSla,
  optimizeInformationRoute,
  planResilience,
  queryToData,
  routeMultilingual,
  unverifiedProvidersUnavailable,
  type CustodyEvent,
} from './knowledge-logistics-network';
import { founderImpersonationAttempt, giepCollusionDenied, proposeGiepEnvelope } from './giep-foundations';

export { INFORMATION_ECONOMY_LOCKS, INFORMATION_ECONOMY_LOOP };

export type InformationDemand = {
  id: string;
  tenantId: string;
  universeId: string;
  title: string;
  query: string;
  originalText?: string;
  sourceUri?: string;
  domain?: string;
  approved?: boolean;
  actor?: SealedActor;
  destination?: { kind: 'agent' | 'org' | 'device' | 'decision'; id: string; authorized?: boolean };
  slaMs?: number;
  elapsedMs?: number;
  sealedPayload?: string;
  copyAllToOnePlace?: boolean;
  rawPool?: boolean;
  exchangeKind?: 'aggregate' | 'raw_pool' | 'raw_cross_enterprise' | 'capability';
  counterpartyId?: string;
  collusionTopic?: string;
  targetLanguage?: string;
  needsCloudProvider?: boolean;
  needsExternalFreshness?: boolean;
  injectWaste?: boolean;
  observeOutcome?: boolean;
  root?: string;
};

export type InformationEconomyJob = {
  id: string;
  state: 'completed' | 'denied' | 'failed' | 'waiting_data' | 'unavailable';
  hopRecords: EconomyHopRecord[];
  sku: InformationSku | null;
  movementBytes: number;
  inventoryHit: boolean;
  bullwhip: BullwhipDetection | null;
  reduction: BullwhipReduction | null;
  slaBreached: boolean;
  rawPooled: false;
  sealedLeaked: false;
  executionAuthority: false;
  l4AutonomyEnabled: false;
};

function hop(
  name: InformationEconomyHop,
  state: EconomyEvidenceState,
  summary: string,
  movementBytes = 0,
): EconomyHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString(), movementBytes };
}

function predecessorReportState(repoRoot: string, file: string): EconomyEvidenceState {
  const candidates = [
    `${repoRoot}/docs/operations/${file}`,
    resolve(repoRoot, 'docs/operations', file),
    resolve(repoRoot, '../../docs/operations', file),
  ];
  return candidates.some((path) => existsSync(path)) ? 'PASS' : 'WAITING_DATA';
}

function localRoots(tenantId: string, universeId: string): InformationRoot[] {
  return [
    {
      id: 'local-lake',
      kind: 'knowledge_lake',
      namespaceId: 'xiv://t/u/knowledge/lake',
      tenantId,
      universeId,
      label: 'Knowledge Lake',
      configured: true,
      authorized: true,
      verified: true,
      offlineAvailable: true,
      partnershipInvented: false,
      lastVerifiedAt: new Date().toISOString(),
      metrics: {
        freshness: 0.9,
        provenance: 0.9,
        trust: 0.9,
        privacy: 0.95,
        latency: 0.9,
        cost: 0.95,
        offlineAvailability: 1,
        compatibility: 0.9,
        verifiedOutcomeQuality: 0.85,
        popularity: 0.01,
      },
      productionAuthorization: false,
    },
    {
      id: 'unconfigured-cloud',
      kind: 'provider',
      namespaceId: 'xiv://t/u/provider/gcp',
      tenantId,
      universeId,
      label: 'Unconfigured cloud',
      configured: false,
      authorized: false,
      verified: false,
      offlineAvailable: false,
      partnershipInvented: false,
      vendorId: 'gcp',
      metrics: { popularity: 0.99, freshness: 0.1 },
      productionAuthorization: false,
    },
  ];
}

export async function runInformationEconomyCycle(demand: InformationDemand): Promise<InformationEconomyJob> {
  const root = demand.root ?? process.cwd();
  const actor: SealedActor = demand.actor ?? { kind: 'ordinary_agent', id: 'info-logistics', role: 'librarian' };
  const records: EconomyHopRecord[] = [];
  const custody: CustodyEvent[] = [];
  const job: InformationEconomyJob = {
    id: demand.id,
    state: 'completed',
    hopRecords: records,
    sku: null,
    movementBytes: 0,
    inventoryHit: false,
    bullwhip: null,
    reduction: null,
    slaBreached: false,
    rawPooled: false,
    sealedLeaked: false,
    executionAuthority: false,
    l4AutonomyEnabled: false,
  };

  const deny = (name: InformationEconomyHop, reason: string, state: EconomyEvidenceState = 'DENIED') => {
    records.push(hop(name, state, reason, 0));
    job.state = state === 'UNAVAILABLE' ? 'unavailable' : state === 'WAITING_DATA' ? 'waiting_data' : 'denied';
    return job;
  };

  if (demand.approved === false) {
    return deny('information_demand', 'Unapproved information demand is not freight.');
  }
  if (founderImpersonationAttempt(actor)) {
    return deny('information_demand', FOUNDER_IMPERSONATION_DENY);
  }
  if (giepCollusionDenied({ ...(demand.collusionTopic ? { price: 1 } : {}) }, demand.collusionTopic)) {
    return deny('information_demand', ANTI_COLLUSION_DENY);
  }

  const fingerprint = fingerprintDemand(demand.query);
  await recordInformationDemand({ tenantId: demand.tenantId, universeId: demand.universeId, fingerprint, root });
  records.push(hop('information_demand', 'PASS', `Demand ${demand.id} accepted as information freight.`));

  if (demand.sealedPayload) {
    const sealed = await sealCeoRecord({
      tenantId: demand.tenantId,
      universeId: demand.universeId,
      label: demand.title,
      payload: demand.sealedPayload,
      actor: { kind: 'ceo_principal', id: 'ceo-principal-sim' },
      root,
    });
    if (!sealed.accepted || !sealed.record) {
      return deny('source', 'CEO sealed vault rejected the record.', 'DENIED');
    }
    await redactSealedForRouting({
      recordId: sealed.record.id,
      tenantId: demand.tenantId,
      universeId: demand.universeId,
      destination: 'peer',
      actor,
      root,
    });
    records.push(hop('source', 'DENIED', `${SEALED_NON_MOVEMENT}: sealed token stays in the vault.`, 0));
    records.push(hop('inventory', 'DENIED', 'Sealed freight is not ordinary inventory.', 0));
    records.push(hop('qualification', 'DENIED', 'Sealed sources are not ordinarily qualified.', 0));
    records.push(hop('routing', 'DENIED', 'Ordinary routing will not move sealed payloads.', 0));
    records.push(hop('minimum_necessary_transformation', 'PASS', `Redacted as ${SEALED_REDACTION}.`, 0));
    records.push(hop('delivery', 'DENIED', 'Sealed non-movement. Destination receives no payload.', 0));
    records.push(hop('quality_check', 'DENIED', 'No ordinary quality promotion of sealed freight.', 0));
    records.push(hop('decision', 'DENIED', 'Agents cannot decide to unseal or move CEO-sealed freight.', 0));
    records.push(hop('outcome', 'WAITING_DATA', 'No independent sealed-movement observation.', 0));
    await appendLearning({
      domain: 'information-economy',
      subject: demand.id,
      claimState: 'UNKNOWN',
      summary: 'Sealed non-movement held. Learning does not expand permissions.',
      sourceRefs: [sealed.record.id],
      evidence: [SEALED_NON_MOVEMENT],
    }, root);
    records.push(hop('learning', 'PASS', 'Learning ledger write; permissionChange=false.', 0));
    job.state = 'denied';
    job.movementBytes = 0;
    return job;
  }

  const sourceUri = demand.sourceUri ?? `local://demand/${demand.id}`;
  const qualification = qualifyInformationSource({
    sourceId: `src_${demand.id}`,
    sourceUri,
    provenanceRefs: ['local-demand'],
    providerConfigured: Boolean(demand.needsCloudProvider),
    providerVerified: false,
    partnershipClaimed: false,
  });
  await recordSourceQualification({ ...qualification, root });
  if (demand.needsCloudProvider) {
    records.push(hop('source', 'UNAVAILABLE', 'Cloud source provider is unverified.', 0));
    job.state = 'unavailable';
    return job;
  }
  records.push(hop('source', qualification.state, qualification.reason));

  const inventory = await lookupInformationInventory({
    tenantId: demand.tenantId,
    universeId: demand.universeId,
    query: demand.query,
    root,
  });
  job.inventoryHit = inventory.hit;
  records.push(
    hop(
      'inventory',
      'PASS',
      inventory.hit ? 'Inventory hit. Query-to-data, movementBytes=0.' : 'Stockout. Local source may replenish by hash ref.',
      0,
    ),
  );

  records.push(hop('qualification', qualification.qualified ? 'PASS' : qualification.state, qualification.reason));

  if (demand.rawPool || demand.exchangeKind === 'raw_pool' || demand.exchangeKind === 'raw_cross_enterprise') {
    records.push(hop('routing', 'DENIED', RAW_POOL_DENY, 0));
    job.state = 'denied';
    return job;
  }
  if (demand.copyAllToOnePlace) {
    records.push(hop('routing', 'DENIED', CENTRALIZATION_DENY, 0));
    job.state = 'denied';
    return job;
  }

  const qtd = queryToData({ inventoryHit: inventory.hit, sku: inventory.sku, copyAllToOnePlace: demand.copyAllToOnePlace });
  const semanticQuery: SemanticQuery = {
    need: demand.query,
    namespaceIri: 'xiv://t/u/information/economy',
    predicate: 'sku',
    industry: demand.domain ?? 'knowledge',
    partition: 'business',
    aggregation: 'hash',
    minimizeMovement: true,
  };
  const route = optimizeInformationRoute(localRoots(demand.tenantId, demand.universeId), semanticQuery);
  records.push(
    hop(
      'routing',
      route.winner ? 'PASS' : 'UNAVAILABLE',
      `Winner=${route.winner ?? 'none'}; popularity unused; ${qtd.reason}`,
      qtd.movementBytes,
    ),
  );

  let sku = inventory.sku;
  let firstWrite = false;
  if (!inventory.hit && demand.originalText) {
    const registered = await registerInformationSku({
      tenantId: demand.tenantId,
      universeId: demand.universeId,
      title: demand.title,
      domain: demand.domain ?? 'knowledge',
      originalText: demand.originalText,
      sourceId: qualification.sourceId,
      sourceUri,
      provenanceRefs: ['local-demand', demand.id],
      root,
    });
    sku = registered.sku;
    firstWrite = !registered.duplicate;
  }
  job.sku = sku;
  const replenish = await replenishInformation({
    tenantId: demand.tenantId,
    universeId: demand.universeId,
    fingerprint,
    sku,
    copyAllToOnePlace: demand.copyAllToOnePlace,
    root,
  });
  records.push(
    hop(
      'minimum_necessary_transformation',
      'PASS',
      `Hash/ref only. copiesPayload=false. replenish=${replenish.reason}`,
      qtd.movementBytes,
    ),
  );

  const waste = demand.injectWaste
    ? wastefulBullwhipTrace({ demandId: demand.id, fingerprint, inventoryHit: inventory.hit })
    : leanTraceForFulfillment({
        demandId: demand.id,
        fingerprint,
        inventoryHit: inventory.hit,
        firstWrite,
      });
  job.bullwhip = detectInformationBullwhip(waste);
  if (demand.injectWaste) {
    job.reduction = reduceInformationBullwhip(waste);
  }

  const destId = demand.destination?.id ?? 'local-agent';
  const destAuthorized = demand.destination?.authorized !== false;
  if (!destAuthorized) {
    records.push(hop('delivery', 'DENIED', 'Destination is not authorized to receive this SKU.', 0));
    job.state = 'denied';
    return job;
  }
  const delivery = await deliverOffline({
    tenantId: demand.tenantId,
    universeId: demand.universeId,
    query: demand.query,
    inventoryHit: inventory.hit || Boolean(sku),
    needsCloudProvider: demand.needsCloudProvider,
    needsExternalFreshness: demand.needsExternalFreshness,
    root,
  });
  const sla = evaluateSla({ slaMs: demand.slaMs ?? 60_000, elapsedMs: demand.elapsedMs ?? 5 });
  job.slaBreached = sla.breached;
  records.push(
    hop(
      'delivery',
      sla.breached ? 'FAIL' : delivery.state === 'PASS' ? 'PASS' : (delivery.state as EconomyEvidenceState),
      `${delivery.reason} ${sla.reason}`,
      delivery.movementBytes,
    ),
  );

  if (sku?.lakeObjectId && demand.targetLanguage) {
    await routeMultilingual({
      lakeObjectId: sku.lakeObjectId,
      tenantId: demand.tenantId,
      universeId: demand.universeId,
      targetLanguage: demand.targetLanguage,
      translatedText: demand.originalText,
      root,
    });
  }

  const custodyResult = appendChainOfCustody(custody, {
    skuId: sku?.id,
    contentHash: sku?.contentHash ?? fingerprint,
    from: `universe:${demand.universeId}`,
    to: `${demand.destination?.kind ?? 'agent'}:${destId}`,
    hop: 'delivery',
    at: new Date().toISOString(),
    movementBytes: qtd.movementBytes,
    sealedMoved: false,
  });

  const quality = sku
    ? await promoteLakeClaim({
        text: demand.query,
        tenantId: demand.tenantId,
        universeId: demand.universeId,
        lakeObjectId: sku.lakeObjectId,
        aiAgreementOnly: true,
        root,
      })
    : { state: 'UNVERIFIED' as const, promotedToVerified: false as const, inventedPass: false as const, reason: 'No SKU yet.' };
  records.push(
    hop(
      'quality_check',
      quality.promotedToVerified ? 'FAIL' : 'PASS',
      `${quality.reason} inventedPass=${quality.inventedPass}`,
      0,
    ),
  );

  const gate = decisionGate({
    id: demand.id,
    action: 'deliver_information',
    consequence: 'HIGH',
    production: true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  records.push(
    hop(
      'decision',
      gate.executableByAgent ? 'FAIL' : 'PASS',
      `${gate.reason} executableByAgent=${gate.executableByAgent}`,
      0,
    ),
  );

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: demand.tenantId,
      universeId: demand.universeId,
      summary: `62L-AU information economy cycle ${demand.id}`,
      payload: {
        fingerprint,
        inventoryHit: inventory.hit,
        winner: route.winner,
        custodyAllowed: custodyResult.allowed,
        bullwhip: job.bullwhip?.detected ?? false,
      },
    },
    root,
  );

  if (!demand.observeOutcome) {
    records.push(hop('outcome', 'WAITING_DATA', 'No independently observed decision outcome. Not invented PASS.', 0));
  } else {
    records.push(hop('outcome', 'PASS', 'Caller supplied an independent local outcome observation.', 0));
  }

  const checkpoints = new LocalCheckpointStore(join(root, '.xiv-local', 'brain-state.json'));
  await checkpoints.checkpoint({
    taskId: demand.id,
    at: new Date().toISOString(),
    state: 'completed',
    attempt: 1,
    summary: `62L-AU cycle hops=${records.length}`,
  });

  await appendLearning(
    {
      domain: 'information-economy',
      subject: demand.id,
      claimState: 'MODEL_INFERENCE',
      summary: `Cycle complete. bullwhip=${job.bullwhip?.detected ?? false} inventoryHit=${inventory.hit}`,
      sourceRefs: [sku?.id ?? demand.id],
      evidence: [qtd.reason],
    },
    root,
  );
  records.push(hop('learning', 'PASS', 'Learning ledger write; permissionChange=false.', 0));

  job.movementBytes = qtd.movementBytes;
  if (sla.breached) job.state = 'failed';
  else if (records.some((item) => item.state === 'WAITING_DATA') && !demand.observeOutcome) job.state = 'completed';
  return job;
}

export async function buildInformationEconomyHealthReport(cwd = process.cwd()) {
  const repoRoot = existsSync(`${cwd}/docs/operations`) ? cwd : resolve(cwd, '../..');
  const predecessors: Record<string, EconomyEvidenceState> = {};
  for (const [key, file] of Object.entries(PREDECESSOR_REPORTS)) {
    predecessors[key] = predecessorReportState(repoRoot, file);
  }
  const providers = providerSlots();
  const unverified = unverifiedProvidersUnavailable();
  const network = buildKnowledgeLogisticsNetwork([
    { id: 'agent-a', kind: 'agent', tenantId: 'local-tenant', universeId: 'local-universe', authorized: true, offlineAvailable: true },
    { id: 'org-local', kind: 'org', tenantId: 'local-tenant', universeId: 'local-universe', authorized: true, offlineAvailable: true },
    { id: 'device-local', kind: 'device', tenantId: 'local-tenant', universeId: 'local-universe', authorized: true, offlineAvailable: true },
  ]);
  const wasteDemo = wastefulBullwhipTrace({ demandId: 'health', fingerprint: 'health', inventoryHit: true });
  const detection = detectInformationBullwhip(wasteDemo);
  const reduction = reduceInformationBullwhip(wasteDemo);
  const vault = await sealedVaultStats(cwd);
  return {
    phase: '62L-AU',
    honesty: { ...INFORMATION_ECONOMY_LOCKS },
    loop: INFORMATION_ECONOMY_LOOP,
    predecessors,
    githubIssue59: 'UNAVAILABLE' as const,
    windowsNodeVerification: 'NOT_TESTED' as const,
    providers: providers.map((slot) => ({ provider: slot.provider, state: slot.state, configured: slot.configured })),
    unverifiedProviderCount: unverified.length,
    network,
    bullwhipDetector: { detected: detection.detected, reduced: reduction.reduced, amplification: detection.amplification },
    costToServe: costToServe(reduction.after),
    bottlenecks: detectLogisticsBottlenecks({ routing: 1, delivery: 0, inventory: 0 }),
    resilience: planResilience({ sealed: false, localOffline: true }),
    vaultRecords: vault.records,
    forecastEpistemicClass: (await forecastFromLog({ tenantId: 'local-tenant', universeId: 'local-universe', fingerprint: 'none', root: cwd })).epistemicClass,
    productionAuthorization: false,
    executionsAuthorized: 0,
    tipLand: false,
  };
}

export {
  costToServe,
  detectInformationBullwhip,
  detectLogisticsBottlenecks,
  evaluateSla,
  forecastFromLog,
  HASH_REF_BYTES,
  queryToData,
  reduceInformationBullwhip,
  wastefulBullwhipTrace,
};
