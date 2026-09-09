/**
 * 62L-DS Launch Control Tower —
 * GO/NO-GO evidence; ≠ auto-ship.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DS_LOCKS,
  HONESTY_BANNER,
  LAUNCH_GO_NEQ_AUTO_SHIP,
  MAX_LAUNCH_GATES,
  type DsActor,
} from './revenue-intelligence-os-types';

export type LaunchEvidenceItem = {
  id: string;
  label: string;
  state: 'PASS' | 'FAIL' | 'WAITING_DATA' | 'NOT_TESTED';
};

export type LaunchGate = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  releaseLabel: string;
  evidence: LaunchEvidenceItem[];
  verdict: 'GO' | 'NO_GO' | 'WAITING_DATA';
  autoShip: false;
  productionAuthorized: false;
  createdAt: string;
};

export type ShipAttempt = {
  id: string;
  gateId: string;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = { gates: LaunchGate[]; ships: ShipAttempt[] };

function storePath(root: string) {
  return xivLocalPath(root, 'launch-control-tower.json');
}
async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { gates: [], ships: [] });
}
async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}
function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function launchControlTowerHonesty() {
  return {
    banner: HONESTY_BANNER,
    launchGoEqAutoShip: DS_LOCKS.LAUNCH_GO_EQ_AUTO_SHIP,
    productionAuthorization: DS_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

function computeVerdict(evidence: LaunchEvidenceItem[]): 'GO' | 'NO_GO' | 'WAITING_DATA' {
  if (evidence.some((e) => e.state === 'WAITING_DATA' || e.state === 'NOT_TESTED')) return 'WAITING_DATA';
  if (evidence.some((e) => e.state === 'FAIL')) return 'NO_GO';
  if (evidence.length > 0 && evidence.every((e) => e.state === 'PASS')) return 'GO';
  return 'WAITING_DATA';
}

export async function openLaunchGate(input: {
  releaseLabel: string;
  evidence: Array<{ label: string; state: LaunchEvidenceItem['state'] }>;
  root: string;
  actor: DsActor;
}): Promise<LaunchGate> {
  const store = await load(input.root);
  if (store.gates.length >= MAX_LAUNCH_GATES) throw new Error('MAX_LAUNCH_GATES_REACHED');
  const evidence: LaunchEvidenceItem[] = input.evidence.map((e) => ({
    id: id('lev'),
    label: e.label,
    state: e.state,
  }));
  const gate: LaunchGate = {
    id: id('lct'),
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    releaseLabel: input.releaseLabel,
    evidence,
    verdict: computeVerdict(evidence),
    autoShip: false,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.gates.push(gate);
  await save(input.root, store);
  return gate;
}

export async function attemptAutoShip(input: {
  gateId: string;
  root: string;
  actor: DsActor;
}): Promise<ShipAttempt> {
  const store = await load(input.root);
  void input.actor;
  const gate = store.gates.find((g) => g.id === input.gateId);
  const attempt: ShipAttempt = {
    id: id('ship'),
    gateId: input.gateId,
    status: 'denied',
    reason:
      gate?.verdict === 'GO'
        ? LAUNCH_GO_NEQ_AUTO_SHIP
        : `LAUNCH_${gate?.verdict ?? 'UNKNOWN'}_NEQ_AUTO_SHIP`,
    at: new Date().toISOString(),
  };
  store.ships.push(attempt);
  await save(input.root, store);
  return attempt;
}
