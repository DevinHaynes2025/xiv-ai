/**
 * 62L-CO International Archive Discovery Engine — authorized sources only.
 * Explicit UNKNOWN gaps preserved; no fabricated coverage; no all-world without evidence.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ALL_WORLD_COVERAGE_NOT_VERIFIED,
  CO_LOCKS,
  HONESTY_BANNER,
  UNAUTHORIZED_ARCHIVE_DISCOVERY_DENIED,
  UNKNOWN_GAP_PRESERVED,
  type CoActor,
} from './global-knowledge-exchange-os-types';

export type ArchiveDiscoverySource = {
  id: string;
  name: string;
  authorized: boolean;
  coverageClaim: 'regional' | 'multi_region' | 'all_world';
  coverageEvidenceRefs: string[];
  coverageStatus: 'DOCUMENTED' | 'VERIFIED' | 'NOT_VERIFIED' | 'DENIED' | 'UNKNOWN';
  unknownGaps: string[];
  reason: string;
  createdAt: string;
};

export type ArchiveDiscoveryAttempt = {
  id: string;
  sourceId: string | null;
  accepted: boolean;
  reason: string;
  unknownGaps: string[];
  at: string;
};

type Store = {
  sources: ArchiveDiscoverySource[];
  discoveries: ArchiveDiscoveryAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'international-archive-discovery-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { sources: [], discoveries: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function archiveDiscoveryHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CO_LOCKS.L4_AUTONOMY_ENABLED,
    arbitraryArchiveDiscovery: CO_LOCKS.ARBITRARY_ARCHIVE_DISCOVERY,
    allWorldCoverageWithoutEvidence: CO_LOCKS.ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE,
    inventCoverageForUnknownGap: CO_LOCKS.INVENT_COVERAGE_FOR_UNKNOWN_GAP,
    preserveExplicitUnknownGaps: CO_LOCKS.PRESERVE_EXPLICIT_UNKNOWN_GAPS,
  };
}

export async function registerArchiveDiscoverySource(input: {
  name: string;
  authorized: boolean;
  coverageClaim?: ArchiveDiscoverySource['coverageClaim'];
  coverageEvidenceRefs?: string[];
  unknownGaps?: string[];
  /** Probe: attempt to invent coverage for unknown gaps. */
  inventCoverageForGaps?: boolean;
  root: string;
  actor: CoActor;
}): Promise<ArchiveDiscoverySource> {
  const store = await load(input.root);
  const claim = input.coverageClaim ?? 'regional';
  const evidence = input.coverageEvidenceRefs ?? [];
  const gaps = [...(input.unknownGaps ?? [])];
  const now = new Date().toISOString();

  let coverageStatus: ArchiveDiscoverySource['coverageStatus'] = 'DOCUMENTED';
  let reason = 'ARCHIVE_DISCOVERY_SOURCE_REGISTERED';

  if (!input.authorized) {
    coverageStatus = 'DENIED';
    reason = UNAUTHORIZED_ARCHIVE_DISCOVERY_DENIED;
  } else if (claim === 'all_world' && evidence.length === 0) {
    coverageStatus = 'NOT_VERIFIED';
    reason = ALL_WORLD_COVERAGE_NOT_VERIFIED;
  } else if (claim === 'all_world' && evidence.length > 0) {
    coverageStatus = 'VERIFIED';
    reason = 'ALL_WORLD_COVERAGE_LABELED_WITH_EVIDENCE';
  } else if (evidence.length > 0) {
    coverageStatus = 'VERIFIED';
    reason = 'COVERAGE_LABELED_WITH_EVIDENCE';
  }

  if (gaps.length > 0) {
    if (input.inventCoverageForGaps === true) {
      // Explicitly refuse to invent coverage — preserve UNKNOWN gaps.
      coverageStatus =
        coverageStatus === 'VERIFIED' || coverageStatus === 'DOCUMENTED'
          ? 'UNKNOWN'
          : coverageStatus;
      reason = UNKNOWN_GAP_PRESERVED;
    } else {
      reason =
        coverageStatus === 'NOT_VERIFIED' || coverageStatus === 'DENIED'
          ? reason
          : UNKNOWN_GAP_PRESERVED;
      if (coverageStatus === 'DOCUMENTED' || coverageStatus === 'VERIFIED') {
        coverageStatus = gaps.length > 0 ? 'UNKNOWN' : coverageStatus;
      }
    }
  }

  const source: ArchiveDiscoverySource = {
    id: id('ads'),
    name: input.name,
    authorized: input.authorized === true,
    coverageClaim: claim,
    coverageEvidenceRefs: evidence,
    coverageStatus,
    unknownGaps: gaps,
    reason,
    createdAt: now,
  };
  store.sources.push(source);
  await save(input.root, store);
  return source;
}

export async function attemptArchiveDiscovery(input: {
  sourceId?: string | null;
  authorized?: boolean;
  unknownGaps?: string[];
  inventCoverageForGaps?: boolean;
  root: string;
  actor: CoActor;
}): Promise<ArchiveDiscoveryAttempt> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const source = input.sourceId
    ? store.sources.find((s) => s.id === input.sourceId)
    : undefined;
  const gaps = [...(input.unknownGaps ?? source?.unknownGaps ?? [])];

  if (input.authorized === false || source?.authorized === false || !source) {
    if (input.authorized === false || (source && source.authorized === false)) {
      const attempt: ArchiveDiscoveryAttempt = {
        id: id('disc'),
        sourceId: input.sourceId ?? null,
        accepted: false,
        reason: UNAUTHORIZED_ARCHIVE_DISCOVERY_DENIED,
        unknownGaps: gaps,
        at: now,
      };
      store.discoveries.push(attempt);
      await save(input.root, store);
      return attempt;
    }
    if (!source && CO_LOCKS.ARBITRARY_ARCHIVE_DISCOVERY === false) {
      const attempt: ArchiveDiscoveryAttempt = {
        id: id('disc'),
        sourceId: null,
        accepted: false,
        reason: UNAUTHORIZED_ARCHIVE_DISCOVERY_DENIED,
        unknownGaps: gaps,
        at: now,
      };
      store.discoveries.push(attempt);
      await save(input.root, store);
      return attempt;
    }
  }

  if (gaps.length > 0 && input.inventCoverageForGaps === true) {
    const attempt: ArchiveDiscoveryAttempt = {
      id: id('disc'),
      sourceId: source!.id,
      accepted: false,
      reason: UNKNOWN_GAP_PRESERVED,
      unknownGaps: gaps,
      at: now,
    };
    store.discoveries.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const attempt: ArchiveDiscoveryAttempt = {
    id: id('disc'),
    sourceId: source!.id,
    accepted: true,
    reason:
      gaps.length > 0
        ? UNKNOWN_GAP_PRESERVED
        : 'AUTHORIZED_ARCHIVE_DISCOVERY_ACCEPTED',
    unknownGaps: gaps,
    at: now,
  };
  store.discoveries.push(attempt);
  await save(input.root, store);
  return attempt;
}
