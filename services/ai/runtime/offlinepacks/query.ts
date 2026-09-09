/**
 * 62L-EX14 — Offline local search / RAG.
 * Tenant + Universe scoped, rights aware.
 * No TENANT_PRIVATE mixed with global packs; no cross-tenant / cross-Universe.
 */

import {
  createId,
  nowIso,
  resolveOfflineWebDependency,
  type ClaimFactState,
  type LocalCandidateEvidence,
  type LocalIndexEntry,
  type NormalizedRecord,
  type OfflineResearchPack,
  type OfflineUsageState,
  type PackResearchTeamAssignment,
} from './types.ts';
import { tokenize } from './pack-builder.ts';
import type { IndexStore } from './indexer.ts';
import type { PackBuildStore } from './pack-builder.ts';

export type QueryRequest = {
  tenantId: string;
  universeId: string;
  query: string;
  networkAvailable: boolean;
  devicePowered: boolean;
  storageAvailable: boolean;
  allowTenantPrivate: boolean;
};

export type QueryHit = {
  recordId: string;
  title: string;
  snippet: string;
  score: number;
  claimFactState: ClaimFactState;
  sourceRefs: readonly string[];
};

export type QueryResult =
  | {
      ok: true;
      usageState: OfflineUsageState;
      answer: string;
      sourceRefs: readonly string[];
      confidence: 'low' | 'medium' | 'high';
      freshness: OfflineResearchPack['freshnessState'];
      limitations: readonly string[];
      hits: readonly QueryHit[];
      offlineMode: true;
    }
  | {
      ok: false;
      usageState: OfflineUsageState;
      disposition: 'DENIED' | 'WAITING_DATA' | 'PACK_MISSING' | 'OFFLINE_STOPPED';
      reason: string;
      offlineMode: true;
    };

function usageForPack(
  pack: OfflineResearchPack | undefined,
  env: { devicePowered: boolean; storageAvailable: boolean },
): OfflineUsageState {
  if (!env.devicePowered || !env.storageAvailable) return 'OFFLINE_STOPPED';
  if (!pack) return 'PACK_MISSING';
  if (pack.status === 'REVOKED' || pack.buildState === 'REVOKED') return 'PACK_REVOKED';
  if (pack.freshnessState === 'STALE' || pack.status === 'STALE' || pack.buildState === 'STALE') {
    return 'PACK_STALE';
  }
  if (pack.status === 'PARTIAL' || pack.buildState === 'PARTIAL') return 'LOCAL_DEGRADED';
  if (pack.status === 'READY' && pack.buildState === 'READY') return 'LOCAL_READY';
  return 'LOCAL_DEGRADED';
}

export function resolveOfflineUsage(
  pack: OfflineResearchPack | undefined,
  env: { devicePowered: boolean; storageAvailable: boolean; schedulerOk?: boolean; authorized?: boolean },
): OfflineUsageState {
  if (!env.devicePowered || !env.storageAvailable) return 'OFFLINE_STOPPED';
  return usageForPack(pack, env);
}

export function ingestionAllowed(env: {
  devicePowered: boolean;
  schedulerOk: boolean;
  authorized: boolean;
  storageAvailable: boolean;
}): { allowed: boolean; usageState: OfflineUsageState } {
  if (!env.devicePowered || !env.schedulerOk || !env.authorized || !env.storageAvailable) {
    return { allowed: false, usageState: 'OFFLINE_STOPPED' };
  }
  return { allowed: true, usageState: 'LOCAL_READY' };
}

