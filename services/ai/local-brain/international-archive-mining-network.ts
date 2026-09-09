/**
 * 62L-CL International Archive Mining Network — multilingual international
 * archive intake by region/language. Authorized sources only; provenance required.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CL_LOCKS,
  HONESTY_BANNER,
  UNAUTHORIZED_ARCHIVE_INTAKE_DENIED,
  type ClActor,
} from './global-knowledge-server-constellation-types';

export type ArchiveSource = {
  id: string;
  regionCode: string;
  language: string;
  label: string;
  authorized: boolean;
  provenanceRef: string | null;
  status: 'available' | 'denied' | 'unavailable';
  reason: string;
  createdAt: string;
};

export type ArchiveIntake = {
  id: string;
  sourceId: string;
  regionCode: string;
  language: string;
  title: string;
  authorized: boolean;
  provenancePresent: boolean;
  status: 'accepted' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  sources: ArchiveSource[];
  intakes: ArchiveIntake[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'international-archive-mining-network.json');
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

export function archiveMiningHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CL_LOCKS.L4_AUTONOMY_ENABLED,
    requiresAuthorization: CL_LOCKS.ARCHIVE_REQUIRES_AUTHORIZATION,
    requiresProvenance: CL_LOCKS.ARCHIVE_REQUIRES_PROVENANCE,
    unauthorizedIntakeAllowed: CL_LOCKS.UNAUTHORIZED_ARCHIVE_INTAKE,
  };
}

export async function enrollArchiveSource(input: {
  regionCode: string;
  language: string;
  label: string;
  authorized: boolean;
  provenanceRef?: string | null;
  root: string;
  actor: ClActor;
}): Promise<ArchiveSource> {
  const store = await load(input.root);
  const ok =
    input.authorized === true &&
    typeof input.provenanceRef === 'string' &&
    input.provenanceRef.trim().length > 0;
  const source: ArchiveSource = {
    id: id('ias'),
    regionCode: input.regionCode,
    language: input.language,
    label: input.label,
    authorized: input.authorized === true,
    provenanceRef: input.provenanceRef?.trim() || null,
    status: ok ? 'available' : 'denied',
    reason: ok
      ? 'ARCHIVE_SOURCE_AUTHORIZED_WITH_PROVENANCE'
      : UNAUTHORIZED_ARCHIVE_INTAKE_DENIED,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.sources.push(source);
  await save(input.root, store);
  return source;
}

export async function attemptArchiveIntake(input: {
  sourceId?: string;
  regionCode: string;
  language: string;
  title: string;
  authorized?: boolean;
  provenanceRef?: string | null;
  root: string;
  actor: ClActor;
}): Promise<ArchiveIntake> {
  const store = await load(input.root);
  const source = input.sourceId
    ? store.sources.find((s) => s.id === input.sourceId)
    : undefined;
  void input.actor;

  const authorized =
    source?.authorized === true ||
    (input.authorized === true &&
      typeof input.provenanceRef === 'string' &&
      input.provenanceRef.trim().length > 0);
  const provenancePresent = Boolean(
    (source?.provenanceRef && source.provenanceRef.length > 0) ||
      (input.provenanceRef && input.provenanceRef.trim().length > 0),
  );

  if (!authorized || !provenancePresent) {
    const denied: ArchiveIntake = {
      id: id('iai'),
      sourceId: source?.id ?? input.sourceId ?? 'none',
      regionCode: input.regionCode,
      language: input.language,
      title: input.title,
      authorized: false,
      provenancePresent,
      status: 'denied',
      reason: UNAUTHORIZED_ARCHIVE_INTAKE_DENIED,
      at: new Date().toISOString(),
    };
    store.intakes.push(denied);
    await save(input.root, store);
    return denied;
  }

  const accepted: ArchiveIntake = {
    id: id('iai'),
    sourceId: source?.id ?? 'ad-hoc-authorized',
    regionCode: input.regionCode,
    language: input.language,
    title: input.title,
    authorized: true,
    provenancePresent: true,
    status: 'accepted',
    reason: 'ARCHIVE_INTAKE_ACCEPTED_AUTHORIZED_PROVENANCED',
    at: new Date().toISOString(),
  };
  store.intakes.push(accepted);
  await save(input.root, store);
  return accepted;
}
