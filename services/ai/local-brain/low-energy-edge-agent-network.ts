/**
 * 62L-CE Low-Energy Edge Agent Network — low-energy profiles for laptops,
 * mobile, edge nodes. Energy savings never override security/correctness.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CD_MESH_WRITE_DENIED,
  CE_LOCKS,
  ENERGY_LOSES_TO_SECURITY,
  HONESTY_BANNER,
  type CeActor,
} from './knowledge-excavation-memory-lake-types';

export type EdgeProfileKind = 'laptop' | 'mobile' | 'edge_node' | 'sealed_edge';

export type EdgeEnergyProfile = {
  id: string;
  kind: EdgeProfileKind;
  energyScore: number; // lower = greener
  securityScore: number;
  correctnessScore: number;
  sealedPolicyOk: boolean;
  status: 'available' | 'unavailable' | 'denied';
  reason: string;
  createdAt: string;
};

export type EdgeRouteDecision = {
  id: string;
  selectedProfileId: string | null;
  rejectedLowerEnergyUnsafeId: string | null;
  status: 'selected' | 'denied' | 'unavailable';
  reason: string;
  energyOverrideSecurity: false;
  createdAt: string;
};

export type CdMeshWriteAttempt = {
  id: string;
  denied: true;
  reason: string;
  at: string;
};

type Store = {
  profiles: EdgeEnergyProfile[];
  decisions: EdgeRouteDecision[];
  cdMeshWrites: CdMeshWriteAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'low-energy-edge-agent-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    profiles: [],
    decisions: [],
    cdMeshWrites: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function edgeEnergyHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CE_LOCKS.L4_AUTONOMY_ENABLED,
    energyOverridesSecurity: CE_LOCKS.ENERGY_OVERRIDES_SECURITY,
    energyOverridesCorrectness: CE_LOCKS.ENERGY_OVERRIDES_CORRECTNESS,
    cdMeshWriteDenyByDefault: CE_LOCKS.CD_MESH_WRITE_DENY_BY_DEFAULT,
  };
}

export async function registerEdgeEnergyProfile(input: {
  kind: EdgeProfileKind;
  energyScore: number;
  securityScore: number;
  correctnessScore: number;
  sealedPolicyOk: boolean;
  root: string;
  actor: CeActor;
}): Promise<EdgeEnergyProfile> {
  const store = await load(input.root);
  const profile: EdgeEnergyProfile = {
    id: id('edge'),
    kind: input.kind,
    energyScore: input.energyScore,
    securityScore: input.securityScore,
    correctnessScore: input.correctnessScore,
    sealedPolicyOk: input.sealedPolicyOk === true,
    status: 'available',
    reason: 'EDGE_PROFILE_REGISTERED',
    createdAt: new Date().toISOString(),
  };
  store.profiles.push(profile);
  await save(input.root, store);
  return profile;
}

export async function selectEdgeRoute(input: {
  profileIds: string[];
  requireSealed?: boolean;
  preferLowestEnergyRegardlessOfSafety?: boolean;
  root: string;
  actor: CeActor;
}): Promise<EdgeRouteDecision> {
  const store = await load(input.root);
  const profiles = store.profiles.filter((p) => input.profileIds.includes(p.id));
  if (profiles.length === 0) {
    const empty: EdgeRouteDecision = {
      id: id('erd'),
      selectedProfileId: null,
      rejectedLowerEnergyUnsafeId: null,
      status: 'unavailable',
      reason: 'NO_EDGE_PROFILES',
      energyOverrideSecurity: false,
      createdAt: new Date().toISOString(),
    };
    store.decisions.push(empty);
    await save(input.root, store);
    return empty;
  }

  const requireSealed = input.requireSealed === true;
  const safe = profiles.filter(
    (p) =>
      p.securityScore >= 0.7 &&
      p.correctnessScore >= 0.7 &&
      (!requireSealed || p.sealedPolicyOk),
  );

  // Sort by energy ascending (lower energy preferred among safe)
  const byEnergy = [...profiles].sort((a, b) => a.energyScore - b.energyScore);
  const lowestEnergy = byEnergy[0];
  const lowestIsUnsafe =
    lowestEnergy.securityScore < 0.7 ||
    lowestEnergy.correctnessScore < 0.7 ||
    (requireSealed && !lowestEnergy.sealedPolicyOk);

  if (input.preferLowestEnergyRegardlessOfSafety && lowestIsUnsafe) {
    // Policy: energy loses — pick safest instead
    const safest = [...safe].sort(
      (a, b) =>
        b.securityScore + b.correctnessScore - (a.securityScore + a.correctnessScore),
    )[0];
    const decision: EdgeRouteDecision = {
      id: id('erd'),
      selectedProfileId: safest?.id ?? null,
      rejectedLowerEnergyUnsafeId: lowestEnergy.id,
      status: safest ? 'selected' : 'denied',
      reason: ENERGY_LOSES_TO_SECURITY,
      energyOverrideSecurity: false,
      createdAt: new Date().toISOString(),
    };
    store.decisions.push(decision);
    await save(input.root, store);
    return decision;
  }

  if (safe.length === 0) {
    const denied: EdgeRouteDecision = {
      id: id('erd'),
      selectedProfileId: null,
      rejectedLowerEnergyUnsafeId: lowestIsUnsafe ? lowestEnergy.id : null,
      status: 'denied',
      reason: ENERGY_LOSES_TO_SECURITY,
      energyOverrideSecurity: false,
      createdAt: new Date().toISOString(),
    };
    store.decisions.push(denied);
    await save(input.root, store);
    return denied;
  }

  const chosen = [...safe].sort((a, b) => a.energyScore - b.energyScore)[0];
  const decision: EdgeRouteDecision = {
    id: id('erd'),
    selectedProfileId: chosen.id,
    rejectedLowerEnergyUnsafeId:
      lowestIsUnsafe && lowestEnergy.id !== chosen.id ? lowestEnergy.id : null,
    status: 'selected',
    reason: lowestIsUnsafe ? ENERGY_LOSES_TO_SECURITY : 'SAFE_LOW_ENERGY_SELECTED',
    energyOverrideSecurity: false,
    createdAt: new Date().toISOString(),
  };
  store.decisions.push(decision);
  await save(input.root, store);
  return decision;
}

export async function attemptCdMeshDatabaseWrite(input: {
  root: string;
  actor: CeActor;
}): Promise<{ denied: true; reason: string; applied: false }> {
  const store = await load(input.root);
  store.cdMeshWrites.push({
    id: id('cdw'),
    denied: true,
    reason: CD_MESH_WRITE_DENIED,
    at: new Date().toISOString(),
  });
  await save(input.root, store);
  return { denied: true, reason: CD_MESH_WRITE_DENIED, applied: false };
}