export function queryOfflinePack(input: {
  buildStore: PackBuildStore;
  indexStore: IndexStore;
  packId: string;
  request: QueryRequest;
}): QueryResult {
  const pack = input.buildStore.packs.get(input.packId);
  const usageState = usageForPack(pack, {
    devicePowered: input.request.devicePowered,
    storageAvailable: input.request.storageAvailable,
  });

  if (usageState === 'OFFLINE_STOPPED') {
    return {
      ok: false,
      usageState,
      disposition: 'OFFLINE_STOPPED',
      reason: 'Device powered off or storage unavailable → OFFLINE_STOPPED (agents not still working).',
      offlineMode: true,
    };
  }

  if (!pack || usageState === 'PACK_MISSING') {
    return {
      ok: false,
      usageState: 'PACK_MISSING',
      disposition: 'PACK_MISSING',
      reason: 'Pack missing locally.',
      offlineMode: true,
    };
  }

  if (usageState === 'PACK_REVOKED') {
    return {
      ok: false,
      usageState,
      disposition: 'DENIED',
      reason: 'Pack REVOKED — excluded from retrieval; audit history retained.',
      offlineMode: true,
    };
  }

  if (pack.tenantId !== input.request.tenantId) {
    return {
      ok: false,
      usageState: 'LOCAL_DEGRADED',
      disposition: 'DENIED',
      reason: 'Cross-tenant retrieval DENIED.',
      offlineMode: true,
    };
  }

  if (pack.universeId !== input.request.universeId) {
    return {
      ok: false,
      usageState: 'LOCAL_DEGRADED',
      disposition: 'DENIED',
      reason: 'Cross-Universe retrieval DENIED.',
      offlineMode: true,
    };
  }

  const rights = input.buildStore.rights.get(pack.rightsManifestId);
  if (rights?.tenantPrivate && pack.replicationPolicy === 'GLOBAL_PUBLIC_PACK') {
    return {
      ok: false,
      usageState: 'LOCAL_DEGRADED',
      disposition: 'DENIED',
      reason: 'TENANT_PRIVATE must not mix with global packs.',
      offlineMode: true,
    };
  }

  if (rights?.tenantPrivate && !input.request.allowTenantPrivate) {
    return {
      ok: false,
      usageState: 'LOCAL_DEGRADED',
      disposition: 'DENIED',
      reason: 'Tenant-private pack requires tenant-scoped retrieval authorization.',
      offlineMode: true,
    };
  }

  const manifest = input.buildStore.manifests.get(pack.sourceManifestId);
  if (manifest) {
    for (const entry of manifest.entries) {
      if (entry.requiresLiveWeb && !input.request.networkAvailable) {
        const dep = resolveOfflineWebDependency({
          requiresLiveWeb: true,
          networkAvailable: false,
          dependencyName: entry.title,
        });
        return {
          ok: false,
          usageState: 'LOCAL_DEGRADED',
          disposition: 'WAITING_DATA',
          reason: dep.note,
          offlineMode: true,
        };
      }
    }
  }

  const records = input.buildStore.records.get(pack.packId) ?? [];
  const index = (input.indexStore.indexes.get(pack.packId) ?? []).filter((e) => !e.revoked);
  const qTokens = new Set(tokenize(input.request.query));
  const recordById = new Map(records.map((r) => [r.recordId, r]));

  const scored: QueryHit[] = [];
  for (const entry of index) {
    if (entry.tenantId !== input.request.tenantId || entry.universeId !== input.request.universeId) {
      continue;
    }
    const rec = recordById.get(entry.recordId);
    if (!rec) continue;
    if (pack.revokedSourceIds.some((id) => rec.sourceRefs.includes(id))) continue;

    let score = 0;
    for (const t of entry.tokens) {
      if (qTokens.has(t)) score += 1;
    }
    if (score <= 0) continue;
    scored.push({
      recordId: rec.recordId,
      title: rec.title,
      snippet: rec.body.slice(0, 180),
      score,
      claimFactState: rec.claimFactState,
      sourceRefs: rec.sourceRefs,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);
  const limitations: string[] = [
    'OFFLINE_MODE=true — cached pack must not be pretended as live web current.',
    'Historical quantum research ≠ physical QPU evidence.',
    'Results are local candidates only until Home Base review.',
  ];
  if (usageState === 'PACK_STALE') {
    limitations.push('Pack is STALE — treat freshness accordingly.');
  }

  const answer =
    top.length > 0
      ? top.map((h) => `${h.title}: ${h.snippet}`).join('\n')
      : 'No local hits in offline pack.';

  return {
    ok: true,
    usageState,
    answer,
    sourceRefs: Array.from(new Set(top.flatMap((h) => [...h.sourceRefs]))),
    confidence: top.length >= 3 ? 'high' : top.length >= 1 ? 'medium' : 'low',
    freshness: pack.freshnessState,
    limitations,
    hits: top,
    offlineMode: true,
  };
}

/** Agent research loop ends in LOCAL_CANDIDATE — never immediate global truth. */
export function recordLocalCandidate(input: {
  pack: OfflineResearchPack;
  summary: string;
  sourceRefs: readonly string[];
  claimFactState?: ClaimFactState;
}): LocalCandidateEvidence {
  return {
    evidenceId: createId('ev'),
    packId: input.pack.packId,
    tenantId: input.pack.tenantId,
    universeId: input.pack.universeId,
    claimFactState: input.claimFactState ?? 'HYPOTHESIS',
    promotionState: 'LOCAL_CANDIDATE',
    autoGlobalPromote: false,
    sourceRefs: input.sourceRefs,
    summary: input.summary,
    hiddenCot: false,
    createdAt: nowIso(),
  };
}

export function attemptAutoGlobalPromote(_evidence: LocalCandidateEvidence): {
  allowed: false;
  reason: string;
} {
  return {
    allowed: false,
    reason: 'Offline learning produces LOCAL_CANDIDATE only — no auto global promote.',
  };
}

export function attemptPersistHiddenCot(_cot: string): { allowed: false; reason: string } {
  return {
    allowed: false,
    reason: 'Hidden chain-of-thought persistence DENIED by EX14 locks.',
  };
}

export function assignPackResearchRole(input: {
  role: PackResearchTeamAssignment['role'];
  agentMeshRoleRef: string;
  tenantId: string;
  universeId: string;
}): PackResearchTeamAssignment {
  return {
    role: input.role,
    agentMeshRoleRef: input.agentMeshRoleRef,
    tenantId: input.tenantId,
    universeId: input.universeId,
  };
}

export function scoreIndexOverlap(entry: LocalIndexEntry, query: string): number {
  const q = new Set(tokenize(query));
  let score = 0;
  for (const t of entry.tokens) if (q.has(t)) score += 1;
  return score;
}

export type { NormalizedRecord };
