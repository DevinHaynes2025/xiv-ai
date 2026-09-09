/**
 * 62L-CM Global Archive Observatory — authorized international archives only.
 * No arbitrary discovery; coverage catalogs labeled by evidence; no unsupported all-world claims.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ALL_WORLD_COVERAGE_NOT_VERIFIED,
  CM_LOCKS,
  HONESTY_BANNER,
  UNAUTHORIZED_ARCHIVE_INTAKE_DENIED,
  type CmActor,
} from './sovereign-regional-knowledge-clouds-types';

export type ArchiveSource = {
  id: string;
  name: string;
  authorized: boolean;
  coverageEvidenceRefs: string[];
  coverageClaim: 'regional' | 'multi_region' | 'all_world';
  coverageStatus: 'DOCUMENTED' | 'VERIFIED' | 'NOT_VERIFIED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type ArchiveIntake = {
  id: string;
  sourceId: string | null;
  accepted: boolean;
  reason: string;
  at: string;
};

type Store = {
  sources: ArchiveSource[];
  intakes: ArchiveIntake[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-archive-observatory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { sources: [], intakes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function archiveObservatoryHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CM_LOCKS.L4_AUTONOMY_ENABLED,
    arbitraryArchiveDiscovery: CM_LOCKS.ARBITRARY_ARCHIVE_DISCOVERY,
    allWorldCoverageWithoutEvidence: CM_LOCKS.ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE,
  };
}

export async function registerArchiveSource(input: {
  name: string;
  authorized: boolean;
  coverageClaim?: ArchiveSource['coverageClaim'];
  coverageEvidenceRefs?: string[];
  root: string;
  actor: CmActor;
}): Promise<ArchiveSource> {
  const store = await load(input.root);
  const claim = input.coverageClaim ?? 'regional';
  const evidence = input.coverageEvidenceRefs ?? [];
  const now = new Date().toISOString();

  let coverageStatus: ArchiveSource['coverageStatus'] = 'DOCUMENTED';
  let reason = 'ARCHIVE_SOURCE_REGISTERED';

  if (!input.authorized) {
    coverageStatus = 'DENIED';
    reason = UNAUTHORIZED_ARCHIVE_INTAKE_DENIED;
  } else if (claim === 'all_world' && evidence.length === 0) {
    coverageStatus = 'NOT_VERIFIED';
    reason = ALL_WORLD_COVERAGE_NOT_VERIFIED;
  } else if (claim === 'all_world' && evidence.length > 0) {
    // Evidence present → still only DOCUMENTED/VERIFIED label path; VERIFIED only with evidence.
    coverageStatus = 'VERIFIED';
    reason = 'ALL_WORLD_COVERAGE_LABELED_WITH_EVIDENCE';
  } else if (evidence.length > 0) {
    coverageStatus = 'VERIFIED';
    reason = 'COVERAGE_LABELED_WITH_EVIDENCE';
  }

  const source: ArchiveSource = {
    id: id('arch'),
    name: input.name,
    authorized: input.authorized === true,
    coverageEvidenceRefs: evidence,
    coverageClaim: claim,
    coverageStatus,
    reason,
    createdAt: now,
  };
  store.sources.push(source);
  await save(input.root, store);
  return source;
}

export async function intakeArchiveObservation(input: {
  sourceId?: string;
  /** Probe: attempt intake without authorization / arbitrary discovery. */
  attemptUnauthorized?: boolean;
  attemptArbitraryDiscovery?: boolean;
  root: string;
  actor: CmActor;
}): Promise<ArchiveIntake> {
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (input.attemptUnauthorized === true || input.attemptArbitraryDiscovery === true) {
    const intake: ArchiveIntake = {
      id: id('aintake'),
      sourceId: input.sourceId ?? null,
      accepted: false,
      reason: UNAUTHORIZED_ARCHIVE_INTAKE_DENIED,
      at: now,
    };
    store.intakes.push(intake);
    await save(input.root, store);
    return intake;
  }

  const source = input.sourceId
    ? store.sources.find((s) => s.id === input.sourceId)
    : undefined;

  if (!source || !source.authorized) {
    const intake: ArchiveIntake = {
      id: id('aintake'),
      sourceId: source?.id ?? null,
      accepted: false,
      reason: UNAUTHORIZED_ARCHIVE_INTAKE_DENIED,
      at: now,
    };
    store.intakes.push(intake);
    await save(input.root, store);
    return intake;
  }

  const intake: ArchiveIntake = {
    id: id('aintake'),
    sourceId: source.id,
    accepted: true,
    reason: 'AUTHORIZED_ARCHIVE_INTAKE_ACCEPTED',
    at: now,
  };
  store.intakes.push(intake);
  await save(input.root, store);
  return intake;
}

export async function claimAllWorldCoverage(input: {
  sourceId: string;
  evidenceRefs?: string[];
  root: string;
  actor: CmActor;
}): Promise<ArchiveSource> {
  const store = await load(input.root);
  const source = store.sources.find((s) => s.id === input.sourceId);
  if (!source) {
    throw new Error('ARCHIVE_SOURCE_NOT_FOUND');
  }
  const evidence = input.evidenceRefs ?? [];
  source.coverageClaim = 'all_world';
  source.coverageEvidenceRefs = evidence;
  if (evidence.length === 0) {
    source.coverageStatus = 'NOT_VERIFIED';
    source.reason = ALL_WORLD_COVERAGE_NOT_VERIFIED;
  } else {
    source.coverageStatus = 'VERIFIED';
    source.reason = 'ALL_WORLD_COVERAGE_LABELED_WITH_EVIDENCE';
  }
  await save(input.root, store);
  return source;
}
