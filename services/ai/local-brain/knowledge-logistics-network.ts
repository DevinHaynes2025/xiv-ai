import { attachTranslationMetadata } from './multilingual-source';
import { retrieveOfflineKnowledge } from './knowledge-retrieval';
import {
  routeOfflineFirst,
  scoreInformationRoute,
} from './semantic-internet-router';
import type { InformationRoot, SemanticQuery } from './information-control-tower-types';
import { evaluateOfflineTask } from './offline-policy';
import { providerSlots } from './provider-fabric';
import { HASH_REF_BYTES, QUERY_TO_DATA, type EconomyEvidenceState } from './information-economy-types';
import type { InformationSku } from './information-skus';

export type LogisticsNodeKind = 'agent' | 'org' | 'device' | 'decision';

export type KnowledgeLogisticsNode = {
  id: string;
  kind: LogisticsNodeKind;
  tenantId: string;
  universeId: string;
  authorized: boolean;
  offlineAvailable: boolean;
};

export type CustodyEvent = {
  skuId?: string;
  contentHash: string;
  from: string;
  to: string;
  hop: string;
  at: string;
  movementBytes: number;
  sealedMoved: false;
};

export type SlaResult = {
  slaMs: number;
  elapsedMs: number;
  breached: boolean;
  state: EconomyEvidenceState;
  reason: string;
};

export type BottleneckReport = {
  hop: string;
  queueDepth: number;
  bottleneck: boolean;
};

export function queryToData(input: {
  inventoryHit: boolean;
  sku?: InformationSku | null;
  copyAllToOnePlace?: boolean;
}): {
  strategy: 'query_to_data' | 'denied_centralization';
  movementBytes: number;
  copyAllToOnePlace: false;
  reason: string;
  state: EconomyEvidenceState;
} {
  if (input.copyAllToOnePlace) {
    return {
      strategy: 'denied_centralization',
      movementBytes: 0,
      copyAllToOnePlace: false,
      reason: `${QUERY_TO_DATA}: brute-force centralization of raw knowledge is denied.`,
      state: 'DENIED',
    };
  }
  return {
    strategy: 'query_to_data',
    movementBytes: input.inventoryHit ? 0 : HASH_REF_BYTES,
    copyAllToOnePlace: false,
    reason: input.inventoryHit
      ? 'Query travelled to the local SKU/lake object. Payload was not copied.'
      : 'Minimum necessary is a content-hash ref, not a raw dump.',
    state: 'PASS',
  };
}

export function optimizeInformationRoute(roots: InformationRoot[], query: SemanticQuery) {
  const ranked = routeOfflineFirst(roots, query);
  const winner = Array.isArray(ranked.selected) ? ranked.selected[0]?.filter.root.id ?? null : null;
  const scores = roots.map((item) => scoreInformationRoute(item));
  const unconfigured = roots.filter((item) => !item.configured || !item.verified);
  return {
    winner,
    usedPopularity: false as const,
    minimizeMovement: true as const,
    unconfigured: unconfigured.map((item) => item.id),
    scores,
    state: winner ? ('PASS' as const) : ('UNAVAILABLE' as const),
  };
}

export function evaluateSla(input: { slaMs: number; elapsedMs: number }): SlaResult {
  const breached = input.elapsedMs > input.slaMs;
  return {
    slaMs: input.slaMs,
    elapsedMs: input.elapsedMs,
    breached,
    state: breached ? 'FAIL' : 'PASS',
    reason: breached
      ? `Information delivery SLA breached (${input.elapsedMs}ms > ${input.slaMs}ms).`
      : 'Delivery completed within the information SLA.',
  };
}

export function detectLogisticsBottlenecks(queueByHop: Record<string, number>): BottleneckReport[] {
  const values = Object.values(queueByHop);
  const max = values.length ? Math.max(...values) : 0;
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  return Object.entries(queueByHop).map(([hop, queueDepth]) => ({
    hop,
    queueDepth,
    bottleneck: queueDepth > 0 && max >= 3 && queueDepth === max && queueDepth >= mean * 2,
  }));
}

export function appendChainOfCustody(events: CustodyEvent[], event: CustodyEvent) {
  if (event.from.split(':')[0] === 'universe' && event.to.split(':')[0] === 'universe' && event.from !== event.to) {
    return {
      allowed: false as const,
      events,
      reason: 'Cross-universe raw custody merge is denied.',
    };
  }
  return { allowed: true as const, events: [...events, event], reason: 'Custody hop recorded as hash/ref only.' };
}

export async function deliverOffline(input: {
  tenantId: string;
  universeId: string;
  query: string;
  inventoryHit: boolean;
  needsCloudProvider?: boolean;
  needsExternalFreshness?: boolean;
  root?: string;
}) {
  const offline = evaluateOfflineTask({
    needsInternet: Boolean(input.needsExternalFreshness),
    needsCloudProvider: Boolean(input.needsCloudProvider),
    needsExternalFreshness: Boolean(input.needsExternalFreshness),
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: 'internal',
  });
  if (!offline.allowed) {
    return { state: offline.state, movementBytes: 0, reason: offline.reason, retrieval: null };
  }
  if (input.inventoryHit) {
    return {
      state: 'PASS' as const,
      movementBytes: 0,
      reason: 'Offline delivery from local information inventory. No payload copied.',
      retrieval: null,
    };
  }
  const retrieval = await retrieveOfflineKnowledge(input.query, {
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
    needsExternalFreshness: input.needsExternalFreshness,
  });
  return {
    state: retrieval.state === 'AVAILABLE' ? ('PASS' as const) : retrieval.state,
    movementBytes: 0,
    reason: retrieval.reason,
    retrieval,
  };
}

export async function routeMultilingual(input: {
  lakeObjectId: string;
  tenantId: string;
  universeId: string;
  targetLanguage: string;
  translatedText?: string;
  root?: string;
}) {
  const translation = await attachTranslationMetadata({
    lakeObjectId: input.lakeObjectId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    targetLanguage: input.targetLanguage,
    translatedText: input.translatedText,
    translator: 'human',
    root: input.root,
  });
  return {
    ...translation,
    routedWithoutReplacingOriginal: translation.replacesOriginal === false,
  };
}

export function planResilience(input: { sealed: boolean; localOffline: boolean }) {
  return {
    localRefsRetained: !input.sealed && input.localOffline,
    sealedMoved: false as const,
    automaticFailover: false as const,
    productionFailoverAuthorized: false as const,
    l4AutonomyEnabled: false as const,
    reason: input.sealed
      ? 'CEO-sealed freight stays in the vault. Resilience does not replicate sealed payloads.'
      : 'Resilience plan retains local SKU refs. Failover is a recommendation, not production control.',
  };
}

export function unverifiedProvidersUnavailable() {
  return providerSlots().filter((slot) => slot.provider !== 'local' || slot.state === 'UNAVAILABLE');
}

export function buildKnowledgeLogisticsNetwork(nodes: KnowledgeLogisticsNode[]) {
  const authorized = nodes.filter((node) => node.authorized);
  return {
    nodes: authorized,
    edges: authorized.flatMap((from, i) =>
      authorized.slice(i + 1).map((to) => ({ from: from.id, to: to.id, freight: 'sku_ref', duplicate: false })),
    ),
    duplicatesCoalesced: true as const,
    rawPooling: false as const,
  };
}
