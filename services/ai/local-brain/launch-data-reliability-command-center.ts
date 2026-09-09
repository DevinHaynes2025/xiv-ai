/**
 * 62L-EE Module H — Launch Data Reliability Command Center.
 * Security-boundary testing (defensive only); launch data reliability;
 * soft-wire ED/EB; stealth denied; twin ≠ founder; autonomy boundary.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AUTONOMY_BOUNDARY_DENIED,
  LAUNCH_RELIABILITY_EVIDENCE,
  MAX_LAUNCH_EVENTS,
  SECURITY_DEFENSIVE_ONLY,
  STEALTH_INSTALL_DENIED,
  TWIN_NEQ_FOUNDER,
  predecessorMap,
  type EeActor,
  type EeEvidenceState,
} from './data-nervous-system-types';

export type SecurityBoundaryTest = {
  id: string;
  mode: 'defensive' | 'offensive';
  status: 'ok' | 'denied';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

export type LaunchReliabilityProbe = {
  id: string;
  datasetId: string;
  evidencePresent: boolean;
  status: 'ok' | 'denied';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

export type StealthInstallDenial = {
  id: string;
  attemptKind: string;
  status: 'denied';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

export type TwinAuthorityProbe = {
  id: string;
  actorKind: EeActor['kind'];
  claimFounderAuthority: boolean;
  status: 'ok' | 'denied';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

export type AutonomyBoundaryProbe = {
  id: string;
  action:
    | 'book_freight'
    | 'issue_purchase_order'
    | 'spend_money'
    | 'sign_contract'
    | 'change_production_system';
  status: 'denied';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  security: SecurityBoundaryTest[];
  reliability: LaunchReliabilityProbe[];
  stealth: StealthInstallDenial[];
  twins: TwinAuthorityProbe[];
  autonomy: AutonomyBoundaryProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'launch-data-reliability-command-center.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    security: [],
    reliability: [],
    stealth: [],
    twins: [],
    autonomy: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function launchDataReliabilityCommandCenterHonesty(repoRoot?: string) {
  return {
    securityBoundaryDefensiveOnly: true,
    noOffensiveExploitTooling: true,
    launchDataReliabilityEvidence: true,
    stealthInstallDenied: true,
    digitalTwinNeqFounder: true,
    autonomyBoundaryEnforced: true,
    predecessors: predecessorMap(repoRoot),
  };
}

export async function runSecurityBoundaryTest(input: {
  mode: 'defensive' | 'offensive';
  root: string;
  actor: EeActor;
}): Promise<SecurityBoundaryTest> {
  const store = await load(input.root);
  void input.actor;
  if (store.security.length >= MAX_LAUNCH_EVENTS) {
    throw new Error('MAX_LAUNCH_EVENTS_REACHED');
  }
  const defensive = input.mode === 'defensive';
  const test: SecurityBoundaryTest = {
    id: id('eesec'),
    mode: input.mode,
    status: defensive ? 'ok' : 'denied',
    state: defensive ? 'DEFENSIVE_ONLY' : 'DENIED',
    reason: SECURITY_DEFENSIVE_ONLY,
    at: new Date().toISOString(),
  };
  store.security.push(test);
  await save(input.root, store);
  return test;
}

export async function probeLaunchDataReliability(input: {
  datasetId: string;
  evidencePresent: boolean;
  root: string;
  actor: EeActor;
}): Promise<LaunchReliabilityProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.reliability.length >= MAX_LAUNCH_EVENTS) {
    throw new Error('MAX_LAUNCH_EVENTS_REACHED');
  }
  const ok = input.evidencePresent;
  const probe: LaunchReliabilityProbe = {
    id: id('eerel'),
    datasetId: input.datasetId.trim(),
    evidencePresent: ok,
    status: ok ? 'ok' : 'denied',
    state: ok ? 'PASS' : 'NOT_VERIFIED',
    reason: LAUNCH_RELIABILITY_EVIDENCE,
    at: new Date().toISOString(),
  };
  store.reliability.push(probe);
  await save(input.root, store);
  return probe;
}

export async function denyStealthInstall(input: {
  attemptKind: string;
  root: string;
  actor: EeActor;
}): Promise<StealthInstallDenial> {
  const store = await load(input.root);
  void input.actor;
  const denial: StealthInstallDenial = {
    id: id('eestealth'),
    attemptKind: input.attemptKind.trim(),
    status: 'denied',
    state: 'DENIED',
    reason: STEALTH_INSTALL_DENIED,
    at: new Date().toISOString(),
  };
  store.stealth.push(denial);
  await save(input.root, store);
  return denial;
}

export async function probeDigitalTwinAuthority(input: {
  actor: EeActor;
  claimFounderAuthority: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  const claim = input.claimFounderAuthority || input.actor.kind === 'digital_twin';
  const probe: TwinAuthorityProbe = {
    id: id('eetwinauth'),
    actorKind: input.actor.kind,
    claimFounderAuthority: claim,
    status: claim ? 'denied' : 'ok',
    state: claim ? 'DENIED' : 'PASS',
    reason: TWIN_NEQ_FOUNDER,
    at: new Date().toISOString(),
  };
  store.twins.push(probe);
  await save(input.root, store);
  return probe;
}

export async function denyAutonomousAction(input: {
  action:
    | 'book_freight'
    | 'issue_purchase_order'
    | 'spend_money'
    | 'sign_contract'
    | 'change_production_system';
  root: string;
  actor: EeActor;
}): Promise<AutonomyBoundaryProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: AutonomyBoundaryProbe = {
    id: id('eeauto'),
    action: input.action,
    status: 'denied',
    state: 'DENIED',
    reason: AUTONOMY_BOUNDARY_DENIED,
    at: new Date().toISOString(),
  };
  store.autonomy.push(probe);
  await save(input.root, store);
  return probe;
}
