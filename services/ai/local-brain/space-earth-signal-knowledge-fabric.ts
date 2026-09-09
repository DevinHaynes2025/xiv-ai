/**
 * 62L-CR D — Space/Earth Signal Knowledge Fabric
 * NASA/GPS/satellite/Starlink and Earth-science knowledge fabrics.
 * Knowledge only — no physical vehicle/ATC/spacecraft control.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CR_LOCKS,
  HONESTY_BANNER,
  SPACE_PHYSICAL_CONTROL_DENIED,
  type CrActor,
} from './hybrid-supercompute-universe-os-types';

export type SpacePackKind =
  | 'nasa'
  | 'gps'
  | 'satellite'
  | 'starlink'
  | 'earth_science';

export type SpaceKnowledgePack = {
  id: string;
  kind: SpacePackKind;
  label: string;
  authorized: boolean;
  knowledgeOnly: true;
  enablesPhysicalControl: false;
  status: 'registered' | 'denied';
  reason: string;
  createdAt: string;
};

export type SpaceControlAttempt = {
  id: string;
  target: 'vehicle' | 'atc' | 'spacecraft' | 'physical_system';
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  packs: SpaceKnowledgePack[];
  controlAttempts: SpaceControlAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'space-earth-signal-knowledge-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { packs: [], controlAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function spaceFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    knowledgeOnly: CR_LOCKS.SPACE_FABRIC_KNOWLEDGE_ONLY,
    physicalControl: CR_LOCKS.SPACE_PHYSICAL_VEHICLE_ATC_CONTROL,
  };
}

export async function registerSpaceKnowledgePack(input: {
  kind: SpacePackKind;
  label: string;
  authorized?: boolean;
  root: string;
  actor: CrActor;
}): Promise<SpaceKnowledgePack> {
  const store = await load(input.root);
  const authorized = input.authorized === true;
  const pack: SpaceKnowledgePack = {
    id: id('spacepack'),
    kind: input.kind,
    label: input.label,
    authorized,
    knowledgeOnly: true,
    enablesPhysicalControl: false,
    status: authorized ? 'registered' : 'denied',
    reason: authorized
      ? 'SPACE_EARTH_KNOWLEDGE_PACK_REGISTERED'
      : 'UNAUTHORIZED_SPACE_PACK_DENIED',
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.packs.push(pack);
  await save(input.root, store);
  return pack;
}

export async function attemptSpacePhysicalControl(input: {
  target: SpaceControlAttempt['target'];
  root: string;
  actor: CrActor;
}): Promise<SpaceControlAttempt> {
  const store = await load(input.root);
  const attempt: SpaceControlAttempt = {
    id: id('spctrl'),
    target: input.target,
    status: 'denied',
    reason: SPACE_PHYSICAL_CONTROL_DENIED,
    at: new Date().toISOString(),
  };
  void input.actor;
  store.controlAttempts.push(attempt);
  await save(input.root, store);
  return attempt;
}
