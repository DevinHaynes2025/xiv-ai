/**
 * 62L-CQ Defensive Data Leak Sentinel —
 * Detect/stop accidental exposure in XIV-owned or explicitly authorized
 * environments; block leaked/stolen/restricted intake.
 * Never offensive harvesting.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CQ_LOCKS,
  HONESTY_BANNER,
  LEAKED_INTAKE_DENIED,
  OFFENSIVE_HARVEST_DENIED,
  type CqActor,
} from './offline-universe-quantum-genome-types';

export type IntakeSourceClass =
  | 'xiv_owned'
  | 'explicitly_authorized'
  | 'leaked'
  | 'stolen'
  | 'restricted'
  | 'unknown';

export type SentinelScanResult = {
  id: string;
  environmentScope: 'xiv_owned' | 'explicitly_authorized' | 'unauthorized';
  findings: string[];
  defensiveOnly: true;
  offensiveHarvestCapable: false;
  status: 'clean' | 'exposure_blocked' | 'denied';
  reason: string;
  at: string;
};

export type IntakeDecision = {
  id: string;
  sourceClass: IntakeSourceClass;
  status: 'accepted' | 'denied';
  reason: string;
  at: string;
};

export type OffensiveCapabilityProbe = {
  id: string;
  requested: true;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  scans: SentinelScanResult[];
  intakes: IntakeDecision[];
  offensiveProbes: OffensiveCapabilityProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'defensive-data-leak-sentinel.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    scans: [],
    intakes: [],
    offensiveProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function defensiveLeakSentinelHonesty() {
  return {
    banner: HONESTY_BANNER,
    defensiveOnly: CQ_LOCKS.DEFENSIVE_LEAK_SENTINEL_ONLY,
    offensiveHarvestAllowed: CQ_LOCKS.OFFENSIVE_HARVEST_ALLOWED,
    leakedStolenRestrictedIntakeAllowed: CQ_LOCKS.LEAKED_STOLEN_RESTRICTED_INTAKE_ALLOWED,
  };
}

export async function runDefensiveLeakScan(input: {
  environmentScope: 'xiv_owned' | 'explicitly_authorized' | 'unauthorized';
  suspectedExposurePaths?: string[];
  root: string;
  actor: CqActor;
}): Promise<SentinelScanResult> {
  const store = await load(input.root);

  if (input.environmentScope === 'unauthorized') {
    const denied: SentinelScanResult = {
      id: id('dls'),
      environmentScope: 'unauthorized',
      findings: [],
      defensiveOnly: true,
      offensiveHarvestCapable: false,
      status: 'denied',
      reason: 'SENTINEL_ONLY_ON_XIV_OWNED_OR_EXPLICITLY_AUTHORIZED_ENVIRONMENTS',
      at: new Date().toISOString(),
    };
    void input.actor;
    store.scans.push(denied);
    await save(input.root, store);
    return denied;
  }

  const findings = (input.suspectedExposurePaths ?? []).filter((p) => p.trim().length > 0);
  const result: SentinelScanResult = {
    id: id('dls'),
    environmentScope: input.environmentScope,
    findings,
    defensiveOnly: true,
    offensiveHarvestCapable: false,
    status: findings.length > 0 ? 'exposure_blocked' : 'clean',
    reason:
      findings.length > 0
        ? 'ACCIDENTAL_EXPOSURE_PATHS_BLOCKED_DEFENSIVE'
        : 'DEFENSIVE_SCAN_CLEAN',
    at: new Date().toISOString(),
  };
  void input.actor;
  store.scans.push(result);
  await save(input.root, store);
  return result;
}

export async function evaluateSourceIntake(input: {
  sourceClass: IntakeSourceClass;
  label?: string;
  root: string;
  actor: CqActor;
}): Promise<IntakeDecision> {
  const store = await load(input.root);
  const blocked =
    input.sourceClass === 'leaked' ||
    input.sourceClass === 'stolen' ||
    input.sourceClass === 'restricted' ||
    input.sourceClass === 'unknown';

  const decision: IntakeDecision = {
    id: id('intk'),
    sourceClass: input.sourceClass,
    status: blocked ? 'denied' : 'accepted',
    reason: blocked
      ? LEAKED_INTAKE_DENIED
      : 'AUTHORIZED_OR_XIV_OWNED_INTAKE_CANDIDATE',
    at: new Date().toISOString(),
  };
  void input.actor;
  void input.label;
  store.intakes.push(decision);
  await save(input.root, store);
  return decision;
}

export async function probeOffensiveHarvestCapability(input: {
  root: string;
  actor: CqActor;
}): Promise<OffensiveCapabilityProbe> {
  const store = await load(input.root);
  const probe: OffensiveCapabilityProbe = {
    id: id('offh'),
    requested: true,
    status: 'denied',
    reason: OFFENSIVE_HARVEST_DENIED,
    at: new Date().toISOString(),
  };
  void input.actor;
  store.offensiveProbes.push(probe);
  await save(input.root, store);
  return probe;
}
