/**
 * 62L-DF Ethical Security Discovery Lab —
 * Defensive leakage detection; lawful “hidden jewel” discovery;
 * authorized-only ethical security testing. Never offensive against unauthorized systems.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DF_LOCKS,
  HONESTY_BANNER,
  MAX_SECURITY_PROBES,
  OFFENSIVE_ETHICAL_HACK_DENIED,
  OFFENSIVE_HARVEST_DENIED,
  UNAUTHORIZED_HISTORICAL_MINING_DENIED,
  type DfActor,
  type SecurityProbeMode,
} from './human-centered-superbrain-ux-types';

export type SecurityProbe = {
  id: string;
  labId: string;
  mode: SecurityProbeMode;
  targetScope: 'xiv_owned' | 'explicitly_authorized' | 'unauthorized';
  status: 'ALLOWED' | 'DENIED';
  reason: string;
  defensiveOnly: true;
  at: string;
};

export type LeakSentinelAction = {
  id: string;
  labId: string;
  requested: 'defensive_scan' | 'offensive_harvest';
  status: 'ALLOWED' | 'DENIED';
  reason: string;
  at: string;
};

export type EthicalSecurityDiscoveryLab = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

type Store = {
  labs: EthicalSecurityDiscoveryLab[];
  probes: SecurityProbe[];
  leakActions: LeakSentinelAction[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'ethical-security-discovery-lab.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { labs: [], probes: [], leakActions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ethicalSecurityDiscoveryLabHonesty() {
  return {
    banner: HONESTY_BANNER,
    offensiveUnauthorizedEthicalHack: DF_LOCKS.OFFENSIVE_UNAUTHORIZED_ETHICAL_HACK,
    ethicalSecurityDefensiveAuthorizedOnly:
      DF_LOCKS.ETHICAL_SECURITY_DEFENSIVE_AUTHORIZED_ONLY,
    leakSentinelOffensiveHarvest: DF_LOCKS.LEAK_SENTINEL_OFFENSIVE_HARVEST,
    leakSentinelDefensiveOnly: DF_LOCKS.LEAK_SENTINEL_DEFENSIVE_ONLY,
    unauthorizedHiddenJewelDiscovery: DF_LOCKS.UNAUTHORIZED_HIDDEN_JEWEL_DISCOVERY,
  };
}

export async function bootstrapEthicalSecurityDiscoveryLab(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DfActor;
}): Promise<EthicalSecurityDiscoveryLab> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.labs.find(
    (l) =>
      l.orgId === input.orgId &&
      l.tenantId === input.tenantId &&
      l.universeId === input.universeId,
  );
  if (existing) return existing;
  const lab: EthicalSecurityDiscoveryLab = {
    id: id('dfes'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.labs.push(lab);
  await save(input.root, store);
  return lab;
}

export async function runEthicalSecurityProbe(input: {
  labId: string;
  mode: SecurityProbeMode;
  targetScope: 'xiv_owned' | 'explicitly_authorized' | 'unauthorized';
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; probe?: SecurityProbe; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const lab = store.labs.find((l) => l.id === input.labId);
  if (!lab) return { accepted: false, reason: 'ETHICAL_SECURITY_LAB_NOT_FOUND', at: now };
  if (store.probes.length >= MAX_SECURITY_PROBES) {
    return { accepted: false, reason: 'MAX_SECURITY_PROBES_BOUNDED', at: now };
  }

  const offensive =
    input.mode === 'offensive_unauthorized' || input.targetScope === 'unauthorized';
  const unauthorizedJewel = input.mode === 'hidden_jewel_unauthorized';

  if (offensive || DF_LOCKS.OFFENSIVE_UNAUTHORIZED_ETHICAL_HACK) {
    const probe: SecurityProbe = {
      id: id('dfsp'),
      labId: lab.id,
      mode: input.mode,
      targetScope: input.targetScope,
      status: 'DENIED',
      reason: OFFENSIVE_ETHICAL_HACK_DENIED,
      defensiveOnly: true,
      at: now,
    };
    store.probes.push(probe);
    await save(input.root, store);
    return { accepted: false, reason: probe.reason, probe, at: now };
  }

  if (unauthorizedJewel) {
    const probe: SecurityProbe = {
      id: id('dfsp'),
      labId: lab.id,
      mode: input.mode,
      targetScope: input.targetScope,
      status: 'DENIED',
      reason: UNAUTHORIZED_HISTORICAL_MINING_DENIED,
      defensiveOnly: true,
      at: now,
    };
    store.probes.push(probe);
    await save(input.root, store);
    return { accepted: false, reason: probe.reason, probe, at: now };
  }

  if (
    input.mode !== 'defensive_authorized' &&
    input.mode !== 'hidden_jewel_authorized'
  ) {
    const probe: SecurityProbe = {
      id: id('dfsp'),
      labId: lab.id,
      mode: input.mode,
      targetScope: input.targetScope,
      status: 'DENIED',
      reason: OFFENSIVE_ETHICAL_HACK_DENIED,
      defensiveOnly: true,
      at: now,
    };
    store.probes.push(probe);
    await save(input.root, store);
    return { accepted: false, reason: probe.reason, probe, at: now };
  }

  if (
    input.targetScope !== 'xiv_owned' &&
    input.targetScope !== 'explicitly_authorized'
  ) {
    const probe: SecurityProbe = {
      id: id('dfsp'),
      labId: lab.id,
      mode: input.mode,
      targetScope: input.targetScope,
      status: 'DENIED',
      reason: OFFENSIVE_ETHICAL_HACK_DENIED,
      defensiveOnly: true,
      at: now,
    };
    store.probes.push(probe);
    await save(input.root, store);
    return { accepted: false, reason: probe.reason, probe, at: now };
  }

  const probe: SecurityProbe = {
    id: id('dfsp'),
    labId: lab.id,
    mode: input.mode,
    targetScope: input.targetScope,
    status: 'ALLOWED',
    reason:
      input.mode === 'hidden_jewel_authorized'
        ? 'AUTHORIZED_HIDDEN_JEWEL_DISCOVERY_DEFENSIVE'
        : 'DEFENSIVE_AUTHORIZED_ETHICAL_SECURITY_PROBE',
    defensiveOnly: true,
    at: now,
  };
  store.probes.push(probe);
  await save(input.root, store);
  return { accepted: true, reason: probe.reason, probe, at: now };
}

export async function invokeLeakSentinel(input: {
  labId: string;
  requested: 'defensive_scan' | 'offensive_harvest';
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; action?: LeakSentinelAction; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const lab = store.labs.find((l) => l.id === input.labId);
  if (!lab) return { accepted: false, reason: 'ETHICAL_SECURITY_LAB_NOT_FOUND', at: now };

  if (input.requested === 'offensive_harvest' || DF_LOCKS.LEAK_SENTINEL_OFFENSIVE_HARVEST) {
    const action: LeakSentinelAction = {
      id: id('dfls'),
      labId: lab.id,
      requested: input.requested,
      status: 'DENIED',
      reason: OFFENSIVE_HARVEST_DENIED,
      at: now,
    };
    store.leakActions.push(action);
    await save(input.root, store);
    return { accepted: false, reason: action.reason, action, at: now };
  }

  const action: LeakSentinelAction = {
    id: id('dfls'),
    labId: lab.id,
    requested: 'defensive_scan',
    status: 'ALLOWED',
    reason: 'LEAK_SENTINEL_DEFENSIVE_SCAN_ONLY',
    at: now,
  };
  store.leakActions.push(action);
  await save(input.root, store);
  return { accepted: true, reason: action.reason, action, at: now };
}
