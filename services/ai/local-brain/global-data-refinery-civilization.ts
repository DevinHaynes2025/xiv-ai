/**
 * 62L-CF Global Data Refinery Civilization — authorized raw → normalize → quality →
 * dedupe → classify → compress packs → council evaluate → distribute to approved only.
 */

import { createHash } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CF_LOCKS,
  HONESTY_BANNER,
  REFINERY_STAGES,
  UNAUTHORIZED_RAW_INTAKE_DENIED,
  UNAPPROVED_DISTRIBUTION_DENIED,
  ARBITRARY_SCRAPE_DENIED,
  type CfActor,
  type RefineryStage,
} from './data-refinery-compression-replication-types';

export type RawAuthorizationClass =
  | 'authorized'
  | 'public'
  | 'licensed'
  | 'customer_owned'
  | 'unauthorized'
  | 'arbitrary_scrape'
  | 'leaked_db'
  | 'stolen_credentials';

export type KnowledgePack = {
  id: string;
  sourceId: string;
  stagesCompleted: RefineryStage[];
  checksumSha256: string;
  classification: string;
  contentDigest: string;
  approvedUniverses: string[];
  approvedDevices: string[];
  rejected: boolean;
  reason: string;
  productionAuthorized: false;
  createdAt: string;
};

export type DistributionAttempt = {
  id: string;
  packId: string;
  targetUniverseId?: string;
  targetDeviceId?: string;
  accepted: boolean;
  reason: string;
  at: string;
};

type Store = {
  packs: KnowledgePack[];
  distributions: DistributionAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-data-refinery-civilization.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { packs: [], distributions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const FORBIDDEN: RawAuthorizationClass[] = [
  'unauthorized',
  'arbitrary_scrape',
  'leaked_db',
  'stolen_credentials',
];

export function refineryHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CF_LOCKS.L4_AUTONOMY_ENABLED,
    authorizedSourcesOnly: CF_LOCKS.AUTHORIZED_SOURCES_ONLY,
    arbitraryScrape: CF_LOCKS.ARBITRARY_DB_WEB_SCRAPE,
    unapprovedUniverseDistribution: CF_LOCKS.UNAPPROVED_UNIVERSE_DISTRIBUTION,
    unapprovedDeviceDistribution: CF_LOCKS.UNAPPROVED_DEVICE_DISTRIBUTION,
    productionAuthorization: CF_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export function isRawIntakeAllowed(authorization: RawAuthorizationClass): boolean {
  return !FORBIDDEN.includes(authorization);
}

export async function intakeRawAndRefine(input: {
  sourceId: string;
  authorization: RawAuthorizationClass;
  payload: string;
  classification?: string;
  approvedUniverses?: string[];
  approvedDevices?: string[];
  root: string;
  actor: CfActor;
}): Promise<{
  accepted: boolean;
  pack: KnowledgePack | null;
  reason: string;
  stagesCompleted: RefineryStage[];
}> {
  const store = await load(input.root);

  if (!isRawIntakeAllowed(input.authorization)) {
    const reason =
      input.authorization === 'arbitrary_scrape'
        ? ARBITRARY_SCRAPE_DENIED
        : UNAUTHORIZED_RAW_INTAKE_DENIED;
    const denied: KnowledgePack = {
      id: id('pack'),
      sourceId: input.sourceId,
      stagesCompleted: ['authorize_raw'],
      checksumSha256: '',
      classification: 'denied',
      contentDigest: '',
      approvedUniverses: [],
      approvedDevices: [],
      rejected: true,
      reason,
      productionAuthorized: false,
      createdAt: new Date().toISOString(),
    };
    store.packs.push(denied);
    await save(input.root, store);
    return {
      accepted: false,
      pack: denied,
      reason,
      stagesCompleted: ['authorize_raw'],
    };
  }

  const stages: RefineryStage[] = [...REFINERY_STAGES];
  const digest = createHash('sha256').update(input.payload).digest('hex');
  const normalized = input.payload.trim().toLowerCase();
  const qualityOk = normalized.length > 0;
  const pack: KnowledgePack = {
    id: id('pack'),
    sourceId: input.sourceId,
    stagesCompleted: qualityOk ? stages : stages.slice(0, 3),
    checksumSha256: digest,
    classification: input.classification ?? 'general_knowledge',
    contentDigest: digest.slice(0, 16),
    approvedUniverses: input.approvedUniverses ?? [],
    approvedDevices: input.approvedDevices ?? [],
    rejected: !qualityOk,
    reason: qualityOk ? 'REFINED_AUTHORIZED_PACK_CANDIDATE' : 'QUALITY_CHECK_FAILED',
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.packs.push(pack);
  await save(input.root, store);
  return {
    accepted: qualityOk,
    pack,
    reason: pack.reason,
    stagesCompleted: pack.stagesCompleted,
  };
}

export async function distributePack(input: {
  packId: string;
  targetUniverseId?: string;
  targetDeviceId?: string;
  root: string;
  actor: CfActor;
}): Promise<DistributionAttempt> {
  const store = await load(input.root);
  const pack = store.packs.find((p) => p.id === input.packId);
  const attempt: DistributionAttempt = {
    id: id('dist'),
    packId: input.packId,
    targetUniverseId: input.targetUniverseId,
    targetDeviceId: input.targetDeviceId,
    accepted: false,
    reason: UNAPPROVED_DISTRIBUTION_DENIED,
    at: new Date().toISOString(),
  };

  if (!pack || pack.rejected) {
    attempt.reason = pack?.reason ?? 'PACK_NOT_FOUND_OR_REJECTED';
    store.distributions.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const universeOk =
    !!input.targetUniverseId &&
    pack.approvedUniverses.includes(input.targetUniverseId);
  const deviceOk =
    !!input.targetDeviceId && pack.approvedDevices.includes(input.targetDeviceId);

  if (
    (input.targetUniverseId && !universeOk) ||
    (input.targetDeviceId && !deviceOk) ||
    (!input.targetUniverseId && !input.targetDeviceId)
  ) {
    attempt.accepted = false;
    attempt.reason = UNAPPROVED_DISTRIBUTION_DENIED;
  } else {
    attempt.accepted = true;
    attempt.reason = 'DISTRIBUTED_TO_APPROVED_TARGET';
  }

  store.distributions.push(attempt);
  await save(input.root, store);
  return attempt;
}
