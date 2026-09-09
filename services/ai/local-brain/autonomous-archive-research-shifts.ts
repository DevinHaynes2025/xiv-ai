/**
 * 62L-CF Autonomous Archive Research Shifts — bounded shifts under authorization.
 * Rare-knowledge discovery ≠ permission to access unauthorized archives.
 * No soul-resurrection claims.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ARCHIVE_SHIFT_BOUNDS,
  CF_LOCKS,
  HONESTY_BANNER,
  SOUL_CLAIM_REJECTED,
  type CfActor,
} from './data-refinery-compression-replication-types';

export type ArchiveAuthorization =
  | 'authorized'
  | 'licensed'
  | 'public_domain'
  | 'unauthorized'
  | 'unknown_consent';

export type ArchiveShift = {
  id: string;
  archiveId: string;
  authorization: ArchiveAuthorization;
  boundMaxHops: number;
  hopsUsed: number;
  accepted: boolean;
  rareKnowledgeClaim: boolean;
  soulResurrectionClaim: boolean;
  reason: string;
  evidenceRefs: string[];
  provenanceRetained: true;
  productionAuthorized: false;
  createdAt: string;
};

type Store = { shifts: ArchiveShift[] };

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-archive-research-shifts.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { shifts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const ALLOWED: ArchiveAuthorization[] = ['authorized', 'licensed', 'public_domain'];

export function archiveShiftHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CF_LOCKS.L4_AUTONOMY_ENABLED,
    archiveShiftsBounded: CF_LOCKS.ARCHIVE_SHIFTS_BOUNDED,
    rareKnowledgeBypassesAuthorization: CF_LOCKS.RARE_KNOWLEDGE_BYPASSES_AUTHORIZATION,
    soulResurrectionClaims: CF_LOCKS.SOUL_RESURRECTION_CLAIMS,
  };
}

export async function runArchiveResearchShift(input: {
  archiveId: string;
  authorization: ArchiveAuthorization;
  boundMaxHops?: number;
  hopsRequested?: number;
  rareKnowledgeClaim?: boolean;
  soulResurrectionClaim?: boolean;
  evidenceRefs?: string[];
  root: string;
  actor: CfActor;
}): Promise<ArchiveShift> {
  const store = await load(input.root);
  const bound = Math.max(1, Math.min(input.boundMaxHops ?? 3, 8));
  const hopsRequested = Math.max(0, input.hopsRequested ?? 1);
  const withinBounds = hopsRequested <= bound;
  const authOk = ALLOWED.includes(input.authorization);
  const rare = input.rareKnowledgeClaim === true;
  const soul = input.soulResurrectionClaim === true;

  let accepted = false;
  let reason: string = ARCHIVE_SHIFT_BOUNDS;

  if (soul) {
    accepted = false;
    reason = SOUL_CLAIM_REJECTED;
  } else if (!authOk) {
    accepted = false;
    // rare knowledge does not bypass authorization
    reason = rare
      ? 'RARE_KNOWLEDGE_DOES_NOT_BYPASS_ARCHIVE_AUTHORIZATION'
      : ARCHIVE_SHIFT_BOUNDS;
  } else if (!withinBounds) {
    accepted = false;
    reason = ARCHIVE_SHIFT_BOUNDS;
  } else {
    accepted = true;
    reason = 'BOUNDED_AUTHORIZED_ARCHIVE_SHIFT';
  }

  const shift: ArchiveShift = {
    id: id('ashift'),
    archiveId: input.archiveId,
    authorization: input.authorization,
    boundMaxHops: bound,
    hopsUsed: accepted ? hopsRequested : 0,
    accepted,
    rareKnowledgeClaim: rare,
    soulResurrectionClaim: soul,
    reason,
    evidenceRefs: input.evidenceRefs ?? [],
    provenanceRetained: true,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.shifts.push(shift);
  await save(input.root, store);
  return shift;
}
