/**
 * 62L-CQ Space/Earth Knowledge Graph —
 * NASA/space/GPS/Starlink scientific knowledge packs (knowledge only).
 * No control of real vehicles/ATC/physical systems.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CQ_LOCKS,
  HONESTY_BANNER,
  SPACE_PHYSICAL_CONTROL_DENIED,
  type CqActor,
} from './offline-universe-quantum-genome-types';

export type SpaceEarthPackKind =
  | 'nasa_science'
  | 'space_science'
  | 'gps_science'
  | 'starlink_science'
  | 'earth_observation_science';

export type SpaceEarthKnowledgePack = {
  id: string;
  kind: SpaceEarthPackKind;
  label: string;
  authorizedScientific: boolean;
  knowledgeOnly: true;
  enablesVehicleControl: false;
  enablesAtcControl: false;
  enablesPhysicalSystemControl: false;
  status: 'registered' | 'denied';
  reason: string;
  createdAt: string;
  productionAuthorized: false;
};

export type PhysicalControlProbe = {
  id: string;
  packId: string | null;
  controlKind: 'vehicle' | 'atc' | 'physical_system';
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  packs: SpaceEarthKnowledgePack[];
  controlProbes: PhysicalControlProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'space-earth-knowledge-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    packs: [],
    controlProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function spaceEarthKnowledgeHonesty() {
  return {
    banner: HONESTY_BANNER,
    knowledgeOnly: CQ_LOCKS.SPACE_PACK_KNOWLEDGE_ONLY,
    vehicleAtcPhysicalControl: CQ_LOCKS.SPACE_PACK_VEHICLE_ATC_PHYSICAL_CONTROL,
  };
}

export async function registerSpaceEarthKnowledgePack(input: {
  kind: SpaceEarthPackKind;
  label: string;
  authorizedScientific?: boolean;
  /** Hostile probes that would try to enable control — always denied. */
  attemptEnableVehicleControl?: boolean;
  attemptEnableAtcControl?: boolean;
  attemptEnablePhysicalControl?: boolean;
  root: string;
  actor: CqActor;
}): Promise<SpaceEarthKnowledgePack> {
  const store = await load(input.root);
  const authorized = input.authorizedScientific !== false;

  if (
    input.attemptEnableVehicleControl ||
    input.attemptEnableAtcControl ||
    input.attemptEnablePhysicalControl
  ) {
    const denied: SpaceEarthKnowledgePack = {
      id: id('sekp'),
      kind: input.kind,
      label: input.label.trim() || input.kind,
      authorizedScientific: authorized,
      knowledgeOnly: true,
      enablesVehicleControl: false,
      enablesAtcControl: false,
      enablesPhysicalSystemControl: false,
      status: 'denied',
      reason: SPACE_PHYSICAL_CONTROL_DENIED,
      createdAt: new Date().toISOString(),
      productionAuthorized: false,
    };
    void input.actor;
    store.packs.push(denied);
    await save(input.root, store);
    return denied;
  }

  if (!authorized) {
    const denied: SpaceEarthKnowledgePack = {
      id: id('sekp'),
      kind: input.kind,
      label: input.label.trim() || input.kind,
      authorizedScientific: false,
      knowledgeOnly: true,
      enablesVehicleControl: false,
      enablesAtcControl: false,
      enablesPhysicalSystemControl: false,
      status: 'denied',
      reason: 'UNAUTHORIZED_SCIENTIFIC_PACK_DENIED',
      createdAt: new Date().toISOString(),
      productionAuthorized: false,
    };
    void input.actor;
    store.packs.push(denied);
    await save(input.root, store);
    return denied;
  }

  const pack: SpaceEarthKnowledgePack = {
    id: id('sekp'),
    kind: input.kind,
    label: input.label.trim() || input.kind,
    authorizedScientific: true,
    knowledgeOnly: true,
    enablesVehicleControl: false,
    enablesAtcControl: false,
    enablesPhysicalSystemControl: false,
    status: 'registered',
    reason: 'AUTHORIZED_SCIENTIFIC_KNOWLEDGE_PACK_ONLY',
    createdAt: new Date().toISOString(),
    productionAuthorized: false,
  };
  void input.actor;
  store.packs.push(pack);
  await save(input.root, store);
  return pack;
}

export async function probeSpacePhysicalControl(input: {
  packId?: string | null;
  controlKind: 'vehicle' | 'atc' | 'physical_system';
  root: string;
  actor: CqActor;
}): Promise<PhysicalControlProbe> {
  const store = await load(input.root);
  const probe: PhysicalControlProbe = {
    id: id('spc'),
    packId: input.packId ?? null,
    controlKind: input.controlKind,
    status: 'denied',
    reason: SPACE_PHYSICAL_CONTROL_DENIED,
    at: new Date().toISOString(),
  };
  void input.actor;
  store.controlProbes.push(probe);
  await save(input.root, store);
  return probe;
}
