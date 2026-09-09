/**
 * 62L-DT Module E — Launch Mission Control.
 * Countdown evidence / pilot ops ≠ public launch / auto-ship.
 * RUNNING_VERIFIED needs heartbeat/runtime evidence.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  COUNTDOWN_NEQ_PUBLIC_LAUNCH,
  HEARTBEAT_REQUIRED_FOR_RUNNING,
  MAX_LAUNCH_MISSIONS,
  PILOT_NEQ_AUTO_SHIP,
  type DtActor,
  type DtEvidenceState,
} from './growth-operating-system-types';

export type LaunchMission = {
  id: string;
  name: string;
  countdownDays: number;
  publicLaunchAuthorized: false;
  autoShipped: false;
  status: 'countdown_candidate' | 'denied';
  reason: string;
  createdAt: string;
};

export type PilotOpsAction = {
  id: string;
  missionId: string;
  attemptAutoShip: boolean;
  status: 'pilot_only' | 'denied';
  autoShipped: false;
  publicLaunch: false;
  reason: string;
  at: string;
};

export type RuntimeEvidenceProbe = {
  id: string;
  missionId: string;
  heartbeatFresh: boolean;
  runtimeEvidencePresent: boolean;
  state: DtEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  missions: LaunchMission[];
  pilots: PilotOpsAction[];
  runtimeProbes: RuntimeEvidenceProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'launch-mission-control.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    missions: [],
    pilots: [],
    runtimeProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function launchMissionControlHonesty() {
  return {
    countdownEqPublicLaunch: false,
    pilotOpsAutoShip: false,
    publicLaunchAuthorized: false,
    runningVerifiedWithoutHeartbeat: false,
  };
}

export async function createLaunchCountdown(input: {
  name: string;
  countdownDays: number;
  claimPublicLaunch?: boolean;
  root: string;
  actor: DtActor;
}): Promise<LaunchMission> {
  const store = await load(input.root);
  void input.actor;
  if (store.missions.length >= MAX_LAUNCH_MISSIONS) {
    throw new Error('MAX_LAUNCH_MISSIONS_REACHED');
  }
  const mission: LaunchMission = {
    id: id('dtlaunch'),
    name: input.name.trim(),
    countdownDays: Math.max(0, input.countdownDays),
    publicLaunchAuthorized: false,
    autoShipped: false,
    status: input.claimPublicLaunch ? 'denied' : 'countdown_candidate',
    reason: COUNTDOWN_NEQ_PUBLIC_LAUNCH,
    createdAt: new Date().toISOString(),
  };
  store.missions.push(mission);
  await save(input.root, store);
  return mission;
}

export async function runPilotOps(input: {
  missionId: string;
  attemptAutoShip?: boolean;
  root: string;
  actor: DtActor;
}): Promise<PilotOpsAction> {
  const store = await load(input.root);
  void input.actor;
  const action: PilotOpsAction = {
    id: id('dtpilot'),
    missionId: input.missionId,
    attemptAutoShip: input.attemptAutoShip === true,
    status: input.attemptAutoShip ? 'denied' : 'pilot_only',
    autoShipped: false,
    publicLaunch: false,
    reason: input.attemptAutoShip ? PILOT_NEQ_AUTO_SHIP : PILOT_NEQ_AUTO_SHIP,
    at: new Date().toISOString(),
  };
  store.pilots.push(action);
  await save(input.root, store);
  return action;
}

export async function probeRunningVerified(input: {
  missionId: string;
  heartbeatFresh: boolean;
  runtimeEvidencePresent: boolean;
  root: string;
  actor: DtActor;
}): Promise<RuntimeEvidenceProbe> {
  const store = await load(input.root);
  void input.actor;
  const ok = input.heartbeatFresh && input.runtimeEvidencePresent;
  const probe: RuntimeEvidenceProbe = {
    id: id('dtrun'),
    missionId: input.missionId,
    heartbeatFresh: input.heartbeatFresh,
    runtimeEvidencePresent: input.runtimeEvidencePresent,
    state: ok ? 'RUNNING_VERIFIED' : 'DENIED',
    reason: ok ? 'RUNNING_VERIFIED_WITH_HEARTBEAT_EVIDENCE' : HEARTBEAT_REQUIRED_FOR_RUNNING,
    at: new Date().toISOString(),
  };
  store.runtimeProbes.push(probe);
  await save(input.root, store);
  return probe;
}
